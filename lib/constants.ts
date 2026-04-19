export const OWNER_ADDRESS = '0xDE77EaEa4Dae7dBEde8d5093E9A9C37b16176D52' as `0x${string}`
export const BUILDER_CODE  = 'bc_grji576m'
export const GM_FEE        = BigInt('30000000000000')   // 0.00003 ETH
export const DEPLOY_FEE    = BigInt('70000000000000')   // 0.00007 ETH

// Encode builder code as hex for tx data field
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
