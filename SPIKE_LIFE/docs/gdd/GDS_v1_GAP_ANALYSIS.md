# SPIKE LIFE™ — GDS v1.0 Gap Analysis

**Authority:** [GDS v1.0 PDF](./GDS_v1.0/SPIKE_LIFE_GDS_v1.0.pdf)  
**Compared against:** `main` branch as of 2026-06-29  
**Companion:** [GDS v1 Realignment Phases](./GDS_v1_REALIGNMENT_PHASES.md)

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ **Aligned** | Meets GDS MVP intent; minor polish may remain |
| 🟡 **Partial** | Core exists; spec gaps block MVP acceptance |
| 🔴 **Missing** | Not implemented or contradicts GDS |
| ⏸️ **Deferred** | Explicitly out of MVP per GDS Ch 1 §13 |

---

## Executive summary

SPIKE LIFE has a **solid architectural foundation** aligned with GDS Volume V (CQRS, domain-first, content packs). The **Financial Decision Engine** and **year-loop domain selection** are real and tested. However, the **player-visible experience** still diverges from GDS v1.0 in four critical areas:

1. **Session length** — Workshop plays **5 macro turns**, not GDS **20 planning cycles / 10 years** (campaign config exists but is not the playable default).
2. **Situation depth** — Only **2 runtime scenarios** (`promotion`, `protection_stress`) plus a hardcoded encounter deck; GDS requires **large per-domain situation pools** (Ch 4–5).
3. **Workshop parity** — Solo mode has timer, calendar events, and life summary; **workshop mode lacks** timer expiry, 13th-month UI, annual checkpoint, and multi-player winner ceremony.
4. **Production multiplayer** — GDS Ch 12 requires synchronized simultaneous play across devices; current build is **in-memory, same-browser demo**.

**Estimated alignment:** ~45% of MVP-scope GDS chapters are Partial or better; ~25% Aligned end-to-end; ~30% Missing or Deferred-by-design.

---

## Volume I — Gameplay Foundation

### Ch 1 — Vision & Design Philosophy ✅ Aligned

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Life first, finance second | A0 amendment, advisor copy, dream board | — |
| Learning through experience | FNA hidden; players see situation → decision → consequence | — |
| Simplicity on surface | No manual % allocation in UI | — |
| Philippine authenticity | PH content pack, 6 archetypes | Seasonal flavor events not yet in play |
| Life Score ≠ richest wins | `life-score-engine.ts` multi-dimension | Workshop doesn't crown winner |

### Ch 2 — Core Gameplay Loop 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Launch → sign-in → join → avatar → persona → dream board → 20 cycles → summary → winner | Solo + workshop flows exist | No Portal auth; no avatar picker; **5 turns** not 20 |
| 2–6 players, simultaneous | `GameRoom`, parallel `submitPlayerDecision` | No cross-device sync |
| Host configures timer, difficulty, age | `campaign.json` timer default 15s | **No facilitator lobby controls** |
| One decision per planning cycle | `recordDecision()` single choice | ✅ |
| 45–60 min session | Not validated | No playtest data |
| ~30s per planning cycle | Timer exists solo | Workshop timer not wired |

### Ch 3 — Planning Cycle Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| FSM: init → domain → situation → timer → decision → engine → reveal → complete | `simulation.ts` state transitions | Not a formal exported FSM; workshop skips domain reveal path |
| 20 cycles / 10 years | `campaign.json` `maxCycles: 20` | `maxTurns: 5` in workshop progression |
| Semi-annual labels (Jan–Jun, Jul–Dec) | `planning-cycle.ts`, `cycleLabel` on dashboard | ✅ |
| All players synchronized before processing | Workshop waits for all `done` | Same-browser only |
| Animations ≤ 3s | `YearRevealSequence`, board animations | Workshop uses stage track, not domain grid |
| Deterministic after decisions locked | Domain tests | ✅ |

### Ch 4 — Life Domain Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| 12 fixed domains, board is dashboard not track | `year-loop.json` 12 domains, `DomainGridBoard` | Workshop uses `StageTrack` life stages instead |
| Weighted selection by age, career, goals | `domain-weights.ts`, age bands in pack | Goal-based weighting partial |
| Domain cooldown / diversity | `situation-shuffle.ts` | Cooldown not fully per GDS spec |
| 2–3s selection animation | `YearRevealSequence` | Workshop path missing |
| Pos/neg/opportunity balance (~35/30/20/15) | Not implemented | Event intensity levels missing |
| Data-driven (JSON, no engine change) | `year-loop.json` | Encounter deck still in domain TS |

