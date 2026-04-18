'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { useLang } from '@/components/Providers'

interface ReferralStats {
  code: string
  referralLink: string
  totalReferrals: number
  totalEarned: string
  dailyEarnings: number
  referrals: Array<{ address: string; date: string; earned: string }>
}

export default function ReferralPage() {
  const { address, isConnected } = useAccount()
  const { lang } = useLang()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      fetch(`/api/referral/code?address=${address}`).then(r => r.json()),
      fetch(`/api/referral/stats?address=${address}`).then(r => r.json()),
    ]).then(([codeData, statsData]) => {
      setStats({
        code: codeData.code,
        referralLink: codeData.link,
        totalReferrals: statsData.totalReferrals,
        totalEarned: statsData.totalEarned,
        dailyEarnings: statsData.dailyEarnings ?? 0,
        referrals: statsData.referrals,
      })
    }).finally(() => setLoading(false))
  }, [address])

  function copyLink() {
    if (!stats) return
    navigator.clipboard.writeText(stats.referralLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const labels = {
    en: { referrals: 'Referrals', earned: 'Earned (ETH)', todayScore: 'Today Score', commission: 'Commission', yourLink: 'Your Referral Link', copy: 'Copy', share: 'Share', yourReferrals: 'Your Referrals', noReferrals: 'No referrals yet', noReferralsSub: 'Share your link to get started', copied: 'Copied!' },
    tr: { referrals: 'Referanslar', earned: 'Kazanılan (ETH)', todayScore: 'Bugün Puan', commission: 'Komisyon', yourLink: 'Referral Linkin', copy: 'Kopyala', share: 'Paylaş', yourReferrals: 'Referansların', noReferrals: 'Henüz referans yok', noReferralsSub: 'Linkinizi paylaşarak başlayın', copied: 'Kopyalandı!' },
  }
  const l = labels[lang as 'en' | 'tr'] ?? labels.en

  if (!isConnected) {
    return (
      <AppLayout title="Referral">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Connect your wallet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Get your referral link and start earning</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Referral">
      <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Stats grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: l.referrals,   value: stats.totalReferrals.toString(), color: '#60a5fa' },
              { label: l.earned,      value: stats.totalEarned,               color: '#22c55e' },
              { label: l.todayScore,  value: stats.dailyEarnings > 0 ? `+${stats.dailyEarnings}` : '0', color: '#f97316' },
              { label: l.commission,  value: '10%',                           color: '#8b5cf6' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Referral link */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            {l.yourLink}
          </div>
          {loading ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : stats ? (
            <>
              <div style={{
                background: 'var(--bg-card2)', border: '1px solid var(--border)',
                borderRadius: '6px', padding: '9px 12px',
                fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace',
                wordBreak: 'break-all', marginBottom: '10px',
              }}>
                {stats.referralLink}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={copyLink}
                  style={{
                    flex: 1, padding: '9px',
                    background: copied ? '#052e16' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: copied ? '1px solid #16a34a' : 'none',
                    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    color: copied ? '#4ade80' : 'white', cursor: 'pointer',
                  }}
                >
                  {copied ? l.copied : l.copy}
                </button>
                <button
                  onClick={() => {
                    const text = `Join me on BaseAmp!\n\nSend daily GM & earn score\n20% fee discount with my code\n\n${stats.referralLink}`
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  style={{
                    padding: '9px 16px', background: 'var(--bg-card2)',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer',
                  }}
                >
                  {l.share}
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Referral list */}
        {stats && stats.referrals.length > 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {l.yourReferrals}
            </div>
            {stats.referrals.map((ref, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < stats.referrals.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {ref.address.slice(0, 6)}...{ref.address.slice(-4)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{ref.date}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#22c55e' }}>+{ref.earned} ETH</div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{l.noReferrals}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>{l.noReferralsSub}</div>
          </div>
        ) : null}

      </div>
    </AppLayout>
  )
}
