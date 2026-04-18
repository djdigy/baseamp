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

type Translations = {
  sendGm: string; stats: string; actions: string; totalTx: string; onBase: string
  activeDays: string; since: string; builderScore: string; gmScore: string
  sendGmAction: string; dayStreak: string; dailyStreak: string; dayStreakSecured: string
  heroEN: string; heroTR: string; makeTx: string; referralCta: string; referralCopied: string
  referralCopy: string
}

const T: Record<string, Translations> = {
  en: {
    sendGm:          'Send GM (+5 score)',
    stats:           'Stats',
    actions:         'Actions',
    totalTx:         'Total TX',
    onBase:          'on Base',
    activeDays:      'Active Days',
    since:           'since',
    builderScore:    'Builder Score',
    gmScore:         'GM Score',
    sendGmAction:    'Send GM',
    dayStreak:       'day streak',
    dailyStreak:     'Daily streak · +5 score',
    dayStreakSecured: '-day streak secured',
    makeTx:          'Make a Transaction',
    referralCta:     'Share your link and earn 20% from your friends\u2019 activity.',
    referralCopied:  'Copied!',
    referralCopy:    'Copy Link',
    heroEN:          "What matters on Base isn\u2019t sending a lot of transactions in one day, but using different apps over time and showing real activity; sending a GM is a simple way to generate a transaction, so doing it daily helps.",
    heroTR:          "Base\u2019te de\u011ferli olan \u015fey tek g\xfcnde y\xfczlerce i\u015flem atmak de\u011fil, farkl\u0131 uygulamalar\u0131 kullan\u0131p bunu zamana yayarak ger\xe7ekten a\u011f\u0131 kulland\u0131\u011f\u0131n\u0131 g\xf6stermek; GM yani selam g\xf6nderme i\u015flemi de basit bir \u015fekilde i\u015flem (TX) yapman\u0131 sa\u011flar, bu y\xfczden her g\xfcn yapman iyi olur.",
  },
  tr: {
    sendGm:          'GM Gönder (+5 puan)',
    stats:           'İstatistikler',
    actions:         'Eylemler',
    totalTx:         'Toplam TX',
    onBase:          "Base'de",
    activeDays:      'Aktif Gün',
    since:           'tarihinden beri',
    builderScore:    'Builder Puanı',
    gmScore:         'GM Puanı',
    sendGmAction:    'GM Gönder',
    dayStreak:       'günlük seri',
    dailyStreak:     'Günlük seri · +5 puan',
    dayStreakSecured: ' günlük seri güvende',
    makeTx:          'İşlem Yap',
    referralCta:     'Linkini paylaş ve arkadaşlarının işlemlerinden %20 kazan.',
    referralCopied:  'Kopyalandı!',
    referralCopy:    'Linki Kopyala',
    heroEN:          "What matters on Base isn\u2019t sending a lot of transactions in one day, but using different apps over time and showing real activity; sending a GM is a simple way to generate a transaction, so doing it daily helps.",
    heroTR:          "Base\u2019te de\u011ferli olan \u015fey tek g\xfcnde y\xfczlerce i\u015flem atmak de\u011fil, farkl\u0131 uygulamalar\u0131 kullan\u0131p bunu zamana yayarak ger\xe7ekten a\u011f\u0131 kulland\u0131\u011f\u0131n\u0131 g\xf6stermek; GM yani selam g\xf6nderme i\u015flemi de basit bir \u015fekilde i\u015flem (TX) yapman\u0131 sa\u011flar, bu y\xfczden her g\xfcn yapman iyi olur.",
  },
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: accent || 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

const SECONDARY_ACTIONS = [
  { title: 'Earn Yield',       desc: 'Morpho & Aave',    href: '/earn',     border: '#16a34a' },
  { title: 'Swap',             desc: '17 DEXes on Base', href: '/swap',     border: '#2563eb' },
  { title: 'Deploy Contract',  desc: 'ERC20, NFT',       href: '/deploy',   border: '#7c3aed' },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { lang } = useLang()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus] = useState<GmStatus | null>(null)
  const [referral, setReferral] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [refCopied, setRefCopied] = useState(false)

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

  const t = T[lang]

  if (!isConnected) {
    return (
      <AppLayout title="Dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div style={{ fontSize: '56px' }}>&#9889;</div>
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

  function copyReferral() {
    if (!referral?.referralLink) return
    navigator.clipboard.writeText(referral.referralLink).catch(() => {})
    setRefCopied(true)
    setTimeout(() => setRefCopied(false), 2000)
  }

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Hero — explanation + streak */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '20px 24px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '16px' }}>
              {lang === 'tr' ? t.heroTR : t.heroEN}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/gm" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white',
                  border: 'none', borderRadius: '8px', padding: '10px 20px',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                }}>
                  {t.sendGmAction}
                </button>
              </Link>
              <Link href="/swap" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'var(--bg-card2)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}>
                  {t.makeTx}
                </button>
              </Link>
            </div>
          </div>

          {/* Streak */}
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '72px' }}>
            <div style={{ fontSize: '48px', fontWeight: '900', lineHeight: 1, color: streak > 0 ? '#f97316' : 'var(--text-faint)' }}>
              {streak}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{t.dayStreak}</div>
            {milestone && (
              <div style={{ fontSize: '10px', color: '#fbbf2488', marginTop: '4px' }}>
                {milestone.daysLeft}d to Day {milestone.day}
              </div>
            )}
            {gmmedToday && (
              <div style={{ fontSize: '10px', color: '#4ade80', marginTop: '4px' }}>&#10003; GM done</div>
            )}
          </div>
        </div>

        {/* Referral compact card */}
        {referral && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '14px 16px',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5' }}>
              {t.referralCta}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '7px 10px',
                fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace',
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
                {refCopied ? t.referralCopied : t.referralCopy}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {t.stats}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard label={t.totalTx}      value={loading ? '...' : (stats?.txCount?.toLocaleString() ?? '—')} sub={t.onBase} />
            <StatCard label={t.activeDays}   value={loading ? '...' : (stats?.activeDays?.toString() ?? '—')} sub={stats?.firstTx ? `${t.since} ${stats.firstTx}` : undefined} />
            <StatCard label={t.builderScore} value={loading ? '...' : (stats?.builderScore?.toString() ?? '—')} accent="#60a5fa" />
            <StatCard label={t.gmScore}      value={loading ? '...' : (totalScore?.toString() ?? '—')} sub={streak > 0 ? `${streak} ${t.dayStreak}` : undefined} accent="#f97316" />
          </div>
        </div>

        {/* Actions */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: '600' }}>
            {t.actions}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/gm" style={{ textDecoration: 'none' }}>
              <div style={{
                background: gmmedToday ? 'var(--bg-card)' : 'var(--bg-card)',
                border: `1px solid ${gmmedToday ? '#16a34a44' : '#f9731633'}`,
                borderRadius: '12px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {t.sendGmAction} {gmmedToday ? '\u2705' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {gmmedToday ? `${streak}${t.dayStreakSecured}` : t.dailyStreak}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '16px', color: 'var(--text-faint)' }}>&#8594;</span>
              </div>
            </Link>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {SECONDARY_ACTIONS.map(action => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card2)', border: '1px solid var(--border2)',
                    borderRadius: '10px', padding: '12px 14px', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '2px' }}>{action.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Wallet footer */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
            {address?.slice(0, 8)}&#8230;{address?.slice(-6)}
          </div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '5px 10px', background: 'var(--bg-card2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            Basescan &#8599;
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
