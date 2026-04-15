import { NextRequest, NextResponse } from 'next/server'
import { referralStore } from '@/lib/referralStore'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://baseamp.vercel.app'
  const data = referralStore.get(address)

  return NextResponse.json({
    referralCode: address,
    referralLink: `${appUrl}?ref=${address}`,
    totalReferrals: data?.referrals.length ?? 0,
    totalEarned: (data?.totalEarned ?? 0).toFixed(6),
    referrals: data?.referrals ?? [],
  })
}
