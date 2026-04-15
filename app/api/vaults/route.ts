import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FALLBACK_VAULTS = [
  { protocol: 'Morpho', name: 'Gauntlet cbBTC Core', address: '0xa0e430870c4604ccfc7b38ca7845b1ff653d0ff1', asset: 'cbBTC', apy: '4.51', tvl: '180', chain: 'Base', url: 'https://app.morpho.org/base/vault?vault=0xa0e430870c4604ccfc7b38ca7845b1ff653d0ff1', isBtc: true, isV2: true },
  { protocol: 'Morpho', name: 'Steakhouse WBTC Prime', address: '0x', asset: 'WBTC', apy: '3.82', tvl: '95', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: true, isV2: false },
  { protocol: 'Morpho', name: 'Moonwell Flagship USDC', address: '0xa0e430870c4604ccfc7b38ca7845b1ff653d0ff2', asset: 'USDC', apy: '4.02', tvl: '22', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: false, isV2: true },
  { protocol: 'Morpho', name: 'Steakhouse Prime USDC', address: '0x', asset: 'USDC', apy: '4.01', tvl: '50', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: false, isV2: false },
  { protocol: 'Morpho', name: 'Gauntlet USDC Prime', address: '0x', asset: 'USDC', apy: '4.02', tvl: '20', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: false, isV2: true },
  { protocol: 'Morpho', name: 'Re7 WETH Core', address: '0x', asset: 'WETH', apy: '3.14', tvl: '67', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: false, isV2: false },
  { protocol: 'Aave', name: 'Aave USDC Supply', address: '0x', asset: 'USDC', apy: '4.80', tvl: '210', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
  { protocol: 'Aave', name: 'Aave ETH Supply', address: '0x', asset: 'WETH', apy: '2.10', tvl: '180', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
  { protocol: 'Aave', name: 'Aave cbBTC Supply', address: '0x', asset: 'cbBTC', apy: '0.50', tvl: '95', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: true, isV2: false },
]

export async function GET(req: NextRequest) {
  try {
    const morphoQuery = `{
      vaults(
        where: { chainId_in: [8453] }
        orderBy: TotalAssetsUsd
        orderDirection: Desc
        first: 20
      ) {
        items {
          name
          address
          totalAssetsUsd
          state { apy netApy }
          asset { symbol }
        }
      }
    }`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const morphoRes = await fetch('https://blue-api.morpho.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 BaseAmp/1.0',
      },
      body: JSON.stringify({ query: morphoQuery }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!morphoRes.ok) throw new Error(`Morpho API error: ${morphoRes.status}`)

    const morphoData = await morphoRes.json()
    const items = morphoData?.data?.vaults?.items || []

    if (items.length === 0) throw new Error('No vaults returned')

    const morphoVaults = items.map((v: any) => ({
      protocol: 'Morpho',
      name: v.name,
      address: v.address,
      asset: v.asset?.symbol || 'USDC',
      apy: v.state?.apy ? (v.state.apy * 100).toFixed(2) : '0.00',
      tvl: v.totalAssetsUsd ? (v.totalAssetsUsd / 1e6).toFixed(1) : '0',
      chain: 'Base',
      url: `https://app.morpho.org/base/vault?vault=${v.address}`,
      isBtc: ['cbBTC', 'WBTC', 'tBTC'].some(b =>
        (v.name || '').toUpperCase().includes(b.toUpperCase()) ||
        (v.asset?.symbol || '').toUpperCase().includes(b.toUpperCase())
      ),
      isV2: (v.name || '').includes('V2'),
    }))

    const aaveVaults = [
      { protocol: 'Aave', name: 'Aave USDC Supply', address: '0x', asset: 'USDC', apy: '4.80', tvl: '210', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
      { protocol: 'Aave', name: 'Aave ETH Supply', address: '0x', asset: 'WETH', apy: '2.10', tvl: '180', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
      { protocol: 'Aave', name: 'Aave cbBTC Supply', address: '0x', asset: 'cbBTC', apy: '0.50', tvl: '95', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: true, isV2: false },
    ]

    const allVaults = [...morphoVaults, ...aaveVaults]
    allVaults.sort((a, b) => {
      if (a.isBtc && !b.isBtc) return -1
      if (!a.isBtc && b.isBtc) return 1
      return parseFloat(b.apy) - parseFloat(a.apy)
    })

    return NextResponse.json({ vaults: allVaults, source: 'live', updatedAt: new Date().toISOString() })

  } catch (err: any) {
    // Fallback — statik data
    const sorted = [...FALLBACK_VAULTS].sort((a, b) => {
      if (a.isBtc && !b.isBtc) return -1
      if (!a.isBtc && b.isBtc) return 1
      return parseFloat(b.apy) - parseFloat(a.apy)
    })
    return NextResponse.json({ vaults: sorted, source: 'fallback', updatedAt: new Date().toISOString() })
  }
}
