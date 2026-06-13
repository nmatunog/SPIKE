# Faculty Playbook Framework — Week 1 Gap Analysis

**Version 1.0** · Specification vs implementation

## Summary

| Area | Status |
|------|--------|
| Faculty Dashboard (`/faculty`) | **Shipped** — cohort metrics, Week 1 progress, delivery panels, submission matrix |
| Faculty Playbook (`/faculty/playbook`) | **Shipped** — 5 day templates with objectives, activities, rubrics |
| Week 1 Content Delivery (`/playbook`) | **Shipped** — Days 1–5 full bundles (decks, activities, evaluations) |
| Participant Submission Tracking | **Shipped** — per-day completion matrix on faculty dashboard |
| Mentor Assessment Coverage | **Shipped** — coaching notes + Week 1 assessment % on faculty dashboard |
| Faculty Day Framework Pages | **Shipped** — `/faculty/playbook/1/1/{day}` |

## Module checklist

### Module 1 — Faculty Dashboard

| Widget | Spec | Implementation |
|--------|------|----------------|
| Cohort Progress | Week 1 day completion % | `FacultyWeek1ProgressPanel` |
| Week 1 Delivery | Day 1–5 framework + playbook links | `FacultyDashboardPanels` |
| Submission Status | Per-participant day matrix | `deriveFacultyParticipantSubmissions()` |
| Assessment Coverage | Mentor coaching + assessment % | `deriveFacultyAssessmentCoverage()` |
| Day 1 Builder Detail | Engagement table | `FacultyDay1Panel` |

### Module 2 — Faculty Playbook Content

| Day | Theme | Status |
|-----|-------|--------|
| 1 | Discover Yourself | ✓ Full bundle |
| 2 | Opportunity | ✓ Full bundle |
| 3 | Customer | ✓ Full bundle |
| 4 | Entrepreneur | ✓ Full bundle |
| 5 | Commitment | ✓ Full bundle |

Seed + fallback: `src/lib/facultyMentorFrameworkSeed.js` (`FACULTY_DAY_TEMPLATES_SEED`).

### Module 3 — Faculty Framework Constants

| Item | Status |
|------|--------|
| Faculty philosophy | ✓ `facultyWeek1Constants.js` |
| Week theme | ✓ Dream • Discover • Decide |
| Day meta (objectives, outputs) | ✓ `WEEK1_FACULTY_DAY_META` |
| Framework service | ✓ `facultyFrameworkService.js` |

## Routes

| Spec | Route |
|------|-------|
| Faculty Dashboard | `/faculty` |
| Faculty Playbook | `/faculty/playbook` |
| Day Framework | `/faculty/playbook/1/1/{day}` |
| Live Delivery | `/playbook` (Faculty view) |
| Admin Templates | `/admin/faculty-playbook` |

## Success criteria

A faculty member can log in and:

1. See cohort Week 1 progress and per-day submission rates
2. Open Day 1–5 framework templates with objectives, rubrics, and speaker notes
3. Deliver live content via Playbook faculty view
4. Monitor which participants completed each day's deliverables
5. Track mentor coaching and assessment coverage across the cohort

## Key files

```
src/pages/faculty/FacultyHomePage.jsx
src/pages/faculty/FacultyPlaybookPage.jsx
src/pages/faculty/FacultyDayFrameworkPage.jsx
src/components/faculty/FacultyDashboardPanels.jsx
src/components/faculty/FacultyWeek1ProgressPanel.jsx
src/lib/facultyWeek1Constants.js
src/lib/facultyFrameworkService.js
src/lib/facultyMentorFrameworkSeed.js
content/segment-1/week-1/day-*/
```

## Remaining gaps

1. **CMS inline edit** — admin tables read-only; edit via Supabase or Content Studio
2. **Attendance tracking** — metric is estimated from hours, not session roll-call
3. **Faculty evaluation capture** — rubrics display in Playbook; scores not persisted to DB yet
