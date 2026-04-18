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
  en: "What matters on Base is not doing many transactions in one day, but spreading real activity over time. Sending GM daily helps you stay active.",
  tr: "Base\u2019te de\u011ferli olan \u015fey tek g\u00fcnde y\u00fczlerce i\u015flem atmak de\u011fil, farkl\u0131 i\u015flemleri zamana yayarak ger\u00e7ek kullan\u0131m g\u00f6stermektir. GM g\u00f6ndererek her g\u00fcn aktif kalabilirsin.",
}

const STEPS = {
  en: [
    { n: '1', title: 'Send GM',   sub: 'Simple daily transaction',      href: '/gm',      doneKey: 'gm' },
    { n: '2', title: 'Swap',      sub: 'Use DEXs to generate activity', href: '/swap',     doneKey: 'swap' },
    { n: '3', title: 'Earn',      sub: 'Deposit USDC, interact with DeFi', href: '/earn', doneKey: 'earn' },
    { n: '4', title: 'Deploy',    sub: 'Create a contract on Base',      href: '/deploy',   doneKey: 'deploy' },
    { n: '5', title: 'Invite',    sub: 'Share your link, earn 20%',      href: '/referral', doneKey: 'invite' },
  ],
  tr: [
    { n: '1', title: 'GM G\u00f6nder', sub: 'Basit g\u00fcnl\u00fck i\u015flem',              href: '/gm',      doneKey: 'gm' },
    { n: '2', title: 'Swap',           sub: 'DEX kullanarak aktivite \u00fcret',          href: '/swap',     doneKey: 'swap' },
    { n: '3', title: 'Kazan',          sub: 'USDC yat\u0131r, DeFi kullan',              href: '/earn',     doneKey: 'earn' },
    { n: '4', title: 'Deploy',         sub: 'Base\u2019te kontrat olu\u015ftur',           href: '/deploy',   doneKey: 'deploy' },
    { n: '5', title: 'Davet Et',       sub: 'Linkinle kazan, %20 komisyon',             href: '/referral', doneKey: 'invite' },
  ],
}

const LABELS = {
  en: {
    stats: 'Stats', totalTx: 'Total TX', onBase: 'on Base',
    activeDays: 'Active Days', since: 'since',
    builderScore: 'Builder Score', gmScore: 'GM Score',
    dayStreak: 'day streak',
    referralCta: "Share your link and earn 20% from your referrals' activity",
    copyLink: 'Copy Link', copied: 'Copied!',
  },
  tr: {
    stats: 'İstatistikler', totalTx: 'Toplam TX', onBase: "Base'de",
    activeDays: 'Aktif Gün', since: 'tarihinden beri',
    builderScore: 'Builder Puanı', gmScore: 'GM Puanı',
    dayStreak: 'günlük seri',
    referralCta: 'Linkini paylaş ve arkadaşlarının işlem ücretlerinden %20 kazan.',
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
  const steps = STEPS[lang as 'en' | 'tr'] ?? STEPS.en

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

  const gmmedToday  = gmStatus?.gmmedToday ?? false
  const streak      = gmStatus?.streak ?? 0
  const milestone   = getNextMilestone(streak)
  const totalScore  = gmStatus?.score ?? 0
  const hasReferral = (referral?.totalReferrals ?? 0) > 0

  const done: Record<string, boolean> = {
    gm: gmmedToday,
    swap: false,
    earn: false,
    deploy: false,
    invite: hasReferral,
  }

  function copyReferral() {
    if (!referral?.referralLink) return
    navigator.clipboard.writeText(referral.referralLink).catch(() => {})
    setRefCopied(true)
    setTimeout(() => setRefCopied(false), 2000)
  }

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Step flow */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {steps.map(step => {
            const isDone = done[step.doneKey]
            return (
              <Link key={step.doneKey} href={step.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isDone ? '#16a34a55' : 'var(--border)'}`,
                  borderRadius: '10px', padding: '14px 12px',
                  cursor: 'pointer', height: '100%', position: 'relative',
                }}>
                  {isDone && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: '#16a34a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', color: 'white',
                    }}>\u2713</div>
                  )}
                  <div style={{ fontSize: '28px', fontWeight: '900', lineHeight: 1, color: isDone ? '#4ade80' : 'var(--text-faint)', marginBottom: '6px' }}>
                    {step.n}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {step.sub}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {t.stats}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <StatCard label={t.totalTx}      value={loading ? '...' : (stats?.txCount?.toLocaleString() ?? '\u2014')} sub={t.onBase} />
            <StatCard label={t.activeDays}   value={loading ? '...' : (stats?.activeDays?.toString() ?? '\u2014')} sub={stats?.firstTx ? `${t.since} ${stats.firstTx}` : undefined} />
            <StatCard label={t.builderScore} value={loading ? '...' : (stats?.builderScore?.toString() ?? '\u2014')} accent="#60a5fa" />
            <StatCard label={t.gmScore}      value={loading ? '...' : (totalScore?.toString() ?? '\u2014')} sub={streak > 0 ? `${streak} ${t.dayStreak}` : undefined} accent="#f97316" />
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
              <button onClick={copyReferral} style={{
                background: refCopied ? '#052e16' : 'var(--bg-card2)',
                border: `1px solid ${refCopied ? '#16a34a' : 'var(--border)'}`,
                borderRadius: '6px', padding: '7px 14px',
                fontSize: '12px', fontWeight: '600',
                color: refCopied ? '#4ade80' : 'var(--text-secondary)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {refCopied ? t.copied : t.copyLink}
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            {HERO[lang as 'en' | 'tr'] ?? HERO.en}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '60px' }}>
            <div style={{ fontSize: '44px', fontWeight: '900', lineHeight: 1, color: streak > 0 ? '#f97316' : 'var(--text-faint)' }}>
              {streak}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{t.dayStreak}</div>
            {milestone && <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>{milestone.daysLeft}d \u2192 Day {milestone.day}</div>}
            {gmmedToday && <div style={{ fontSize: '10px', color: '#4ade80', marginTop: '3px' }}>\u2713 GM</div>}
          </div>
        </div>

        {/* Wallet */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
