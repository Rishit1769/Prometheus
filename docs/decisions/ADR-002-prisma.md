# ADR-002: Prisma as the Primary Application ORM

## Status

Proposed

## Context

The core application is planned in TypeScript/Next.js and needs type-safe access to PostgreSQL
([ADR-001](ADR-001-postgresql.md)). The entity model is substantial and relational (developers,
agents, skills, versions, benchmarks, results, lineage). We want type safety, a clear schema
source of truth, and a maintainable migration workflow.

## Decision

Use Prisma as the primary application ORM for PROMETHEUS.

## Rationale

- First-class TypeScript type safety aligned with the planned TS core.
- Declarative schema and generated client reduce boilerplate and drift.
- Migration tooling supports evolving the schema safely.
- Widely used with Next.js and PostgreSQL, reducing onboarding friction.
- Supports the raw SQL needed for pgvector operations where the generated client is insufficient.

## Alternatives Considered

- **Drizzle ORM:** lighter and SQL-first with strong typing; a viable alternative, but Prisma's
  schema/migration ergonomics and ecosystem familiarity were favoured.
- **TypeORM:** mature but heavier and historically less predictable migrations.
- **Raw SQL / query builder (e.g. Kysely):** maximal control, more manual type maintenance.
- **A Python ORM in the AI service:** would fragment ownership of the schema; the TS core should
  own persistence.

## Consequences

- Positive: one schema source of truth, strong typing, managed migrations.
- Negative: generated client and migration workflow impose some rigidity; advanced queries may
  need raw SQL (e.g. vector operators).
- Neutral: Python services access the database only through explicit interfaces, not Prisma.

## Revisit Conditions

- If the vector-heavy query workload makes the generated client a bottleneck.
- If Prisma's migration model conflicts with a future need for finer SQL control.
- If the core language changes away from TypeScript.

## Related Documents

- [ADR-001 PostgreSQL](ADR-001-postgresql.md)
- [ADR-004 FastAPI AI Service](ADR-004-fastapi-ai-service.md)
- [Database Architecture](../architecture/database-architecture.md)
