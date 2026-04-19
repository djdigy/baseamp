import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { calculateGM } from '@/lib/gm'

export const dynamic = 'force-dynamic'

interface GmData {
  streak: number
  lastDate: string
  totalGms: number
  validGms: number
  score: number
  lastTxTimestamp: number
}

const SPAM_COOLDOWN_MS = 12000  // 12 seconds (~2 Base blocks)

export async function POST(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const now       = Date.now()

  const existing = await redis.get<GmData>(`gm:${address}`) ?? {
    streak: 0, lastDate: '', totalGms: 0, validGms: 0, score: 0, lastTxTimestamp: 0,
  }

  // Spam protection
  const msSinceLast = now - (existing.lastTxTimestamp ?? 0)
  if (msSinceLast < SPAM_COOLDOWN_MS) {
    return NextResponse.json({
      error: 'too_fast',
      retryAfterMs: SPAM_COOLDOWN_MS - msSinceLast,
      streak: existing.streak,
      gmmedToday: existing.lastDate === today,
      score: existing.score,
      totalGms: existing.totalGms,
      validGms: existing.validGms ?? 0,
      isFirstToday: false,
      earned: 0,
    }, { status: 429 })
  }

  const isFirstToday = existing.lastDate !== today

  const calc = calculateGM({
    isFirstToday,
    currentStreak: existing.streak,
    lastDateWasYesterday: existing.lastDate === yesterday,
  })

  const newScore    = (existing.score ?? 0) + calc.scoreEarned
  const newTotalGms = (existing.totalGms ?? 0) + 1
  const newValidGms = (existing.validGms ?? 0) + (isFirstToday ? 1 : 0)

  await redis.set(`gm:${address}`, {
    streak: calc.newStreak,
    lastDate: isFirstToday ? today : existing.lastDate,
    totalGms: newTotalGms,
    validGms: newValidGms,
    score: newScore,
    lastTxTimestamp: now,
  })

  // Activity feed — only on valid (first-of-day) GMs
  if (isFirstToday) {
    const feed = await redis.get<Array<{ address: string; streak: number; time: number }>>('gm:feed') ?? []
    feed.unshift({ address: address.slice(0, 6) + '...' + address.slice(-4), streak: calc.newStreak, time: now })
    await redis.set('gm:feed', feed.slice(0, 10))
  }

  await redis.zadd('leaderboard', newScore, address)

  return NextResponse.json({
    streak: calc.newStreak,
    gmmedToday: true,
    lastGm: today,
    score: newScore,
    totalGms: newTotalGms,
    validGms: newValidGms,
    earned: calc.scoreEarned,
    isFirstToday,
    milestone: calc.milestoneBonus > 0 ? { day: calc.newStreak, bonus: calc.milestoneBonus } : null,
  })
}
