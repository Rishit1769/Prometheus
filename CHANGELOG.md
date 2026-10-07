# Changelog

All notable changes to PROMETHEUS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Notes

- All later capabilities (developer profile, agents, benchmarks, skills) remain **Planned** or
  **Proposed**.

## [0.1.0] - 2026-10-06

### Added

- Initial repository commit (`first commit`) with a placeholder `README.md`.
