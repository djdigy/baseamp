import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const apiKey = process.env.BASESCAN_API_KEY || ''

  try {
    // TX listesi
    const txRes = await fetch(
      `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`
    )
    const txData = await txRes.json()
    const txs = txData.status === '1' ? txData.result : []

    const txCount = txs.length
    const firstTx = txs.length > 0
      ? new Date(parseInt(txs[0].timeStamp) * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : null

    // Aktif günleri hesapla
    const days = new Set(txs.map((tx: any) =>
      new Date(parseInt(tx.timeStamp) * 1000).toDateString()
    ))
    const activeDays = days.size

    // Basit builder score
    const builderScore = Math.min(999, Math.round(txCount * 0.5 + activeDays * 3))

    return NextResponse.json({
      txCount,
      activeDays,
      totalVolume: '$—',
      builderScore,
      firstTx,
    })
  } catch (err) {
    return NextResponse.json({ txCount: 0, activeDays: 0, totalVolume: '$—', builderScore: 0, firstTx: null })
  }
}
