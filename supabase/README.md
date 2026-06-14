# Supabase

Production database and auth for SPIKE. Apply scripts in the Supabase **SQL Editor** in the order below.

---

## 1) Create project

1. Create a Supabase project.
2. Keep Auth enabled (email/password).

---

## 2) Apply schema (run every file in order)

Copy-paste each file into the SQL Editor and run. All migrations are idempotent unless noted.

| Step | File | What it adds |
|------|------|----------------|
| **1** | [`schema.sql`](./schema.sql) | `profiles`, `intern_progress`, `traction_logs`, RLS, `app_role` enum |
| **2** | [`migrations/20260606_sprint_01_scaffold.sql`](./migrations/20260606_sprint_01_scaffold.sql) | `cohorts`, curriculum hierarchy (`segments` → `weeks` → `days`), presentations, activities, worksheets, assessments, surveys scaffold, `venture_portfolio_entries` |
| **3** | [`migrations/20260620_sprint_02_instructional_architecture.sql`](./migrations/20260620_sprint_02_instructional_architecture.sql) | Competencies, milestones, portfolio/business-plan chapters, sessions, rubrics, research squads, `day_contributions`, `activity_blueprint_mappings` |
| **4** | [`activation_codes.sql`](./activation_codes.sql) | Intern signup activation codes |
| **5** | [`password_reset_requests.sql`](./password_reset_requests.sql) | Admin-assisted password help queue |
| **6** | [`migrations/20260621_sprint_03_playbook_completions.sql`](./migrations/20260621_sprint_03_playbook_completions.sql) | `playbook_completions` (slug-keyed item progress) |
| **7** | [`migrations/20260622_sprint_04_survey_engine.sql`](./migrations/20260622_sprint_04_survey_engine.sql) | `survey_responses`, `survey_response_answers` (content slug IDs) |
| **8** | [`migrations/20260623_sprint_04_fna_engine.sql`](./migrations/20260623_sprint_04_fna_engine.sql) | FNA + client growth tables |
| **9** | [`migrations/20260624_sprint_04_timeline_engine.sql`](./migrations/20260624_sprint_04_timeline_engine.sql) | Timeline + coaching tables |
| **10** | [`migrations/20260625_sprint_05_blueprint_integration.sql`](./migrations/20260625_sprint_05_blueprint_integration.sql) | Blueprint sections, executive canvas, leadership journal |
| **11** | [`migrations/20260607_sprint_05c_canvas_summary.sql`](./migrations/20260607_sprint_05c_canvas_summary.sql) | Executive canvas summary (requires step 10) |
| **12** | [`migrations/20260626_sprint_05b_research_squad_intelligence.sql`](./migrations/20260626_sprint_05b_research_squad_intelligence.sql) | Research squad members, cohort analytics |
| **13** | [`migrations/20260608_sprint_day1_builders.sql`](./migrations/20260608_sprint_day1_builders.sql) | Day 1 Venture Blueprint builder artifacts |
| **14** | [`migrations/20260609_cohort_squad_formation.sql`](./migrations/20260609_cohort_squad_formation.sql) | Cohort identity, squad themes, squad assignments |
| **15** | [`migrations/20260610_venture_coach.sql`](./migrations/20260610_venture_coach.sql) | AI Venture Coach section storage |
| **16** | [`migrations/20260627_sprint_06a_content_studio.sql`](./migrations/20260627_sprint_06a_content_studio.sql) | **Content Studio™** — `content_blocks`, `content_assets`, CMS columns, Week 1 seed |
| **17** | [`migrations/20260628_coach_training_rag.sql`](./migrations/20260628_coach_training_rag.sql) | Coach AI training log (`coach_training_events`) + RAG corpus RPC |
| **18** | [`migrations/20260629_sprint_06b_faculty_mentor_framework.sql`](./migrations/20260629_sprint_06b_faculty_mentor_framework.sql) | **Sprint 06B** — `faculty_day_templates`, `mentor_day_guides`, coaching log columns, Week 1 seed |
| **19** | [`migrations/20260630_sprint_06c_venture_portfolio.sql`](./migrations/20260630_sprint_06c_venture_portfolio.sql) | **Sprint 06C** — `venture_portfolios`, `venture_portfolio_sections`, `portfolio_assets`, `portfolio_milestones`, `portfolio_exports` |
| **20** | [`migrations/20260615_onboarding_refactor.sql`](./migrations/20260615_onboarding_refactor.sql) | **Onboarding refactor** — cohort suggestions/votes/finalists, formation squads (bigint cohorts), intern onboarding flags |
| **21** | [`migrations/20260616_onboarding_hotfix.sql`](./migrations/20260616_onboarding_hotfix.sql) | Cohort seed + link interns to cohort |
| **22** | [`migrations/20260617_fix_rls_recursion.sql`](./migrations/20260617_fix_rls_recursion.sql) | **Required** — fixes `stack depth limit exceeded` on cohorts |

