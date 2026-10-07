# ADR-010: Developer Intelligence pipeline

## Status

Accepted

## Decision

PROM-004 analyzes each repository independently through a provider-agnostic structured model
interface, validates the result, and uses deterministic code to aggregate repository signals into
the developer's eight-domain capability vector. Evidence hashes reuse unchanged repository and
developer results. README content is untrusted quoted evidence and receives no tools.

## Rationale

Per-repository analysis preserves traceability and bounds model context. Deterministic aggregation
makes levels reproducible, testable, and independent of a model's unsupported judgment about the
developer. A profile can remain partial when individual repository analysis fails.
