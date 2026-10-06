# Commit Intelligence

> Status: **Future research — Proposed.** This is explicitly **not** V1 functionality. Do not
> treat any content here as implemented.

## Problem

Estimating the impact of a software contribution is hard and contextual. A single scalar "commit
quality" number would be misleading.

## Context

- PROMETHEUS may later include an ML system to evaluate contribution impact.
- This is future research and is **not** part of V1.
- Any ML estimate must be multidimensional and explainable.

## Design

### Multidimensional Estimation (Not a Single Score)

The system should **not** simply predict `"Commit quality = 87%"`. Instead it should eventually
estimate multiple dimensions:

- functional impact
- engineering complexity
- maintainability
- testing contribution
- documentation contribution
- reliability
- architectural impact
- security relevance

### Potential Features

- files changed
- lines added/deleted
- AST changes
- cyclomatic complexity change
- tests added/modified
- documentation changes
- dependency changes
- CI results
- PR context
- issue context
- review information
- semantic representation of the diff

## Responsibilities (Future)

- Feature extraction in the AI/ML service (Python).
- ML models (PyTorch, scikit-learn, Transformers as appropriate).
- Explainability so developers can understand estimates.

## Security Considerations

- Feature extraction runs on untrusted public content; it must not execute repository code.
- No private data in V1.

## Trade-offs

- Rich signals improve accuracy but increase complexity and data requirements.
- Explainability vs. predictive power is a central tension.

## Open Questions

- Is there a defensible ground-truth label for "impact"?
- How are confounding factors (project size, language) controlled?
- How is bias in public data surfaced rather than amplified?

## Related Documents

- [Developer Profile](developer-profile.md)
- [Research Questions](../research/research-questions.md)
- [Experiments](../research/experiments.md)
- [Evaluation Metrics](../research/evaluation-metrics.md)
