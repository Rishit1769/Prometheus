# Repository analysis

The repository analyzer receives a controlled payload containing repository metadata, language
bytes, topics, and bounded README evidence. It never receives OAuth tokens, sessions, unrelated
database identifiers, or provider secrets. README text is explicitly quoted untrusted data; it is
never followed as an instruction or executed.

The structured result is validated before persistence. It records technologies, fixed-domain
signals, complexity, documentation quality, architecture/engineering signals, limitations,
confidence, and evidence references. `repository-analysis-v1` is the prompt version.

The normalized payload plus prompt schema version produces a SHA-256 evidence hash. A complete
analysis with the same hash is reused without a model call. Changed evidence creates a new current
analysis and failed analyses remain visible as `FAILED`.

Model references are semantically grounded after schema validation: language and topic references
must exactly match supplied evidence, README section references must match an actual Markdown
heading, and README content references must use an allowed content identity. Unsupported references
are removed before persistence. The OpenAI-compatible request uses JSON mode, a 1,800-token output
bound, and a 90-second timeout; provider errors are sanitized.
