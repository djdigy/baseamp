import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { referralStore } from '@/lib/referralStore'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { referrer, referee, feeAmount } = body

  if (!referrer || !referee) {
    return NextResponse.json({ error: 'referrer and referee required' }, { status: 400 })
  }

  const refereeAddr = referee.toLowerCase()

  // referrer kısa kod mu, yoksa adres mi?
  let referrerAddr = referrer.toLowerCase()
  if (!referrerAddr.startsWith('0x')) {
    // Kısa kod — adresi çöz
    const resolved = await redis.get<string>(`refcode:code:${referrer}`)
    if (!resolved) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    referrerAddr = resolved.toLowerCase()
  }

  if (referrerAddr === refereeAddr) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
  }

  const earned = ((feeAmount || 0.0001) * 0.1).toFixed(6)
  const existing = referralStore.get(referrerAddr) ?? { referrals: [], totalEarned: 0 }
  const alreadyReferred = existing.referrals.some(r => r.address === refereeAddr)

  if (!alreadyReferred) {
    existing.referrals.push({
      address: refereeAddr,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      earned,
    })
    existing.totalEarned += parseFloat(earned)
    referralStore.set(referrerAddr, existing)
  }

  return NextResponse.json({ success: true, earned, referrer: referrerAddr })
}
