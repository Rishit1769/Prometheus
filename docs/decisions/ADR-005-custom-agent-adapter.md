# ADR-005: Custom Minimal AgentAdapter Abstraction

## Status

Proposed

## Context

PROMETHEUS must execute, measure, and exchange skills across heterogeneous agents built on
different models and frameworks (OpenAI, Anthropic/Claude, Gemini, Ollama/local, custom). The core
must not couple to any single provider, and it must not adopt a framework's particular model of
"agent", because that would constrain the research and the portability of skills. The project needs
a small, stable contract it fully controls.

## Decision

PROMETHEUS will own a custom, minimal `AgentAdapter` abstraction rather than building its core on a
large third-party agent framework. Provider-specific adapters implement the common contract.

## Rationale

- Preserves vendor independence and the ability to model `Developer → Agent → Model`.
- Keeps the contract minimal: execute task, report capabilities, run benchmark, offer/receive
  skills, communicate, report metadata.
- Avoids inheriting a third-party framework's assumptions about memory, tools, or agent identity,
  which could bias research and hinder cross-framework transfer.
- Keeps the trust and credential boundaries under PROMETHEUS's control.

## Alternatives Considered

- **Adopt a large agent framework (e.g. LangChain-style orchestration) as the core:** faster to
  start, but couples architecture, identity, and skill semantics to the framework and can impede
  heterogeneous research.
- **No abstraction, provider-specific code inline:** simplest short-term, but leaks vendor
  specifics into the core and defeats portability.
- **Adopt an emerging agent interoperability standard:** potentially valuable, but immature and
  may not fit PROMETHEUS's model; can be added later as an adapter.
- **Model-only abstraction ignoring tools/environment:** would conflate model and agent, violating
  a core principle.

## Consequences

- Positive: full control of the contract; clean vendor isolation; research independence.
- Negative: PROMETHEUS bears the cost of building and maintaining adapters and a conformance suite.
- Neutral: third-party frameworks can still be used inside a specific adapter without entering the
  core.

## Revisit Conditions

- If a mature, neutral agent interoperability standard emerges that fits PROMETHEUS's model.
- If maintaining adapters becomes disproportionate to their value.
- If the contract proves insufficient for real provider behaviours (streaming, multi-turn, tools).

## Related Documents

- [Agent Adapter](../agents/agent-adapter.md)
- [Agent Model](../agents/agent-model.md)
- [Component Boundaries](../architecture/component-boundaries.md)
