import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { event, dex } = await req.json()
    const key = dex ? `track:${event}:${dex}` : `track:${event}`
    await redis.set(key, String(Date.now())).catch(() => {})
  } catch (_) {}
  return NextResponse.json({ ok: true })
}
