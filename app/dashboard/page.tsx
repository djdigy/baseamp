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

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: color || '#475569', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

const QUICK_ACTIONS = [
  { title: '💰 Earn Yield', desc: 'Morpho & Aave vaults', href: '/earn', color: '#22c55e', border: '#16a34a' },
  { title: '🔁 Swap Tokens', desc: '17 DEXes on Base', href: '/swap', color: '#3b82f6', border: '#2563eb' },
  { title: '🚀 Deploy Contract', desc: 'ERC20, ERC721, ERC1155', href: '/deploy', color: '#8b5cf6', border: '#7c3aed' },
  { title: '☀ Send GM', desc: 'Daily streak + Builder Code', href: '/gm', color: '#f97316', border: '#ea580c' },
  { title: '👥 Referral', desc: 'Earn 10% commission', href: '/referral', color: '#2dd4bf', border: '#0d9488' },
]

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    fetch(`/api/wallet-stats?address=${address}`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [address])

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
              Your Base network dashboard. Connect wallet to see your stats, earn yield, deploy contracts and more.
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

  return (
    <AppLayout title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
            label="Wallet"
            value={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—'}
            sub="Base mainnet"
            color="#22c55e"
          />
        </div>

        {/* Quick actions */}
        <div>
          <div style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: '600' }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {QUICK_ACTIONS.map(action => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#0f1117',
                  border: '1px solid #1a1d27',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = action.border)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1d27')}
                >
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{action.title.split(' ')[0]}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginBottom: '3px' }}>
                    {action.title.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569' }}>{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Wallet info */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>Connected Wallet</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8' }}>{address}</div>
          </div>
          <a href={`https://basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', padding: '6px 12px', background: '#172554', borderRadius: '6px', border: '1px solid #1e3a5f' }}>
            Basescan ↗
          </a>
        </div>

        {/* Network info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Network', value: 'Base Mainnet', sub: 'Chain ID: 8453', color: '#3b82f6' },
            { label: 'Builder Code', value: 'bc_grji576m', sub: 'Auto-tagged on TXs', color: '#8b5cf6' },
            { label: 'Status', value: '🟢 Live', sub: 'All systems operational', color: '#22c55e' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '11px', color: '#374151', marginTop: '3px' }}>{item.sub}</div>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  )
}
