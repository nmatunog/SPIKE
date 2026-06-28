# Volume I — Chapter 5: Decision Engine

**SPIKE LIFE™ Game Design Document**

---

## Purpose

Each year the player makes **exactly one strategic decision** — the core constraint that forces prioritization like real annual planning.

---

## Decision strategies (MVP)

| Strategy | Player intent |
|----------|---------------|
| `increase_lifestyle` | Spend the raise / windfall on lifestyle |
| `increase_savings` | Build cash reserves |
| `reduce_debt` | Pay down liabilities |
| `improve_protection` | Buy/strengthen protection plans |
| `fund_goals` | Accelerate goal funding |
| `split_allocation` | Balanced split across priorities |
| `maintain_lifestyle_discipline` | Hold expenses, intentional planning |

Valid strategies are **scenario-scoped** (`isValidDecisionStrategy`).

---

## Decision flow

1. Situation presented; FNA and recommendations computed (`completeDiscovery`).
2. Phase → `decision_pending`.
3. Player selects one strategy (optional rationale text).
4. `Simulation.recordDecision()` validates phase and strategy.

---

## Design rules

1. **One decision per year** — no take-backs in MVP.
2. **Recommendations inform, not force** — top FNA gaps suggest best-fit strategies; player may choose differently.
3. **Quality is computed, not chosen** — decision quality comes from consequence engine vs recommendations and gaps.

---

## UI

Plan lens surfaces decision cards with solution language (Build Emergency Fund, Strengthen Family Protection Plan, etc.) mapped from `SolutionCategory`.

---

## Implementation

`decision-engine.ts` · `Simulation.recordDecision()` · `submitDecision()` / board `submitBoardDecision()`
