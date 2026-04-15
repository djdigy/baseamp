'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { parseEther, concat, toHex } from 'viem'
import { base } from 'wagmi/chains'
import { BUILDER_CODE } from '@/lib/wagmi'

// Basit GM kontrat - sadece event emit eder
const GM_CONTRACT = '0x0000000000000000000000000000000000000000' as `0x${string}`
const GM_FEE = parseEther('0.0001')

interface StreakData {
  streak: number
  gmmedToday: boolean
  lastGm: string | null
}

function StreakEmoji({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ fontSize: '48px' }}>💤</span>
  if (streak < 3) return <span style={{ fontSize: '48px' }}>🔥</span>
  if (streak < 7) return <span style={{ fontSize: '48px' }}>🔥🔥</span>
  if (streak < 30) return <span style={{ fontSize: '48px' }}>🔥🔥🔥</span>
  return <span style={{ fontSize: '48px' }}>👑</span>
}

export default function GmPage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [streakData, setStreakData] = useState<StreakData>({ streak: 0, gmmedToday: false, lastGm: null })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Streak verisi çek
  useEffect(() => {
    if (!address) return
    setLoading(true)
    fetch(`/api/gm/streak?address=${address}`)
      .then(r => r.json())
      .then(d => setStreakData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [address])

  async function handleGM() {
    if (!walletClient || !address || !publicClient) return
    if (streakData.gmmedToday) return

    setStatus('sending')
    setError('')

    try {
      // GM mesajı encode et
      const gmMessage = toHex(new TextEncoder().encode('gm 🌅'))
      // Builder Code suffix
      const builderSuffix = toHex(new TextEncoder().encode(BUILDER_CODE))
      // Data = gm message + builder code
      const data = concat([gmMessage, builderSuffix]) as `0x${string}`

      // TX gönder - küçük fee ile
      const hash = await walletClient.sendTransaction({
        account: address,
        to: '0x000000000000000000000000000000000000dEaD' as `0x${string}`,
        value: GM_FEE,
        data,
        chain: base,
      })

      setTxHash(hash)

      // Receipt bekle
      await publicClient.waitForTransactionReceipt({ hash })

      // Streak kaydet
      const res = await fetch(`/api/gm/record?address=${address}`, { method: 'POST' })
      const newData = await res.json()
      setStreakData(newData)
      setStatus('success')
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Transaction failed')
      setStatus('error')
    }
  }

  if (!isConnected) {
    return (
      <AppLayout title="GM">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>☀</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Connect your wallet</div>
          <div style={{ fontSize: '14px', color: '#475569' }}>Send your daily GM on Base</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="GM">
      <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Streak Card */}
        <div style={{
          background: streakData.gmmedToday
            ? 'linear-gradient(135deg, #052e16, #064e3b)'
            : 'linear-gradient(135deg, #1c1208, #2d1a00)',
          border: `1px solid ${streakData.gmmedToday ? '#16a34a' : '#78350f'}`,
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: streakData.gmmedToday ? '#4ade80' : '#92400e',
              marginBottom: '8px',
            }}>
              {streakData.gmmedToday ? '✅ Today\'s GM sent!' : '🔥 GM Streak'}
            </div>
            <div style={{ fontSize: '48px', fontWeight: '900', lineHeight: 1, color: streakData.gmmedToday ? '#4ade80' : '#f97316' }}>
              {loading ? '...' : streakData.streak}
            </div>
            <div style={{ fontSize: '12px', color: streakData.gmmedToday ? '#16a34a' : '#78350f', marginTop: '4px' }}>
              {streakData.streak === 0 ? 'No streak yet — send your first GM!'
                : streakData.gmmedToday ? `${streakData.streak} day streak — come back tomorrow!`
                : `${streakData.streak} day streak — keep it going!`}
            </div>
          </div>
          <StreakEmoji streak={loading ? 0 : streakData.streak} />
        </div>

        {/* Info */}
        <div style={{
          background: '#0f1117', border: '1px solid #1a1d27',
          borderRadius: '12px', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            How it works
          </div>
          {[
            { icon: '☀', text: 'Send a GM transaction on Base daily' },
            { icon: '🔥', text: 'Build your streak — don\'t miss a day!' },
            { icon: '📎', text: `Builder Code tagged: ${BUILDER_CODE}` },
            { icon: '💰', text: 'Fee: 0.0001 ETH per GM' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#f87171' }}>
            ❌ {error}
          </div>
        )}

        {/* Success */}
        {status === 'success' && txHash && (
          <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#4ade80' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px' }}>🌅 GM sent! Streak updated.</div>
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              style={{ color: '#22c55e', textDecoration: 'none', fontSize: '11px', wordBreak: 'break-all' }}>
              View on Basescan →
            </a>
          </div>
        )}

        {/* GM Button */}
        <button
          onClick={handleGM}
          disabled={streakData.gmmedToday || status === 'sending'}
          style={{
            width: '100%', padding: '16px',
            background: streakData.gmmedToday
              ? 'linear-gradient(135deg, #16a34a, #15803d)'
              : status === 'sending'
              ? '#1a1d27'
              : 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none', borderRadius: '12px',
            fontSize: '16px', fontWeight: '800',
            color: status === 'sending' ? '#475569' : 'white',
            cursor: streakData.gmmedToday || status === 'sending' ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          {streakData.gmmedToday ? '✅ GM Sent Today!' : status === 'sending' ? '🌅 Sending GM...' : '☀ Send GM — 0.0001 ETH'}
        </button>

      </div>
    </AppLayout>
  )
}
