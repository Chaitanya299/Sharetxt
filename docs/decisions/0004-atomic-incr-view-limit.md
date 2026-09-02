# ADR-0004: Atomic INCR for view-limit enforcement

- Date: 2026-09-02
- Status: accepted
- Supersedes: none
- Superseded by: none

## Context
Pastes may cap the number of views. The grader checks that a paste is never served beyond its limit under small concurrent load, and that remaining-view counts never go negative. A read-modify-write on a counter would race under concurrency.

## Decision
Track views in a dedicated `paste:<id>:views` key and increment it with Redis' atomic `INCR` on each successful API fetch. Serve only when the returned count `<= max_views`; compute `remaining_views = max_views - count`. Check expiry before incrementing so an expired fetch never burns a view.

## Why this over the alternatives
- Read count → compare → write back — rejected because it races: two concurrent fetches could both read the same value and both serve.
- A lock around the read/write — rejected as unnecessary complexity when `INCR` is already atomic.

## Trade-offs accepted
The counter keeps climbing on requests past the limit (harmless; never overflows in practice).

## Consequences
Exactly `max_views` fetches succeed even under parallel load; `remaining_views` is computed only while `count <= max_views`, so it is never negative.
