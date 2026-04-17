import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { calculateGM } from '@/lib/gm'

export const dynamic = 'force-dynamic'

interface GmData { streak: number; lastDate: string; totalGms: number; score: number }
interface ReferralData {
  referrals: Array<{ address: string; date: string; earned: string }>
  totalEarned: number
  dailyEarnings: number
  lastEarningDate: string
}

const REFERRAL_GM_BONUS = 2

export async function POST(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const existing = await redis.get<GmData>(`gm:${address}`) ?? { streak: 0, lastDate: '', totalGms: 0, score: 0 }

  const calc = calculateGM({
    isFirstToday: existing.lastDate !== today,
    currentStreak: existing.streak,
    lastDateWasYesterday: existing.lastDate === yesterday,
  })

  const newScore = (existing.score ?? 0) + calc.scoreEarned
  const newTotalGms = (existing.totalGms ?? 0) + 1

  // Always persist — no early return path exists
  await redis.set(`gm:${address}`, {
    streak: calc.newStreak,
    lastDate: calc.isFirstToday ? today : existing.lastDate,
    totalGms: newTotalGms,
    score: newScore,
  })

  // Reward referrer (first GM of day only)
  let referralBonus = 0
  if (calc.isFirstToday) {
    const referrerAddr = await redis.get<string>(`referred_by:${address}`)
    if (referrerAddr) {
      const refData = await redis.get<ReferralData>(`referral:${referrerAddr}`) ?? { referrals: [], totalEarned: 0, dailyEarnings: 0, lastEarningDate: '' }
      const isNewDay = refData.lastEarningDate !== today
      refData.dailyEarnings = isNewDay ? REFERRAL_GM_BONUS : (refData.dailyEarnings ?? 0) + REFERRAL_GM_BONUS
      refData.lastEarningDate = today
      refData.totalEarned = parseFloat(((refData.totalEarned ?? 0) + 0.00001).toFixed(6))
      await redis.set(`referral:${referrerAddr}`, refData)

      const referrerGm = await redis.get<GmData>(`gm:${referrerAddr}`)
      if (referrerGm) {
        referrerGm.score = (referrerGm.score ?? 0) + REFERRAL_GM_BONUS
        await redis.set(`gm:${referrerAddr}`, referrerGm)
        await redis.zadd('leaderboard', referrerGm.score, referrerAddr)
      }
      referralBonus = REFERRAL_GM_BONUS
    }

    // Activity feed
    const feed = await redis.get<Array<{ address: string; streak: number; time: number }>>('gm:feed') ?? []
    feed.unshift({ address: address.slice(0, 6) + '...' + address.slice(-4), streak: calc.newStreak, time: Date.now() })
    await redis.set('gm:feed', feed.slice(0, 10))
  }

  await redis.zadd('leaderboard', newScore, address)

  return NextResponse.json({
    streak: calc.newStreak,
    gmmedToday: true,
    lastGm: today,
    score: newScore,
    totalGms: newTotalGms,
    earned: calc.scoreEarned,
    referralBonus,
    isFirstToday: calc.isFirstToday,
    milestone: calc.milestoneBonus > 0 ? { day: calc.newStreak, bonus: calc.milestoneBonus } : null,
  })
}
