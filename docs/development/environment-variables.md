# Environment Variables

> Status: **Proposed.** No application reads these variables yet. Names and required values will
> be finalized as implementation begins. The canonical example file is
> [`.env.example`](../../.env.example).

## Rules

- Never commit real secrets. Commit only `.env.example`.
- Provider and GitHub credentials are server-side only and are never exposed to agents or the
  sandbox.
- `.env` is git-ignored (to be added with the v0.1 foundation).

## Reference

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | Runtime environment |
| `APP_URL` | Public app URL |
| `LOG_LEVEL` | Logging verbosity |
| `DATABASE_URL` | PostgreSQL connection (pgvector-enabled) |
| `POSTGRES_*` | Local Postgres container settings |
| `REDIS_URL` | Redis connection |
| `MINIO_*` | MinIO endpoint, credentials, bucket |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `GITHUB_OAUTH_REDIRECT_URI` | OAuth callback |
| `GITHUB_TOKEN` | Server-side API token (if needed) |
| `GITHUB_WEBHOOK_SECRET` | Future webhook verification |
| `AI_SERVICE_URL` / `AI_SERVICE_API_KEY` | FastAPI service access |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OLLAMA_BASE_URL` | Model providers |
| `SANDBOX_*` | Docker sandbox limits and network policy |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Session/auth configuration |

See [.env.example](../../.env.example) for the full annotated list.

## Security Notes

- GitHub credentials must never be exposed directly to autonomous agents.
- Sandboxes receive no host credentials; `SANDBOX_NETWORK_DISABLED` defaults to disabled.
- Rotate any credential that is accidentally committed, immediately.

## Open Questions

- Which authentication library is used (NextAuth vs. custom)?
- Are provider keys held by the core or only by the AI/ML service?
- Is a dedicated secret store required for production before v1.0?

## Related Documents

- [Local Development](local-development.md)
- [Security Architecture](../architecture/security-architecture.md)
- [GitHub Authentication](../github/authentication.md)
