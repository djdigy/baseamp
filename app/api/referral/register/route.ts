import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface ReferralData {
  referrals: Array<{ address: string; date: string; earnedEth: string }>
  totalEarnedEth: number
  dailyEarnedEth: number
  lastEarningDate: string
}

const REFERRER_PCT = 0.20

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { referrer, referee, feeEth } = body

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

  // IMMUTABLE: set once, never overwritten
  const existing = await redis.get<string>(`referred_by:${refereeAddr}`)
  if (!existing) {
    await redis.set(`referred_by:${refereeAddr}`, referrerAddr)
  }
  const canonicalReferrer = existing ?? referrerAddr

  // 7-day activity check: referee must have GM'd in last 7 days to generate earnings
  const gmData = await redis.get<{ lastDate: string }>(`gm:${refereeAddr}`)
  const isActive = gmData?.lastDate
    ? Math.floor((Date.now() - new Date(gmData.lastDate).getTime()) / 86400000) <= 7
    : false // new user hasn't GM'd yet — no earnings yet, but registration recorded

  const fee         = feeEth ?? 0.00003
  const earnedEth   = parseFloat((fee * REFERRER_PCT).toFixed(8))
  const today       = new Date().toISOString().slice(0, 10)
  const refKey      = `referral:${canonicalReferrer}`

  const refData = await redis.get<ReferralData>(refKey) ?? {
    referrals: [], totalEarnedEth: 0, dailyEarnedEth: 0, lastEarningDate: '',
  }

  // Register referee (one time)
  if (!refData.referrals.some(r => r.address === refereeAddr)) {
    refData.referrals.push({
      address: refereeAddr,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      earnedEth: isActive ? earnedEth.toFixed(8) : '0',
    })
  }

  // Only credit earnings if referee is active
  if (isActive) {
    const isNewDay = refData.lastEarningDate !== today
    refData.dailyEarnedEth  = isNewDay ? earnedEth : parseFloat(((refData.dailyEarnedEth ?? 0) + earnedEth).toFixed(8))
    refData.lastEarningDate = today
    refData.totalEarnedEth  = parseFloat(((refData.totalEarnedEth ?? 0) + earnedEth).toFixed(8))
  }

  await redis.set(refKey, refData)

  return NextResponse.json({
    ok: true,
    referrer: canonicalReferrer,
    isActive,
    referrerEarned: isActive ? earnedEth : 0,
    platformEarned: parseFloat((fee * 0.80).toFixed(8)),
  })
}
