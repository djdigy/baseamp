'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getNextMilestone } from '@/lib/gm'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'

interface WalletStats {
  txCount: number; activeDays: number; uniqueContracts: number
  currentStreak: number; gasEth: number; lastActivity: string | null
  firstActivity: string | null; walletAge: number; builderScore: number
}
interface GmStatus    { streak: number; gmmedToday: boolean; score: number }
interface LbEntry     { address: string; score: number; rank: number }
interface FeedItem    { address: string; streak: number; time: number }

function AnalyticCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Leaderboard component — works with or without wallet
function PublicLeaderboard({ entries, myAddress }: { entries: LbEntry[]; myAddress?: string }) {
  const MEDALS = ['🥇', '🥈', '🥉']
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>🏆 Leaderboard</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
      </div>
      {entries.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)' }}>No scores yet — be first!</div>
      ) : entries.map(e => {
        const isMe = myAddress && e.address === myAddress.toLowerCase()
        return (
          <div key={e.address} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            background: isMe ? 'rgba(59,130,246,0.06)' : 'transparent',
            borderLeft: isMe ? '3px solid #3b82f6' : '3px solid transparent',
          }}>
            <span style={{ fontSize: e.rank <= 3 ? '16px' : '12px', color: 'var(--text-muted)', minWidth: '22px', textAlign: 'center' }}>
              {e.rank <= 3 ? MEDALS[e.rank - 1] : `#${e.rank}`}
            </span>
            <div style={{ flex: 1, fontSize: '12px', fontWeight: isMe ? '700' : '500', color: isMe ? '#3b82f6' : 'var(--text-primary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isMe ? `You (${e.address.slice(0,6)}…${e.address.slice(-4)})` : `${e.address.slice(0,6)}…${e.address.slice(-4)}`}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: e.rank === 1 ? '#f59e0b' : e.rank === 2 ? '#94a3b8' : e.rank === 3 ? '#b45309' : 'var(--text-primary)' }}>{e.score}</div>
          </div>
        )
      })}
    </div>
  )
}

