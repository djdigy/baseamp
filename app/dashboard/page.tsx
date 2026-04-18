'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Link from 'next/link'

import { getNextMilestone } from '@/lib/gm'

// ── Types ───────────────────────────────────────────────────────────────────
interface WalletStats { txCount: number; activeDays: number; builderScore: number; firstTx: string | null }
interface GmStatus    { streak: number; gmmedToday: boolean; score: number }
interface ReferralStatus { totalReferrals: number; dailyEarnings: number }

// ── Translations ─────────────────────────────────────────────────────────────
type Translations = {
  todayAction: string; sendGm: string; streakSecured: string; scoredAdded: string
  comeBack: string; niceshowedUp: string; shareStreak: string; copied: string
  youreOnStreak: string; dayStreak: string; progressing: string; plusScoreContinue: string
  skipWarning: string; inviteFriends: string; startStreak: string; buildingConsistency: string
  networkEarning: string; networkToday: string; referralWillEarn: string; invite1Friend: string
  stats: string; actions: string; totalTx: string; onBase: string; activeDays: string
  since: string; builderScore: string; gmScore: string; sendGmAction: string
  dayStreakSecured: string; dailyStreak: string; daysTo: string; dayTo: string
  bonus: string; keepGoingToReach: string
}

const T: Record<string, Translations> = {
  en: {
    todayAction:        "Today's action",
    sendGm:             'Send GM (+5 score)',
    streakSecured:      'Streak secured for today 🔒',
    scoredAdded:        '+5 score added',
    comeBack:           'Come back tomorrow',
    niceshowedUp:       '🎉 Nice — you showed up today',
    shareStreak:        'Share your streak →',
    copied:             '✓ Copied!',
    youreOnStreak:      "🔥 You're on a streak",
    dayStreak:          'day streak',
    progressing:        'Progress',
    plusScoreContinue:  '+5 score when you continue',
    skipWarning:        'Skip today → streak resets',
    inviteFriends:      'Invite friends → earn extra score daily',
    startStreak:        'Start your streak today — Day 1 begins here',
    buildingConsistency:"You're building consistency",
    networkEarning:     '⚡ Your network is earning for you',
    networkToday:       'score from referrals today',
    referralWillEarn:   'Your referrals will earn for you tomorrow too',
    invite1Friend:      'Invite 1 friend → your score grows daily',
    stats:              'Stats',
    actions:            'Actions',
    totalTx:            'Total TX',
    onBase:             'on Base',
    activeDays:         'Active Days',
    since:              'since',
    builderScore:       'Builder Score',
    gmScore:            'GM Score',
    sendGmAction:       'Send GM',
    dayStreakSecured:   '-day streak secured',
    dailyStreak:        'Daily streak · +5 score',
    daysTo:             'days to',
    dayTo:              'day to',
    bonus:              'bonus',
    keepGoingToReach:   'Keep going to reach',
  },
  tr: {
    todayAction:        'Günün görevi',
    sendGm:             'GM Gönder (+5 puan)',
    streakSecured:      'Bugünkü seri güvende 🔒',
    scoredAdded:        '+5 puan eklendi',
    comeBack:           'Yarın geri dön',
    niceshowedUp:       '🎉 Aferin — bugün de geldin',
    shareStreak:        'Serini paylaş →',
    copied:             '✓ Kopyalandı!',
    youreOnStreak:      '🔥 Seride devam ediyorsun',
    dayStreak:          'günlük seri',
    progressing:        'İlerleme',
    plusScoreContinue:  'Devam edersen +5 puan',
    skipWarning:        'Bugün atlarsan serin sıfırlanır',
    inviteFriends:      'Arkadaşlarını davet et → her gün ekstra puan kazan',
    startStreak:        'Bugün seri başlat — 1. gün buradan başlar',
    buildingConsistency:'Tutarlılık inşa ediyorsun',
    networkEarning:     '⚡ Ağın senin için kazanıyor',
    networkToday:       'bugün referanslardan puan',
    referralWillEarn:   'Referansların yarın da senin için kazanacak',
    invite1Friend:      '1 arkadaşını davet et → her gün puanın büyür',
    stats:              'İstatistikler',
    actions:            'Eylemler',
    totalTx:            'Toplam TX',
    onBase:             "Base'de",
    activeDays:         'Aktif Gün',
    since:              'tarihinden beri',
    builderScore:       'Builder Puanı',
    gmScore:            'GM Puanı',
    sendGmAction:       'GM Gönder',
    dayStreakSecured:   ' günlük seri güvende',
    dailyStreak:        'Günlük seri · +5 puan',
    daysTo:             'gün kaldı',
    dayTo:              'gün kaldı',
    bonus:              'bonus',
    keepGoingToReach:   'Ulaşmak için devam et:',
  },
}
type Lang = 'en' | 'tr'



// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: accent || 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

// ── LangToggle ───────────────────────────────────────────────────────────────
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

// ── ShareStreak ──────────────────────────────────────────────────────────────
function ShareStreak({ streak, t }: { streak: number; t: typeof T['en'] }) {
  const [copied, setCopied] = useState(false)
  const milestone = getNextMilestone(streak)
  const targetDay = milestone?.day ?? 7

  function handleShare() {
    const text = `🔥 Day ${streak} streak on BaseAmp\nDidn't break it today.\nGoing for Day ${targetDay} bonus 🚀\nCan you keep up?\nbaseamp.vercel.app 👀`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }).catch(() => {})
  }

  return (
    <button onClick={handleShare} style={{
      background: 'none', border: 'none', padding: '0 0 8px',
      fontSize: '12px', color: copied ? '#4ade80' : '#4ade8055',
      cursor: 'pointer', textAlign: 'left', display: 'block', transition: 'color 0.2s',
    }}>
      {copied ? t.copied : t.shareStreak}
    </button>
  )
}

// ── Secondary actions ─────────────────────────────────────────────────────────
const SECONDARY_ACTIONS = [
  { title: '💰 Earn Yield',      desc: 'Morpho & Aave',    href: '/earn',     border: '#16a34a' },
  { title: '🔁 Swap',            desc: '17 DEXes on Base', href: '/swap',     border: '#2563eb' },
  { title: '🚀 Deploy Contract', desc: 'ERC20, NFT',       href: '/deploy',   border: '#7c3aed' },
  { title: '👥 Referral',        desc: '10% commission',   href: '/referral', border: '#0d9488' },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus] = useState<GmStatus | null>(null)
  const [referralStatus, setReferralStatus] = useState<ReferralStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<Lang>('en')

  // Restore saved language preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ba_lang') as Lang | null
      if (saved === 'tr') setLang('tr')
    } catch (_) {}
  }, [])

  // Fetch all data once address is available
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

  // ── Not connected ─────────────────────────────────────────────────────────
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
              { icon: '💰', label: 'Earn Yield',        desc: 'Morpho + Aave' },
              { icon: '🚀', label: 'Deploy Contracts',  desc: 'ERC20 / NFT'   },
              { icon: '☀',  label: 'Daily GM',          desc: 'Build streak'  },
              { icon: '👥', label: 'Referral',          desc: 'Earn commission'},
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const gmmedToday   = gmStatus?.gmmedToday ?? false
  const streak       = gmStatus?.streak ?? 0
  const milestone    = getNextMilestone(streak)
  const hasReferrals = (referralStatus?.totalReferrals ?? 0) > 0
  const dailyRefScore = referralStatus?.dailyEarnings ?? 0
  const totalScore   = gmStatus?.score ?? 0

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Lang toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {/* ── PRIMARY ACTION BLOCK ─────────────────────────────────────── */}
        {gmmedToday ? (
          // GM done
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
              <div style={{ fontSize: '13px', color: '#86efaccc', fontWeight: '500', marginBottom: '4px' }}>
                {t.niceshowedUp}
              </div>
              <ShareStreak streak={streak} t={t} />
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>
                {t.streakSecured}
              </div>
              <div style={{ fontSize: '12px', color: '#4ade80bb', marginBottom: '6px' }}>
                {t.scoredAdded}
              </div>
              <div style={{ fontSize: '13px', color: '#4ade8099' }}>
                {t.comeBack} → Day {streak + 1}
              </div>
              <div style={{ fontSize: '11px', color: '#2dd4bf66', marginTop: '6px' }}>
                {hasReferrals
                  ? `⚡ +${dailyRefScore > 0 ? dailyRefScore : '—'} ${t.networkToday}`
                  : t.invite1Friend}
              </div>
              {hasReferrals && (
                <div style={{ fontSize: '10px', color: '#2dd4bf44', marginTop: '2px' }}>
                  {t.referralWillEarn}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <style>{`@keyframes streakGlow { 0% { text-shadow: 0 0 12px #4ade80cc; } 100% { text-shadow: none; } }`}</style>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#4ade80', lineHeight: 1, animation: 'streakGlow 1.8s ease-out forwards' }}>
                {streak}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{t.dayStreak}</div>
              <div style={{ fontSize: '10px', color: '#4ade8055', marginTop: '2px' }}>{t.buildingConsistency}</div>
              {milestone && (
                <div style={{ fontSize: '10px', color: '#16a34a88', marginTop: '3px' }}>
                  {milestone.daysLeft}d → Day {milestone.day} +{milestone.bonus}
                </div>
              )}
            </div>
          </div>
        ) : (
          // No GM yet
          <div style={{
            background: 'linear-gradient(135deg, #0f1a2e, #1a0f2e)',
            border: '1px solid #2563eb55', borderRadius: '14px', padding: '20px 24px',
          }}>
            <div style={{ fontSize: '11px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '8px' }}>
              {t.todayAction}
            </div>
            {streak > 0 ? (
              <>
                <div style={{ fontSize: '13px', color: '#f97316cc', fontWeight: '600', marginBottom: '4px' }}>
                  {t.youreOnStreak}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9', marginBottom: '6px' }}>
                  Day {streak} {t.dayStreak}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '3px' }}>
                  {t.progressing}: Day {streak} → Day {streak + 1}
                </div>
                <div style={{ fontSize: '12px', color: '#60a5fa66', marginBottom: '3px' }}>
                  {t.plusScoreContinue}
                </div>
                {milestone && (
                  <div style={{ fontSize: '12px', color: '#fbbf24aa', marginBottom: '3px' }}>
                    {milestone.daysLeft <= 3
                      ? `${milestone.daysLeft} ${t.daysTo} Day ${milestone.day} → +${milestone.bonus} ${t.bonus}`
                      : `${t.keepGoingToReach} Day ${milestone.day} → +${milestone.bonus} ${t.bonus}`}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#ef444466', marginBottom: '12px' }}>
                  {t.skipWarning}
                </div>
                <Link href="/referral" style={{ textDecoration: 'none', display: 'block', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#2dd4bf99' }}>{t.inviteFriends}</div>
                </Link>
              </>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                {t.startStreak}
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

        {/* Referral multiplier hook */}
        <Link href="/referral" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid #2dd4bf22',
            borderRadius: '10px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {hasReferrals ? (
              <>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#2dd4bf' }}>{t.networkEarning}</div>
                  <div style={{ fontSize: '11px', color: '#2dd4bf66', marginTop: '2px' }}>
                    +{dailyRefScore > 0 ? dailyRefScore : '—'} {t.networkToday}
                  </div>
                </div>
                <span style={{ fontSize: '14px', color: '#2dd4bf44' }}>→</span>
              </>
            ) : (
              <>
                <div style={{ fontSize: '12px', color: '#2dd4bf66' }}>{t.invite1Friend}</div>
                <span style={{ fontSize: '14px', color: '#2dd4bf33' }}>→</span>
              </>
            )}
          </div>
        </Link>

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
                      {t.sendGmAction} {gmmedToday ? '✅' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {gmmedToday ? `${streak}${t.dayStreakSecured}` : t.dailyStreak}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '16px', color: 'var(--text-faint)' }}>→</span>
              </div>
            </Link>

            {/* Secondary actions — 2-col, low contrast */}
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

        {/* Wallet footer */}
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
