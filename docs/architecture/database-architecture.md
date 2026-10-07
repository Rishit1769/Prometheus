# Database Architecture

> Status: **Implemented for identity and public repository evidence; future entities remain
> proposed.** Migrations: `packages/database/prisma/migrations/20261006233500_init_auth_identity`
> and `20261007140112_github_repository_ingestion`.

## Problem

PROMETHEUS must represent developers, agents, models, benchmarks, skills, versions, validation
results, and lineage — while keeping its vector index close to relational data for V1.

## Context

- PostgreSQL is the primary relational database ([ADR-001](../decisions/ADR-001-postgresql.md)).
- Prisma is the planned ORM ([ADR-002](../decisions/ADR-002-prisma.md)).
- pgvector provides V1 vector similarity search ([ADR-003](../decisions/ADR-003-pgvector.md)).
- Agent identity must be stable across model changes; skills are versioned and traced.

## Implemented identity model

The database package owns the Prisma schema, generated client, migrations, and singleton client.
The first migration creates Auth.js-compatible `User`, `Account`, `Session`, and
`VerificationToken` tables. `User` also stores GitHub username and profile URL for the basic
authenticated identity view.

## Implemented repository evidence model (PROM-002)

The second migration adds raw public-repository evidence:

```mermaid
erDiagram
    USER ||--o{ REPOSITORY : owns
    USER ||--o{ GITHUB_REPOSITORY_SYNC : "runs"
    REPOSITORY ||--o{ REPOSITORY_LANGUAGE : "has languages"

    REPOSITORY {
      string id PK
      string userId FK
      bigint githubRepositoryId UK
      string ownerLogin
      string fullName
      string primaryLanguage
      string[] topics
      datetime lastSyncedAt
    }
    REPOSITORY_LANGUAGE {
      string id PK
      string repositoryId FK
      string language
      int bytes
      float percentage
    }
    GITHUB_REPOSITORY_SYNC {
      string id PK
      string userId FK
      enum status
      int repositoriesFound
      int repositoriesCreated
      int repositoriesUpdated
      int repositoriesFailed
    }
```

- `githubRepositoryId` is the unique external identity (GitHub's immutable repository id,
  stored as `BIGINT`).
- `RepositoryLanguage` is unique on `(repositoryId, language)`; rows are replaced on each sync.
- `topics` is a PostgreSQL `String[]` column.
- `GitHubRepositorySync` records each run with status and rate-limit information.

Design rationale: [ADR-007](../decisions/ADR-007-github-repository-evidence.md).

## Design — Future Entity Relationships

```mermaid
erDiagram
    DEVELOPER ||--o{ REPOSITORY : owns
    DEVELOPER ||--o{ AGENT : controls
    DEVELOPER ||--o{ DEVELOPER_PROFILE : has
    AGENT }o--|| MODEL : "is configured with"
    AGENT ||--o{ BENCHMARK_RUN : undergoes
    BENCHMARK ||--o{ BENCHMARK_TASK : contains
    BENCHMARK_RUN }o--|| BENCHMARK : "evaluates against"
    BENCHMARK_RUN ||--o{ TASK_RESULT : produces
    TASK_RESULT }o--|| BENCHMARK_TASK : "refers to"
    AGENT ||--o{ CAPABILITY_PROFILE : has
    DEVELOPER ||--o{ SKILL : authors
    SKILL ||--o{ SKILL_VERSION : "has versions"
    SKILL_VERSION ||--o{ VALIDATION_RUN : "is validated by"
    VALIDATION_RUN }o--|| AGENT : "targets"
    SKILL_VERSION ||--o{ SKILL_VERSION : "derived from (lineage)"
    AGENT ||--o{ SKILL_INSTALLATION : installs
    SKILL_VERSION ||--o{ SKILL_INSTALLATION : "installed as"
```

## Proposed Entities (Sketch)

> This is a conceptual sketch, not a schema. Field names and types are illustrative.

| Entity | Purpose | Key relations |
|--------|---------|---------------|
| `Developer` | Human identity via GitHub | owns repositories, controls agents |
| `DeveloperProfile` | Evidence-based engineering dimensions | belongs to developer |
| `Repository` | Public repo evidence | belongs to developer |
| `Agent` | Stable agent identity | configured with model, belongs to developer |
| `Model` | Provider + model identifier | referenced by agents |
| `CapabilityProfile` | Agent capability dimensions | belongs to agent |
| `Benchmark` | A task set / suite | contains tasks |
| `BenchmarkTask` | A single deterministic task | belongs to benchmark |
| `BenchmarkRun` | An execution of a benchmark by an agent | produces task results |
| `TaskResult` | Per-task outcome + metrics | belongs to run |
| `Skill` | A skill (logical, version-independent) | has versions, authored by developer |
| `SkillVersion` | Immutable published version | validated by validation runs, has lineage |
| `ValidationRun` | Candidate skill tested against an agent | targets agent, compares to baseline |
| `SkillInstallation` | A skill version installed for an agent | links agent and version |
| `SkillEmbedding` | Vector representation (pgvector) | belongs to skill version |

## Vector Storage

A `SkillEmbedding` table (or column) will store embeddings used for candidate retrieval. The
existing PostgreSQL server's `vector` extension is reserved for that future work; this milestone
does not implement vector search. Similarity search answers *relevance only*; it does not encode quality. See
[Skill Discovery](../skills/skill-discovery.md).

## Invariants (Proposed)

- A `SkillVersion` is immutable once published; changes create a new version.
- `BenchmarkRun` results are append-only.
- An `Agent` references a `Model` but its identity does not change when the model changes.
- `ValidationRun` must reference both a baseline and a candidate measurement.

## Security Considerations

- No secrets are stored in benchmark or skill records.
- GitHub tokens are stored encrypted and never joined into agent-visible payloads.

## Trade-offs

- Keeping vectors in PostgreSQL simplifies operations for V1 but may not scale; a dedicated vector
  store can be revisited.
- A rich lineage model is more complex than a flat skill table but is required for evolution.

## Future Work

- Indexing and partition strategy for large benchmark histories.
- Provenance/trust tables.
- Migration to a distributed vector store if scale demands it.

## Related Documents

- [ADR-001 PostgreSQL](../decisions/ADR-001-postgresql.md)
- [ADR-002 Prisma](../decisions/ADR-002-prisma.md)
- [ADR-003 pgvector](../decisions/ADR-003-pgvector.md)
- [Data Flow](data-flow.md)
