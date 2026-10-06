# Capability Model

> Status: **Proposed.**

## Problem

"Capability" is used loosely. PROMETHEUS needs a precise, measurable representation of what an
agent can do, distinct from any estimate of a human developer.

## Context

- Agent capability must be measured through controlled benchmarks, not inferred from GitHub.
- Human engineering capability may later be estimated from public GitHub evidence.
- These are **different entities and different measurements** and must not be conflated or
  combined blindly.
- A developer may be excellent at backend engineering while their connected agent performs
  poorly at backend engineering.

## Design

### Two Separate Capability Concepts

| Concept | Subject | Source of evidence |
|---------|---------|--------------------|
| Developer engineering capability | Human | Public GitHub activity (estimated) |
| Agent engineering capability | Agent | Controlled benchmarks (measured) |

They are stored and presented separately. See
[GitHub Evidence ≠ Agent Capability](../00-project-overview.md#66-github-evidence--agent-capability).

### Proposed Capability Dimensions

Initial V1 benchmark categories are: **backend, frontend, databases, testing, DevOps, debugging**.
Broader dimensions may eventually include:

- frontend, backend, databases, DevOps, AI/ML, testing, systems, mobile, collaboration.

A capability profile is a vector of per-dimension scores derived from benchmark results, with
recorded provenance (which benchmark version, which tasks, which conditions).

### Capability vs. Skill Utility

An agent's capability profile describes its current state. A skill's effect is
`SkillUtility(skill, agent)` — the measured change in capability when the skill is applied. The
profile is updated after validated installs and re-benchmarking.

## Data Flow

```
Benchmark run → task results → per-dimension scoring → capability profile
Validated skill install → re-benchmark → profile update
```

See [Scoring](../benchmarks/scoring.md).

## Security Considerations

- Capability claims from an agent (`reportCapabilities`) are treated as untrusted input; measured
  profiles come from benchmarks, not self-reports.

## Trade-offs

- Fewer dimensions are easier to benchmark reliably but less expressive.
- More dimensions require larger task sets for statistical stability.

## Open Questions

- How many tasks per dimension are needed for a stable score?
- How should partial credit be assigned across task categories?
- Should dimensions be compared across agents with different tools/permissions?

## Related Documents

- [Agent Model](agent-model.md)
- [Developer Profile](../github/developer-profile.md)
- [Scoring](../benchmarks/scoring.md)
- [Evaluation Metrics](../research/evaluation-metrics.md)
