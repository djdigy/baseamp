import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { calculateGM } from '@/lib/gm'

export const dynamic = 'force-dynamic'

interface GmData {
  streak: number
  lastDate: string
  totalGms: number    // all-time GM count (every TX)
  validGms: number    // only first-of-day GMs
  score: number
  lastTxTimestamp: number  // epoch ms of last GM TX — for spam protection
}
interface ReferralData {
  referrals: Array<{ address: string; date: string; earnedEth: string }>
  totalEarnedEth: number
  dailyEarnedEth: number
  lastEarningDate: string
  totalEarned?: number
  dailyEarnings?: number
}

const GM_FEE_ETH         = 0.00003
const REFERRER_PCT       = 0.20
const REFERRAL_SCORE_BONUS = 2
const SPAM_COOLDOWN_MS   = 12000  // 12 seconds (~2 Base blocks)

export async function POST(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const referrerParam = req.nextUrl.searchParams.get('referrer')?.toLowerCase() ?? null

  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const now       = Date.now()

  const existing = await redis.get<GmData>(`gm:${address}`) ?? {
    streak: 0, lastDate: '', totalGms: 0, validGms: 0, score: 0, lastTxTimestamp: 0,
  }

  // Spam protection — reject if too soon after last TX
  const msSinceLast = now - (existing.lastTxTimestamp ?? 0)
  if (msSinceLast < SPAM_COOLDOWN_MS) {
    return NextResponse.json({
      error: 'too_fast',
      retryAfterMs: SPAM_COOLDOWN_MS - msSinceLast,
      streak: existing.streak,
      gmmedToday: existing.lastDate === today,
      score: existing.score,
      totalGms: existing.totalGms,
      validGms: existing.validGms ?? 0,
      isFirstToday: false,
      earned: 0,
    }, { status: 429 })
  }

  const isFirstToday = existing.lastDate !== today

  const calc = calculateGM({
    isFirstToday,
    currentStreak: existing.streak,
    lastDateWasYesterday: existing.lastDate === yesterday,
  })

  const newScore    = (existing.score ?? 0) + calc.scoreEarned
  const newTotalGms = (existing.totalGms ?? 0) + 1
  const newValidGms = (existing.validGms ?? 0) + (isFirstToday ? 1 : 0)

  await redis.set(`gm:${address}`, {
    streak: calc.newStreak,
    lastDate: isFirstToday ? today : existing.lastDate,
    totalGms: newTotalGms,
    validGms: newValidGms,
    score: newScore,
    lastTxTimestamp: now,
  })

  // Referral reward — ONLY on first GM of day
  let referralBonus = 0
  if (isFirstToday) {
    const referrerAddr = referrerParam ?? await redis.get<string>(`referred_by:${address}`)
    if (referrerAddr && referrerAddr !== address) {
      const refereeGm = await redis.get<GmData>(`gm:${address}`)
      const lastGmDate = refereeGm?.lastDate ?? ''
      const daysSinceGm = lastGmDate
        ? Math.floor((now - new Date(lastGmDate).getTime()) / 86400000)
        : 999
      const isActive = daysSinceGm <= 7

      if (isActive) {
        const refKey  = `referral:${referrerAddr}`
        const refData = await redis.get<ReferralData>(refKey) ?? {
          referrals: [], totalEarnedEth: 0, dailyEarnedEth: 0, lastEarningDate: '',
        }
        const earnedEth = parseFloat((GM_FEE_ETH * REFERRER_PCT).toFixed(8))
        const isNewDay  = refData.lastEarningDate !== today
        refData.dailyEarnedEth  = isNewDay ? earnedEth : parseFloat(((refData.dailyEarnedEth ?? 0) + earnedEth).toFixed(8))
        refData.lastEarningDate = today
        refData.totalEarnedEth  = parseFloat(((refData.totalEarnedEth ?? 0) + earnedEth).toFixed(8))
        const refEntry = refData.referrals.find(r => r.address === address)
        if (refEntry) {
          refEntry.earnedEth = parseFloat(((parseFloat(refEntry.earnedEth ?? '0')) + earnedEth).toFixed(8)).toString()
        }
        await redis.set(refKey, refData)

        const referrerGm = await redis.get<GmData>(`gm:${referrerAddr}`)
        if (referrerGm) {
          referrerGm.score = (referrerGm.score ?? 0) + REFERRAL_SCORE_BONUS
          await redis.set(`gm:${referrerAddr}`, referrerGm)
          await redis.zadd('leaderboard', referrerGm.score, referrerAddr)
        }
        referralBonus = REFERRAL_SCORE_BONUS
      }
    }

    // Activity feed — only on valid GMs
    const feed = await redis.get<Array<{ address: string; streak: number; time: number }>>('gm:feed') ?? []
    feed.unshift({ address: address.slice(0, 6) + '...' + address.slice(-4), streak: calc.newStreak, time: now })
    await redis.set('gm:feed', feed.slice(0, 10))
  }

  await redis.zadd('leaderboard', newScore, address)

  return NextResponse.json({
    streak: calc.newStreak,
    gmmedToday: true,
    lastGm: today,
    score: newScore,
    totalGms: newTotalGms,
    validGms: newValidGms,
    earned: calc.scoreEarned,
    referralBonus,
    isFirstToday,
    milestone: calc.milestoneBonus > 0 ? { day: calc.newStreak, bonus: calc.milestoneBonus } : null,
  })
}
