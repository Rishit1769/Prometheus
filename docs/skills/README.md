# Skills

> Status: **Proposed.** No skill functionality is implemented.

A PROMETHEUS **skill** is a portable capability package — **not** model weights. Skills are the
core unit of exchange: they can be discovered, validated, transferred, versioned, composed, and
traced through lineage.

## Documents

- [Skill Specification](skill-specification.md) — proposed package structure.
- [Skill Registry](skill-registry.md) — storage, publishing, versioning.
- [Skill Discovery](skill-discovery.md) — relevance-based retrieval (pgvector).
- [Skill Transfer](skill-transfer.md) — moving a skill to another agent.
- [Skill Validation](skill-validation.md) — proving a skill improves a specific agent.
- [Skill Lineage](skill-lineage.md) — ancestry and evolution.

## Core Distinction

Vector similarity answers *"which skills appear relevant?"* Benchmarking answers *"which relevant
skill actually improves this agent?"* These are separate concerns and must not be conflated. See
[Skill Discovery](skill-discovery.md) and [Skill Validation](skill-validation.md).

## Related Documents

- [Agent Adapter](../agents/agent-adapter.md)
- [Security Architecture](../architecture/security-architecture.md)
- [Benchmark Design](../benchmarks/benchmark-design.md)
