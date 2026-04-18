import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 60  // seconds
const BASE_RPC   = 'https://mainnet.base.org'
const BASESCAN   = 'https://api.basescan.org/api'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const cacheKey = `wallet-stats:${address}`
  const cached = await redis.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const apiKey = process.env.BASESCAN_API_KEY || ''

  try {
    // 1. Exact tx count via eth_getTransactionCount (counts ALL sent txs, instant)
    const rpcRes = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionCount', params: [address, 'latest'] }),
    })
    const rpcData = await rpcRes.json()
    const txCount = rpcData?.result ? parseInt(rpcData.result, 16) : 0

    // 2. Last 100 txs for active-days calculation
    let activeDays = 0
    let firstTx: string | null = null

    const txRes = await fetch(
      `${BASESCAN}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100&apikey=${apiKey}`
    )
    const txData = await txRes.json()
    const txs: any[] = txData.status === '1' && Array.isArray(txData.result) ? txData.result : []

    if (txs.length > 0) {
      const days = new Set(txs.map((tx: any) =>
        new Date(parseInt(tx.timeStamp) * 1000).toDateString()
      ))
      activeDays = days.size

      // Oldest in sample — for wallets with >100 txs this approximates first tx
      const oldest = txs[txs.length - 1]
      firstTx = new Date(parseInt(oldest.timeStamp) * 1000)
        .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }

    // Approximate active days for large wallets:
    // if we got a full 100-tx page, extrapolate using the spread of the sample
    if (txs.length === 100 && txCount > 100) {
      // Scale: actual txCount / sample * sample_active_days, capped at reasonable max
      const ratio = txCount / 100
      activeDays = Math.min(Math.round(activeDays * Math.sqrt(ratio)), txCount)
    }

    const builderScore = Math.min(999, Math.round(txCount * 0.5 + activeDays * 3))
    const result = { txCount, activeDays, totalVolume: '$—', builderScore, firstTx }

    await redis.setEx(cacheKey, CACHE_TTL, result)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ txCount: 0, activeDays: 0, totalVolume: '$—', builderScore: 0, firstTx: null })
  }
}
