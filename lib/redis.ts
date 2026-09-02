import { Redis } from '@upstash/redis';
import { randomBytes } from 'node:crypto';
import type { PasteView } from '@/lib/types';

// Lazily-built REST client. Memoized so we don't rebuild per call, but never
// constructed at import time — that keeps `next build` from needing env vars and
// avoids throwing during module load. This is a cached connection config, not
// per-request app state. Reads Upstash's own names (UPSTASH_REDIS_REST_URL/_TOKEN)
// or Vercel's KV integration names (KV_REST_API_URL/_TOKEN) — same Upstash DB,
// different labels — so it works whichever set the host injects.
let _client: Redis | null = null;
export function getRedis(): Redis {
  if (_client) return _client;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  _client = url && token ? new Redis({ url, token }) : Redis.fromEnv();
  return _client;
}

type Stored = {
  content: string;
  expiresAt: number | null; // ms since epoch, or null for no TTL
  maxViews: number | null; // or null for unlimited
};

// Anything with a header lookup: NextRequest's Headers and next/headers' ReadonlyHeaders.
type HeaderGetter = { get(name: string): string | null };

// Effective "now" in ms. Under TEST_MODE the x-test-now-ms header overrides the
// system clock for expiry logic only (deterministic-time testing).
export function effectiveNow(headers: HeaderGetter): number {
  if (process.env.TEST_MODE === '1') {
    const h = headers.get('x-test-now-ms');
    if (h !== null && h.trim() !== '') {
      const n = Number(h);
      if (Number.isFinite(n)) return n;
    }
  }
  return Date.now();
}

// Absolute base URL derived from the request — never hardcoded (no localhost in source).
export function baseUrl(headers: HeaderGetter): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? '';
  const proto = headers.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

function newId(): string {
  return randomBytes(9).toString('base64url'); // 12 url-safe chars
}

const key = (id: string) => `paste:${id}`;
const viewsKey = (id: string) => `paste:${id}:views`;

export async function createPaste(
  content: string,
  ttlSeconds: number | null,
  maxViews: number | null,
  now: number,
): Promise<string> {
  const id = newId();
  const paste: Stored = {
    content,
    expiresAt: ttlSeconds !== null ? now + ttlSeconds * 1000 : null,
    maxViews,
  };
  // ponytail: app-level expiry only; add a backstop Redis EXPIRE (ttl+buffer)
  // if key growth ever matters. Native TTL is intentionally NOT used because it
  // can't see the injected x-test-now-ms time.
  await getRedis().set(key(id), paste);
  return id;
}

async function load(id: string): Promise<Stored | null> {
  return (await getRedis().get<Stored>(key(id))) ?? null;
}

function isExpired(paste: Stored, now: number): boolean {
  return paste.expiresAt !== null && now >= paste.expiresAt;
}

function expiresAtIso(paste: Stored): string | null {
  return paste.expiresAt !== null ? new Date(paste.expiresAt).toISOString() : null;
}

// API fetch: counts as a view. Returns null when unavailable (missing / expired / limit hit).
export async function consumeView(id: string, now: number): Promise<PasteView | null> {
  const paste = await load(id);
  if (!paste) return null;
  if (isExpired(paste, now)) return null; // checked before INCR so an expired fetch never burns a view

  let remaining: number | null = null;
  if (paste.maxViews !== null) {
    const count = await getRedis().incr(viewsKey(id)); // atomic → concurrency-safe
    if (count > paste.maxViews) return null;
    remaining = paste.maxViews - count; // count <= maxViews here, so never negative
  }
  return { content: paste.content, remaining_views: remaining, expires_at: expiresAtIso(paste) };
}

// HTML view: does NOT count a view (spec: only API fetches count). Returns content or null.
export async function peekPaste(id: string, now: number): Promise<string | null> {
  const paste = await load(id);
  if (!paste) return null;
  if (isExpired(paste, now)) return null;
  if (paste.maxViews !== null) {
    const used = Number((await getRedis().get(viewsKey(id))) ?? 0);
    if (used >= paste.maxViews) return null;
  }
  return paste.content;
}
