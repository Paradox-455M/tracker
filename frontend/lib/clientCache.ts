export type CacheEntry<T = unknown> = {
  expiresAt: number;
  promise: Promise<T> | null;
  data?: T;
};

const store = new Map<string, CacheEntry<unknown>>();

function keyFrom(url: string, init?: RequestInit) {
  const method = (init?.method || "GET").toUpperCase();
  // Only cache idempotent GETs by URL
  return method === "GET" ? url : `${method}:${url}:${init?.body ?? ""}`;
}

export async function fetchJsonCached<T = unknown>(
  url: string,
  init?: RequestInit & { ttl?: number; cacheKey?: string; swrTtl?: number }
): Promise<T> {
  const ttl = init?.ttl ?? 10_000;
  const swrTtl = init?.swrTtl ?? 0; // additional stale-while-revalidate window
  const cacheKey = init?.cacheKey || keyFrom(url, init);
  const now = Date.now();

  const existing = store.get(cacheKey) as CacheEntry<T> | undefined;
  if (existing) {
    if (existing.data) {
      if (existing.expiresAt > now) {
        return existing.data as T;
      }
      // Stale but within SWR window: return stale data and revalidate in background
      if (swrTtl > 0 && existing.expiresAt + swrTtl > now) {
        if (!existing.promise) {
          const revalidate = doFetch<T>(url, init, ttl, cacheKey);
          store.set(cacheKey, { ...existing, promise: revalidate });
          revalidate.finally(() => {
            const cur = store.get(cacheKey);
            if (cur?.promise === revalidate) {
              store.set(cacheKey, { expiresAt: Date.now() + ttl, promise: null, data: (cur as CacheEntry<T>).data });
            }
          });
        }
        return existing.data as T;
      }
    }
    if (existing.promise) {
      return existing.promise as Promise<T>;
    }
  }

  const promise = doFetch<T>(url, init, ttl, cacheKey);
  store.set(cacheKey, { expiresAt: now + ttl, promise });
  return promise;
}

async function doFetch<T>(url: string, init: RequestInit | undefined, ttl: number, cacheKey: string): Promise<T> {
  const res = await fetch(url, { ...init, cache: init?.cache ?? "default" });
  const json = (await res.json()) as T;
  store.set(cacheKey, { expiresAt: Date.now() + ttl, promise: null, data: json });
  return json;
}

export function invalidateCache(urlOrKey: string) {
  // Remove both direct key and GET key variant
  store.delete(urlOrKey);
  store.delete(keyFrom(urlOrKey));
}

export function primeCache<T = unknown>(keyOrUrl: string, data: T, ttl = 10_000) {
  const cacheKey = keyOrUrl;
  store.set(cacheKey, { expiresAt: Date.now() + ttl, promise: null, data });
}



