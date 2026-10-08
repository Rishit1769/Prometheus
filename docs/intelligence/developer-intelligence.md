# Developer intelligence

The developer profile is user-owned and exposed through:

- `POST /api/developer/analyze`
- `GET /api/developer/intelligence`
- `GET /api/developer/intelligence/:repositoryId`

The analyze route derives the user from the server session. It never trusts a client-supplied
`userId`. Repository work is bounded to three in-process model requests at a time. Partial
repository failures do not erase successful analyses; coverage reports eligible, analyzed, reused,
and failed repositories.

If every eligible repository fails validation or provider execution, the API returns a sanitized
502 diagnostic (stage, provider HTTP status when present, error code, validation paths, and failed
count), and does not retain a zero-coverage developer profile. A previous legacy zero-coverage
profile is removed on such a run. If no repositories are eligible, the endpoint returns `EMPTY`
without caching a profile. Partial profiles remain valid only when coverage is greater than zero.

Developer cache identity includes the complete eligible repository set, each current evidence hash,
the analysis state (`COMPLETE` or `FAILED`), model/provider identity, prompt version, and scoring
version. Consequently a partial profile is recalculated when failed repositories later succeed or
when eligibility changes. Same-user concurrent requests share one in-process analysis promise;
multi-instance job coordination is intentionally outside V0.

The profile contains eight domains: FRONTEND, BACKEND, DATABASE, AI_ML, DEVOPS, TESTING, SYSTEMS,
and MOBILE. Level 0 means insufficient evidence, not poor ability. There is intentionally no
universal developer score.

Each domain retains explainability details derived from validated repository analyses: supporting
repository IDs and names, detected technologies with evidence, source reference types, concise
repository explanations, evidence scores, confidence, and limitations. The `/developer` page uses
native expand/collapse controls and renders README-derived values as escaped text. No raw README
HTML or hidden model reasoning is exposed.

Persisted profile JSON carries `schemaVersion` (`developer-intelligence-output-v3`). Older profiles
are marked `legacy` at the read boundary. They are not treated as modern explainability-cache hits;
the next analysis rebuilds the developer aggregate from validated, cached repository analyses
without unnecessary model calls. If repository-level attribution is absent, the UI explicitly says
that detailed attribution is unavailable instead of claiming there is no evidence.

Cache diagnostics distinguish exact reuse, legacy revalidation, invalidation, and regeneration.
Evidence changes (including README hashes), changes to eligible repository membership, failed
analyses that later succeed, and output-schema changes all prevent stale developer aggregates from
being treated as current.

The profile summary is deterministic. It names the strongest evidenced domains, recurring
technologies, low-coverage areas, and coverage percentage, followed by evidence limitations. This
avoids an extra model request solely to rewrite the aggregation.

PROM-004C was verified against the live PostgreSQL profile and `/developer` route. The legacy output
was rebuilt from 32 already-validated repository analyses: 32 reused, 0 model requests, 0 invalidated,
and 0 regenerated repository analyses. An unchanged second run reused all 32 analyses and the
developer profile with 0 model requests. The live page rendered repository evidence without an
exception; 197 displayed evidence references were checked against the validated per-repository
source outputs with 0 unsupported references.
