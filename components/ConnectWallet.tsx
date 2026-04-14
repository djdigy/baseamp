'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        style={{
          background: '#1a1d27', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '6px 14px',
          fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer',
        }}
      >
        {address.slice(0, 6)}...{address.slice(-4)} ✕
      </button>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      style={{
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        border: 'none', borderRadius: '8px', padding: '6px 14px',
        fontSize: '12px', color: 'white', cursor: 'pointer', fontWeight: '600',
      }}
    >
      Connect Wallet
    </button>
  )
}
