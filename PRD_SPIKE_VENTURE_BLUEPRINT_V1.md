# SPIKE Venture Blueprint™

**Product Requirements Document (PRD)**  
**Version:** 1.1  
**Project:** SPIKE ASC Platform  
**Status:** Complete foundation — north star for all platform development

**Related docs**

- Gap analysis (implemented vs PRD): [`PRD_SPIKE_VENTURE_BLUEPRINT_V1_GAP_ANALYSIS.md`](./PRD_SPIKE_VENTURE_BLUEPRINT_V1_GAP_ANALYSIS.md)
- Sprint 02 instructional architecture: [`PLAYBOOK_SCHEMA_V1.md`](./PLAYBOOK_SCHEMA_V1.md)
- Sprint 02 execution plan: [`PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md`](./PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md)

**Document structure**

- **Part I** — Venture Blueprint™ modules (participant OS)
- **Part II** — Platform engines (state, playbook, score, roadmaps, research, FNA, coaching, timeline, achievements, boards, authoring, reporting, AI readiness)
- **Final product vision** — experiential target for the completed platform

---

## Purpose

The **SPIKE Venture Blueprint™** is the central operating system for every participant.

It is **not** a page in the LMS. It is the core product surface of the platform.

The Venture Blueprint serves simultaneously as:

| Role | Description |
|------|-------------|
| Personal Development Plan | Identity, vision, and growth narrative |
| Career Roadmap | ACS progression and promotion readiness |
| Business Plan | Living 3-year venture plan assembled from daily work |
| Venture Portfolio | Evidence portfolio for boards and mentors |
| Production Tracker | Client growth funnel and case metrics |
| Recruitment Tracker | Agency Builder talent pipeline |
| Leadership Tracker | Team production and leadership pipeline |
| Promotion Tracker | Readiness scores toward next ACS position |
| Venture Board Submission | Automated board packets at Hour 200 / 400 / 600 |

Every activity completed within SPIKE automatically updates the Venture Blueprint.

The Venture Blueprint becomes the participant's most valuable asset and remains usable **beyond the internship**.

---

## Core Design Principle

Participants should **never** manually create a business plan at Hour 200.

Instead, every input streams into the Blueprint without duplicate data entry:

- Every lesson
- Every survey
- Every worksheet
- Every assessment
- Every field activity
- Every coaching session

**Automatically contributes to the Venture Blueprint.**

---

## System Structure

```text
SPIKE Venture Blueprint™
├── Vision & Purpose
├── Financial Entrepreneurship Canvas
├── Client Growth Engine
├── Production Engine
├── Recruitment Engine
├── Leadership Engine
├── Career Accelerator
├── Venture Board Reports
└── Export Center
```

> **Note:** The spec also references a **Specialist Consultant Track** (Module 7) and **Reports Center** (Module 9) as first-class surfaces within or adjacent to the Blueprint OS.

---

## Module 1 — Vision & Purpose

### Purpose

Establish participant identity and direction.

### Database Table: `vision_profiles`

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid / bigint | Primary key |
| `participant_id` | uuid / bigint | FK → participant |
| `mission_statement` | text | Mission Statement Builder output |
| `vision_statement` | text | Vision Statement Builder output |
| `personal_why` | text | From playbook / worksheets |
| `future_self_narrative` | text | Rich text, min 500 words |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Components

#### Mission Statement Builder

Guided questions:

1. What matters most to me?
2. Who do I want to help?
3. What impact do I want to create?

#### Vision Statement Builder

Guided questions:

1. Where do I want to be in 3 years?
2. What lifestyle do I want?
3. What career do I want?

#### Future Self Narrative

- Rich text editor
- **Minimum:** 500 words

#### Dream Board

- Image uploads
- Categories: Lifestyle, Family, Health, Career, Financial, Community

### Progress Calculation

| Component | Weight |
|-----------|--------|
| Mission Statement | 25% |
| Vision Statement | 25% |
| Future Self Narrative | 25% |
| Dream Board | 25% |

---

## Module 2 — Financial Entrepreneurship Canvas

