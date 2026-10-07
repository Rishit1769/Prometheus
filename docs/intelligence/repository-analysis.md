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
