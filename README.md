# FrontierIQ-MFG

**Frontier Solutions AI · frontiersolutions.ai**

The manufacturing solution pack on the Frontier Platform — sibling to FrontierIQ-Energy (oil & gas, utilities, renewables) and FrontierIQ-GxP (pharma/GxP). Lifted from the standalone "Industrial Operations AI Platform" prototype built and deployed for Amplify Industrial (`amplifyindustrial.io/apps/fabric-ai`, live at `amplify-fabric-ai-api`), targeting discrete/process manufacturing operations for a fictitious chemical plant, **NovaChem**.

## Status: lifted, not yet integrated

This repo is a straight copy of the original standalone app, restructured to match the FrontierIQ-Energy/FrontierIQ-GxP folder convention (`mfg_core/`, `platform-ui/`, `infra/`, `configs/`). It is **not yet** wired into the shared Frontier Platform engine the way Energy and GxP are — see "Refactor backlog" below. Until that lands, treat this as a working demo app that happens to live in the right place, not a true platform pillar yet.

## What the original app proves

A tiered multi-agent architecture reasoning over live manufacturing data without a data analyst in the loop:

- **Tier 1 — Analytical agents**: `performance_analyst_agent`, `data_quality_agent`, `line_operations_agent` — read and characterize production data
- **Tier 2 — Diagnostic/RCA agents**: `downtime_rca_agent`, `bottleneck_constraint_agent` — root-cause analysis
- **Tier 3 — Predictive/prescriptive agents**: `operations_recommendation_agent`, `executive_briefing_agent` — recommend and summarize

Frontend covers Production (metrics/ops/schedule/optimization), Quality, Energy (consumption/dashboard/peak demand AI), Maintenance orders, Materials/Inventory, Batch Analytics, CIP Yield Tracker, Demand Forecasting, plus the platform chrome (Agent Builder, Agent Fleet, AI Trust & Control, RCA Workbench, Recommendations Lab, Design Library).

## Repository structure

```
FrontierIQ-MFG/
├── mfg_core/        FastAPI backend — main.py, routes/, connectors/ (Fabric SQL),
│                    models/, config_engine.py, agent/ (7 Claude-powered agents)
├── platform-ui/     React 19 + Vite frontend (30+ pages)
├── configs/         Per-product JSON configs (multi-tenant config engine)
├── infra/           Dockerfile (build context = repo root)
└── docs/            (backlog / solution design — TBD)
```

## Local development

```bash
# backend
cp mfg_core/.env.example mfg_core/.env   # fill in ANTHROPIC_API_KEY / Fabric + Azure AD creds
pip install -r requirements.txt
cd mfg_core && python main.py            # http://localhost:8000

# frontend
cd platform-ui
npm install
npm run dev                              # http://localhost:3000 (or 5173 per vite default)
```

`DATA_MODE` and Fabric connection details are read from `mfg_core/.env` — see `mfg_core/.env.example`, `mfg_core/EVENTHOUSE_SETUP.md`, `mfg_core/SETUP_GUIDE.md` (carried over from the original app, not yet updated for this repo's layout).

## Docker build

```bash
docker build -f infra/Dockerfile -t frontieriq-mfg .   # build context is repo root
```

## Origin

Lineage: `apps/core` ("Agentic CORE Platform", detached from `sightmachine/Agentic-Platform-MVP`) → pages/agents ported into `apps/fabric-ai` → NovaChem chemical-domain data model + pages built on top → deployed to Azure (`amplify-fabric-ai-api`, container `amplifyindustrial.azurecr.io/fabric-ai-backend`) → lifted here 2026-07-31.

## Refactor backlog (not yet done)

To bring this in line with how FrontierIQ-Energy/FrontierIQ-GxP consume the shared platform ("platform, not fork" — no platform code duplicated into the solution pack):

- [ ] **LLM auth**: currently calls Anthropic's public API directly (`ANTHROPIC_API_KEY` from console.anthropic.com). Energy/GxP call Claude through the shared Azure AI Foundry endpoint (`foundry_endpoint` + `foundry_api_key` in `shared/config.py`) — should switch to that pattern.
- [ ] **No `shared/` yet**: Energy/GxP each have a thin `shared/config.py` (pydantic-settings, `AMPLIFYIQ_` env prefix) pointing at FrontierPlatform's deployed services. MFG needs its own.
- [ ] **Agents run in-process**: the 7 agents in `mfg_core/agent/` call Claude directly from FastAPI route handlers. Compare to how Energy/GxP call FrontierPlatform's `agents`/`guardrailiq` services over HTTP for governed tool-use, and whether MFG should do the same instead of maintaining its own ungoverned agent code.
- [ ] **No LoopIQ integration**: Energy/GxP both close the loop — validated agent findings feed back into LoopIQ as exemplars. This app has no validation-capture path today.
- [ ] **No KnowledgeIQ grounding**: agents reason over live Fabric data only, no domain knowledge corpus seeded/retrieved.
- [ ] **No `infra/deploy-services.sh`**: needs its own Container App deploy script (own image name, distinct from the original `amplify-fabric-ai-api` App Service and from FrontierPlatform's/other pillars' service names).
- [ ] **Multi-tenant config engine** (`config_engine.py`, `configs/products/`) — inherited from the original app's "multi-product" design; decide whether this concept is still needed once this is a single MFG solution pack, or whether it should map onto FrontierPlatform's own tenant model instead.
- [ ] **Housekeeping**: `mfg_core/create_test_db.py`, `test_routes.py`, `test.db` references, and stray docs (`EVENTHOUSE_SETUP.md`, `SETUP_GUIDE.md`, `HEALTH_LOGGING_README.md`) carried over verbatim and need a pass.

## Relationship to platform repos

```
FrontierPlatform/     Shared engine (KnowledgeIQ, GuardrailIQ, AgentsIQ, LoopIQ)
FrontierIQ-GxP/       Pharma/GxP solution pack — consumes FrontierPlatform
FrontierIQ-Energy/    Energy solution pack — consumes FrontierPlatform
FrontierIQ-MFG/       THIS REPO — manufacturing solution pack — not yet wired to FrontierPlatform
```

---

*FrontierIQ · Proprietary solution design · Frontier Solutions AI*
