'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface WalletStats {
  txCount: number
  activeDays: number
  builderScore: number
  firstTx: string | null
}

interface GmStatus {
  streak: number
  gmmedToday: boolean
  score: number
}

interface ReferralStatus {
  totalReferrals: number
  dailyEarnings: number
}

// ── Translations ────────────────────────────────────────────────────────────
const T = {
  en: {
    todayAction:    "Today's action",
    sendGm:         'Send GM (+5 score)',
    streakSecured:  'Streak secured for today 🔒',
    comeBack:       'Come back tomorrow',
    skipWarning:    'Skip today → streak resets',
    progress:       'Progress',
    actions:        'Actions',
    stats:          'Stats',
  },
  tr: {
    todayAction:    'Günün görevi',
    sendGm:         'GM Gönder (+5 puan)',
    streakSecured:  'Bugünkü seri güvende 🔒',
    comeBack:       'Yarın geri dön',
    skipWarning:    'Bugün atla → serin sıfırlanır',
    progress:       'İlerleme',
    actions:        'Eylemler',
    stats:          'İstatistikler',
  },
} as const
type Lang = keyof typeof T

// Milestones for bonus hint
const MILESTONES = [3, 5, 7, 14, 30, 60, 100]
const MILESTONE_BONUS: Record<number, number> = { 3: 10, 5: 20, 7: 50, 14: 100, 30: 300, 60: 500, 100: 1000 }

function nextMilestone(streak: number) {
  const next = MILESTONES.find(m => m > streak)
  if (!next) return null
  return { day: next, daysLeft: next - streak, bonus: MILESTONE_BONUS[next] }
}

// ── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: accent || 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

// ── Language toggle ─────────────────────────────────────────────────────────
function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  function toggle() {
    const next: Lang = lang === 'en' ? 'tr' : 'en'
    setLang(next)
    try { localStorage.setItem('ba_lang', next) } catch (_) {}
  }
  return (
    <button onClick={toggle} title="Switch language" style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
      padding: '5px 10px', fontSize: '12px', fontWeight: '700',
      color: 'var(--text-secondary)', cursor: 'pointer', letterSpacing: '0.04em',
    }}>
      {lang === 'en' ? 'TR' : 'EN'}
    </button>
  )
}

