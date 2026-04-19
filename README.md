# Argus — AML Investigator Workspace

A modern Anti-Money-Laundering investigator workspace that pairs a Claude-powered agent with a defensible decision trail, MCP-orchestrated tools, and a domain-built UI for financial-crime analysts.

Argus is the front-end of a larger AML platform. The back-end engine — a production-grade FastAPI service with ML anomaly detection, sanctions screening, network analysis, and FinCEN SAR-compliant reporting — lives in the parent repo and is deployed at `http://139.59.182.126:8000`.

## What it does

- **Triage cases** — surface alerts with severity, SAR clock, subject entity, and transaction context
- **Reason with an agent** — a Claude Sonnet 4.6 (or Opus 4.7) investigator that calls real MCP tools (`query_transactions`, `pull_entity_profile`, `sanctions_check`, `search_typology_playbook`) and refuses to hallucinate
- **Cite every claim** — citations like `[FATF-ML-001]` or `[entity:meridian-trade-ltd]` are auto-rendered as inline tags
- **Record the suspicion trail** — every agent tool call lands in MongoDB Atlas (Week 3) so an analyst can reconstruct *why* a case was escalated months later
- **See the network** — entity/transaction graphs via Sigma.js (Week 4)

## Stack

- **Framework:** Next.js 16 (Turbopack, app router, server components)
- **UI:** Tailwind v4, shadcn/ui (Base UI), Lucide icons, Framer Motion
- **Agent:** AI SDK v6 with Anthropic Claude (primary) and Azure OpenAI (fallback) via a runtime `AGENT_MODEL` toggle
- **Tools:** Model Context Protocol (MCP) — agent calls real tools from a sidecar MCP server
- **State:** TanStack Query, Zustand
- **Persistence:** MongoDB Atlas (Suspicion Trail event log)
- **Backend:** FastAPI AML engine (separate repo)

## Status

| Phase | Scope | State |
|-------|-------|-------|
| Week 1 | App shell, case/entity/graph routes, shadcn/ui, data fixtures | ✓ done |
| Week 2 | Claude investigator agent + MCP tool-calling | ✓ done |
| Week 3 | Suspicion Trail (Mongo append-only event log) | in progress |
| Week 4 | Sigma.js graph + timeline spine + ship | planned |

## Getting started

### Prerequisites

- Node 20+
- pnpm 10+
- One agent provider (Anthropic API key *or* Azure OpenAI deployment)
- (Optional, for Week 3) a MongoDB Atlas connection string

### Install + run

```bash
pnpm install
cp .env.example .env.local   # then fill in your keys
pnpm dev
```

Open `http://localhost:3000`.

### Environment

See [`.env.example`](.env.example) for the full list. Minimum to boot:

- `ANTHROPIC_API_KEY` *(or)* `AZURE_OPENAI_*` triple
- `AML_ENGINE_URL` (defaults to the LON1 droplet)
- `MCP_SERVER_URL` (defaults to local)

Switch agent model at runtime:

```bash
AGENT_MODEL=anthropic:sonnet  # default — Claude Sonnet 4.6
AGENT_MODEL=anthropic:opus    # deeper reasoning, ~5x cost
AGENT_MODEL=azure:mini        # GPT-5.4-mini fallback
```

### Verify Mongo

```bash
pnpm mongo:ping
# ✓ connected to MongoDB Atlas
```

## Project structure

```
src/
  app/                    # Next.js routes (case, entity, graph, trail, ...)
  components/
    agent/                # Agent panel, message rendering, tool-call cards
    shell/                # Top bar, sidebar, app shell
    ui/                   # shadcn/ui primitives
  lib/
    agent/                # Provider, MCP client, system prompt
    data/                 # Fixtures (cases, entities, transactions)
    intel/                # External intel fetch + sources
    mongo/                # Atlas client (Week 3 Suspicion Trail)
    env.ts                # Zod-validated env schema
scripts/
  mongo-ping.ts           # Atlas connectivity diagnostic
```

## License

[MIT](LICENSE)
