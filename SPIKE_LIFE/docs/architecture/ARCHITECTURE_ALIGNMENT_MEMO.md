# SPIKE LIFE™ — Architecture Alignment Memo

**Version:** 1.0  
**Date:** 2026-06-26  
**Status:** Awaiting approval before implementation  
**Authority chain:** Amendment A0 → this memo → Software Architecture Bible (when provided) → Technical specs → UX → Simulation blueprints → PRD v1.0/v1.1

---

## 1. Executive summary

SPIKE LIFE™ is a **Financial Decision Simulator**. Life situations provide context; **Financial Needs Analysis (FNA)** is the educational engine; **solution-oriented recommendations** precede player decisions; **deterministic consequences** and **mandatory reflection** develop financial judgment and advisory thinking.

This memo reconciles all provided documents through **Architecture Amendment A0**, identifies contradictions, defines bounded contexts for MVP, and scopes the **first playable financial decision loop** — without architectural drift.

**Implementation must not begin until this memo is approved.**

---

## 2. Canonical product definition (A0)

| SPIKE LIFE is | SPIKE LIFE is not |
|---------------|-------------------|
| Financial Decision Simulator | Life simulation game |
| FNA-powered planning practice | Budgeting app |
| Advisory thinking trainer | Financial literacy quiz |
| Solution-oriented (plans, not products) | Insurance product marketplace |
| Deterministic financial outcomes | AI-determined outcomes |

**Canonical loop (supersedes all older loops):**

```text
Financial Situation
  → Discovery
  → Financial Needs Analysis
  → Recommendation (prioritized solutions)
  → Decision
  → Consequence (deterministic)
  → Reflection
  → Improved judgment
  → Next Situation
```

**Five UX lenses** (Amendment 1.1A — supersedes UX 1.0/1.1 tab model):

| Lens | Question | Primary competency |
|------|----------|-------------------|
| **Life** | Where am I right now? | Cash flow awareness |
| **Plan** | What am I trying to achieve? | FNA, goals, priorities |
| **Protect** | What could go wrong? | Protection planning |
| **Grow** | How am I building wealth? | Cash flow, entrepreneurship |
| **Journey** | What story am I creating? | Reflection, advisory thinking |

One persistent **Life Dashboard workspace**. Lenses change perspective, not application context.

---

## 3. Contradictions resolved (A0 reinterpretation)

| Source | Obsolete / conflicting element | A0-aligned reinterpretation |
|--------|-------------------------------|----------------------------|
| **PRD v1.0** | “Financial life simulation platform”; “life simulation game” framing | **Financial Decision Simulator** — life stages provide situations, not gameplay |
| **PRD v1.0** MVP loop: Event → Choose Actions → Score | Decision before analysis | **Situation → FNA → Recommendations → Decision → Consequence → Reflection** |
| **PRD v1.0** | “What do you want to do?” action-first UI | **“What financial problem are you solving?”** — Recommendation Engine first |
| **PRD v1.0** | Leaderboard in MVP screens | **Deferred** — rewards luck/competition; conflicts with judgment-focused scoring philosophy (v2.6) |
| **PRD v1.0** | AI: Event Generation, Advisor Scoring | AI may **explain/coach/summarize** only; events and outcomes are **deterministic domain logic** |
| **PRD v1.0** | “Advisor Mode” as separate phase | Player is **always the advisor** (self today; client character later — same engine) |
| **Simulation v2.0** | “Simulation Engine” naming | Renamed **Financial Decision Engine** per A0 |
| **Simulation v2.0** | Annual cycle: event → player decides → recalculate | Insert **Discovery + FNA + Recommendation** between event impact and decision |
| **Simulation v2.0** | `buy_protection` action | **Solution actions**: “Strengthen Family Protection Plan”, etc. (Domain Rule) |
| **UX 1.0 / 1.1** | 6-tab nav: Goals, Protection, Wealth as separate apps | **Five lenses** in unified workspace (Amendment 1.1A) |
| **UX 1.1** | Routes `/goals`, `/protection`, `/wealth` as page exits | Lens state within `/life` workspace (e.g. `?lens=plan`) |
| **PRD v1.1** | 43-year / 100-event full simulation as implicit MVP | **MVP = one validated decision loop**; workshop 5-turn mode is post-loop |
| **PRD v1.1** | Probabilistic event engine (8% CI, etc.) | Probabilities may **select** situations; **consequences** are deterministic given state + decision |
| **v2.6 Life Score** | Wealth can dominate | Wealth **capped**; protection/cash flow cannot be ignored — scoring serves learning, not “richest wins” |

