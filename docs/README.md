# PROMETHEUS Documentation

Central portal for PROMETHEUS documentation. Start here, then follow the category that matches
your goal. If you are new, read [00-project-overview.md](00-project-overview.md) first.

> **Repository state:** documentation only. No application features are implemented. Every
> component is **Planned** or **Proposed** unless explicitly labelled **Implemented**.

## How to Read These Docs

Status labels used throughout:

- **Implemented** — exists in the repository and verified.
- **In Development** — actively being built.
- **Experimental** — exists but unstable or unvalidated.
- **Planned** — committed to a roadmap milestone, not started.
- **Proposed** — under discussion, not yet committed.

## Project

- [Project Overview](00-project-overview.md) — what PROMETHEUS is, why it exists, terminology.
- [V1 Scope](01-v1-scope.md) — authoritative in-scope / out-of-scope list.
- [Roadmap](02-roadmap.md) — phased milestones from v0.1 to v1.0.

## Architecture

- [Architecture Index](architecture/README.md)
- [System Architecture](architecture/system-architecture.md)
- [Component Boundaries](architecture/component-boundaries.md)
- [Data Flow](architecture/data-flow.md)
- [Database Architecture](architecture/database-architecture.md)
- [Security Architecture](architecture/security-architecture.md)

## Agents

- [Agents Index](agents/README.md)
- [Agent Model](agents/agent-model.md) — model vs. agent, stable identity.
- [Agent Adapter](agents/agent-adapter.md) — provider-agnostic interface.
- [Capability Model](agents/capability-model.md) — how agent capability is represented.
- [Autonomy and Permissions](agents/autonomy-and-permissions.md) — human control model.

## Skills

- [Skills Index](skills/README.md)
- [Skill Specification](skills/skill-specification.md)
- [Skill Registry](skills/skill-registry.md)
- [Skill Discovery](skills/skill-discovery.md)
- [Skill Transfer](skills/skill-transfer.md)
- [Skill Validation](skills/skill-validation.md)
- [Skill Lineage](skills/skill-lineage.md)

## Benchmarks

- [Benchmarks Index](benchmarks/README.md)
- [Benchmark Design](benchmarks/benchmark-design.md)
- [Benchmark Execution](benchmarks/benchmark-execution.md)
- [Scoring](benchmarks/scoring.md)
- [Evaluation Methodology](benchmarks/evaluation-methodology.md)

## GitHub

- [GitHub Index](github/README.md)
- [Authentication](github/authentication.md)
- [Repository Ingestion](github/repository-ingestion.md)
- [Developer Profile](github/developer-profile.md)
- [Commit Intelligence](github/commit-intelligence.md)

## Research

- [Research Index](research/README.md)
- [Research Questions](research/research-questions.md)
- [Hypotheses](research/hypotheses.md)
- [Experiments](research/experiments.md)
- [Evaluation Metrics](research/evaluation-metrics.md)
- [Research Log](research/RESEARCH_LOG.md)

## Development

- [Development Index](development/README.md)
- [Local Development](development/local-development.md)
- [Environment Variables](development/environment-variables.md)
- [Coding Standards](development/coding-standards.md)
- [Git Workflow](development/git-workflow.md)
- [Testing Strategy](development/testing-strategy.md)
- [Release Process](development/release-process.md)

## Architecture Decisions

- [Decisions Index](decisions/README.md)
- [ADR-001: PostgreSQL](decisions/ADR-001-postgresql.md)
- [ADR-002: Prisma](decisions/ADR-002-prisma.md)
- [ADR-003: pgvector](decisions/ADR-003-pgvector.md)
- [ADR-004: FastAPI AI Service](decisions/ADR-004-fastapi-ai-service.md)
- [ADR-005: Custom Agent Adapter](decisions/ADR-005-custom-agent-adapter.md)
- [ADR-006: Docker Sandbox](decisions/ADR-006-docker-sandbox.md)
- [ADR-007: GitHub Repository Evidence](decisions/ADR-007-github-repository-evidence.md)

## Related Root Documents

- [README](../README.md)
- [ARCHITECTURE](../ARCHITECTURE.md)
- [ROADMAP](../ROADMAP.md)
- [CONTRIBUTING](../CONTRIBUTING.md)
- [SECURITY](../SECURITY.md)
- [CHANGELOG](../CHANGELOG.md)
