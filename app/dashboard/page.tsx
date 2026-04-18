'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getNextMilestone } from '@/lib/gm'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'

interface WalletStats { txCount: number; activeDays: number; builderScore: number; firstTx: string | null }
interface GmStatus    { streak: number; gmmedToday: boolean; score: number }
interface ReferralStats { referralLink: string; totalReferrals: number }

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

  const d = TEXT.dashboard
  const c = TEXT.common

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
      if (codeData?.link) setReferral({ referralLink: codeData.link, totalReferrals: refStats?.totalReferrals ?? 0 })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [address])

  if (!isConnected) {
    return (
      <AppLayout title="Dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>{tx(d.welcome, lang)}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: '1.6' }}>{tx(d.welcomeSub, lang)}</div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const gmmedToday = gmStatus?.gmmedToday ?? false
  const streak     = gmStatus?.streak ?? 0
  const milestone  = getNextMilestone(streak)
  const totalScore = gmStatus?.score ?? 0
  const hasInvited = (referral?.totalReferrals ?? 0) > 0

  const done: Record<string, boolean> = { gm: gmmedToday, swap: false, earn: false, deploy: false, invite: hasInvited }

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
          {d.steps.map(step => {
            const isDone = done[step.doneKey]
            const title = lang === 'tr' ? step.tr_title : step.en_title
            const sub   = lang === 'tr' ? step.tr_sub   : step.en_sub
            return (
              <Link key={step.doneKey} href={step.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isDone ? '#16a34a55' : 'var(--border)'}`,
                  borderRadius: '10px', padding: '14px 12px',
                  cursor: 'pointer', height: '100%', position: 'relative',
                }}>
                  {isDone && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white' }}>\u2713</div>
                  )}
                  <div style={{ fontSize: '28px', fontWeight: '900', lineHeight: 1, color: isDone ? '#4ade80' : 'var(--text-faint)', marginBottom: '6px' }}>{step.n}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px' }}>{title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{sub}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>{tx(d.stats, lang)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <StatCard label={tx(d.totalTx, lang)}      value={loading ? '...' : (stats?.txCount?.toLocaleString() ?? '\u2014')} sub={tx(c.onBase, lang)} />
            <StatCard label={tx(d.activeDays, lang)}   value={loading ? '...' : (stats?.activeDays?.toString() ?? '\u2014')} sub={stats?.firstTx ? `${tx(c.since, lang)} ${stats.firstTx}` : undefined} />
            <StatCard label={tx(d.builderScore, lang)} value={loading ? '...' : (stats?.builderScore?.toString() ?? '\u2014')} accent="#60a5fa" />
            <StatCard label={tx(d.gmScore, lang)}      value={loading ? '...' : (totalScore?.toString() ?? '\u2014')} sub={streak > 0 ? `${streak} ${tx(c.dayStreak, lang)}` : undefined} accent="#f97316" />
          </div>
        </div>

        {/* Referral compact */}
        {referral && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{tx(d.referralCta, lang)}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {referral.referralLink}
              </div>
              <button onClick={copyReferral} style={{ background: refCopied ? '#052e16' : 'var(--bg-card2)', border: `1px solid ${refCopied ? '#16a34a' : 'var(--border)'}`, borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: refCopied ? '#4ade80' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {refCopied ? tx(c.copied, lang) : tx(c.copyLink, lang)}
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{tx(d.hero, lang)}</div>
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '60px' }}>
            <div style={{ fontSize: '44px', fontWeight: '900', lineHeight: 1, color: streak > 0 ? '#f97316' : 'var(--text-faint)' }}>{streak}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{tx(c.dayStreak, lang)}</div>
            {milestone && <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>{milestone.daysLeft}d \u2192 Day {milestone.day}</div>}
            {gmmedToday && <div style={{ fontSize: '10px', color: '#4ade80', marginTop: '3px' }}>\u2713 GM</div>}
          </div>
        </div>

        {/* Wallet */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{address?.slice(0, 8)}\u2026{address?.slice(-6)}</div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '5px 10px', background: 'var(--bg-card2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            {tx(c.basescan, lang)}
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
