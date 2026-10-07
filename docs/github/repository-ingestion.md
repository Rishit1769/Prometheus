# Repository Ingestion

> Status: **Implemented (PROM-002 / v0.3).** Authenticated developers can synchronize their
> **public** GitHub repositories into PostgreSQL. This milestone stores raw repository evidence
> only; it does not derive developer skill scores.

## Problem

To build an evidence-based developer profile, PROMETHEUS must retrieve public repository
evidence reliably, within GitHub API limits, and without creating duplicate records on repeat
runs.

## Scope

- **In scope:** the authenticated developer's public, owned repositories — metadata, language
  byte evidence, and topics.
- **Out of scope (this milestone):** private repositories, commits, pull requests, issues,
  reviews, and any scoring or profiling. Private access is not requested and no `repo` OAuth
  scope is added.

## Architecture

```
GitHub REST API
      ↓  GitHubClient          (apps/web/lib/github/client.ts)
   pagination, headers, rate limits, typed errors
      ↓  normalize.ts          (GitHub payload → PROMETHEUS evidence)
   NormalizedRepository / NormalizedLanguage
      ↓  sync.ts               (orchestration, partial-failure policy, sync records)
      ↓  persist.ts            (idempotent, transactional upsert)
   Prisma → PostgreSQL
      ↓  queries.ts + API routes + /repositories UI
```

- **Client** (`client.ts`): authenticated REST calls with `Accept: application/vnd.github+json`,
  `X-GitHub-Api-Version: 2022-11-28`, `Authorization: Bearer <token>`, and a user agent.
- **Normalization** (`normalize.ts`): decouples GitHub response shapes from the internal model.
- **Sync service** (`sync.ts`): orchestrates a run and records observability.
- **Persistence** (`persist.ts`): idempotent upserts inside short transactions.
- **Queries** (`queries.ts`): read models for the API and UI.

## Data Model

| Model | Purpose |
|-------|---------|
| `Repository` | One public GitHub repository's raw metadata. |
| `RepositoryLanguage` | Language byte evidence per repository. |
| `GitHubRepositorySync` | One synchronization attempt with counts and rate-limit info. |

- GitHub's immutable numeric repository id is the external identity (`githubRepositoryId`,
  stored as `BIGINT`, unique).
- Language rows are keyed by `(repositoryId, language)` and **replaced** on each sync so stale
  rows never accumulate.
- Topics are stored as a `String[]` column on `Repository`.
- `lastSyncedAt` records per-repository freshness.

See [ADR-007](../decisions/ADR-007-github-repository-evidence.md) and
[Database Architecture](../architecture/database-architecture.md).

## Synchronization Behaviour

1. Resolve the OAuth access token from the user's stored GitHub `Account`.
2. List public owned repositories with `GET /user/repos?visibility=public&affiliation=owner`,
   following the `Link` `rel="next"` header until exhausted (`per_page=100`).
3. For each repository: fetch `GET /repos/{owner}/{repo}/languages`, normalize, and upsert.
4. Record a `GitHubRepositorySync` row with status, counts, and rate-limit information.

### Pagination

Pagination follows the `Link` header rather than assuming a single page. Developers with more
than 100 repositories are fully handled.

### Languages

GitHub reports **byte counts**, not percentages. Percentages are derived deterministically
(`bytes / totalBytes * 100`); empty repositories yield an empty language set without error.

### Topics

Topics are read from the repository list payload (returned with `application/vnd.github+json`).
An empty topic set is valid.

### Idempotency

Repositories are matched by `githubRepositoryId` and updated rather than duplicated. Repeated
syncs produce `created = 0` and `updated = N`. Language rows are replaced atomically per
repository.

### Partial Failures

Language evidence is **best-effort**: if a single repository's language call fails, the
repository metadata is still persisted, existing language rows are preserved (not deleted), the
run is marked `PARTIAL`, and `repositoriesFailed` is incremented. A rate-limit response, by
contrast, aborts the run deliberately.

### Rate Limits

Response headers (`x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`) are parsed
and recorded. A `403` with `remaining = 0`, or a `429`, raises `GitHubRateLimitError`; the run is
recorded as `RATE_LIMITED`. There is no aggressive retry loop.

## Error Handling

| Condition | Behaviour |
|-----------|-----------|
| Missing GitHub account / token | `409` (`GITHUB_ACCOUNT_MISSING`) |
| Expired or revoked token | `401` (`GITHUB_AUTH_FAILED`) |
| Rate limit exhausted | `429` (`GITHUB_RATE_LIMITED`) with reset time |
| GitHub 5xx / network | Bounded retries, then `502` (`GITHUB_API_ERROR`) |
| One repository's persist failure | Counted as failed; run becomes `PARTIAL` |
| Empty repository list | Successful no-op |
| Database failure | Surfaced; sync record attempted |

Registering a language failure also marks the run `PARTIAL`.

## API and UI

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/github/repositories/sync` | POST | Required | Synchronize the session user's repositories. |
| `/api/github/repositories` | GET | Required | List synchronized repositories + latest sync. |

The user identity is always derived from the server session; the request body is ignored, so a
client cannot synchronize another user's repositories. The `/repositories` page triggers a sync
and lists results, showing never-synced, success, partial, failed, and rate-limited states.

## Security Considerations

- The OAuth token is used only server-side against the GitHub API. It is never returned to the
  browser, logged, or included in error messages.
- Only public repository data is persisted; a defensive check skips any `private === true`
  payload.
- No `repo` scope is requested.
- Error responses return safe codes and messages.

## How to Run a Sync Locally

1. Ensure `.env` has `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, and `AUTH_GITHUB_SECRET`.
2. `pnpm install`, then `pnpm db:migrate` (applies reviewed migrations).
3. `pnpm dev`, sign in with GitHub, open `http://localhost:3000/repositories`, and click
   **Sync repositories**.
4. Run it a second time and confirm the repository count does not change.

## How to Test

- `pnpm test` runs the web and database suites, including GitHub client, normalization, and
  database-integration tests.
- Database-integration tests create an isolated test user, exercise create/update/idempotency/
  partial-failure/rate-limit paths, and delete the user afterwards. They are skipped when
  `DATABASE_URL` is not set.

## Known Limitations

- Private repositories are excluded.
- Commits, PRs, issues, and reviews are **not** ingested in this milestone
  (see [Data Flow](../architecture/data-flow.md) and the roadmap).
- Repositories deleted or made private on GitHub are not removed locally on sync; this milestone
  upserts only.
- GitHub OAuth tokens issued with expiry must be refreshed by signing in again; an expired token
  surfaces as `GITHUB_AUTH_FAILED`.
- One repository per language request means sync is O(repositories) API calls; acceptable for
  V1 but a candidate for batching later.

## Future Work

- Commit and pull-request evidence (PROM-003).
- Repository intelligence and profiling (PROM-004/005).
- Incremental, webhook-driven ingestion.

## Related Documents

- [Authentication](authentication.md)
- [Developer Profile](developer-profile.md)
- [Data Flow](../architecture/data-flow.md)
- [ADR-007: GitHub repository evidence](../decisions/ADR-007-github-repository-evidence.md)
