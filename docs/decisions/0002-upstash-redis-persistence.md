# ADR-0002: Upstash Redis for persistence

- Date: 2026-09-02
- Status: accepted
- Supersedes: none
- Superseded by: none

## Context
The app is graded by automated tests hitting a deployed URL on a serverless platform (Vercel), so pastes must survive across independent requests — in-memory state is insufficient. We also need concurrency-safe view counting and want zero deploy friction.

Deployment target is Vercel, so the initial pick was **Vercel KV** — the platform-native default. Investigating it revealed that Vercel KV is not its own datastore: it is **Upstash Redis** exposed under a Vercel-branded wrapper, and Vercel has since folded KV into the **Upstash Marketplace integration** rather than a first-party product. That reframed the choice as "use the wrapper, or use the thing the wrapper wraps."

## Decision
Adopt **Upstash Redis directly** via the REST client `@upstash/redis`, with two keys per paste: `paste:<id>` (JSON) and `paste:<id>:views` (integer counter). This supersedes the initial lean toward Vercel KV.

## Why this over the alternatives
- **Vercel KV** — considered first (Vercel-native), then dropped. It is the same Upstash Redis backend with an extra wrapper and Vercel-specific env-var names (`KV_*`). Going direct removes a layer, keeps `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` identical across local and prod, and avoids coupling the code to a Vercel platform primitive — so it runs the same in local dev and would port to any host.
- **Vercel Postgres / Neon** — rejected because it needs a schema, and the app must start without manual migrations.
- **In-memory / SQLite on the function filesystem** — rejected because it doesn't survive across independent serverless requests (the core persistence requirement).

## Trade-offs accepted
An external service dependency and two env vars to configure. Expired keys are not garbage-collected (no native TTL — see ADR-0003).

## Consequences
Atomic `INCR` enables safe view limits (ADR-0004). Boots with just `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; no migrations. REST transport avoids TCP connection-pool exhaustion on serverless.
