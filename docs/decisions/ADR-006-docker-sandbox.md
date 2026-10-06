# ADR-006: Docker Sandbox for Untrusted Benchmark and Skill Execution

## Status

Proposed

## Context

PROMETHEUS executes benchmark tasks and candidate skill packages that originate from other agents
and are therefore **untrusted**. Skills may declare powerful permissions, and agent-produced
patches or scripts can be arbitrary. Running such content directly on host infrastructure would
expose credentials, data, and availability. Safe skill exchange is impossible without isolation.

## Decision

Untrusted benchmark execution and skill validation will occur inside isolated Docker
environments with no host credentials, restricted (default-off) network, and enforced resource
limits.

## Rationale

- Docker provides process, filesystem, and network isolation with broad tooling support.
- Ephemeral containers are reproducible and disposable, suiting benchmark isolation.
- Resource limits and disabled network reduce blast radius and abuse potential.
- Keeps the trust boundary explicit: execution is isolated, and trust decisions remain in
  orchestration (see [Security Architecture](../architecture/security-architecture.md)).

## Alternatives Considered

- **Run untrusted code directly on the host:** unacceptable — credential and host exposure.
- **Stronger isolation (gVisor, Firecracker microVMs, Kata):** stronger security boundary, but more
  operational complexity; may be adopted later for hardened deployments.
- **OS-level sandboxes without containers:** less portable and harder to standardize.
- **Third-party sandboxed execution services:** outsources trust and reduces control over
  reproducibility.

## Consequences

- Positive: a clear, enforceable trust boundary; reproducible, disposable execution; resource
  control.
- Negative: container orchestration overhead; Docker availability required; slower than in-process
  execution.
- Neutral: sandbox images must be pinned for reproducibility.

## Revisit Conditions

- If Docker isolation is judged insufficient for hostile code, migrate to microVM/ gVisor-grade
  isolation.
- If benchmark throughput requirements demand distributed or specialized execution.
- If reproducibility problems arise from unpinned or mutable images.

## Related Documents

- [Security Architecture](../architecture/security-architecture.md)
- [Benchmark Execution](../benchmarks/benchmark-execution.md)
- [Skill Validation](../skills/skill-validation.md)
- [Environment Variables](../development/environment-variables.md)
