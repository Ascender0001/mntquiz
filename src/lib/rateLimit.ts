import type { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };

// In-memory fixed-window limiter. Sufficient for a single-instance event
// deployment; for multi-instance you'd move this to Redis or similar.
const store = new Map<string, Bucket>();

export type RateResult = { ok: boolean; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();

  // Opportunistic pruning to keep the map bounded.
  if (store.size > 5000) {
    for (const [k, b] of store) {
      if (now >= b.resetAt) store.delete(k);
    }
  }

  const bucket = store.get(key);
  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Best-effort client IP. Behind a reverse proxy (Traefik/Nginx) the real IP is
 * in x-forwarded-for; we take the first (client) entry.
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