### Purpose

Business Model Canvas adapted for **Financial Entrepreneurship**.

### Canvas Layout

Three growth engines plus foundation:

```text
Financial Entrepreneurship Canvas
├── Client Growth Engine
├── Talent Growth Engine
├── Leadership Growth Engine
└── Foundation
```

#### Client Growth Engine — Fields

- Customer Segments
- Value Proposition
- Channels
- Client Relationships
- Revenue Streams

#### Talent Growth Engine — Fields

- Talent Segments
- Recruit Value Proposition
- Recruitment Channels
- Talent Development System

#### Leadership Growth Engine — Fields

- Culture Statement
- Leadership System
- Expansion Strategy
- Growth Multipliers

#### Foundation — Fields

- Key Resources
- Key Partners
- Cost Structure

---

## Module 3 — Client Growth Engine

### Purpose

Build production capability.

### Database Table: `client_growth`

| Field | Notes |
|-------|-------|
| `participant_id` | FK → participant |
| `target_market` | Defined market focus |
| `prospects` | Funnel stage count |
| `contacts` | |
| `appointments` | |
| `fnas` | Financial Needs Analyses |
| `proposals` | |
| `applications` | |
| `issued_cases` | |
| `referrals` | |

### Funnel Visualization

```text
Prospects
    ↓
Contacts
    ↓
Appointments
    ↓
FNAs
    ↓
Proposals
    ↓
Applications
    ↓
Issued Cases
```

### KPIs

- Conversion %
- Case Count
- FYC (First Year Commission)
- Average Premium
- Referral Rate

---

## Module 4 — Recruitment Engine

**Track:** Agency Builder

### Purpose

Track recruitment activities.

### Database Table: `recruitment_funnel`

| Field | Notes |
|-------|-------|
| `participant_id` | FK → participant |
| `recruit_leads` | |
| `interviews` | |
| `candidates` | |
| `endorsed` | |
| `licensed` | |
| `active` | Active advisors |

### Funnel Visualization

```text
Leads
    ↓
Interviews
    ↓
Candidates
    ↓
Licensed
    ↓
Active Advisors
```

### KPIs

- Recruitment Conversion
- Licensing Conversion
- Activation Rate
- Retention Rate

---

## Module 5 — Leadership Engine

**Track:** Agency Builder

### Purpose

Track leadership growth.

### Database Table: `leadership_pipeline`

| Field | Notes |
|-------|-------|
| `participant_id` | FK → participant |
| `advisor_count` | |
| `aum_count` | Associate Unit Managers |
| `um_count` | Unit Managers |
| `sum_count` | Senior Unit Managers |
| `emerging_leaders` | Pipeline identifiers |

### Team Dashboard

Displays:

- Team Production
- Team Cases
- Recruitment Activity
- Leadership Readiness

---

## Module 6 — Career Accelerator

### Purpose

Track ACS progression.

### Career Path

```text
Advisor
    ↓
Associate Unit Manager (AUM)
    ↓
Unit Manager (UM)
    ↓
Senior Unit Manager (SUM)
    ↓
Agency Director
```

### Promotion Readiness Widget

Each target position displays progress across dimensions:

| Dimension | Example (AUM Readiness) |
|-----------|-------------------------|
| Production Progress | 85% |
| Recruitment Progress | 60% |
| Activation Progress | 40% |
| Persistency Progress | — |
| Leadership Progress | — |
| **Overall Readiness** | **62%** |

### Database Table: `career_progress`

| Field | Notes |
|-------|-------|
| `participant_id` | FK → participant |
| `current_position` | ACS role enum |
| `target_position` | Next role |
| `production_score` | 0–100 |
| `recruitment_score` | 0–100 |
| `activation_score` | 0–100 |
| `leadership_score` | 0–100 |
| `readiness_score` | Weighted overall |

---

## Module 7 — Specialist Consultant Track

### Purpose

Alternative growth path to Agency Builder.

### Database Table: `specialist_blueprint`

