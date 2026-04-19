import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface GmData { streak: number; lastDate: string; totalGms: number; validGms?: number; score: number }

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const data = await redis.get<GmData>(`gm:${address}`)

  if (!data) return NextResponse.json({ streak: 0, gmmedToday: false, lastGm: null, score: 0, totalGms: 0, validGms: 0 })

  return NextResponse.json({
    streak: data.streak,
    gmmedToday: data.lastDate === today,
    lastGm: data.lastDate,
    score: data.score ?? 0,
    totalGms: data.totalGms ?? 0,
    validGms: data.validGms ?? 0,
  })
}
