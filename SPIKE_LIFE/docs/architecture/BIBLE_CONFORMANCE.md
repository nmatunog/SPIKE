# SPIKE LIFE™ — Bible Conformance (Phase 2–3)

**Date:** 2026-06-26  
**References:** A0, A1, A2, Volume I Chapters 1–4

---

## Phase 2 — GameRoom (multi-player workshop)

### Aligned

| Bible requirement | Implementation |
|-------------------|----------------|
| Player owns many Simulations (Ch3) | Each slot → `simulationId` workshop session |
| Shared situation per macro turn | `GameRoom.startTurn(scenarioId)` |
| Parallel player actions | `submitPlayerDecision` / `submitPlayerReflection` per `playerId` |
| Up to 6 players | `GAME_ROOM_MAX_PLAYERS = 6`, slot colors |
| Facilitator advances turn | `advanceRoomTurn` when all slots `done` |
| CQRS read model | `GetGameBoard` → `GameBoardView` with 10 tokens |
| In-memory persistence | `InMemoryGameRoomRepository` |

### Partial (Phase 4+)

| Bible requirement | Gap |
|-------------------|-----|
| Hono API + Neon | In-memory repos (browser session) |
| Realtime sync | Manual refresh / same-tab demo |
| SPIKE Portal auth | Local facilitator/player lobby |

---

## Phase 3 — Workshop board UI

### Aligned

| Bible requirement | Implementation |
|-------------------|----------------|
| 6-token board UI | `WorkshopBoard` + `PlayerToken` on current life stage |
| Facilitator controls | `FacilitatorPanel` — add interns, start mission, advance turn |
| Room HUD | `WorkshopScoreHud` — completion %, selected player score |
| Per-player lenses | `WorkshopWorkspace` — Plan/Protect/Grow/Journey per slot |
| Solo vs workshop | `App.jsx` mode switch + `WorkshopLobby` |

---

## Phase 3 (prior) — Scenario 2 + Domain Hardening

### Aligned

| Bible requirement | Implementation |
|-------------------|----------------|
| `Simulation` aggregate with behavior methods (Ch3 §18) | `Simulation` class: `presentSituation()`, `completeDiscovery()`, `recordDecision()`, `completeReflection()` |
| Domain events on transitions (Ch2, A2) | `pullDomainEvents()` emits `LifeEventApplied`, `DecisionRecorded`, `LifeScoreUpdated`, etc. |
| `Money` value object (Ch4) | `value-objects/money.ts` — immutable peso amounts |
| Protection stress scenario | `protection_stress` — event H016, young family archetype |
| Solution language in UI | Protection lens + decision cards use plan categories |
| CQRS commands per scenario | `startCycle`, `startProtectionStressCycle` |
| Read models | `GetDashboard` includes `scenarioId` / `scenarioLabel` |

### Partial (next)

| Bible requirement | Gap |
|-------------------|-----|
| Eight bounded context folders | Still single domain package |
| Hono API + Neon | In-memory browser repo |
| `Player` / `Report` aggregates | Not yet |
| Full Journey entity | Timeline projected from session state |

---

## Test coverage

| Package | Tests |
|---------|-------|
| `@spike-life/domain` | 30 (8 promotion + 7 protection + 7 workshop + 7 game-room + 1 orchestrator) |
| `@spike-life/application` | 9 |

```bash
cd SPIKE_LIFE && npm test
npm run dev
```

Then open http://localhost:5174

---

*End of Bible Conformance — Phase 2–3*
