# Contributing to PROMETHEUS

> Status: **Proposed.** There is no application code yet. Early contributions focus on
> documentation and the v0.1 foundation. Detailed guidance lives in
> [docs/development/](docs/development/README.md).

## Definition of Done

A feature is not complete until:

```
CODE + TESTS + DOCUMENTATION = DONE
```

Documentation should be updated in the same pull request as the feature whenever appropriate.
If a change alters behaviour, architecture, or a decision, update the affected documents (and
add an ADR when a durable decision is made — see [docs/decisions/](docs/decisions/README.md)).

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, reviewed history. Never pushed to directly. |
| `develop` | Integration branch for the next release. |
| `feature/*` | New functionality. |
| `fix/*` | Bug fixes. |
| `research/*` | Research experiments and prototypes. |

Examples: `feature/github-oauth`, `feature/agent-adapter`, `feature/skill-registry`,
`fix/github-pagination`, `research/commit-quality-model`.

Do not push directly to `main`. Use pull requests. See
[docs/development/git-workflow.md](docs/development/git-workflow.md).

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:      new functionality
fix:       bug fix
docs:      documentation only
refactor:  behaviour-preserving code change
test:      tests
chore:     tooling, build, dependencies
research:  research experiments
```

Examples:

```
feat(auth): add GitHub OAuth authentication
feat(agent): create base AgentAdapter interface
docs(architecture): document agent runtime
research(benchmark): add debugging benchmark experiment
```

## Documentation Conventions

- Write clear, professional English; avoid marketing hype.
- Distinguish facts from proposals and implemented functionality from future plans.
- Label unresolved areas with `Status: Proposed` and list open questions.
- Link related documents instead of duplicating content.
- Use Mermaid diagrams only when they improve understanding.
- Keep terminology consistent with [docs/README.md](docs/README.md) and the
  [glossary in the project overview](docs/00-project-overview.md#glossary).

## Reporting Security Issues

Do not open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md).
