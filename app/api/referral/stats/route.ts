import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface ReferralData {
  referrals: Array<{ address: string; date: string; earned: string }>
  totalEarned: number
  dailyEarnings: number
  lastEarningDate: string
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const data = await redis.get<ReferralData>(`referral:${address}`) ?? { referrals: [], totalEarned: 0, dailyEarnings: 0, lastEarningDate: '' }
  const today = new Date().toISOString().slice(0, 10)

  return NextResponse.json({
    totalReferrals: data.referrals.length,
    totalEarned: (data.totalEarned ?? 0).toFixed(6),
    referrals: data.referrals,
    dailyEarnings: data.lastEarningDate === today ? (data.dailyEarnings ?? 0) : 0,
  })
}
