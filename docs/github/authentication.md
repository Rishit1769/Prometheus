# Authentication

> Status: **Implemented.** Live verification requires a reachable local PostgreSQL instance and interactive GitHub OAuth authorization.

## Problem

PROMETHEUS needs to identify developers and read their public repository evidence without
exposing credentials to autonomous agents.

## Context

- GitHub OAuth is implemented with Next.js App Router, Auth.js, and the Prisma adapter.
- GitHub REST and GraphQL APIs provide evidence.
- Credentials are high-value secrets (see
  [Security Architecture](../architecture/security-architecture.md)).
- Private repository analysis is out of scope for V1.

## Design

### OAuth Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Web as Web App
    participant API as Core API
    participant GH as GitHub OAuth

    Dev->>Web: Click "Sign in with GitHub"
    Web->>GH: Redirect to authorize (scopes)
    Dev->>GH: Grant consent
    GH->>API: Redirect with authorization code
    API->>GH: Exchange code for access token
    GH-->>API: Access token
    API->>API: Persist provider account; create session
    API-->>Web: Authenticated session
```

### Scopes

The default GitHub provider scope is used for this identity milestone. Public repository analysis
and additional scopes are separate future work.

## Responsibilities

- Auth.js performs the OAuth exchange and persists the provider account through Prisma.
- Sessions are managed with database-backed Auth.js sessions.
- Tokens are used server-side for ingestion and are **never** exposed to agents or API responses.

### Session and GitHub authorization

PROMETHEUS database sessions and GitHub authorization are separate states. A valid PROMETHEUS
session may remain active while GitHub returns `401`; ingestion then reports
`GITHUB_REAUTH_REQUIRED` and the UI offers **Reconnect GitHub**.

The credential service is the only application boundary that reads `Account.access_token` for
repository or README synchronization. It scopes the lookup to the authenticated PROMETHEUS user,
rejects missing or expired credentials, and passes the token only to the server-side GitHub client.

The installed GitHub provider requests `read:user user:email`. This application currently returns
an expiring access token and refresh token, including `expires_in` and
`refresh_token_expires_in`; the provider mapping persists both expiry values. The credential
service refreshes an expired access token and stores rotated tokens. If refresh fails or the
refresh token expires, normal GitHub OAuth reconnect is required.

On reconnect, the Auth.js `signIn` event updates the existing Account row using GitHub's
authoritative `providerAccountId` plus the current PROMETHEUS `userId`. It replaces the access
token and clears stale expiry/refresh metadata, without deleting users or linking arbitrary identities.

## Data Flow

See [Data Flow — GitHub Ingestion](../architecture/data-flow.md#flow-1--github-ingestion).

## Security Considerations

- Never expose GitHub credentials directly to autonomous agents.
- Store tokens encrypted at rest; never log or return them.
- Use state parameters to prevent CSRF in the OAuth flow.
- Treat GitHub `401` as reauthentication-required; refresh only through GitHub's documented token endpoint.

## Trade-offs

- Requesting fewer scopes improves privacy but may limit future features.
- Server-side token custody is safer than client-side but adds infrastructure.

## Verification status

Automated checks cover credential classification, reconnect scoping, safe `GET /user` validation,
and application compilation. Live sign-in and database persistence require reachable PostgreSQL
plus interactive GitHub OAuth authorization.

## Related Documents

- [Repository Ingestion](repository-ingestion.md)
- [Security Architecture](../architecture/security-architecture.md)
- [Environment Variables](../development/environment-variables.md)
