'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useState } from 'react'
import { parseUnits, encodeAbiParameters, parseAbiParameters, keccak256, toBytes, concat, pad, toHex } from 'viem'
import { BUILDER_CODE } from '@/lib/wagmi'
import { base } from 'wagmi/chains'

type DeployType = 'ERC20' | 'ERC721' | 'ERC1155'

// Minimal ERC20 - constructor(string name, string symbol, uint256 supply)
// Bu bytecode name/symbol/supply alır, deployer'a mint eder
const ERC20_BYTECODE = `0x608060405234801561001057600080fd5b50604051610a8a380380610a8a8339818101604052810190610032919061033a565b828260039081610042919061061c565b508160049081610052919061061c565b50505061006a3382610070565b5050506106ee565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036100df576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100d690610700565b60405180910390fd5b806002600082825461010191906106a0565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461015591906106a0565b925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161019991906106d5565b60405180910390a35050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610212826101c9565b810181811067ffffffffffffffff821117156102315761023061019a565b5b80604052505050565b60006102446101a5565b90506102508282610209565b919050565b600067ffffffffffffffff8211156102705761026f61019a565b5b610279826101c9565b9050602081019050919050565b60005b838110156102a4578082015181840152602081019050610289565b60008484015250505050565b60006102c36102be84610255565b61023a565b9050828152602081018484840111156102df576102de6101b9565b5b6102ea848285610286565b509392505050565b600082601f83011261030757610306610190565b5b81516103178482602086016102b0565b91505092915050565b6000819050919050565b61033381610320565b811461033e57600080fd5b50565b60008151905061035081610320565b92915050565b60008060006060848603121561036f5761036e6101af565b5b600084015167ffffffffffffffff81111561038d5761038c6101b4565b5b610399868287016102f2565b935050602084015167ffffffffffffffff8111156103ba576103b96101b4565b5b6103c6868287016102f2565b92505060406103d786828701610341565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061043357607f821691505b602082108103610446576104456103ec565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026104ae7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610471565b6104b88683610471565b95508019841693508086168417925050509392505050565b6000819050919050565b60006104f56104f06104eb84610320565b6104d0565b610320565b9050919050565b6000819050919050565b61050f836104da565b61052361051b826104fc565b84845461047e565b825550505050565b600090565b61053861052b565b610543818484610506565b505050565b5b8181101561056757610554600082610530565b600181019050610549565b5050565b601f8211156105ac5761057d8161044c565b61058684610461565b81016020851015610595578190505b6105a96105a185610461565b830182610548565b50505b505050565b600082821c905092915050565b60006105cf600019846008026105b1565b1980831691505092915050565b60006105e883836105be565b9150826002028217905092915050565b610601826103e1565b67ffffffffffffffff81111561061a5761061961019a565b5b610624825461041b565b61062f82828561056b565b600060209050601f8311600181146106625760008415610650578287015190505b61065a85826105dc565b8655506106c2565b601f1984166106708661044c565b60005b8281101561069857848901518255600182019150602085019450602081019050610673565b868310156106b557848901516106b1601f8916826105be565b8255505b6001600288020188555050505b505050505050565b6106d381610320565b82525050565b60006020820190506106ee60008301846106ca565b92915050565b600082825260208201905092915050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b600061073b601f836106f5565b915061074682610706565b602082019050919050565b6000602082019050818103600083015261076a8161072e565b9050919050565b610a8d806106fd6000396000f3fe` as `0x${string}`

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

  const [deployType, setDeployType] = useState<DeployType>('ERC20')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [supply, setSupply] = useState('1000000')
  const [decimals, setDecimals] = useState('18')
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')

  async function handleDeploy() {
    if (!walletClient || !address || !publicClient) return
    if (!name || !symbol) { setError('Name and symbol required'); return }

    setStatus('deploying')
    setError('')
    setTxHash('')

    try {
      const { encodeDeployData } = await import('viem')

      const initialSupply = parseUnits(supply || '1000000', parseInt(decimals || '18'))

      const data = encodeDeployData({
        abi: ERC20_DEPLOY_ABI,
        bytecode: ERC20_BYTECODE,
        args: [name, symbol, initialSupply],
      })

      // Builder Code suffix ekle
      const suffix = toHex(new TextEncoder().encode(BUILDER_CODE))
      const dataWithSuffix = concat([data, suffix]) as `0x${string}`

      const hash = await walletClient.sendTransaction({
        account: address,
        data: dataWithSuffix,
        chain: base,
      })

      setTxHash(hash)

      // Receipt bekle
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
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

        {/* Type */}
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Contract Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <TypeCard title="ERC20" desc="Fungible token" icon="◈" selected={deployType === 'ERC20'} onClick={() => setDeployType('ERC20')} />
            <TypeCard title="ERC721" desc="NFT collection" icon="◉" selected={deployType === 'ERC721'} onClick={() => setDeployType('ERC721')} />
            <TypeCard title="ERC1155" desc="Multi-token" icon="◫" selected={deployType === 'ERC1155'} onClick={() => setDeployType('ERC1155')} />
          </div>
        </div>

        {/* Form */}
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
            <div>⚡ Estimated gas: ~0.0005 ETH</div>
            <div>🔗 Network: Base Mainnet</div>
            <div>📎 Builder Code: {BUILDER_CODE} (auto-tagged)</div>
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
              background: status === 'deploying' || !name || !symbol ? '#1a1d27' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              color: status === 'deploying' || !name || !symbol ? '#475569' : 'white',
              cursor: status === 'deploying' || !name || !symbol ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'deploying' ? '🚀 Deploying...' : `Deploy ${deployType}`}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
