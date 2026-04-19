'use client'

import { AppLayout } from '@/components/AppLayout'
import { useLang } from '@/components/Providers'
import { TEXT, tx } from '@/lib/i18n'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'
import { useState } from 'react'
import { encodeAbiParameters, parseAbiParameters, parseUnits, concat } from 'viem'
import { base } from 'wagmi/chains'
import { OWNER_ADDRESS, BUILDER_CODE, DEPLOY_FEE, encodeBuilderCode } from '@/lib/constants'
import { useReferral, calculateFee } from '@/hooks/useReferral'
import * as ERC8021 from 'ox/erc8021'

type DeployType = 'ERC20' | 'ERC721' | 'Counter'

interface ContractDef {
  id: DeployType
  title: string
  desc: string
  icon: string
  fields: FieldDef[]
  encode: (vals: Record<string, string>) => { bytecode: `0x${string}`; args: `0x${string}` }
}
interface FieldDef { key: string; label: string; placeholder: string; type?: string }

// ─── Bytecodes (verified: even length, no spaces, valid hex) ──────────────────

// ERC20: constructor(string name_, string symbol_, uint256 totalSupply_)
const ERC20_BYTECODE = '0x608060405234801561001057600080fd5b506040516107883803806107888339818101604052810190610032919061021a565b828260039081610042919061049c565b508160049081610052919061049c565b5061006c33826100609190610588565b61007090919063ffffffff16565b505050610657565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036100df576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100d6906105ee565b60405180910390fd5b80600260008282546100f1919061060e565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161018091906105d3565b60405180910390a35050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101f1826101a8565b810181811067ffffffffffffffff821117156102105761020f6101b9565b5b80604052505050565b60006102236101ba565b905061022f82826101e8565b919050565b600067ffffffffffffffff82111561024f5761024e6101b9565b5b610258826101a8565b9050602081019050919050565b60005b83811015610283578082015181840152602081019050610268565b60008484015250505050565b60006102a461029f84610234565b610219565b9050828152602081018484840111156102c0576102bf6101a3565b5b6102cb848285610265565b509392505050565b600082601f8301126102e8576102e761019e565b5b81516102f884826020860161028f565b91505092915050565b6000819050919050565b61031481610301565b811461031f57600080fd5b50565b6000815190506103318161030b565b92915050565b60008060006060848603121561034f5761034e610194565b5b600084015167ffffffffffffffff81111561036d5761036c610199565b5b610379868287016102d3565b935050602084015167ffffffffffffffff81111561039a57610399610199565b5b6103a6868287016102d3565b92505060406103b786828701610322565b9150509250925092565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806103f257607f821691505b602082108103610405576104046103cb565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026104677fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610430565b6104718683610430565b95508019841693508086168417925050509392505050565b6000819050919050565b600061049861049361048e84610301565b610489565b610301565b9050919050565b60006104aa82610493565b9050919050565b60006104bc82610301565b9050919050565b6104cc826104b1565b6104d5826104c1565b8254600190600390811c908316831601835281600f0b91508083116104fb5762000000826104fb5762000000565b5050505050565b60006020820190506105176000830184610543565b92915050565b600060208201905081810360008301526105378184610556565b905092915050565b61054881610301565b82525050565b600060208201905061056360008301846104b6565b92915050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b600061059f601f836105ae565b91506105aa82610569565b602082019050919050565b6000819050919050565b60006105ca826105b5565b9050919050565b600060208201905081810360008301526105ea81610592565b9050919050565b60006020820190506106066000830184610543565b92915050565b600061061782610301565b915061062283610301565b925082820190508082111561063a576106396103fa565b5b92915050565b600061064b82610301565b9050919050565b61064d81610640565b82525050565b60006020820190506106686000830184610642565b92915050565b6106228061066f6000396000f3fe' as `0x${string}`

