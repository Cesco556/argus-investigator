# Argus — AML Investigator Workspace

**Live:** https://argus-investigator.vercel.app

An AML investigator workspace that pairs a Claude-powered agent with a defensible decision trail, MCP-orchestrated tools, and a domain-built UI for financial-crime analysts.

Argus is the front-end of a larger AML platform. The back-end engine — a FastAPI service with ML anomaly detection, sanctions screening, network analysis, and SAR-compliant reporting — lives in the parent repo and is deployed at `http://139.59.182.126:8000`. The MCP tool server runs alongside at `http://139.59.182.126:3333/mcp` behind a bearer token.

## What it does

- **Triage cases** — surface alerts with severity, SAR clock, subject entity, and transaction context
- **Reason with an agent** — a Claude Sonnet 4.6 (or Opus 4.7) investigator that calls real MCP tools (`query_transactions`, `pull_entity_profile`, `sanctions_check`, `search_typology_playbook`, `fetch_regulatory_intel`) and refuses to invent data; when two tools disagree, surfaces the conflict and defers to the analyst
- **Cite every claim** — citations like `[FATF-ML-001]` or `[entity:meridian-trade-ltd]` are auto-rendered as inline tags that brush the timeline + graph
- **Record the suspicion trail** — every agent tool call AND every analyst disposition (SAR / dismiss / defer) lands in MongoDB Atlas as an append-only event log, so a case can be reconstructed months later
- **See the network** — entity/transaction graph via Sigma.js, with a playhead scrubber that reveals the case in chronological order
- **UK-scoped SAR rules** — agent operates under NCA DAML semantics by default and explicitly flags jurisdiction when a case crosses borders

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
| Week 3 | Suspicion Trail (Mongo append-only event log of agent tool calls) | ✓ done |
| Week 4 | Sigma.js graph, citation→timeline pulse, playhead scrubber | ✓ done |
| Week 5 | Decision wire-through (analyst SAR/dismiss/defer recorded to trail), agent tool-conflict refusal, UK-scoped SAR semantics, /api/agent hardening (Zod + size cap + optional bearer) | ✓ done |

### What's not in this build

- Authentication beyond the optional shared bearer token. A real deployment would gate behind SSO / per-analyst sessions; the `INVESTIGATOR_API_TOKEN` env knob is provided as a minimum cost-guard. To enable in prod: `vercel env add INVESTIGATOR_API_TOKEN`.
- Per-IP rate limiting (would require Redis/Upstash on Vercel).
- Live wiring to the FastAPI engine — case/entity/transaction data is currently fixtures sized for demo legibility. The intel feed (`/intel`) and the agent's MCP tools are live.
- Structured logging and broad test coverage — pragmatic gaps for a demo. The disposition route has a smoke test (`pnpm test:disposition`).

### Local environment caveat

This repo's `.env.local` is a symlink to `~/.claude/.env` (a workstation-wide secrets file). Anyone working on this project should: (a) confirm they want that coupling, (b) not include the symlink target in any zip / tarball / archive of the project, and (c) ensure their cloud deploy has its own `INVESTIGATOR_API_TOKEN` and `MONGODB_URI` set independently of the local file.

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
