# Local Development

> Status: **Proposed.** No application has been scaffolded. The commands and steps below are the
> *intended* workflow and do not yet work because no application code exists. This document will
> be corrected as soon as scaffolding lands.

## Current State

The repository currently contains only documentation. There is no runnable application, so there
is nothing to start locally yet.

## Intended Prerequisites (Planned)

| Tool | Purpose |
|------|---------|
| Node.js + package manager | Next.js web app and TypeScript core |
| Python | FastAPI AI/ML service |
| Docker + Docker Compose | PostgreSQL, Redis, MinIO, and the sandbox |
| PostgreSQL with pgvector | Primary database and vector search |
| Git | Version control |

## Intended Stack

- Web: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- ORM: Prisma
- Database: PostgreSQL + pgvector
- Cache/async: Redis
- AI/ML service: Python + FastAPI
- Object storage: MinIO
- Orchestration: Docker Compose

## Intended Local Workflow (Planned)

1. Copy `.env.example` to `.env` and fill in values (see
   [Environment Variables](environment-variables.md)).
2. Start infrastructure (PostgreSQL+pgvector, Redis, MinIO) via Docker Compose.
3. Apply database migrations (Prisma) once a schema exists.
4. Run the web app and the AI/ML service in development mode.
5. Open the web app in a browser and sign in with GitHub.

> Concrete commands are intentionally omitted until tooling exists; documenting commands that do
> not work would violate this repository's honesty rules.

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
