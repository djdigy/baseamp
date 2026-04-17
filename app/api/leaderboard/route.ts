import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export interface LeaderboardEntry {
  address: string
  score: number
  rank: number
}

export async function GET() {
  const results = await redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true })

  const entries: LeaderboardEntry[] = []
  for (let i = 0; i < results.length; i += 2) {
    entries.push({
      address: results[i] as string,
      score: Number(results[i + 1]),
      rank: entries.length + 1,
    })
  }

  return NextResponse.json({ entries })
}
