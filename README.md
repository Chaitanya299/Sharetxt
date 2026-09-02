# Sharetxt

A small text-sharing app: create a text paste, get a shareable link, and view it.
Pastes can carry an optional time-to-live (TTL) and/or a view-count limit. Once either
constraint triggers, the paste becomes unavailable and returns `404`.

Built with **Next.js (App Router, TypeScript)** and **Upstash Redis** for persistence.

## Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/healthz` | Health check. `200 { "ok": true }`; `ok` reflects Redis reachability. |
| `POST` | `/api/pastes` | Create a paste. Body: `{ content, ttl_seconds?, max_views? }`. Returns `{ id, url }`. |
| `GET`  | `/api/pastes/:id` | Fetch a paste (counts as a view). Returns `{ content, remaining_views, expires_at }` or `404`. |
| `GET`  | `/p/:id` | HTML view of a paste (does **not** count as a view). `404` if unavailable. |

### Create request rules
- `content` — required, non-empty string.
- `ttl_seconds` — optional; if present, an integer `>= 1`.
- `max_views` — optional; if present, an integer `>= 1`.
- Invalid input → `4xx` with a JSON `{ error }` body.

## Run locally

```bash
npm install
```

Copy the example env file, then fill in your Upstash Redis credentials
(see [Getting Upstash credentials](#getting-upstash-credentials) below):

```bash
cp .env.example .env.local
```

`.env.example` mirrors the variables Vercel's Upstash integration injects, so a
`vercel env pull` and the local file line up:

```bash
TEST_MODE=1
REDIS_URL=
KV_URL=
KV_REST_API_READ_ONLY_TOKEN=
KV_REST_API_TOKEN=
KV_REST_API_URL=
```

The app only needs a REST **URL + read-write token** plus `TEST_MODE`. It reads
either naming scheme, whichever your host provides:

- **`KV_REST_API_URL` + `KV_REST_API_TOKEN`** — what Vercel's integration sets (above).
- **`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`** — what the Upstash console
  gives you directly; set these instead if you're not on Vercel.

The other variables (`REDIS_URL`, `KV_URL`, `KV_REST_API_READ_ONLY_TOKEN`) are unused
and safe to leave blank — the read-only token can't run `INCR`, so the app ignores it.
`TEST_MODE=1` is required so the grader's `x-test-now-ms` header drives expiry.

Then start the dev server:

```bash
npm run dev
```

Open http://localhost:3000. Production build: `npm run build && npm run start`.

## Getting Upstash credentials

You need two values: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Get them
either from the Upstash console (works everywhere) or, if deploying on Vercel, from the
Vercel integration (auto-injected).

### Option A — Upstash console (for local dev, or any host)

1. Go to **https://console.upstash.com** and sign up / log in (free, GitHub or Google).
2. Click **Create Database** → choose **Redis**.
3. Give it a name, pick a region close to you, keep the **Free** plan, and create it.
4. Open the database, scroll to the **REST API** section.
5. Click the **`.env`** tab (or the copy icons) — it shows exactly:
   ```bash
   UPSTASH_REDIS_REST_URL="https://xxxx.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="AxxxxAAIncDx..."
   ```
6. Copy both into your `.env.local` (and add `TEST_MODE=1`).

### Option B — Vercel Marketplace integration (for the deployed app)

1. In your Vercel project → **Storage** tab → **Create Database** → **Upstash for Redis**.
2. Create and **Connect** it to the project.
3. Vercel automatically adds a set of env vars to the project — you don't copy anything by
   hand. (Then add `TEST_MODE=1` yourself and redeploy.)

> The integration injects **several** vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`,
> `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, `REDIS_URL`) — so with `TEST_MODE` you'll see
> **six** total, which is what [`.env.example`](.env.example) lists. That's normal. The app
> uses only the REST **URL + read-write token** (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) —
> or the equivalent `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` from the console —
> plus `TEST_MODE`. The rest are unused and safe to leave; the read-only token is ignored
> because view counting needs `INCR`.

Both options point at the same kind of database; use Option A locally and Option B (or the
same Option A values) in production.

## Persistence

**Upstash Redis** (accessed via the REST client `@upstash/redis`).

### Why Upstash Redis (and why not Vercel KV)

The first choice was **Vercel KV** — it's the obvious default when deploying on
Vercel. On closer look, Vercel KV is itself just Upstash Redis behind a Vercel-branded
wrapper, and Vercel has since moved KV onto the **Upstash Marketplace integration**
anyway. Going straight to `@upstash/redis` means:

- One fewer abstraction layer, and env-var names (`UPSTASH_REDIS_REST_URL` /
  `UPSTASH_REDIS_REST_TOKEN`) that are the same locally and on any host — not tied to
  Vercel's `KV_*` naming.
- The exact same capabilities we need: atomic `INCR` and REST transport.
- The app isn't locked to Vercel's platform primitives, so it runs the same way in
  local dev.

Full reasoning, including the alternatives that were rejected, is in
[`docs/decisions/`](docs/decisions/) — see ADR-0002 (persistence choice), ADR-0003
(deterministic expiry), and ADR-0004 (atomic view counting).

### Why Redis at all
- **Atomic `INCR`** gives concurrency-safe view counting — under parallel load a paste
  is never served beyond its limit, and remaining-view counts never go negative.
- **No migrations / no schema** — the app boots and works with just two env vars, so it
  starts cleanly on a fresh serverless deploy.
- **REST transport** — no TCP connection-pool exhaustion on serverless functions.

Data model (two keys per paste):
- `paste:<id>` → JSON `{ content, expiresAt, maxViews }`
- `paste:<id>:views` → integer counter, `INCR`'d on each successful API fetch

## Design decisions

- **Expiry is computed in application code**, not via Redis' native key TTL. This is
  required so the grader's deterministic-time header can drive expiry: when
  `TEST_MODE=1`, the `x-test-now-ms` request header is treated as the current time for
  expiry logic (on both create and fetch); otherwise the real system clock is used.
  Redis' own TTL can't see that injected time.
- **View counting** uses atomic `INCR`. On fetch we check expiry *before* incrementing,
  so an expired fetch never consumes a view. `remaining_views = max_views - count` is
  only computed while `count <= max_views`, so it is never negative.
- **`/p/:id` does not consume a view.** The spec states only successful *API* fetches
  count, so the HTML page renders without decrementing — it can't accidentally exhaust a
  paste's views.
- **The share URL is derived from the incoming request** (`x-forwarded-proto` / `host`),
  so there are no hardcoded absolute URLs and it works in any environment.
- **No global mutable state.** All paste state lives in Redis; the client is stateless
  connection config, which is correct for serverless.

## Deploy (Vercel)

1. Push this repo to GitHub and import it into Vercel.
2. Add an **Upstash Redis** database via the Vercel Marketplace Upstash integration
   (Storage tab) and **Connect** it — this injects the `KV_REST_API_*` credentials
   automatically. (Or, without the integration, copy the **REST URL + token** from the
   [Upstash console](https://console.upstash.com) into `UPSTASH_REDIS_REST_URL` /
   `UPSTASH_REDIS_REST_TOKEN`.)
3. Add one more Environment Variable by hand:
   - `TEST_MODE=1`  ← required so the grader's `x-test-now-ms` header works.
4. Deploy. No database migrations or shell access are needed.

## Testing the API (curl)

All commands are copy-paste runnable against the live deployment. `BASE` is set to the
deployed URL; change it to `http://localhost:3000` to test locally. The `id` is pulled
out with `grep`/`cut` so **no `jq` is required**.

> Note: `max_views` counts **API** fetches (`GET /api/pastes/:id`). Opening `/p/:id` in a
> browser renders the paste but does **not** count — see [Design decisions](#design-decisions).

```bash
BASE=https://sharetxt-mu.vercel.app
```

**Health** — 200 + JSON, reflects the persistence layer:

```bash
curl -s $BASE/api/healthz            # {"ok":true}
```

**Create a paste, then fetch it:**

```bash
ID=$(curl -s -X POST $BASE/api/pastes -H 'content-type: application/json' \
  -d '{"content":"hello world"}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "id: $ID"
curl -s $BASE/api/pastes/$ID; echo   # {"content":"hello world","remaining_views":null,"expires_at":null}
```

**View limit — `max_views = 1` → `200`, then `404`:**

```bash
ID=$(curl -s -X POST $BASE/api/pastes -H 'content-type: application/json' \
  -d '{"content":"burn once","max_views":1}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
curl -s -o /dev/null -w 'fetch 1: %{http_code}\n' $BASE/api/pastes/$ID   # 200
curl -s -o /dev/null -w 'fetch 2: %{http_code}\n' $BASE/api/pastes/$ID   # 404
```

**View limit — `max_views = 2` → `200`, `200`, then `404`:**

```bash
ID=$(curl -s -X POST $BASE/api/pastes -H 'content-type: application/json' \
  -d '{"content":"two views","max_views":2}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
curl -s -o /dev/null -w 'fetch 1: %{http_code}\n' $BASE/api/pastes/$ID   # 200
curl -s -o /dev/null -w 'fetch 2: %{http_code}\n' $BASE/api/pastes/$ID   # 200
curl -s -o /dev/null -w 'fetch 3: %{http_code}\n' $BASE/api/pastes/$ID   # 404
```

**Watch `remaining_views` count down (JSON bodies):**

```bash
ID=$(curl -s -X POST $BASE/api/pastes -H 'content-type: application/json' \
  -d '{"content":"count me down","max_views":2}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
curl -s $BASE/api/pastes/$ID; echo   # remaining_views: 1
curl -s $BASE/api/pastes/$ID; echo   # remaining_views: 0
curl -s $BASE/api/pastes/$ID; echo   # {"error":"not found"}  (404)
```

**TTL with deterministic time (needs `TEST_MODE=1`):**

```bash
NOW=$(( $(date +%s) * 1000 ))
ID=$(curl -s -X POST $BASE/api/pastes -H 'content-type: application/json' \
  -H "x-test-now-ms: $NOW" -d '{"content":"expires soon","ttl_seconds":60}' \
  | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
curl -s -o /dev/null -w 'before expiry: %{http_code}\n' -H "x-test-now-ms: $NOW"             $BASE/api/pastes/$ID   # 200
curl -s -o /dev/null -w 'after  expiry: %{http_code}\n' -H "x-test-now-ms: $((NOW + 61000))" $BASE/api/pastes/$ID   # 404
```

**Invalid input → `4xx` + JSON error:**

```bash
curl -s -X POST $BASE/api/pastes -H 'content-type: application/json' -d '{}'; echo
# {"error":"content is required and must be a non-empty string"}   (400)
```

---

*by ~ Chaitanya♥️*
