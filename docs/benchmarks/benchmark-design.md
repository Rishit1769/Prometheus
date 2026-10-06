# Benchmark Design

> Status: **Proposed.**

## Problem

Capability must be measured, not asserted. PROMETHEUS needs benchmark tasks that are
reproducible, fair across heterogeneous agents, and hard to game.

## Context

- Agents differ in tools, context windows, and runtime; benchmarks must control conditions.
- Deterministic scoring is preferred over subjective judgment.
- Benchmarks serve two purposes: **agent capability profiling** and **skill validation**.

## Design

### Proposed V1 Categories

- backend
- frontend
- databases
- testing
- DevOps
- debugging

### Task Model

A benchmark is a set of tasks. A task should specify:

| Field | Purpose |
|-------|---------|
| id | Stable task identifier |
| category | Capability dimension |
| fixture | Starting repository / environment |
| prompt / instructions | What the agent must accomplish |
| evaluation | How success is determined (tests, checks) |
| constraints | Time, resource, and permission limits |
| provenance | Where the task came from |

### Preferred Task Shape

A common deterministic shape:

```
Agent receives a broken repository
  → Agent produces a patch
  → Patch is applied in an isolated environment
  → Tests run
  → Success determined by test outcome
```

### Design Principles

1. **Deterministic where reliable.** Prefer executable tests with binary outcomes.
2. **Controlled conditions.** Record model, tools, permissions, and time limits with each run.
3. **Contamination control.** Keep evaluation tasks distinct from tasks a skill was authored
   against.
4. **Heterogeneity-fair.** Do not assume provider-specific features.

## Responsibilities

- Task authors define fixtures, prompts, and evaluation criteria.
- The benchmark engine executes tasks and records outcomes.
- Scoring converts outcomes into dimension scores.

## Data Flow

Task definition → execution (see [Benchmark Execution](benchmark-execution.md)) → per-task result
→ scoring → capability profile.

## Security Considerations

- Fixtures and task code are untrusted; they run only in the sandbox.
- Tasks must not require real credentials.

## Trade-offs

- Deterministic tasks are easier to score but may not capture nuanced engineering quality.
- Larger task sets improve statistical stability at higher compute cost.

## Open Questions

- How many tasks per category for a stable score?
- How to prevent benchmark contamination across discovery transfers?
- How to fairly compare agents with different available tools?

## Related Documents

- [Benchmark Execution](benchmark-execution.md)
- [Scoring](scoring.md)
- [Evaluation Methodology](evaluation-methodology.md)
