import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'

interface GmData { streak: number; lastDate: string; totalGms: number; score: number }
interface ReferralData {
  referrals: Array<{ address: string; date: string; earned: string }>
  totalEarned: number
  dailyEarnings: number
  lastEarningDate: string
}

const MILESTONES: Record<number, number> = { 3: 10, 5: 20, 7: 50, 14: 100, 30: 300 }
const FIRST_GM_SCORE = 5   // first GM of the day
const EXTRA_GM_SCORE = 1   // additional GMs same day
const REFERRAL_GM_BONUS = 2

export async function POST(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const existing = await redis.get<GmData>(`gm:${address}`) ?? { streak: 0, lastDate: '', totalGms: 0, score: 0 }

  const isFirstToday = existing.lastDate !== today

  if (isFirstToday) {
    // First GM of the day: advance streak, award +5 + milestone bonus
    const newStreak = existing.lastDate === yesterday ? existing.streak + 1 : 1
    const milestoneBonus = MILESTONES[newStreak] ?? 0
    const earned = FIRST_GM_SCORE + milestoneBonus
    const newScore = (existing.score ?? 0) + earned
    const newTotalGms = (existing.totalGms ?? 0) + 1

    await redis.set(`gm:${address}`, { streak: newStreak, lastDate: today, totalGms: newTotalGms, score: newScore })

    // Reward referrer
    let referralBonus = 0
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
        try {
          const client = new Redis({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! })
          await client.zadd('leaderboard', { score: referrerGm.score, member: referrerAddr })
        } catch { /* non-blocking */ }
      }
      referralBonus = REFERRAL_GM_BONUS
    }

    // Update leaderboard
    try {
      const client = new Redis({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! })
      await client.zadd('leaderboard', { score: newScore, member: address })
    } catch { /* non-blocking */ }

    // Activity feed
    const feed = await redis.get<Array<{ address: string; streak: number; time: number }>>('gm:feed') ?? []
    feed.unshift({ address: address.slice(0, 6) + '...' + address.slice(-4), streak: newStreak, time: Date.now() })
    await redis.set('gm:feed', feed.slice(0, 10))

    return NextResponse.json({
      streak: newStreak, gmmedToday: true, lastGm: today,
      score: newScore, earned, referralBonus, isFirstToday: true,
      milestone: milestoneBonus > 0 ? { day: newStreak, bonus: milestoneBonus } : null,
    })
  } else {
    // Additional GM same day: +1 score only, streak unchanged
    const earned = EXTRA_GM_SCORE
    const newScore = (existing.score ?? 0) + earned
    const newTotalGms = (existing.totalGms ?? 0) + 1

    await redis.set(`gm:${address}`, { ...existing, totalGms: newTotalGms, score: newScore })

    // Update leaderboard with new score
    try {
      const client = new Redis({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! })
      await client.zadd('leaderboard', { score: newScore, member: address })
    } catch { /* non-blocking */ }

    return NextResponse.json({
      streak: existing.streak, gmmedToday: true, lastGm: today,
      score: newScore, earned, referralBonus: 0, isFirstToday: false,
      milestone: null,
    })
  }
}
