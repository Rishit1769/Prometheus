# System Architecture

> Status: **Proposed.**

## Problem

PROMETHEUS must connect human identity and public evidence, heterogeneous AI agents, a shared
skill registry, and a benchmark/validation engine — without coupling the core to any single model
vendor and without trusting untrusted skills.

## Context

- Agents differ in model, tools, memory, and runtime; the core must be provider-agnostic.
- Skills are untrusted and must be validated, not assumed safe.
- Evaluation must be reproducible and, where possible, deterministic.
- The system is research-oriented; V1 must remain small and verifiable.

## Design

PROMETHEUS separates five concerns: **identity & evidence**, **agent interoperability**,
**skills**, **benchmarking & validation**, and **discovery, transfer & evolution**.

```mermaid
flowchart TB
    subgraph Client["Client"]
        WEB["Web App<br/>Next.js + TypeScript + Tailwind + shadcn/ui"]
    end

    subgraph Backend["Backend (planned)"]
        API["Core API<br/>Prisma ORM"]
        ORCH["Orchestration<br/>skill/benchmark workflows"]
        REG["Skill Registry"]
    end

    subgraph Data["Data (planned)"]
        DB[("PostgreSQL + pgvector")]
        CACHE[("Redis")]
        STORE[("MinIO<br/>artifacts: diffs, logs, packages")]
    end

    subgraph AIService["AI / ML Service (planned)"]
        FA["FastAPI + Python<br/>embeddings, code analysis,<br/>benchmark harness, ML"]
    end

    subgraph Runtime["Execution (planned)"]
        SBX["Docker Sandbox<br/>untrusted execution"]
    end

    subgraph Agents["Heterogeneous Agents"]
        A1["Agent A"]
        A2["Agent B"]
        A3["Custom Agent"]
    end

    subgraph Providers["Model Providers"]
        P1["OpenAI"]
        P2["Anthropic"]
        P3["Gemini"]
        P4["Ollama / local"]
    end

    GH["GitHub REST + GraphQL"]

    WEB --> API
    API --> DB
    API --> CACHE
    API --> STORE
    API --> ORCH
    ORCH --> REG
    ORCH --> FA
    ORCH --> SBX
    FA --> DB
    FA --> P1 & P2 & P3 & P4
    A1 & A2 & A3 --> ORCH
    API --> GH
    SBX --> STORE

    classDef planned fill:#f5f5f5,stroke:#999,stroke-dasharray:4 2;
    class WEB,API,ORCH,REG,DB,CACHE,STORE,FA,SBX,A1,A2,A3,P1,P2,P3,P4,GH planned;
```

All backend and runtime components are **planned**; dashed styling indicates not implemented.

## Responsibilities

| Component | Owns | Does not own |
|-----------|------|--------------|
| Web App | User interface, auth session, visualizations | Business rules, benchmark logic |
| Core API | Entities, persistence, orchestration entry points | Model-specific execution |
| Orchestration | Skill/benchmark workflows, validation pipeline | Provider SDK specifics |
| Skill Registry | Skill storage, versioning, lineage metadata | Skill execution |
| AI/ML Service | Embeddings, code analysis, benchmark harness, ML models | User-facing API |
| Docker Sandbox | Isolated untrusted execution | Trust decisions |
| AgentAdapter layer | Model/provider-specific execution behind a common contract | Core domain logic |

## Data Flow (Summary)

See [Data Flow](data-flow.md) for full diagrams. The canonical V1 flow:

```
Developer → GitHub Auth → Public Repo Analysis → Developer Profile
→ Agent Integration → Agent Benchmarking → Agent Capability Profile
→ Skill Registry → Skill Discovery → Skill Validation → Skill Transfer
→ Re-Benchmark → Measurable Capability Improvement
```

## Security Considerations

- Skill packages and benchmark tasks are **untrusted**; execution occurs in a Docker sandbox
  ([ADR-006](../decisions/ADR-006-docker-sandbox.md)).
- GitHub credentials are never exposed to autonomous agents.
- Provider API keys are server-side only (see [.env.example](../../.env.example)).
- Skills declare permissions explicitly; dangerous capabilities are not silently granted.

See [Security Architecture](security-architecture.md).

## Trade-offs

- A custom `AgentAdapter` adds maintenance cost but preserves vendor independence.
- Sandboxing adds latency and infrastructure cost but is required for safe skill exchange.
- Keeping the core in TypeScript/Prisma and Python in a separate service adds a boundary but lets
  each side use its strongest ecosystem.

## Future Work

- Distributed benchmark workers.
- Stronger provenance/trust scoring.
- Sandbox hardening and capability-based permission enforcement.

## Related Documents

- [Component Boundaries](component-boundaries.md)
- [Data Flow](data-flow.md)
- [Database Architecture](database-architecture.md)
- [Security Architecture](security-architecture.md)