| Field | Notes |
|-------|-------|
| `participant_id` | FK → participant |
| `niche_market` | |
| `authority_plan` | |
| `content_plan` | |
| `partnership_plan` | |
| `practice_growth_plan` | |

### Specialist Dashboard

Displays:

- Clients
- Referrals
- Content Activities
- Speaking Activities
- Partnerships
- Practice Growth

---

## Module 8 — Venture Board System

### Purpose

Automated milestone reviews at program hour gates.

### Hour 200 — Proof of Concept Board

**Required packet sections:**

- Vision
- Canvas
- Market Research
- 3-Year Blueprint

### Hour 400 — Market Validation Board

**Required packet sections:**

- Production Results
- Client Metrics
- Growth Metrics

### Hour 600 — Partnership Board

**Required packet sections:**

- Leadership Results
- Recruitment Results
- Expansion Metrics

---

## Module 9 — Reports Center

Generate on demand:

| Report | Audience |
|--------|----------|
| Venture Blueprint PDF | Participant, mentor, board |
| Production Report | Participant, faculty |
| Recruitment Report | Agency Builder track |
| Leadership Report | Agency Builder track |
| Promotion Readiness Report | Participant, mentor |
| Venture Board Packet | Board reviewers |

---

## Module 10 — Export Center

### Export Formats

- PDF
- DOCX
- PPTX

Exports assemble live Blueprint data — not static snapshots unless versioned for board submission.

---

## Automation Engine

Every completed platform object automatically updates the Venture Blueprint:

| Source Object | Blueprint Destination (examples) |
|---------------|----------------------------------|
| Assignments | Relevant engine section + deliverables tracker |
| Worksheets | Vision & Purpose, Canvas sections, portfolio artifacts |
| Surveys | Research outputs, market intelligence |
| FNAs | Client Growth Engine funnel |
| Production Logs | Client Growth KPIs |
| Recruitment Logs | Recruitment Engine funnel |
| Coaching Notes | Career Accelerator, Leadership Engine |
| Assessments | Competency evidence, board readiness |

**Requirement:** No duplicate data entry. Single write path → Blueprint aggregation layer.

```text
Playbook / Field / Coaching Event
        ↓
   Automation Engine (event bus + mappers)
        ↓
   SPIKE Venture Blueprint™ modules
```

---

## Dashboard Priority

### Default landing experience

When a participant logs in, the default landing page should **NOT** be the LMS.

The default landing page should be:

## **My Venture Blueprint™**

Showing at a glance:

| Widget | Data source |
|--------|-------------|
| Current Career Track | `career_progress` / track selection |
| Venture Blueprint Completion % | Weighted module progress |
| Production Funnel | `client_growth` |
| Recruitment Funnel | `recruitment_funnel` (Agency Builder) |
| Promotion Readiness | `career_progress.readiness_score` |
| Upcoming Deliverables | Playbook + milestone engine |

Staff roles (faculty, mentor, admin) may retain role-specific dashboards; intern default = Venture Blueprint.

---

## Success Metric

A participant should be able to answer within **30 seconds** of opening the platform:

1. **Where am I now?**
2. **Where am I going?**
3. **What must I do next?**
4. **Am I on track?**

If any answer requires navigating more than one screen or manual reconciliation of data, the Blueprint OS has failed its primary UX goal.

---

# Part II — Platform Engines

These engines sit beneath the Venture Blueprint™ and power every participant experience. Playbook curriculum, surveys, assessments, and Venture Board workflows **plug into this architecture** — they do not define a parallel system.

---

## Engine 1 — SPIKE Program State Engine

### Purpose

Every participant must always have a single, authoritative **master state object** readable by all modules, dashboards, and automations.

### Required state fields

| Field | Description |
|-------|-------------|
| `participant_id` | Unique participant identifier |
| `segment` | Current program segment (1–3) |
| `week` | Current week within segment |
| `day` | Current day within program |
| `career_track` | `agency_builder` \| `specialist_consultant` |
| `career_position` | Current ACS / specialist position slug |
| `blueprint_completion` | Overall Venture Blueprint % (0–100) |
| `venture_board_status` | Board workflow state for active gate |

