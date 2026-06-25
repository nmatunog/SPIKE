# SPIKE LIFE™

Major initiative under the **SPIKE ASC Platform**.

SPIKE LIFE is the world's first **Financial Decision Simulator** — not a life game, budgeting app, or literacy quiz.

## Architecture (start here)

| Document | Purpose |
|----------|---------|
| [`docs/architecture/ARCHITECTURE_ALIGNMENT_MEMO.md`](./docs/architecture/ARCHITECTURE_ALIGNMENT_MEMO.md) | **Synthesis & MVP scope** — approve before coding |
| [`docs/architecture/A0_CORE_DESIGN_REORIENTATION.md`](./docs/architecture/A0_CORE_DESIGN_REORIENTATION.md) | Constitutional amendment (highest authority) |
| [`docs/architecture/README.md`](./docs/architecture/README.md) | Full document registry & priority order |

## Status

**Architecture alignment** — documents ingested; awaiting memo approval before domain implementation.

## Local development (bootstrap shell)

```bash
cd SPIKE_LIFE
npm install
npm run dev   # port 5174
```

The current Vite scaffold is a placeholder. MVP implementation begins with `@spike-life/domain` (TypeScript), not UI features.

## Parent platform

- SPIKE Portal: [`../README.md`](../README.md)
- SPIKE FNA (real client work) is a **separate bounded context** from SPIKE LIFE simulated FNA.
