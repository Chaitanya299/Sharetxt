# Architecture — <!-- updated: 2026-09-02 -->

Only what a new engineer can't read off the code at a glance.

## Entry points
- Next.js App Router. API handlers under `app/api/**/route.ts`; pages `app/page.tsx` (create) and `app/p/[id]/page.tsx` (view).

## Module boundaries and ownership
- `lib/redis.ts` — owns all persistence and the paste lifecycle: the Redis client (lazy singleton), `createPaste` / `consumeView` / `peekPaste`, plus `effectiveNow` (time) and `baseUrl` (URL) helpers. Route handlers stay thin: parse, validate, call, respond.

## Critical paths
The flows that matter most, one line each:

- Create — `POST /api/pastes` → validate body → `createPaste` sets `paste:<id>` JSON → `{ id, url }` (201).
- Fetch (API) — `GET /api/pastes/:id` → `consumeView`: load → expiry check → atomic `INCR paste:<id>:views` → 200 or 404.
- View (HTML) — `GET /p/:id` → `peekPaste` (no increment) → render `<pre>{content}</pre>` or `notFound()`.
- Health — `GET /api/healthz` → `redis.ping()` → always 200 `{ ok }`.

## Conventions that differ from the framework default
- Expiry is computed in app code, not via Redis native TTL — so `x-test-now-ms` can drive it deterministically.
- Every route + the view page are `dynamic = 'force-dynamic'`, `runtime = 'nodejs'` — no caching of paste responses; Node `crypto` for ids.
- Redis client is a lazy singleton, never built at import — so `next build` needs no env vars.
- `/p/:id` does not consume a view; only successful API fetches count.
