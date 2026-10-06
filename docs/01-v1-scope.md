# V1 Scope

> Status: **Proposed.** No V1 functionality is implemented. This document is the authoritative
> in/out scope for V1. Keep this scope strict; defer everything in the "Out of Scope" section.

## 1. Objective

Prove the end-to-end PROMETHEUS pipeline and demonstrate measurable, benchmark-verified
capability improvement when a validated skill is transferred between heterogeneous agents.

```
Developer → GitHub Auth → Public Repo Analysis → Developer Profile
→ Agent Integration → Agent Benchmarking → Agent Capability Profile
→ Skill Registry → Skill Discovery → Skill Validation → Skill Transfer
→ Re-Benchmark → Measurable Capability Improvement
```

## 2. In Scope (V1)

### Identity and evidence
- GitHub authentication.
- Public GitHub repository ingestion.
- Basic developer engineering profile.

### Agents
- Agent registration.
- Model/provider abstraction.
- Initial `AgentAdapter` interface.
- Agent capability profiles.

### Benchmarking
- Initial engineering benchmark system.
- Docker sandbox evaluation.
- Before/after benchmarking of a single skill transfer.

### Skills
- Skill specification.
- Skill registry.
- Skill versioning.
- Skill discovery.
- pgvector-based candidate retrieval.
- Skill validation.
- Basic skill lineage.

### Demonstration / visualization
- One working cross-agent skill transfer.
- Basic agent/skill network visualization.

## 3. Out of Scope (V1)

Explicitly excluded from V1:

- full virtual Earth, houses, avatars;
- complex social networking;
- recruiter platform;
- job marketplace;
- hackathon platform;
- blockchain;
- NFT / token economy;
- skill marketplace;
- mobile application;
- private GitHub repository analysis;
- autonomous modification of user repositories;
- unrestricted autonomous actions;
- millions of agents / large-scale simulation;
- high-fidelity virtual world.

## 4. Success Criteria

V1 succeeds when it can:

1. Authenticate a developer via GitHub and ingest public repository evidence.
2. Register at least two heterogeneous agents and produce capability profiles for each.
3. Run benchmark tasks in an isolated sandbox with reproducible scores.
4. Publish, discover, and version at least one skill in the registry.
5. Retrieve candidate skills with vector search and validate a candidate against a specific
   agent.
6. Transfer a validated skill from Agent A to Agent B and demonstrate a measurable before/after
   improvement on unseen tasks.
7. Record lineage for the transferred skill and visualize the agent/skill network.

The defining proof is the before/after capability delta, not a target number. Any threshold used
to accept a skill must be documented in
[Evaluation Methodology](benchmarks/evaluation-methodology.md).

## 5. Explicit Non-Goals and Deferrals

- No claims that benchmark scores represent absolute developer quality.
- No private repository analysis.
- No autonomous writes to user repositories.
- No enablement of a skill marketplace or economy.

## 6. Open Questions

- What minimum improvement threshold constitutes "meaningful" for V1?
- How many benchmark tasks per capability category are required for a stable baseline?
- Which two heterogeneous agents/models should form the canonical V1 transfer demonstration?
- How should developer profiles and agent capability profiles be presented side by side without
  conflating them?

## 7. Related Documents

- [Project Overview](00-project-overview.md)
- [Roadmap](02-roadmap.md)
- [Benchmark Design](benchmarks/benchmark-design.md)
- [Skill Transfer](skills/skill-transfer.md)
