// Upstash Redis client - env varsa kullan, yoksa in-memory fallback
let redisClient: any = null

// In-memory fallback store
const memoryStore = new Map<string, string>()

export const redis = {
  async get(key: string): Promise<string | null> {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis')
        if (!redisClient) {
          redisClient = new Redis({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
          })
        }
        return await redisClient.get(key)
      } catch { /* fallback */ }
    }
    return memoryStore.get(key) ?? null
  },

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis')
        if (!redisClient) {
          redisClient = new Redis({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
          })
        }
        if (options?.ex) {
          await redisClient.set(key, value, { ex: options.ex })
        } else {
          await redisClient.set(key, value)
        }
        return
      } catch { /* fallback */ }
    }
    memoryStore.set(key, value)
  }
}
