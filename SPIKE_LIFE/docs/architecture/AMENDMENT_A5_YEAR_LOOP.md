# Architecture Amendment A5 — Year Loop

**Version:** 1.1  
**Status:** Mandatory  
**Authority:** Extends A3 (Gameboard) and A4 (Content); Financial Decision Engine owns consequences.

---

## Canonical loop (player-facing)

Each **year** of play follows this sequence:

```text
NEXT YEAR
  ↓
Life Domains animate
  ↓
One domain is selected from the curriculum path
  ↓
Situation card appears
  ↓
Financial Needs Analysis (advisor step)
  ↓
Player chooses ONE decision
  ↓
Immediate consequence
  ↓
Hidden long-term consequence recorded
  ↓
Reflection (learning lock-in)
  ↓
Age increases
  ↓
Repeat
```

Dice are **not** shown to the player. Category + situation selection run internally as one engine step; the UI presents a single ~3s reveal: domain flash → situation shuffle → decision card.

---

## Layer responsibilities

| Step | Owner |
|------|--------|
| Domain selection | Gameboard Engine (`year-loop/domain-grid.ts`) |
| Situation card | Content pack + encounter deck → FDE `presentSituation` |
| ONE decision | Financial Decision Engine |
| Immediate consequence | FDE `consequence-engine` |
| Hidden long-term consequence | FDE `long-term-consequence-engine` (stored, revealed later) |
| Advance one year + age +1 | Gameboard `endTurn` + Simulation `advanceTurn` |

The board never calculates finances. Random selection determines **which** situation fires, not whether the player succeeds.

---

## Domain grid

- **12 tiles (4×3)** — defined in content pack `yearLoop.domains` (Philippines MVP: Career, Business, Income & Finance, …).
- **`selectWeightedLifeDomain(age)`** — reads `yearLoop.weightBands`; persisted as `selectedDomainId` on `BoardState`.
- **`pickWeightedEncounter(domainId, age)`** — engine encounter deck + `yearLoop.encounterWeightOverrides`.
- **Advisor insight** — `yearLoop.advisorInsightProbability` (~27% default); optional FNA nudge before decision.

Both domain and situation outcomes are persisted on `BoardState` and emitted as gameboard events (`DOMAIN_SELECTED`, `SITUATION_DIE_ROLLED`).

Facilitators tune weights in `@spike-life/content-philippines` → `src/data/year-loop.json` without engine changes.

---

## Age progression

- `SimulationState.startingAge` — character age at year 1.
- Each completed year: `age = startingAge + (simulationYear - 1)` (+1 per year).
- Life stages (Launch → Legacy) still map to workshop turns for curriculum pacing.

---

## Hidden consequences

Every decision records a **hidden** long-term consequence with a future reveal year. Players see immediate outcomes; delayed effects surface when the simulation year catches up — teaching that short-term choices echo across years.

---

## UI turn flow

Educational UI mirrors the loop: Year → Domain animation → Situation → FNA → Decision → Consequence → (hidden recorded) → Next year.

FNA / discovery remains between **Situation** and **Decision** (advisor workflow).

---

*End of Architecture Amendment A5*
