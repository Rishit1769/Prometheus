# Git Workflow

> Status: **Proposed.**

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed history. Never pushed to directly. |
| `develop` | Integration branch for the next release. |
| `feature/*` | New functionality. |
| `fix/*` | Bug fixes. |
| `research/*` | Research experiments and prototypes. |

Examples:

```
feature/github-oauth
feature/agent-adapter
feature/skill-registry
fix/github-pagination
research/commit-quality-model
```

**No direct pushes to `main`.** Use pull requests.

## Flow

```mermaid
flowchart LR
    F["feature/*, fix/*, research/*"] -->|PR| D["develop"]
    D -->|release PR| M["main"]
    M -->|tag| REL["release vX.Y.Z"]

    classDef planned fill:#f5f5f5,stroke:#999,stroke-dasharray:4 2;
    class F,D,M,REL planned;
```

## Conventional Commits

Use the types `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `research`.

Examples:

```
feat(auth): add GitHub OAuth authentication
feat(agent): create base AgentAdapter interface
docs(architecture): document agent runtime
research(benchmark): add debugging benchmark experiment
```

Format: `type(scope): description`.

## Pull Requests

- Keep PRs focused on one concern.
- Include tests and documentation (Definition of Done).
- Reference the issue/experiment where applicable.
- Ensure CI passes before requesting review.

## Research Branches

`research/*` branches may be long-lived and exploratory. When a research result is produced,
record it in the [Research Log](../research/RESEARCH_LOG.md) and, if it changes the design, add or
update an ADR.

## Open Questions

- Is `develop` retained or is trunk-based development preferred for a small team?
- Which CI checks are required to merge?

## Related Documents

- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [Release Process](release-process.md)
- [Testing Strategy](testing-strategy.md)
