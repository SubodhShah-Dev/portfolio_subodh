/**
 * In-memory content cache (§28, §51).
 *
 * Public portfolio content is static for long stretches: one-time Firestore
 * reads are shared across components, route mounts, and repeated navigations
 * instead of re-querying. Admin mutations call invalidate() so the same tab
 * always sees fresh data; cross-tab staleness is bounded by the TTL.
 *
 * Failed loads are never cached (retries must work).
 */

const DEFAULT_TTL_MS = 5 * 60_000;

interface CacheEntry {
  promise: Promise<unknown>;
  expiresAt: number;
}

const entries = new Map<string, CacheEntry>();

/** Deduplicated, TTL-bounded fetch. Concurrent callers share one read. */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const existing = entries.get(key);
  if (existing !== undefined && existing.expiresAt > now) {
    return existing.promise as Promise<T>;
  }

  const promise = loader().catch((error: unknown) => {
    entries.delete(key);
    throw error;
  });

  entries.set(key, { promise, expiresAt: now + ttlMs });
  return promise;
}

/**
 * Drops every entry whose key equals `prefix` or starts with `prefix:` /
 * `prefix/`. Called by services after any mutation of the matching path.
 */
export function invalidateCache(prefix: string): void {
  for (const key of [...entries.keys()]) {
    if (
      key === prefix ||
      key.startsWith(`${prefix}:`) ||
      key.startsWith(`${prefix}/`)
    ) {
      entries.delete(key);
    }
  }
}

/** Full cache reset — used on sign-out and in tests. */
export function clearCache(): void {
  entries.clear();
}