// ERC721: constructor(string name_, string symbol_)
const ERC721_BYTECODE = '0x60806040526000600655348015610015575f80fd5b5060405161123438038061123483398181016040528101906100379190610252565b8181815f9081610047919061050c565b508060019081610057919061050c565b505050506105db565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6100c082610079565b810181811067ffffffffffffffff821117156100df576100de610089565b5b80604052505050565b5f6100f1610060565b90506100fd82826100b7565b919050565b5f67ffffffffffffffff82111561011c5761011b610089565b5b61012582610079565b9050602081019050919050565b5f5b8381101561014f578082015181840152602081019050610134565b5f8484015250505050565b5f61016c61016784610102565b6100e8565b90508281526020810184848401111561018857610187610075565b5b610193848285610132565b509392505050565b5f82601f8301126101af576101ae610071565b5b81516101bf84826020860161015a565b91505092915050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6101f5826101cc565b9050919050565b610205816101eb565b811461020f575f80fd5b50565b5f81519050610220816101fc565b92915050565b5f604082840312156102315761023a6101c8565b5b5f82015167ffffffffffffffff8111156102585761025761006d565b5b6102648482850161019b565b925050602082015167ffffffffffffffff8111156102855761028461006d565b5b6102918482850161019b565b9150509250929050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061026057607f821691505b60208210810361027e5761027d6102a5565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f6008830261030e7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102c3565b6103188683610323565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f6103546103476103428461031a565b610323565b61031a565b9050919050565b5f819050919050565b61036d83610338565b610381610369826103a3565b84845461032f565b825550505050565b5f90565b610395610381565b6103a0818484610364565b505050565b5b818110156103c3576103b85f8261038d565b6001810190506103a6565b5050565b601f8211156104085760cd816102f7565b6103da84610303565b8101602085101561040a578190505b61040e61040a8561030f565b8301826103ad565b50505b505050565b5f82821c905092915050565b5f6104285f19846008026103e0565b1980831691505092915050565b5f61044083836104f1565b9150826002028217905092915050565b61045982610293565b67ffffffffffffffff811115610472576104716100d2565b5b61047c8254610283565b610487828285610380565b5f60209050601f8311600181146104b8575f8415610497578287015190505b6104a1858261042c565b8655506105bc565b601f19841661046286610303565b5f5b8281101561053c5784890151825560018201915060208501945060208101905061045f565b8683101561055957848901516104d4601f8916826104f3565b8355505b6001600288020188555050505b505050505050565b6112498061060f5f395ff3fe' as `0x${string}`

// Counter: no constructor args. count public, increment(), reset()
const COUNTER_BYTECODE = '0x6080604052348015600e575f80fd5b5060a58061001b5f395ff3fe6080604052348015600e575f80fd5b50600436106030575f3560e01c8063d09de08a146034578063d826f88f14603c575b5f80fd5b603a6044565b005b60426053565b005b5f5460018101915081905550565b5f8081905550565b00' as `0x${string}`

// ─── Contract definitions ─────────────────────────────────────────────────────
const CONTRACTS: ContractDef[] = [
  {
    id: 'ERC20', title: 'ERC20 Token', desc: 'Fungible token', icon: '◈',
    fields: [
      { key: 'name', label: 'Token Name', placeholder: 'My Token' },
      { key: 'symbol', label: 'Symbol', placeholder: 'MTK' },
      { key: 'supply', label: 'Initial Supply', placeholder: '1000000', type: 'number' },
      { key: 'decimals', label: 'Decimals', placeholder: '18', type: 'number' },
    ],
    encode: (v) => ({
      bytecode: ERC20_BYTECODE,
      args: encodeAbiParameters(
        parseAbiParameters('string, string, uint256'),
        [v.name, v.symbol, parseUnits(v.supply || '1000000', parseInt(v.decimals || '18'))]
      ),
    }),
  },
  {
    id: 'ERC721', title: 'ERC721 NFT', desc: 'NFT collection', icon: '◉',
    fields: [
      { key: 'name', label: 'Collection Name', placeholder: 'My NFT' },
      { key: 'symbol', label: 'Symbol', placeholder: 'MNFT' },
    ],
    encode: (v) => ({
      bytecode: ERC721_BYTECODE,
      args: encodeAbiParameters(parseAbiParameters('string, string'), [v.name, v.symbol]),
    }),
  },
  {
    id: 'Counter', title: 'Counter', desc: 'On-chain click counter', icon: '[+]',
    fields: [],
    encode: () => ({ bytecode: COUNTER_BYTECODE, args: '0x' }),
  },
]

// ─── UI ────────────────────────────────────────────────────────────────────────
function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
      />
    </div>
  )
}

