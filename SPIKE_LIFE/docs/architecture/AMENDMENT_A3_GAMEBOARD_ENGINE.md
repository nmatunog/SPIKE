# Amendment A3 — Gameboard Engine

**Status:** Canonical (extends Bible; does not replace Amendment A0)

**Authority:** Amendment A0 remains constitutional. The Gameboard Engine is a **presentation and orchestration layer** — never the Financial Decision Engine.

---

## Two layers

### Layer 1 — Financial Decision Engine

Responsible for: financial calculations, FNA, recommendations, decision evaluation, consequences, reflection, life score, business rules. **Deterministic.**

### Layer 2 — Gameboard Engine

Responsible for: board layout, spaces, dice, player movement, turns, encounter triggering, game pacing, player tokens, game state. **Never performs financial calculations.**

---

## Relationship

1. Player rolls dice → moves token → lands on space  
2. Gameboard raises `SituationTriggered`  
3. Financial Decision Engine runs the canonical loop (Discovery → FNA → Decision → Consequence → Reflection)  
4. Gameboard advances turn / round on `ReflectionCompleted`

The board never knows cash flow, net worth, protection gap, FNA, or recommendations.

---

## Bounded context

**Gameboard Context** (`packages/domain/src/gameboard/`)

| Artifact | Location |
|----------|----------|
| `Board` aggregate | `aggregates/board.ts` |
| Gameboard events | `events/gameboard-events.ts` |
| Encounter deck | `services/encounter-deck.ts` |
| Default 16-space track | `services/default-board-layout.ts` |
| Orchestrator (board ↔ simulation) | `board-orchestrator.ts` |
| CQRS | `BoardCommandBus`, `BoardQueryBus` |

### Gameboard domain events

`DiceRolled`, `PlayerMoved`, `PlayerLanded`, `SituationTriggered`, `DecisionPhaseStarted`, `DecisionSubmitted`, `OutcomeResolved`, `ReflectionCompleted`, `TurnCompleted`, `RoundCompleted`

### Space types

Career, Finance, Opportunity, Risk, Family, Health, Business, Investment, Education, Life Event, Milestone, Rest, Bonus, Community — each maps to an encounter card that routes to a `ScenarioId` for the Financial Decision Engine.

---

## Educational guardrail

Dice determines **pacing** (which situation), not financial success. Good outcomes always flow from the Financial Decision Engine.

Every completed turn teaches one financial planning concept (via encounter `learningConcept`). Every completed round advances the workshop year via `RoundCompleted` → simulation `advanceTurn()`.

---

## UI

Solo mode (`LifeWorkspace`) uses:

- **Center:** spatial board, dice, encounter card  
- **Right:** Financial Decision Engine lenses (situation, FNA, decision, reflection)  
- **Top / bottom:** player dashboard and financial snapshot  

Board remains visible throughout gameplay.
