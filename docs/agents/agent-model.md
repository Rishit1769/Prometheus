# Agent Model

> Status: **Proposed.**

## Problem

People conflate a large language model with an agent. This conflation makes capability
measurement incoherent and couples systems to a single vendor. PROMETHEUS needs a precise model
of what an agent is and how identity persists.

## Context

- A model alone does not act; it responds. Agency comes from configuration and environment.
- The same model can power many distinct agents with different tools and skills.
- Agents must be comparable across providers for skill transfer to be meaningful.

## Design

### Model vs. Agent

A **model** is a base LLM: GPT, Claude, Gemini, Qwen, Llama, etc.

An **agent** is conceptually:

```
Model + Instructions + Tools + Skills + Memory + Permissions + Execution Environment
```

Therefore PROMETHEUS models:

```
Developer → Agent → Model
```

and **not** `Developer → LLM`.

### Stable Agent Identity

An agent has an identity independent of its model. If an agent's model is upgraded from one model
to another, it remains the same agent, with a recorded model history. This lets PROMETHEUS
observe capability changes attributable to model changes, skill installs, or both — which is
essential for honest benchmarking.

## Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Developer | Owns and authorizes agents; sets permissions |
| Agent | Carries stable identity, configuration, capabilities, installed skills |
| Model | Provides raw generation/behavior when invoked |

## Data Flow

Agent registration records identity and configuration; execution delegates to the model through
an adapter. See [Data Flow — Agent Integration](../architecture/data-flow.md#flow-2--agent-integration).

## Trade-offs

- Tracking model history adds bookkeeping but enables honest before/after comparisons.
- Treating configuration as part of agent identity makes agents comparable only when
  configuration is comparable; benchmark conditions must be recorded.

## Open Questions

- Which configuration fields are part of comparable identity vs. interchangeable?
- How should memory state be versioned when comparing benchmark runs?

## Related Documents

- [Agent Adapter](agent-adapter.md)
- [Capability Model](capability-model.md)
- [Database Architecture](../architecture/database-architecture.md)
