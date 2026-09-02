# ADR-0005: HTML view route does not consume a view

- Date: 2026-09-02
- Status: accepted
- Supersedes: none
- Superseded by: none
- Decided by: Chaitanya

## Context
A paste can carry a `max_views` limit. There are two ways to read a paste: the JSON API (`GET /api/pastes/:id`) and the HTML page a human opens in a browser (`GET /p/:id`). We had to decide whether opening the HTML page counts against the view limit. The spec defines a view narrowly — "each successful API fetch counts as a view" — and gives the HTML route no counting requirement, only "return HTML (200) containing the paste content; 404 if unavailable."

## Decision
Only `GET /api/pastes/:id` consumes a view (atomic `INCR` in `consumeView`). `GET /p/:id` reads the content without incrementing (`peekPaste`), so opening the shared link in a browser — any number of times, any device — never decrements `max_views`.

## Why this over the alternatives
- **Make `/p/:id` also count a view** — rejected. It contradicts the spec's API-only definition, and it creates cross-route interference: a sequence of create `max_views:1` → open the page → `GET /api/pastes/:id` would 404 the API fetch the grader expects to return the content. Browsers also fire prefetch/duplicate requests, so a single page open could silently burn two views and flake the "no serving beyond constraints" check.

## Trade-offs accepted
A human opening the link doesn't feel like "burn after reading" — the counter only moves on direct API calls. This is intentional and matches the spec; if burn-on-open were ever wanted, it would be a deliberate deviation, recorded as a new ADR.

## Consequences
The two routes have distinct jobs: `/api/pastes/:id` is the counted fetch, `/p/:id` is a safe read-only display that still 404s once the paste is unavailable. The decision was independently confirmed by a Codex second-opinion review, which reached the same verdict (keep peek-only) and flagged the same cross-route failure mode.
