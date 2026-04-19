'use client'

import { AppLayout } from '@/components/AppLayout'
import { useEffect, useState } from 'react'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'

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

// Gerçek Morpho Base vault'ları - doğru adres ve URL'ler
const MORPHO_FALLBACK: Vault[] = [
  { protocol: 'Morpho', name: 'Moonwell Frontier cbBTC', address: '0x543257eF2161176D7C8cD90BA65C2d4CaEF5a796', asset: 'cbBTC', apy: '—', tvl: '95', chain: 'Base', url: 'https://app.morpho.org/base/vault/0x543257eF2161176D7C8cD90BA65C2d4CaEF5a796/mwcbbtc', isBtc: true, isV2: false },
  { protocol: 'Morpho', name: 'Re7 USDC', address: '0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e', asset: 'USDC', apy: '—', tvl: '30', chain: 'Base', url: 'https://app.morpho.org/base/vault/0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e/re7usdc', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Clearstar USDC Reactor', address: '0x1D3b1Cd0a0f242d598834b3F2d126dC6bd774657', asset: 'USDC', apy: '—', tvl: '25', chain: 'Base', url: 'https://app.morpho.org/base/vault/0x1D3b1Cd0a0f242d598834b3F2d126dC6bd774657/csusdc', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Steakhouse High Yield USDC', address: '0xBEEFA7B88064FeEF0cEe02AAeBBd95D30df3878F', asset: 'USDC', apy: '—', tvl: '40', chain: 'Base', url: 'https://app.morpho.org/base/vault/0xBEEFA7B88064FeEF0cEe02AAeBBd95D30df3878F/bbqusdc', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Steakhouse Prime USDC', address: '0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2', asset: 'USDC', apy: '—', tvl: '50', chain: 'Base', url: 'https://app.morpho.org/base/vault/0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2/steakusdc', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Gauntlet USDC Prime', address: '0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61', asset: 'USDC', apy: '—', tvl: '20', chain: 'Base', url: 'https://app.morpho.org/base/vault/0xeE8F4eC5672F09119b96Ab6fB59C27E1b7e44b61/gtUSDCp', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Moonwell Flagship USDC', address: '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca', asset: 'USDC', apy: '—', tvl: '22', chain: 'Base', url: 'https://app.morpho.org/base/vault/0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca/mwusdc', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Gauntlet WETH Core', address: '0x6b13c060F13Af1fdB319F52315BbbF3fb1D88844', asset: 'WETH', apy: '—', tvl: '45', chain: 'Base', url: 'https://app.morpho.org/base/vault/0x6b13c060F13Af1fdB319F52315BbbF3fb1D88844/gtwethc', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Moonwell Flagship ETH', address: '0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1', asset: 'WETH', apy: '—', tvl: '67', chain: 'Base', url: 'https://app.morpho.org/base/vault/0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1/mweth', isBtc: false, isV2: false },
]

const AAVE_VAULTS: Vault[] = [
  { protocol: 'Aave', name: 'Aave USDC Supply', address: '0x', asset: 'USDC', apy: '—', tvl: '210', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
  { protocol: 'Aave', name: 'Aave ETH Supply', address: '0x', asset: 'WETH', apy: '—', tvl: '180', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
  { protocol: 'Aave', name: 'Aave cbBTC Supply', address: '0x', asset: 'cbBTC', apy: '—', tvl: '95', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: true, isV2: false },
]

const ASSET_COLORS: Record<string, string> = {
  cbBTC: '#f59e0b', WBTC: '#f97316', tBTC: '#ef4444',
  USDC: '#3b82f6', USDT: '#22c55e', WETH: '#8b5cf6', ETH: '#8b5cf6',
  EURC: '#60a5fa', msETH: '#a78bfa',
}
const PROTOCOL_COLORS = { Morpho: '#6366f1', Aave: '#9b59b6' }

function AssetBadge({ symbol }: { symbol: string }) {
  const color = ASSET_COLORS[symbol] || '#64748b'
  return (
    <span style={{ fontSize: '10px', fontWeight: '700', background: color + '22', color, border: `1px solid ${color}44`, padding: '2px 7px', borderRadius: '99px' }}>
      {symbol}
    </span>
  )
}

function VaultRow({ vault }: { vault: Vault }) {
  const pc = PROTOCOL_COLORS[vault.protocol]
  return (
    <a href={vault.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: pc + '22', border: `1px solid ${pc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: pc }}>
          {vault.protocol === 'Morpho' ? 'M' : 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vault.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <AssetBadge symbol={vault.asset} />
            {vault.isBtc && <span style={{ fontSize: '9px', background: 'var(--bg-card2)', color: '#f59e0b', border: '1px solid #f59e0b44', padding: '2px 6px', borderRadius: '99px', fontWeight: '700' }}>₿ BTC</span>}
            {vault.isV2 && <span style={{ fontSize: '9px', background: 'var(--bg-card2)', color: '#60a5fa', border: '1px solid #60a5fa44', padding: '2px 6px', borderRadius: '99px' }}>V2</span>}
            <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{vault.protocol} · Base</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>TVL</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{vault.tvl !== '—' ? `$${vault.tvl}M` : '—'}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Est. APY</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: parseFloat(vault.apy) > 0 ? '#22c55e' : 'var(--text-faint)' }}>{vault.apy !== '0.0' ? `${vault.apy}%` : '—'}</div>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-faint)', flexShrink: 0 }}>↗</div>
      </div>
    </a>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 14px', background: active ? 'var(--bg-card2)' : 'transparent', border: `1px solid ${active ? '#3b82f6' : 'var(--border)'}`, borderRadius: '8px', fontSize: '12px', fontWeight: active ? '600' : '400', color: active ? '#60a5fa' : 'var(--text-muted)', cursor: 'pointer' }}>
      {children}
    </button>
  )
}

export default function EarnPage() {
  const { lang } = useLang()
  const e = TEXT.earn
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'btc' | 'stable' | 'morpho' | 'aave'>('all')
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')

  useEffect(() => {
    async function loadVaults() {
      setLoading(true)

      // Fallback shows — for APY so we never show stale numbers as if live
      const SAFE_FALLBACK: Vault[] = MORPHO_FALLBACK.map(v => ({ ...v, apy: '—' }))
      let morphoVaults: Vault[] = SAFE_FALLBACK

      try {
        // Use netApy (yield after fees) — matches what user sees on protocol page
        const query = `{ vaults(where: { chainId_in: [8453] } orderBy: TotalAssetsUsd orderDirection: Desc first: 30) { items { name address symbol state { netApy totalAssetsUsd } asset { symbol } } } }`
        const res = await fetch('https://blue-api.morpho.org/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) {
          const data = await res.json()
          const items = data?.data?.vaults?.items || []
          if (items.length > 0) {
            morphoVaults = items.map((v: any) => {
              const sym      = (v.symbol || '').toLowerCase()
              const assetSym = v.asset?.symbol || 'USDC'
              const netApy   = v.state?.netApy
              const tvlUsd   = v.state?.totalAssetsUsd
              return {
                protocol: 'Morpho' as const,
                name: v.name,
                address: v.address,
                asset: assetSym,
                // netApy is the number users see on Morpho UI — use it, not gross apy
                apy: netApy != null && netApy > 0 ? (netApy * 100).toFixed(1) : '—',
                tvl: tvlUsd != null ? (tvlUsd / 1_000_000).toFixed(1) : '—',
                chain: 'Base',
                url: `https://app.morpho.org/base/vault/${v.address}/${sym}`,
                isBtc: ['cbbtc', 'wbtc', 'tbtc'].some(b => sym.includes(b) || assetSym.toLowerCase().includes(b)),
                isV2: v.name?.includes('V2') || false,
              }
            })
            setSource('live')
          }
        }
      } catch { /* show dashes — never stale numbers */ }

      const all = [...morphoVaults, ...AAVE_VAULTS]
      all.sort((a, b) => {
        if (a.isBtc && !b.isBtc) return -1
        if (!a.isBtc && b.isBtc) return 1
        return parseFloat(b.apy) - parseFloat(a.apy)
      })
      setVaults(all)
      setLoading(false)
    }
    loadVaults()
  }, [])

  const filtered = vaults.filter(v => {
    if (filter === 'btc') return v.isBtc
    if (filter === 'stable') return ['USDC', 'USDT', 'DAI', 'EURC'].includes(v.asset)
    if (filter === 'morpho') return v.protocol === 'Morpho'
    if (filter === 'aave') return v.protocol === 'Aave'
    return true
  })

  const bestApy = filtered.length > 0 ? Math.max(...filtered.map(v => parseFloat(v.apy))).toFixed(1) : '0'
  const totalTvlNum = filtered.filter(v => v.tvl !== '—').reduce((sum, v) => sum + parseFloat(v.tvl), 0)
  const totalTvl = totalTvlNum > 0 ? totalTvlNum.toFixed(0) : '—'

  return (
    <AppLayout title="Earn">
      <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {tx(e.pageInfo, lang)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Best Est. APY', value: loading ? '...' : `${bestApy}%`, color: '#22c55e' },
            { label: 'Total TVL', value: loading ? '...' : totalTvl === '—' ? '—' : `$${totalTvl}M`, color: '#60a5fa' },
            { label: 'Vaults', value: loading ? '...' : filtered.length.toString(), color: '#f97316' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
          <FilterButton active={filter === 'btc'} onClick={() => setFilter('btc')}>₿ BTC</FilterButton>
          <FilterButton active={filter === 'stable'} onClick={() => setFilter('stable')}>Stablecoin</FilterButton>
          <FilterButton active={filter === 'morpho'} onClick={() => setFilter('morpho')}>Morpho</FilterButton>
          <FilterButton active={filter === 'aave'} onClick={() => setFilter('aave')}>Aave</FilterButton>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {loading ? 'Loading vaults...' : `${filtered.length} vaults`}
            </div>
            <div style={{ fontSize: '10px', color: source === 'live' ? '#22c55e' : '#94a3b8' }}>
              {source === 'live' ? '🟢 Live APY' : '⚠️ Estimated APY'}
            </div>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : filtered.map((v, i) => <VaultRow key={i} vault={v} />)}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: '1.6' }}>
          ⚠️ APY values are estimates from live data when available, or cached values as fallback. Rates are variable. Always verify on the protocol page.
        </div>
      </div>
    </AppLayout>
  )
}
