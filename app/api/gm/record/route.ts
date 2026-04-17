import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface GmData { streak: number; lastDate: string; totalGms: number; score: number }

const MILESTONES: Record<number, number> = { 3: 10, 5: 20, 7: 50, 14: 100, 30: 300 }
const BASE_SCORE = 5

export async function POST(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const existing = await redis.get<GmData>(`gm:${address}`) ?? { streak: 0, lastDate: '', totalGms: 0, score: 0 }

  if (existing.lastDate === today) {
    return NextResponse.json({ streak: existing.streak, gmmedToday: true, lastGm: today, score: existing.score, earned: 0, milestone: null })
  }

  const newStreak = existing.lastDate === yesterday ? existing.streak + 1 : 1
  const milestoneBonus = MILESTONES[newStreak] ?? 0
  const earned = BASE_SCORE + milestoneBonus
  const newScore = (existing.score ?? 0) + earned
  const newTotalGms = (existing.totalGms ?? 0) + 1

  const updated: GmData = { streak: newStreak, lastDate: today, totalGms: newTotalGms, score: newScore }
  await redis.set(`gm:${address}`, updated)

  // Recent activity feed
  const activity = { address: address.slice(0, 6) + '...' + address.slice(-4), streak: newStreak, time: Date.now() }
  const feed = await redis.get<typeof activity[]>('gm:feed') ?? []
  feed.unshift(activity)
  await redis.set('gm:feed', feed.slice(0, 10))

  return NextResponse.json({
    streak: newStreak,
    gmmedToday: true,
    lastGm: today,
    score: newScore,
    earned,
    milestone: milestoneBonus > 0 ? { day: newStreak, bonus: milestoneBonus } : null,
  })
}
