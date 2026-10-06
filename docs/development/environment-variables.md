# Environment Variables

> Status: **Implemented for the web/database foundation.** The canonical example file is
> [`.env.example`](../../.env.example).

## Rules

- Never commit real secrets. Commit only `.env.example`.
- Provider and GitHub credentials are server-side only and are never exposed to agents or the
  sandbox.
- `.env` is git-ignored.

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
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app |
| `AUTH_URL` | Local application URL |
| `GITHUB_TOKEN` | Server-side API token (if needed) |
| `GITHUB_WEBHOOK_SECRET` | Future webhook verification |
| `AI_SERVICE_URL` / `AI_SERVICE_API_KEY` | FastAPI service access |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OLLAMA_BASE_URL` | Model providers |
| `SANDBOX_*` | Docker sandbox limits and network policy |
| `AUTH_SECRET` | Auth.js session encryption secret |

See [.env.example](../../.env.example) for the full annotated list.

## Security Notes

- GitHub credentials must never be exposed directly to autonomous agents.
- Sandboxes receive no host credentials; `SANDBOX_NETWORK_DISABLED` defaults to disabled.
- Rotate any credential that is accidentally committed, immediately.

## Current status

Auth.js reads the `AUTH_*` variables server-side. The database connection string and all OAuth
secrets remain local-only; `.env.example` contains placeholders and no credentials.

## Related Documents

- [Local Development](local-development.md)
- [Security Architecture](../architecture/security-architecture.md)
- [GitHub Authentication](../github/authentication.md)
