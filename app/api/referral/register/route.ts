import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface ReferralData {
  referrals: Array<{ address: string; date: string; earned: string }>
  totalEarned: number
  dailyEarnings: number
  lastEarningDate: string
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { referrer, referee, feeAmount } = body

  if (!referrer || !referee) {
    return NextResponse.json({ error: 'referrer and referee required' }, { status: 400 })
  }

  const refereeAddr = referee.toLowerCase()

  // Resolve short code → address
  let referrerAddr = referrer.toLowerCase()
  if (!referrerAddr.startsWith('0x')) {
    const resolved = await redis.get<string>(`refcode:code:${referrer}`)
    if (!resolved) return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    referrerAddr = resolved.toLowerCase()
  }

  if (referrerAddr === refereeAddr) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
  }

  // Store reverse mapping: referee → referrer (for GM reward lookup)
  const alreadyReferred = await redis.get<string>(`referred_by:${refereeAddr}`)
  if (!alreadyReferred) {
    await redis.set(`referred_by:${refereeAddr}`, referrerAddr)
  }

  const earned = ((feeAmount || 0.0001) * 0.1).toFixed(6)
  const today = new Date().toISOString().slice(0, 10)
  const key = `referral:${referrerAddr}`

  const existing = await redis.get<ReferralData>(key) ?? { referrals: [], totalEarned: 0, dailyEarnings: 0, lastEarningDate: '' }

  if (!existing.referrals.some(r => r.address === refereeAddr)) {
    existing.referrals.push({
      address: refereeAddr,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      earned,
    })
    existing.totalEarned = parseFloat(((existing.totalEarned ?? 0) + parseFloat(earned)).toFixed(6))
    await redis.set(key, existing)
  }

  return NextResponse.json({ success: true, earned, referrer: referrerAddr })
}
