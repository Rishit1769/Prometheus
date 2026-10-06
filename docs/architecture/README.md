# Architecture

> Status: **Proposed.** No architecture here is implemented. These documents describe the
> intended V1 architecture.

This section decomposes PROMETHEUS into components and describes how they interact.

## Documents

- [System Architecture](system-architecture.md) — overall structure and major components.
- [Component Boundaries](component-boundaries.md) — responsibilities and ownership per component.
- [Data Flow](data-flow.md) — end-to-end flows (GitHub ingestion, benchmarking, transfer).
- [Database Architecture](database-architecture.md) — proposed entity relationships.
- [Security Architecture](security-architecture.md) — trust boundaries and validation pipeline.

## Design Method

Every architectural document follows a consistent structure where appropriate:

- **Problem** — what forces a design decision.
- **Context** — constraints and assumptions.
- **Design** — the proposed structure.
- **Responsibilities** — what each part owns.
- **Data Flow** — how information moves.
- **Security Considerations** — trust boundaries.
- **Trade-offs** — what is gained and lost.
- **Future Work** — what is deferred.

## Core Principle

The architecture must keep the core decoupled from any single model vendor and from the
particulars of any single agent. This is why PROMETHEUS plans a custom `AgentAdapter`
abstraction rather than building on a large third-party agent framework — see
[ADR-005](../decisions/ADR-005-custom-agent-adapter.md).

## Related Documents

- [Project Overview](../00-project-overview.md)
- [Architecture Decisions](../decisions/README.md)
- [Root ARCHITECTURE.md](../../ARCHITECTURE.md)
