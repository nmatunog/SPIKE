# Supabase

Production database and auth for SPIKE. Apply scripts in the Supabase **SQL Editor**.

## 1) Create project

1. Create a Supabase project.
2. Keep Auth enabled (email/password).

## 2) Apply schema

Run in order:

1. `schema.sql` — `profiles`, `intern_progress`, `traction_logs`, RLS
2. `migrations/20260606_sprint_01_scaffold.sql` — Sprint 01 Phase 3: `cohorts`, curriculum tables, `venture_portfolio_entries`, `career_track` on `intern_progress`
3. `migrations/20260620_sprint_02_instructional_architecture.sql` — Sprint 02: competencies, milestones, artifacts, research squads, venture board, integration mappings
4. `activation_codes.sql` — intern signup codes
5. `password_reset_requests.sql` — admin-assisted password help queue
6. `migrations/20260621_sprint_03_playbook_completions.sql` — playbook completions
7. `migrations/20260622_sprint_04_survey_engine.sql` — survey responses
8. `migrations/20260623_sprint_04_fna_engine.sql` — FNA + client growth
9. `migrations/20260624_sprint_04_timeline_engine.sql` — timeline + coaching
10. `migrations/20260625_sprint_05_blueprint_integration.sql` — Blueprint sections, canvas, leadership journal
11. `migrations/20260626_sprint_05b_research_squad_intelligence.sql` — research squads (if missing), squad members, cohort analytics
12. `migrations/20260627_sprint_06a_content_studio.sql` — Content Studio: `content_blocks`, `content_assets`, CMS columns, Week 1 seed

## 3) First admin

After the first Auth sign-up:

1. Find the user UUID in `auth.users`.
2. Run the commented SQL at the bottom of `schema.sql` to set role `ADMIN`.

## 4) Cloudflare Pages env vars

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key |

Redeploy after changing env vars.

## 5) Sprint 01 scaffold tables (Phase 3)

After the migration, these tables exist (scaffold only — app still uses mock/static data until wired):

| Table | Purpose |
|-------|---------|
| `cohorts` | Cohort definitions |
| `intern_progress` | Extended with `career_track`, `cohort_id`, `current_week`, `current_day` |
| `segments` → `weeks` → `days` | Playbook curriculum hierarchy |
| `presentations`, `slides`, `activities`, `worksheets`, `assessments` | Day content |
| `surveys` | Research module scaffold |
| `venture_portfolio_entries` | Per-user portfolio items (`portfolio_section` enum) |

Enums: `career_track` (`agency_builder`, `specialist_consultant`), `portfolio_section`, `portfolio_entry_status`, `survey_status`.

## 6) Sprint 02 tables (instructional architecture)

After `20260620_sprint_02_instructional_architecture.sql`:

| Table | Purpose |
|-------|---------|
| `programs` | SPIKE program definitions |
| `competencies`, `milestones`, `week_integrations` | Instructional design reference |
| `portfolio_sections`, `business_plan_chapters` | Blueprint section metadata |
| `portfolio_artifacts`, `business_plan_artifacts` | Participant drafts (Supabase path) |
| `career_tracks`, `track_requirements`, `venture_boards`, `venture_board_criteria` | Career + board reference |
| `day_contributions`, `activity_blueprint_mappings` | Playbook → Blueprint routing |
| `research_squads`, `research_projects` | Research foundation |
| `sessions`, `worksheet_questions`, `survey_questions`, `rubrics` | Curriculum extensions |

App loads curriculum from `/content` JSON and hydrates `day_contributions` from Supabase when configured (PR8). Full DB curriculum import is a follow-on task.

## 7) App integration

- Auth: `src/AuthContext.jsx`, `src/supabaseClient.js`
- Data helpers: `src/lib/supabase/` (`interns.js`, `tractionLogs.js`, `curriculum.js`, `blueprintArtifacts.js`)
- Curriculum facade: `src/lib/curriculumService.js` (JSON tree + Supabase enrichment)
- Playbook progress: `src/lib/playbookProgress.js`, `src/lib/supabase/playbookProgress.js`
- Migration: `supabase/migrations/20260621_sprint_03_playbook_completions.sql`
- Survey responses: `src/lib/surveyService.js`, `src/lib/supabase/surveyResponses.js`
- Migration: `supabase/migrations/20260622_sprint_04_survey_engine.sql`
- FNA Engine: `src/lib/fnaService.js`, `src/components/fna/FnaForm.jsx`
- Migration: `supabase/migrations/20260623_sprint_04_fna_engine.sql`
- Timeline: `src/lib/timelineService.js`, `src/lib/coachingService.js`
- Migration: `supabase/migrations/20260624_sprint_04_timeline_engine.sql`

The `api/` folder is for optional local JWT development only; production uses Supabase.
