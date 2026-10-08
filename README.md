# PROMETHEUS

**Intelligence should inherit intelligence.**

PROMETHEUS is a decentralized framework for skill discovery, validation, transfer, benchmarking,
inheritance, and evolution across heterogeneous AI software-engineering agents.

> An engineering capability learned by one AI agent should not have to be independently
> rediscovered by every other agent.

## Overview

PROMETHEUS lets AI engineering agents built on different models and architectures represent
useful engineering capabilities as reusable **skills**. Those skills can be discovered, shared,
validated, sandboxed, benchmarked, installed, modified, combined, versioned, traced through
lineage, and redistributed to other agents.

The long-term research goal is to investigate whether heterogeneous AI agents can continuously
improve their software-engineering capabilities through decentralized skill exchange and
evolution.

## The Problem

AI engineering agents improve in isolation. A capability that one agent learns — for example,
writing reliable tests, fixing a class of concurrency bug, or diagnosing a failing build — is
typically trapped inside that agent, its prompt, or its vendor. Every other agent must
rediscover the same capability from scratch. There is no neutral, portable, testable unit of
engineering capability that agents can exchange.

## The Idea

PROMETHEUS treats an engineering capability as a **portable, independently validated skill
package** rather than model weights. Because a skill is external to any single model, it can be
transferred across heterogeneous agents (for example, a Claude-based agent to a Qwen-based
agent). Because a skill is validated against a specific agent in a sandbox before installation,
PROMETHEUS measures whether the skill *actually improves that agent*, rather than assuming a
skill that helped one agent will help another.

## How PROMETHEUS Works

At a high level (the identity foundation is implemented; the remaining pipeline is planned):

1. A developer authenticates with GitHub.
2. PROMETHEUS analyzes public repositories to produce a developer engineering profile.
3. The developer connects an AI agent, which is benchmarked to produce an agent capability
   profile.
4. Skills are published to a registry, discovered by relevance, security-validated, executed in
   a sandbox, and benchmarked against the receiving agent.
5. A skill is installed only if it produces measurable improvement over the agent's baseline.
6. Skill versions and ancestry are recorded so capability can evolve and be traced.

The defining V1 demonstration is a measurable before/after capability improvement when a
validated skill is transferred from one agent to another.

## V1

V1 is scoped to prove a single end-to-end pipeline: GitHub analysis → agent benchmarking →
skill registry → skill discovery → validation → transfer → re-benchmark → measurable
capability improvement. It deliberately excludes virtual worlds, marketplaces, blockchain, and
large-scale simulation.

See [docs/01-v1-scope.md](docs/01-v1-scope.md) for the authoritative in/out scope.

## Architecture

PROMETHEUS distinguishes a **model** (e.g. GPT, Claude, Gemini, Qwen, Llama) from an **agent**
(model + instructions + tools + skills + memory + permissions + execution environment). It plans
a provider-agnostic `AgentAdapter` abstraction so core architecture does not couple to any single
LLM vendor. See [ARCHITECTURE.md](ARCHITECTURE.md) and
[docs/architecture/](docs/architecture/README.md).

## Technology

All technology below is **Planned** unless repository inspection shows otherwise. The current
repository contains documentation only.

| Area | Planned technology | Status |
|------|--------------------|--------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS | Implemented (foundation) |
| ORM | Prisma 7.10 | Implemented (identity foundation) |
| Database | PostgreSQL | Implemented (identity migration pending DB reachability) |
| Vector search | pgvector | Planned |
| AI/ML service | Python, FastAPI | Planned |
| Cache / async | Redis | Planned |
| Agent execution | Custom PROMETHEUS Agent Adapter | Planned |
| Code analysis | Tree-sitter + language-specific static analysis | Planned |
| ML | PyTorch, scikit-learn, Transformers | Planned |
| Sandboxing | Docker | Planned |
| Object storage | MinIO | Planned |
| Dev / deploy | Docker, Docker Compose | Planned |
| CI/CD | GitHub Actions | Planned |

## Research

The primary research question is: *Can heterogeneous AI agents continuously improve their
software-engineering capabilities through decentralized discovery, validation, transfer,
composition, and evolution of reusable skills?*

See [docs/research/](docs/research/README.md) for research questions, hypotheses, experiment
format, and metrics.

## Documentation

Start at the documentation portal: [docs/README.md](docs/README.md).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/development/](docs/development/README.md).
The application foundation is available in `apps/web` and `packages/database`; contributions now
target the documented roadmap milestones.

## Contributing

Branching, commit conventions, and the Definition of Done (CODE + TESTS + DOCUMENTATION) are
described in [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Status

**v0.4 — Developer Intelligence V0 (PROM-004).** On top of the v0.2 foundation, PROMETHEUS can
synchronize an authenticated developer's public GitHub repositories (metadata, languages, topics)
into PostgreSQL, ingest bounded README evidence, and analyze that evidence into a deterministic
eight-domain capability vector. The profile is evidence-backed and confidence-aware; it does not
claim code quality, authorship, seniority, or production reliability. PROM-005 building state
remains **Planned**.

PROM-004 has been exercised against the configured OpenCode Zen provider: all 32 eligible public
repositories were analyzed or reused with 100% coverage, and an unchanged second run made no model
requests.

Status vocabulary used across this repository:

- **Implemented** — exists in the repository and has been verified.
- **In Development** — actively being built.
- **Experimental** — exists but is unstable or unvalidated.
- **Planned** — committed to a roadmap milestone but not started.
- **Proposed** — an idea under discussion, not yet committed.
