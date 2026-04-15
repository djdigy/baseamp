'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

interface ReferralStats {
  referralCode: string
  referralLink: string
  totalReferrals: number
  totalEarned: string
  referrals: Array<{ address: string; date: string; earned: string }>
}

export default function ReferralPage() {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    fetch(`/api/referral/stats?address=${address}`)
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false))
  }, [address])

  function copyLink() {
    if (!stats) return
    navigator.clipboard.writeText(stats.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isConnected) {
    return (
      <AppLayout title="Referral">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>👥</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Connect your wallet</div>
          <div style={{ fontSize: '14px', color: '#475569' }}>Get your referral link and start earning</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Referral">
      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* How it works */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '14px' }}>
            💰 How Referral Works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { icon: '🔗', title: 'Share your link', desc: 'Send your unique referral link to friends' },
              { icon: '💸', title: 'They save 20%', desc: 'Referral users pay 20% less on all fees' },
              { icon: '🎯', title: 'You earn 10%', desc: '10% of every fee they pay goes to you' },
              { icon: '♾️', title: 'Forever', desc: 'Commissions never expire — earn forever' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#0a0b0f', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginBottom: '3px' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Your referral link */}
        <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Your Referral Link
          </div>

          {loading ? (
            <div style={{ fontSize: '13px', color: '#475569' }}>Loading...</div>
          ) : stats ? (
            <>
              <div style={{
                background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '8px',
                padding: '10px 14px', fontSize: '12px', color: '#60a5fa',
                fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '12px',
              }}>
                {stats.referralLink}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={copyLink}
                  style={{
                    flex: 1, padding: '10px',
                    background: copied ? '#052e16' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: copied ? '1px solid #16a34a' : 'none',
                    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    color: copied ? '#4ade80' : 'white', cursor: 'pointer',
                  }}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>

                <button
                  onClick={() => {
                    const text = `Join me on BaseAmp — earn on Base daily! Use my referral link for 20% fee discount:\n\n${stats.referralLink}`
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  style={{
                    padding: '10px 16px', background: '#1a1d27',
                    border: '1px solid #1e2235', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '600', color: '#94a3b8', cursor: 'pointer',
                  }}
                >
                  𝕏 Share
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Total Referrals', value: stats.totalReferrals.toString(), color: '#60a5fa' },
              { label: 'Total Earned', value: `${stats.totalEarned} ETH`, color: '#22c55e' },
              { label: 'Commission Rate', value: '10%', color: '#f97316' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{item.label}</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Referral list */}
        {stats && stats.referrals.length > 0 && (
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '14px' }}>
              Your Referrals
            </div>
            {stats.referrals.map((ref, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: i < stats.referrals.length - 1 ? '1px solid #1a1d2744' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                    {ref.address.slice(0, 6)}...{ref.address.slice(-4)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{ref.date}</div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>
                  +{ref.earned} ETH
                </div>
              </div>
            ))}
          </div>
        )}

        {stats && stats.referrals.length === 0 && (
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>No referrals yet</div>
            <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>Share your link to start earning</div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