### Example

```json
{
  "participant_id": "123",
  "segment": 1,
  "week": 3,
  "day": 12,
  "career_track": "agency_builder",
  "career_position": "advisor",
  "blueprint_completion": 42,
  "venture_board_status": "in_progress"
}
```

### Database

Table: `participant_program_state` (or materialized view over normalized tables)

- Single read API: `getParticipantState(participantId)`
- Updated by: playbook progress, blueprint modules, board workflow, admin overrides
- Displayed on: Venture Blueprint home, nav header, mentor dashboards

---

## Engine 2 — Playbook Integration Engine

### Purpose

Every LMS activity declares **where its completion flows** in the Venture Blueprint. No duplicate encoding.

### Activity contribution contract

```json
{
  "activity_id": "day1_dreamboard",
  "portfolio_section": "vision_and_purpose",
  "blueprint_module": "vision",
  "completion_weight": 5
}
```

| Field | Description |
|-------|-------------|
| `activity_id` | Stable playbook object ID (day, worksheet, survey, etc.) |
| `portfolio_section` | Portfolio section slug |
| `blueprint_module` | Blueprint module target (`vision`, `canvas`, `client_growth`, …) |
| `completion_weight` | Points toward module / blueprint completion % |

### Behavior

```text
Complete activity → Playbook Integration Engine → Automation Engine → Venture Blueprint
```

- Extends Sprint 02 `DayContribution` with `blueprint_module` and `completion_weight`
- Stored in: `activity_blueprint_mappings` (admin-authorable; see Engine 13)
- **Rule:** One activity definition, one mapping — never re-enter data in Blueprint UI

---

## Engine 3 — SPIKE Score System

### SPIKE Readiness Score™

A single composite score displayed **everywhere** (Blueprint home, nav, reports, mentor views).

| Dimension | Weight |
|-----------|--------|
| Learning | 20% |
| Portfolio | 20% |
| Production | 20% |
| Recruitment | 15% |
| Leadership | 15% |
| Professionalism | 10% |

### Database

Table: `spike_readiness_scores`

- `participant_id`
- Dimension sub-scores (0–100)
- `composite_score` (weighted)
- `calculated_at`

### Display surfaces

- Venture Blueprint header widget
- Career Accelerator promotion context
- Cohort / mentor / agency dashboards
- Venture Board readiness gates

---

## Engine 4 — Agency Builder Roadmap Engine

### Purpose

Configurable ACS career ladder for Agency Builder track. **Do not hardcode** — ACS qualification rules change over time.

### Default ladder (admin-seeded, editable)

```text
Advisor
    ↓
Associate Unit Manager (AUM)
    ↓
Unit Manager (UM)
    ↓
Senior Unit Manager (SUM)
    ↓
Agency Director
```

### Per-position qualification metrics

Each position defines thresholds for:

| Metric | Notes |
|--------|-------|
| Production | Cases, FYC, persistency |
| Recruitment | Leads, licensed, active |
| Activation | New advisor activation rate |
| Leadership | Team size, UM pipeline |
| Persistency | Policy retention standards |

### Database

| Table | Purpose |
|-------|---------|
| `career_positions` | Position slug, title, track, sort order, active flag |
| `position_qualifications` | Metric key, threshold, weight, effective date |
| `career_progress` | Participant scores vs current target position |

### Admin requirement

- UI to add/edit positions and qualification metrics without code deploy
- Versioned rules: `effective_from` / `effective_to` for ACS policy changes

---

## Engine 5 — Specialist Consultant Roadmap Engine

### Purpose

Equivalent visible career journey for Specialist track.

### Default ladder (admin-seeded, editable)

```text
Associate Advisor
    ↓
Professional Advisor
    ↓
Senior Consultant
    ↓
Market Specialist
    ↓
Practice Principal
```

### Database

Reuses `career_positions` with `track = specialist_consultant` and specialist-specific qualification metrics (clients, referrals, content, speaking, partnerships, practice revenue).

### UX requirement

Specialists see their ladder in **Career Accelerator** and **Module 7 dashboard** — not Agency Builder funnels.

