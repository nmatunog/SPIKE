# SPIKE LIFE™

**Financial Decision Simulator** — major initiative under SPIKE ASC.

**Design authority:** [GDS v1.0](docs/gdd/GDS_v1.0/SPIKE_LIFE_GDS_v1.0.pdf) (499 pp)  
**Technical design:** [Realignment Design](docs/design/GDS_v1_REALIGNMENT_DESIGN.md) (read before coding)  
**Build vs spec:** [Gap analysis](docs/gdd/GDS_v1_GAP_ANALYSIS.md) · [Realignment phases](docs/gdd/GDS_v1_REALIGNMENT_PHASES.md)

## Phase 1 status

**Financial Decision Engine validated** — Promotion scenario completes full planning cycle in domain tests.

**Workshop macro turns (Phase 1)** — 5-turn life journey board: Launch → Build → Grow → Lead → Legacy. Complete a scenario cycle, then **Advance to next turn**; financial progress carries forward.

**Multi-player GameRoom (Phase 2)** — Up to 6 players per workshop room; shared scenario per macro turn; parallel planning with per-player `Simulation` aggregates.

**Workshop board UI (Phase 3)** — 6-token board, facilitator panel, room HUD, solo/workshop mode switch.

```bash
cd SPIKE_LIFE
npm install
npm test          # domain (30) + application (9)
npm run dev       # http://localhost:5174
```

## Monorepo layout

```text
SPIKE_LIFE/
  apps/web/              # Thin presentation shell (Phase 2 expands)
  packages/
    domain/              # Financial Decision Engine — SOURCE OF TRUTH
    application/         # CQRS command/query buses
    infrastructure/      # In-memory repository (Neon later)
    shared/              # Type re-exports
    ui/                  # Phase 2+ components
  docs/architecture/     # A0, blueprints, alignment memo
```

## Architecture

Start with [`docs/architecture/ARCHITECTURE_ALIGNMENT_MEMO.md`](./docs/architecture/ARCHITECTURE_ALIGNMENT_MEMO.md) and [`A0_CORE_DESIGN_REORIENTATION.md`](./docs/architecture/A0_CORE_DESIGN_REORIENTATION.md).

## Promotion cycle (domain API)

```text
createPromotionSession → presentPromotionSituation → completeDiscovery
  → submitDecision → submitReflection → cycle_complete
```

Implemented in `@spike-life/domain` — see `promotion-cycle.test.ts`.

## Dev UI

```bash
npm run dev
```

Open **http://localhost:5174**
