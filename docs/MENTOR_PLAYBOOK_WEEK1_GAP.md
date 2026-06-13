# Mentor Playbook Framework — Week 1 Gap Analysis

**Version 1.0** · Specification vs implementation

## Summary

| Area | Status |
|------|--------|
| Mentor Dashboard (`/mentor`) | **Shipped** — participants, squads, coaching queue, week progress widgets |
| Participant Coaching Card (`/mentor/participant/{id}`) | **Shipped** — identity, outputs, notes, assessment, Week 1 summary |
| Coaching Notes System | **Shipped** — structured fields, follow-up, mark complete (localStorage + Supabase write) |
| Weekly Assessment | **Shipped** — 5 categories, 1–5 scale, mentor recommendation |
| Week 1 Playbook Content (Days 1–5) | **Shipped** — spec-aligned questions, observation areas, expected outputs |
| Week 1 Coaching Summary | **Shipped** — auto-generated from notes + assessment |
| Content Studio types | **Shipped** — mentor_guide, coaching_template, observation_form, reflection_form |

## Module checklist

### Module 1 — Mentor Dashboard

| Widget | Spec | Implementation |
|--------|------|----------------|
| Assigned Participants | Photo, name, squad, career track, progress % | Name, squad, track, progress % (`MentorDashboardPanels`) |
| Assigned Squads | Name, members, completion %, status | Shipped with status labels |
| Coaching Queue | Needs Review, Follow-Up, At Risk, Incomplete | `deriveCoachingQueue()` |
| Week Progress | Day 1–5 complete | `deriveWeek1DayProgress()` cohort % |

**Remaining gap:** Mentor-scoped assignment filter — wired via `filterInternsForMentor()` when squad `mentorId` is set in formation store.


### Module 2 — Participant Coaching Card

| Section | Status |
|---------|--------|
| Venture Identity (ambition, impact, values, tagline) | ✓ |
| Venture Direction | ✓ |
| Current Outputs (future self, dream board, canvas, portfolio) | ✓ `MentorParticipantOutputs` |
| Mentor Notes (strengths, challenges, actions) | ✓ `MentorCoachingSessionForm` |
| Weekly Assessment | ✓ |
| Week 1 Summary | ✓ |

### Module 3 — Coaching Notes (`coaching_sessions`)

| Field | DB | UI |
|-------|----|----|
| mentor_id, participant_id | ✓ | ✓ |
| week, day | ✓ | ✓ |
| discussion_summary | ✓ | ✓ |
| strengths, growth_areas | ✓ | ✓ |
| action_items | ✓ | ✓ (line-separated) |
| follow_up_required, follow_up_date | ✓ | ✓ |
| created_at | ✓ | ✓ |

**Remaining gap:** Supabase read-back hydrates when local cache is empty (writes always sync).


### Module 4 — Weekly Assessment

| Category | Status |
|----------|--------|
| Identity Clarity | ✓ |
| Engagement | ✓ |
| Coachability | ✓ |
| Communication | ✓ |
| Leadership Potential | ✓ |

Table: `weekly_mentor_assessments` (migration `20260701_sprint_06d_mentor_week1_framework.sql`).

### Week 1 Playbook Content

Seed + fallback: `src/lib/facultyMentorFrameworkSeed.js` (`MENTOR_DAY_GUIDES_SEED`).

Delivery: `/mentor/playbook/:segment/:week/:day` → `MentorDayFrameworkPage`.

### Content Studio

| Type | Status |
|------|--------|
| Mentor Guide | ✓ existing |
| Coaching Template | ✓ new block type |
| Assessment Template | ✓ via `assessment` type |
| Observation Form | ✓ new block type |
| Reflection Form | ✓ new block type |

## Routes

| Spec | Route |
|------|-------|
| Mentor Dashboard | `/mentor` |
| Participant Card | `/mentor/participant/{id}` (alias; list at `/mentor/participants`) |
| Mentor Playbook | `/mentor/playbook` |

## Success criteria

A new mentor can log in and:

1. See who needs coaching (queue) and week progress on the dashboard
2. Open a participant card with identity, outputs, and coaching tools
3. Follow Day 1–5 playbook guides with discussion questions and observation areas
4. Record structured coaching notes and a Week 1 assessment
5. Generate a Week 1 coaching summary on Day 5

## Key files

```
src/pages/mentor/MentorHomePage.jsx
src/pages/mentor/MentorVentureCoachPage.jsx
src/components/mentor/MentorDashboardPanels.jsx
src/components/mentor/MentorCoachingSessionForm.jsx
src/components/mentor/MentorWeeklyAssessmentPanel.jsx
src/components/mentor/MentorWeek1SummaryPanel.jsx
src/lib/mentorFrameworkService.js
src/lib/mentorWeek1Constants.js
src/lib/weeklyAssessmentService.js
src/lib/coachingService.js
supabase/migrations/20260701_sprint_06d_mentor_week1_framework.sql
```
