'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { toHex } from 'viem'
import { base } from 'wagmi/chains'
import { BUILDER_CODE, OWNER_ADDRESS, GM_FEE } from '@/lib/constants'
import { getNextMilestone, getMilestones } from '@/lib/gm'
import { useReferral, calculateFee } from '@/hooks/useReferral'

interface GmData { streak: number; gmmedToday: boolean; score: number; totalGms: number; lastGm: string | null }
interface FeedItem { address: string; streak: number; time: number }
interface LeaderboardEntry { address: string; score: number; rank: number }


// Time until midnight UTC (streak reset)
function getTimeUntilReset(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: '16px' }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: '16px' }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: '16px' }}>🥉</span>
  return <span style={{ fontSize: '12px', color: '#475569', minWidth: '20px', textAlign: 'center' }}>#{rank}</span>
}

// Urgency color based on hours left
function getUrgencyColor(totalSeconds: number, gmmedToday: boolean): string {
  if (gmmedToday) return '#4ade80'
  if (totalSeconds < 3600) return '#ef4444'   // < 1h: red
  if (totalSeconds < 10800) return '#f97316'  // < 3h: orange
  return '#fbbf24'                             // default: yellow
}

export default function GmPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { referrer } = useReferral()
  const countdown = useCountdown()

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
    ]).then(([streak, feedData, lb]) => {
      // Detect streak loss: had streak > 0, now streak = 0 or 1 but lastGm is not yesterday
      if (prevStreakRef.current !== null && prevStreakRef.current > 1 && streak.streak === 1 && !streak.gmmedToday) {
        setStreakLost(true)
      }
      prevStreakRef.current = streak.streak
      setData(streak)
      setFeed(feedData.feed ?? [])
      setLeaderboard(lb.entries ?? [])
    }).finally(() => setLoading(false))
  }, [address])

  // Check streak loss on load: if lastGm is before yesterday, streak should have reset
  useEffect(() => {
    if (!data.lastGm || data.gmmedToday || data.streak === 0) return
    const lastGmDate = new Date(data.lastGm)
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    const lastGmStr = data.lastGm
    // If lastGm is before yesterday and streak > 0 → streak was just lost
    if (lastGmStr < yesterdayStr && prevStreakRef.current !== null && prevStreakRef.current > 1) {
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
      const hash = await sendTransactionAsync({
        to: OWNER_ADDRESS,
        value: fee,
        data: toHex(new TextEncoder().encode(BUILDER_CODE)) as `0x${string}`,
        chainId: base.id,
      })
      await publicClient.waitForTransactionReceipt({ hash })

      const res = await fetch(`/api/gm/record?address=${address}`, { method: 'POST' })
      const result = await res.json()

      setData(prev => ({ ...prev, streak: result.streak, gmmedToday: true, score: result.score, totalGms: prev.totalGms + 1, lastGm: new Date().toISOString().slice(0, 10) }))
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
          <div style={{ fontSize: '48px' }}>☀</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Connect your wallet</div>
          <div style={{ fontSize: '14px', color: '#475569' }}>Send daily GM and earn score</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="GM">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Streak loss banner */}
          {streakLost && !data.gmmedToday && (
            <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💔</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f87171' }}>Streak lost. Start again 🔁</div>
                <div style={{ fontSize: '11px', color: '#7f1d1d', marginTop: '2px' }}>Send GM today to begin a new streak</div>
              </div>
            </div>
          )}

          {/* Warning: hasn't sent GM today + has active streak */}
          {!data.gmmedToday && data.streak > 0 && !streakLost && (
            <div style={{
              background: isUrgent ? '#1a0d00' : '#1a1208',
              border: `1px solid ${isUrgent ? '#ea580c' : '#78350f'}`,
              borderRadius: '10px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{isUrgent ? '🚨' : '⚠️'}</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: isUrgent ? '#f97316' : '#fbbf24' }}>
                  Send GM today or lose your {data.streak}-day streak
                </div>
              </div>
              <div style={{
                fontSize: '13px', fontWeight: '700', fontFamily: 'monospace',
                color: urgencyColor,
                background: '#0a0b0f', padding: '4px 10px', borderRadius: '6px',
                border: `1px solid ${urgencyColor}44`,
              }}>
                {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
              </div>
            </div>
          )}

          {/* Streak resets in X — shown when no streak at risk */}
          {!data.gmmedToday && data.streak === 0 && (
            <div style={{ fontSize: '11px', color: '#374151', textAlign: 'right' }}>
              Streak resets in {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
            </div>
          )}

          {/* Main card */}
          <div style={{
            background: data.gmmedToday ? 'linear-gradient(135deg, #052e16, #064e3b)' : isUrgent ? 'linear-gradient(135deg, #1a0800, #2d1000)' : 'linear-gradient(135deg, #1c1208, #2d1a00)',
            border: `1px solid ${data.gmmedToday ? '#16a34a' : isUrgent ? '#ea580c' : '#78350f'}`,
            borderRadius: '16px', padding: '20px',
            transition: 'all 0.5s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', color: data.gmmedToday ? '#4ade80' : isUrgent ? '#f97316' : '#92400e' }}>
                  {data.gmmedToday ? '✅ You're active today' : '🔥 Daily GM'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '44px', fontWeight: '900', lineHeight: 1, color: urgencyColor, transition: 'color 0.5s' }}>
                      {loading ? '…' : data.streak}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px', color: data.gmmedToday ? '#16a34a' : '#78350f' }}>day streak</div>
                  </div>
                  <div style={{ width: '1px', height: '44px', background: '#2d2008' }} />
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1, color: '#fbbf24' }}>
                      {loading ? '…' : data.score}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px', color: '#78350f' }}>score</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '40px' }}>
                {data.gmmedToday ? '✅' : isUrgent ? '⏳' : data.streak >= 30 ? '👑' : data.streak >= 7 ? '🔥' : data.streak >= 3 ? '⚡' : '☀'}
              </div>
            </div>
            {nextMilestoneData && !data.gmmedToday && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#78350f' }}>
                {nextMilestoneData.daysLeft} day{nextMilestoneData.daysLeft !== 1 ? 's' : ''} to Day {nextMilestoneData.day} — +{nextMilestoneData.bonus} bonus
              </div>
            )}
          </div>

          {/* Milestones */}
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Milestones</div>
            <MilestoneBar streak={data.streak} />
          </div>

          {/* Earned message */}
          {status === 'success' && earnedMsg && (
            <div style={{ background: '#052e16', border: '1px solid #16a34a', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>GM sent 🚀 +{earnedMsg.score} score</div>
              {earnedMsg.milestone && (
                <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '4px' }}>
                  🎉 Day {earnedMsg.milestone.day} milestone! +{earnedMsg.milestone.bonus} bonus
                </div>
              )}
            </div>
          )}

          {status === 'error' && error && (
            <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#f87171' }}>❌ {error}</div>
          )}

          {/* GM Button — always rendered, never replaced */}
          <div>
            <button
              onClick={handleGM}
              disabled={status === 'sending'}
              style={{
                width: '100%', padding: '16px',
                background: status === 'sending' ? '#1a1d27'
                  : isUrgent && !data.gmmedToday ? 'linear-gradient(135deg, #dc2626, #ea580c)'
                  : 'linear-gradient(135deg, #f97316, #ea580c)',
                border: 'none',
                borderRadius: '12px', fontSize: '16px', fontWeight: '800',
                color: status === 'sending' ? '#475569' : 'white',
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                boxShadow: isUrgent && !data.gmmedToday ? '0 0 20px #ea580c55' : 'none',
                transition: 'all 0.3s',
              }}
            >
              {status === 'sending' ? '🌅 Sending...'
                : isUrgent && !data.gmmedToday ? '🚨 Send GM now — streak at risk!'
                : data.gmmedToday ? '☀ Send another GM (+1 score)'
                : '☀ Send GM — earn +5 score'}
            </button>
            <div style={{ fontSize: '11px', color: '#475569', textAlign: 'center', marginTop: '6px' }}>
              {data.gmmedToday
                ? "You're active today — keep going (+1 per GM)"
                : 'Unlimited GM — only your first one counts for streak'}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total GMs</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9' }}>{data.totalGms}</div>
            </div>
            {userRank ? (
              <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Your Rank</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24' }}>#{userRank.rank}</div>
              </div>
            ) : (
              <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Resets in</div>
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
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d27', fontSize: '12px', fontWeight: '700', color: '#d1d5db' }}>
              🏆 Leaderboard
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#374151' }}>No scores yet — be first!</div>
            ) : leaderboard.map((entry) => {
              const isMe = entry.address === address?.toLowerCase()
              const label = isMe
                ? (entry.rank === 1 ? "You're #1 — for now" : 'You')
                : `Player #${entry.rank}`
              return (
                <div key={entry.address} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 16px', borderBottom: '1px solid #1a1d2744',
                  background: isMe ? '#1e2a1e' : 'transparent',
                  borderLeft: isMe ? '3px solid #22c55e' : '3px solid transparent',
                }}>
                  <RankBadge rank={entry.rank} />
                  <div style={{ flex: 1, fontSize: '12px', fontWeight: isMe ? '700' : '400', color: isMe ? '#4ade80' : '#94a3b8' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>{entry.score}</div>
                </div>
              )
            })}
          </div>

          {/* Activity feed */}
          {feed.length > 0 && (
            <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d27', fontSize: '12px', fontWeight: '700', color: '#d1d5db' }}>
                Recent GMs
              </div>
              {feed.slice(0, 5).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: i < 4 ? '1px solid #1a1d2744' : 'none' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{item.address}</div>
                  <div style={{ fontSize: '11px', color: '#f97316' }}>{item.streak > 1 ? `🔥 ${item.streak}d` : '☀'}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  )
}
