import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 60
const BASESCAN  = 'https://api.basescan.org/api'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const cacheKey = `wallet-stats:${address}`
  const cached = await redis.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const apiKey = process.env.BASESCAN_API_KEY || ''

  try {
    const txRes = await fetch(
      `${BASESCAN}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100&apikey=${apiKey}`
    )
    const txData = await txRes.json()
    const txs: any[] = txData.status === '1' && Array.isArray(txData.result) ? txData.result : []

    const txCount = txs.length

    // Active days: use ISO date string, never toLocaleDateString
    const days = txs
      .map((tx: any) => {
        const ts = tx.timeStamp || tx.timestamp
        if (!ts) return null
        return new Date(Number(ts) * 1000).toISOString().slice(0, 10)
      })
      .filter(Boolean) as string[]

    const activeDays = new Set(days).size

    const oldestInSample = txs[txs.length - 1]
    const firstTx = oldestInSample
      ? new Date(Number(oldestInSample.timeStamp) * 1000).toISOString().slice(0, 7) // "YYYY-MM"
      : null

    const builderScore = Math.min(999, Math.round(txCount * 0.5 + activeDays * 3))
    const result = { txCount, activeDays, totalVolume: '$—', builderScore, firstTx }

    await redis.setEx(cacheKey, CACHE_TTL, result)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ txCount: 0, activeDays: 0, totalVolume: '$—', builderScore: 0, firstTx: null })
  }
}
