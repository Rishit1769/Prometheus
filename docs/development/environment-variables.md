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
| `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY` | PROM-004 server-side intelligence provider configuration |
| `SANDBOX_*` | Docker sandbox limits and network policy |
| `AUTH_SECRET` | Auth.js session encryption secret |

PROM-002 (repository ingestion) requires only `DATABASE_URL` and the `AUTH_*` variables. It uses
the OAuth access token stored on the user's GitHub `Account` row — no additional token is
configured. `GITHUB_TOKEN` is **not** used by PROM-002.

PROM-004 uses an existing server-side OpenAI-compatible configuration when present:
`AI_PROVIDER`, `AI_MODEL` (or `OPENAI_MODEL`), `AI_API_KEY` (or `OPENAI_API_KEY`), and optionally
`AI_BASE_URL` (or `OPENAI_BASE_URL`). For OpenCode Zen, use provider `opencode`, model
`deepseek-v4.1-flash`, and base URL `https://opencode.ai/zen/v1`; the adapter appends
`/chat/completions`, sends a stable per-request `x-opencode-session`, and requests strict JSON Schema
output with low reasoning effort and an output budget sized for the model. Do not use `/zen/go/v1`
unless the workspace has an active Go subscription and its privacy region is set to Global. The
API key is never sent to the browser, stored in the database, or logged. If no key is configured,
the analysis route returns `AI_NOT_CONFIGURED` and no model call is attempted.

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
