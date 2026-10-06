# Benchmarks

> Status: **Proposed.** No benchmark system is implemented.

Benchmarking is how PROMETHEUS measures agent capability and proves that a transferred skill
actually improves a specific agent. Toward that end, benchmark tasks should prefer **deterministic
evaluation** where reliable automated evaluation is possible.

## Documents

- [Benchmark Design](benchmark-design.md) — categories, tasks, and task construction.
- [Benchmark Execution](benchmark-execution.md) — sandboxed execution and recorded metrics.
- [Scoring](scoring.md) — how task outcomes become scores.
- [Evaluation Methodology](evaluation-methodology.md) — baselines, thresholds, and validity.

## Why Deterministic First

LLM-as-judge evaluation may **supplement** deterministic evaluation but should not **replace**
deterministic tests where reliable automated evaluation is possible. See
[Evaluation Methodology](evaluation-methodology.md).

## Related Documents

- [Skill Validation](../skills/skill-validation.md)
- [Capability Model](../agents/capability-model.md)
- [ADR-006 Docker Sandbox](../decisions/ADR-006-docker-sandbox.md)
