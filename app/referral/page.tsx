'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

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

        {/* Score engine header */}
        <div style={{ background: 'linear-gradient(135deg, #0a1a1a, #081a14)', border: '1px solid #2dd4bf33', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#2dd4bf', marginBottom: '8px' }}>
            Your network grows your score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>You</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9' }}>
                {loading ? '...' : stats ? `${stats.totalReferrals * 2} score` : '—'}
              </div>
            </div>
            <div style={{ color: '#2dd4bf44', fontSize: '18px' }}>+</div>
            <div>
              <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Network today</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#2dd4bf' }}>
                {loading ? '...' : stats ? `+${stats.dailyEarnings > 0 ? stats.dailyEarnings : 0} score` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Daily earnings notification */}
        {stats && stats.dailyEarnings > 0 && (
          <div style={{ background: '#052e16', border: '1px solid #16a34a', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#4ade80' }}>
                You earned +{stats.dailyEarnings} score from referrals today
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                Your friends sent GM — you get rewarded automatically
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#d1d5db', marginBottom: '14px' }}>
            💰 How it works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: '🔗', title: 'Share your link', desc: 'Your code protects your wallet privacy' },
              { icon: '💸', title: 'They save 20%', desc: 'Referral users get 20% off all fees' },
              { icon: '🎯', title: 'You earn 10%', desc: '10% of every fee they pay goes to you' },
              { icon: '🔥', title: 'Earn from their streak', desc: '+2 score every time they send GM' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#0a0b0f', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginBottom: '3px' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Motivation text */}
          <div style={{ marginTop: '14px', padding: '10px 12px', background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '12px', color: '#60a5fa', textAlign: 'center' }}>
            🚀 Invite friends — earn from their streak every single day
          </div>
        </div>

        {/* Referral link */}
        <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Your Referral Link
          </div>

          {loading ? (
            <div style={{ fontSize: '13px', color: '#475569' }}>Generating your code...</div>
          ) : stats ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#475569' }}>Your code:</div>
                <div style={{
                  background: '#172554', border: '1px solid #1e3a5f',
                  borderRadius: '6px', padding: '4px 12px',
                  fontSize: '16px', fontWeight: '800', color: '#60a5fa',
                  letterSpacing: '0.1em', fontFamily: 'monospace',
                }}>
                  {stats.code}
                </div>
                <div style={{ fontSize: '10px', color: '#374151' }}>🔒 Wallet hidden</div>
              </div>

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
                    const text = `Join me on BaseAmp!\n\n🔥 Send daily GM & earn score\n💰 20% fee discount with my code\n\n${stats.referralLink}`
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Referrals', value: stats.totalReferrals.toString(), color: '#60a5fa' },
              { label: 'Earned (ETH)', value: stats.totalEarned, color: '#22c55e' },
              { label: 'Today Score', value: stats.dailyEarnings > 0 ? `+${stats.dailyEarnings}` : '0', color: '#f97316' },
              { label: 'Commission', value: '10%', color: '#8b5cf6' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>{item.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Referral list */}
        {stats && stats.referrals.length > 0 ? (
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d27', fontSize: '13px', fontWeight: '600', color: '#d1d5db' }}>
              Your Referrals
            </div>
            {stats.referrals.map((ref, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < stats.referrals.length - 1 ? '1px solid #1a1d2744' : 'none' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                    {ref.address.slice(0, 6)}...{ref.address.slice(-4)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{ref.date}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#22c55e' }}>+{ref.earned} ETH</div>
              </div>
            ))}
          </div>
        ) : stats && (
          <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>No referrals yet</div>
            <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>Share your link — earn from their streak every day</div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
