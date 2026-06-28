# Volume I — Chapter 4: Situation Engine

**SPIKE LIFE™ Game Design Document**

---

## Purpose

Transform dice output + character state into a **Situation** the player must respond to — narrative, learning objective, and financial profile deltas (where applicable).

---

## Pipeline

```text
Category die + Situation die
  → Encounter card (deck)
  → ScenarioId (promotion | protection_stress | …)
  → SituationSnapshot
  → Applied to FinancialProfile (income/expense/cash shocks)
```

---

## Situation snapshot fields

| Field | Role |
|-------|------|
| `title`, `narrative` | Player-facing story |
| `learningObjective` | Educational intent |
| `financialImpactSummary` | Human-readable impact (currency from session config) |
| `incomeMultiplier` / `expenseMultiplier` | Engine-applied profile changes |
| `medicalCostImpact`, `monthlyCareCost` | Protection-stress specific |

---

## Scenario catalog (MVP)

| Scenario | Trigger examples | Core lesson |
|----------|------------------|-------------|
| **Promotion** | Career raise, bonus, marriage windfall | Income allocation, lifestyle inflation |
| **Protection stress** | Medical expense, job loss, inflation shock | Emergency fund vs protection gaps |

Encounter deck maps 15+ narrative titles to these scenario engines.

---

## Content vs engine

| In engine | In content pack (target) |
|-----------|--------------------------|
| Multiplier math, profile application | Event copy, PH-specific amounts |
| Scenario routing | Full event library (Blueprint v2.1) |
| `createPromotionSituation()` | JSON life situations per world |

---

## Discovery phase

After situation presentation, **Discovery** (`discovery-engine`) answers advisor questions: what changed, risks, opportunities, priorities — grounded in updated profile numbers.

---

## Implementation

`situation-engine.ts` · `encounter-deck.ts` · `Simulation.presentSituation()` · `startPlanningCycle()`
