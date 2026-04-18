'use client'

import { AppLayout } from '@/components/AppLayout'
import { PageInfo } from '@/components/PageInfo'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'
import { useState } from 'react'
import { parseUnits, toHex, encodeAbiParameters, parseAbiParameters, concat } from 'viem'
import { base } from 'wagmi/chains'
import { OWNER_ADDRESS, BUILDER_CODE, DEPLOY_FEE } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'

type DeployType = 'ERC20' | 'ERC721' | 'ERC1155'

// Compiled minimal ERC20: constructor(string name_, string symbol_, uint256 totalSupply_)
const ERC20_BYTECODE = '0x608060405234801561001057600080fd5b506040516107883803806107888339818101604052810190610032919061021a565b828260039081610042919061049c565b508160049081610052919061049c565b5061006c33826100609190610588565b61007090919063ffffffff16565b505050610657565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036100df576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100d6906105ee565b60405180910390fd5b80600260008282546100f1919061060e565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161018091906105d3565b60405180910390a35050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101f1826101a8565b810181811067ffffffffffffffff821117156102105761020f6101b9565b5b80604052505050565b60006102236101ba565b905061022f82826101e8565b919050565b600067ffffffffffffffff82111561024f5761024e6101b9565b5b610258826101a8565b9050602081019050919050565b60005b83811015610283578082015181840152602081019050610268565b60008484015250505050565b60006102a461029f84610234565b610219565b9050828152602081018484840111156102c0576102bf6101a3565b5b6102cb848285610265565b509392505050565b600082601f8301126102e8576102e761019e565b5b81516102f884826020860161028f565b91505092915050565b6000819050919050565b61031481610301565b811461031f57600080fd5b50565b6000815190506103318161030b565b92915050565b60008060006060848603121561034f5761034e610194565b5b600084015167ffffffffffffffff81111561036d5761036c610199565b5b610379868287016102d3565b935050602084015167ffffffffffffffff81111561039a57610399610199565b5b6103a6868287016102d3565b92505060406103b786828701610322565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806103f257607f821691505b602082108103610405576104046103cb565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026104677fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610430565b6104718683610430565b95508019841693508086168417925050509392505050565b6000819050919050565b600061049861049361048e84610301565b610489565b610301565b9050919050565b60006104aa82610493565b9050919050565b60006104bc82610301565b9050919050565b6104cc826104b1565b6104d5826104c1565b8254600190600390811c908316831601835281600f0b91508083116104fb5762000000826104fb5762000000565b5050505050565b60006020820190506105176000830184610543565b92915050565b600060208201905081810360008301526105378184610556565b905092915050565b61054881610301565b82525050565b600060208201905061056360008301846104b6565b92915050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b600061059f601f836105ae565b91506105aa82610569565b602082019050919050565b6000819050919050565b60006105ca826105b5565b9050919050565b600060208201905081810360008301526105ea81610592565b9050919050565b60006020820190506106066000830184610543565b92915050565b600061061782610301565b915061062283610301565b925082820190508082111561063a576106396103fa565b5b92915050565b600061064b82610301565b9050919050565b61064d81610640565b82525050565b60006020820190506106686000830184610642565b92915050565b6106228061066f6000396000f3fe' as `0x${string}`

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px',
          padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', width: '100%',
        }}
      />
    </div>
  )
}

