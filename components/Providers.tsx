'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { type ReactNode, useState, useEffect, createContext, useContext } from 'react'
import { config } from '@/lib/wagmi'
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

// ── Theme awareness for RainbowKit ────────────────────────────────────────────
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowThemeWrapper>
          <LangProvider>
            {children}
          </LangProvider>
        </RainbowThemeWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
