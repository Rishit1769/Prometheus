# Changelog

All notable changes to PROMETHEUS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **PROM-004C verified compatibility.** Persisted developer output now carries schema version
  `developer-intelligence-output-v3`. Legacy profile JSON is safely normalized and rebuilt from
  validated per-repository analyses; legacy profiles are not treated as modern cache hits. Cache
  results distinguish reuse, revalidation, invalidation, and regeneration. The existing
  32-repository legacy profile was upgraded from cached analyses with 32 reused and zero model
  requests. Live `/developer`
  verification rendered real repository attribution and grounded 197 displayed references with
  zero unsupported references; the unchanged follow-up run made zero model requests.

- **PROM-004 — Developer Intelligence V0.** Repository evidence can be independently analyzed
  through a validated model boundary and aggregated deterministically into an eight-domain
  capability vector. README content remains untrusted evidence; no universal developer score is
  produced.

- **PROM-003 — README evidence ingestion.** Authenticated developers can synchronize bounded,
  normalized README evidence for their stored public, non-fork repositories.
  - Current per-repository evidence records preserve source path, GitHub SHA, UTF-8 content,
    byte size, SHA-256 hash, truncation, and explicit availability/failure status.
  - Authenticated `POST /api/github/readmes/sync` and ownership-scoped README access are exposed
    alongside the repository evidence page.
  - README content is treated as untrusted evidence and is never interpreted or scored here.

- **PROM-002 — Public GitHub repository ingestion.** Authenticated developers can synchronize
  their public GitHub repositories into PostgreSQL.
  - Prisma models `Repository`, `RepositoryLanguage`, and `GitHubRepositorySync`
    (migration `20261007140112_github_repository_ingestion`).
  - A minimal authenticated GitHub REST client with pagination, API-version headers, rate-limit
    detection, and bounded transitive retries.
  - A normalization layer and idempotent, transactional persistence layer.
  - Authenticated API routes `POST /api/github/repositories/sync` and
    `GET /api/github/repositories`.
  - A minimal `/repositories` page to trigger and verify synchronization.
  - Unit and database-integration tests for the client, normalization, persistence, idempotency,
    and request authentication.

### Changed

- `packages/database/package.json` `db:migrate` no longer hardcodes the initial migration name.
- Root `ROADMAP.md`, `docs/02-roadmap.md`, and `docs/github/*` updated to reflect PROM-002.
- README ingestion uses npm workspaces and does not alter existing repository synchronization.

### Notes

- All later capabilities (developer profile, agents, benchmarks, skills) remain **Planned** or
  **Proposed**.

## [0.1.0] - 2026-10-06

### Added

- Initial repository commit (`first commit`) with a placeholder `README.md`.
