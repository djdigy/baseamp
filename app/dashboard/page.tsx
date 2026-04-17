'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface WalletStats {
  txCount: number
  activeDays: number
  totalVolume: string
  builderScore: number
  firstTx: string | null
}

interface GmStatus {
  streak: number
  gmmedToday: boolean
  score: number
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: color || '#475569', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

const SECONDARY_ACTIONS = [
  { title: '💰 Earn Yield', desc: 'Morpho & Aave vaults', href: '/earn', border: '#16a34a' },
  { title: '🔁 Swap Tokens', desc: '17 DEXes on Base', href: '/swap', border: '#2563eb' },
  { title: '🚀 Deploy Contract', desc: 'ERC20, ERC721, ERC1155', href: '/deploy', border: '#7c3aed' },
  { title: '👥 Referral', desc: 'Earn 10% commission', href: '/referral', border: '#0d9488' },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [gmStatus, setGmStatus] = useState<GmStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      fetch(`/api/wallet-stats?address=${address}`).then(r => r.json()),
      fetch(`/api/gm/streak?address=${address}`).then(r => r.json()),
    ])
      .then(([walletData, gmData]) => {
        setStats(walletData)
        setGmStatus(gmData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [address])

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <AppLayout title="Dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
          <div style={{ fontSize: '56px' }}>⚡</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
              Welcome to BaseAmp
            </div>
            <div style={{ fontSize: '14px', color: '#475569', maxWidth: '340px', lineHeight: '1.6' }}>
              Connect your wallet to start earning on Base.
            </div>
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '420px', width: '100%', marginTop: '8px' }}>
            {[
              { icon: '💰', label: 'Earn Yield', desc: 'Morpho + Aave' },
              { icon: '🚀', label: 'Deploy Contracts', desc: 'ERC20 / NFT' },
              { icon: '☀', label: 'Daily GM', desc: 'Build streak' },
              { icon: '👥', label: 'Referral', desc: 'Earn commission' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{f.label}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Primary action state ─────────────────────────────────────────────────
  const gmmedToday = gmStatus?.gmmedToday ?? false
  const streak = gmStatus?.streak ?? 0

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── PRIMARY ACTION BLOCK ─────────────────────────────────────── */}
        {gmmedToday ? (
          // GM done state
          <div style={{
            background: 'linear-gradient(135deg, #052e16, #064e3b)',
            border: '1px solid #16a34a55',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '6px' }}>
                Today's Action
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' }}>
                ✅ GM sent today
              </div>
              <div style={{ fontSize: '13px', color: '#4ade8099' }}>
                Come back tomorrow to keep your streak
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#4ade80', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>day streak</div>
            </div>
          </div>
        ) : (
          // No GM yet — primary CTA
          <div style={{
            background: 'linear-gradient(135deg, #0f1a2e, #1a0f2e)',
            border: '1px solid #2563eb55',
            borderRadius: '14px',
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: '11px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', marginBottom: '8px' }}>
              Today's Action
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>
              🔥 {streak > 0 ? 'Maintain your streak' : 'Start your daily streak'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Send GM and earn +5 score{streak > 0 ? ` · ${streak}-day streak at risk` : ''}
            </div>
            <Link href="/gm" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '13px 28px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 0 24px #3b82f630',
                transition: 'opacity 0.15s',
              }}>
                Send GM ☀
              </button>
            </Link>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <StatCard
            label="Total TX"
            value={loading ? '...' : (stats?.txCount?.toLocaleString() ?? '—')}
            sub="on Base mainnet"
          />
          <StatCard
            label="Active Days"
            value={loading ? '...' : (stats?.activeDays?.toString() ?? '—')}
            sub={stats?.firstTx ? `since ${stats.firstTx}` : 'no activity yet'}
          />
          <StatCard
            label="Builder Score"
            value={loading ? '...' : (stats?.builderScore?.toString() ?? '—')}
            sub="Base network"
            color="#60a5fa"
          />
          <StatCard
            label="GM Score"
            value={loading ? '...' : (gmStatus?.score?.toString() ?? '—')}
            sub="from daily GMs"
            color="#f97316"
          />
        </div>

        {/* Quick actions — GM is dominant, others secondary */}
        <div>
          <div style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: '600' }}>
            Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* GM — visually dominant */}
            <Link href="/gm" style={{ textDecoration: 'none' }}>
              <div style={{
                background: gmmedToday ? '#0a1a0a' : '#0f1117',
                border: `1px solid ${gmmedToday ? '#16a34a44' : '#f9731633'}`,
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = gmmedToday ? '#16a34a88' : '#f97316')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = gmmedToday ? '#16a34a44' : '#f9731633')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>☀</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
                      Send GM {gmmedToday ? '✅' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>
                      {gmmedToday ? `Done · ${streak}-day streak` : 'Daily streak + +5 score'}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '16px', color: '#374151' }}>→</span>
              </div>
            </Link>

            {/* Secondary actions — lower contrast, 2-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {SECONDARY_ACTIONS.map(action => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#0a0c12',
                    border: '1px solid #13161f',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = action.border)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#13161f')}
                  >
                    <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: '600', marginBottom: '2px' }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#374151' }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Wallet info + builder code — condensed, no noise */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Connected Wallet</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8' }}>{address}</div>
            <div style={{ fontSize: '10px', color: '#374151', marginTop: '3px' }}>Builder Code: bc_grji576m</div>
          </div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '6px 12px', background: '#172554', borderRadius: '6px', border: '1px solid #1e3a5f' }}>
            Basescan ↗
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
