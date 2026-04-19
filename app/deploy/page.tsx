'use client'

import { AppLayout } from '@/components/AppLayout'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'
import { useState } from 'react'
import { concat } from 'viem'
import { base } from 'wagmi/chains'
import { OWNER_ADDRESS, BUILDER_CODE, DEPLOY_FEE } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'
import * as ERC8021 from 'ox/erc8021'

// ─── Counter bytecode — verified: 119 bytes, internally consistent ────────────
// init: PUSH1 0xa5(165) DUP1 PUSH2 0x001b(27) PUSH0 CODECOPY PUSH0 RETURN INVALID
// runtime: 92 bytes at offset 27 (EVM zero-pads to 165)
const COUNTER_BYTECODE = '0x6080604052348015600e575f80fd5b5060a58061001b5f395ff3fe6080604052348015600e575f80fd5b50600436106030575f3560e01c8063d09de08a146034578063d826f88f14603c575b5f80fd5b603a6044565b005b60426053565b005b5f5460018101915081905550565b5f8081905550565b00' as `0x${string}`

// ─── UI helper ────────────────────────────────────────────────────────────────
function InfoRow({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{children}</div>
}

export default function DeployPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { referrer } = useReferral()
  const { lang } = useLang()
  const d = TEXT.deploy

  const [status, setStatus] = useState<'idle' | 'fee' | 'deploying' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [contractAddr, setContractAddr] = useState('')
  const [error, setError] = useState('')

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(DEPLOY_FEE, hasReferral)

  async function handleDeploy() {
    if (!address || !publicClient) return
    setStatus('fee')
    setError('')
    setTxHash('')
    setContractAddr('')

    try {
      // Step 1: Platform fee — plain ETH transfer, no calldata on EOA
      console.log('[BaseAmp] Sending fee TX (plain ETH)')
      const feeHash = await sendTransactionAsync({
        to: OWNER_ADDRESS,
        value: fee,
        chainId: base.id,
      })
      await publicClient.waitForTransactionReceipt({ hash: feeHash })

      setStatus('deploying')

      // Step 2: Deploy Counter with ERC-8021 attribution at end of bytecode
      const attributionSuffix = ERC8021.Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) as `0x${string}`
      const deployData = concat([COUNTER_BYTECODE, attributionSuffix]) as `0x${string}`

      console.log('[BaseAmp] Deploy data bytes:', (deployData.length - 2) / 2)
      console.log('[BaseAmp] ERC-8021 suffix:', attributionSuffix)
      console.log('[BaseAmp] Ends with ERC sentinel:', deployData.toLowerCase().endsWith('80218021802180218021802180218021'))

      const deployHash = await sendTransactionAsync({ data: deployData, chainId: base.id })
      setTxHash(deployHash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash })
      if (receipt.contractAddress) setContractAddr(receipt.contractAddress)

      if (hasReferral && referrer) {
        await fetch('/api/referral/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrer, referee: address, feeAmount: Number(fee) / 1e18 }),
        }).catch(() => {})
      }

      setStatus('success')
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string }
      console.error('[BaseAmp] Deploy error:', e)
      setError(e.shortMessage || e.message?.slice(0, 120) || 'Transaction failed')
      setStatus('error')
    }
  }

  if (!isConnected) {
    return (
      <AppLayout title="Deploy">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{tx(d.connectSub, lang)}</div>
        </div>
      </AppLayout>
    )
  }

  const busy = status === 'fee' || status === 'deploying'

  return (
    <AppLayout title="Deploy Contract">
      <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {tx(d.pageInfo, lang)}
        </div>

        {/* Counter card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid #3b82f6', borderRadius: '12px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '32px', fontFamily: 'monospace', color: '#60a5fa' }}>[+]</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Counter</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {lang === 'tr' ? 'Onchain tıklama sayacı — en güvenilir deploy sinyali' : 'On-chain click counter — the most reliable deploy signal'}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <InfoRow>{tx(d.network, lang)}</InfoRow>
            <InfoRow style={{ color: '#22c55e' }}>✓ {tx(d.builderAttribution, lang)}</InfoRow>
            {hasReferral && <InfoRow style={{ color: '#4ade80' }}>{tx(d.refDiscount, lang)}</InfoRow>}
          </div>

          {/* Status */}
          {busy && (
            <div style={{ background: 'var(--bg-card2)', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#60a5fa', marginBottom: '12px' }}>
              {status === 'fee' ? tx(d.preparing, lang) : tx(d.deploying, lang)}
            </div>
          )}
          {status === 'error' && error && (
            <div style={{ background: 'var(--bg-card2)', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>
              {error}
            </div>
          )}
          {status === 'success' && (
            <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4ade80', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <div style={{ fontWeight: '700' }}>Counter {tx(d.success, lang)}</div>
              {contractAddr && (
                <a href={`https://basescan.org/address/${contractAddr}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#22c55e', textDecoration: 'none', fontFamily: 'monospace', fontSize: '11px' }}>
                  {contractAddr.slice(0, 14)}...{contractAddr.slice(-8)} ↗
                </a>
              )}
              {txHash && (
                <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#16a34a', textDecoration: 'none', fontSize: '11px' }}>
                  {tx(d.viewOnBasescan, lang)}
                </a>
              )}
            </div>
          )}

          <button onClick={handleDeploy} disabled={busy}
            style={{ width: '100%', padding: '13px', background: busy ? 'var(--bg-card2)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: `1px solid ${busy ? 'var(--border)' : 'transparent'}`, borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: busy ? 'var(--text-muted)' : 'white', cursor: busy ? 'not-allowed' : 'pointer' }}>
            {status === 'fee' ? tx(d.preparingBtn, lang) : status === 'deploying' ? tx(d.deployingBtn, lang) : lang === 'tr' ? 'Counter Deploy Et' : 'Deploy Counter'}
          </button>
        </div>

        {/* Coming soon */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            {lang === 'tr' ? 'Yakında' : 'Coming Soon'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', opacity: 0.5 }}>
            {['ERC20 Token', 'ERC721 NFT'].map(name => (
              <div key={name} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '3px' }}>
                  {lang === 'tr' ? 'Hazırlanıyor' : 'In preparation'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
