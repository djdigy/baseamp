'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

const REFERRAL_KEY = 'baseamp_referrer'

export function useReferral() {
  const { address } = useAccount()
  const [referrer, setReferrer] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref && ref.startsWith('0x') && ref.length === 42) {
      localStorage.setItem(REFERRAL_KEY, ref.toLowerCase())
      setReferrer(ref.toLowerCase())
    } else {
      const saved = localStorage.getItem(REFERRAL_KEY)
      if (saved) setReferrer(saved)
    }
  }, [])

  useEffect(() => {
    if (!address || !referrer) return
    if (address.toLowerCase() === referrer) return
    fetch('/api/referral/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrer, referee: address.toLowerCase(), feeAmount: 0.0001 }),
    }).catch(console.error)
  }, [address, referrer])

  return { referrer }
}

export function calculateFee(baseFee: bigint, hasReferral: boolean): bigint {
  return hasReferral ? (baseFee * BigInt(80)) / BigInt(100) : baseFee
}
