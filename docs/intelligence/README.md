# Developer Intelligence V0

PROM-004 converts stored public repository and README evidence into a traceable capability vector.
It does not claim that README quality proves developer quality, authorship, seniority, or production
reliability.

## Pipeline

`Repository evidence → repository model analysis → validated repository intelligence → deterministic aggregation → developer intelligence`

Each repository is analyzed independently. The developer profile is then calculated from validated
repository signals; the model does not assign the final developer levels.

The persisted developer output uses schema version `developer-intelligence-output-v3`. Profiles
from older output schemas are marked legacy, and are rebuilt from validated repository-analysis
records before being presented with repository-level attribution.

See [Repository Analysis](repository-analysis.md), [Developer Intelligence](developer-intelligence.md),
and [Domain Scoring](domain-scoring.md).
