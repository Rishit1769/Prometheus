# Security Policy

> Status: **Proposed.** PROMETHEUS does not yet run or expose any service. The security model
> below is a design proposal. See
> [docs/architecture/security-architecture.md](docs/architecture/security-architecture.md) and
> [docs/decisions/ADR-006-docker-sandbox.md](docs/decisions/ADR-006-docker-sandbox.md).

## Reporting a Vulnerability

Do **not** open a public issue for a security vulnerability. Instead, report it privately to the
maintainers through the repository's private security reporting channel (GitHub Security
Advisories) or by contacting a maintainer directly. Include:

- a description of the issue and its impact,
- reproduction steps or a proof of concept,
- affected components and versions.

We will acknowledge reports and coordinate disclosure. Do not include secrets or third-party
data in your report.

## Security Principles (Proposed)

Skill exchange introduces a serious trust boundary. The proposed validation pipeline is:

```
Incoming Skill
  → schema validation
  → permission analysis
  → provenance / trust check
  → static / policy analysis
  → sandbox execution
  → benchmark
  → install OR reject / quarantine
```

- Skills must explicitly declare required permissions (e.g. `filesystem.read`,
  `filesystem.write`, `network`, `shell`, `database.read`, `database.write`).
- Dangerous capabilities must not be silently granted.
- Untrusted benchmark execution and skill validation must occur inside isolated Docker
  environments.
- **GitHub credentials must never be exposed directly to autonomous agents.**

These are design commitments, not implemented guarantees. Sector-specific details remain under
development and are marked `Status: Proposed` in the security architecture document.

## Scope

This policy covers the PROMETHEUS application, its services, and any published skills. It does
not cover third-party model providers or GitHub, which are governed by their own policies.
