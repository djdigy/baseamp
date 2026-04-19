'use client'

import { Sidebar, MobileTabBar } from './Sidebar'
import { ConnectWallet } from './ConnectWallet'
import { ThemeToggle } from './ThemeToggle'
import { useLang } from './Providers'
import { useEffect, useState } from 'react'

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer', letterSpacing: '0.04em' }}
    >
      {lang === 'en' ? 'TR' : 'EN'}
    </button>
  )
}

export function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar — hidden on mobile */}
      {!isMobile && <Sidebar />}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: isMobile ? '10px 14px' : '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* Mobile: logo + title */}
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: 'white' }}>B</div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</span>
            </div>
          ) : (
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</div>
          )}

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
            <LangToggle />
            <ThemeToggle />
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid #2563eb22', borderRadius: '99px', padding: '5px 12px', fontSize: '12px', color: '#60a5fa' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
                Base Mainnet
              </div>
            )}
            <ConnectWallet />
          </div>
        </div>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: isMobile ? '14px 12px' : '20px 24px',
          overflowY: 'auto',
          // Add bottom padding on mobile for tab bar
          paddingBottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom))' : '20px',
        }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && <MobileTabBar />}
    </div>
  )
}