**Quick checklist (22 steps after project creation):**

```
☐  1  schema.sql
☐  2  20260606_sprint_01_scaffold.sql
☐  3  20260620_sprint_02_instructional_architecture.sql
☐  4  activation_codes.sql
☐  5  password_reset_requests.sql
☐  6  20260621_sprint_03_playbook_completions.sql
☐  7  20260622_sprint_04_survey_engine.sql
☐  8  20260623_sprint_04_fna_engine.sql
☐  9  20260624_sprint_04_timeline_engine.sql
☐ 10  20260625_sprint_05_blueprint_integration.sql
☐ 11  20260607_sprint_05c_canvas_summary.sql
☐ 12  20260626_sprint_05b_research_squad_intelligence.sql
☐ 13  20260608_sprint_day1_builders.sql
☐ 14  20260609_cohort_squad_formation.sql
☐ 15  20260610_venture_coach.sql
☐ 16  20260627_sprint_06a_content_studio.sql
☐ 17  20260628_coach_training_rag.sql
☐ 18  20260629_sprint_06b_faculty_mentor_framework.sql
```

---

## 3) First admin

After the first Auth sign-up:

1. Find the user UUID in **Authentication → Users**.
2. Run the commented SQL at the bottom of `schema.sql` to set role `ADMIN`.

---

## 4) Cloudflare Pages env vars

Set in **Workers & Pages → spike → Settings → Production**:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key |

Redeploy after changing env vars.

### Cloudflare secrets (Pages Functions — server-side only)

For AI Venture Coach (`/api/coach/generate`):

| Secret | Purpose |
|--------|---------|
| `GEMINI_API_KEY` | Primary LLM |
| `OPENAI_API_KEY` | Fallback when Gemini hits limits |

Do **not** prefix these with `VITE_`. Set in the same Cloudflare project under **Variables and Secrets** as encrypted values.

Local dev: copy `api/.env.example` → `api/.env` and run `cd api && npm run dev`.

---

## 5) Sprint reference — what each migration enables

| Sprint | Key tables / features |
|--------|------------------------|
| **01** | `cohorts`, `segments` → `days`, portfolio entries |
| **02** | Competencies, milestones, sessions, rubrics, blueprint mappings |
| **03** | Playbook completions |
| **04** | Surveys, FNA, timeline, coaching |
| **05** | Blueprint canvas, leadership journal, research squads |
| **05b–05c** | Cohort analytics, canvas summary |
| **Day 1 builders** | Structured builder artifacts |
| **Cohort / squads** | Formation, themes, assignments |
| **Venture Coach** | Coach section drafts per participant |
| **06A Content Studio** | `content_blocks`, `content_assets`, `day_content_sequences`, curriculum CMS views |

---

## 6) App integration map

| Feature | Code | Migration |
|---------|------|-----------|
| Auth + profiles | `src/AuthContext.jsx`, `src/supabaseClient.js` | `schema.sql` |
| Intern progress | `src/lib/supabase/interns.js` | `schema.sql` |
| Curriculum (JSON + DB) | `src/lib/curriculumService.js`, `src/lib/contentLoader.js` | 01, 02, 06A |
| Playbook delivery | `src/pages/PlaybookShell.jsx`, `src/components/playbook/*` | 03 |
| Survey engine | `src/lib/surveyService.js` | 07 |
| FNA | `src/lib/fnaService.js` | 08 |
| Timeline / coaching | `src/lib/timelineService.js`, `src/lib/coachingService.js` | 09 |
| Venture Blueprint | `src/lib/ventureBlueprintSync.js` | 10, 11 |
| Cohort / squads | `src/lib/cohortOnboardingService.js`, `src/lib/supabase/cohortOnboarding.js` | 14, 20 |
| Venture Coach | `src/lib/ventureCoachService.js` | 15 |
| **Content Studio** | `src/lib/contentStudioService.js`, `/admin/content-studio` | **16** |
| AI coach API | `functions/api/coach/generate.js` | Cloudflare secrets (not Supabase) |

The `api/` folder is optional local JWT dev only; **production uses Supabase**.

---

## 7) Content Studio (Sprint 06A)

After step **16**:

- Admin → **Content** → **Open Content Studio**, or `/admin/content-studio`
- Roles: `ADMIN`, `FACULTY`
- Spec: [`SPRINT_06A_CONTENT_STUDIO.md`](../SPRINT_06A_CONTENT_STUDIO.md)

Until step 16 is applied, Content Studio lists fall back to JSON curriculum; block tables will be empty.

---

## 8) Verify

1. **Table Editor** — confirm `content_blocks`, `playbook_completions`, `profiles` exist.
2. Sign in as admin → **Admin → Content Studio** → Curriculum shows Segment 1 / Week 1 / Days 1–5.
3. **Playbook** — Day 1 still loads from `/content` JSON (delivery path unchanged until CMS publish pipeline ships).
