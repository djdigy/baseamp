# BaseAmp — Project Guide for Claude

## RULES
- DO NOT rebuild the app
- DO NOT redesign the UI
- ONLY extend functionality
- Keep code minimal and efficient
- No unnecessary comments or console.logs
- Always build before pushing

## PROJECT
- **Type:** Next.js 14 + TypeScript + Tailwind CSS 3
- **Chain:** Base Mainnet (chainId 8453)
- **Deploy:** baseamp.vercel.app (djdigys-projects/baseamp)
- **Repo:** github.com/djdigy/baseamp
- **Builder Code:** bc_grji576m
- **Owner:** 0xDE77EaEa4Dae7dBEde8d5093E9A9C37b16176D52

## STACK
- wagmi v2 + viem + @tanstack/react-query
- Upstash Redis (clever-ewe-88312.upstash.io) — KV_REST_API_URL + KV_REST_API_TOKEN
- No ORM, no SQL DB

## STRUCTURE
```
app/
  dashboard/page.tsx     — wallet stats (Basescan API)
  earn/page.tsx          — Morpho + Aave vaults (client-side fetch)
  swap/page.tsx          — DEX links only
  deploy/page.tsx        — ERC20 deploy (useSendTransaction)
  gm/page.tsx            — daily GM streak
  referral/page.tsx      — short code referral system
  api/
    gm/streak/           — GET streak (Redis: gm:{address})
    gm/record/           — POST record GM (Redis)
    referral/code/       — GET/create short code (Redis: refcode:addr:{addr}, refcode:code:{code})
    referral/register/   — POST link referrer→referee
    referral/stats/      — GET stats (in-memory referralStore ⚠️)
    vaults/              — GET Morpho+Aave vaults
    wallet-stats/        — GET tx count, active days
components/
  AppLayout.tsx          — sidebar + topbar (calls useReferral)
  Sidebar.tsx            — nav links
  ConnectWallet.tsx      — Coinbase + MetaMask + WalletConnect dropdown
  Providers.tsx          — wagmi + react-query
hooks/
  useReferral.ts         — reads ?ref= param, auto-registers
lib/
  constants.ts           — OWNER_ADDRESS, BUILDER_CODE, GM_FEE, DEPLOY_FEE
  redis.ts               — Upstash wrapper with in-memory fallback
  referralStore.ts       — ⚠️ IN-MEMORY only (not persistent)
  wagmi.ts               — wagmi config
```

## KNOWN ISSUES / TODO
1. **referralStore** — in-memory, resets on serverless cold start → migrate to Redis
2. **ERC20 bytecode** — not verified on Basescan yet
3. **ERC721/ERC1155** — deploy page shows options but only ERC20 works
4. **Basescan API key** — empty in env, wallet-stats returns limited data
5. **Morpho live data** — blocked from Vercel server, uses client-side fetch + fallback

## FEES (HIDDEN FROM UI)
- GM: 0.0001 ETH → OWNER_ADDRESS
- Deploy: 0.0005 ETH → OWNER_ADDRESS (paid before contract deploy)
- Referral: 20% discount for referee, 10% commission tracked off-chain

## REDIS KEY SCHEMA
- `gm:{address}` → `{ streak: number, lastDate: string }`
- `refcode:addr:{address}` → `shortCode`
- `refcode:code:{shortCode}` → `address`

## ENV VARS (Vercel)
- NEXT_PUBLIC_BUILDER_CODE
- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_CHAIN_ID
- YOUTUBE_API_KEY
- KV_REST_API_URL
- KV_REST_API_TOKEN

## DEPLOY COMMANDS
```bash
cd /home/claude/baseamp
npm run build          # always verify before push
git add -A
git commit -m "..."
git push origin main   # Vercel auto-deploys
```
