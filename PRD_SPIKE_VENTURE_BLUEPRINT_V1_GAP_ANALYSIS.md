# Venture Blueprint™ — Gap Analysis

**PRD:** [`PRD_SPIKE_VENTURE_BLUEPRINT_V1.md`](./PRD_SPIKE_VENTURE_BLUEPRINT_V1.md) (V1.1)  
**Baseline:** `main` after Sprint 02 PRs 1–2 (types, seeds, content loader) + Sprint 01 portal  
**Date:** June 2026

**Overall:** ~**5%** of the Venture Blueprint PRD is implemented. Sprint 02 provides **substrate** (types, JSON content, contribution mapping) that the Blueprint OS will consume — but no Blueprint modules, platform engines, or intern-default UX exist yet.

---

## Executive summary

| Area | PRD vision | Today |
|------|------------|-------|
| Default intern home | **My Venture Blueprint™** | `/dashboard` — Intern Dashboard + traction logging |
| Portfolio | 9-module Blueprint OS | `/portfolio` placeholder with mock % from traction hours |
| Business plan | Auto-built Financial Entrepreneurship Canvas | Types + seeds only; no UI |
| Production / FNA | Client Growth Engine + FNA module | Traction hours + mock `fnaCompletion` % |
| Career | Admin-configurable ACS / Specialist ladders | Static seeds in `careerTracks.json`; hardcoded metrics in `sprint01Metrics.js` |
| Playbook → Blueprint | Automation on every activity | `contributions.json` + `DayContribution` type; no event bus |
| Board | Workflow state machine | Venture board seeds; no workflow |

**Strategic risk:** Continuing Sprint 02 as “LMS pages” (`PortfolioPage`, `BusinessPlanPage`) without renaming/routing to **Venture Blueprint™** will fork the architecture the PRD rejects.

---

## Part I — Venture Blueprint modules

| Module | PRD requirement | Status | Current code / data |
|--------|-----------------|--------|---------------------|
| **1 Vision & Purpose** | `vision_profiles`, builders, dream board, 25% weights | ❌ | No table, no UI. Day 1 worksheet content in `content/…/worksheets.json` only |
| **2 Financial Entrepreneurship Canvas** | 3 engines + foundation canvas | ❌ | `BusinessPlanChapter` seeds; no canvas UI or persistence |
| **3 Client Growth Engine** | `client_growth` funnel + KPIs | ❌ | No funnel table. Reports show mock FNA % from hours (`sprint01Metrics.js`) |
| **4 Recruitment Engine** | `recruitment_funnel` (Agency Builder) | ❌ | `trackRequirements` seeds mention recruitment; no funnel |
| **5 Leadership Engine** | `leadership_pipeline` + team dashboard | ❌ | Leadership competency seed only |
| **6 Career Accelerator** | Promotion readiness widget | ⚠️ | `career_progress` type absent; `deriveInternDashboardMetrics` fakes week/day from hours |
| **7 Specialist Track** | `specialist_blueprint` dashboard | ❌ | `specialist_blueprint` table absent; Specialist track in seeds only |
| **8 Venture Board** | Hour 200/400/600 packets | ⚠️ | `ventureBoards.json` + criteria seeds; no submission or workflow UI |
| **9 Reports Center** | Blueprint PDF, board packet, etc. | ⚠️ | Staff `/reports` with mock intern rows; not Blueprint-scoped |
| **10 Export Center** | PDF / DOCX / PPTX | ❌ | None |

**Part I completion:** ~**3%** (reference seeds overlap with module concepts; zero participant-facing Blueprint surfaces).

---

## Part II — Platform engines

