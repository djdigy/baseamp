'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState, useEffect, createContext, useContext } from 'react'
import { config } from '@/lib/wagmi'

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

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <LangProvider>
          {children}
        </LangProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
