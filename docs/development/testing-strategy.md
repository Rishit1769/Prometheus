# Testing Strategy

> Status: **Implemented for the web/database foundation; expanding with future milestones.**

## Problem

PROMETHEUS makes empirical claims (a skill improves an agent) and executes untrusted code. Both
demand rigorous testing: of the software, of the benchmark pipeline, and of safety controls.

## Testing Levels

| Level | Scope |
|-------|-------|
| Unit | Pure logic: scoring, parsing, permission checks, normalization |
| Integration | API ↔ DB, API ↔ AI/ML service, ingestion, registry |
| Contract | `AgentAdapter` conformance across provider implementations |
| System / E2E | Full V1 pipeline: ingest → benchmark → discover → validate → transfer |
| Safety | Sandbox isolation, permission enforcement, secret non-exposure |
| Research | Benchmark reproducibility and statistical validity |

## Key Test Concerns

- **Adapter conformance:** every provider adapter passes the same contract suite.
- **Determinism:** benchmark tasks produce stable results under matched conditions.
- **Isolation:** untrusted code cannot access host filesystem, network, or credentials.
- **Secrets:** tests assert credentials are never passed to agents or sandboxes.
- **Idempotency:** repeated ingestion does not duplicate records.

## Current Coverage (PROM-001, PROM-002, PROM-003)

- **GitHub client** (`apps/web/lib/github/client.test.ts`): success, pagination, empty result,
  401/auth failure, rate-limit response, 5xx, network failure, languages, header assertions.
- **Normalization** (`normalize.test.ts`): field mapping, null description, fork/archived/template
  metadata, empty repository, timestamps, language byte percentages, empty topics.
- **Persistence & sync** (`sync.test.ts`): create, metadata update, duplicate prevention
  (idempotency), language replacement, topics, ownership, partial language failure, rate-limit
  and auth-error records. These are database-integration tests, skipped without `DATABASE_URL`.
- **API authentication** (`route.test.ts`): unauthenticated sync is rejected; the user is derived
  from the session; safe error mapping; no secret leakage.
- **README evidence** (`readme.test.ts`, `readme-sync.test.ts`): supported README retrieval,
  404/missing handling, empty and Unicode content, deterministic SHA-256 hashing, bounded UTF-8-safe
  truncation, idempotent unchanged/changed updates, fork/private eligibility, fetch failures, and
  rate-limit status handling.
- **README API access**: unauthenticated requests and malformed identifiers are rejected, and
  repository evidence queries are scoped to the authenticated user's ownership.

Frameworks: **Vitest** (web and database packages). Web tests use an injected `fetch` so no real
GitHub calls occur.

## Definition of Done

```
CODE + TESTS + DOCUMENTATION = DONE
```

Tests are required for a feature to be considered complete.

## Trade-offs

- Full isolation tests are slower but are the whole point of the safety model.
- Deterministic test fixtures are easier to maintain but must avoid becoming the benchmark
  themselves.

## Open Questions

- Which test frameworks are adopted (TS and Python)?
- How is sandbox isolation tested automatically and repeatedly?
- What is the minimum adapter conformance suite?

## Related Documents

- [Benchmark Execution](../benchmarks/benchmark-execution.md)
- [Security Architecture](../architecture/security-architecture.md)
- [Agent Adapter](../agents/agent-adapter.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
