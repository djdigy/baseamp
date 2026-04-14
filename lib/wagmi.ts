import { http, createConfig, createStorage, cookieStorage } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { hexToBytes } from 'viem'

const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE || 'bc_grji576m'

function encodeBuilderCode(code: string): `0x${string}` {
  const encoded = new TextEncoder().encode(code)
  return `0x${Buffer.from(encoded).toString('hex')}` as `0x${string}`
}

export const BUILDER_DATA_SUFFIX = encodeBuilderCode(BUILDER_CODE)

export const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'BaseAmp',
      appLogoUrl: 'https://baseamp.vercel.app/icon.png',
    }),
    injected(),
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
