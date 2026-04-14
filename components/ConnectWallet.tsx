'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState } from 'react'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showMenu, setShowMenu] = useState(false)

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        style={{
          background: '#1a1d27',
          border: '1px solid #1e2235',
          borderRadius: '8px',
          padding: '6px 14px',
          fontSize: '12px',
          color: '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 16px',
          fontSize: '12px',
          color: 'white',
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: '#13151c',
          border: '1px solid #1a1d27',
          borderRadius: '12px',
          padding: '8px',
          zIndex: 100,
          minWidth: '200px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector })
                setShowMenu(false)
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1d27')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {connector.name === 'Coinbase Wallet' && '🔵'}
              {connector.name === 'MetaMask' && '🦊'}
              {connector.name === 'WalletConnect' && '🔗'}
              {!['Coinbase Wallet', 'MetaMask', 'WalletConnect'].includes(connector.name) && '👛'}
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
