# Development

> Status: **Proposed.** There is no application code yet. These documents describe intended
> practices and will be refined as the v0.1 foundation is built.

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

The repository contains documentation only (`docs/` and root docs). No `package.json`, Python
project, Prisma schema, or Docker configuration exists yet.

## Related Documents

- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [Architecture Decisions](../decisions/README.md)
