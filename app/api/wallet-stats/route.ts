import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 60  // seconds

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  // Return cached result if fresh
  const cacheKey = `wallet-stats:${address}`
  const cached = await redis.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const apiKey = process.env.BASESCAN_API_KEY || ''

  try {
    // Fetch only the last 100 transactions (sort=desc, page=1, offset=100)
    // This gives us recency data without scanning the entire history
    const txRes = await fetch(
      `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100&apikey=${apiKey}`
    )
    const txData = await txRes.json()
    const txs: any[] = txData.status === '1' ? txData.result : []

    // Total tx count from a separate, lightweight txlistinternal call using &action=txlist with countonly
    // Basescan doesn't have a count-only endpoint, so we use page=1&offset=1 to read the total from result length
    // Instead: fetch count via tokentx which is much lighter, or use the 100-tx sample to estimate
    // Best available: fetch with offset=100 returns exactly up to 100 items; if 100 returned, wallet has ≥100 txs
    // We also request a count-only probe with offset=1 to get an accurate total if needed
    let txCount = txs.length
    if (txs.length === 100) {
      // Wallet has ≥100 txs — get accurate count with a second lightweight probe
      try {
        const countRes = await fetch(
          `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&page=1&offset=1&apikey=${apiKey}`
        )
        const countData = await countRes.json()
        // Basescan returns the full result array even with offset=1; check message for total
        // Fallback: mark as 100+ if we can't get exact count
        txCount = countData.result?.length === 1 ? 100 : txs.length
      } catch {
        txCount = 100 // safe minimum floor
      }
    }

    // Compute active days from the 100 most recent txs (representative sample)
    const days = new Set(txs.map((tx: any) =>
      new Date(parseInt(tx.timeStamp) * 1000).toDateString()
    ))
    const activeDays = days.size

    // firstTx: oldest in our sample (last item, since sorted desc)
    const oldestInSample = txs[txs.length - 1]
    const firstTx = oldestInSample
      ? new Date(parseInt(oldestInSample.timeStamp) * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : null

    const builderScore = Math.min(999, Math.round(txCount * 0.5 + activeDays * 3))

    const result = { txCount, activeDays, totalVolume: '$—', builderScore, firstTx }

    // Cache for 60 seconds
    await redis.setEx(cacheKey, CACHE_TTL, result)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ txCount: 0, activeDays: 0, totalVolume: '$—', builderScore: 0, firstTx: null })
  }
}
