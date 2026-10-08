# Domain scoring

Scoring version: `domain-score-v1`.

For each repository/domain signal, V0 calculates:

`strength × confidence × complexityWeight`

Complexity weights are TRIVIAL `.25`, SIMPLE `.45`, MODERATE `.70`, COMPLEX `.90`, and ADVANCED
`1.0`. Repository contributions use diminishing returns:

`min(1, sum(contributions) / (1 + 0.5 × (repositorySignals - 1)))`

Thresholds are explicit and deterministic: `<.10` = 0 NO_EVIDENCE, `<.25` = 1 MINIMAL, `<.45` =
2 BASIC, `<.65` = 3 MODERATE, `<.82` = 4 STRONG, otherwise 5 EXTENSIVE. Strength and confidence
remain separate. Evidence references are retained so a UI can explain a domain conclusion.

This is a documented evidence score, not a measure of intrinsic ability or a universal quality
rating.
