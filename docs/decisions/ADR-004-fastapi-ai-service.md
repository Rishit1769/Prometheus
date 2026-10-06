# ADR-004: FastAPI/Python for AI, ML, Benchmark, and Agent-Oriented Services

## Status

Proposed

## Context

PROMETHEUS needs code analysis (Tree-sitter, language-specific static analysis), embeddings, ML
models (PyTorch, scikit-learn, Transformers), and a benchmark harness. The core application is
planned in TypeScript/Next.js with Prisma. These AI/ML capabilities live predominantly in the
Python ecosystem, and forcing them into the TS core would be costly and brittle.

## Decision

Provide AI, ML, benchmark, and agent-oriented services as a separate Python service using FastAPI,
consumed by the core application over an explicit interface.

## Rationale

- Python hosts the strongest ecosystem for ML, embeddings, Transformers, and code analysis.
- FastAPI provides typed, async, well-documented APIs with low overhead.
- A clear service boundary keeps provider SDKs and ML dependencies out of the TS core, consistent
  with [Component Boundaries](../architecture/component-boundaries.md).
- Enables independent scaling of compute-heavy benchmark work later.

## Alternatives Considered

- **Implement everything in TypeScript/Node:** avoids a second language, but loses ML/code-analysis
  ecosystem strength and risks reimplementing mature tooling.
- **Python monolith for the whole backend:** would move the web/orchestration core out of the
  Next.js/TS ecosystem, conflicting with [ADR-002](ADR-002-prisma.md) and frontend plans.
- **Serverless ML functions:** reduced operational control and awkward for long-running sandboxed
  benchmarks.
- **Third-party ML service:** would couple core research to an external platform.

## Consequences

- Positive: best-of-breed tooling per concern; clean separation; independent scaling.
- Negative: cross-language boundary requires a versioned contract and serialization; more moving
  parts in local development.
- Neutral: the service exposes no user-facing endpoints; the TS core brokers all user interaction.

## Revisit Conditions

- If the boundary's overhead outweighs its benefits (e.g. nearly all logic ends up in Python).
- If a unified runtime becomes operationally preferable.
- If specific service latency requirements demand co-location.

## Related Documents

- [Component Boundaries](../architecture/component-boundaries.md)
- [Benchmark Execution](../benchmarks/benchmark-execution.md)
- [ADR-002 Prisma](ADR-002-prisma.md)