---

## 4. Bounded contexts (MVP)

```text
┌─────────────────────────────────────────────────────────────┐
│                  Financial Decision Context                  │
│  Aggregate: SimulationSession                              │
│  ├─ Character (identity, life stage, career)                 │
│  ├─ FinancialProfile (cash flow, assets, liabilities)      │
│  ├─ ProtectionPortfolio (internal cover values)            │
│  ├─ GoalPortfolio                                          │
│  ├─ Situation (current life/financial trigger)               │
│  ├─ FnaSnapshot (5-dimension scores + gaps)                  │
│  ├─ RecommendationSet (prioritized solutions)              │
│  ├─ DecisionRecord                                         │
│  ├─ ConsequenceOutcome                                     │
│  └─ ReflectionRecord                                       │
└─────────────────────────────────────────────────────────────┘

Supporting domains (MVP subset):
  • Scoring — Life Score™ + FNA overall score (read models)
  • Events — Situation catalog (feeds Situation Engine)
  • Solutions — FNA solution vocabulary (Domain Rule)
```

**Anti-corruption boundary:** SPIKE Portal FNA (`financial_needs_analyses`) is a **different context** (real intern client work). SPIKE LIFE FNA serves **simulated judgment development**. No reuse of Portal `fnaService.js` in domain layer.

---

## 5. Financial Decision Engine (domain pipeline)

Rename all references from “Simulation Engine” to **Financial Decision Engine**.

| Engine | Responsibility | Mutates state? |
|--------|----------------|----------------|
| **Situation** | Presents financial situation (life event as context) | Via command |
| **Discovery** | Surfaces what changed, risks, opportunities | Query + command snapshot |
| **FNA** | 5 dimensions: Cash Flow, Protection, Debt, Goals, Retirement | Query (scores/gaps) |
| **Recommendation** | Priority-ranked **solutions** (not products) | Query |
| **Decision** | Player selects solution / allocation | Command |
| **Consequence** | Deterministic recalculation of profile, gaps, scores | Command |
| **Reflection** | Captures learning prompts + responses | Command |

**FNA dimension weights** (v2.3): Cash Flow 20%, Protection 30%, Debt 15%, Goals 20%, Retirement 15%.

**Recommendation priority rules** (v2.3): Critical gaps first; protection before wealth; emergency fund before aggressive investing; debt stress reduces investment priority.

**Solution vocabulary** (Domain Rule — user-facing only):

- Strengthen Family Protection Plan
- Protect Your Income
- Strengthen Health Protection
- Secure Education Goals
- Strengthen Retirement Security
- Build Emergency Fund
- Reduce Unsustainable Debt
- (etc.)

Internal fields (`lifeCover`, `criticalIllnessCover`, …) remain **infrastructure/domain calculation only**.

---

## 6. Layered architecture

```text
Presentation     Astro + React + Tailwind (thin; Five-Lens workspace)
                 No financial calculations in components/hooks

Application      CQRS handlers, orchestration, auth guards
                 Commands → domain; Queries → read models

Domain           Financial Decision Engine, aggregates, value objects
                 SOURCE OF TRUTH — pure TypeScript, zero framework deps

Infrastructure   Hono (CF Workers), Neon PostgreSQL, repositories
                 Persists domain state; never defines business rules
```

### CQRS (MVP loop)

**Commands (mutate):**

| Command | Effect |
|---------|--------|
| `StartSimulation` | Create session from archetype template |
| `PresentSituation` | Attach situation to session |
| `RecordDiscovery` | Persist discovery answers (optional MVP) |
| `SubmitDecision` | Apply chosen solution(s) |
| `ApplyConsequences` | Run consequence engine for current turn |
| `SubmitReflection` | Store reflection responses |
| `AdvanceTurn` | Close turn; prepare next situation (post-MVP loop extension) |

**Queries (read-only):**

| Query | Returns |
|-------|---------|
| `GetSessionSnapshot` | Full dashboard read model |
| `GetFnaSnapshot` | 5 scores, gaps, overall FNA, top priority |
| `GetRecommendations` | Prioritized solution list |
| `GetLensView` | Life / Plan / Protect / Grow / Journey projection |
| `GetLifeScore` | Component breakdown |

---

## 7. MVP scope — one playable loop

### In scope (MVP Foundation)

