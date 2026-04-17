export const OWNER_ADDRESS = '0xDE77EaEa4Dae7dBEde8d5093E9A9C37b16176D52' as `0x${string}`
export const BUILDER_CODE = 'bc_grji576m'
export const GM_FEE = BigInt('100000000000000')      // 0.0001 ETH
export const DEPLOY_FEE = BigInt('500000000000000')   // 0.0005 ETH (gizli)
export const REFERRAL_DISCOUNT = 80n
export const REFERRAL_COMMISSION = 10n

// GM streak milestones — single source of truth
export const MILESTONES = [3, 5, 7, 14, 30, 60, 100]
export const MILESTONE_BONUS: Record<number, number> = {
  3: 10, 5: 20, 7: 50, 14: 100, 30: 300, 60: 500, 100: 1000,
}
