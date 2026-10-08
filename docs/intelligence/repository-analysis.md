# Repository analysis

The repository analyzer receives a controlled payload containing repository metadata, language
bytes, topics, and bounded README evidence. It never receives OAuth tokens, sessions, unrelated
database identifiers, or provider secrets. README text is explicitly quoted untrusted data; it is
never followed as an instruction or executed.

The structured result uses provider-constrained JSON Schema output and is validated again in the
application before persistence. It records technologies, fixed-domain signals, complexity,
documentation quality, architecture/engineering signals, limitations, confidence, and evidence
references. The current prompt/schema versions are `repository-analysis-v3` and
`repository-analysis-schema-v3`.

The normalized payload plus prompt, schema, provider, model, and evidence-validation versions
produces a SHA-256 evidence hash. The current grounding identity is
`evidence-grounding-v1`. A complete analysis with the same hash is reused without a model call.
An older cached record is deterministically revalidated against the stored evidence and upgraded
to the current validation version when possible; only records that cannot be safely validated are
regenerated. Changed evidence creates a new current analysis and failed analyses remain visible as
`FAILED`.

Model references are semantically grounded after schema validation: language and topic references
must match supplied evidence case-insensitively, README section references must match an actual
Markdown heading, README excerpts must occur in the stored normalized content, and description
references must point to the stored description locator. Missing or truncated README content is
never treated as evidence. Unsupported references are reported as limitations and removed before
persistence. OpenCode requests use the Zen `/zen/v1` endpoint, an application
user-agent, a stable `x-opencode-session` per request/conversation, JSON Schema strict output, low reasoning effort,
and a 12,000-token output budget. HTTP errors preserve safe provider status/code/message; validation
errors report issue paths. A total repository failure returns an API error and does not persist a
zero-coverage developer profile. Partial profiles are persisted only when at least one repository
was successfully analyzed or reused. A second run with unchanged evidence reuses both repository
analyses and the developer profile without model calls.
