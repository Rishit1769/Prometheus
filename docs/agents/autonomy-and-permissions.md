# Autonomy and Permissions

> Status: **Proposed.**

## Problem

PROMETHEUS may support autonomous skill discovery and installation. Autonomy without bounds risks
letting an agent take high-impact actions — spending compute, reading repositories, or modifying
code — without owner consent. Human owners must remain in control.

## Context

- Agents act on behalf of developers.
- Some operations are low-risk (discover skills); others are high-impact (modify repositories,
  spend compute credits).
- Skills themselves declare permissions (see
  [Security Architecture](../architecture/security-architecture.md)).

## Design — Human Control

Humans remain owners and controllers of their agents. Permission settings are configurable and
govern what an agent may do autonomously.

### Proposed Permission Settings

| Permission | Risk | Default (proposed) |
|------------|------|--------------------|
| Discover skills automatically | Low | Allowed |
| Request public skills | Low | Allowed |
| Install validated public skills | Medium | Requires policy |
| Share public skills | Medium | Requires policy |
| Share private skills | High | Denied |
| Spend compute credits | High | Requires authorization |
| Access repositories | High | Requires authorization |
| Modify repositories | High | Denied |

High-impact operations require explicit authorization or a configurable policy. Dangerous
capabilities are never silently granted.

### Two Layers of Permission

1. **Agent-level** — what the owner permits this agent to do.
2. **Skill-level** — what a skill declares it needs (`filesystem.write`, `shell`, …).

An action is permitted only if both layers allow it. See
[Security Architecture § Permission Model](../architecture/security-architecture.md#permission-model).

## Data Flow

```
Owner sets agent permissions
→ Agent proposes action (e.g. install skill)
→ Orchestration checks agent-level permissions
→ Orchestration checks skill-declared permissions
→ If high-impact and not pre-authorized: request explicit approval
→ Execute or deny
```

## Security Considerations

- GitHub credentials are never exposed directly to autonomous agents.
- Modifying user repositories is out of scope for V1.
- Quarantine is used when a skill fails validation rather than granting it.

## Collaboration Is Optional

Developer collaboration is optional and secondary. Agents may exchange skills without requiring
their human owners to collaborate on a project. See [Project Overview](../00-project-overview.md).

## Trade-offs

- Conservative defaults reduce risk but limit autonomous usefulness.
- Fine-grained permissions improve safety but increase configuration burden and UX complexity.

## Open Questions

- Which operations need per-action approval vs. standing policy?
- How are permission prompts delivered and audited?
- How does a shared/team agent reconcile multiple owners' permissions?

## Related Documents

- [Security Architecture](../architecture/security-architecture.md)
- [Skill Validation](../skills/skill-validation.md)
- [SECURITY.md](../../SECURITY.md)
