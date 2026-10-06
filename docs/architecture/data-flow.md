# Data Flow

> Status: **Proposed.** No flow is implemented; these are intended flows.

## Problem

PROMETHEUS spans human evidence, agent execution, skill storage, and sandboxed evaluation. Clear
flows are needed so each component's inputs and outputs are unambiguous.

## Context

- Ingestion is read-only against public GitHub data.
- Benchmarking and validation are sandboxed.
- Skill discovery uses vector retrieval; validation uses benchmarking.

## Flow 1 — GitHub Ingestion

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Web as Web App
    participant API as Core API
    participant GH as GitHub REST/GraphQL
    participant AI as AI/ML Service
    participant DB as PostgreSQL

    Dev->>Web: Sign in with GitHub
    Web->>API: OAuth callback
    API->>GH: Exchange code / read profile
    GH-->>API: Access token + profile
    API->>GH: List public repositories
    GH-->>API: Repository metadata (paginated)
    API->>GH: Fetch languages, topics, commits, PRs, issues, reviews
    GH-->>API: Public evidence
    API->>AI: Extract features / derive signals
    AI-->>API: Structured engineering signals
    API->>DB: Persist developer engineering profile
    API-->>Web: Render profile
```

Notes: private repositories are **out of scope** for V1. Rate limits and pagination must be
handled explicitly (see [Repository Ingestion](../github/repository-ingestion.md)).

## Flow 2 — Agent Integration

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant API as Core API
    participant ADP as AgentAdapter
    participant Model as Model Provider

    Dev->>API: Register agent (model, tools, permissions)
    API->>API: Persist agent identity (stable)
    API->>ADP: Instantiate adapter for provider
    Dev->>API: Request task execution
    API->>ADP: executeTask(task)
    ADP->>Model: Provider-specific call
    Model-->>ADP: Result
    ADP-->>API: Normalized result + metadata
    API-->>Dev: Result
```

Agent identity remains stable if the underlying model changes (see
[Agent Model](../agents/agent-model.md)).

## Flow 3 — Benchmark Execution

```mermaid
sequenceDiagram
    autonumber
    participant API as Orchestration
    participant SBX as Docker Sandbox
    participant Agent as Agent (via Adapter)
    participant DB as PostgreSQL

    API->>SBX: Start isolated environment with broken repo
    API->>Agent: Provide task
    Agent-->>API: Patch / artifact
    API->>SBX: Apply patch, run tests
    SBX-->>API: Test results + metrics
    API->>DB: Record benchmark result
```

Metrics recorded: task success, tests passed, execution time, token usage, tool calls, errors,
recovery behaviour, and code quality where measurable (see
[Benchmark Execution](../benchmarks/benchmark-execution.md)).

## Flow 4 — Skill Discovery and Transfer

```mermaid
flowchart TB
    A["Agent self-assessment / benchmark"] --> B["Detect weak capability"]
    B --> C["Search skill registry"]
    C --> D["Retrieve candidate skills<br/>(pgvector similarity)"]
    D --> E["Security validation"]
    E --> F["Permission validation"]
    F --> G["Sandbox execution"]
    G --> H["Benchmark candidate skill"]
    H --> I{"Improvement beyond<br/>accepted threshold?"}
    I -- Yes --> J["Install skill"]
    I -- No --> K["Reject"]
    J --> L["Record result"]
    K --> L
    L --> M["Update agent capability profile"]

    classDef planned fill:#f5f5f5,stroke:#999,stroke-dasharray:4 2;
    class A,B,C,D,E,F,G,H,I,J,K,L,M planned;
```

Vector similarity determines *relevance*; benchmarking determines *improvement*. See
[Skill Discovery](../skills/skill-discovery.md) and [Skill Transfer](../skills/skill-transfer.md).

## Flow 5 — Skill Validation Pipeline

```mermaid
flowchart LR
    IN["Incoming skill"] --> S1["Schema validation"]
    S1 --> S2["Permission analysis"]
    S2 --> S3["Provenance / trust check"]
    S3 --> S4["Static / policy analysis"]
    S4 --> S5["Sandbox execution"]
    S5 --> S6["Benchmark"]
    S6 --> S7{"Install or reject/quarantine"}
    S7 -->|Install| OK["Registry: installed"]
    S7 -->|Reject| RQ["Quarantine"]

    classDef planned fill:#f5f5f5,stroke:#999,stroke-dasharray:4 2;
    class IN,S1,S2,S3,S4,S5,S6,S7,OK,RQ planned;
```

See [Skill Validation](../skills/skill-validation.md) and
[Security Architecture](security-architecture.md).

## Trade-offs

- Sequential validation is safer but slower; parallelizing independent checks requires care.
- Sandbox capture of full artifacts improves auditability at storage cost.

## Future Work

- Event-driven flows (queue-backed) via Redis.
- Incremental re-ingestion using GitHub webhooks.

## Related Documents

- [System Architecture](system-architecture.md)
- [Component Boundaries](component-boundaries.md)
- [Database Architecture](database-architecture.md)