1. **Domain package** (`@spike-life/domain`) — TypeScript, Vitest unit tests
2. **One archetype** — e.g. Fresh Graduate (simplest FNA gaps)
3. **One situation** — e.g. Promotion (C001) or first-income milestone
4. **Full canonical loop** — Situation → Discovery → FNA → Recommendations → Decision → Consequence → Reflection
5. **FNA Engine** — all 5 dimensions (formulas from v2.3)
6. **Recommendation Engine** — priority rules + solution language
7. **Consequence Engine** — deterministic cash flow / protection / goal impact
8. **Reflection Engine** — minimum 3 prompts from v2.6
9. **Life Score read model** — simplified subset (cash flow + protection + goals minimum)
10. **Thin UI shell** — Life Dashboard + lens switcher + decision workspace + reflection screen
11. **In-memory repository** — no DB until loop tests pass

### Explicitly out of scope (until loop validated)

- 43-year simulation, annual auto-advance, 100 events
- 10 archetypes, character creation wizard
- Leaderboards, achievements, gamification
- Advisor Mode / client cases
- AI coach, event generation, advisor scoring
- SPIKE LMS integration, PDF export
- Neon DB, auth, Hono API (phase 2 after domain tests)
- Workshop 5-turn compressed mode

### MVP success criterion (A0)

> After one simulation cycle, the participant is better at making financial decisions — because they practiced the **planning process**, not because they memorized concepts.

---

## 8. Technology alignment

| Layer | Target (PRD v1.0) | MVP Foundation | Notes |
|-------|-------------------|----------------|-------|
| Domain | — | **TypeScript package + Vitest** | Framework-agnostic; highest priority |
| Frontend | Astro + React + Tailwind | **Vite + React + Tailwind** initially | Acceptable for loop validation; migrate to Astro when Bible confirms |
| API | Hono / CF Workers | **None** (in-memory) | Add after domain proven |
| Database | Neon PostgreSQL | **In-memory repo** | Domain model is truth |
| Auth | Magic link / Google | **None** | Post-MVP |

**Bootstrap drift:** Current `SPIKE_LIFE/` scaffold is plain JS with no domain layer — **replace incrementally**, domain first.

---

## 9. UX implementation notes (1.1A authoritative)

- **Single workspace** at `/life` (or `/`) with persistent header: Age, Life Stage, Life Score, Year
- **Lens tabs:** Life | Plan | Protect | Grow | Journey
- **Decision workspace** flow (UX 1.1): Event → Recommendations → Action cards → Confirm
- **No insurance product language** anywhere in UI
- **Protection Readiness** not “coverage purchased”
- Mobile: bottom lens nav; desktop: sidebar + recommendation rail

---

## 10. Open questions (need approval)

1. **First MVP situation** — Promotion (income + lifestyle temptation) vs. protection-gap stress test (family event)?
2. **Discovery step** — explicit Q&A UI in MVP, or implicit via FNA snapshot?
3. **TypeScript monorepo layout** — `SPIKE_LIFE/packages/domain` + `SPIKE_LIFE/apps/web`?
4. **Astro timing** — adopt now vs. after domain tests pass?
5. **Software Architecture Bible** — full volume still needed for security chapter, exact aggregate boundaries, and event sourcing decisions.

---

## 11. Recommended implementation sequence (post-approval)

| Phase | Deliverable | Exit criteria |
|-------|-------------|---------------|
| **0** | Approve this memo | Stakeholder sign-off |
| **1** | Domain package + FNA + Recommendation engines + tests | Unit tests pass on Fresh Graduate fixture |
| **2** | Decision + Consequence + Reflection engines + tests | Full loop passes deterministically in tests |
| **3** | CQRS handlers + in-memory repository | Command/query integration tests |
| **4** | Thin Five-Lens UI | One situation playable in browser |
| **5** | Hono API + Neon persistence | Session survives refresh |
| **6** | Astro migration + auth + LMS hooks | Production MVP |

---

## 12. Approval checklist

Before Phase 1 coding begins, confirm:

- [ ] Canonical loop and Five-Lens UX approved
- [ ] Contradiction resolutions in §3 accepted
- [ ] MVP in/out scope in §7 accepted
- [ ] First archetype + first situation selected
- [ ] Tech phasing in §8 accepted (domain-first, in-memory)

---

**Prepared by:** Lead Software Architect (Cursor)  
**Next step:** Stakeholder approval → Phase 1 domain implementation
