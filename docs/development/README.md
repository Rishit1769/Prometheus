# Development

> Status: **Implemented for the web/database foundation; broader services remain planned.**

## Documents

- [Local Development](local-development.md) — intended local setup.
- [Environment Variables](environment-variables.md) — configuration reference.
- [Coding Standards](coding-standards.md) — language and style conventions.
- [Git Workflow](git-workflow.md) — branches, commits, pull requests.
- [Testing Strategy](testing-strategy.md) — what and how to test.
- [Release Process](release-process.md) — versioning and releases.

## Definition of Done

A feature is not complete until:

```
CODE + TESTS + DOCUMENTATION = DONE
```

Documentation is updated in the same pull request as the feature whenever appropriate. See
[CONTRIBUTING.md](../../CONTRIBUTING.md).

## Current State

The repository contains the initial npm workspace, Next.js web app, Prisma schema, and focused
foundation tests. Python services and Docker orchestration are future milestones.

## Related Documents

- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [Architecture Decisions](../decisions/README.md)
