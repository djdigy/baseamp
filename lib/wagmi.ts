import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet as coinbaseWalletRK,
  walletConnectWallet,
  rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'baseamp_wc'

// RainbowKit connectors (desktop/non-BaseApp)
const rkConnectors = connectorsForWallets(
  [{ groupName: 'Recommended', wallets: [coinbaseWalletRK, metaMaskWallet, rabbyWallet, walletConnectWallet, rainbowWallet] }],
  { appName: 'BaseAmp', projectId }
)

export const config = createConfig({
  chains: [base],
  // injected() first — auto-detected in BaseApp / Coinbase Wallet browser
  connectors: [
    injected({ target: 'coinbaseWallet' }),
    injected(),
    coinbaseWallet({ appName: 'BaseAmp', chainId: base.id }),
    ...rkConnectors,
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: { [base.id]: http('https://mainnet.base.org') },
})

declare module 'wagmi' {
  interface Register { config: typeof config }
}
