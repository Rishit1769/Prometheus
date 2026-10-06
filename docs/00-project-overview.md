# Project Overview

> Status: **Proposed** (conceptual). This describes intended direction; no functionality is
> implemented.

## 1. Project Identity

- **Name:** PROMETHEUS
- **Tagline:** Intelligence should inherit intelligence.
- **Formal description:** PROMETHEUS is a decentralized framework for skill discovery,
  validation, transfer, benchmarking, inheritance, and evolution across heterogeneous AI
  software-engineering agents.

The central premise:

> An engineering capability learned by one AI agent should not have to be independently
> rediscovered by every other agent.

PROMETHEUS lets heterogeneous AI engineering agents represent useful engineering capabilities as
reusable skills. Over time these skills can be discovered, shared, validated, sandboxed,
benchmarked, installed, modified, combined, versioned, traced through lineage, and redistributed
to other agents. The long-term research goal is to determine whether heterogeneous agents can
continuously improve their software-engineering capabilities through decentralized skill exchange
and evolution.

## 2. The Problem

Engineering capability in AI agents is currently trapped:

- **Vendor/model isolation.** A useful capability lives in one agent's prompt, tools, or vendor
  stack and cannot move to another agent.
- **No unit of capability.** There is no neutral, portable, testable package for a capability
  short of model weights.
- **Unverified transfer.** Even if guidance could move between agents, there is no established
  method to prove it *improves a specific receiving agent* on unseen tasks.
- **Redundant rediscovery.** Every agent independently relearns the same engineering skills.

## 3. The Idea

Represent engineering capability as a **portable, independently validated skill package** rather
than model weights. A skill is external to any single model, so it can transfer across
heterogeneous agents. A skill is validated against a *specific agent* in a sandbox before
installation, so PROMETHEUS measures real improvement (`SkillUtility(skill, agent)`) instead of
assuming universal quality.

## 4. What PROMETHEUS Is Not

PROMETHEUS is **not** primarily:

- a developer social network,
- a recruiter platform,
- a virtual world or metaverse,
- a GitHub replacement,
- an LLM chat application,
- an agent marketplace.

Developer profiles, GitHub analysis, visualization, and collaboration features are supporting
capabilities. The core contribution is **AI engineering agents improving other AI engineering
agents through reusable and independently validated engineering skills.**

## 5. The V1 Proof

V1 must prove one end-to-end pipeline:

```
Developer → GitHub Auth → Public Repo Analysis → Developer Profile
→ Agent Integration → Agent Benchmarking → Agent Capability Profile
→ Skill Registry → Skill Discovery → Skill Validation → Skill Transfer
→ Re-Benchmark → Measurable Capability Improvement
```

The defining demonstration is a measurable before/after improvement when Agent A's validated
skill is transferred to Agent B. See [V1 Scope](01-v1-scope.md).

## 6. Core Conceptual Distinctions

### 6.1 Model ≠ Agent

An LLM is not an agent. A model may be GPT, Claude, Gemini, Qwen, or Llama. An agent is
conceptually:

```
Model + Instructions + Tools + Skills + Memory + Permissions + Execution Environment
```

PROMETHEUS therefore models `Developer → Agent → Model`, not `Developer → LLM`. Agent identity is
stable even if its underlying model changes. See [Agent Model](agents/agent-model.md).

### 6.2 Agent Interoperability

PROMETHEUS must not tightly couple to one LLM provider. The architecture plans a common
`AgentAdapter` abstraction. See [Agent Adapter](agents/agent-adapter.md) and
[ADR-005](decisions/ADR-005-custom-agent-adapter.md).

### 6.3 Skills Are Portable Capability Packages

A PROMETHEUS skill is not model weights. It is a portable capability package that may contain
metadata, instructions, examples, tool requirements, permissions, tests, evaluation information,
provenance, and lineage. The exact layout is **proposed**, not final. See
[Skill Specification](skills/skill-specification.md).

### 6.4 Skills Must Be Independently Validated

Success on Agent A does not prove improvement on Agent B. PROMETHEUS evaluates
`SkillUtility(skill, agent)`: baseline benchmark → sandbox the candidate skill → benchmark the
same agent again → compare. Install only if improvement exceeds an accepted threshold; otherwise
reject. See [Skill Validation](skills/skill-validation.md).

### 6.5 Vector Similarity ≠ Skill Quality

Vector search retrieves *relevant* candidate skills. It does not establish that a skill
*improves* an agent. Retrieval answers "which skills appear relevant?"; benchmarking answers
"which relevant skill actually improves this agent?" See
[Skill Discovery](skills/skill-discovery.md).

### 6.6 GitHub Evidence ≠ Agent Capability

Human engineering capability may be estimated from public GitHub evidence. Agent capability is
measured through controlled benchmarks. These are different entities and measurements and must
not be combined blindly. A developer may be excellent at backend engineering while their
connected agent performs poorly at backend engineering. See
[Developer Profile](github/developer-profile.md) and [Capability Model](agents/capability-model.md).

## 7. Architectural Principles (Summary)

1. Model and agent are different; agent identity is stable across model changes.
2. Interoperability over vendor lock-in (`AgentAdapter`).
3. Skills are portable capability packages, not weights.
4. Skills are independently validated per agent.
5. Vector similarity is not skill quality.
6. GitHub evidence and agent capability are separate.
7. Human owners remain in control of their agents.

Detailed treatment: [docs/architecture/](architecture/README.md).

## 8. Glossary

| Term | Meaning |
|------|---------|
| **Model** | A base LLM (GPT, Claude, Gemini, Qwen, Llama, …). |
| **Agent** | A configured system: model + instructions + tools + skills + memory + permissions + execution environment. |
| **AgentAdapter** | Provider-agnostic interface through which PROMETHEUS executes and interrogates an agent. |
| **Developer** | A human who authenticates, owns repositories, and controls agents. |
| **Skill** | A portable capability package (not weights) that can be transferred and validated. |
| **Skill Registry** | The store of published, versioned skills. |
| **Skill Utility** | `SkillUtility(skill, agent)` — measured improvement of an agent when a skill is applied. |
| **Capability Profile** | A multidimensional representation of what an agent (or developer) can do. |
| **Benchmark** | A controlled task set used to measure capability deterministically where possible. |
| **Lineage** | The ancestry and version history of a skill. |
| **Provenance** | Where a skill came from and its trust/verification history. |
| **Sandbox** | An isolated environment (planned: Docker) for untrusted execution. |

## 9. Related Documents

- [V1 Scope](01-v1-scope.md)
- [Roadmap](02-roadmap.md)
- [System Architecture](architecture/system-architecture.md)
- [Research Questions](research/research-questions.md)
