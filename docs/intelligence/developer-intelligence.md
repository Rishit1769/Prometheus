# Developer intelligence

The developer profile is user-owned and exposed through:

- `POST /api/developer/analyze`
- `GET /api/developer/intelligence`
- `GET /api/developer/intelligence/:repositoryId`

The analyze route derives the user from the server session. It never trusts a client-supplied
`userId`. Repository work is bounded to three in-process model requests at a time. Partial
repository failures do not erase successful analyses; coverage reports eligible, analyzed, reused,
and failed repositories.

Developer cache identity includes the complete eligible repository set, each current evidence hash,
the analysis state (`COMPLETE` or `FAILED`), model/provider identity, prompt version, and scoring
version. Consequently a partial profile is recalculated when failed repositories later succeed or
when eligibility changes. Same-user concurrent requests share one in-process analysis promise;
multi-instance job coordination is intentionally outside V0.

The profile contains eight domains: FRONTEND, BACKEND, DATABASE, AI_ML, DEVOPS, TESTING, SYSTEMS,
and MOBILE. Level 0 means insufficient evidence, not poor ability. There is intentionally no
universal developer score.
