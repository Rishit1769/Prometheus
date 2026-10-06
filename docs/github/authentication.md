# Authentication

> Status: **Proposed.**

## Problem

PROMETHEUS needs to identify developers and read their public repository evidence without
exposing credentials to autonomous agents.

## Context

- GitHub OAuth is the planned authentication mechanism.
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
    API->>API: Encrypt + store token; create session
    API-->>Web: Authenticated session
```

### Scopes

Scopes are minimized to what public analysis requires. Exact scopes are **to be finalized**;
public read access is sufficient for V1 and private-repo scopes should be avoided.

## Responsibilities

- Core API performs the OAuth exchange and stores tokens encrypted.
- Sessions are managed by the web app.
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

## Open Questions

- Which exact scopes are required?
- How are tokens refreshed/revoked?
- Is GitHub App authentication preferable to OAuth for long-lived access?

## Related Documents

- [Repository Ingestion](repository-ingestion.md)
- [Security Architecture](../architecture/security-architecture.md)
- [Environment Variables](../development/environment-variables.md)
