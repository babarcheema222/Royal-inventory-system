/**
 * Edge-Ready Rate Limiting Utility
 * Tracks requests per IP and per User ID to prevent abuse.
 * Initial implementation uses in-memory Map; designed for easy swap to Redis/Upstash.
 */

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

export function checkRateLimit(
  key: string,
  namespace: "ip" | "user",
  config: RateLimitConfig = { windowMs: 10000, max: 10 } // Default: 10 req / 10 sec
): { success: boolean; limit: number; remaining: number; reset: number } {
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map());
  }

  const store = stores.get(namespace)!;
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    const newRecord = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(key, newRecord);
    return { success: true, limit: config.max, remaining: config.max - 1, reset: newRecord.resetAt };
  }

  record.count++;
  const success = record.count <= config.max;
  
  return {
    success,
    limit: config.max,
    remaining: Math.max(0, config.max - record.count),
    reset: record.resetAt,
  };
}

/**
 * Cleanup expired records intermittently to prevent memory bloat.
 */
setInterval(() => {
  const now = Date.now();
  stores.forEach((store) => {
    store.forEach((record, key) => {
      if (now > record.resetAt) {
        store.delete(key);
      }
    });
  });
}, 60000); // Clean every 1 minute
