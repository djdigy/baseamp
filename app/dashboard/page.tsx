'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getNextMilestone } from '@/lib/gm'
import { useLang } from '@/components/Providers'

interface WalletStats { txCount: number; activeDays: number; builderScore: number; firstTx: string | null }
interface GmStatus    { streak: number; gmmedToday: boolean; score: number }
interface ReferralStats { code: string; referralLink: string; totalReferrals: number; totalEarned: string; dailyEarnings: number }

const HERO = {
  en: "Base rewards consistent real usage over time, not one-time activity \u2014 sending a daily GM is a simple way to stay active.",
  tr: "Base, tek seferlik i\u015flemlerden \u00e7ok zamana yay\u0131lm\u0131\u015f ger\u00e7ek kullan\u0131m\u0131 \u00f6nemser \u2014 GM g\u00f6ndererek her g\u00fcn aktif kalabilirsin.",
}

const LABELS = {
  en: {
    sendGm: 'Send GM', sendGmSub: 'Start daily activity',
    swap: 'Swap', swapSub: 'Use Base DEXs',
    earn: 'Earn', earnSub: 'Put idle funds to work',
    deploy: 'Deploy', deploySub: 'Show real on-chain usage',
    invite: 'Invite', inviteSub: 'Earn from referrals',
    makeTx: 'Make a Transaction',
    stats: 'Stats', actions: 'Actions',
    totalTx: 'Total TX', onBase: 'on Base',
    activeDays: 'Active Days', since: 'since',
    builderScore: 'Builder Score', gmScore: 'GM Score',
    dayStreak: 'day streak', dailyStreak: 'Daily streak \u00b7 +5 score',
    dayStreakSecured: '-day streak secured',
    referralCta: "Share your link and earn 20% from your referrals' activity",
    copyLink: 'Copy Link', copied: 'Copied!',
  },
  tr: {
    sendGm: 'GM G\u00f6nder', sendGmSub: 'G\u00fcnl\u00fck aktivite ba\u015flat',
    swap: 'Swap', swapSub: 'Base DEX\u2019leri kullan',
    earn: 'Kazan', earnSub: 'Boşta duran fonlar\u0131 de\u011flendir',
    deploy: 'Deploy', deploySub: 'Ger\u00e7ek on-chain kullan\u0131m g\u00f6ster',
    invite: 'Davet Et', inviteSub: 'Referanslardan kazan',
    makeTx: 'I\u015flem Yap',
    stats: 'I\u0307statistikler', actions: 'Eylemler',
    totalTx: 'Toplam TX', onBase: "Base'de",
    activeDays: 'Aktif G\u00fcn', since: 'tarihinden beri',
    builderScore: 'Builder Puan\u0131', gmScore: 'GM Puan\u0131',
    dayStreak: 'g\u00fcnl\u00fck seri', dailyStreak: 'G\u00fcnl\u00fck seri \u00b7 +5 puan',
    dayStreakSecured: ' g\u00fcnl\u00fck seri g\u00fcvende',
    referralCta: 'Linkini paylaş ve arkadaşlarının işlemlerinden %20 kazan',
    copyLink: 'Linki Kopyala', copied: 'Kopyalandı!',
  },
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: accent || 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { lang } = useLang()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus] = useState<GmStatus | null>(null)
  const [referral, setReferral] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [refCopied, setRefCopied] = useState(false)

  const t = LABELS[lang as 'en' | 'tr'] ?? LABELS.en

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      fetch(`/api/wallet-stats?address=${address}`).then(r => r.json()),
      fetch(`/api/gm/streak?address=${address}`).then(r => r.json()),
      fetch(`/api/referral/code?address=${address}`).then(r => r.json()),
      fetch(`/api/referral/stats?address=${address}`).then(r => r.json()).catch(() => null),
    ]).then(([walletData, gmData, codeData, refStats]) => {
      setStats(walletData)
      setGmStatus(gmData)
      if (codeData?.link) {
        setReferral({
          code: codeData.code,
          referralLink: codeData.link,
          totalReferrals: refStats?.totalReferrals ?? 0,
          totalEarned: refStats?.totalEarned ?? '0',
          dailyEarnings: refStats?.dailyEarnings ?? 0,
        })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [address])

  if (!isConnected) {
    return (
      <AppLayout title="Dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Welcome to BaseAmp</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: '1.6' }}>
              Connect your wallet to start earning on Base.
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const gmmedToday = gmStatus?.gmmedToday ?? false
  const streak     = gmStatus?.streak ?? 0
  const milestone  = getNextMilestone(streak)
  const totalScore = gmStatus?.score ?? 0

  const ACTIONS = [
    { key: 'gm',     label: t.sendGm,  sub: t.sendGmSub,  href: '/gm',       done: gmmedToday },
    { key: 'swap',   label: t.swap,    sub: t.swapSub,    href: '/swap',      done: false },
    { key: 'earn',   label: t.earn,    sub: t.earnSub,    href: '/earn',      done: false },
    { key: 'deploy', label: t.deploy,  sub: t.deploySub,  href: '/deploy',    done: false },
    { key: 'invite', label: t.invite,  sub: t.inviteSub,  href: '/referral',  done: (referral?.totalReferrals ?? 0) > 0 },
  ]

  function copyReferral() {
    if (!referral?.referralLink) return
    navigator.clipboard.writeText(referral.referralLink).catch(() => {})
    setRefCopied(true)
    setTimeout(() => setRefCopied(false), 2000)
  }

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Action bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {ACTIONS.map(action => (
            <Link key={action.key} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)', border: `1px solid ${action.done ? '#16a34a44' : 'var(--border)'}`,
                borderRadius: '10px', padding: '12px',
                cursor: 'pointer', height: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: action.done ? '#16a34a' : 'var(--bg-card2)',
                    border: `1px solid ${action.done ? '#16a34a' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', color: action.done ? 'white' : 'var(--text-faint)',
                    flexShrink: 0,
                  }}>
                    {action.done ? '\u2713' : '\u2022'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: action.done ? '#4ade80' : 'var(--text-primary)' }}>
                    {action.label}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '22px' }}>
                  {action.sub}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Hero */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '18px 20px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '14px' }}>
              {HERO[lang as 'en' | 'tr'] ?? HERO.en}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/gm" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white',
                  border: 'none', borderRadius: '8px', padding: '9px 18px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                }}>
                  {t.sendGm}
                </button>
              </Link>
              <Link href="/swap" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'var(--bg-card2)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 18px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                  {t.makeTx}
                </button>
              </Link>
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '64px' }}>
            <div style={{ fontSize: '46px', fontWeight: '900', lineHeight: 1, color: streak > 0 ? '#f97316' : 'var(--text-faint)' }}>
              {streak}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{t.dayStreak}</div>
            {milestone && (
              <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>
                {milestone.daysLeft}d to Day {milestone.day}
              </div>
            )}
            {gmmedToday && (
              <div style={{ fontSize: '10px', color: '#4ade80', marginTop: '4px' }}>\u2713 GM</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {t.stats}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <StatCard label={t.totalTx}      value={loading ? '...' : (stats?.txCount?.toLocaleString() ?? '—')} sub={t.onBase} />
            <StatCard label={t.activeDays}   value={loading ? '...' : (stats?.activeDays?.toString() ?? '—')} sub={stats?.firstTx ? `${t.since} ${stats.firstTx}` : undefined} />
            <StatCard label={t.builderScore} value={loading ? '...' : (stats?.builderScore?.toString() ?? '—')} accent="#60a5fa" />
            <StatCard label={t.gmScore}      value={loading ? '...' : (totalScore?.toString() ?? '—')} sub={streak > 0 ? `${streak} ${t.dayStreak}` : undefined} accent="#f97316" />
          </div>
        </div>

        {/* Referral compact */}
        {referral && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              {t.referralCta}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '7px 10px',
                fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {referral.referralLink}
              </div>
              <button
                onClick={copyReferral}
                style={{
                  background: refCopied ? '#052e16' : 'var(--bg-card2)',
                  border: `1px solid ${refCopied ? '#16a34a' : 'var(--border)'}`,
                  borderRadius: '6px', padding: '7px 14px',
                  fontSize: '12px', fontWeight: '600',
                  color: refCopied ? '#4ade80' : 'var(--text-secondary)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {refCopied ? t.copied : t.copyLink}
              </button>
            </div>
          </div>
        )}

        {/* Wallet */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {address?.slice(0, 8)}\u2026{address?.slice(-6)}
          </div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '5px 10px', background: 'var(--bg-card2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            Basescan \u2197
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
