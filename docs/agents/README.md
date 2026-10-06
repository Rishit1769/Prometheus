# Agents

> Status: **Proposed.** No agent functionality is implemented.

PROMETHEUS models **agents**, not just models. An agent is a configured system built around a
model, and agent identity must remain stable even when the underlying model changes. This section
defines the agent model, the provider-agnostic adapter contract, how capability is represented,
and how human owners retain control.

## Documents

- [Agent Model](agent-model.md) — model vs. agent; stable identity.
- [Agent Adapter](agent-adapter.md) — the provider-agnostic interface.
- [Capability Model](capability-model.md) — how agent capability is measured and represented.
- [Autonomy and Permissions](autonomy-and-permissions.md) — human control over agent actions.

## Why This Matters

If PROMETHEUS coupled itself to a single LLM provider, skill transfer across heterogeneous
agents would be impossible. Separating **model** from **agent** and abstracting execution behind
an `AgentAdapter` is what makes cross-model skill transfer feasible. See
[ADR-005](../decisions/ADR-005-custom-agent-adapter.md).

## Related Documents

- [Project Overview](../00-project-overview.md)
- [System Architecture](../architecture/system-architecture.md)
- [Skill Transfer](../skills/skill-transfer.md)