---

## Engine 6 — Research Squad System

### Purpose

Cohort-based market research teams with deliverables auto-routed to portfolio.

### Database Table: `research_squads`

| Field | Notes |
|-------|-------|
| `id` | Primary key |
| `cohort_id` | FK → cohort |
| `name` | Squad display name |
| `market_segment` | Supported segment enum (below) |
| `mentor_id` | FK → mentor |

### Supported market segments

- Gen Z
- Young Professionals
- Families
- OFWs
- Business Owners
- Healthcare Professionals

### Research deliverables

| Deliverable | Auto-save destination |
|-------------|----------------------|
| Survey Results | Portfolio → Market Intelligence |
| Opportunity Maps | Portfolio → Market Intelligence |
| Customer Personas | Portfolio → Market Intelligence |
| Presentation Decks | Portfolio → Market Intelligence |
| Research Reports | Portfolio → Market Intelligence |

### Integration

- Links to Survey Engine (Engine 7)
- Research Squad membership drives `ResearchProject` / squad views in Research module

---

## Engine 7 — Survey Engine

### Purpose

Full survey authoring and response collection for curriculum and field research.

### Question types (required)

| Type | Use case |
|------|----------|
| Short Answer | Quick captures |
| Long Answer | Narrative reflection |
| Multiple Choice | Multi-select |
| Single Select | Single choice |
| Scale Rating | Likert / 1–5 / 1–10 |
| Matrix | Grid questions |
| Ranking | Ordered preferences |

### Planned survey families (future content)

- Financial Literacy Surveys
- Client Discovery Surveys
- Recruitment Surveys
- Culture Surveys

### Database

- `surveys`, `survey_questions`, `survey_responses`, `survey_response_answers`
- Question `type` enum must include all types above
- Responses trigger Playbook Integration Engine → Blueprint / Portfolio updates

---

## Engine 8 — FNA Engine

### Purpose

**Critical** production module. Financial Needs Analysis records drive Client Growth Engine.

### Module: Financial Needs Analysis

| Field | Notes |
|-------|-------|
| Client Name | |
| Age | |
| Income | |
| Dependents | |
| Assets | |
| Liabilities | |
| Protection Gap | Calculated or entered |
| Retirement Gap | Calculated or entered |
| Recommendations | Structured or rich text |

### Status workflow

```text
Draft → Completed → Presented → Implemented
```

### Automation

On status transition:

- Updates `client_growth` funnel (`fnas`, downstream stages as applicable)
- Contributes to SPIKE Readiness Score™ (Production dimension)
- Appears on Activity Timeline (Engine 10)

### Database

Table: `financial_needs_analyses` (+ optional `fna_recommendations` child table)

---

## Engine 9 — Coaching Engine

### Purpose

Every mentor interaction becomes structured, timeline-visible data.

### Database Table: `coaching_sessions`

| Field | Notes |
|-------|-------|
| `participant_id` | FK |
| `mentor_id` | FK |
| `session_date` | |
| `topic` | Category / free text |
| `notes` | Session notes |
| `action_items` | JSON array or child table |
| `follow_up_date` | |

### Display

- **Venture Blueprint Timeline** (Engine 10)
- Mentor Dashboard (Engine 14)
- Professionalism dimension of SPIKE Readiness Score™

---

## Engine 10 — Timeline Engine

### Purpose

LinkedIn-style **activity feed** per participant.

### Event types

| Event | Source |
|-------|--------|
| Lessons Completed | Playbook |
| Worksheets Submitted | Playbook |
| Surveys Completed | Survey Engine |
| FNAs Conducted | FNA Engine |
| Recruits Added | Recruitment Engine |
| Coaching Sessions | Coaching Engine |
| Venture Board Milestones | Board Workflow (Engine 12) |

### Database

Table: `participant_timeline_events`

- `participant_id`, `event_type`, `source_id`, `title`, `summary`, `occurred_at`, `metadata` (jsonb)
- Append-only log; fed by Automation Engine on domain events

### UX

