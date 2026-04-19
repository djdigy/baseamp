export const PLATFORM_ADDRESS = '0xbE0E7B18376171b7D215Ed3d5a1F43533dBaFD94' as `0x${string}`
/** @deprecated use PLATFORM_ADDRESS */
export const OWNER_ADDRESS = PLATFORM_ADDRESS
export const BUILDER_CODE  = 'bc_grji576m'
export const GM_FEE        = BigInt('30000000000000')   // 0.00003 ETH
export const DEPLOY_FEE    = BigInt('70000000000000')   // 0.00007 ETH

// ERC-8021 builder attribution data
// Format: [builder_code_utf8] [length_byte] [schema_id=0x00] [ERC_sentinel]
// = 0x62635f67726a693537366d 0b 00 80218021802180218021802180218021
// This is the ONLY correct format for all TX data fields.
// Verified onchain: TX 0xd17fe987... (deploy) and 0x86fb42b6... (GM)
export function buildERC8021Data(): `0x${string}` {
  // Inline to avoid runtime import issues — precomputed from:
  // Attribution.toDataSuffix({ codes: ['bc_grji576m'] })
  return '0x62635f67726a693537366d0b0080218021802180218021802180218021' as `0x${string}`
}

/** @deprecated use buildERC8021Data() — does NOT include ERC-8021 sentinel */
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
