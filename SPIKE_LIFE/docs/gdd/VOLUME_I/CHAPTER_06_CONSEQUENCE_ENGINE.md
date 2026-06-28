# Volume I — Chapter 6: Consequence Engine

**SPIKE LIFE™ Game Design Document**

---

## Purpose

Apply the player’s **one decision** to financial state and produce **immediate** feedback plus **hidden long-term** records.

---

## Two-layer consequences

### Immediate (visible)

Applied in `consequence-engine` when decision is recorded:

- Updates `FinancialProfile`, `ProtectionPortfolio`, `GoalPortfolio`
- Computes `DecisionQuality`: excellent · good · needs_attention · high_risk
- Narrative + quality explanation for UI
- FNA score delta (before vs after decision)

Player sees cash flow, protection, and Life Score impact in the same session.

### Hidden long-term (delayed)

Recorded in `long-term-consequence-engine` on every decision:

- Stored on `SimulationState.hiddenLongTermConsequences`
- Each record has `revealsAtYear` (typically year + 2–3)
- **Not shown** until simulation year catches up at year advance
- Severity: positive · neutral · negative

Teaches that some choices echo years later (lifestyle inflation, protection lag, etc.).

---

## Decision quality logic (summary)

Quality weighs:

- Alignment with top FNA recommendations
- Gap closure (protection, emergency fund, debt)
- Scenario-specific risk (e.g. lifestyle creep on promotion)

---

## Year advance

When the board completes a round (`endBoardTurn`):

1. Reveal due hidden consequences for new `boardYear`
2. Advance workshop simulation turn (`advanceTurn`) preserving profile progress

---

## Design guardrail

Consequences are **deterministic** given state + strategy + scenario. Dice do not re-roll outcomes.

---

## Implementation

`consequence-engine.ts` · `long-term-consequence-engine.ts` · `applyYearEndHiddenReveal()`