const SECONDARY_ACTIONS = [
  { title: '💰 Earn Yield',       desc: 'Morpho & Aave',     href: '/earn',     border: '#16a34a' },
  { title: '🔁 Swap',             desc: '17 DEXes on Base',  href: '/swap',     border: '#2563eb' },
  { title: '🚀 Deploy Contract',  desc: 'ERC20, NFT',        href: '/deploy',   border: '#7c3aed' },
  { title: '👥 Referral',         desc: '10% commission',    href: '/referral', border: '#0d9488' },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus] = useState<GmStatus | null>(null)
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ba_lang') as Lang | null
      if (saved === 'tr') setLang('tr')
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      fetch(`/api/wallet-stats?address=${address}`).then(r => r.json()),
      fetch(`/api/gm/streak?address=${address}`).then(r => r.json()),
      fetch(`/api/referral/stats?address=${address}`).then(r => r.json()).catch(() => null),
    ])
      .then(([walletData, gmData, refData]) => {
        setStats(walletData)
        setGmStatus(gmData)
        if (refData) setReferralStatus(refData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [address])

  const t = T[lang]

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <AppLayout title="Dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div style={{ fontSize: '56px' }}>⚡</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Welcome to BaseAmp</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: '1.6' }}>
              Connect your wallet to start earning on Base.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '420px', width: '100%', marginTop: '8px' }}>
            {[
              { icon: '💰', label: 'Earn Yield', desc: 'Morpho + Aave' },
              { icon: '🚀', label: 'Deploy Contracts', desc: 'ERC20 / NFT' },
              { icon: '☀', label: 'Daily GM', desc: 'Build streak' },
              { icon: '👥', label: 'Referral', desc: 'Earn commission' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{f.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Connected ──────────────────────────────────────────────────────────────
  const gmmedToday = gmStatus?.gmmedToday ?? false
  const streak     = gmStatus?.streak ?? 0
  const milestone  = nextMilestone(streak)
  const hasReferrals = (referralStatus?.totalReferrals ?? 0) > 0
  const dailyRefScore = referralStatus?.dailyEarnings ?? 0

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Lang toggle — top right within page */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* ── PRIMARY ACTION BLOCK ─────────────────────────────────────── */}
        {gmmedToday ? (
          <div style={{
            background: 'linear-gradient(135deg, #052e16, #064e3b)',
            border: '1px solid #16a34a55', borderRadius: '14px',
            padding: '20px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '6px' }}>
                {t.todayAction}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>
                {t.streakSecured}
              </div>
              <div style={{ fontSize: '12px', color: '#4ade80bb', marginBottom: '4px' }}>
                +5 score added
              </div>
              <div style={{ fontSize: '13px', color: '#4ade8099' }}>
                {t.comeBack} → Day {streak + 1}
              </div>
              {hasReferrals ? (
                <div style={{ fontSize: '11px', color: '#2dd4bf99', marginTop: '6px' }}>
                  +{dailyRefScore > 0 ? `${dailyRefScore.toFixed(4)}` : '—'} score from referrals today
                </div>
              ) : (
                <Link href="/referral" style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: '11px', color: '#2dd4bf66', marginTop: '6px' }}>
                    Invite friends → earn extra score daily
                  </div>
                </Link>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#4ade80', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>day streak</div>
              {milestone && (
                <div style={{ fontSize: '10px', color: '#16a34a88', marginTop: '3px' }}>
                  {milestone.daysLeft}d to Day {milestone.day} → +{milestone.bonus}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #0f1a2e, #1a0f2e)',
            border: '1px solid #2563eb55', borderRadius: '14px', padding: '20px 24px',
          }}>
            <div style={{ fontSize: '11px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '8px' }}>
              {t.todayAction}
            </div>
            {streak > 0 ? (
              <>
                <div style={{ fontSize: '13px', color: '#f97316cc', marginBottom: '4px', fontWeight: '600' }}>
                  🔥 You're on a streak
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9', marginBottom: '6px' }}>
                  Day {streak} streak
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '3px' }}>
                  {t.progress}: Day {streak} → Day {streak + 1}
                </div>
                <div style={{ fontSize: '12px', color: '#60a5fa66', marginBottom: '3px' }}>
                  +5 score when you continue
                </div>
                {milestone && (
                  <div style={{ fontSize: '12px', color: '#fbbf24aa', marginBottom: '3px' }}>
                    {milestone.daysLeft <= 3
                      ? `${milestone.daysLeft === 1 ? '1 day' : `${milestone.daysLeft} days`} to Day ${milestone.day} → +${milestone.bonus} bonus`
                      : `Keep going to reach Day ${milestone.day} → +${milestone.bonus} bonus`
                    }
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#ef444466', marginBottom: '12px' }}>
                  {t.skipWarning}
                </div>
                <Link href="/referral" style={{ textDecoration: 'none', display: 'block', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#2dd4bf99' }}>
                    Invite friends → earn extra score daily
                  </div>
                </Link>
              </>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                Start your streak today — Day 1 begins here
              </div>
            )}
            <Link href="/gm" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white',
                border: 'none', borderRadius: '10px', padding: '13px 28px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 0 24px #3b82f630', transition: 'opacity 0.15s',
              }}>
                {t.sendGm}
              </button>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {t.stats}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label="Total TX"      value={loading ? '...' : (stats?.txCount?.toLocaleString() ?? '—')} sub="on Base" />
            <StatCard label="Active Days"   value={loading ? '...' : (stats?.activeDays?.toString() ?? '—')} sub={stats?.firstTx ? `since ${stats.firstTx}` : undefined} />
            <StatCard label="Builder Score" value={loading ? '...' : (stats?.builderScore?.toString() ?? '—')} accent="#60a5fa" />
            <StatCard label="GM Score"      value={loading ? '...' : (gmStatus?.score?.toString() ?? '—')} sub={streak > 0 ? `${streak}-day streak` : undefined} accent="#f97316" />
          </div>
        </div>

        {/* Actions */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {t.actions}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* GM row — dominant */}
            <Link href="/gm" style={{ textDecoration: 'none' }}>
              <div style={{
                background: gmmedToday ? '#0a1a0a' : 'var(--bg-card)',
                border: `1px solid ${gmmedToday ? '#16a34a44' : '#f9731633'}`,
                borderRadius: '12px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = gmmedToday ? '#16a34a88' : '#f97316')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = gmmedToday ? '#16a34a44' : '#f9731633')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>☀</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Send GM {gmmedToday ? '✅' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {gmmedToday ? `${streak}-day streak secured` : 'Daily streak · +5 score'}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '16px', color: 'var(--text-faint)' }}>→</span>
              </div>
            </Link>

            {/* Secondary — 2-col, low contrast */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {SECONDARY_ACTIONS.map(action => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card2)', border: '1px solid var(--border2)',
                    borderRadius: '10px', padding: '12px 14px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = action.border)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '2px' }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Wallet footer — minimal */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {address?.slice(0, 8)}…{address?.slice(-6)}
          </div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '5px 10px', background: '#172554', borderRadius: '6px', border: '1px solid #1e3a5f' }}>
            Basescan ↗
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
