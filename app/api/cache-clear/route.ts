import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })
    const key = `wallet-stats:${address.toLowerCase()}`
    // Overwrite with empty marker (TTL 1s) to force fresh fetch
    await redis.setEx(key, 1, null)
    return NextResponse.json({ ok: true, cleared: key })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
