import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface GmData { streak: number; lastDate: string }

export async function POST(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const existing = await redis.get<GmData>(`gm:${address}`)

  if (existing?.lastDate === today) {
    return NextResponse.json({ streak: existing.streak, gmmedToday: true, lastGm: today })
  }

  const newStreak = existing?.lastDate === yesterday ? existing.streak + 1 : 1
  await redis.set(`gm:${address}`, { streak: newStreak, lastDate: today })

  return NextResponse.json({ streak: newStreak, gmmedToday: true, lastGm: today })
}
