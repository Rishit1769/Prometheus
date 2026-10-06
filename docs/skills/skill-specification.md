# Skill Specification

> Status: **Proposed.** This is the current proposed skill structure, not a finalized or
> irreversible specification. It will evolve as implementation proceeds.

## Problem

PROMETHEUS needs a portable unit of engineering capability that can be transferred between
heterogeneous agents and validated independently. Model weights cannot serve this role: they are
model-specific, opaque, and not independently testable as a capability.

## Context

- A skill must be self-describing enough to be validated before installation.
- A skill must declare its tool and permission requirements explicitly.
- A skill must be versioned and traceable to preserve provenance and lineage.
- The format should stay small for V1.

## Design

A skill is a **portable capability package** that may contain:

- metadata
- instructions
- examples
- tool requirements
- permissions
- tests
- evaluation information
- provenance
- lineage

### Proposed Package Layout (not final)

```
skill-name/
    manifest.json
    instructions.md
    examples.json
    tools.json
    permissions.json
    tests.json
    evaluation.json
    provenance.json
```

### Proposed File Roles

| File | Purpose |
|------|---------|
| `manifest.json` | Identity: name, version, author agent/developer, description, capability tags |
| `instructions.md` | Human/model-readable guidance that constitutes the capability |
| `examples.json` | Input/output examples demonstrating the skill |
| `tools.json` | Tools and environment the skill requires |
| `permissions.json` | Declared permissions (see security architecture) |
| `tests.json` | Tests used to evaluate the skill |
| `evaluation.json` | Evaluation configuration / expected measures |
| `provenance.json` | Origin, history, and trust information |

> Field schemas are **not finalized**. This layout is explicitly provisional; see
> [Open Questions](#open-questions).

## Responsibilities

- The **registry** stores and versions skill packages.
- **Orchestration** interprets them during discovery, validation, and transfer.
- The **sandbox** executes their tests in isolation.

## Data Flow

```
Author → package → registry (versioned)
Registry → discovery (embedding) → validation (sandbox) → install or reject
```

## Security Considerations

- Skills are untrusted until validated. See
  [Skill Validation](skill-validation.md).
- Permissions must be declared and checked before installation.
- Instructions are data, not trusted code, and must be analyzed as untrusted input.

## Trade-offs

- A rich format supports validation and lineage but increases complexity.
- A minimal format is easier for V1 but may not capture provenance/trust sufficiently.

## Open Questions

- Should instructions be a single file or a structured sequence?
- How are tests expressed portably across heterogeneous agents?
- Are permissions declarative only, or enforceable?
- How is a skill's "capability tag" vocabulary standardized?
- Should composition be represented in-package or only in lineage metadata?

## Related Documents

- [Skill Registry](skill-registry.md)
- [Skill Validation](skill-validation.md)
- [Skill Lineage](skill-lineage.md)
- [Database Architecture](../architecture/database-architecture.md)
