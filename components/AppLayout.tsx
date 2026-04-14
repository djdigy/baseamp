'use client'

import { Sidebar } from './Sidebar'
import { ConnectWallet } from './ConnectWallet'

export function AppLayout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#1a1d27', border: '1px solid #2563eb22',
              borderRadius: '99px', padding: '5px 12px',
              fontSize: '12px', color: '#60a5fa',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />
              Base Mainnet
            </div>
            <ConnectWallet />
          </div>
        </div>
        {/* Content */}
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
