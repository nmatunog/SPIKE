# Volume I — Chapter 2: Dice Engine

**SPIKE LIFE™ Game Design Document**

---

## Purpose

Two dice cooperate to generate **which domain** and **which specific situation** the player faces each year — without resolving financial outcomes.

---

## Dice types

| Die | Faces | Output |
|-----|-------|--------|
| **Category die** | d6 | Life domain for the year |
| **Situation die** | d6 | Index into encounter pool for that domain |

Both use uniform random 1–6 (`BOARD_DICE_MIN` / `BOARD_DICE_MAX`).

---

## Category die faces

| Roll | Domain | Label |
|------|--------|-------|
| 1 | Career | Career & Income |
| 2 | Finance | Money & Markets |
| 3 | Family | Family & Life |
| 4 | Health | Health & Risk |
| 5 | Business | Business & Opportunity |
| 6 | Education | Growth & Learning |

---

## Situation die resolution

1. Filter encounter deck by category (`spaceTypes` on each card).
2. Map situation roll to pool index: `(roll - 1) % pool.length`.
3. If pool empty, fall back to full deck (safety).

Selected encounter routes to a `ScenarioId` for the Financial Decision Engine.

---

## Board presentation

After both rolls, the player token moves to a board space matching the generated encounter (visual anchor). Movement is **presentation only** — not a separate movement die.

---

## Events emitted

- `CategoryDieRolled`
- `SituationDieRolled`
- `PlayerMoved` / `PlayerLanded`
- `SituationTriggered`

---

## Player-facing UX

- Single **Roll** executes both dice (sequenced internally).
- HUD/stepper exposes `lastCategoryDieRoll` and `lastSituationDieRoll` for teaching clarity.

---

## Future design space

- Weighted category tables by life stage (e.g. more Family in Build phase).
- Content-pack-specific encounter pools per Financial World.
- Optional “reroll” advisor power-ups (not in MVP).

---

## Implementation

`packages/domain/src/gameboard/services/year-loop/category-die.ts`  
`packages/domain/src/gameboard/services/year-loop/situation-die.ts`  
`Board.rollYearSituation()`
