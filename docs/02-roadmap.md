# Roadmap

> Status: **Active.** Milestones are targets, not commitments, but v0.1–v0.3 have begun to land.
> The root [ROADMAP.md](../ROADMAP.md) provides the condensed view.

Milestone identifiers also map to the project's issue codes: **PROM-001** = v0.2 (Foundation +
GitHub OAuth) and **PROM-002** = v0.3 (Public Repository Ingestion).

Each milestone lists its outcome, the documents it will affect, and its exit criteria. A
milestone is complete when code, tests, and documentation all exist (see
[Definition of Done](../CONTRIBUTING.md#definition-of-done)).

## v0.1 — Foundation + Documentation

- **Outcome:** Repository structure, documentation system, conventions, and CI scaffolding.
- **Status:** In Development.
- **Exit criteria:** `docs/` portal complete; conventions documented; CI runs on PRs.
- **Docs:** entire `docs/` tree.

## v0.2 — GitHub Authentication

- **Outcome:** A developer can authenticate via GitHub OAuth.
- **Status:** Implemented (PROM-001).
- **Exit criteria:** Secure OAuth flow, session handling, no token leakage to agents.
- **Docs:** [github/authentication.md](github/authentication.md), [ADR-001](decisions/ADR-001-postgresql.md).

## v0.3 — Public Repository Ingestion

- **Outcome:** Ingest public repository metadata, languages, and topics; idempotent sync.
- **Status:** Implemented (PROM-002). See
  [github/repository-ingestion.md](github/repository-ingestion.md).
- **Exit criteria:** Paginated REST ingestion with rate-limit handling and idempotency — met.
- **Docs:** [github/repository-ingestion.md](github/repository-ingestion.md), [architecture/data-flow.md](architecture/data-flow.md), [ADR-007](decisions/ADR-007-github-repository-evidence.md).

## v0.4 — Developer Engineering Profile

- **Outcome:** A multidimensional, evidence-based developer profile.
- **Exit criteria:** Documented scoring approach; explicit caveats that it is not absolute quality.
- **Docs:** [github/developer-profile.md](github/developer-profile.md), [github/commit-intelligence.md](github/commit-intelligence.md).

## v0.5 — AgentAdapter + First Model Integration

- **Outcome:** Register an agent and execute a task through a provider adapter.
- **Exit criteria:** At least one provider adapter plus a test double; stable agent identity.
- **Docs:** [agents/agent-adapter.md](agents/agent-adapter.md), [ADR-005](decisions/ADR-005-custom-agent-adapter.md).

## v0.6 — Benchmark Engine

- **Outcome:** Deterministic, sandboxed task evaluation.
- **Exit criteria:** Docker-isolated execution; reproducible scores; recorded metrics.
- **Docs:** [benchmarks/benchmark-execution.md](benchmarks/benchmark-execution.md), [ADR-006](decisions/ADR-006-docker-sandbox.md).

## v0.7 — Agent Capability Profiles

- **Outcome:** Capability vectors derived from benchmark results.
- **Exit criteria:** Per-category capability scores with documented methodology.
- **Docs:** [agents/capability-model.md](agents/capability-model.md), [benchmarks/scoring.md](benchmarks/scoring.md).

## v0.8 — Skill Specification + Registry

- **Outcome:** Publish, version, and store skills.
- **Exit criteria:** Stable skill package format; registry CRUD; versioning.
- **Docs:** [skills/skill-specification.md](skills/skill-specification.md), [skills/skill-registry.md](skills/skill-registry.md).

## v0.9 — Skill Discovery + Validation

- **Outcome:** pgvector retrieval and sandboxed validation of candidate skills.
- **Exit criteria:** Relevance-based retrieval; validation decision recorded; security pipeline enforced.
- **Docs:** [skills/skill-discovery.md](skills/skill-discovery.md), [skills/skill-validation.md](skills/skill-validation.md), [ADR-003](decisions/ADR-003-pgvector.md).

## v0.10 — Cross-Agent Skill Transfer

- **Outcome:** One working heterogeneous transfer with before/after benchmark.
- **Exit criteria:** Measurable improvement over baseline; result recorded.
- **Docs:** [skills/skill-transfer.md](skills/skill-transfer.md).

## v0.11 — Skill Lineage + Network Visualization

- **Outcome:** Version/ancestry tracking and a basic agent/skill network view.
- **Exit criteria:** Lineage metadata rendered; network view of agents and skills.
- **Docs:** [skills/skill-lineage.md](skills/skill-lineage.md).

## v1.0 — End-to-End Proof of Concept

- **Outcome:** Reproducible demonstration of the full V1 pipeline.
- **Exit criteria:** All [V1 success criteria](01-v1-scope.md#4-success-criteria) satisfied and
  reproducible from documentation alone.

## Sequencing Rationale

Identity and evidence precede agents because they establish ownership and trust. Agents precede
benchmarks because capability is measured on agents. Skills precede discovery because there must
be something to discover. Validation precedes transfer because untrusted skills must never be
installed. Lineage follows transfer because ancestry only matters once skills evolve.

## Related Documents

- [V1 Scope](01-v1-scope.md)
- [Architecture Decisions](decisions/README.md)
- [Research Experiments](research/experiments.md)
