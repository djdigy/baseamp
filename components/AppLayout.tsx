'use client'

import { Sidebar } from './Sidebar'
import { ConnectWallet } from './ConnectWallet'
import { ThemeToggle } from './ThemeToggle'
import { useReferral } from '@/hooks/useReferral'
import { useLang } from './Providers'

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
      title="Switch language"
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '5px 10px', fontSize: '12px', fontWeight: '700',
        color: 'var(--text-secondary)', cursor: 'pointer', letterSpacing: '0.04em',
      }}
    >
      {lang === 'en' ? 'TR' : 'EN'}
    </button>
  )
}

export function AppLayout({ children, title }: { children: React.ReactNode, title: string }) {
  useReferral()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LangToggle />
            <ThemeToggle />
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-card)', border: '1px solid #2563eb22',
              borderRadius: '99px', padding: '5px 12px',
              fontSize: '12px', color: '#60a5fa',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
              Base Mainnet
            </div>
            <ConnectWallet />
          </div>
        </div>
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
