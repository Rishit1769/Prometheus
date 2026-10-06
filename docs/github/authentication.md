# Authentication

> Status: **Implemented, pending live OAuth verification.**

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
- Tokens are used server-side for ingestion and are **never** exposed to agents.

## Data Flow

See [Data Flow — GitHub Ingestion](../architecture/data-flow.md#flow-1--github-ingestion).

## Security Considerations

- Never expose GitHub credentials directly to autonomous agents.
- Store tokens encrypted at rest; never log them.
- Use state parameters to prevent CSRF in the OAuth flow.
- Support token revocation and rotation.

## Trade-offs

- Requesting fewer scopes improves privacy but may limit future features.
- Server-side token custody is safer than client-side but adds infrastructure.

## Verification status

Automated checks cover environment validation and application compilation. Live sign-in and
database persistence require reachable PostgreSQL plus user-provided GitHub OAuth credentials.

## Related Documents

- [Repository Ingestion](repository-ingestion.md)
- [Security Architecture](../architecture/security-architecture.md)
- [Environment Variables](../development/environment-variables.md)
