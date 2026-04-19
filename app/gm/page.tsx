'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'
import { useState, useEffect, useRef } from 'react'

import { base } from 'wagmi/chains'
import { BUILDER_CODE, OWNER_ADDRESS, GM_FEE, encodeBuilderCode } from '@/lib/constants'
import { getNextMilestone, getMilestones } from '@/lib/gm'
import { useReferral, calculateFee } from '@/hooks/useReferral'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'

interface GmData {
  streak: number
  gmmedToday: boolean
  score: number
  totalGms: number
  lastGm: string | null
}
interface FeedItem { address: string; streak: number; time: number }
interface LeaderboardEntry { address: string; score: number; rank: number; code: string | null }

function getTimeUntilReset() {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const diff = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000))
  return {
    hours: Math.floor(diff / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    totalSeconds: diff,
  }
}

function useCountdown() {
  const [time, setTime] = useState(getTimeUntilReset())
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilReset()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function pad(n: number) { return String(n).padStart(2, '0') }

function MilestoneBar({ streak }: { streak: number }) {
  const milestones = getMilestones()
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {milestones.map(({ day, bonus }) => {
        const done = streak >= day
        return (
          <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: done ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1a1d27',
              border: `2px solid ${done ? '#f97316' : '#2d3148'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', color: done ? 'white' : '#374151',
              boxShadow: streak === day ? '0 0 12px #f97316aa' : 'none',
            }}>
              {done ? '✓' : day}
            </div>
            <div style={{ fontSize: '9px', color: done ? '#f97316' : '#374151' }}>+{bonus}</div>
          </div>
        )
      })}
    </div>
  )
}


function getUrgencyColor(totalSeconds: number, gmmedToday: boolean): string {
  if (gmmedToday) return '#4ade80'
  if (totalSeconds < 3600) return '#ef4444'
  if (totalSeconds < 10800) return '#f97316'
  return '#fbbf24'
}

export default function GmPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { referrer } = useReferral()
  const countdown = useCountdown()
  const { lang } = useLang()
  const g = TEXT.gm
  const c = TEXT.common

  const [data, setData] = useState<GmData>({ streak: 0, gmmedToday: false, score: 0, totalGms: 0, lastGm: null })
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [earnedMsg, setEarnedMsg] = useState<{ score: number; milestone: { day: number; bonus: number } | null } | null>(null)
  const [streakLost, setStreakLost] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const prevStreakRef = useRef<number | null>(null)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      fetch(`/api/gm/streak?address=${address}`).then(r => r.json()),
      fetch('/api/gm/feed').then(r => r.json()),
      fetch('/api/leaderboard').then(r => r.json()),
    ]).then(([streakData, feedData, lb]) => {
      if (prevStreakRef.current !== null && prevStreakRef.current > 1 && streakData.streak === 1 && !streakData.gmmedToday) {
        setStreakLost(true)
      }
      prevStreakRef.current = streakData.streak
      setData(streakData)
      setFeed(feedData.feed ?? [])
      setLeaderboard(lb.entries ?? [])
    }).finally(() => setLoading(false))
  }, [address])

  useEffect(() => {
    if (!data.lastGm || data.gmmedToday || data.streak === 0) return
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    if (data.lastGm < yesterdayStr && prevStreakRef.current !== null && prevStreakRef.current > 1) {
      setStreakLost(true)
    }
  }, [data])

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(GM_FEE, hasReferral)
  const urgencyColor = getUrgencyColor(countdown.totalSeconds, data.gmmedToday)
  const isUrgent = !data.gmmedToday && data.streak > 0 && countdown.totalSeconds < 10800

  async function handleGM() {
    if (!address || !publicClient || status === 'sending') return
    setStatus('sending')
    setError('')
    setEarnedMsg(null)
    setStreakLost(false)

    try {
      const gmTxData = encodeBuilderCode(BUILDER_CODE)
      console.log('[BaseAmp] GM TX data:', gmTxData, '| decoded:', BUILDER_CODE)
      const hash = await sendTransactionAsync({
        to: OWNER_ADDRESS,
        value: fee,
        data: gmTxData,
        chainId: base.id,
      })
      await publicClient.waitForTransactionReceipt({ hash })

      const res = await fetch(`/api/gm/record?address=${address}`, { method: 'POST' })
      const result = await res.json()

      setData(prev => ({
        ...prev,
        streak: result.streak,
        gmmedToday: true,
        score: result.score,
        totalGms: result.totalGms ?? prev.totalGms + 1,
        lastGm: new Date().toISOString().slice(0, 10),
      }))
      setEarnedMsg({ score: result.earned, milestone: result.milestone })

      const [feedRes, lbRes] = await Promise.all([
        fetch('/api/gm/feed').then(r => r.json()),
        fetch('/api/leaderboard').then(r => r.json()),
      ])
      setFeed(feedRes.feed ?? [])
      setLeaderboard(lbRes.entries ?? [])
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setError(err.shortMessage || err.message?.slice(0, 80) || 'Transaction failed')
      setStatus('error')
    }
  }

  const userRank = leaderboard.find(e => e.address === address?.toLowerCase())
  const nextMilestoneData = getNextMilestone(data.streak)

  if (!isConnected) {
    return (
      <AppLayout title="GM">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>&#9728;</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{tx(TEXT.common.connectWallet, lang)}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{tx(g.connectSub, lang)}</div>
        </div>
      </AppLayout>
    )
  }

  const btnLabel = status === 'sending'
    ? tx(g.sendingBtn, lang)
    : isUrgent && !data.gmmedToday
      ? tx(g.urgentBtn, lang)
      : data.gmmedToday
        ? tx(g.sendAgainBtn, lang)
        : tx(g.sendBtn, lang)

  const btnHint = data.gmmedToday
    ? tx(g.hintAgain, lang)
    : tx(g.hintFirst, lang)

  const streakIcon = data.gmmedToday ? '✅'
    : isUrgent ? '⏳'
    : data.streak >= 30 ? '👑'
    : data.streak >= 7 ? '🔥'
    : data.streak >= 3 ? '⚡'
    : '☀'

  return (
    <AppLayout title="GM">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
        <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {tx(g.pageInfo, lang)}
        </div>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Streak loss banner */}
          {streakLost && !data.gmmedToday && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💔</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f87171' }}>{tx(g.streakLost, lang)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{tx(g.streakLostSub, lang)}</div>
              </div>
            </div>
          )}

          {/* Urgency warning */}
          {!data.gmmedToday && data.streak > 0 && !streakLost && (
            <div style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isUrgent ? '#ea580c' : '#78350f'}`,
              borderRadius: '10px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{isUrgent ? '🚨' : '⚠️'}</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: isUrgent ? '#f97316' : '#fbbf24' }}>
                  {tx(g.streakWarning, lang)} {data.streak}{tx(g.streakDays, lang)}
                </div>
              </div>
              <div style={{
                fontSize: '13px', fontWeight: '700', fontFamily: 'monospace',
                color: urgencyColor, background: 'var(--bg-card2)', padding: '4px 10px',
                borderRadius: '6px', border: `1px solid ${urgencyColor}44`,
              }}>
                {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
              </div>
            </div>
          )}

          {/* No streak countdown */}
          {!data.gmmedToday && data.streak === 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'right' }}>
              Streak resets in {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
            </div>
          )}

          {/* Main stats card */}
          <div style={{
            background: data.gmmedToday
              ? 'linear-gradient(135deg, #052e16, #064e3b)'
              : isUrgent
                ? 'linear-gradient(135deg, #1a0800, #2d1000)'
                : 'linear-gradient(135deg, #1c1208, #2d1a00)',
            border: `1px solid ${data.gmmedToday ? '#16a34a' : isUrgent ? '#ea580c' : '#78350f'}`,
            borderRadius: '16px', padding: '20px', transition: 'all 0.5s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: '8px',
                  color: data.gmmedToday ? '#4ade80' : isUrgent ? '#f97316' : '#92400e',
                }}>
                  {data.gmmedToday ? tx(g.activeToday, lang) : 'GM'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '44px', fontWeight: '900', lineHeight: 1, color: urgencyColor, transition: 'color 0.5s' }}>
                      {loading ? '...' : data.streak}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px', color: data.gmmedToday ? '#16a34a' : 'var(--text-muted)' }}>{tx(c.dayStreak, lang)}</div>
                  </div>
                  <div style={{ width: '1px', height: '44px', background: 'var(--border)' }} />
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1, color: '#fbbf24' }}>
                      {loading ? '...' : data.score}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-muted)' }}>score</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '40px' }}>{streakIcon}</div>
            </div>
            {nextMilestoneData && !data.gmmedToday && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {nextMilestoneData.daysLeft} day{nextMilestoneData.daysLeft !== 1 ? 's' : ''} to Day {nextMilestoneData.day} — +{nextMilestoneData.bonus} bonus
              </div>
            )}
          </div>

          {/* Milestones */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{tx(g.milestones, lang)}</div>
            <MilestoneBar streak={data.streak} />
          </div>

          {/* Earned message */}
          {status === 'success' && earnedMsg && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid #16a34a55', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>{tx(g.gmSent, lang)} +{earnedMsg.score}</div>
              {earnedMsg.milestone && (
                <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '4px' }}>
                  Day {earnedMsg.milestone.day} {tx(g.milestone, lang)} +{earnedMsg.milestone.bonus} {tx(g.bonusLabel, lang)}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#f87171' }}>
              {error}
            </div>
          )}

          {/* GM Button — always rendered, never replaced */}
          <div>
            <button
              onClick={handleGM}
              disabled={status === 'sending'}
              style={{
                width: '100%', padding: '16px',
                background: status === 'sending'
                  ? 'var(--bg-card2)'
                  : isUrgent && !data.gmmedToday
                    ? 'linear-gradient(135deg, #dc2626, #ea580c)'
                    : 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '800',
                color: status === 'sending' ? '#475569' : 'white',
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                boxShadow: isUrgent && !data.gmmedToday ? '0 0 20px #ea580c55' : 'none',
                transition: 'all 0.3s',
              }}
            >
              {btnLabel}
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
              {btnHint}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{tx(g.totalGms, lang)}</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{data.totalGms}</div>
            </div>
            {userRank ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{tx(g.yourRank, lang)}</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24' }}>#{userRank.rank}</div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{tx(g.resetsIn, lang)}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: urgencyColor, fontFamily: 'monospace' }}>
                  {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Leaderboard */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {tx(g.leaderboard, lang)}
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)' }}>{tx(g.noScores, lang)}</div>
            ) : leaderboard.map((entry) => {
              const isMe = entry.address === address?.toLowerCase()
              const primary = isMe
                ? (entry.rank === 1 ? `${tx(g.youRank, lang)}1)` : `${tx(g.youRank, lang)}${entry.rank})`)
                : (entry.code ?? `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`)
              const secondary = !isMe && entry.code ? `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}` : null
              return (
                <div key={entry.address} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 16px', borderBottom: '1px solid var(--border)',
                  background: isMe ? 'var(--bg-card2)' : 'transparent',
                  borderLeft: isMe ? '3px solid #22c55e' : '3px solid transparent',
                }}>
                  <span style={{ fontSize: entry.rank <= 3 ? '16px' : '12px', color: 'var(--text-muted)', minWidth: '20px', textAlign: 'center' }}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: isMe ? '700' : '500', color: isMe ? '#4ade80' : 'var(--text-primary)', fontFamily: entry.code || isMe ? 'inherit' : 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {primary}
                    </div>
                    {secondary && (
                      <div style={{ fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', marginTop: '1px' }}>{secondary}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>{entry.score}</div>
                </div>
              )
            })}
          </div>

          {/* Activity feed */}
          {feed.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {tx(g.recentGMs, lang)}
              </div>
              {feed.slice(0, 5).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.address}</div>
                  <div style={{ fontSize: '11px', color: '#f97316' }}>{item.streak > 1 ? `${item.streak}d` : 'GM'}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  )
}
