# Coding Standards

> Status: **Proposed.** No code exists yet. These conventions are the intended baseline and will
> be enforced by tooling (linters, formatters, type checks) once the v0.1 foundation includes
> them.

## General Principles

- Prefer clarity over cleverness.
- Make invalid states unrepresentable where the language allows it.
- Keep modules focused; respect the boundaries in
  [Component Boundaries](../architecture/component-boundaries.md).
- Distinguish implemented behaviour from planned behaviour in comments and docs.
- Never log secrets; never expose credentials to agents or sandboxes.

## TypeScript / Next.js / Prisma

- Strict TypeScript; avoid `any`.
- Follow the repository's formatter/linter configuration once added.
- Validate untrusted input at boundaries.
- Keep provider SDK calls out of the domain layer (see
  [ADR-005](../decisions/ADR-005-custom-agent-adapter.md)).

## Python / FastAPI

- Follow PEP 8; use type hints.
- Format and lint with the tooling chosen in v0.1.
- Keep the AI/ML service free of user-facing endpoints; expose structured results only.

## Documentation

- Documentation follows the rules in [CONTRIBUTING.md](../../CONTRIBUTING.md).
- Use status labels: Implemented, In Development, Experimental, Planned, Proposed.
- Link related documents rather than duplicating content.
- Use Mermaid only when it clarifies architecture or flow.

## Commits

See [Git Workflow](git-workflow.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md) for commit
conventions.

## Open Questions

- Which linter/formatter configuration is adopted for TS and Python?
- Is a shared schema/IDL used across the TS/Python boundary?

## Related Documents

- [Git Workflow](git-workflow.md)
- [Testing Strategy](testing-strategy.md)
- [Component Boundaries](../architecture/component-boundaries.md)
