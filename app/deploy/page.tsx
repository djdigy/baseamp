'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useState } from 'react'
import { parseUnits, toHex, concat, encodeAbiParameters, parseAbiParameters } from 'viem'
import { base } from 'wagmi/chains'
import { OWNER_ADDRESS, BUILDER_CODE, DEPLOY_FEE } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'

type DeployType = 'ERC20' | 'ERC721' | 'ERC1155'

// Minimal ERC20 bytecode - name, symbol, supply alır, deployer'a mint eder
const ERC20_BYTECODE = '0x608060405234801561001057600080fd5b506040516107e83803806107e883398101604081905261002f91610174565b828160036100408382610270565b5060046100508282610270565b5050506100693361006460028461033e565b61006c565b505050506103ae565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036100db576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100d29061037e565b60405180910390fd5b80600260008282546100ed919061039e565b925050819055508060008085815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610152919061039e565b925050819055505050565b634e487b7160e01b600052604160045260246000fd5b60008060006060848603121561018957600080fd5b83516001600160401b038082111561019e57600080fd5b818601915086601f8301126101b257600080fd5b81516020828211156101c6576101c661015d565b8060051b604051601f19603f830116810181811086821117156101eb576101eb61015d565b60405292835281830193508481018201928a84111561020957600080fd5b948201945b8386101561022e578551825294820194908201906102f9610173565b9550505050604086015190809350508290506102498161016f565b9050509250925092565b600181811c9082168061026757607f821691505b60208210810361028757634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156102cb57806000526020600020601f840160051c810160208510156102b45750805b601f840160051c820191505b818110156102d457600081556001016102c0565b5050505050565b81516001600160401b038111156102f4576102f461015d565b610308816103028454610253565b8461028d565b602080601f83116001811461033d57600084156103255750858301515b600019600386901b1c1916600185901b1785556102d4565b600085815260208120601f198616915b8281101561036c5788860151825594840194600190910190840161034d565b508582101561038a5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b600060208201905081810360008301526103b481846102db565b9392505050565b8181038181111561021a57634e487b7160e01b600052601160045260246000fd5b6103e98261016f565b6103f28461016f565b828201915081838311156104095761040861021a565b5b9392505050565b61042b8061041e6000396000f3fe' as `0x${string}`

const ERC20_DEPLOY_ABI = [
  {
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'initialSupply', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
] as const

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#0a0b0f', border: '1px solid #1a1d27', borderRadius: '8px',
          padding: '10px 12px', fontSize: '13px', color: '#f1f5f9', outline: 'none', width: '100%',
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
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: '#475569' }}>{desc}</div>
    </div>
  )
}

export default function DeployPage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { referrer } = useReferral()

  const [deployType, setDeployType] = useState<DeployType>('ERC20')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [supply, setSupply] = useState('1000000')
  const [decimals, setDecimals] = useState('18')
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(DEPLOY_FEE, hasReferral)
  const feeDisplay = hasReferral ? '0.0008 ETH (20% off!)' : '0.001 ETH'

  async function handleDeploy() {
    if (!walletClient || !address || !publicClient) return
    if (!name || !symbol) { setError('Name and symbol required'); return }

    setStatus('deploying')
    setError('')
    setTxHash('')

    try {
      const { encodeDeployData } = await import('viem')
      const initialSupply = parseUnits(supply || '1000000', parseInt(decimals || '18'))
      const builderSuffix = toHex(new TextEncoder().encode(BUILDER_CODE))

      const deployData = encodeDeployData({
        abi: ERC20_DEPLOY_ABI,
        bytecode: ERC20_BYTECODE,
        args: [name, symbol, initialSupply],
      })

      const data = concat([deployData, builderSuffix]) as `0x${string}`

      // 1. Deploy fee → owner'a gönder
      const feeHash = await walletClient.sendTransaction({
        account: address,
        to: OWNER_ADDRESS,
        value: fee,
        chain: base,
      })
      await publicClient.waitForTransactionReceipt({ hash: feeHash })

      // 2. Kontratı deploy et
      const deployHash = await walletClient.sendTransaction({
        account: address,
        data,
        chain: base,
      })

      setTxHash(deployHash)
      await publicClient.waitForTransactionReceipt({ hash: deployHash })

      // 3. Referral komisyonunu kaydet
      if (hasReferral && referrer) {
        await fetch('/api/referral/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrer, referee: address, feeAmount: Number(fee) / 1e18 }),
        })
      }

      setStatus('success')
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Deploy failed')
      setStatus('error')
    }
  }

  if (!isConnected) {
    return (
      <AppLayout title="Deploy">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🚀</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Connect your wallet</div>
          <div style={{ fontSize: '14px', color: '#475569' }}>Deploy contracts on Base mainnet</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Deploy Contract">
      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contract Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <TypeCard title="ERC20" desc="Fungible token" icon="◈" selected={deployType === 'ERC20'} onClick={() => setDeployType('ERC20')} />
            <TypeCard title="ERC721" desc="NFT collection" icon="◉" selected={deployType === 'ERC721'} onClick={() => setDeployType('ERC721')} />
            <TypeCard title="ERC1155" desc="Multi-token" icon="◫" selected={deployType === 'ERC1155'} onClick={() => setDeployType('ERC1155')} />
          </div>
        </div>

        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#d1d5db' }}>Parameters</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <InputField label="Name" value={name} onChange={setName} placeholder="My Token" />
            <InputField label="Symbol" value={symbol} onChange={setSymbol} placeholder="MTK" />
          </div>

          {deployType === 'ERC20' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Initial Supply" value={supply} onChange={setSupply} placeholder="1000000" type="number" />
              <InputField label="Decimals" value={decimals} onChange={setDecimals} placeholder="18" type="number" />
            </div>
          )}

          <div style={{ background: '#0a0b0f', border: '1px solid #1a1d27', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>💰 Deploy fee: {feeDisplay} → owner</div>
            <div>🔗 Network: Base Mainnet</div>
            <div>📎 Builder Code: {BUILDER_CODE}</div>
            {hasReferral && <div style={{ color: '#4ade80' }}>🎉 Referral aktif — 20% indirim!</div>}
          </div>

          {error && (
            <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#f87171' }}>
              ❌ {error}
            </div>
          )}

          {status === 'success' && txHash && (
            <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4ade80' }}>
              <div style={{ fontWeight: '600', marginBottom: '6px' }}>✅ Contract deployed!</div>
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ color: '#22c55e', textDecoration: 'none', fontSize: '11px', wordBreak: 'break-all' }}>
                View on Basescan →
              </a>
            </div>
          )}

          <button
            onClick={handleDeploy}
            disabled={status === 'deploying' || !name || !symbol}
            style={{
              width: '100%', padding: '12px',
              background: status === 'deploying' || !name || !symbol ? '#1a1d27' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              color: status === 'deploying' || !name || !symbol ? '#475569' : 'white',
              cursor: status === 'deploying' || !name || !symbol ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'deploying' ? '🚀 Deploying...' : `Deploy ${deployType} — ${feeDisplay}`}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
