'use client'

import { WagmiProvider, useConnect, useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { type ReactNode, useState, useEffect, createContext, useContext } from 'react'
import { config } from '@/lib/wagmi'
import { isBaseAppBrowser } from '@/lib/baseapp'
import '@rainbow-me/rainbowkit/styles.css'

// ── Language Context ──────────────────────────────────────────────────────────
type Lang = 'en' | 'tr'
interface LangCtx { lang: Lang; setLang: (l: Lang) => void }

export const LangContext = createContext<LangCtx>({ lang: 'en', setLang: () => {} })
export function useLang() { return useContext(LangContext) }

function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ba_lang')
      if (saved === 'tr') setLangState('tr')
    } catch (_) {}
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    try { localStorage.setItem('ba_lang', l) } catch (_) {}
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

// ── BaseApp Auto-Connect ──────────────────────────────────────────────────────
// When running inside Coinbase Wallet / BaseApp browser, auto-connect injected wallet
// silently on mount — no popup, no redirect, 1-tap ready
function BaseAppAutoConnect() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  useEffect(() => {
    if (isConnected) return
    if (!isBaseAppBrowser()) return

    // Try injected (coinbaseWallet target) first, then plain injected
    const targets = ['coinbaseWallet', undefined] as const
    for (const target of targets) {
      const connector = connectors.find(c =>
        target ? c.id === `injected-${target}` || c.id === 'coinbaseWallet' || c.id === 'injected'
               : c.id === 'injected'
      )
      if (connector) {
        connect({ connector, chainId: 8453 })
        break
      }
    }
    // Fallback: connect first available injected connector
    const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'coinbaseWallet')
    if (injectedConnector) {
      connect({ connector: injectedConnector, chainId: 8453 })
    }
  }, [isConnected, connectors, connect])

  return null
}

// ── Theme wrapper ─────────────────────────────────────────────────────────────
function RainbowThemeWrapper({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const check = () => {
      try { setIsDark(localStorage.getItem('ba_theme') !== 'light') } catch (_) {}
    }
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  return (
    <RainbowKitProvider
      theme={isDark
        ? darkTheme({ accentColor: '#3b82f6', accentColorForeground: 'white', borderRadius: 'medium' })
        : lightTheme({ accentColor: '#3b82f6', accentColorForeground: 'white', borderRadius: 'medium' })
      }
    >
      {children}
    </RainbowKitProvider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={config} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        <RainbowThemeWrapper>
          <LangProvider>
            <BaseAppAutoConnect />
            {children}
          </LangProvider>
        </RainbowThemeWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