### Ch 5 — Situation Engine 🔴 Missing (MVP depth)

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Large pool per domain (≥25 career situations in spec examples) | `encounter-deck.ts` ~33 cards hardcoded | Not in content pack |
| 5 event classes (positive, negative, opportunity, crisis, milestone) | Partial tagging in deck | Not systematic |
| `life-situations.json` 18 PH narratives | Catalog only | **Not wired** to `presentSituation()` |
| Only 2 scenarios at runtime | `promotion`, `protection_stress` | GDS requires full domain-driven situations |
| Encounter card: title, illustration, 3 choices | `EncounterModal`, `EncounterCardPanel` | Panel built but **not imported** in main flow |
| Philippine flavor (typhoon, Christmas, OFW) | IDs in `life-situations.json` | Not playable |

### Ch 6 — Decision Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Exactly one major decision per cycle | ✅ | — |
| Three strategy choices (Secure / Balanced / Enjoy) | Decision cards in lenses | Wording varies by scenario |
| Timer: off, 20, 15, 10, 5s | `campaign.json` preset `"15"` | Facilitator cannot change |
| Auto-advisor on expiry (not random) | `auto-advisor.ts` | **Workshop not wired** |
| Advisor pauses timer (max 20s consult) | `AdvisorInsightPrompt` | **No timer pause** |
| Decision lock (no undo) | ✅ | — |

---

## Volume II — Financial Engine

### Ch 7 — Financial Planning Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Cash flow, expenses, savings, EF, protection, goals, inflation, debt | `fna-engine.ts`, `financial-decision-engine.ts` | Business performance shallow |
| Hidden calculations | ✅ UI shows outcomes not formulas | — |
| Living financial model updates each decision | `Simulation` aggregate | ✅ |

### Ch 8 — Goal Engine ✅ Aligned

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Dream board: home, travel, business, retirement, child edu, EF auto | `dream-board.ts`, `DreamBoardSetup.jsx` | Workshop auto-defaults (acceptable per workshop compression) |
| Inflation-adjusted future values | `dream-board.ts` | ✅ |
| Blocks planning until complete | `financial-decision-engine.ts` | ✅ |

### Ch 9 — Wealth Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Investment growth, asset tracking | `financial-state.ts` | No stocks/bonds/MF granularity in MVP UI |
| Wealth can be lost | Consequence engine | Limited scenario coverage |

### Ch 10 — Risk & Protection Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Protection before wealth lesson | `protection_stress` scenario | Only one protection-focused path |
| Hidden delayed consequences | `long-term-consequence-engine` (if present) | Limited trigger set |
| Insurance pays on future hospitalization | Partial | Needs situation pack depth |

### Ch 11 — Advisor Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Guide not instructor | Copy in `AdvisorInsightPrompt`, `FnaExplainer` | ✅ |
| Auto-advisor balanced pick | `auto-advisor.ts` | Solo only |
| Never forces decision | ✅ | — |
| Trade-off explanation before decide | Partial in lenses | Not full GDS consult flow |

---

## Volume III — Game Systems

### Ch 12 — Multiplayer Engine 🔴 Missing (production)

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Simultaneous decisions, no sequential turns | Workshop parallel submit | ✅ in logic |
| Game code join | `WorkshopLobby`, `GameCodeBadge` | In-memory, no server |
| Timer sync across clients | — | **Missing** |
| Room survives refresh | — | **Missing** |
| SPIKE Portal auth for facilitator | — | **Missing** |

### Ch 13 — Life Score Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| 5 dimensions: security, protection, goals, wealth, stability | `life-score-engine.ts` | ✅ |
| Winner = highest Life Score | `computeCampaignLifeSummary()` | **Not wired** to workshop UI |
| End screen: dimension breakdown, life story | `LifeSummaryScreen.jsx` | Solo only; **no radar chart** |
| Richest player may not win | Engine supports | Not demonstrated in workshop |

### Ch 14 — Difficulty Engine ⏸️ Deferred

Host difficulty config mentioned in GDS Ch 2; not MVP-critical. `campaign.json` has no difficulty presets.

### Ch 15 — Randomization Engine 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Weighted random, not uniform | `domain-weights.ts`, dice services | ✅ |
| Situation diversity, no streaks | Partial shuffle | Pos/neg balance missing |
| Replayability via goals, age, decisions | Archetypes + dream board | Thin situation pool limits replay |

---

## Volume IV — UX & Presentation

### Ch 16–18 — UX / Screens / Animation 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Five lenses navigation | `LensNav`, Life/Plan/Protect/Grow/Journey | ✅ |
| Financial health meter (Excellent → Critical) | Partial in HUD | Not full 5-level indicator |
| Consequence reveal with green/red deltas | Partial | Not consistent all screens |
| Rules understood < 5 min | `OnboardingRulesCard` solo | **Not in workshop lobby** |
| Animations ≤ 3s, responsive | Board kit | Workshop stage track diverges from GDS board |
| Unified game status bar | — | Split `BoardHUD` + `FinancialHUD` |
| Audio cues per domain | — | **Missing** |

