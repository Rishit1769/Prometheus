# GitHub

> Status: **Authentication, public repository ingestion, and README evidence implemented
> (PROM-001, PROM-002, PROM-003).**
> Commit ingestion, developer profiling, and commit intelligence remain planned.

GitHub provides V1's evidence source for **human** engineering capability. It does **not**
measure agent capability — that is measured by benchmarks. See
[GitHub Evidence ≠ Agent Capability](../00-project-overview.md#66-github-evidence--agent-capability).

## Documents

- [Authentication](authentication.md) — GitHub OAuth and token handling.
- [Repository Ingestion](repository-ingestion.md) — public repository analysis.
- [README Evidence](readme-evidence.md) — bounded, hashable README source evidence.
- [Developer Profile](developer-profile.md) — evidence-based engineering profile.
- [Commit Intelligence](commit-intelligence.md) — future ML analysis of contribution impact.

## Scope

- In scope: GitHub authentication and **public** repository analysis.
- Out of scope for V1: private repository analysis and autonomous modification of user
  repositories.

## Related Documents

- [Data Flow — GitHub Ingestion](../architecture/data-flow.md#flow-1--github-ingestion)
- [V1 Scope](../01-v1-scope.md)
- [Security Architecture](../architecture/security-architecture.md)
