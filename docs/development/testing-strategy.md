# Testing Strategy

> Status: **Proposed.** No tests exist yet.

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
