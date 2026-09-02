# ADR-0003: App-level deterministic expiry (not Redis native TTL)

- Date: 2026-09-02
- Status: accepted
- Supersedes: none
- Superseded by: none

## Context
The grader must be able to test expiry deterministically: when `TEST_MODE=1`, the `x-test-now-ms` request header is treated as the current time for expiry logic. Redis' native key TTL runs on the server's real clock and cannot see an injected time, so it can't satisfy this requirement.

## Decision
Store each paste's absolute `expiresAt` (ms epoch) and compare it against an `effectiveNow(headers)` value in application code. `effectiveNow` returns the `x-test-now-ms` header when `TEST_MODE=1` and it is present, otherwise the real system clock — and it is used on both create and fetch.

## Why this over the alternatives
- Redis native `EXPIRE` / TTL — rejected because it can't honor the injected `x-test-now-ms` time, breaking deterministic tests.

## Trade-offs accepted
Expired keys are not automatically evicted (they linger until manually cleaned). `TEST_MODE=1` in production makes expiry client-spoofable via the header — accepted because the assignment requires it.

## Consequences
Expiry is fully deterministic and testable. A backstop Redis `EXPIRE` (ttl + buffer) can be added later purely for key cleanup without affecting correctness.
