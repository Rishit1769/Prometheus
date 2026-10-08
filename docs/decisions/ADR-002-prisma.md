# ADR-002: Prisma as the Primary Application ORM

## Status

Accepted for the identity foundation

## Context

The core application is planned in TypeScript/Next.js and needs type-safe access to PostgreSQL
([ADR-001](ADR-001-postgresql.md)). The entity model is substantial and relational (developers,
agents, skills, versions, benchmarks, results, lineage). We want type safety, a clear schema
source of truth, and a maintainable migration workflow.

## Decision

Use Prisma 7.10.0 as the primary application ORM for PROMETHEUS, with Auth.js 5.0.0-beta.32 and
`@auth/prisma-adapter` 2.11.3 for the first identity milestone.

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

## Compatibility decision

Prisma 7 was selected because the current Auth.js Prisma adapter accepts Prisma 7 and Prisma's
official Auth.js guide documents the adapter flow. Prisma 8 was not selected for this milestone:
its new client runtime changes the generated-client integration and would add migration risk to
the first authentication foundation. The database package isolates Prisma behind a singleton
client, so a future Prisma upgrade can be evaluated in one package.

## Revisit Conditions

- If the vector-heavy query workload makes the generated client a bottleneck.
- If Prisma's migration model conflicts with a future need for finer SQL control.
- If the core language changes away from TypeScript.

## Related Documents

- [ADR-001 PostgreSQL](ADR-001-postgresql.md)
- [ADR-004 FastAPI AI Service](ADR-004-fastapi-ai-service.md)
- [Database Architecture](../architecture/database-architecture.md)
