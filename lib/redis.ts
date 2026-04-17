import { Redis } from '@upstash/redis'

let client: Redis | null = null

function getClient(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn('[redis] Client not configured — KV_REST_API_URL or KV_REST_API_TOKEN missing')
    return null
  }
  if (!client) {
    client = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
  return client
}

// In-memory fallback
const mem = new Map<string, any>()

export const redis = {
  async get<T = any>(key: string): Promise<T | null> {
    const c = getClient()
    if (!c) return mem.get(key) ?? null
    try {
      return await c.get<T>(key)
    } catch (e) {
      console.warn(`[redis] get('${key}') failed:`, e)
      return mem.get(key) ?? null
    }
  },

  async set(key: string, value: any): Promise<void> {
    const c = getClient()
    if (!c) { mem.set(key, value); return }
    try {
      await c.set(key, value)
    } catch (e) {
      console.warn(`[redis] set('${key}') failed:`, e)
      mem.set(key, value)
    }
  },

  async setEx(key: string, ttlSeconds: number, value: any): Promise<void> {
    const c = getClient()
    if (!c) {
      mem.set(key, value)
      setTimeout(() => mem.delete(key), ttlSeconds * 1000)
      return
    }
    try {
      await c.set(key, value, { ex: ttlSeconds })
    } catch (e) {
      console.warn(`[redis] setEx('${key}', ${ttlSeconds}) failed:`, e)
      mem.set(key, value)
      setTimeout(() => mem.delete(key), ttlSeconds * 1000)
    }
  },

  async zadd(key: string, score: number, member: string): Promise<void> {
    const c = getClient()
    if (!c) return
    try {
      await c.zadd(key, { score, member })
    } catch (e) {
      console.warn(`[redis] zadd('${key}', score=${score}, member='${member}') failed:`, e)
    }
  },

  async zrange(key: string, start: number, stop: number, opts?: { rev?: boolean; withScores?: boolean }): Promise<any[]> {
    const c = getClient()
    if (!c) return []
    try {
      return await c.zrange(key, start, stop, opts)
    } catch (e) {
      console.warn(`[redis] zrange('${key}', ${start}, ${stop}) failed:`, e)
      return []
    }
  },
}
