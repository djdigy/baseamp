import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const raw = await redis.get(`gm:${address}`)

  if (!raw) return NextResponse.json({ streak: 0, gmmedToday: false, lastGm: null })

  const data = JSON.parse(raw)
  return NextResponse.json({
    streak: data.streak,
    gmmedToday: data.lastDate === today,
    lastGm: data.lastDate,
  })
}