// Activity feed — works with or without wallet
function ActivityFeed({ feed }: { feed: FeedItem[] }) {
  if (!feed.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
        ⚡ Recent GM Activity
      </div>
      {feed.slice(0, 8).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: i < feed.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.address}</span>
            {item.streak > 1 && <span style={{ fontSize: '10px', color: '#f97316', fontWeight: '700', background: 'rgba(249,115,22,0.1)', padding: '1px 6px', borderRadius: '99px' }}>{item.streak}d streak</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '700' }}>GM</span>
            <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{timeAgo(item.time)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { lang } = useLang()
  const [stats, setStats]       = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus] = useState<GmStatus | null>(null)
  const [loading, setLoading]   = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [lbEntries, setLbEntries] = useState<LbEntry[]>([])
  const [feed, setFeed]           = useState<FeedItem[]>([])

  const d = TEXT.dashboard
  const c = TEXT.common

  // Always load public data (leaderboard + feed) — no wallet needed
  useEffect(() => {
    Promise.all([
      fetch('/api/leaderboard').then(r => r.json()).catch(() => ({ entries: [] })),
      fetch('/api/gm/feed').then(r => r.json()).catch(() => ({ feed: [] })),
    ]).then(([lb, f]) => {
      setLbEntries(lb.entries ?? [])
      setFeed(f.feed ?? [])
    })
  }, [])

  // Load wallet-specific data when connected
  async function loadData(bust = false) {
    if (!address) return
    setLoading(true)
    const statsUrl = `/api/wallet-stats?address=${address}${bust ? '&refresh=1' : ''}`
    Promise.all([
      fetch(statsUrl).then(r => r.json()),
      fetch(`/api/gm/streak?address=${address}`).then(r => r.json()),
    ]).then(([walletData, gmData]) => {
      setStats(walletData)
      setGmStatus(gmData)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData(true) }, [address])

  // ── NOT CONNECTED — full landing page ─────────────────────────────────────
  if (!isConnected) {
    return (
      <AppLayout title="BaseAmp">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '680px' }}>

          {/* Hero */}
          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Base Network Dashboard</div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', lineHeight: 1.2, marginBottom: '10px', letterSpacing: '-0.5px' }}>
              Build streak.<br />Earn visibility.<br />Real onchain signal.
            </h1>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.65', marginBottom: '22px', maxWidth: '400px', margin: '0 auto 22px' }}>
              Send a daily GM transaction on Base. Consistent daily activity is the strongest signal for airdrop eligibility.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/gm" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', color: 'white', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
                  Start your streak →
                </button>
              </Link>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button onClick={openConnectModal} style={{ padding: '13px 22px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#334155', cursor: 'pointer' }}>
                    Connect wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Active users', value: lbEntries.length > 0 ? `${lbEntries.length}+` : '—', icon: '👥' },
              { label: 'Recent GMs', value: feed.length > 0 ? `${feed.length}` : '—', icon: '⚡' },
              { label: 'Top streak score', value: lbEntries[0] ? String(lbEntries[0].score) : '—', icon: '🔥' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>How it works</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { n: '1', text: 'Send a daily GM transaction — tiny fee, real onchain footprint', color: '#dc2626' },
                { n: '2', text: 'Build streak — every day you stay active, your streak grows', color: '#dc2626' },
                { n: '3', text: 'Miss a day → streak resets. Consistency is the signal.', color: '#dc2626' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'white', flexShrink: 0 }}>{s.n}</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.55', paddingTop: '3px' }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard — always visible */}
          <PublicLeaderboard entries={lbEntries} />

          {/* Activity feed — always visible */}
          <ActivityFeed feed={feed} />

          {/* Bottom CTA */}
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803d', marginBottom: '6px' }}>Ready to start?</div>
            <div style={{ fontSize: '12px', color: '#166534', marginBottom: '14px' }}>Connect your wallet and send your first GM in 30 seconds.</div>
            <Link href="/gm" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '12px 24px', background: '#16a34a', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', color: 'white', cursor: 'pointer' }}>
                Send GM now →
              </button>
            </Link>
          </div>

        </div>
      </AppLayout>
    )
  }

  // ── CONNECTED — personal dashboard ────────────────────────────────────────
  const gmmedToday = gmStatus?.gmmedToday ?? false
  const streak     = gmStatus?.streak ?? 0
  const milestone  = getNextMilestone(streak)
  const totalScore = gmStatus?.score ?? 0
  const done: Record<string, boolean> = { gm: gmmedToday, swap: false, earn: false, deploy: false }
  const V = (v: number | null | undefined) => loading ? '...' : v != null ? String(v) : '—'

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── 1. AIRDROP GUIDE (compact) ───────────────────────────────── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.3px' }}>
            {tx(d.guideTitle, lang)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.75', marginBottom: '14px', whiteSpace: 'pre-line' }}>
            {tx(d.guideWhy, lang)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {([d.guidePrinciple1, d.guidePrinciple2, d.guidePrinciple3] as const).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#3b82f6', fontWeight: '700', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>{i + 1}.</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>{tx(p, lang)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setGuideOpen(o => !o)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {tx(d.guideCta, lang)} {guideOpen ? '▲' : '▼'}
          </button>
          {guideOpen && (
            <div style={{ marginTop: '12px', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {tx(d.guideDetailTitle, lang)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {d.guideDetailItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <span style={{ color: '#60a5fa', flexShrink: 0 }}>→</span>
                    <span>{tx(item, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 2. STEP FLOW ─────────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>
            {lang === 'tr' ? (
              <>Bu <span style={{ color: '#dc2626', fontWeight: '700' }}>5 adım</span> <span style={{ color: '#dc2626', fontWeight: '700' }}>temel aktivite döngündür</span>. Hepsini aynı anda değil — zamanla ve düzenli olarak yap.</>
            ) : (
              <>These <span style={{ color: '#dc2626', fontWeight: '700' }}>5 steps</span> are your <span style={{ color: '#dc2626', fontWeight: '700' }}>core activity loop</span>. Do them consistently over time — not all at once.</>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
            {d.steps.map(step => {
              const isDone = done[step.doneKey]
              const title  = lang === 'tr' ? step.tr_title : step.en_title
              const sub    = lang === 'tr' ? step.tr_sub   : step.en_sub
              const cta    = lang === 'tr' ? step.tr_cta   : step.en_cta
              return (
                <div key={step.doneKey}>
                  <Link href={step.href} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--bg-card)', border: `1px solid ${isDone ? '#16a34a55' : 'var(--border)'}`, borderRadius: '10px', padding: '14px 12px', cursor: 'pointer', position: 'relative' }}>
                      {isDone && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white' }}>✓</div>}
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isDone ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '10px' }}>{step.n}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '8px' }}>{sub}</div>
                      <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: '600' }}>{cta}</div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 3. BOOST BLOCK ───────────────────────────────────────────── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{tx(d.boostTitle, lang)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>{tx(d.boostDesc, lang)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
            {d.boostItems.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-faint)', flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: '12px', color: '#60a5fa', lineHeight: '1.4' }}>{lang === 'tr' ? item.tr : item.en} ↗</span>
              </a>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#f97316', fontWeight: '600' }}>👉 {tx(d.boostNote, lang)}</div>
        </div>

        {/* ── 4. WALLET ANALYTICS ──────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{tx(d.analyticsTitle, lang)}</span>
            <button onClick={() => loadData(true)} disabled={loading} style={{ fontSize: '10px', color: loading ? 'var(--text-faint)' : '#60a5fa', background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', padding: '0', fontWeight: '600' }}>
              {loading ? tx(c.loading, lang) : lang === 'tr' ? 'Yenile ↻' : 'Refresh ↻'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '8px' }}>
            <AnalyticCard label={tx(d.totalTx, lang)}         value={V(stats?.txCount)}       sub={tx(c.onBase, lang)} />
            <AnalyticCard label={tx(d.activeDays, lang)}      value={V(stats?.activeDays)}    sub={stats?.walletAge ? `${stats.walletAge} ${tx(c.days, lang)} ${tx(c.since, lang)}` : undefined} />
            <AnalyticCard label={tx(d.currentStreak, lang)}   value={V(stats?.currentStreak)} sub={tx(c.dayStreak, lang)} />
            <AnalyticCard label={tx(d.uniqueContracts, lang)} value={V(stats?.uniqueContracts)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <AnalyticCard label={tx(d.gasUsed, lang)}      value={loading ? '...' : stats?.gasEth != null ? stats.gasEth.toFixed(4) : '—'} />
            <AnalyticCard label={tx(d.lastActivity, lang)} value={loading ? '...' : (stats?.lastActivity ?? '—')} />
            <AnalyticCard label={tx(d.builderScore, lang)} value={V(stats?.builderScore)} />
            <AnalyticCard label={tx(d.gmScore, lang)}      value={loading ? '...' : (totalScore?.toString() ?? '—')} sub={streak > 0 ? `${streak} ${tx(c.dayStreak, lang)}` : undefined} />
          </div>
          {streak > 0 && !gmmedToday && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#1c0a00', border: '1px solid #7c2d12', borderRadius: '8px', fontSize: '12px', color: '#fb923c', fontWeight: '600' }}>
              ⚡ {streak} {tx(c.dayStreak, lang)} — {tx(d.streakWarningMsg, lang)}
            </div>
          )}
          {!loading && stats && stats.txCount === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-faint)', paddingTop: '8px', lineHeight: '1.6' }}>
              {lang === 'tr' ? 'Bu cüzdanda Base üzerinde işlem bulunamadı. GM göndererek aktiviteni başlatabilirsin.' : 'No transactions found on Base. Send your first GM to start building activity.'}
            </div>
          )}
        </div>

        {/* ── 5. PUBLIC LEADERBOARD ────────────────────────────────────── */}
        <PublicLeaderboard entries={lbEntries} myAddress={address} />

        {/* ── 6. ACTIVITY FEED ─────────────────────────────────────────── */}
        <ActivityFeed feed={feed} />

        {/* ── 7. WALLET ────────────────────────────────────────────────── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{address?.slice(0, 8)}…{address?.slice(-6)}</div>
            {streak > 0 && <div style={{ fontSize: '11px', color: '#f97316', fontWeight: '600' }}>{streak} {tx(c.dayStreak, lang)}{milestone ? ` — ${milestone.daysLeft}d to Day ${milestone.day}` : ''}</div>}
            {gmmedToday && <div style={{ fontSize: '11px', color: '#4ade80' }}>✓ GM</div>}
          </div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '5px 10px', background: 'var(--bg-card2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            {tx(c.basescan, lang)}
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
