'use client'

import { AppLayout } from '@/components/AppLayout'
import { useEffect, useState } from 'react'

interface Vault {
  protocol: 'Morpho' | 'Aave'
  name: string
  address: string
  asset: string
  apy: string
  tvl: string
  chain: string
  url: string
  isBtc: boolean
  isV2: boolean
}

const ASSET_COLORS: Record<string, string> = {
  cbBTC: '#f59e0b',
  WBTC: '#f97316',
  tBTC: '#ef4444',
  USDC: '#3b82f6',
  USDT: '#22c55e',
  WETH: '#8b5cf6',
  ETH: '#8b5cf6',
}

const PROTOCOL_COLORS = {
  Morpho: '#6366f1',
  Aave: '#9b59b6',
}

function AssetBadge({ symbol }: { symbol: string }) {
  const color = ASSET_COLORS[symbol] || '#64748b'
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700',
      background: color + '22',
      color, border: `1px solid ${color}44`,
      padding: '2px 7px', borderRadius: '99px',
    }}>
      {symbol}
    </span>
  )
}

function VaultRow({ vault }: { vault: Vault }) {
  const protocolColor = PROTOCOL_COLORS[vault.protocol]
  return (
    <a href={vault.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 16px',
          borderBottom: '1px solid #1a1d2744',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1a1d2744')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Protocol icon */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: protocolColor + '22', border: `1px solid ${protocolColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '800', color: protocolColor,
        }}>
          {vault.protocol === 'Morpho' ? 'M' : 'A'}
        </div>

        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vault.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <AssetBadge symbol={vault.asset} />
            {vault.isBtc && (
              <span style={{ fontSize: '9px', background: '#27200a', color: '#f59e0b', border: '1px solid #78350f', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>
                ₿ BTC
              </span>
            )}
            {vault.isV2 && (
              <span style={{ fontSize: '9px', background: '#172554', color: '#60a5fa', border: '1px solid #1e3a5f', padding: '2px 6px', borderRadius: '99px' }}>
                V2
              </span>
            )}
            <span style={{ fontSize: '10px', color: '#374151' }}>
              {vault.protocol} · Base
            </span>
          </div>
        </div>

        {/* TVL */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>TVL</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>${vault.tvl}M</div>
        </div>

        {/* APY */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>APY</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#22c55e' }}>{vault.apy}%</div>
        </div>

        {/* Arrow */}
        <div style={{ fontSize: '14px', color: '#374151', flexShrink: 0 }}>↗</div>
      </div>
    </a>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        background: active ? '#1e2235' : 'transparent',
        border: `1px solid ${active ? '#3b82f6' : '#1a1d27'}`,
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: active ? '600' : '400',
        color: active ? '#60a5fa' : '#64748b',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export default function EarnPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'btc' | 'stable' | 'morpho' | 'aave'>('all')
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    fetch('/api/vaults')
      .then(r => r.json())
      .then(d => {
        setVaults(d.vaults || [])
        setUpdatedAt(d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString() : '')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = vaults.filter(v => {
    if (filter === 'btc') return v.isBtc
    if (filter === 'stable') return ['USDC', 'USDT', 'DAI'].includes(v.asset)
    if (filter === 'morpho') return v.protocol === 'Morpho'
    if (filter === 'aave') return v.protocol === 'Aave'
    return true
  })

  const bestApy = filtered.length > 0 ? Math.max(...filtered.map(v => parseFloat(v.apy))).toFixed(2) : '0'
  const totalTvl = filtered.reduce((sum, v) => sum + parseFloat(v.tvl), 0).toFixed(0)

  return (
    <AppLayout title="Earn">
      <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Best APY', value: loading ? '...' : `${bestApy}%`, color: '#22c55e' },
            { label: 'Total TVL', value: loading ? '...' : `$${totalTvl}M`, color: '#60a5fa' },
            { label: 'Vaults', value: loading ? '...' : filtered.length.toString(), color: '#f97316' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
          <FilterButton active={filter === 'btc'} onClick={() => setFilter('btc')}>₿ BTC</FilterButton>
          <FilterButton active={filter === 'stable'} onClick={() => setFilter('stable')}>Stablecoin</FilterButton>
          <FilterButton active={filter === 'morpho'} onClick={() => setFilter('morpho')}>Morpho</FilterButton>
          <FilterButton active={filter === 'aave'} onClick={() => setFilter('aave')}>Aave</FilterButton>
        </div>

        {/* Vault list */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #1a1d27',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#d1d5db' }}>
              {loading ? 'Loading vaults...' : `${filtered.length} vaults found`}
            </div>
            {updatedAt && (
              <div style={{ fontSize: '10px', color: '#374151' }}>Updated {updatedAt}</div>
            )}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
              Loading vault data...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
              No vaults found for this filter
            </div>
          ) : (
            filtered.map((vault, i) => (
              <VaultRow key={`${vault.protocol}-${vault.address}-${i}`} vault={vault} />
            ))
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: '11px', color: '#374151', padding: '4px 0', lineHeight: '1.6' }}>
          ⚠️ APY rates are variable and change based on market conditions. Always do your own research before depositing. BaseAmp does not take any fees on deposits — you interact directly with Morpho and Aave contracts.
        </div>

      </div>
    </AppLayout>
  )
}
