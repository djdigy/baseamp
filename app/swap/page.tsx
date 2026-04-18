'use client'

import { AppLayout } from '@/components/AppLayout'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'

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

const CATEGORY_COLORS = {
  aggregator: '#8b5cf6',
  dex: '#3b82f6',
  stable: '#22c55e',
}

function getCategoryLabels(lang: 'en' | 'tr') {
  const s = TEXT.swap
  return {
    aggregator: { label: tx(s.aggregators, lang), desc: tx(s.aggregatorDesc, lang), color: CATEGORY_COLORS.aggregator },
    dex:        { label: tx(s.dex, lang),         desc: tx(s.dexDesc, lang),        color: CATEGORY_COLORS.dex },
    stable:     { label: tx(s.stable, lang),       desc: tx(s.stableDesc, lang),     color: CATEGORY_COLORS.stable },
  }
}

function DexCard({ dex }: { dex: Dex }) {
  const cat = { color: CATEGORY_COLORS[dex.category] }
  function track() {
    try { fetch('/api/track', { method: 'POST', body: JSON.stringify({ event: 'dex_click', dex: dex.name }) }) } catch (_) {}
  }
  return (
    <a
      href={dex.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--bg-card2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '18px', flexShrink: 0,
          }}>
            {dex.logo}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{dex.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{dex.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {dex.volume && (
            <span style={{ fontSize: '11px', color: 'var(--text-faint)', background: 'var(--bg-card2)', padding: '3px 8px', borderRadius: '6px' }}>
              {dex.volume}
            </span>
          )}
          <span style={{ fontSize: '14px', color: 'var(--text-faint)' }}>↗</span>
        </div>
      </div>
    </a>
  )
}

export default function SwapPage() {
  const { lang } = useLang()
  const s = TEXT.swap
  const categories = ['aggregator', 'dex', 'stable'] as const
  const categoryLabels = getCategoryLabels(lang)

  return (
    <AppLayout title="Swap">
      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {tx(s.pageInfo, lang)}
        </div>

        {/* Info banner */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px 20px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {tx(s.bannerTitle, lang)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {tx(s.bannerSub, lang)}
          </div>
        </div>

        {/* Bridge section — ABOVE DEX list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '3px', height: '18px', background: '#f97316', borderRadius: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {lang === 'tr' ? 'Köprü (Bridge) — Buradan başla ↓' : 'Bridge Assets — Start here if you are new ↓'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px', paddingLeft: '13px' }}>
            {lang === 'tr'
              ? "Bu, airdrop uygunluğu için en güçlü sinyallerden biridir. Ethereum'dan Base'e farklı günlerde köprüle — hepsini aynı anda değil. Köprülemeyi atlarsan aktiviten eksik görünebilir."
              : "This is one of the strongest signals for airdrop eligibility. Bridge from Ethereum to Base across different days — not all at once. If you skip bridging, your activity may look incomplete."}
          </div>
          <a href="https://superbridge.app" target="_blank" rel="noopener noreferrer"
            onClick={() => { try { fetch('/api/track', { method: 'POST', body: JSON.stringify({ event: 'superbridge_click' }) }) } catch (_) {} }}
            style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#f97316')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f9731622', border: '1px solid #f9731644', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  🌉
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Superbridge</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {lang === 'tr'
                      ? 'Bridge yap → ilk gerçek aktivite sinyalini oluştur'
                      : 'Bridge now → build your first real activity signal'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--text-faint)' }}>↗</span>
            </div>
          </a>
        </div>

        {/* DEX kategorileri */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          {lang === 'tr'
            ? 'Farklı günlerde birden fazla DEX kullan — tek platform zayıf sinyal. Swaplarını zamana yay, hacim değil süreklilik önemli.'
            : 'Use multiple DEXs across different days — using only one platform is a weak signal. Spread your swaps over time — consistency beats volume.'}
        </div>
        {categories.map(cat => {
          const items = DEXES.filter(d => d.category === cat)
          const info = categoryLabels[cat]
          return (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '18px', background: info.color, borderRadius: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{info.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{info.desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '10px', background: 'var(--bg-card2)', color: 'var(--text-faint)', padding: '2px 8px', borderRadius: '99px' }}>
                  {items.length} {tx(s.platforms, lang)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(dex => <DexCard key={dex.name} dex={dex} />)}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: '11px', color: 'var(--text-faint)', textAlign: 'center', padding: '8px 0', lineHeight: '1.6' }}>
          {lang === 'tr'
            ? 'İyi başlangıç — yarın başka bir DEX kullan. Dış platformlarda builder code taşınmaz.'
            : 'Good start — now use another DEX tomorrow. External swaps do not carry builder code.'}
        </div>
      </div>
    </AppLayout>
  )
}
