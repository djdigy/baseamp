import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

export interface LeaderboardEntry {
  address: string
  score: number
  rank: number
}

export async function GET() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ entries: [] })
  }

  try {
    const client = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })

    // zrange with rev:true = highest score first
    const results = await client.zrange('leaderboard', 0, 9, {
      rev: true,
      withScores: true,
    })

    const entries: LeaderboardEntry[] = []
    for (let i = 0; i < results.length; i += 2) {
      entries.push({
        address: results[i] as string,
        score: Number(results[i + 1]),
        rank: entries.length + 1,
      })
    }

    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ entries: [] })
  }
}
