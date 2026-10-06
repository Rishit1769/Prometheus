# Evaluation Methodology

> Status: **Proposed.** No evaluation has been performed. No performance numbers in this
> document are real; any figures elsewhere are illustrative examples, not results.

## Problem

To make credible claims, PROMETHEUS must specify how capability is measured, how improvement is
established, and what threatens validity. The central claim — that a transferred skill improves a
receiving agent — is only meaningful with controlled, honest methodology.

## Context

- Agents are stochastic; repeated runs and variance must be considered.
- Benchmark contamination can inflate results.
- Heterogeneous agents differ in ways that can confound comparison.

## Design

### Baselines

Every comparison requires a baseline measured under matched conditions:

- same benchmark version,
- same task set,
- same agent configuration (except the skill),
- same sandbox resources and time limits.

### Improvement Threshold

A candidate skill is installed only if improvement exceeds an accepted threshold. The threshold
must be documented and justified; it should account for measurement noise, not just a raw delta.

> The concrete threshold is an **open question** (see below). The V1 proof is that improvement is
> measurable and exceeds noise, not any particular number.

### Determinism and Judgment

- Prefer deterministic evaluation (executable tests).
- LLM-as-judge may supplement but not replace deterministic evaluation.
- Any judged component must be labelled and its prompt/rubric versioned.

### Contamination Control

- Evaluation tasks must be distinct from tasks used to author or tune a skill.
- Re-benchmark on **unseen** tasks to support transfer claims.

### Threats to Validity

| Threat | Mitigation |
|--------|-----------|
| Stochastic variance | Repeat runs; report distribution |
| Benchmark contamination | Hold out unseen tasks |
| Confounding (tools/permissions differ) | Record and match conditions |
| Judge bias | Prefer deterministic tests; version rubrics |
| Selection bias | Define task sets before seeing results |

## Responsibilities

- Methodology is versioned; results reference the version used.
- All claims record task set, agent configuration, and run count.

## Trade-offs

- More repetitions improve confidence but cost compute.
- Strict holdout improves honesty but requires more tasks.

## Open Questions

- What threshold and confidence level are acceptable for V1?
- How many repetitions per condition?
- How to report variance alongside a capability point estimate?
- How to keep a global benchmark from becoming contaminated over time?

## Related Documents

- [Scoring](scoring.md)
- [Benchmark Design](benchmark-design.md)
- [Evaluation Metrics](../research/evaluation-metrics.md)
- [Experiments](../research/experiments.md)
