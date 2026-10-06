# Hypotheses

> Status: **Proposed.** Hypotheses are stated to be falsifiable; none have been tested.

Each hypothesis names the research question it addresses and the outcome that would falsify it.
See [Research Questions](research-questions.md).

## H1 — Cross-Model Skill Transfer Produces Measurable Improvement

- **Addresses:** RQ1
- **Statement:** A skill validated for Agent A measurably improves a heterogeneous Agent B on
  unseen tasks, beyond measurement noise.
- **Falsified if:** No statistically meaningful improvement over baseline is observed across
  repeats.

## H2 — Benchmark Validation Beats Similarity-Only Selection

- **Addresses:** RQ2
- **Statement:** Selecting candidate skills via benchmark-based validation yields better
  improvement than selecting by vector similarity alone.
- **Falsified if:** Similarity-only selection performs comparably.

## H3 — Skill Composition Exceeds Component Skills

- **Addresses:** RQ3
- **Statement:** Composing two compatible skills yields capability greater than either skill
  installed alone.
- **Falsified if:** Composition provides no additional improvement or degrades performance.

## H4 — Capability Propagates Through Lineage with Degradation

- **Addresses:** RQ4
- **Statement:** Derived skill versions retain measurable capability but exhibit some degradation
  across generations.
- **Falsified if:** Either no capability transfers at all, or no degradation occurs.

## H5 — Capability Measurements Are Reproducible

- **Addresses:** RQ5
- **Statement:** Agent capability measurements are stable across repeated runs under matched
  conditions.
- **Falsified if:** Variance across repeats is large relative to measured differences.

## H6 — Decentralized Exchange Improves the Network

- **Addresses:** RQ6
- **Statement:** Skill sharing across a population of agents raises aggregate capability over
  time.
- **Falsified if:** Aggregate capability does not improve or regresses.

## Related Documents

- [Research Questions](research-questions.md)
- [Experiments](experiments.md)
- [Evaluation Metrics](evaluation-metrics.md)
