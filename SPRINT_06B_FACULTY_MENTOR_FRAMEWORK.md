# Sprint 06B — Faculty & Mentor Framework System

## PRD vs shipped

| PRD item | Status | Notes |
|----------|--------|-------|
| `/faculty` dashboard | ✅ | `FacultyHomePage` — cohort metrics, Day 1 panel, playbook links |
| `/mentor` dashboard | ✅ | `MentorHomePage` — squads, risk flags, blueprint avg, playbook links |
| `/admin/faculty-playbook` | ✅ | Template admin table + Content Studio links |
| `/admin/mentor-playbook` | ✅ | Guide admin table + Content Studio links |
| `faculty_day_templates` | ✅ | Migration + Week 1 seed + JSON fallback |
| `mentor_day_guides` | ✅ | Migration + Week 1 seed + JSON fallback |
| Faculty playbook delivery | ✅ | `/faculty/playbook` → day detail pages |
| Mentor playbook delivery | ✅ | `/mentor/playbook` → day guide pages |
| Content Studio faculty/mentor guides | ✅ | Block types + nav (06A); Playbooks hub links 06B templates |
| Structured `coaching_sessions` | ✅ | Extended columns + mentor action wiring |
| Role separation | ✅ | Faculty `/faculty/*`; Mentor `/mentor/*`; scoped nav |
| Participant coaching card | ✅ | Venture Coach review + 5 mentor actions |
| Mentor assignment scoping | ⏳ | All cohort visible until `mentor_id` assignment table |
| CMS inline edit of templates | ⏳ | Admin tables read-only; edit via Supabase or future forms |

## Routes

| Route | Role | Purpose |
|-------|------|---------|
| `/faculty` | Faculty, Admin | Faculty operating home |
| `/faculty/playbook` | Faculty, Admin | Week/day faculty framework browser |
| `/faculty/playbook/:segment/:week/:day` | Faculty, Admin | Day template detail |
| `/faculty/advisory` | Faculty, Admin | Traction approvals & hour logging |
| `/mentor` | Mentor, Admin | Mentor operating home |
| `/mentor/playbook` | Mentor, Admin | Week/day mentor guide browser |
| `/mentor/playbook/:segment/:week/:day` | Mentor, Admin | Day guide detail |
| `/mentor/advisory` | Mentor, Admin | Traction & hours |
| `/mentor/participants` | Mentor, Admin | Participant list + Venture Coach reviews |
| `/admin/faculty-playbook` | Faculty, Admin | Manage faculty day templates |
| `/admin/mentor-playbook` | Mentor, Admin | Manage mentor day guides |

## Migration

Run **step 18**: `supabase/migrations/20260629_sprint_06b_faculty_mentor_framework.sql`

## Design principle

- **Faculty** answers: *What should participants know?*
- **Mentor** answers: *What should participants become?*

Week 1 themes:

- Faculty: **Dream • Discover • Decide**
- Mentor: **Identity • Confidence • Direction**
