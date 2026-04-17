import { Redis } from '@upstash/redis'

let client: Redis | null = null

function getClient(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
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
    if (c) {
      try {
        return await c.get<T>(key)
      } catch (e) {
        console.error('Redis get error:', e)
      }
    }
    return mem.get(key) ?? null
  },

  async set(key: string, value: any): Promise<void> {
    const c = getClient()
    if (c) {
      try {
        await c.set(key, value)
        return
      } catch (e) {
        console.error('Redis set error:', e)
      }
    }
    mem.set(key, value)
  },

  async setEx(key: string, ttlSeconds: number, value: any): Promise<void> {
    const c = getClient()
    if (c) {
      try {
        await c.set(key, value, { ex: ttlSeconds })
        return
      } catch (e) {
        console.error('Redis setEx error:', e)
      }
    }
    // In-memory fallback: store with expiry timestamp
    mem.set(key, value)
    setTimeout(() => mem.delete(key), ttlSeconds * 1000)
  }
}
