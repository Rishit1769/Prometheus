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

The profile summary is deterministic. It names the strongest evidenced domains, recurring
technologies, low-coverage areas, and coverage percentage, followed by evidence limitations. This
avoids an extra model request solely to rewrite the aggregation.

PROM-004C automated acceptance passes. A controlled OpenCode Go request reached the provider, but
DeepSeek V4.1 Flash returned HTTP 400 because the OpenCode workspace is not configured for the
required Global privacy region. Full application-level live verification is therefore pending that
external workspace setting and a reachable PostgreSQL session; no credential or provider payload is
recorded here.
