import { Attribution } from 'ox/erc8021'

export const PLATFORM_ADDRESS = '0xbE0E7B18376171b7D215Ed3d5a1F43533dBaFD94' as `0x${string}`
/** @deprecated use PLATFORM_ADDRESS */
export const OWNER_ADDRESS = PLATFORM_ADDRESS
export const BUILDER_CODE  = 'bc_grji576m'
export const GM_FEE        = BigInt('30000000000000')   // 0.00003 ETH
export const DEPLOY_FEE    = BigInt('70000000000000')   // 0.00007 ETH

// ERC-8021 builder attribution — always generated dynamically via official encoder
export function buildERC8021Data(): `0x${string}` {
  return Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) as `0x${string}`
}

/** @deprecated use buildERC8021Data() */
export function encodeBuilderCode(code: string): `0x${string}` {
  const bytes = new TextEncoder().encode(code)
  const hex   = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `0x${hex}` as `0x${string}`
}

// GM streak milestones — single source of truth
export const MILESTONES = [3, 5, 7, 14, 30, 60, 100]
export const MILESTONE_BONUS: Record<number, number> = {
  3: 10, 5: 20, 7: 50, 14: 100, 30: 300, 60: 500, 100: 1000,
}
