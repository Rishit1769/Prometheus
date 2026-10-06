# Local Development

> Status: **Implemented for the web/database foundation.**

## Current State

The repository contains a Next.js web app in `apps/web` and a Prisma database package in
`packages/database`. GitHub OAuth is implemented but requires local GitHub OAuth credentials for
live verification.

## Prerequisites

| Tool | Purpose |
|------|---------|
| Node.js 20.9+ and pnpm 11 | Next.js web app and TypeScript core |
| Python | FastAPI AI/ML service |
| Docker + Docker Compose | PostgreSQL, Redis, MinIO, and the sandbox |
| PostgreSQL with pgvector | Primary database and vector search |
| Git | Version control |

## Implemented Stack

- Web: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- ORM: Prisma
- Database: PostgreSQL + pgvector
- Cache/async: Redis
- AI/ML service: Python + FastAPI
- Object storage: MinIO
- Orchestration: Docker Compose

## Local Workflow

1. Copy `.env.example` to `.env` and fill in values (see [Environment Variables](environment-variables.md)).
2. Install dependencies with `pnpm install`.
3. Verify PostgreSQL and pgvector with `pnpm db:test`.
4. Apply the reviewed migration with `pnpm db:migrate`.
5. Start the web app with `pnpm dev` and open `http://localhost:3000`.
6. Sign in with GitHub after registering the callback URL below.

The AI service and other infrastructure remain future work and are not started by this milestone.

## OAuth callback

Register `http://localhost:3000/api/auth/callback/github` as the GitHub OAuth callback URL. The
homepage URL is `http://localhost:3000`.

## Contributing Documentation Today

Until code exists, contributions target:

- this documentation system,
- the v0.1 foundation (tooling, CI, project scaffolding),
- architecture decision records.

See [CONTRIBUTING.md](../../CONTRIBUTING.md) and [Git Workflow](git-workflow.md).

## Related Documents

- [Environment Variables](environment-variables.md)
- [Testing Strategy](testing-strategy.md)
- [ADR-001 PostgreSQL](../decisions/ADR-001-postgresql.md)
