'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈', group: 'Main' },
  { href: '/earn', label: 'Earn', icon: '💰', group: 'Main', badge: 'NEW' },
  { href: '/swap', label: 'Swap', icon: '🔁', group: 'Main' },
  { href: '/deploy', label: 'Deploy', icon: '🚀', group: 'Tools' },
  { href: '/gm', label: 'GM', icon: '☀', group: 'Tools' },
  { href: '/referral', label: 'Referral', icon: '👥', group: 'Tools' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { address } = useAccount()

  return (
    <aside style={{
      width: '220px', background: '#0f1117',
      borderRight: '1px solid #1a1d27',
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px', borderBottom: '1px solid #1a1d27', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: '900', color: 'white', flexShrink: 0,
        }}>B</div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
            Base<span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Amp</span>
          </div>
          <div style={{ fontSize: '9px', color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Base Dashboard
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px' }}>
        {['Main', 'Tools'].map(group => (
          <div key={group} style={{ marginBottom: '4px' }}>
            <div style={{ fontSize: '10px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: '4px', marginTop: '12px' }}>
              {group}
            </div>
            {NAV.filter(i => i.group === group).map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px', marginBottom: '2px',
                    fontSize: '13px',
                    color: active ? '#60a5fa' : '#6b7280',
                    background: active ? '#1e2235' : 'transparent',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: '14px' }}>{item.icon}</span>
                    {item.label}
                    {item.badge && (
                      <span style={{ marginLeft: 'auto', background: '#1e3a5f', color: '#60a5fa', fontSize: '9px', padding: '2px 6px', borderRadius: '99px' }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Wallet */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #1a1d27' }}>
        {address ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#1a1d27', borderRadius: '8px', fontSize: '12px', color: '#9ca3af' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        ) : (
          <div style={{ padding: '8px 10px', background: '#1a1d27', borderRadius: '8px', fontSize: '12px', color: '#4b5563', textAlign: 'center' }}>
            Not connected
          </div>
        )}
      </div>
    </aside>
  )
}
