# Scoring

> Status: **Proposed.** No scoring is implemented. Thresholds and formulas below are illustrative,
> not finalized.

## Problem

Raw task outcomes must become comparable capability scores. Scoring must be transparent enough
that a reader can understand what a number means — and what it does not.

## Context

- Deterministic tasks yield binary or countable outcomes.
- Some quality aspects are only weakly measurable and may need supplementary judgment.
- Scores feed agent capability profiles and skill validation decisions.

## Design

### From Tasks to Dimensions

```
TaskResult (per task) → category aggregation → dimension score → capability profile
```

Per-task scoring should prefer deterministic signals: tests passed, assertions satisfied, lint
results. Where deterministic evaluation is unreliable, LLM-as-judge may **supplement** but not
**replace** it, and any judged component must be labelled.

### Comparison for Skill Validation

For a skill `s` applied to agent `a`:

```
baseline   = score(a, benchmark)
candidate  = score(a, benchmark | skill s installed)
improvement = candidate − baseline
```

Install if `improvement` exceeds the accepted threshold; otherwise reject. See
[Evaluation Methodology](evaluation-methodology.md).

### Illustrative Aggregation

| Level | Description |
|-------|-------------|
| Task | Pass/fail or partial score with recorded evidence |
| Category | Aggregate of tasks in the category |
| Profile | Vector of category scores with provenance |

> Aggregation method (mean, weighted, capped) is **not finalized**.

## Responsibilities

- Scoring module converts task results into category and profile scores.
- Validation compares baseline and candidate scores under matched conditions.
- Records include methodology version so scores remain interpretable.

## Data Flow

Task results → scoring → capability profile / validation decision → persistence.

## Security Considerations

- Judged scores must be stored as such, not presented as deterministic.
- Scoring configuration is versioned to preserve reproducibility.

## Trade-offs

- Simple aggregation is interpretable but may hide variance.
- Weighted or learned aggregation is expressive but less transparent and can be gamed.

## Open Questions

- What aggregation is defensible and explainable?
- How is partial credit assigned?
- Should scores be normalized per task difficulty?
- How is statistical noise reported alongside point estimates?

## Related Documents

- [Capability Model](../agents/capability-model.md)
- [Evaluation Methodology](evaluation-methodology.md)
- [Evaluation Metrics](../research/evaluation-metrics.md)
