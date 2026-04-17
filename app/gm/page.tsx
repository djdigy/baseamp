'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { toHex } from 'viem'
import { base } from 'wagmi/chains'
import { BUILDER_CODE, OWNER_ADDRESS, GM_FEE } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'

interface GmData { streak: number; gmmedToday: boolean; score: number; totalGms: number; lastGm: string | null }
interface FeedItem { address: string; streak: number; time: number }
interface LeaderboardEntry { address: string; score: number; rank: number }

const MILESTONES = [3, 5, 7, 14, 30]
const MILESTONE_BONUS: Record<number, number> = { 3: 10, 5: 20, 7: 50, 14: 100, 30: 300 }

function MilestoneBar({ streak }: { streak: number }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {MILESTONES.map(day => {
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
            <div style={{ fontSize: '9px', color: done ? '#f97316' : '#374151' }}>+{MILESTONE_BONUS[day]}</div>
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

export default function GmPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { referrer } = useReferral()

  const [data, setData] = useState<GmData>({ streak: 0, gmmedToday: false, score: 0, totalGms: 0, lastGm: null })
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [earnedMsg, setEarnedMsg] = useState<{ score: number; milestone: { day: number; bonus: number } | null } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      fetch(`/api/gm/streak?address=${address}`).then(r => r.json()),
      fetch('/api/gm/feed').then(r => r.json()),
      fetch('/api/leaderboard').then(r => r.json()),
    ]).then(([streak, feedData, lb]) => {
      setData(streak)
      setFeed(feedData.feed ?? [])
      setLeaderboard(lb.entries ?? [])
    }).finally(() => setLoading(false))
  }, [address])

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(GM_FEE, hasReferral)

  async function handleGM() {
    if (!address || !publicClient || data.gmmedToday) return
    setStatus('sending')
    setError('')
    setEarnedMsg(null)

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

      setData({ streak: result.streak, gmmedToday: true, score: result.score, totalGms: data.totalGms + 1, lastGm: new Date().toISOString().slice(0, 10) })
      setEarnedMsg({ score: result.earned, milestone: result.milestone })

      // Refresh feed + leaderboard
      const [feedRes, lbRes] = await Promise.all([
        fetch('/api/gm/feed').then(r => r.json()),
        fetch('/api/leaderboard').then(r => r.json()),
      ])
      setFeed(feedRes.feed ?? [])
      setLeaderboard(lbRes.entries ?? [])
      setStatus('success')
    } catch (err: any) {
      setError(err.shortMessage || err.message?.slice(0, 80) || 'Transaction failed')
      setStatus('error')
    }
  }

  const userRank = leaderboard.find(e => e.address === address?.toLowerCase())
  const nextMilestone = MILESTONES.find(m => m > data.streak)

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

          {/* Streak + Score card */}
          <div style={{
            background: data.gmmedToday ? 'linear-gradient(135deg, #052e16, #064e3b)' : 'linear-gradient(135deg, #1c1208, #2d1a00)',
            border: `1px solid ${data.gmmedToday ? '#16a34a' : '#78350f'}`,
            borderRadius: '16px', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', color: data.gmmedToday ? '#4ade80' : '#92400e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  {data.gmmedToday ? '✅ GM Sent Today!' : '🔥 Daily GM'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '44px', fontWeight: '900', lineHeight: 1, color: data.gmmedToday ? '#4ade80' : '#f97316' }}>
                      {loading ? '…' : data.streak}
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>day streak</div>
                  </div>
                  <div style={{ width: '1px', height: '44px', background: '#2d2008' }} />
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1, color: '#fbbf24' }}>
                      {loading ? '…' : data.score}
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>score</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '40px' }}>
                {data.streak >= 30 ? '👑' : data.streak >= 7 ? '🔥' : data.streak >= 3 ? '⚡' : '☀'}
              </div>
            </div>
            {nextMilestone && !data.gmmedToday && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#78350f' }}>
                {nextMilestone - data.streak} day{nextMilestone - data.streak !== 1 ? 's' : ''} to Day {nextMilestone} milestone — +{MILESTONE_BONUS[nextMilestone]} bonus
              </div>
            )}
          </div>

          {/* Milestones */}
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Milestones</div>
            <MilestoneBar streak={data.streak} />
          </div>

          {/* Earned */}
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

          {/* GM Button */}
          <button
            onClick={handleGM}
            disabled={data.gmmedToday || status === 'sending'}
            style={{
              width: '100%', padding: '16px',
              background: data.gmmedToday ? '#1a1d27' : status === 'sending' ? '#1a1d27' : 'linear-gradient(135deg, #f97316, #ea580c)',
              border: data.gmmedToday ? '1px solid #22c55e' : 'none',
              borderRadius: '12px', fontSize: '16px', fontWeight: '800',
              color: data.gmmedToday ? '#22c55e' : status === 'sending' ? '#475569' : 'white',
              cursor: data.gmmedToday || status === 'sending' ? 'not-allowed' : 'pointer',
            }}
          >
            {data.gmmedToday ? '✅ Come back tomorrow' : status === 'sending' ? '🌅 Sending...' : '☀ Send GM — earn +5 score'}
          </button>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total GMs</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9' }}>{data.totalGms}</div>
            </div>
            {userRank && (
              <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Your Rank</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24' }}>#{userRank.rank}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Leaderboard */}
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d27', fontSize: '12px', fontWeight: '700', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏆 Leaderboard
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#374151' }}>
                No scores yet — be first!
              </div>
            ) : leaderboard.map((entry) => {
              const isMe = entry.address === address?.toLowerCase()
              return (
                <div key={entry.address} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 16px',
                  borderBottom: '1px solid #1a1d2744',
                  background: isMe ? '#1e2a1e' : 'transparent',
                  borderLeft: isMe ? '3px solid #22c55e' : '3px solid transparent',
                }}>
                  <RankBadge rank={entry.rank} />
                  <div style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace', color: isMe ? '#4ade80' : '#94a3b8' }}>
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                    {isMe && <span style={{ fontSize: '10px', marginLeft: '4px', color: '#16a34a' }}>(you)</span>}
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
                  <div style={{ fontSize: '11px', color: '#f97316' }}>
                    {item.streak > 1 ? `🔥 ${item.streak}d` : '☀'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
