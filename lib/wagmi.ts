import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { base } from 'wagmi/chains'
import {
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  rabbyWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'baseamp_wc'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, metaMaskWallet, rabbyWallet, walletConnectWallet, rainbowWallet, injectedWallet],
    },
  ],
  { appName: 'BaseAmp', projectId }
)

export const config = createConfig({
  chains: [base],
  connectors,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: { [base.id]: http('https://mainnet.base.org') },
})

declare module 'wagmi' {
  interface Register { config: typeof config }
}
