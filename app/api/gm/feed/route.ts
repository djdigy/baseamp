import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const feed = await redis.get<Array<{ address: string; streak: number; time: number }>>('gm:feed') ?? []
  return NextResponse.json({ feed })
}
