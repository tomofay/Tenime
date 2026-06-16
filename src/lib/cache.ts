interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const MAX_ENTRIES = 500;
const store = new Map<string, CacheEntry<unknown>>();

function evictIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  let count = store.size - MAX_ENTRIES;
  for (const key of store.keys()) {
    if (count <= 0) break;
    store.delete(key);
    count--;
  }
}

export function getFromCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setToCache<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  evictIfNeeded();
}

export function invalidateCache(key: string): void {
  store.delete(key);
}

export function clearCache(): void {
  store.clear();
}
