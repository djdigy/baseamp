'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useSendTransaction, usePublicClient, useConnect } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'
import { BUILDER_CODE, PLATFORM_ADDRESS, GM_FEE, buildERC8021Data } from '@/lib/constants'
import { getNextMilestone, getMilestones } from '@/lib/gm'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'
import { isBaseAppBrowser } from '@/lib/baseapp'

interface GmData {
  streak: number
  gmmedToday: boolean
  score: number
  totalGms: number
  validGms: number    // only first-of-day GMs
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
  const { connect, connectors } = useConnect()
  const countdown = useCountdown()
  const { lang } = useLang()
  const g = TEXT.gm
  const c = TEXT.common

  const [data, setData] = useState<GmData>({ streak: 0, gmmedToday: false, score: 0, totalGms: 0, validGms: 0, lastGm: null })
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [earnedMsg, setEarnedMsg] = useState<{ score: number; milestone: { day: number; bonus: number } | null; isFirstToday: boolean } | null>(null)
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

  const urgencyColor = getUrgencyColor(countdown.totalSeconds, data.gmmedToday)
  const isUrgent = !data.gmmedToday && data.streak > 0 && countdown.totalSeconds < 10800

  async function handleGM() {
    if (!address || !publicClient || status === 'sending') return
    setStatus('sending')
    setError('')
    setEarnedMsg(null)
    setStreakLost(false)

    try {
      // Build ERC-8021 compliant data:
      // format: [builder_code_utf8][length][schema_id=0x00][ERC_sentinel]
      // = 0x62635f67726a693537366d 0b 00 80218021802180218021802180218021
      const txData = buildERC8021Data()
      console.log('[BaseAmp] GM TX data (ERC-8021):', txData, '| bytes:', (txData.length - 2) / 2)

      const hash = await sendTransactionAsync({
        to: PLATFORM_ADDRESS,
        value: GM_FEE,
        data: txData,
        chainId: base.id,
      })
      await publicClient.waitForTransactionReceipt({ hash })

      const res = await fetch(`/api/gm/record?address=${address}`, { method: 'POST' })
      const result = await res.json()

      // Handle spam protection (429 too fast)
      if (res.status === 429) {
        setError(lang === 'tr' ? 'Çok hızlı — birkaç saniye bekle' : 'Too fast — wait a few seconds')
        setStatus('error')
        return
      }

      const wasFirstToday = result.isFirstToday

      setData(prev => ({
        ...prev,
        streak: result.streak,
        gmmedToday: true,
        score: result.score,
        totalGms: result.totalGms ?? prev.totalGms + 1,
        validGms: result.validGms ?? (wasFirstToday ? (prev.validGms ?? 0) + 1 : prev.validGms ?? 0),
        lastGm: new Date().toISOString().slice(0, 10),
      }))
      setEarnedMsg({
        score: result.earned,
        milestone: result.milestone,
        isFirstToday: wasFirstToday,
      })

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
  const inBaseApp = typeof window !== 'undefined' && isBaseAppBrowser()

  if (!isConnected) {
    return (
      <AppLayout title="GM">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px', padding: '0 16px' }}>
          <div style={{ fontSize: '56px', lineHeight: 1 }}>☀</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>BaseAmp</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {inBaseApp
                ? (lang === 'tr' ? 'Cüzdanını bağla ve GM göndermeye başla' : 'Connect your wallet to start sending GM')
                : tx(g.connectSub, lang)}
            </div>
          </div>
          {inBaseApp ? (
            <button
              onClick={() => {
                const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'coinbaseWallet')
                if (injectedConnector) connect({ connector: injectedConnector, chainId: 8453 })
              }}
              style={{ padding: '16px 48px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: '800', color: 'white', cursor: 'pointer', width: '100%', maxWidth: '320px' }}
            >
              {lang === 'tr' ? 'Bağlan' : 'Connect Wallet'}
            </button>
          ) : (
            <ConnectButton />
          )}
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
    ? (lang === 'tr' ? 'Bugünkü ana GM kaydedildi' : "Today's main GM recorded")
    : (lang === 'tr' ? 'Günlük ilk işlem streak için sayılır' : 'First daily TX counts for streak')

  const streakIcon = data.gmmedToday ? '✅'
    : isUrgent ? '⏳'
    : data.streak >= 30 ? '👑'
    : data.streak >= 7 ? '🔥'
    : data.streak >= 3 ? '⚡'
    : '☀'

  return (
    <AppLayout title="GM">
      {/* BaseApp / Mobile: prominent single-button layout at top */}
      {inBaseApp && (
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Streak badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: data.gmmedToday ? 'linear-gradient(135deg,#052e16,#064e3b)' : 'var(--bg-card)', border: `1px solid ${data.gmmedToday ? '#16a34a' : isUrgent ? '#ea580c' : 'var(--border)'}`, borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{streakIcon}</span>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: urgencyColor, lineHeight: 1 }}>{loading ? '...' : data.streak} {tx(c.dayStreak, lang)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>score: {data.score}</div>
              </div>
            </div>
            {!data.gmmedToday && data.streak > 0 && (
              <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', color: urgencyColor }}>
                {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
              </div>
            )}
          </div>

          {/* THE BUTTON — full width, large, immediate */}
          <button
            onClick={handleGM}
            disabled={status === 'sending'}
            style={{
              width: '100%', padding: '20px',
              background: status === 'sending' ? 'var(--bg-card2)' : isUrgent && !data.gmmedToday ? 'linear-gradient(135deg,#dc2626,#ea580c)' : 'linear-gradient(135deg,#f97316,#ea580c)',
              border: 'none', borderRadius: '16px',
              fontSize: '20px', fontWeight: '900', color: status === 'sending' ? '#475569' : 'white',
              cursor: status === 'sending' ? 'not-allowed' : 'pointer',
              boxShadow: isUrgent && !data.gmmedToday ? '0 0 24px #ea580c55' : '0 4px 20px rgba(249,115,22,0.3)',
              transition: 'all 0.2s',
              letterSpacing: '-0.3px',
            }}
          >
            {status === 'sending' ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') : btnLabel}
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>{btnHint}</div>

          {/* Post-GM message */}
          {status === 'success' && earnedMsg && (
            <div style={{ background: earnedMsg.isFirstToday ? '#052e16' : 'var(--bg-card)', border: `1px solid ${earnedMsg.isFirstToday ? '#16a34a' : '#1e3a5f'}`, borderRadius: '10px', padding: '12px 14px' }}>
              {earnedMsg.isFirstToday ? (
                <>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#4ade80' }}>{lang === 'tr' ? '✓ Bugünkü ana GM tamamlandı' : "✓ Today's main GM done"} +{earnedMsg.score}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{lang === 'tr' ? 'Aktivite kaydedildi.' : 'Activity recorded.'}</div>
                </>
              ) : (
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa' }}>{lang === 'tr' ? 'Ekstra GM gönderildi' : 'Extra GM sent'} +{earnedMsg.score}</div>
              )}
            </div>
          )}
          {status === 'error' && error && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#f87171' }}>{error}</div>
          )}
          <div style={{ width: '100%', height: '1px', background: 'var(--border)' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,320px)', gap: '16px', alignItems: 'start' }}>
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
            <div style={{ background: earnedMsg.isFirstToday ? 'var(--bg-card)' : 'var(--bg-card)', border: `1px solid ${earnedMsg.isFirstToday ? '#16a34a55' : '#1e3a5f'}`, borderRadius: '10px', padding: '14px 16px' }}>
              {earnedMsg.isFirstToday ? (
                <>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#4ade80', marginBottom: '4px' }}>
                    {lang === 'tr' ? '✓ Bugünkü ana GM tamamlandı' : '✓ Today\'s main GM is done'} +{earnedMsg.score}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {lang === 'tr'
                      ? 'İstersen ekstra işlem yapabilirsin, ancak ana aktivite kaydedildi.'
                      : 'You can send more, but your main activity is already recorded.'}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa', marginBottom: '2px' }}>
                    {lang === 'tr' ? 'Ekstra GM gönderildi' : 'Extra GM sent'} +{earnedMsg.score}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {lang === 'tr'
                      ? 'Streak ve referral için bugünkü ilk GM geçerlidir.'
                      : 'Only your first GM today counts for streak and referral.'}
                  </div>
                </>
              )}
              {earnedMsg.milestone && earnedMsg.isFirstToday && (
                <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '6px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{tx(g.totalGms, lang)}</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{data.totalGms}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px' }}>
                {lang === 'tr' ? `${data.validGms ?? 0} geçerli` : `${data.validGms ?? 0} valid`}
              </div>
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