---

## Volume V — Technical Architecture

### Ch 19 — Software Architecture ✅ Aligned

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Domain layer = business logic | `@spike-life/domain` | ✅ |
| CQRS | `command-bus.ts`, query buses | ✅ |
| Content separable from engine | `@spike-life/content-philippines` | Encounter deck still in domain |
| Deterministic simulation | Domain tests | ✅ |

### Ch 20 — Data Architecture 🔴 Missing

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Persistent game rooms | `InMemoryGameRoomRepository` | Browser session only |
| Security, RLS, no PII beyond display names | — | Not built for SPIKE LIFE |
| Cloud save, cross-device | — | Post-MVP per GDS but needed for classroom |

---

## Volume VI — Content Framework

### Ch 21 — Content Architecture 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Financial World as pack | `content-philippines` | ✅ |
| No financial math in JSON | Validation in content-core | ✅ |
| Institutions (SSS, PhilHealth, Pag-IBIG) | `institutions.json` | Not surfaced in all situations |

### Ch 22 — Career System 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Careers influence situations | 6 archetypes, random unique assign | No promotion probability / growth curves per GDS tables |
| Starting income from career | Archetype profiles | ✅ |

### Ch 23 — Situation Library 🔴 Missing

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| Situations in content pack, not code | `encounter-deck.ts` in domain | **Must migrate** |
| ≥ 5 situations per active domain | ~33 total hardcoded | Insufficient |
| Authoring system | — | Post-MVP (Ch 24 FWAT deferred) |

### Ch 24 — FWAT ⏸️ Deferred

Per GDS MVP exclusions.

---

## Volume VII — Operations & Platform

### Ch 25–26 — AI & Analytics ⏸️ Deferred

GDS Ch 1 §13 excludes AI-generated scenarios from MVP. Analytics framework is post-MVP.

### Ch 27 — DevOps 🟡 Partial

| GDS requirement | Build evidence | Gap |
|-----------------|----------------|-----|
| CI test + build | `npm test` in SPIKE_LIFE | ✅ |
| Deploy spike-life standalone | — | Dev UI on :5174 only |
| API worker deploy | — | Missing |

### Ch 28 — Roadmap

Captured in [GDS_v1_REALIGNMENT_PHASES.md](./GDS_v1_REALIGNMENT_PHASES.md).

---

## Critical defects (fix before MVP gate)

These are **spec violations**, not polish items:

| # | Defect | GDS ref | Code location |
|---|--------|---------|---------------|
| D1 | 13th month adds cash but **allocation strategy never applied** | Ch 3 §24 | `calendar-events.ts` `allocationToStrategy()` unused |
| D2 | Workshop `PlanLens` has **no `onTimerExpire`** | Ch 3 §12–13 | `WorkshopWorkspace.jsx` |
| D3 | `computeCampaignLifeSummary()` **not wired** to end game | Ch 13 | `campaign-life-score.ts` vs `WorkshopWorkspace.jsx` |
| D4 | `presentSituation()` driven by **2 scenario IDs**, not domain year-loop | Ch 5 | `situation-engine.ts` |
| D5 | Encounter deck in **domain code**, not content pack | Ch 4 §21, A4 | `encounter-deck.ts` |
| D6 | Playable length **5 turns** vs **20 cycles** | Ch 2 §9 | `workshop-progression.ts`, `campaign.json` |

---

## Mode comparison (solo vs workshop vs GDS)

| Capability | GDS | Solo build | Workshop build |
|------------|-----|------------|----------------|
| 20 planning cycles | Required (campaign) | Config only; plays 5 | 5 macro turns |
| Domain grid reveal | Required | ✅ | ❌ (stage track) |
| Decision timer + auto-advisor | Required | ✅ | ❌ |
| 13th month allocation UI | Required | ✅ modal | ❌ |
| Annual checkpoint | Required | ✅ | ❌ |
| Life summary + winner | Required | Solo only | Banner only |
| 6 random personas | Required | ✅ | ✅ |
| Dream board | Required | Interactive | Auto-default |
| Cross-device multiplayer | Required (classroom) | N/A | ❌ |

---

## Document drift

| Document | Issue | Action |
|----------|-------|--------|
| `GAMEPLAY_SUMMARY_v1.md` MVP table | Marks dream board, timer as "Planned" | Update to point at GDS v1.0 + gap analysis |
| `IMPLEMENTATION_PHASES.md` | Phases 3–4 acceptance unchecked but code partially exists | Superseded by realignment phases |
| `VOLUME_I/` chapters | Subset of GDS Vol I only | Cross-link to GDS v1.0 index |
