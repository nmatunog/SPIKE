# SPIKE LIFE™

**Financial Decision Simulator** — major initiative under SPIKE ASC.

## Phase 1 status

**Financial Decision Engine validated** — Promotion scenario completes full planning cycle in domain tests.

```bash
cd SPIKE_LIFE
npm install
npm test          # domain + CQRS tests
npm run build:packages
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
npm run dev   # http://localhost:5174
```
