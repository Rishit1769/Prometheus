# ADR-001: PostgreSQL as the Primary Relational Database

## Status

Proposed

## Context

PROMETHEUS must persist developers, agents, models, benchmarks, task results, capabilities,
skills, versions, validation runs, installations, and lineage. These are highly relational: many
one-to-many and many-to-many relationships with integrity constraints. The system also needs
transactional consistency for publishing immutable skill versions and appending benchmark
results. V1 additionally needs vector similarity search, and operating a single relational store
is desirable for a small team.

## Decision

Use PostgreSQL as the primary relational database for PROMETHEUS.

## Rationale

- Strong relational modelling and constraint enforcement match the entity model
  (see [Database Architecture](../architecture/database-architecture.md)).
- Mature transactional guarantees (ACID) suit immutable skill versions and append-only result
  histories.
- Rich indexing and JSON support offer flexibility without abandoning relational integrity.
- Well-supported by Prisma ([ADR-002](ADR-002-prisma.md)).
- The pgvector extension keeps V1 vector search in the same store
  ([ADR-003](ADR-003-pgvector.md)), reducing operational complexity.

## Alternatives Considered

- **MySQL/MariaDB:** mature relational databases, but weaker fit for the planned pgvector-based
  V1 vector search and less aligned with the ecosystem.
- **SQLite:** simple for development, but insufficient for concurrent, networked, production
  workloads.
- **A document database (e.g. MongoDB):** flexible schema, but weak fit for the strongly
  relational lineage/validation model and weaker transactional semantics for this use case.
- **A dedicated graph database for lineage:** compelling for lineage specifically, but adds a
  second store before the need is proven.

## Consequences

- Positive: one primary store for relational data and V1 vector search; strong integrity.
- Negative: PostgreSQL must be operated (via Docker Compose locally, managed in production);
  vector performance may eventually need a dedicated store.
- Neutral: schema evolution is managed through migrations (Prisma).

## Revisit Conditions

- If vector search at scale outgrows pgvector, reconsider a dedicated vector store.
- If lineage queries become graph-dominated, reconsider a graph store for that concern.
- If multi-region or extreme write throughput requirements emerge.

## Related Documents

- [ADR-002 Prisma](ADR-002-prisma.md)
- [ADR-003 pgvector](ADR-003-pgvector.md)
- [Database Architecture](../architecture/database-architecture.md)