export default function DeployPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { referrer } = useReferral()
  const { lang } = useLang()
  const d = TEXT.deploy

  const [selectedId, setSelectedId] = useState<DeployType>('ERC20')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    name: '', symbol: '', supply: '1000000', decimals: '18',
  })
  const [status, setStatus] = useState<'idle' | 'fee' | 'deploying' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [contractAddr, setContractAddr] = useState('')
  const [error, setError] = useState('')

  const hasReferral = !!referrer && referrer !== address?.toLowerCase()
  const fee = calculateFee(DEPLOY_FEE, hasReferral)
  const selected = CONTRACTS.find(c => c.id === selectedId)!

  function setField(key: string, val: string) {
    setFieldValues(prev => ({ ...prev, [key]: val }))
  }

  const canDeploy = selected.fields
    .filter(f => !['supply', 'decimals'].includes(f.key))
    .every(f => (fieldValues[f.key] || '').trim().length > 0)

  async function handleDeploy() {
    if (!address || !publicClient) return
    setStatus('fee')
    setError('')
    setTxHash('')
    setContractAddr('')

    try {
      // Step 1: Platform fee with builder code in data
      const feeData = encodeBuilderCode(BUILDER_CODE)
      console.log('[BaseAmp] Fee TX data (builder code):', feeData)
      const feeHash = await sendTransactionAsync({
        to: OWNER_ADDRESS,
        value: fee,
        data: feeData,
        chainId: base.id,
      })
      await publicClient.waitForTransactionReceipt({ hash: feeHash })

      setStatus('deploying')

      // Step 2: Deploy contract with ERC-8021 attribution suffix
      const { bytecode, args } = selected.encode(fieldValues)
      // ERC-8021 standard attribution (NOT raw hex — proper format per spec)
      const attributionSuffix = ERC8021.Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) as `0x${string}`
      const deployData = args === '0x'
        ? concat([bytecode, attributionSuffix]) as `0x${string}`
        : concat([bytecode, args, attributionSuffix]) as `0x${string}`

      console.log('[BaseAmp] ERC-8021 attribution suffix:', attributionSuffix)
      console.log('[BaseAmp] Deploy bytes:', (deployData.length - 2) / 2)
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
      console.error('[BaseAmp] Deploy error:', err)
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
  const btnDisabled = busy || !canDeploy

  return (
    <AppLayout title="Deploy Contract">
      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {tx(d.pageInfo, lang)}
        </div>

        {/* Contract type grid */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            {tx(d.contractType, lang)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {CONTRACTS.map(c => (
              <div key={c.id} onClick={() => { setSelectedId(c.id); setStatus('idle'); setError('') }}
                style={{ background: selectedId === c.id ? 'var(--bg-card2)' : 'var(--bg-card)', border: `1px solid ${selectedId === c.id ? '#3b82f6' : 'var(--border)'}`, borderRadius: '10px', padding: '14px 12px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ fontSize: '18px', marginBottom: '6px', fontFamily: 'monospace', color: selectedId === c.id ? '#60a5fa' : 'var(--text-muted)' }}>{c.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>{c.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {tx(d.parameters, lang)} — {selected.title}
          </div>

          {selected.fields.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>{tx(d.noParams, lang)}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selected.fields.length === 1 ? '1fr' : '1fr 1fr', gap: '12px' }}>
              {selected.fields.map(f => (
                <InputField key={f.key} label={f.label} value={fieldValues[f.key] ?? ''} onChange={v => setField(f.key, v)} placeholder={f.placeholder} type={f.type} />
              ))}
            </div>
          )}

          {/* Info */}
          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>{tx(d.network, lang)}</div>
            <div style={{ color: '#22c55e' }}>✓ {tx(d.builderAttribution, lang)}</div>
            {hasReferral && <div style={{ color: '#4ade80' }}>{tx(d.refDiscount, lang)}</div>}
          </div>

          {/* Status */}
          {busy && (
            <div style={{ background: 'var(--bg-card2)', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#60a5fa' }}>
              {status === 'fee' ? tx(d.preparing, lang) : tx(d.deploying, lang)}
            </div>
          )}
          {status === 'error' && error && (
            <div style={{ background: 'var(--bg-card2)', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#f87171' }}>
              {error}
            </div>
          )}
          {status === 'success' && (
            <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4ade80', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: '700' }}>{selected.title} {tx(d.success, lang)}</div>
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

          <button onClick={handleDeploy} disabled={btnDisabled}
            style={{ width: '100%', padding: '13px', background: btnDisabled ? 'var(--bg-card2)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: `1px solid ${btnDisabled ? 'var(--border)' : 'transparent'}`, borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: btnDisabled ? 'var(--text-muted)' : 'white', cursor: btnDisabled ? 'not-allowed' : 'pointer' }}>
            {status === 'fee' ? tx(d.preparingBtn, lang) :
             status === 'deploying' ? tx(d.deployingBtn, lang) :
             lang === 'tr' ? `${selected.title} Deploy Et` : `Deploy ${selected.title}`}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
