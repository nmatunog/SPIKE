# Gameplay Summary v1.0

**Status:** Approved for MVP Foundation

---

## 1. Core Vision

SPIKE LIFE is **not** a budgeting app, spreadsheet, or financial calculator. It is a **multiplayer financial decision strategy game** where players experience life, make financial decisions under uncertainty, and live with the consequences.

The objective is **not to become the richest player**. The objective is to build the **most financially balanced life**.

---

## 2. Target Audience

**Primary Launch (Philippines):** College students, young professionals, families, financial advisors, universities, financial wellness programs.

**Future:** Additional country-specific Financial Worlds.

---

## 3. Game Length

| Setting | Value |
|--------|--------|
| Target duration | 45–60 minutes |
| Players | **2–6** (recommended: 4) |
| Campaign length | 10 years |

---

## 4. Time Progression

Semi-annual **Planning Cycles** (six months each). Each year: Cycle 1 (Jan–Jun), Cycle 2 (Jul–Dec), then 13th month pay, annual planning, age +1. Full game: **10 years · 20 planning cycles**.

---

## 5. Game Flow

Game Start → Sign-in / Join → Avatar & Name → **Random persona assignment** → Starting career (from persona) → Life Blueprint (Dream Board) → Simulation (20 cycles) → End Game → Life Summary → Winner (Life Score).

---

## 6. Life Blueprint (Dream Board)

Players define home, travel, business, retirement, optional child education, and automatic emergency fund (6× monthly income) goals. Philippine defaults and inflation-adjusted future values are computed by the Financial Engine.

---

## 7–24. Core Mechanics

See approved GDS sections: Philippine economic assumptions, financial planning framework, emergency fund, life domain board, situation engine, player decisions, decision timer, auto-advisor on timeout, consequences, goal trade-offs, 13th month pay, Philippine flavor, annual checkpoints, simultaneous multiplayer, Life Score winning, design and UX principles.

---

## 25. MVP Success Criteria

- Rules understood in under 5 minutes
- Planning cycle ~30 seconds
- 4-player game ~45–60 minutes
- Simultaneous play keeps everyone engaged
- Learning emerges from decisions, not lectures

---

## MVP Implementation Notes (engineering)

| GDS element | MVP status |
|-------------|------------|
| 2–6 workshop players | **Shipped** (`GAME_ROOM_MIN_PLAYERS` / `GAME_ROOM_MAX_PLAYERS`) |
| Random unique persona at join | **Shipped** (6 PH archetypes in content pack) |
| Year loop / life domains | **Partial** (annual cycle + domain reveal UI) |
| 20 semi-annual planning cycles | Planned |
| Dream board | Planned |
| Decision timer + auto-advisor | Planned |
| 13th month pay event | Planned |
| Life Score end-game UI | Partial (scoring exists; full summary UI planned) |

Personas are assigned automatically at join (workshop) or session create (solo) so players cannot all pick the same starting profile.

---

## Implementation roadmap

Phased engineering plan: **[IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md)** — sequenced deliverables from Phase 0 (shipped) through MVP gate.