| Engine | PRD requirement | Status | Notes |
|--------|-----------------|--------|-------|
| **1 Program State** | Master state object per participant | ⚠️ | `intern_progress`: segment, hours, `career_track`, `current_week`, `current_day`. **Missing:** `blueprint_completion`, `venture_board_status`, unified `getParticipantState()` API |
| **2 Playbook Integration** | `activity_id` → portfolio + blueprint module + weight | ⚠️ | `DayContribution` + `contributions.json` (portfolio, business plan, competencies). **Missing:** `blueprint_module`, `completion_weight`, automation on complete |
| **3 SPIKE Readiness Score™** | 6-dimension composite, displayed everywhere | ❌ | Mock single fields (`portfolioPct`, `fnaCompletion`) — not weighted composite |
| **4 Agency Builder Roadmap** | Admin-configurable positions + qualifications | ⚠️ | `careerTracks.json` + `trackRequirements.json` static. **Missing:** `career_positions`, `position_qualifications`, admin UI |
| **5 Specialist Roadmap** | 5-rung specialist ladder | ⚠️ | PRD ladder not in seeds (only 2 track titles). No position slugs |
| **6 Research Squad** | Squads, segments, deliverables → portfolio | ⚠️ | `ResearchSquad` / `ResearchProject` types; `ResearchPage` placeholder (zero counts). **Missing:** `research_squads` table, auto-save |
| **7 Survey Engine** | 7 question types + collection | ⚠️ | Sprint 01 `surveys` table (title only). Day 1 `survey.json` definition. **Missing:** `survey_questions`, matrix/ranking types, responses |
| **8 FNA Engine** | Full FNA record + status workflow → client growth | ❌ | No `financial_needs_analyses` table or module UI |
| **9 Coaching Engine** | `coaching_sessions` → timeline | ❌ | Mock `coachingNotesOpen` on mentor dashboard only |
| **10 Timeline Engine** | LinkedIn-style activity feed | ❌ | Traction log list on intern dashboard only — not unified timeline |
| **11 Achievements** | SPIKE milestone badges | ❌ | None |
| **12 Venture Board Workflow** | State machine through Decision | ❌ | No `venture_board_submissions` or step tracking |
| **13 Content Authoring** | Admin UI for full curriculum tree | ❌ | File-based `content/` + `playbookScaffold.js` fallback. Playbook still uses scaffold, not `contentLoader` |
| **14 Reporting Center** | Cohort / Mentor / Agency dashboards | ⚠️ | Role dashboards + reports table with mock metrics. **Missing:** agency pipeline, board readiness from real state |
| **15 AI Readiness** | Extensible schema + events | ❌ | No `ai_insights`, no event bus |

**Part II completion:** ~**8%** (partial state in `intern_progress`, contribution mapping, research/survey scaffolds).

---

## Navigation & UX gaps

| PRD | Current (`paths.js`, `ModuleNav`) |
|-----|-----------------------------------|
| Default route = **My Venture Blueprint™** | `defaultRouteForRole()` → `/dashboard` |
| Blueprint sub-modules (Vision, Canvas, Client Growth, …) | Single `/portfolio` placeholder |
| Business Plan as Blueprint section | No `/business-plan` route (planned Sprint 02 PR4) |
| Milestones, Venture Board modules | Not in nav |
| SPIKE Readiness Score in header | Not present |

---

## Database: PRD tables vs Supabase

| PRD table | Exists? | Location / notes |
|-----------|---------|------------------|
| `vision_profiles` | ❌ | — |
| `client_growth` | ❌ | — |
| `recruitment_funnel` | ❌ | — |
| `leadership_pipeline` | ❌ | — |
| `career_progress` | ❌ | Partial overlap: `intern_progress.career_track`, `current_week`, `current_day` |
| `specialist_blueprint` | ❌ | — |
| `participant_program_state` | ❌ | Could be view over normalized tables |
| `spike_readiness_scores` | ❌ | — |
| `career_positions` | ❌ | — |
| `position_qualifications` | ❌ | — |
| `research_squads` | ❌ | — |
| `survey_questions` | ❌ | — |
| `financial_needs_analyses` | ❌ | — |
| `coaching_sessions` | ❌ | — |
| `participant_timeline_events` | ❌ | — |
| `achievement_definitions` | ❌ | — |
| `venture_board_submissions` | ❌ | — |
| `activity_blueprint_mappings` | ❌ | Overlap: `day_contributions` planned Sprint 02 |
| `ai_insights` | ❌ | — |
| `venture_portfolio_entries` | ✅ | Sprint 01 — different shape than `PortfolioArtifact` |
| `traction_logs` | ✅ | Hours logging — not wired to Client Growth funnel |
| `cohorts` | ✅ | Sprint 01 |
| `segments` / `weeks` / `days` | ✅ | Sprint 01 — minimal columns vs PRD `Day` type |
| `surveys` | ✅ | Sprint 01 — no questions |

---

## What works today (reuse, don’t discard)

