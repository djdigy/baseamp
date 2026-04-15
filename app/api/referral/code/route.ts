import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

// 8 karakterlik benzersiz kod üret
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.toLowerCase()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  // Mevcut kod var mı?
  const existing = await redis.get<string>(`refcode:addr:${address}`)
  if (existing) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://baseamp.vercel.app'
    return NextResponse.json({ code: existing, link: `${appUrl}?ref=${existing}` })
  }

  // Yeni kod üret (çakışma kontrolü ile)
  let code = generateCode()
  let attempts = 0
  while (attempts < 10) {
    const taken = await redis.get(`refcode:code:${code}`)
    if (!taken) break
    code = generateCode()
    attempts++
  }

  // İki yönlü kaydet: address → code, code → address
  await redis.set(`refcode:addr:${address}`, code)
  await redis.set(`refcode:code:${code}`, address)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://baseamp.vercel.app'
  return NextResponse.json({ code, link: `${appUrl}?ref=${code}` })
}
