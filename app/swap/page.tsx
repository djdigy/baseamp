'use client'

import { AppLayout } from '@/components/AppLayout'
import { PageInfo } from '@/components/PageInfo'

interface Dex {
  name: string
  url: string
  desc: string
  category: 'aggregator' | 'dex' | 'stable'
  volume?: string
  logo: string
}

const DEXES: Dex[] = [
  // Aggregators — en iyi fiyat
  { name: '1inch', url: 'https://app.1inch.io/#/8453/simple/swap', desc: 'Best price aggregator', category: 'aggregator', logo: '🔮' },
  { name: 'Matcha', url: 'https://matcha.xyz/?chain=base', desc: '0x protocol aggregator', category: 'aggregator', logo: '🍵' },
  { name: 'Odos', url: 'https://app.odos.xyz/?chainId=8453', desc: 'Smart order routing', category: 'aggregator', logo: '⚡' },
  { name: 'Paraswap', url: 'https://app.paraswap.io/#/base', desc: 'Multi-path routing', category: 'aggregator', logo: '🔷' },
  { name: 'DeFiLlama Swap', url: 'https://swap.defillama.com/?chain=base', desc: 'Best rates from DeFiLlama', category: 'aggregator', logo: '🦙' },

  // Ana DEX'ler
  { name: 'Aerodrome', url: 'https://aerodrome.finance/swap', desc: '#1 DEX on Base by volume', category: 'dex', volume: '$680M/d', logo: '✈️' },
  { name: 'Uniswap V3', url: 'https://app.uniswap.org/#/swap?chain=base', desc: 'Leading decentralized exchange', category: 'dex', volume: '$350M/d', logo: '🦄' },
  { name: 'PancakeSwap', url: 'https://pancakeswap.finance/swap?chain=base', desc: 'Multi-chain AMM', category: 'dex', volume: '$90M/d', logo: '🥞' },
  { name: 'SushiSwap', url: 'https://app.sushi.com/swap?chainId=8453', desc: 'Community-driven DEX', category: 'dex', logo: '🍣' },
  { name: 'Maverick', url: 'https://app.mav.xyz/?chain=8453', desc: 'Dynamic liquidity pools', category: 'dex', logo: '🎯' },
  { name: 'BaseSwap', url: 'https://baseswap.fi/swap', desc: 'Base-native DEX', category: 'dex', logo: '🔵' },
  { name: 'RocketSwap', url: 'https://rocketswap.exchange/#/swap', desc: 'Base ecosystem DEX', category: 'dex', logo: '🚀' },
  { name: 'SwapBased', url: 'https://swapbased.finance/#/swap', desc: 'Base community DEX', category: 'dex', logo: '💎' },
  { name: 'Balancer', url: 'https://app.balancer.fi/#/base/swap', desc: 'Weighted pools & swaps', category: 'dex', logo: '⚖️' },
  { name: 'Velodrome', url: 'https://velodrome.finance/swap', desc: 'Optimism ecosystem AMM', category: 'dex', logo: '🎡' },

  // Stablecoin
  { name: 'Curve', url: 'https://curve.fi/#/base/swap', desc: 'Best stablecoin swaps', category: 'stable', logo: '📈' },
  { name: 'Fibrous', url: 'https://fibrous.finance', desc: 'Aggregator on Base', category: 'aggregator', logo: '🌐' },
]

const CATEGORY_LABELS = {
  aggregator: { label: 'Aggregators', desc: 'Best price across all DEXs', color: '#8b5cf6' },
  dex: { label: 'DEX', desc: 'Direct liquidity pools', color: '#3b82f6' },
  stable: { label: 'Stablecoin', desc: 'Optimized stable swaps', color: '#22c55e' },
}

function DexCard({ dex }: { dex: Dex }) {
  const cat = CATEGORY_LABELS[dex.category]
  return (
    <a
      href={dex.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: '#0f1117',
        border: '1px solid #1a1d27',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1d27')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#1a1d27', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '18px', flexShrink: 0,
          }}>
            {dex.logo}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>{dex.name}</div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{dex.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {dex.volume && (
            <span style={{ fontSize: '11px', color: '#374151', background: '#1a1d27', padding: '3px 8px', borderRadius: '6px' }}>
              {dex.volume}
            </span>
          )}
          <span style={{ fontSize: '14px', color: '#374151' }}>↗</span>
        </div>
      </div>
    </a>
  )
}

export default function SwapPage() {
  const categories = ['aggregator', 'dex', 'stable'] as const

  return (
    <AppLayout title="Swap">
      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <PageInfo
          en={'This is where you swap tokens on Base.\nUsing different platforms helps you find better prices. Trying multiple apps shows real usage.'}
          tr={'Burası token takası yapabileceğin yer.\nFarklı platformlar daha iyi fiyat bulmanı sağlar. Birden fazla uygulama kullanmak gerçek kullanım gösterir.'}
        />

        {/* Info banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f1a2e, #0a1628)',
          border: '1px solid #1e3a5f',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{ fontSize: '28px' }}>🔁</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' }}>
              Best Base DEXs & Aggregators
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              Click any DEX to swap directly on Base mainnet. Aggregators give the best price across all pools.
            </div>
          </div>
        </div>

        {/* DEX kategorileri */}
        {categories.map(cat => {
          const items = DEXES.filter(d => d.category === cat)
          const info = CATEGORY_LABELS[cat]
          return (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: info.color, borderRadius: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>{info.label}</div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>{info.desc}</div>
                </div>
                <div style={{
                  marginLeft: 'auto', fontSize: '10px',
                  background: '#1a1d27', color: '#4b5563',
                  padding: '2px 8px', borderRadius: '99px',
                }}>
                  {items.length} platforms
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(dex => <DexCard key={dex.name} dex={dex} />)}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: '11px', color: '#374151', textAlign: 'center', padding: '8px 0' }}>
          All swaps happen directly on the respective platforms. BaseAmp does not take any swap fees.
        </div>
      </div>
    </AppLayout>
  )
}
