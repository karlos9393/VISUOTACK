const rateMap = new Map<string, { count: number; resetAt: number }>()

/**
 * In-memory rate limiter. Returns true if request is allowed, false if rate-limited.
 * @param key - unique key (e.g. userId or IP)
 * @param limit - max requests per window
 * @param windowMs - time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  rateMap.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateMap.delete(key)
    }
  })
}, 5 * 60 * 1000)
