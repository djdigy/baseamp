// Shared in-memory store (serverless'ta her instance ayrı - Redis ile replace edilecek)
export const referralStore = new Map<string, {
  referrals: Array<{ address: string; date: string; earned: string }>
  totalEarned: number
}>()
