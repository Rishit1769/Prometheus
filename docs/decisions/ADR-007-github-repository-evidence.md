# ADR-007: GitHub Repository Evidence Model

## Status

Accepted (PROM-002)

## Context

PROM-002 ingests public GitHub repository evidence into PostgreSQL. The model must support:
single-repository identity that is stable across renames, language evidence that preserves byte
counts across multiple languages, retrieval of topics for later analysis, and observable,
idempotent synchronization. PROMETHEUS must also keep this milestone free of any premature
scoring.

## Decision

1. Use GitHub's immutable numeric repository id as the external identity, stored as
   `BIGINT` with a unique constraint (`Repository.githubRepositoryId`).
2. Normalize languages into a `RepositoryLanguage` table with `bytes` and a deterministically
   derived `percentage`, unique on `(repositoryId, language)`, replaced on each sync.
3. Store topics as a PostgreSQL `String[]` column on `Repository`.
4. Record each synchronization in a `GitHubRepositorySync` table with status, counts, and
   rate-limit information.
5. Persist only public repositories; skip `private === true` payloads defensively.

## Rationale

- The GitHub repository id is immutable, so it is the correct deduplication key and prevents the
  duplicate records that name-based keys would allow after renames.
- GitHub reports language **byte counts**, not percentages; preserving bytes retains raw evidence
  and lets percentages be derived later or recomputed. A normalized table supports queries such
  as "repositories where Python bytes dominate" and avoids destructive `String[]` reduction.
- Topics are simple, unordered labels with no per-topic attributes; a `String[]` is idiomatic
  PostgreSQL/Prisma, queryable with array operators, and avoids an extra join table for V1.
- A sync record makes idempotent runs observable (status, found/created/updated/failed,
  rate-limit state) without conflating evidence with derived metrics.

## Alternatives Considered

- **`fullName` (`owner/name`) as the identity:** breaks on repository rename and forces re-keying;
  rejected.
- **`INTEGER` for the repository id:** GitHub ids are 64-bit and can grow; `BIGINT` is safe and
  future-proof.
- **Store only a primary language string:** discards multi-language evidence required for later
  intelligence; rejected.
- **A `RepositoryTopic` join table:** more queryable for large-scale aggregation, but adds a table
  and joins for a simple label set; deferred until analytics demand it.
- **Store percentages only (no bytes):** loses raw evidence and precision; rejected.
- **No sync record:** simpler, but leaves synchronization opaque and hard to diagnose; rejected.

## Consequences

- Positive: stable dedup key; preserved raw language evidence; observable syncs; idempotent
  upserts; no private data.
- Negative: `BIGINT` requires BigInt-aware serialization at the API boundary (handled by mapping
  to strings in DTOs); one language API call per repository; topics as an array are less
  convenient for cross-repository aggregation than a join table.
- Neutral: repository deletion/unpublication is not detected in this milestone (upsert-only).

## Revisit Conditions

- If cross-repository topic analytics require indexed joins, migrate topics to a join table.
- If language analytics need historical tracking, add a time dimension rather than replacing rows.
- If repository deletion detection becomes required, add a reconciliation/removal policy.
- If repository ids are ever exposed in URLs, revisit BigInt-to-string representation.

## Related Documents

- [Repository Ingestion](../github/repository-ingestion.md)
- [Database Architecture](../architecture/database-architecture.md)
- [ADR-001 PostgreSQL](ADR-001-postgresql.md)
