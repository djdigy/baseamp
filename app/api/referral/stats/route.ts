import { NextRequest, NextResponse } from 'next/server'
import { referralStore } from '@/lib/referralStore'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const data = referralStore.get(address)

  return NextResponse.json({
    totalReferrals: data?.referrals.length ?? 0,
    totalEarned: (data?.totalEarned ?? 0).toFixed(6),
    referrals: data?.referrals ?? [],
  })
}