- Chronological feed on Venture Blueprint home
- Filterable by event type
- Staff can view participant timeline read-only

---

## Engine 11 — Achievements System

### Purpose

SPIKE Milestones as **badges** — motivation and board readiness signals.

### Example achievements

| Badge | Trigger |
|-------|---------|
| First Survey | First survey submitted |
| First FNA | First FNA completed |
| First Client Meeting | Appointment logged |
| First Policy | Issued case |
| First Recruit | First recruit lead |
| AUM Qualified | Meets AUM qualification snapshot |
| UM Qualified | Meets UM qualification snapshot |
| Hour 200 Complete | Venture Board gate passed |

### Database

- `achievement_definitions` (admin-configurable)
- `participant_achievements` (earned_at, source_event_id)

### Display

- Badge strip on Venture Blueprint
- Profile / timeline highlights
- Optional inclusion in Venture Board packet

---

## Engine 12 — Venture Board Workflow

### Purpose

Workflow-driven board process — not a static form submit.

### Hour 200 example workflow

```text
Portfolio Ready
    ↓
Mentor Review
    ↓
Faculty Review
    ↓
Board Scheduling
    ↓
Presentation
    ↓
Scoring
    ↓
Decision
```

### State machine

- `venture_board_status` on Program State Engine (Engine 1) reflects current step
- Roles: participant, mentor, faculty, board reviewer, admin
- Each transition validates required Blueprint sections (Module 8)

### Database

- `venture_board_submissions`
- `venture_board_workflow_steps` (step, status, actor, timestamp, notes)
- `venture_board_scores` (criterion, score, reviewer)

### Gates

| Hour | Board |
|------|-------|
| 200 | Proof of Concept |
| 400 | Market Validation |
| 600 | Partnership |

---

## Engine 13 — Content Authoring System

### Purpose

**Crucial.** Admins create curriculum from UI — no code changes, no JSON editing.

### Authorable objects

| Object | Hierarchy |
|--------|-----------|
| Segment | Program child |
| Week | Segment child |
| Day | Week child |
| Presentation | Day child |
| Slide | Presentation child |
| Activity | Day child |
| Worksheet | Day child |
| Assessment | Day child |
| Survey | Day child |
| Rubric | Assessment child |

### Requirements

- WYSIWYG or structured forms for instructional content
- Activity → Playbook Integration mapping UI (Engine 2)
- Publish / draft / version workflow
- Replaces file-based `/content` JSON as **production** path (JSON import remains dev/bootstrap option)

### Roles

- `admin` / `faculty` content authors
- Audit log on publish

---

## Engine 14 — Reporting Center

### Purpose

Executive intelligence across cohort, mentor, and agency lenses.

### Cohort Dashboard

| Metric | Source |
|--------|--------|
| Enrollment | Cohorts |
| Completion | Program State + Playbook |
| Licensing | Recruitment funnel |
| Production | Client Growth |
| Recruitment | Recruitment funnel |
| Board Readiness | Venture Board Workflow + Blueprint % |

### Mentor Dashboard

| Metric | Source |
|--------|--------|
| Coaching Effectiveness | Coaching Engine |
| Participant Completion | Blueprint + playbook |
| At-Risk Participants | Readiness Score + stalled state |

### Agency Dashboard

| Metric | Source |
|--------|--------|
| Future AUM Candidates | Career Accelerator + qualifications |
| Future UM Candidates | Leadership pipeline |
| Future Agency Director Candidates | Composite readiness + leadership |

### Access

- `faculty`, `mentor`, `admin` — role-scoped views
- Export to PDF where applicable (Module 9)

---

## Engine 15 — AI Readiness (Architecture Only)

### Purpose

Design for future AI features. **Do not implement in current sprints** — extensible schema and event hooks only.

### Planned capabilities

| Feature | Function |
|---------|----------|
| AI Mentor | Suggest next actions from state + timeline |
| AI Blueprint Reviewer | Review business plan / canvas completeness |
| AI Presentation Coach | Venture Board presentation feedback |
| AI Career Navigator | Recommend Advisor vs Agency Builder vs Specialist |

