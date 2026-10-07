# Changelog

All notable changes to PROMETHEUS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
