'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { concat, toHex, parseEther } from 'viem'
import { base } from 'wagmi/chains'
import { BUILDER_CODE, OWNER_ADDRESS, GM_FEE, REFERRAL_DISCOUNT } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'

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
  const { referrer } = useReferral()

  const [streakData, setStreakData] = useState<StreakData>({ streak: 0, gmmedToday: false, lastGm: null })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(GM_FEE, hasReferral)
  const feeDisplay = hasReferral ? '0.00008 ETH (20% off!)' : '0.0001 ETH'

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
    setTxHash('')

    try {
      const builderSuffix = toHex(new TextEncoder().encode(BUILDER_CODE))
      const data = builderSuffix as `0x${string}`

      // Fee: %10 referrer'a, %90 owner'a
      let hash: `0x${string}`

      if (hasReferral && referrer) {
        // Önce referrer'a komisyon gönder (%10)
        const referrerFee = (fee * 10n) / 100n
        const ownerFee = fee - referrerFee

        // Batch değil — tek TX owner'a, ayrı komisyon
        hash = await walletClient.sendTransaction({
          account: address,
          to: OWNER_ADDRESS,
          value: fee, // tüm fee owner'a
          data,
          chain: base,
        })

        // Referrer komisyonunu backend'e kaydet
        await fetch('/api/referral/commission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrer, referee: address, amount: referrerFee.toString() }),
        })
      } else {
        hash = await walletClient.sendTransaction({
          account: address,
          to: OWNER_ADDRESS,
          value: fee,
          data,
          chain: base,
        })
      }

      setTxHash(hash)
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
          background: streakData.gmmedToday ? 'linear-gradient(135deg, #052e16, #064e3b)' : 'linear-gradient(135deg, #1c1208, #2d1a00)',
          border: `1px solid ${streakData.gmmedToday ? '#16a34a' : '#78350f'}`,
          borderRadius: '16px', padding: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: streakData.gmmedToday ? '#4ade80' : '#92400e', marginBottom: '8px' }}>
              {streakData.gmmedToday ? "✅ Today's GM sent!" : '🔥 GM Streak'}
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
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { icon: '☀', text: 'Send a GM transaction on Base daily' },
            { icon: '🔥', text: "Build your streak — don't miss a day!" },
            { icon: '📎', text: `Builder Code: ${BUILDER_CODE} (auto-tagged)` },
            { icon: '💰', text: `Fee: ${feeDisplay}${hasReferral ? ' 🎉' : ''}` },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
          {hasReferral && (
            <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#4ade80', marginTop: '4px' }}>
              🎉 Referral aktif! 20% indirim uygulandı.
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#f87171' }}>
            ❌ {error}
          </div>
        )}

        {status === 'success' && txHash && (
          <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#4ade80' }}>
            <div style={{ fontWeight: '600', marginBottom: '6px' }}>🌅 GM sent! Streak updated.</div>
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              style={{ color: '#22c55e', textDecoration: 'none', fontSize: '11px', wordBreak: 'break-all' }}>
              View on Basescan →
            </a>
          </div>
        )}

        <button
          onClick={handleGM}
          disabled={streakData.gmmedToday || status === 'sending'}
          style={{
            width: '100%', padding: '16px',
            background: streakData.gmmedToday ? 'linear-gradient(135deg, #16a34a, #15803d)' : status === 'sending' ? '#1a1d27' : 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800',
            color: status === 'sending' ? '#475569' : 'white',
            cursor: streakData.gmmedToday || status === 'sending' ? 'not-allowed' : 'pointer',
          }}
        >
          {streakData.gmmedToday ? '✅ GM Sent Today!' : status === 'sending' ? '🌅 Sending GM...' : `☀ Send GM — ${feeDisplay}`}
        </button>
      </div>
    </AppLayout>
  )
}
