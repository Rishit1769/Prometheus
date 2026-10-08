# ADR-008: README Evidence Ingestion

- **Status:** Accepted
- **Date:** 2026-10-07
- **Milestone:** PROM-003

## Decision

Store one current, bounded `RepositoryReadmeEvidence` record for each eligible public,
non-fork repository already synchronized by PROM-002. Retrieve README data through GitHub's
repository README endpoint using the existing OAuth access token. Normalize line endings and outer
whitespace, compute SHA-256 over the complete normalized UTF-8 content, and persist at most 256 KiB
of UTF-8-safe content.

The evidence record retains source path, GitHub blob SHA, original normalized byte count, hash,
truncation flag, encoding, fetch timestamp, and an explicit status. Repeated runs update the same
row and classify unchanged content rather than creating duplicate records.

## Rationale

README text is useful source evidence for future developer intelligence, but it is not proof of
engineering ability. Keeping provenance and a deterministic hash lets PROM-004 explain which source
was used and avoid unnecessary re-analysis. Explicit missing/failure states are more useful than a
null content field. A bounded record prevents arbitrary repository text from flowing into later
model context.

## Security and trust boundary

Only public repositories are in scope; forks are excluded from README-based developer evidence by
default, while archived repositories remain eligible. No additional OAuth scope or PAT is needed.
README content is untrusted data and is never rendered as arbitrary HTML or treated as instructions.
Authenticated API routes derive the user from the session and enforce repository ownership.

## Consequences and future work

Large READMEs are marked `TRUNCATED`, so later analysis must not mistake bounded content for a
complete source. The current row model intentionally does not implement historical version storage
or stale PROM-004 analysis records; those can be added when the next milestone defines them.
