# ADR-0001: Record architecture decisions

- Date: 2026-09-02
- Status: accepted
- Supersedes: none
- Superseded by: none

## Context
This project has architectural choices (persistence, time handling, concurrency) whose reasoning isn't obvious from the code. Without a record, the "why" is lost and gets re-litigated.

## Decision
Record each significant architectural decision as a numbered ADR in `docs/decisions/`, using the orient workflow.

## Why this over the alternatives
- Tribal knowledge / commit messages — rejected because they aren't discoverable and carry no structured rationale.
- A single design doc — rejected because it goes stale and mixes decisions with narrative.

## Trade-offs accepted
A small amount of upkeep per decision.

## Consequences
Future changes to a decided area start by reading its ADR; reversals supersede rather than edit.
