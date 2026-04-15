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
const ERC20_BYTECODE = '0x608060405234801562000010575f80fd5b506040516200094f3803806200094f83398101604081905262000033916200015f565b5f62000040848262000259565b5060016200004f838262000259565b506002819055335f818152600360209081526040808320859055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef910160405180910390a350505062000321565b634e487b7160e01b5f52604160045260245ffd5b5f82601f830112620000c5575f80fd5b81516001600160401b0380821115620000e257620000e2620000a1565b604051601f8301601f19908116603f011681019082821181831017156200010d576200010d620000a1565b8160405283815260209250868385880101111562000129575f80fd5b5f91505b838210156200014c57858201830151818301840152908201906200012d565b5f93810190920192909252949350505050565b5f805f6060848603121562000172575f80fd5b83516001600160401b038082111562000189575f80fd5b6200019787838801620000b5565b94506020860151915080821115620001ad575f80fd5b50620001bc86828701620000b5565b925050604084015190509250925092565b600181811c90821680620001e257607f821691505b6020821081036200020157634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111562000254575f81815260208120601f850160051c810160208610156200022f5750805b601f850160051c820191505b8181101562000250578281556001016200023b565b5050505b505050565b81516001600160401b03811115620002755762000275620000a1565b6200028d81620002868454620001cd565b8462000207565b602080601f831160018114620002c3575f8415620002ab5750858301515b5f19600386901b1c1916600185901b17855562000250565b5f85815260208120601f198616915b82811015620002f357888601518255948401946001909101908401620002d2565b50858210156200031157878501515f19600388901b60f8161c191681555b5050505050600190811b01905550565b610620806200032f5f395ff3fe608060405234801561000f575f80fd5b5060043610610090575f3560e01c8063313ce56711610063578063313ce567146100ff57806370a082311461011957806395d89b4114610138578063a9059cbb14610140578063dd62ed3e14610153575f80fd5b806306fdde0314610094578063095ea7b3146100b257806318160ddd146100d557806323b872dd146100ec575b5f80fd5b61009c61017d565b6040516100a99190610460565b60405180910390f35b6100c56100c03660046104c6565b610208565b60405190151581526020016100a9565b6100de60025481565b6040519081526020016100a9565b6100c56100fa3660046104ee565b610274565b610107601281565b60405160ff90911681526020016100a9565b6100de610127366004610527565b60036020525f908152604090205481565b61009c6103ad565b6100c561014e3660046104c6565b6103ba565b6100de610161366004610547565b600460209081525f928352604080842090915290825290205481565b5f805461018990610578565b80601f01602080910402602001604051908101604052809291908181526020018280546101b590610578565b80156102005780601f106101d757610100808354040283529160200191610200565b820191905f5260205f20905b8154815290600101906020018083116101e357829003601f168201915b505050505081565b335f8181526004602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906102629086815260200190565b60405180910390a35060015b92915050565b6001600160a01b0383165f90815260036020526040812054821115610297575f80fd5b6001600160a01b0384165f9081526004602090815260408083203384529091529020548211156102c5575f80fd5b6001600160a01b0384165f90815260036020526040812080548492906102ec9084906105c4565b90915550506001600160a01b0383165f90815260036020526040812080548492906103189084906105d7565b90915550506001600160a01b0384165f9081526004602090815260408083203384529091528120805484929061034f9084906105c4565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161039b91815260200190565b60405180910390a35060019392505050565b6001805461018990610578565b335f908152600360205260408120548211156103d4575f80fd5b335f90815260036020526040812080548492906103f29084906105c4565b90915550506001600160a01b0383165f908152600360205260408120805484929061041e9084906105d7565b90915550506040518281526001600160a01b0384169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610262565b5f6020808352835180828501525f5b8181101561048b5785810183015185820160400152820161046f565b505f604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b03811681146104c1575f80fd5b919050565b5f80604083850312156104d7575f80fd5b6104e0836104ab565b946020939093013593505050565b5f805f60608486031215610500575f80fd5b610509846104ab565b9250610517602085016104ab565b9150604084013590509250925092565b5f60208284031215610537575f80fd5b610540826104ab565b9392505050565b5f8060408385031215610558575f80fd5b610561836104ab565b915061056f602084016104ab565b90509250929050565b600181811c9082168061058c57607f821691505b6020821081036105aa57634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561026e5761026e6105b0565b8082018082111561026e5761026e6105b056fea264697066735822122017fc82af138e096defa5015d5bfc8d3e766a55e95df732a1afec6eb275e6b65764736f6c63430008140033' as `0x${string}`

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
