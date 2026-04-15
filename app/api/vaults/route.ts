import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Morpho GraphQL API
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
          asset { symbol address }
          metadata { description }
        }
      }
    }`

    const morphoRes = await fetch('https://blue-api.morpho.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: morphoQuery }),
      next: { revalidate: 300 }, // 5 dakika cache
    })

    let morphoVaults: any[] = []
    if (morphoRes.ok) {
      const morphoData = await morphoRes.json()
      morphoVaults = (morphoData?.data?.vaults?.items || []).map((v: any) => ({
        protocol: 'Morpho',
        name: v.name,
        address: v.address,
        asset: v.asset?.symbol || 'USDC',
        apy: v.state?.apy ? (v.state.apy * 100).toFixed(2) : '0.00',
        tvl: v.totalAssetsUsd ? (v.totalAssetsUsd / 1e6).toFixed(1) : '0',
        chain: 'Base',
        url: `https://app.morpho.org/base/vault?vault=${v.address}`,
        isBtc: ['cbBTC', 'WBTC', 'tBTC', 'BTC'].some(b =>
          v.name?.toUpperCase().includes(b) || v.asset?.symbol?.toUpperCase().includes(b)
        ),
        isV2: v.name?.includes('V2') || true,
      }))
    }

    // Aave static data (API yok, hardcode)
    const aaveVaults = [
      { protocol: 'Aave', name: 'Aave USDC Supply', address: '0x', asset: 'USDC', apy: '4.80', tvl: '210', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
      { protocol: 'Aave', name: 'Aave ETH Supply', address: '0x', asset: 'WETH', apy: '2.10', tvl: '180', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
      { protocol: 'Aave', name: 'Aave cbBTC Supply', address: '0x', asset: 'cbBTC', apy: '0.50', tvl: '95', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: true, isV2: false },
    ]

    const allVaults = [...morphoVaults, ...aaveVaults]

    // BTC önce, sonra APY'ye göre sırala
    allVaults.sort((a, b) => {
      if (a.isBtc && !b.isBtc) return -1
      if (!a.isBtc && b.isBtc) return 1
      return parseFloat(b.apy) - parseFloat(a.apy)
    })

    return NextResponse.json({ vaults: allVaults, updatedAt: new Date().toISOString() })
  } catch (err) {
    // Fallback static data
    return NextResponse.json({
      vaults: [
        { protocol: 'Morpho', name: 'Gauntlet cbBTC Core', address: '0x', asset: 'cbBTC', apy: '4.51', tvl: '180', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: true, isV2: true },
        { protocol: 'Morpho', name: 'Steakhouse WBTC Prime', address: '0x', asset: 'WBTC', apy: '3.82', tvl: '95', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: true, isV2: false },
        { protocol: 'Morpho', name: 'Moonwell Flagship USDC', address: '0x', asset: 'USDC', apy: '4.02', tvl: '22', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: false, isV2: true },
        { protocol: 'Morpho', name: 'Steakhouse Prime USDC', address: '0x', asset: 'USDC', apy: '4.01', tvl: '50', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: false, isV2: false },
        { protocol: 'Morpho', name: 'Gauntlet USDC Prime', address: '0x', asset: 'USDC', apy: '4.02', tvl: '20', chain: 'Base', url: 'https://app.morpho.org/base', isBtc: false, isV2: true },
        { protocol: 'Aave', name: 'Aave USDC Supply', address: '0x', asset: 'USDC', apy: '4.80', tvl: '210', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
        { protocol: 'Aave', name: 'Aave ETH Supply', address: '0x', asset: 'WETH', apy: '2.10', tvl: '180', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: false, isV2: false },
        { protocol: 'Aave', name: 'Aave cbBTC Supply', address: '0x', asset: 'cbBTC', apy: '0.50', tvl: '95', chain: 'Base', url: 'https://app.aave.com/?marketName=proto_base_v3', isBtc: true, isV2: false },
      ],
      updatedAt: new Date().toISOString(),
    })
  }
}
