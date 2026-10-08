# PROMETHEUS Roadmap

> Status: **Active.** The repository now contains a working web/database foundation and GitHub
> authentication and public-repository ingestion. This roadmap may be adjusted as implementation
> proceeds and as repository state changes. The detailed phase descriptions live in
> [docs/02-roadmap.md](docs/02-roadmap.md).

## Milestones

| Version | Milestone | Core outcome | Status |
|---------|-----------|--------------|--------|
| v0.1 | Foundation + documentation | Repository structure, docs system, conventions | In Development |
| v0.2 | GitHub authentication | Developer signs in via GitHub OAuth | Implemented |
| v0.3 | Public repository ingestion | Ingest public repo metadata and languages | Implemented |
| v0.35 | README evidence ingestion | Bounded, hashable README evidence for stored public repositories | Implemented |
| v0.4 | Developer engineering profile | Multidimensional evidence-backed capability vector | Implemented (PROM-004) |
| v0.5 | AgentAdapter + first model integration | Register an agent and abstract its model | Planned |
| v0.6 | Benchmark engine | Deterministic sandboxed task evaluation | Planned |
| v0.7 | Agent capability profiles | Capability vectors from benchmark results | Planned |
| v0.8 | Skill specification + registry | Publish, version, and store skills | Planned |
| v0.9 | Skill discovery + validation | pgvector retrieval + sandbox validation | Planned |
| v0.10 | Cross-agent skill transfer | One working heterogeneous transfer | Planned |
| v0.11 | Skill lineage + network visualization | Versioning, ancestry, network view | Planned |
| v1.0 | End-to-end proof of concept | Measurable before/after improvement | Planned |

## Guiding Constraints

- Keep V1 strict: no virtual worlds, marketplaces, blockchain, or large-scale simulation.
- Every milestone must be independently verifiable by tests, not just by demonstration.
- Documentation is updated in the same pull request as the feature (see
  [CONTRIBUTING.md](CONTRIBUTING.md)).
- Distinguish **Implemented**, **In Development**, **Experimental**, **Planned**, and
  **Proposed** at all times.

See [docs/01-v1-scope.md](docs/01-v1-scope.md) for the V1 in/out scope.
