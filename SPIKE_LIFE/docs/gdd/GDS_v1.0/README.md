# SPIKE LIFE™ — Game Design Specification (GDS) v1.0

**Status:** Approved — constitutional design authority  
**Document version:** 1.0  
**Pages:** 499 (28 chapters, 7 volumes)  
**Audit date:** 2026-06-29

---

## Canonical source

| Document | Purpose |
|----------|---------|
| **Authoritative PDF** | [`SPIKE_LIFE_GDS_v1.0.pdf`](./SPIKE_LIFE_GDS_v1.0.pdf) |
| **Searchable extract** | [`GDS_v1.0_extracted.txt`](./GDS_v1.0_extracted.txt) (machine text; OCR artifacts possible) |
| **Technical design (pre-code)** | [`GDS v1 Realignment Design`](../design/GDS_v1_REALIGNMENT_DESIGN.md) |
| **Gap analysis** | [`GDS_v1_GAP_ANALYSIS.md`](../GDS_v1_GAP_ANALYSIS.md) |
| **Delivery phases** | [`GDS_v1_REALIGNMENT_PHASES.md`](../GDS_v1_REALIGNMENT_PHASES.md) |

This PDF supersedes informal summaries where they conflict. Engineering summaries (`GAMEPLAY_SUMMARY_v1.md`, `VOLUME_I/` chapters) remain useful indexes but **GDS v1.0 wins on conflict**.

---

## Volume & chapter index

### Volume I — Gameplay Foundation

| Ch | Title | MVP | Engineering map |
|----|-------|-----|-----------------|
| 1 | Vision & Design Philosophy | Yes | `.cursor/rules/spike-life-architecture.mdc`, `A0_CORE_DESIGN_REORIENTATION.md` |
| 2 | Core Gameplay Loop | Yes | `apps/web`, `game-room-orchestrator.ts`, `LifeWorkspace.jsx` |
| 3 | Planning Cycle Engine | Yes | `planning-cycle.ts`, `simulation.ts`, `campaign.json` |
| 4 | Life Domain Engine | Yes | `year-loop.json`, `DomainGridBoard.jsx`, `YearRevealSequence.jsx` |
| 5 | Situation Engine | Yes | `situation-engine.ts`, `encounter-deck.ts`, content pack |
| 6 | Decision Engine | Yes | `decision-engine.ts`, `DecisionTimerRing.jsx`, `PlanLens.jsx` |

### Volume II — Financial Engine

| Ch | Title | MVP | Engineering map |
|----|-------|-----|-----------------|
| 7 | Financial Planning Engine | Yes | `fna-engine.ts`, `financial-decision-engine.ts` |
| 8 | Goal Engine | Yes | `dream-board.ts`, `DreamBoardSetup.jsx` |
| 9 | Wealth Engine | Partial | `financial-state.ts`, investment projections |
| 10 | Risk & Protection Engine | Yes | `protection_stress` scenario, protection portfolio |
| 11 | Advisor Engine | Yes | `auto-advisor.ts`, `AdvisorInsightPrompt.jsx` |

### Volume III — Game Systems

| Ch | Title | MVP | Engineering map |
|----|-------|-----|-----------------|
| 12 | Multiplayer Engine | Yes | `game-room.ts`, `WorkshopLobby.jsx`, `WorkshopWorkspace.jsx` |
| 13 | Life Score Engine | Yes | `life-score-engine.ts`, `campaign-life-score.ts`, `LifeSummaryScreen.jsx` |
| 14 | Difficulty Engine | Deferred | Not implemented — host config stub only |
| 15 | Randomization Engine | Partial | `year-loop/` dice + weights; full event pools missing |

### Volume IV — UX & Presentation

| Ch | Title | MVP | Engineering map |
|----|-------|-----|-----------------|
| 16 | UX Philosophy & Design System | Partial | `PRODUCTION_UI_EXECUTION_PLAN.md`, Tailwind tokens |
| 17 | Screen Specifications & UI Architecture | Partial | `LifeWorkspace.jsx`, `WorkshopWorkspace.jsx` |
| 18 | Animation, Feedback & Interaction System | Partial | `@spike-life/ui` board kit, `BoardAnimation.tsx` |

### Volume V — Technical Architecture

| Ch | Title | MVP | Engineering map |
|----|-------|-----|-----------------|
| 19 | Software Architecture & Engine Design | Yes | CQRS, layered packages, Amendment A1–A5 |
| 20 | Data Architecture, Persistence & Security | Partial | In-memory repos; Neon/API planned |

### Volume VI — Content Framework

| Ch | Title | MVP | Engineering map |
|----|-------|-----|-----------------|
| 21 | Content Architecture & Financial Worlds | Yes | `@spike-life/content-philippines`, Amendment A4 |
| 22 | Career System & Life Progression | Partial | `archetypes.json` (6 personas) |
| 23 | Situation Library & Event Authoring | Partial | `life-situations.json` catalog; not wired |
| 24 | Financial World Authoring Toolkit (FWAT) | Deferred | Post-MVP per GDS Ch 1 §13 |

### Volume VII — Operations & Platform

| Ch | Title | MVP | Engineering map |
|----|-------|-----|-----------------|
| 25 | AI Architecture & Intelligence Framework | Deferred | GDS explicitly excludes AI scenarios in MVP |
| 26 | Analytics, Learning Intelligence & Assessment | Deferred | Post-MVP |
| 27 | Deployment, DevOps & Live Operations | Partial | Portal deploy exists; SPIKE LIFE standalone TBD |
| 28 | Product Roadmap, Governance & Future Vision | Reference | [`GDS_v1_REALIGNMENT_PHASES.md`](../GDS_v1_REALIGNMENT_PHASES.md) |

---

## Related engineering documents

| Document | Purpose |
|----------|---------|
| [`GDS_v1_GAP_ANALYSIS.md`](../GDS_v1_GAP_ANALYSIS.md) | Current build vs GDS v1.0 — shipped / partial / missing |
| [`GDS_v1_REALIGNMENT_PHASES.md`](../GDS_v1_REALIGNMENT_PHASES.md) | Phased plan to close gaps |
| [`IMPLEMENTATION_PHASES.md`](../IMPLEMENTATION_PHASES.md) | Prior engineering phase map (being superseded by realignment) |
| [`GAMEPLAY_SUMMARY_v1.md`](../GAMEPLAY_SUMMARY_v1.md) | Short executive summary of GDS gameplay |
| [`VOLUME_I/README.md`](../VOLUME_I/README.md) | Engineering GDD chapters (subset of Vol I) |

---

## MVP scope (GDS Ch 1 §13 — in scope)

- Philippine Financial World
- Semi-annual planning cycles (20 per 10-year campaign)
- 2–6 players, simultaneous multiplayer
- One major decision per planning cycle
- Automatic financial engine (hidden calculations)
- Fixed 12 life domains
- Annual 13th month planning
- Life Score winner (balanced life, not richest)

## MVP exclusions (GDS Ch 1 §13 — out of scope)

Multiple countries, online multiplayer (beyond classroom sync), AI-generated scenarios, marketplace, campaign editor, user-generated content, advanced investment products, multiplayer trading, real financial product integration, FWAT, analytics platform.
