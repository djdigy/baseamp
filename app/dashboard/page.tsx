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
  totalReferrals: number; totalEarned: string; todayEarned: string; dailyEarnings: number
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
  const [stats, setStats]         = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus]   = useState<GmStatus | null>(null)
  const [referral, setReferral]   = useState<ReferralData | null>(null)
  const [loading, setLoading]     = useState(false)
  const [refCopied, setRefCopied] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const d = TEXT.dashboard
  const c = TEXT.common

  async function loadData(bust = false) {
    if (!address) return
    setLoading(true)
    const statsUrl = `/api/wallet-stats?address=${address}${bust ? '&refresh=1' : ''}`
    Promise.all([
      fetch(statsUrl).then(r => r.json()),
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
        totalEarned:    refStats?.totalEarned ?? '0.000000',
        todayEarned:    refStats?.todayEarned ?? '0.000000',
        dailyEarnings:  refStats?.dailyEarnings ?? 0,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData(true) }, [address])

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

  const V = (v: number | null | undefined) =>
    loading ? '...' : v != null ? String(v) : '—'

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

          {/* Expandable detail guide */}
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
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {tx(d.stepsIntro, lang)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {d.steps.map(step => {
              const isDone = done[step.doneKey]
              const title  = lang === 'tr' ? step.tr_title : step.en_title
              const sub    = lang === 'tr' ? step.tr_sub   : step.en_sub
              const cta    = lang === 'tr' ? step.tr_cta   : step.en_cta

              return (
                <div key={step.doneKey}>
                  <Link href={step.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isDone ? '#16a34a55' : 'var(--border)'}`,
                      borderRadius: '10px', padding: '14px 12px', cursor: 'pointer', position: 'relative',
                    }}>
                      {isDone && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white' }}>&#10003;</div>
                      )}
                      <div style={{ fontSize: '28px', fontWeight: '900', lineHeight: 1, color: isDone ? '#4ade80' : 'var(--text-faint)', marginBottom: '6px' }}>{step.n}</div>
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

        {/* ── 3. BOOST BLOCK (replaces old external guide) ─────────────── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {tx(d.boostTitle, lang)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
            {tx(d.boostDesc, lang)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
            {d.boostItems.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-faint)', flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: '12px', color: '#60a5fa', lineHeight: '1.4' }}>
                  {lang === 'tr' ? item.tr : item.en} ↗
                </span>
              </a>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#f97316', fontWeight: '600' }}>
            👉 {tx(d.boostNote, lang)}
          </div>
        </div>

        {/* ── 4. WALLET ANALYTICS ──────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{tx(d.analyticsTitle, lang)}</span>
            <button onClick={() => loadData(true)} disabled={loading}
              style={{ fontSize: '10px', color: loading ? 'var(--text-faint)' : '#60a5fa', background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', padding: '0', fontWeight: '600' }}>
              {loading ? tx(c.loading, lang) : lang === 'tr' ? 'Yenile ↻' : 'Refresh ↻'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
            <AnalyticCard label={tx(d.totalTx, lang)}         value={V(stats?.txCount)}        sub={tx(c.onBase, lang)} />
            <AnalyticCard label={tx(d.activeDays, lang)}      value={V(stats?.activeDays)}     sub={stats?.walletAge ? `${stats.walletAge} ${tx(c.days, lang)} ${tx(c.since, lang)}` : undefined} />
            <AnalyticCard label={tx(d.currentStreak, lang)}   value={V(stats?.currentStreak)}  sub={tx(c.dayStreak, lang)} />
            <AnalyticCard label={tx(d.uniqueContracts, lang)} value={V(stats?.uniqueContracts)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <AnalyticCard label={tx(d.gasUsed, lang)}      value={loading ? '...' : stats?.gasEth != null ? stats.gasEth.toFixed(4) : '—'} />
            <AnalyticCard label={tx(d.lastActivity, lang)} value={loading ? '...' : (stats?.lastActivity ?? '—')} />
            <AnalyticCard label={tx(d.builderScore, lang)} value={V(stats?.builderScore)} />
            <AnalyticCard label={tx(d.gmScore, lang)}      value={loading ? '...' : (totalScore?.toString() ?? '—')} sub={streak > 0 ? `${streak} ${tx(c.dayStreak, lang)}` : undefined} />
          </div>

          {/* Streak warning */}
          {streak > 0 && !gmmedToday && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#1c0a00', border: '1px solid #7c2d12', borderRadius: '8px', fontSize: '12px', color: '#fb923c', fontWeight: '600' }}>
              ⚡ {streak} {tx(c.dayStreak, lang)} — {tx(d.streakWarningMsg, lang)}
            </div>
          )}
          {!loading && stats && stats.txCount === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-faint)', paddingTop: '8px', lineHeight: '1.6' }}>
              {lang === 'tr'
                ? 'Bu cüzdanda Base üzerinde işlem bulunamadı. GM göndererek aktiviteni başlatabilirsin.'
                : 'No transactions found on Base for this wallet. Send your first GM to start building activity.'}
            </div>
          )}
        </div>

        {/* ── 5. REFERRAL ──────────────────────────────────────────────── */}
        <div id="referral" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.2px' }}>
            {tx(d.referralTitle, lang)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: '1.6' }}>
            {tx(d.referralCta, lang)}
          </div>
          <div style={{ fontSize: '11px', color: '#f97316', fontWeight: '600', marginBottom: '14px' }}>
            👉 {tx(d.passiveIncome, lang)}
          </div>

          {referral && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{tx(d.totalReferrals, lang)}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa' }}>{referral.totalReferrals}</div>
              </div>
              <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{tx(d.earnedEth, lang)} (ETH)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e' }}>{referral.totalEarned}</div>
              </div>
              <div style={{ background: parseFloat(referral.todayEarned) > 0 ? '#052e16' : 'var(--bg-card2)', border: `1px solid ${parseFloat(referral.todayEarned) > 0 ? '#166534' : 'var(--border)'}`, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{tx(d.todayScore, lang)} (ETH)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: parseFloat(referral.todayEarned) > 0 ? '#4ade80' : 'var(--text-faint)' }}>
                  {parseFloat(referral.todayEarned) > 0 ? `+${referral.todayEarned}` : '0.000000'}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '800', color: 'white' }}>
              👉 %20 Referral Payı
            </div>
          </div>

          {referral ? (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {referral.referralLink}
                </div>
                <button onClick={copyReferral} style={{ background: refCopied ? '#052e16' : 'var(--bg-card2)', border: `1px solid ${refCopied ? '#16a34a' : 'var(--border)'}`, borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: refCopied ? '#4ade80' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {refCopied ? tx(c.copied, lang) : tx(c.copyLink, lang)}
                </button>
                <button onClick={() => {
                  const text = lang === 'tr'
                    ? `BaseAmp'te günlük GM gönder, onchain aktivite biriktir.\n\nBeni referans olarak ekle, her işlemden %20 kazanıyorum:\n${referral.referralLink}`
                    : `Send daily GM on BaseAmp, stack onchain activity.\n\nUse my referral — I earn 20% from your fees:\n${referral.referralLink}`
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                }} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {tx(c.share, lang)}
                </button>
              </div>
              {referral.totalReferrals === 0 && (
                <div style={{ fontSize: '12px', color: '#f97316', fontWeight: '600', padding: '8px 0' }}>
                  {lang === 'tr' ? '⚡ Henüz referansın yok. Linki paylaş — her aktif kullanıcı sana ETH kazandırır.' : '⚡ No referrals yet. Share your link — every active user earns you ETH.'}
                </div>
              )}
            </>
          ) : loading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{tx(c.loading, lang)}</div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{tx(d.noReferrals, lang)}</div>
          )}
        </div>

        {/* ── 6. WALLET ────────────────────────────────────────────────── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              {address?.slice(0, 8)}&#8230;{address?.slice(-6)}
            </div>
            {streak > 0 && (
              <div style={{ fontSize: '11px', color: '#f97316', fontWeight: '600' }}>
                {streak} {tx(c.dayStreak, lang)}{milestone ? ` — ${milestone.daysLeft}d to Day ${milestone.day}` : ''}
              </div>
            )}
            {gmmedToday && <div style={{ fontSize: '11px', color: '#4ade80' }}>&#10003; GM</div>}
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
