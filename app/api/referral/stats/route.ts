import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface ReferralData {
  referrals: Array<{ address: string; date: string; earnedEth: string }>
  totalEarnedEth: number
  dailyEarnedEth: number
  lastEarningDate: string
  // legacy compat
  totalEarned?: number
  dailyEarnings?: number
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const data = await redis.get<ReferralData>(`referral:${address}`) ?? {
    referrals: [], totalEarnedEth: 0, dailyEarnedEth: 0, lastEarningDate: '',
  }

  const today = new Date().toISOString().slice(0, 10)
  const totalEarned = data.totalEarnedEth ?? data.totalEarned ?? 0
  const todayEarned = data.lastEarningDate === today
    ? (data.dailyEarnedEth ?? 0)
    : 0

  return NextResponse.json({
    totalReferrals: data.referrals?.length ?? 0,
    totalEarned:    totalEarned.toFixed(6),
    todayEarned:    todayEarned.toFixed(6),
    referrals:      data.referrals ?? [],
    // legacy
    dailyEarnings: todayEarned,
  })
}
