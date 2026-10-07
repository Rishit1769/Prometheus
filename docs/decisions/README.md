# Architecture Decisions

> Status: ADR-001, ADR-002, and ADR-007 are accepted for implemented work (identity foundation and
> public repository ingestion). Later records remain proposed.

Architecture Decision Records (ADRs) capture durable technical decisions and the reasoning behind
them. See the format in [CONTRIBUTING.md](../../CONTRIBUTING.md) and the individual records.

## Records

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](ADR-001-postgresql.md) | PostgreSQL as the primary relational database | Accepted |
| [ADR-002](ADR-002-prisma.md) | Prisma as the primary application ORM | Accepted |
| [ADR-003](ADR-003-pgvector.md) | pgvector for V1 vector similarity search | Proposed |
| [ADR-004](ADR-004-fastapi-ai-service.md) | FastAPI/Python for AI, ML, benchmark, and agent-oriented services | Proposed |
| [ADR-005](ADR-005-custom-agent-adapter.md) | Custom minimal `AgentAdapter` abstraction | Proposed |
| [ADR-006](ADR-006-docker-sandbox.md) | Untrusted execution in isolated Docker environments | Proposed |
| [ADR-007](ADR-007-github-repository-evidence.md) | GitHub repository evidence model | Accepted |

## Format

Every ADR uses:

```
# ADR-XXX: Decision Name
## Status
## Context
## Decision
## Rationale
## Alternatives Considered
## Consequences
## Revisit Conditions
```

## Related Documents

- [System Architecture](../architecture/system-architecture.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
