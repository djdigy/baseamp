import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { calculateGM } from '@/lib/gm'

export const dynamic = 'force-dynamic'

interface GmData { streak: number; lastDate: string; totalGms: number; score: number }
interface ReferralData {
  referrals: Array<{ address: string; date: string; earnedEth: string }>
  totalEarnedEth: number
  dailyEarnedEth: number
  lastEarningDate: string
  // legacy compat
  totalEarned?: number
  dailyEarnings?: number
}

const GM_FEE_ETH    = 0.00003
const REFERRER_PCT  = 0.20
const REFERRAL_SCORE_BONUS = 2

export async function POST(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  // Referrer passed directly from frontend (resolved from code or address)
  const referrerParam = req.nextUrl.searchParams.get('referrer')?.toLowerCase() ?? null

  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const existing = await redis.get<GmData>(`gm:${address}`) ?? {
    streak: 0, lastDate: '', totalGms: 0, score: 0,
  }

  const calc = calculateGM({
    isFirstToday: existing.lastDate !== today,
    currentStreak: existing.streak,
    lastDateWasYesterday: existing.lastDate === yesterday,
  })

  const newScore    = (existing.score ?? 0) + calc.scoreEarned
  const newTotalGms = (existing.totalGms ?? 0) + 1

  await redis.set(`gm:${address}`, {
    streak: calc.newStreak,
    lastDate: calc.isFirstToday ? today : existing.lastDate,
    totalGms: newTotalGms,
    score: newScore,
  })

  // Referrer reward — only on first GM of day, only if referee active in last 7 days
  let referralBonus = 0
  if (calc.isFirstToday) {
    // Use param-provided referrer first, fall back to stored mapping
    const referrerAddr = referrerParam ?? await redis.get<string>(`referred_by:${address}`)
    if (referrerAddr && referrerAddr !== address) {
      // Activity check: referee must have GM'd in last 7 days
      const refereeGm = await redis.get<GmData>(`gm:${address}`)
      const lastGmDate = refereeGm?.lastDate ?? ''
      const daysSinceGm = lastGmDate
        ? Math.floor((Date.now() - new Date(lastGmDate).getTime()) / 86400000)
        : 999
      const isActive = daysSinceGm <= 7

      if (isActive) {
        const refKey  = `referral:${referrerAddr}`
        const refData = await redis.get<ReferralData>(refKey) ?? {
          referrals: [], totalEarnedEth: 0, dailyEarnedEth: 0, lastEarningDate: '',
        }

        const earnedEth = parseFloat((GM_FEE_ETH * REFERRER_PCT).toFixed(8)) // 0.000006
        const isNewDay  = refData.lastEarningDate !== today

        refData.dailyEarnedEth  = isNewDay ? earnedEth : parseFloat(((refData.dailyEarnedEth ?? 0) + earnedEth).toFixed(8))
        refData.lastEarningDate = today
        refData.totalEarnedEth  = parseFloat(((refData.totalEarnedEth ?? 0) + earnedEth).toFixed(8))

        // Update referee entry earnedEth
        const refEntry = refData.referrals.find(r => r.address === address)
        if (refEntry) {
          refEntry.earnedEth = parseFloat(((parseFloat(refEntry.earnedEth ?? '0')) + earnedEth).toFixed(8)).toString()
        }

        await redis.set(refKey, refData)

        // Add score bonus to referrer
        const referrerGm = await redis.get<GmData>(`gm:${referrerAddr}`)
        if (referrerGm) {
          referrerGm.score = (referrerGm.score ?? 0) + REFERRAL_SCORE_BONUS
          await redis.set(`gm:${referrerAddr}`, referrerGm)
          await redis.zadd('leaderboard', referrerGm.score, referrerAddr)
        }
        referralBonus = REFERRAL_SCORE_BONUS
      }
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
