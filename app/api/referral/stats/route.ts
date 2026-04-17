import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface ReferralData {
  referrals: Array<{ address: string; date: string; earned: string }>
  totalEarned: number
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const data = await redis.get<ReferralData>(`referral:${address}`) ?? { referrals: [], totalEarned: 0 }

  return NextResponse.json({
    totalReferrals: data.referrals.length,
    totalEarned: data.totalEarned.toFixed(6),
    referrals: data.referrals,
  })
}