function TypeCard({ title, desc, icon, selected, onClick }: {
  title: string; desc: string; icon: string; selected: boolean; onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{
      background: selected ? '#1e2235' : '#0f1117',
      border: `1px solid ${selected ? '#3b82f6' : '#1a1d27'}`,
      borderRadius: '12px', padding: '16px', cursor: 'pointer',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
    </div>
  )
}

export default function DeployPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { referrer } = useReferral()

  const [deployType, setDeployType] = useState<DeployType>('ERC20')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [supply, setSupply] = useState('1000000')
  const [decimals, setDecimals] = useState('18')
  const [status, setStatus] = useState<'idle' | 'fee' | 'deploying' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [contractAddr, setContractAddr] = useState('')
  const [error, setError] = useState('')

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(DEPLOY_FEE, hasReferral)

  async function handleDeploy() {
    if (!address || !publicClient) {
      setError('Wallet not connected')
      return
    }
    if (!name || !symbol) {
      setError('Name and symbol are required')
      return
    }

    setStatus('fee')
    setError('')
    setTxHash('')
    setContractAddr('')

    try {
      // Step 1: Platform fee → owner (silent, no display)
      const feeHash = await sendTransactionAsync({
        to: OWNER_ADDRESS,
        value: fee,
        data: toHex(new TextEncoder().encode(BUILDER_CODE)) as `0x${string}`,
        chainId: base.id,
      })
      await publicClient.waitForTransactionReceipt({ hash: feeHash })

      setStatus('deploying')

      // Step 2: Deploy contract
      const initialSupply = parseUnits(supply || '1000000', parseInt(decimals || '18'))
      const constructorArgs = encodeAbiParameters(
        parseAbiParameters('string, string, uint256'),
        [name, symbol, initialSupply]
      )

      const builderSuffix = toHex(new TextEncoder().encode(BUILDER_CODE)) as `0x${string}`
      const deployData = concat([ERC20_BYTECODE, constructorArgs, builderSuffix]) as `0x${string}`

      const deployHash = await sendTransactionAsync({
        data: deployData,
        chainId: base.id,
      })

      setTxHash(deployHash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash })

      if (receipt.contractAddress) {
        setContractAddr(receipt.contractAddress)
      }

      // Referral komisyon kaydet
      if (hasReferral && referrer) {
        await fetch('/api/referral/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrer, referee: address, feeAmount: Number(fee) / 1e18 }),
        }).catch(() => {})
      }

      setStatus('success')
    } catch (err: any) {
      console.error('Deploy error:', err)
      setError(err.shortMessage || err.message?.slice(0, 100) || 'Transaction failed')
      setStatus('error')
    }
  }

  if (!isConnected) {
    return (
      <AppLayout title="Deploy">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🚀</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Connect your wallet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Deploy contracts on Base mainnet</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Deploy Contract">
      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <PageInfo
          en={"Even a simple contract deploy counts as real on-chain usage. Fill in the details and deploy directly on Base."}
          tr={"Basit bir kontrat deploy etmek bile ağ üzerinde gerçek kullanım olarak görülür. Bilgileri doldurup Base üzerinde yayınlarsın."}
        />

        {/* Type */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Contract Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <TypeCard title="ERC20 Token" desc="Fungible token" icon="◈" selected={deployType === 'ERC20'} onClick={() => setDeployType('ERC20')} />
            <TypeCard title="ERC721 NFT" desc="NFT collection" icon="◉" selected={deployType === 'ERC721'} onClick={() => setDeployType('ERC721')} />
            <TypeCard title="ERC1155" desc="Multi-token" icon="◫" selected={deployType === 'ERC1155'} onClick={() => setDeployType('ERC1155')} />
          </div>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Parameters</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InputField label="Token Name" value={name} onChange={setName} placeholder="My Token" />
            <InputField label="Symbol" value={symbol} onChange={setSymbol} placeholder="MTK" />
          </div>

          {deployType === 'ERC20' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Initial Supply" value={supply} onChange={setSupply} placeholder="1000000" type="number" />
              <InputField label="Decimals" value={decimals} onChange={setDecimals} placeholder="18" type="number" />
            </div>
          )}

          {/* Info - fee gizli */}
          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>🔗 Network: Base Mainnet</div>
            <div>📎 Builder Code: {BUILDER_CODE}</div>
            <div>⚡ Total supply minted to your wallet</div>
            {hasReferral && <div style={{ color: '#4ade80' }}>🎉 Referral discount applied!</div>}
          </div>

          {/* Progress */}
          {(status === 'fee' || status === 'deploying') && (
            <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#60a5fa' }}>
              {status === 'fee' && '⏳ Preparing deployment...'}
              {status === 'deploying' && '🚀 Deploying contract to Base...'}
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#f87171' }}>
              ❌ {error}
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4ade80', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: '700' }}>✅ {name} ({symbol}) deployed!</div>
              {contractAddr && (
                <a href={`https://basescan.org/address/${contractAddr}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#22c55e', textDecoration: 'none', fontFamily: 'monospace', fontSize: '11px' }}>
                  {contractAddr.slice(0, 12)}...{contractAddr.slice(-8)} ↗
                </a>
              )}
              {txHash && (
                <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#16a34a', textDecoration: 'none', fontSize: '11px' }}>
                  View on Basescan →
                </a>
              )}
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleDeploy}
            disabled={['fee', 'deploying'].includes(status) || !name || !symbol}
            style={{
              width: '100%', padding: '13px',
              background: ['fee', 'deploying'].includes(status) || !name || !symbol
                ? '#1a1d27'
                : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700',
              color: ['fee', 'deploying'].includes(status) || !name || !symbol ? '#475569' : 'white',
              cursor: ['fee', 'deploying'].includes(status) || !name || !symbol ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'fee' ? '⏳ Preparing...' :
             status === 'deploying' ? '🚀 Deploying...' :
             `Deploy ${deployType}`}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
