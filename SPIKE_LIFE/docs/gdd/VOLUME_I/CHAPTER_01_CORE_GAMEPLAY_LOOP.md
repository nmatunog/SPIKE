# Volume I — Chapter 1: Core Gameplay Loop

**SPIKE LIFE™ Game Design Document**

---

## Purpose

Define the atomic unit of play: **one year** of a character’s financial life. Everything else in Volume I supports this loop.

---

## Canonical loop (Amendment A5 v1.1)

```text
NEXT YEAR
  ↓
Life Domains animate
  ↓
One domain is selected (age-weighted from content pack)
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

---

## Player experience goals

| Phase | Player feels | Learns |
|-------|--------------|--------|
| Domain animation | Anticipation, “where will life hit me?” | Life is uncertain; planning still matters |
| Situation | Recognition (“that happened to me / my client”) | Events have financial structure |
| FNA | Clarity | Diagnose before prescribing |
| Decision | Agency with constraint (one choice) | Trade-offs are real |
| Consequence | Feedback | Actions have numeric and narrative results |
| Hidden echo | Curiosity | Short-term wins can have long-term costs |
| Next year | Progression | Compounding choices over a life |

---

## Session structure

- **Solo:** 5-year workshop track (configurable `maxRounds`) with domain grid + spatial board.
- **Workshop:** Up to 6 players; facilitator advances macro turns after all complete reflection.
- **One encounter per year** — no multi-decision years in MVP.

---

## What random selection does NOT do

Domain and situation selection **never** determine financial success, net worth, or protection adequacy. They only **select the situation** for the year.

---

## Implementation

| Concern | Location |
|---------|----------|
| Year pacing | `Board.boardYear`, `roundNumber` |
| Domain grid & weights | `content-philippines/year-loop.json` → `year-loop/domain-weights.ts`, `DomainGridBoard.jsx` |
| Loop orchestration | `rollBoardAndTriggerSituation`, `endBoardTurn` |
| Age +1 per year | `ageForSimulationYear`, `Simulation.advanceTurn` |
| FDE micro-cycle | `Simulation.presentSituation` → `completeDiscovery` → `recordDecision` → `completeReflection` |
| UI stepper | `YEAR_LOOP_STEPS` in `apps/web/src/content/learning-beats.js` |

---

## Related documents

- [Amendment A5 — Year Loop](../../architecture/AMENDMENT_A5_YEAR_LOOP.md)
- [Chapter 2 — Dice Engine](./CHAPTER_02_DICE_ENGINE.md) (internal selectors; player UX is domain grid)

---

*End of Chapter 1*
