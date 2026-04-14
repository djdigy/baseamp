import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'

export const BUILDER_CODE = 'bc_grji576m'

// Builder Code suffix - her TX'e eklenir
export function getBuilderSuffix(): `0x${string}` {
  const encoded = new TextEncoder().encode(BUILDER_CODE)
  return `0x${Buffer.from(encoded).toString('hex')}` as `0x${string}`
}

export const config = createConfig({
  chains: [base],
  connectors: [
    // 1. Coinbase Wallet (BaseApp dahil)
    coinbaseWallet({
      appName: 'BaseAmp',
      appLogoUrl: 'https://baseamp.vercel.app/icon.png',
      preference: 'all', // hem smart wallet hem EOA destekler
    }),
    // 2. MetaMask / tarayıcı cüzdanları
    injected({
      shimDisconnect: true,
    }),
    // 3. WalletConnect (Rainbow, Trust Wallet vb.)
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'baseamp',
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
