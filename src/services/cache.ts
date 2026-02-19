/**
 * Service Instance Cache
 *
 * Caches service instances keyed by (className, accountId).
 * Saves 200-400ms per call by reusing authenticated clients.
 * TTL: 10 minutes (tokens may expire).
 *
 * Port of productivity-mcp/services/cache.py
 */

const CACHE_TTL = 600_000; // 10 minutes in ms

interface CacheEntry {
  instance: unknown;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get a cached service instance or create a new one.
 *
 * For sync constructors:
 *   getService(GmailService, 'user@gmail.com')
 *
 * For async creation, use getServiceAsync instead.
 */
export function getService<T>(ServiceClass: new (accountId: string) => T, accountId: string): T {
  const key = `${ServiceClass.name}:${accountId}`;
  const now = performance.now();

  const cached = cache.get(key);
  if (cached && now - cached.createdAt < CACHE_TTL) {
    return cached.instance as T;
  }

  const instance = new ServiceClass(accountId);
  cache.set(key, { instance, createdAt: now });
  return instance;
}

/**
 * Get a cached service instance using an async factory.
 * Used for services with async initialization (e.g., Microsoft auth).
 */
export async function getServiceAsync<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const now = performance.now();
  const cached = cache.get(key);
  if (cached && now - cached.createdAt < CACHE_TTL) {
    return cached.instance as T;
  }

  const instance = await factory();
  cache.set(key, { instance, createdAt: now });
  return instance;
}

export function clearCache(): void {
  cache.clear();
}
