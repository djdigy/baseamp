'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'

interface WalletStats {
  txCount: number
  activeDays: number
  totalVolume: string
  builderScore: number
  firstTx: string
}

function StatCard({ label, value, sub, color }: { label: string, value: string, sub?: string, color?: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '14px 16px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: color || 'var(--text-muted)', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

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
      .finally(() => setLoading(false))
  }, [address])

  return (
    <AppLayout title="Dashboard">
      {!isConnected ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: '16px',
        }}>
          <div style={{ fontSize: '48px' }}>🔗</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Connect your wallet
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Connect to see your Base Network stats
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <StatCard
              label="Total TX"
              value={loading ? '...' : (stats?.txCount?.toLocaleString() ?? '—')}
              sub="on Base mainnet"
            />
            <StatCard
              label="Active Days"
              value={loading ? '...' : (stats?.activeDays?.toString() ?? '—')}
              sub={stats?.firstTx ? `since ${stats.firstTx}` : undefined}
            />
            <StatCard
              label="Total Volume"
              value={loading ? '...' : (stats?.totalVolume ?? '—')}
              sub="estimated"
              color="#22c55e"
            />
            <StatCard
              label="Builder Score"
              value={loading ? '...' : (stats?.builderScore?.toString() ?? '—')}
              sub="Base network"
              color="#60a5fa"
            />
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { title: '💰 Earn Yield', desc: 'Morpho & Aave vaults', href: '/earn', color: '#22c55e' },
              { title: '🚀 Deploy Contract', desc: 'ERC20, ERC721, ERC1155', href: '/deploy', color: '#8b5cf6' },
              { title: '☀ Send GM', desc: 'Daily streak + Builder Code', href: '/gm', color: '#f97316' },
            ].map(item => (
              <a key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '16px', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.desc}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Wallet address */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Connected Wallet</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{address}</div>
            </div>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none' }}
            >
              View on Basescan →
            </a>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