### Architecture requirements

- `ai_insights` table: `participant_id`, `insight_type`, `payload` (jsonb), `model_version`, `created_at`
- Event bus emits: `blueprint.updated`, `board.submitted`, `fna.completed` for future workers
- PII boundaries documented before any model integration
- Human-in-the-loop: AI outputs are **suggestions**, never auto-committed scores or board decisions

---

# Final Product Vision

When a participant opens SPIKE ASC, they should feel they are inside:

```text
Notion
  + LinkedIn
  + HubSpot CRM
  + Business Model Canvas
  + Career Accelerator
  + Venture Portfolio Builder
```

…specifically built for:

- **Financial Entrepreneurs**
- **Agency Builders**
- **Future Agency Directors**
- **Specialist Financial Consultants**

### Platform promise

This PRD is the **completed foundation** before full platform build-out. Once these engines exist:

- Playbook Engine
- Day 1–25 (and full 200h) curriculum
- Surveys and assessments
- Venture Board workflows

…all **plug into the same architecture** without future rewrites.

```text
                    ┌─────────────────────────┐
                    │  Program State Engine   │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 ┌──────────────┐      ┌─────────────────┐     ┌──────────────┐
 │   Playbook   │      │ Venture Blueprint│     │  Reporting   │
 │  + Authoring │─────▶│       ™ OS       │◀────│   Center     │
 └──────────────┘      └────────┬─────────┘     └──────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        FNA / Production   Recruitment /      Timeline /
        Client Growth      Leadership         Achievements
```

---

## Relationship to Sprint 02

Sprint 02 implements the **Playbook Integration** substrate. This PRD defines what it integrates **into**.

| Sprint 02 artifact | PRD engine consumer |
|--------------------|---------------------|
| `DayContribution` | Engine 2 — Playbook Integration (extend with `blueprint_module`, `completion_weight`) |
| `BusinessPlanArtifact` | Module 2 Canvas + 3-Year Blueprint |
| `PortfolioArtifact` | Modules 1, 6, 8 + Research deliverables |
| `CareerTrack` / `TrackRequirement` | Engines 4–5 Roadmaps |
| `VentureBoard` | Engine 12 Workflow |
| `content/*.json` | Engine 13 bootstrap; replaced by authoring UI in production |
| `playbookSeeds.js` | Reference data until admin CMS |

**Alignment rule:** New Sprint 02 PRs should not introduce parallel portfolio/business-plan UX — route through Blueprint module slugs defined here.

---

## Out of Scope (implementation phasing)

- AI features (Engine 15) — schema and events only
- Final PDF/DOCX/PPTX rendering pipeline
- Real-time sync with external CRM / production systems
- Full Content Authoring UI (Engine 13) — phased after playbook read path
- Post-internship alumni portal

---

## Acceptance Criteria (Platform V1)

### Venture Blueprint™

- [ ] Intern login lands on **My Venture Blueprint™**, not generic LMS dashboard
- [ ] Vision & Purpose module shows weighted completion (4 × 25%)
- [ ] Client Growth funnel renders from `client_growth` with KPI strip
- [ ] Agency Builder sees Recruitment + Leadership engines; Specialist sees Module 7 + Engine 5 ladder
- [ ] Completing a playbook activity updates Blueprint via Engine 2 without re-entry

### Platform engines

- [ ] Program State Engine returns master state object for any participant
- [ ] SPIKE Readiness Score™ visible on Blueprint home and updates on domain events
- [ ] Agency Builder and Specialist roadmaps load from DB — not hardcoded in frontend
- [ ] FNA record transitions update Client Growth Engine
- [ ] Coaching session appears on participant timeline within 5 seconds of save
- [ ] Hour 200 board follows workflow states through Decision
- [ ] At least one achievement badge auto-awarded on First FNA
- [ ] Cohort Dashboard shows enrollment, completion, board readiness
- [ ] 30-second success metric validated in usability test (n ≥ 5 interns)

---

**END OF PRD — SPIKE Venture Blueprint™ V1.1**