| Asset | PRD consumer |
|-------|----------------|
| `src/types/playbook.ts` | Extend with Blueprint module slugs, `ActivityBlueprintMapping`, `ParticipantProgramState` |
| `src/lib/playbookSeeds.js` | Seed admin CMS until `career_positions` DB |
| `src/lib/contentLoader.js` + `content/segment-1/…` | Playbook UI (Sprint 02 PR3); feeds Engine 2 |
| `contributions.json` | Template for Engine 2 mappings |
| `intern_progress` + `traction_logs` | Inputs to Engine 1 state + Engine 3 Production dimension |
| `RoleDashboardCards` / `MetricCard` | Patterns for Blueprint widgets |
| Auth, roles, `RoleRouteGuard`, mobile nav | Keep; add `/venture-blueprint` route |

---

## Sprint 02 alignment check

| Sprint 02 PR | PRD alignment | Adjustment needed |
|--------------|---------------|-------------------|
| PR1 Types + seeds | ✅ Substrate | Add `blueprint_module`, `completion_weight` to contribution model |
| PR2 Content loader | ✅ Substrate | Wire PlaybookShell (PR3) before new pages |
| PR4 Business Plan / Milestones / Venture Board pages | ⚠️ | Frame as **Blueprint sub-routes**, not standalone LMS modules |
| PR5 Artifact stubs | ⚠️ | Target `vision_profiles` / canvas sections, not generic portfolio list |
| PR7 DB migration | ⚠️ | Add PRD core tables or split Sprint 03 migration |
| PR8 API + cleanup | ⚠️ | Introduce `getParticipantState()` alongside Supabase reads |

---

## Recommended implementation phases (post PRD)

### Phase A — Blueprint shell (before more LMS pages)

1. Route `/venture-blueprint` (or `/blueprint`) as intern **default home**
2. Blueprint layout: module nav sidebar + Program State header widget
3. Read-only modules fed by seeds + `contentLoader` contributions

### Phase B — State + automation core

1. `participant_program_state` (or computed service)
2. Playbook Integration Engine: on worksheet submit → update Vision & Purpose %
3. Timeline events table + feed component
4. SPIKE Readiness Score™ calculator (mock dimensions → real as data arrives)

### Phase C — Production engines

1. FNA Engine + `client_growth` funnel
2. Recruitment / Leadership engines (Agency Builder gating by `career_track`)
3. Traction log → timeline + production dimension

### Phase D — Career + board

1. Admin-configurable `career_positions` / `position_qualifications`
2. Venture Board workflow state machine
3. Achievements on key events (First FNA, Hour 200)

### Phase E — Authoring + reporting + export

1. Content Authoring UI (replaces JSON production path)
2. Cohort / Mentor / Agency reporting from real state
3. Export center (PDF first)

### Phase F — AI readiness

1. Event bus + `ai_insights` schema only

---

## PRD acceptance criteria scorecard

| Criterion | Met? |
|-----------|------|
| Intern lands on My Venture Blueprint™ | ❌ |
| Vision & Purpose 4 × 25% completion | ❌ |
| Client Growth funnel from `client_growth` | ❌ |
| Track-specific engines (Agency vs Specialist) | ❌ |
| Playbook activity updates Blueprint without re-entry | ❌ |
| Program State master object | ❌ |
| SPIKE Readiness Score™ everywhere | ❌ |
| Roadmaps from DB, not hardcoded | ❌ |
| FNA → Client Growth | ❌ |
| Coaching on timeline | ❌ |
| Hour 200 workflow through Decision | ❌ |
| Achievement on First FNA | ❌ |
| Cohort Dashboard board readiness | ❌ |
| 30-second success metric (usability) | ❌ |

**Score: 0 / 14** platform acceptance criteria.

---

## Immediate next steps (suggested)

1. **Finish Sprint 02 PR3** — Playbook Day 1 viewers wired to `contentLoader` (feeds Engine 2 demo).
2. **Re-scope Sprint 02 PR4** — `/venture-blueprint` shell with Vision & Purpose read-only panel instead of three disconnected module pages.
3. **Draft Sprint 03 execution plan** from Phase A–F above with DB migration for PRD core tables.
4. **Deprecate** mock `portfolioSectionProgress(hours)` when first real Blueprint module persists data.

---

**END**
