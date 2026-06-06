# Sprint 02 — Gap Analysis

**Spec:** [`PLAYBOOK_SCHEMA_V1.md`](./PLAYBOOK_SCHEMA_V1.md) (Instructional Architecture Platform)  
**Baseline:** Sprint 01 on `main` (auth, roles, module shells, mobile nav, `20260606_sprint_01_scaffold.sql`)

**Overall:** ~**12%** of Sprint 02 implemented. Sprint 01 provides partial overlap (routes, shallow playbook UI, minimal curriculum tables) but not the multi-engine architecture.

---

## Phase-by-phase status

| Phase | Scope | Status | Notes |
|-------|--------|--------|-------|
| **1** | Domain model (`playbook.ts`) | ❌ | No `src/types/playbook.ts`. `playbookScaffold.js` uses ad-hoc strings, not typed Program/Segment/Week/Day/Session. |
| **2** | Competencies, milestones, week integration | ❌ | No types, seeds, or UI. |
| **3** | Business plan engine | ❌ | No chapters, artifacts, or `/business-plan` module. |
| **4** | Venture portfolio engine | ⚠️ | `PortfolioPage` placeholder; Sprint 01 has `venture_portfolio_entries` (different shape than `PortfolioArtifact` / `PortfolioReview`). |
| **5** | Career track engine | ❌ | No tracks, requirements, or UI. |
| **6** | `/content` JSON tree | ❌ | No `/content` directory. Legacy `fullSyllabusData.js`, `orientationSlideContents.jsx` still hardcoded. |
| **7** | Presentation engine | ❌ | No `/components/playbook` viewers. |
| **8** | Activity engine | ❌ | No `ActivityViewer`. |
| **9** | Worksheet engine | ❌ | No `WorksheetViewer` / question types. |
| **10** | Day contribution mapping | ❌ | No `DayContribution` type or Day view cross-links. |
| **11** | Research foundation | ⚠️ | `ResearchPage` placeholder; Sprint 01 has `surveys` table only — no `ResearchProject` / `ResearchSquad` types or tables. |
| **12** | Venture board foundation | ❌ | No types, seeds, or `/venture-board` route. |
| **13** | DB migrations (30 tables) | ⚠️ | Sprint 01 migration has subset: `segments`, `weeks`, `days`, `presentations`, `slides`, `activities`, `worksheets`, `assessments`, `surveys`, `venture_portfolio_entries`. **Missing:** `programs`, `competencies`, `milestones`, `week_integrations`, `business_plan_*`, `portfolio_sections`, `portfolio_artifacts`, `portfolio_reviews`, `career_tracks`, `track_requirements`, `worksheet_questions`, `rubrics`, `survey_questions`, `research_projects`, `venture_boards`, `venture_board_criteria`, `day_contributions`, `sessions`. |
| **14** | Navigation expansion | ⚠️ | Have: Dashboard, Playbook, Portfolio, Research, Reports, Admin. **Missing:** Business Plan, Milestones, Venture Board. |
| **15** | Mock Segment 1 / Week 1 / Day 1 | ❌ | Acceptance path not achievable. |

---

## What Sprint 01 already provides (reuse, don’t rewrite)

| Area | Implemented | Sprint 02 action |
|------|-------------|------------------|
| Auth + roles | ✅ Supabase + `RoleRouteGuard` | Extend `canAccessRoute` for new modules |
| Module routing | ✅ React Router, `paths.js`, `ModuleNav` | Add 3 routes; keep Reports/Admin |
| Playbook shell | ✅ `PlaybookShell.jsx` — segment/week/day lists | Replace data source; add Day detail + engines |
| Portfolio / Research pages | ✅ Placeholder scaffolds | Evolve into engine shells |
| DB curriculum skeleton | ✅ Partial tables in Sprint 01 SQL | New migration extends + seeds reference data |
| Deploy / mobile | ✅ `deploy:prod`, compact nav | No structural change |

---

## Acceptance criteria vs today

| Requirement | Met? |
|-------------|------|
| Playbook → Segment 1 → Week 1 → Day 1 | ⚠️ Shallow lists only; no Day 1 content view |
| Learning objectives on Day 1 | ❌ |
| Slides + speaker notes | ❌ (legacy orientation slides elsewhere, not wired) |
| Activities / worksheets / assessments | ❌ |
| Portfolio deliverables on Day view | ❌ |
| Business plan contributions on Day view | ❌ |
| Competency contributions on Day view | ❌ |
| Architecture scales to 200h / 600h without redesign | ❌ Hardcoded scaffold + monolith patterns |

---

## Legacy debt to remove (during Sprint 02)

| File / pattern | Issue |
|----------------|-------|
| `src/data/playbookScaffold.js` | Hardcoded hierarchy — replace with `/content` + types |
| `src/data/fullSyllabusData.js` | Monolith syllabus — migrate or archive |
| `orientationSlideContents.jsx` (if present) | Inline slides — move to `presentation.json` |
| `venture_portfolio_entries` vs `portfolio_artifacts` | Schema alignment in Phase 13 migration |

---

## Risk summary

1. **Scope:** 15 phases is a full platform foundation — needs sequenced PRs, not one blob.
2. **Session layer:** Spec adds Session under Day; Sprint 01 DB has no `sessions` table — must add in migration.
3. **Nav density:** 6 curriculum modules + Dashboard + Reports/Admin — mobile tab bar may need grouping or overflow (document in Phase 14).
4. **TypeScript in JS project:** Spec says `playbook.ts` — use `.ts` with JSDoc imports or add minimal TS support; team should pick in PR 1.

---

## Recommended commit (docs only)

This gap analysis + updated spec + execution plan — **no application code** until execution PRs begin.

**END**
