# SPIKE ASC — Sprint 01 Execution Plan

Companion to [`CURSOR_REFACTOR_SPRINT_01.md`](./CURSOR_REFACTOR_SPRINT_01.md).

## Executive summary

Sprint 01's **product vision** (LMS + portfolio + incubator) is sound. The **technical spec** (Next.js rewrite) does **not** match production. Execute as **in-place evolution** of Vite + React + Supabase on Cloudflare Pages.

**Do not rewrite to Next.js in Sprint 01.** Add `react-router-dom` for module routes; defer Next.js until after the monolith is split and Supabase is the single data layer.

---

## Current vs target architecture

### Current (fragile — 4/10)

- ~1,950-line `SpikeMasterPortal.jsx` monolith
- Tab state routing (no deep links)
- **Dual data layer:** Supabase auth in production + legacy Express/Prisma paths still called with `token=null`
- Static curriculum in JS files (`orientationSlideContents`, `fullSyllabusData`)

### Target Sprint 01 (8/10 if incremental)

- App shell with React Router: `/dashboard`, `/playbook`, `/portfolio`, `/research`, `/reports`, `/admin`
- Feature modules with placeholder/mock content
- **Single data layer:** Supabase PostgreSQL + RLS
- Schema scaffolding for cohorts, curriculum hierarchy, portfolio, surveys
- Existing branding, auth, and role model preserved

---

## Schema decisions (as-built)

| Sprint table | Decision |
|--------------|----------|
| `participant_profiles` | **Do not add** — extend `intern_progress` with `career_track`, `cohort_id`, `current_week`, `current_day` |
| `cohorts` | Add in Phase 3 migration |
| Curriculum tables | Add as scaffold; static JS remains fallback in Sprint 01 |
| `venture_portfolio_entries` | Add with `section` enum + FK to `profiles.id` |

---

## Phases

### Phase 0 — Stabilize (2–3 days) ✅ **complete**

**Goal:** One data layer; no silent failures in Supabase production mode.

- [x] Migrate traction log create / list / approve / reject to Supabase
- [x] Migrate mentor hour logging to Supabase `intern_progress` updates
- [x] Add `src/lib/supabase/` query helpers (`interns.js`, `tractionLogs.js`, `segment.js`)
- [x] Exit: no production data feature uses `apiFetch` + JWT when `usingSupabaseAuth` is true

**As-built:** `src/lib/supabase/` centralizes queries; `SpikeMasterPortal.jsx` branches on `usingSupabaseAuth`. Legacy Express/JWT paths remain for local dev without Supabase env vars.

### Phase 1 — App shell (3–4 days) ✅ **complete**

- [x] Add `react-router-dom`
- [x] Extract `PortalHeader`, `ModuleNav`; placeholder `PortfolioPage`, `ResearchPage`, `PlaybookShell`
- [x] Map routes: `/dashboard`, `/playbook`, `/portfolio`, `/research`, `/reports`, `/admin`
- [x] Preserve existing dashboard JSX; role-based route guards; SPA `_redirects` for Cloudflare

**As-built:** `SpikeMasterPortal` uses `useLocation`/`useNavigate`; interns get module nav; legacy orientation/syllabus live under Playbook tabs.

### Phase 2 — Module scaffolds (4–5 days)

- [ ] Role-aware dashboard cards (real data + mock metrics)
- [ ] Playbook, Portfolio, Research placeholder UIs
- [ ] Reports extended columns
- [ ] Admin consolidated under `/admin`

### Phase 3 — Database scaffolding (2–3 days)

- [ ] `supabase/migrations/20260606_sprint_01_scaffold.sql`
- [ ] RLS on every new table
- [ ] `career_track` enum on `intern_progress`

### Phase 4 — Hardening & deploy (1–2 days)

- [ ] Route role guards
- [ ] Lint, build, deploy to `spike-asc.pages.dev`

---

## Deferred (not Sprint 01)

- Next.js migration
- Full TypeScript conversion
- shadcn/ui adoption
- Playbook CMS / portfolio persistence
- Express API removal (after Phase 0 parity; keep for local JWT dev)

---

## Tech stack (revised)

| Layer | Sprint 01 choice |
|-------|------------------|
| Framework | **Vite + React** (existing) |
| Routing | **react-router-dom** (Phase 1) |
| Language | JavaScript (gradual TS later) |
| Auth + DB | **Supabase** (production) |
| Styling | Tailwind + Lucide (existing) |
| Deploy | Cloudflare Pages |

---

## Week checklist

```
Phase 0  [ ] Supabase-complete existing flows
         [ ] Extract supabase query helpers

Phase 1  [ ] react-router + new nav
         [ ] Split monolith into pages/layout
         [ ] /admin consolidation

Phase 2  [ ] Dashboard role cards
         [ ] Playbook / Portfolio / Research scaffolds
         [ ] Reports column extensions

Phase 3  [ ] Supabase migration file + RLS
         [ ] career_track on intern_progress
         [ ] Deploy + smoke test
```
