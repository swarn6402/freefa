import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Shared edge cache for GET API routes.
//
// Why this exists: on Cloudflare Workers a Response the Worker generates is NOT
// automatically stored in the CDN just because it carries `Cache-Control:
// s-maxage=…`. Only the explicit Cache API (`caches.default`) actually caches
// dynamic responses. Without it, every client poll reaches the function and
// hits Supabase/PostgREST — which saturated the free-tier 10-connection pool
// under traffic ("Thread killed by timeout manager"). Routing polled reads
// through this helper collapses thousands of polls to ~1 origin read per TTL
// per datacenter.
//
// Safe by construction: in local dev (`next dev`) neither `caches.default` nor
// the Cloudflare execution context exist, so this transparently degrades to
// "always compute, never cache".

interface EdgeCacheOptions {
  // A stable, absolute cache-key URL. Include every query param that changes
  // the payload (e.g. status/limit for matches, matchId for streams).
  key: string;
  // Fresh lifetime in seconds. Also emitted as s-maxage.
  ttlSeconds: number;
  // Extra window (seconds) clients may serve a stale copy while revalidating.
  staleWhileRevalidateSeconds?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEdgeCache(): any | null {
  // `caches.default` is a Workers-only global; absent under Node/`next dev`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalCaches = (globalThis as any).caches;
  return globalCaches?.default ?? null;
}

/**
 * Return a JSON response for a GET route, served from the Cloudflare edge cache
 * when a fresh copy exists, otherwise computed via `produce()` and stored for
 * `ttlSeconds`. Only successful payloads are cached. `produce` is only invoked
 * on a cache miss, so its Supabase reads run at most once per TTL per POP.
 */
export async function jsonWithEdgeCache<T>(
  produce: () => Promise<T>,
  options: EdgeCacheOptions
): Promise<NextResponse> {
  const { key, ttlSeconds, staleWhileRevalidateSeconds = 30 } = options;
  const cache = getEdgeCache();
  const cacheKey = new Request(key, { method: 'GET' });

  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        return hit as unknown as NextResponse;
      }
    } catch {
      // Cache read failure is non-fatal; fall through to compute.
    }
  }

  const data = await produce();
  const response = NextResponse.json(data as object, {
    headers: {
      'Cache-Control': `s-maxage=${ttlSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`,
    },
  });

  if (cache) {
    try {
      const { ctx } = getCloudflareContext();
      // Store without blocking the response. clone() so the body stays readable.
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    } catch {
      // No Cloudflare context (e.g. dev) — skip caching, still return fresh.
    }
  }

  return response;
}
