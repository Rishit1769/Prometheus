# Developer Profile

> Status: **Proposed.**

## Problem

Commit counts are a poor measure of engineering capability. PROMETHEUS should derive a
multidimensional, evidence-based developer profile — while being explicit that it is a
representation of available public evidence, not an absolute measure of quality.

## Context

- Evidence comes only from public GitHub activity (V1).
- Public evidence is partial: private work, non-GitHub work, and collaboration quality are
  largely invisible.
- Human capability and agent capability are **separate** and must not be combined blindly.

## Design

### Proposed Capability Dimensions

- frontend
- backend
- databases
- DevOps
- AI/ML
- testing
- systems
- mobile
- collaboration

A profile is a vector of these dimensions derived from public evidence, with recorded
methodology.

### Explicit Caveats

> These scores do **not** represent absolute developer quality. They are evidence-based
> representations derived from available public information.

### Human vs. Agent Separation

A developer profile describes the **human**. An agent capability profile describes the **agent**.
A developer may be excellent at backend engineering while their connected agent performs poorly
at backend engineering. The two are stored and presented separately (see
[Capability Model](../agents/capability-model.md)).

## Data Flow

GitHub evidence → feature extraction → dimension estimation → developer profile.

## Security Considerations

- Only public evidence is used in V1.
- Profiles should be clearly labelled as estimates with documented limitations.

## Trade-offs

- More dimensions are expressive but harder to estimate from weak signals.
- Simple heuristics are transparent but crude; ML models are powerful but opaque (see
  [Commit Intelligence](commit-intelligence.md)).

## Open Questions

- Which signals map to which dimensions, and how is that validated?
- How is the profile explained to the developer transparently?
- How is developer–agent capability difference surfaced without conflating them?

## Related Documents

- [Repository Ingestion](repository-ingestion.md)
- [Commit Intelligence](commit-intelligence.md)
- [Capability Model](../agents/capability-model.md)
