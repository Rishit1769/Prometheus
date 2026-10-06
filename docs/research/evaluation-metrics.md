# Evaluation Metrics

> Status: **Proposed.** No metrics have been collected. Definitions here are proposals.

## Purpose

Define the metrics used to evaluate PROMETHEUS experiments, especially cross-agent skill transfer.

## Metric Categories

### Capability Metrics

| Metric | Definition | Notes |
|--------|-----------|-------|
| Task success rate | Fraction of tasks evaluated as successful | Deterministic where possible |
| Tests passed | Fraction/count of tests passing | Preferred signal |
| Category score | Aggregated per capability dimension | Method open (see [Scoring](../benchmarks/scoring.md)) |
| Capability delta | Post-transfer − baseline | Core V1 proof metric |

### Efficiency Metrics

| Metric | Definition |
|--------|-----------|
| Execution time | Wall-clock time per task |
| Token usage | Tokens consumed |
| Tool calls | Number of tool invocations |

### Process Metrics

| Metric | Definition |
|--------|-----------|
| Error rate | Errors encountered per task |
| Recovery rate | Fraction of recoverable failures recovered |

### Transfer-Specific Metrics

| Metric | Definition |
|--------|-----------|
| Improvement (pp) | Percentage-point change in capability |
| Relative improvement | Improvement divided by baseline |
| Transfer success | Whether improvement exceeds threshold |
| Decay | Capability retained along lineage |

## Reporting Requirements

- Report distributions, not just point estimates, given agent stochasticity.
- State the number of repetitions and confidence intervals where applicable.
- Reference the methodology version.
- Clearly label judged components separately from deterministic ones.

## Related Documents

- [Scoring](../benchmarks/scoring.md)
- [Evaluation Methodology](../benchmarks/evaluation-methodology.md)
- [Experiments](experiments.md)
- [Capability Model](../agents/capability-model.md)
