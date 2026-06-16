const store = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: Date } {
  cleanup();
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || now > existing.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: new Date(now + config.windowMs) };
  }

  existing.count++;

  if (existing.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: new Date(existing.resetAt) };
  }

  return { allowed: true, remaining: config.maxRequests - existing.count, resetAt: new Date(existing.resetAt) };
}
