# Experiments

> Status: **Proposed.** No experiments have been run. Templates below contain placeholders only.
> Do not fill in results that have not actually been produced.

## Purpose

Experiments are how PROMETHEUS hypotheses are tested. Every experiment must follow the standard
format so results are comparable and reproducible.

## Standard Experiment Format

Each experiment documents:

- research question
- hypothesis
- setup
- models
- benchmark
- independent variables
- dependent variables
- controls
- dataset / tasks
- procedure
- results
- statistical analysis
- limitations
- conclusion

## Experiment IDs

Experiments use IDs of the form `EXP-NNN-short-name`:

| ID | Name | Addresses | Status |
|----|------|-----------|--------|
| `EXP-001-cross-model-transfer` | Cross-model skill transfer | H1, RQ1 | Not started |
| `EXP-002-skill-composition` | Skill composition | H3, RQ3 | Not started |
| `EXP-003-skill-evolution` | Skill evolution across generations | H4, RQ4 | Not started |
| `EXP-004-network-propagation` | Network-level capability propagation | H6, RQ6 | Not started |

## Template

```
# EXP-NNN: <name>

## Research Question
<which RQ>

## Hypothesis
<which hypothesis>

## Setup
<environment, code versions, methodology version>

## Models
<which models/providers, which agents>

## Benchmark
<benchmark version, categories, task source>

## Independent Variables
<what is varied>

## Dependent Variables
<what is measured>

## Controls
<what is held constant>

## Dataset / Tasks
<task set, sizes, holdout>

## Procedure
<steps>

## Results
<PLACEHOLDER — not yet measured>

## Statistical Analysis
<PLACEHOLDER>

## Limitations
<threats to validity>

## Conclusion
<PLACEHOLDER — only after results exist>
```

## Rules

1. Never fabricate results. Use `PLACEHOLDER` until data exists.
2. Reference the evaluation methodology version used.
3. Record controls and matched conditions.
4. Report limitations and threats to validity.
5. Log activity in [RESEARCH_LOG.md](RESEARCH_LOG.md).

## Related Documents

- [Hypotheses](hypotheses.md)
- [Evaluation Metrics](evaluation-metrics.md)
- [Evaluation Methodology](../benchmarks/evaluation-methodology.md)
- [Research Log](RESEARCH_LOG.md)
