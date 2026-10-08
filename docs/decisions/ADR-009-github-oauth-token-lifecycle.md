# ADR-009: GitHub OAuth token lifecycle

## Status

Accepted

## Decision

PROMETHEUS uses Auth.js database sessions separately from the GitHub provider credential stored in
the Auth.js `Account` row. The configured GitHub provider requests only `read:user user:email` and
uses expiring access tokens and refresh tokens in this deployment. Repository and README ingestion
resolve that credential through one server-side service; missing, expired, revoked, and invalid
credentials are classified as `GITHUB_REAUTH_REQUIRED` rather than logging out the PROMETHEUS
session. Expired access tokens are refreshed through GitHub's documented OAuth token endpoint;
failed or expired refresh tokens require reconnect.

The Auth.js `signIn` event updates the existing GitHub Account token on reconnect, scoped by the
provider's authoritative `providerAccountId` and the current user id. No PAT, private-repository
scope, account deletion, or custom OAuth flow is used.

## Consequences

- A revoked token can coexist with a valid PROMETHEUS session.
- GitHub `401` responses produce a safe reconnect instruction.
- Reconnect is the recovery mechanism when refresh fails or the refresh token expires.
- OAuth tokens remain server-side and are never included in API responses or logs.
