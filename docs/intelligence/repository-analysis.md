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

The normalized payload plus prompt schema version produces a SHA-256 evidence hash. A complete
analysis with the same hash is reused without a model call. Changed evidence creates a new current
analysis and failed analyses remain visible as `FAILED`.

Model references are semantically grounded after schema validation: language and topic references
must exactly match supplied evidence, README section references must match an actual Markdown
heading, and README content references must use an allowed content identity. Unsupported references
are removed before persistence. OpenCode requests use the Zen `/zen/v1` endpoint, an application
user-agent, a stable `x-opencode-session` per request/conversation, JSON Schema strict output, low reasoning effort,
and a 12,000-token output budget. HTTP errors preserve safe provider status/code/message; validation
errors report issue paths. A total repository failure returns an API error and does not persist a
zero-coverage developer profile. Partial profiles are persisted only when at least one repository
was successfully analyzed or reused. A second run with unchanged evidence reuses both repository
analyses and the developer profile without model calls.
