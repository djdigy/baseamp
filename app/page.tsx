// Root page — serves 200 OK with meta tag for Base App domain verification.
// Users are redirected to /dashboard via client-side navigation.
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'system-ui,sans-serif', fontSize: '14px' }}>
      BaseAmp
    </div>
  )
}
