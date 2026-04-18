'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getNextMilestone } from '@/lib/gm'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'

interface WalletStats {
  txCount: number; activeDays: number; uniqueContracts: number
  currentStreak: number; gasEth: number; lastActivity: string | null
  firstActivity: string | null; walletAge: number; builderScore: number
}
interface GmStatus    { streak: number; gmmedToday: boolean; score: number }
interface ReferralData {
  code: string; referralLink: string
  totalReferrals: number; totalEarned: string; dailyEarnings: number
}

function AnalyticCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { lang } = useLang()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus] = useState<GmStatus | null>(null)
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refCopied, setRefCopied] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

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
      if (codeData?.link) setReferral({
        code: codeData.code,
        referralLink: codeData.link,
        totalReferrals: refStats?.totalReferrals ?? 0,
        totalEarned: refStats?.totalEarned ?? '0',
        dailyEarnings: refStats?.dailyEarnings ?? 0,
      })
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

  const V = (v: number | null | undefined, suffix = '') =>
    loading ? '...' : v != null ? `${v}${suffix}` : '\u2014'

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 1 — AIRDROP GUIDE */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <button
            onClick={() => setGuideOpen(o => !o)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>\u{1F4CB}</span>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{tx(d.guideTitle, lang)}</div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', transform: guideOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>\u25be</span>
          </button>
          {guideOpen && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginTop: '12px', marginBottom: '14px' }}>
                {tx(d.guideIntro, lang)}
              </div>
              <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{tx(d.guideWarning, lang)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {d.guideExternal.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>\u2022</span>
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none' }}>
                        {lang === 'tr' ? item.tr : item.en} \u2197
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontStyle: 'italic' }}>{tx(d.guideNote, lang)}</div>
            </div>
          )}
        </div>

        {/* 2 — STEP FLOW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {d.steps.map(step => {
            const isDone = done[step.doneKey]
            const title  = lang === 'tr' ? step.tr_title : step.en_title
            const sub    = lang === 'tr' ? step.tr_sub   : step.en_sub
            return (
              <Link key={step.doneKey} href={step.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isDone ? '#16a34a55' : 'var(--border)'}`,
                  borderRadius: '10px', padding: '14px 12px', cursor: 'pointer', height: '100%', position: 'relative',
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

        {/* 3 — WALLET ANALYTICS */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {tx(d.analyticsTitle, lang)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
            <AnalyticCard label={tx(d.totalTx, lang)}         value={V(stats?.txCount)} sub={tx(c.onBase, lang)} />
            <AnalyticCard label={tx(d.activeDays, lang)}      value={V(stats?.activeDays)} sub={stats?.walletAge ? `${stats.walletAge} ${tx(c.days, lang)} ${tx(c.since, lang)}` : undefined} />
            <AnalyticCard label={tx(d.currentStreak, lang)}   value={V(stats?.currentStreak)} sub={tx(c.dayStreak, lang)} />
            <AnalyticCard label={tx(d.uniqueContracts, lang)} value={V(stats?.uniqueContracts)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <AnalyticCard label={tx(d.gasUsed, lang)}     value={loading ? '...' : stats?.gasEth != null ? stats.gasEth.toFixed(4) : '\u2014'} />
            <AnalyticCard label={tx(d.lastActivity, lang)} value={loading ? '...' : (stats?.lastActivity ?? '\u2014')} />
            <AnalyticCard label={tx(d.builderScore, lang)} value={V(stats?.builderScore)} />
            <AnalyticCard label={tx(d.gmScore, lang)}      value={loading ? '...' : (totalScore?.toString() ?? '\u2014')} sub={streak > 0 ? `${streak} ${tx(c.dayStreak, lang)}` : undefined} />
          </div>
        </div>

        {/* 4 — REFERRAL */}
        <div id="referral" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {tx(d.referralTitle, lang)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
            {tx(d.referralCta, lang)}
          </div>
          {/* Ref stats */}
          {referral && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: tx(d.totalReferrals, lang), value: referral.totalReferrals.toString(), color: '#60a5fa' },
                { label: tx(d.earnedEth, lang),      value: referral.totalEarned,               color: '#22c55e' },
                { label: tx(d.todayScore, lang),     value: referral.dailyEarnings > 0 ? `+${referral.dailyEarnings}` : '0', color: '#f97316' },
                { label: tx(d.commission, lang),     value: '10%',                              color: '#8b5cf6' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
          {/* Link + copy */}
          {referral ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {referral.referralLink}
              </div>
              <button onClick={copyReferral} style={{ background: refCopied ? '#052e16' : 'var(--bg-card2)', border: `1px solid ${refCopied ? '#16a34a' : 'var(--border)'}`, borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: refCopied ? '#4ade80' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {refCopied ? tx(c.copied, lang) : tx(c.copyLink, lang)}
              </button>
              <button onClick={() => {
                const text = `Join me on BaseAmp!\n\nSend daily GM & earn score\n10% fee discount with my code\n\n${referral.referralLink}`
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
              }} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {tx(c.share, lang)}
              </button>
            </div>
          ) : loading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{tx(c.loading, lang)}</div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{tx(d.noReferrals, lang)}</div>
          )}
        </div>

        {/* 5 — HERO */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', flex: 1 }}>{tx(d.hero, lang)}</div>
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '60px' }}>
            <div style={{ fontSize: '44px', fontWeight: '900', lineHeight: 1, color: streak > 0 ? '#f97316' : 'var(--text-faint)' }}>{streak}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{tx(c.dayStreak, lang)}</div>
            {milestone && <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>{milestone.daysLeft}d \u2192 Day {milestone.day}</div>}
            {gmmedToday && <div style={{ fontSize: '10px', color: '#4ade80', marginTop: '3px' }}>\u2713 GM</div>}
          </div>
        </div>

        {/* 6 — WALLET */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{address?.slice(0, 8)}\u2026{address?.slice(-6)}</div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '5px 10px', background: 'var(--bg-card2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            {tx(c.basescan, lang)}
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
