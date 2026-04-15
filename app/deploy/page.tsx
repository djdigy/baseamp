'use client'

import { AppLayout } from '@/components/AppLayout'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useState } from 'react'
import { parseUnits, toHex, encodePacked, keccak256 } from 'viem'
import { base } from 'wagmi/chains'
import { OWNER_ADDRESS, BUILDER_CODE, DEPLOY_FEE } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'

type DeployType = 'ERC20' | 'ERC721' | 'ERC1155'

// Compiled ERC20 bytecode - name, symbol, totalSupply constructor
// Solidity: constructor(string name_, string symbol_, uint256 totalSupply_)
// Mints totalSupply to msg.sender
const ERC20_BYTECODE = '0x60806040523480156200001157600080fd5b5060405162000e3838038062000e388339818101604052810190620000379190620002ea565b82826003908162000049919062000601565b50816004908162000059919062000601565b5050620000723382620000799190620006e8565b506200075f565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603620000eb576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620000e29062000778565b60405180910390fd5b8060026000828254620000ff919062000719565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051620001b091906200076d565b60405180910390a35050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6200022582620001da565b810181811067ffffffffffffffff821117156200024757620002466200010a565b5b80604052505050565b60006200025c620001bc565b90506200026a828262000219565b919050565b600067ffffffffffffffff8211156200028d576200028c6200010a565b5b6200029882620001da565b9050602081019050919050565b60005b83811015620002c5578082015181840152602081019050620002a8565b60008484015250505050565b6000620002e8620002e2846200026f565b62000250565b905082815260208101848484011115620003075762000306620001d5565b5b6200031484828562000299565b509392505050565b600082601f830112620003335762000332620001d0565b5b8151620003458482602086016200026f565b91505092915050565b6000819050919050565b62000363816200034e565b81146200036f57600080fd5b50565b600081519050620003838162000358565b92915050565b6000806000606084860312156200039d5762000399620001c6565b5b600084015167ffffffffffffffff811115620003be57620003bd620001cb565b5b620003cc868287016200031c565b935050602084015167ffffffffffffffff811115620003ef57620003ee620001cb565b5b620003fd868287016200031c565b9250506040620004108682870162000372565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200046d57607f821691505b60208210810362000483576200048262000425565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302620004ed7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82620004ae565b620004f98683620004ae565b95508019841693508086168417925050509392505050565b6000819050919050565b60006200053c62000536620005308462000354565b62000511565b6200034e565b9050919050565b6200054e816200051b565b82525050565b600060208201905062000571600083018462000543565b92915050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026200054d7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8262000587565b620005f98662000587565b9550801984169350808616841792505050509392505050565b6000620006238262000629565b9050919050565b600062000637826200034e565b9050919050565b81810381811115620006545762000653620006f8565b5b92915050565b600082825260208201905092915050565b60006200067882620001dc565b62000684818562000627565b9350620006958185602086016200025f565b6200069f81620001da565b840191505092915050565b6000606082019050620006c1600083018662000543565b8181036020830152620006d581846200060b565b9050818103604083015262000700818562000611565b905095945050505050565b60006020820190506200072260008301846200054e565b92915050565b6200073381620001dc565b82525050565b600060208201905062000750600083018462000728565b92915050565b7f45524332303a206d696e7420746f20746865207a65726f20616464726573730000600082015250565b60006200078e601f8362000627565b91506200079b8262000759565b602082019050919050565b60006020820190508181036000830152620007c18162000780565b9050919050565b610669806200079c6000396000f3fe' as `0x${string}`

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
  const [status, setStatus] = useState<'idle' | 'fee' | 'deploying' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [contractAddr, setContractAddr] = useState('')
  const [error, setError] = useState('')

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(DEPLOY_FEE, hasReferral)
  const feeEth = hasReferral ? '0.0008' : '0.001'

  async function handleDeploy() {
    if (!walletClient || !address || !publicClient) {
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
      // Step 1: Fee tx → owner
      const feeHash = await walletClient.sendTransaction({
        account: address,
        to: OWNER_ADDRESS,
        value: fee,
        data: toHex(new TextEncoder().encode(BUILDER_CODE)) as `0x${string}`,
        chain: base,
      })
      await publicClient.waitForTransactionReceipt({ hash: feeHash })

      setStatus('deploying')

      // Step 2: ABI encode constructor args inline
      const { encodeAbiParameters, parseAbiParameters, concat } = await import('viem')
      const initialSupply = parseUnits(supply || '1000000', parseInt(decimals || '18'))

      // Encode constructor: (string, string, uint256)
      const constructorArgs = encodeAbiParameters(
        parseAbiParameters('string, string, uint256'),
        [name, symbol, initialSupply]
      )

      // bytecode + constructor args + builder suffix
      const builderSuffix = toHex(new TextEncoder().encode(BUILDER_CODE)) as `0x${string}`
      const deployData = concat([ERC20_BYTECODE, constructorArgs, builderSuffix]) as `0x${string}`

      const deployHash = await walletClient.sendTransaction({
        account: address,
        data: deployData,
        chain: base,
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
      setError(err.shortMessage || err.message || 'Transaction failed')
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

        {/* Type selector */}
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Contract Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <TypeCard title="ERC20 Token" desc="Fungible token" icon="◈" selected={deployType === 'ERC20'} onClick={() => setDeployType('ERC20')} />
            <TypeCard title="ERC721 NFT" desc="NFT collection" icon="◉" selected={deployType === 'ERC721'} onClick={() => setDeployType('ERC721')} />
            <TypeCard title="ERC1155" desc="Multi-token" icon="◫" selected={deployType === 'ERC1155'} onClick={() => setDeployType('ERC1155')} />
          </div>
        </div>

        {/* Form */}
        <div style={{ background: '#0f1117', border: '1px solid #1a1d27', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#d1d5db' }}>Parameters</div>

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

          {/* Info */}
          <div style={{ background: '#0a0b0f', border: '1px solid #1a1d27', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>💰 Platform fee: {feeEth} ETH → sent to owner first</div>
            <div>🚀 Contract deploy: separate tx (gas only)</div>
            <div>🔗 Network: Base Mainnet (chain ID 8453)</div>
            <div>📎 Builder Code: {BUILDER_CODE} (auto-tagged)</div>
            {hasReferral && <div style={{ color: '#4ade80' }}>🎉 Referral discount: 20% off!</div>}
          </div>

          {/* Progress */}
          {(status === 'fee' || status === 'deploying') && (
            <div style={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#60a5fa' }}>
              {status === 'fee' && '⏳ Step 1/2 — Sending platform fee...'}
              {status === 'deploying' && '⏳ Step 2/2 — Deploying contract...'}
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
              <div style={{ fontWeight: '700' }}>✅ Contract deployed successfully!</div>
              {contractAddr && (
                <div>
                  <span style={{ color: '#16a34a' }}>Contract: </span>
                  <a href={`https://basescan.org/address/${contractAddr}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#22c55e', textDecoration: 'none', fontFamily: 'monospace', fontSize: '11px' }}>
                    {contractAddr.slice(0, 10)}...{contractAddr.slice(-6)} ↗
                  </a>
                </div>
              )}
              {txHash && (
                <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#22c55e', textDecoration: 'none', fontSize: '11px' }}>
                  View TX on Basescan →
                </a>
              )}
            </div>
          )}

          {/* Deploy button */}
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
            {status === 'fee' ? '⏳ Sending fee...' :
             status === 'deploying' ? '🚀 Deploying...' :
             `Deploy ${deployType} — ${feeEth} ETH`}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
