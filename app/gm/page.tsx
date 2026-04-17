'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { toHex } from 'viem'
import { base } from 'wagmi/chains'
import { BUILDER_CODE, OWNER_ADDRESS, GM_FEE } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'

interface GmData {
  streak: number
  gmmedToday: boolean
  score: number
  totalGms: number
  lastGm: string | null
}

interface FeedItem { address: string; streak: number; time: number }

const MILESTONES = [3, 5, 7, 14, 30]
const MILESTONE_BONUS: Record<number, number> = { 3: 10, 5: 20, 7: 50, 14: 100, 30: 300 }

function MilestoneBar({ streak }: { streak: number }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {MILESTONES.map(day => {
        const done = streak >= day
        const current = streak === day
        return (
          <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: done ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1a1d27',
              border: `2px solid ${done ? '#f97316' : '#2d3148'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px',
              boxShadow: current ? '0 0 12px #f97316aa' : 'none',
              transition: 'all 0.3s',
            }}>
              {done ? '✓' : day}
            </div>
            <div style={{ fontSize: '9px', color: done ? '#f97316' : '#374151' }}>
              +{MILESTONE_BONUS[day]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function GmPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { referrer } = useReferral()

  const [data, setData] = useState<GmData>({ streak: 0, gmmedToday: false, score: 0, totalGms: 0, lastGm: null })
  const [feed, setFeed] = useState<FeedItem[]>([])
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
    ]).then(([streak, feedData]) => {
      setData(streak)
      setFeed(feedData.feed ?? [])
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

      // Refresh feed
      const feedRes = await fetch('/api/gm/feed').then(r => r.json())
      setFeed(feedRes.feed ?? [])
      setStatus('success')
    } catch (err: any) {
      setError(err.shortMessage || err.message?.slice(0, 80) || 'Transaction failed')
      setStatus('error')
    }
  }

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

  const nextMilestone = MILESTONES.find(m => m > data.streak)

  return (
    <AppLayout title="GM">
      <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Score + Streak header */}
        <div style={{
          background: data.gmmedToday ? 'linear-gradient(135deg, #052e16, #064e3b)' : 'linear-gradient(135deg, #1c1208, #2d1a00)',
          border: `1px solid ${data.gmmedToday ? '#16a34a' : '#78350f'}`,
          borderRadius: '16px', padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', color: data.gmmedToday ? '#4ade80' : '#92400e', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {data.gmmedToday ? '✅ GM Sent Today!' : '🔥 Daily GM'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '40px', fontWeight: '900', lineHeight: 1, color: data.gmmedToday ? '#4ade80' : '#f97316' }}>
                    {loading ? '...' : data.streak}
                  </div>
                  <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>day streak</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: '#2d2008' }} />
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1, color: '#fbbf24' }}>
                    {loading ? '...' : data.score}
                  </div>
                  <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>score</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '36px' }}>
              {data.streak >= 30 ? '👑' : data.streak >= 7 ? '🔥' : data.streak >= 3 ? '⚡' : '☀'}
            </div>
          </div>

          {/* Next milestone hint */}
          {nextMilestone && !data.gmmedToday && (
            <div style={{ marginTop: '12px', fontSize: '11px', color: '#78350f' }}>
              {nextMilestone - data.streak} more day{nextMilestone - data.streak !== 1 ? 's' : ''} to Day {nextMilestone} — +{MILESTONE_BONUS[nextMilestone]} bonus score
            </div>
          )}
        </div>

        {/* Milestone bar */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Milestones
          </div>
          <MilestoneBar streak={data.streak} />
        </div>

        {/* Earned message */}
        {status === 'success' && earnedMsg && (
          <div style={{ background: '#052e16', border: '1px solid #16a34a', borderRadius: '10px', padding: '14px 16px', animation: 'fadeIn 0.3s' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>
              GM sent 🚀 +{earnedMsg.score} score
            </div>
            {earnedMsg.milestone && (
              <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '4px' }}>
                🎉 Day {earnedMsg.milestone.day} milestone! +{earnedMsg.milestone.bonus} bonus
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {status === 'error' && error && (
          <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#f87171' }}>
            ❌ {error}
          </div>
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
          {data.gmmedToday ? '✅ Come back tomorrow' : status === 'sending' ? '🌅 Sending...' : `☀ Send GM — earn +5 score`}
        </button>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total GMs</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9' }}>{data.totalGms}</div>
          </div>
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Score</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24' }}>{data.score}</div>
          </div>
        </div>

        {/* Recent activity feed */}
        {feed.length > 0 && (
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Recent GMs
            </div>
            {feed.slice(0, 5).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < Math.min(feed.length, 5) - 1 ? '1px solid #1a1d2744' : 'none' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{item.address}</div>
                <div style={{ fontSize: '11px', color: '#f97316' }}>
                  {item.streak > 1 ? `🔥 ${item.streak} day streak` : '☀ GM'}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  )
}
