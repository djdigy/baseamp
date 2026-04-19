import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const CACHE_TTL  = 300   // 5 min
const BLOCKSCOUT = 'https://base.blockscout.com/api'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const cacheKey = `wallet-stats:${address}`
  const cached = await redis.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    // Blockscout Etherscan-compatible API — free, no key, works on Base
    const res = await fetch(
      `${BLOCKSCOUT}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc`,
      { next: { revalidate: 0 } }
    )
    const data = await res.json()
    const txs: any[] = data.status === '1' && Array.isArray(data.result) ? data.result : []

    const txCount = txs.length

    // Active days
    const dateStrings = txs
      .map((tx: any) => {
        const ts = tx.timeStamp || tx.timestamp
        return ts ? new Date(Number(ts) * 1000).toISOString().slice(0, 10) : null
      })
      .filter(Boolean) as string[]

    const uniqueDays = [...new Set(dateStrings)].sort()
    const activeDays = uniqueDays.length

    // Current streak
    let currentStreak = 0
    const today     = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const daySet    = new Set(uniqueDays)
    let check = daySet.has(today) ? today : daySet.has(yesterday) ? yesterday : null
    if (check) {
      currentStreak = 1
      let d = new Date(check)
      while (true) {
        d = new Date(d.getTime() - 86400000)
        if (daySet.has(d.toISOString().slice(0, 10))) { currentStreak++ } else break
      }
    }

    // Unique contracts (has input data → contract call)
    const contracts = new Set(
      txs.filter((tx: any) => tx.to && tx.input && tx.input !== '0x').map((tx: any) => tx.to.toLowerCase())
    )
    const uniqueContracts = contracts.size

    // Gas used in ETH
    const gasEth = txs.reduce((sum: number, tx: any) => {
      const used  = Number(tx.gasUsed  || 0)
      const price = Number(tx.gasPrice || 0)
      return sum + (used * price) / 1e18
    }, 0)

    // Last / first activity dates
    const lastActivity  = txs[0]
      ? new Date(Number(txs[0].timeStamp) * 1000).toISOString().slice(0, 10)
      : null
    const firstActivity = txs[txs.length - 1]
      ? new Date(Number(txs[txs.length - 1].timeStamp) * 1000).toISOString().slice(0, 10)
      : null
    const walletAge = firstActivity
      ? Math.floor((Date.now() - new Date(firstActivity).getTime()) / 86400000)
      : 0

    const builderScore = Math.min(999, Math.round(txCount * 0.5 + activeDays * 3 + uniqueContracts * 2))

    const result = {
      txCount, activeDays, uniqueContracts, currentStreak,
      gasEth: parseFloat(gasEth.toFixed(5)),
      lastActivity, firstActivity, walletAge, builderScore,
    }

    await redis.setEx(cacheKey, CACHE_TTL, result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('wallet-stats error:', err)
    return NextResponse.json({
      txCount: 0, activeDays: 0, uniqueContracts: 0, currentStreak: 0,
      gasEth: 0, lastActivity: null, firstActivity: null, walletAge: 0, builderScore: 0,
    })
  }
}
