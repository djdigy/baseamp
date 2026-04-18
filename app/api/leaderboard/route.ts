import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export interface LeaderboardEntry {
  address: string
  score: number
  rank: number
  code: string | null
}

export async function GET() {
  const results = await redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true })

  const entries: LeaderboardEntry[] = []
  for (let i = 0; i < results.length; i += 2) {
    const address = results[i] as string
    const score   = Number(results[i + 1])
    // Look up referral code for this address (non-blocking, null if missing)
    const code = await redis.get<string>(`refcode:addr:${address}`).catch(() => null)
    entries.push({ address, score, rank: entries.length + 1, code: code ?? null })
  }

  return NextResponse.json({ entries })
}
