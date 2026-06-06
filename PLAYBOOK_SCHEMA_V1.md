# CURSOR SPRINT 02

# SPIKE PLAYBOOK ENGINE + INSTRUCTIONAL ARCHITECTURE PLATFORM

**Project:** SPIKE ASC Platform  
**Sprint:** Sprint 02

**Planning docs**

- Gap analysis: [`PLAYBOOK_SCHEMA_V1_GAP_ANALYSIS.md`](./PLAYBOOK_SCHEMA_V1_GAP_ANALYSIS.md)
- Execution plan: [`PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md`](./PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md)

---

## Objective

Transform SPIKE ASC from a portal with pages into a **curriculum architecture platform** capable of supporting:

- 200-Hour Segment 1
- Full 600-Hour SPIKE Program
- Venture Portfolio Engine
- Business Plan Engine
- Career Track Engine
- Research Squad System
- Venture Board System

This sprint is focused on **architecture and framework**.

Do **NOT** build complete curriculum content.

Do **NOT** build final LMS features.

Do **NOT** build final scoring systems.

Build the infrastructure that will support all future curriculum content.

---

# PRIMARY DESIGN PRINCIPLE

SPIKE is **NOT** a course platform.

SPIKE is a **Venture Incubator Platform**.

Every object must support:

1. Curriculum Delivery
2. Venture Portfolio Generation
3. Business Plan Development
4. Competency Tracking
5. Career Path Development
6. Venture Board Evaluation

---

# SYSTEM ARCHITECTURE

Every learning object must map into:

```text
Program
 └── Segment
      └── Week
           └── Day
                └── Session

Each Session can generate:

Portfolio Artifacts
Business Plan Artifacts
Competency Evidence
Assessment Results
Research Outputs
```

---

# PHASE 1 — DOMAIN MODEL FOUNDATION

Create:

```text
/src/types/playbook.ts
```

## Program

```typescript
interface Program {
  id: string
  title: string
  description: string
}
```

## Segment

```typescript
interface Segment {
  id: string
  title: string
  description: string
  hours: number
  milestoneObjective: string
  capstoneTitle: string
  capstoneDescription: string
  certificationAwarded: string
  exitRequirements: string[]
}
```

## Week

```typescript
interface Week {
  id: string
  segmentId: string
  weekNumber: number
  title: string
  theme: string
  milestoneObjective: string
  businessPlanChapter: string
  portfolioSection: string
}
```

## Day

```typescript
interface Day {
  id: string
  segmentId: string
  weekId: string
  dayNumber: number
  title: string
  theme: string
  durationHours: number
  learningObjectives: string[]
  expectedOutputs: string[]
  portfolioDeliverables: string[]
  businessPlanIntegration: string
  presentations: string[]
  activities: string[]
  worksheets: string[]
  assessments: string[]
}
```

---

# PHASE 2 — INSTRUCTIONAL DESIGN LAYER

## Competency

```typescript
interface Competency {
  id: string
  title: string
  category: 'personal' | 'technical' | 'business' | 'leadership'
  description: string
}
```

**Seed competencies:** Visioning, Goal Setting, Financial Literacy, Financial Needs Analysis, Client Discovery, Risk Management, Prospecting, Presentation Skills, Leadership, Recruitment Awareness.

## Milestone

```typescript
interface Milestone {
  id: string
  segmentId: string
  title: string
  targetHour: number
  description: string
}
```

**Seed milestones:**

| Hour | Title |
|------|-------|
| 40 | Vision Review |
| 80 | Market Understanding Review |
| 120 | Business Operations Review |
| 160 | Licensing Readiness Review |
| 200 | Proof of Concept Venture Board |

## Week integration

```typescript
interface WeekIntegration {
  weekId: string
  businessPlanChapter: string
  portfolioSection: string
  competencyTargets: string[]
  milestoneReview: string
}
```

**Seed (Segment 1, Weeks 1–5):**

| Week | Theme | Business plan | Portfolio | Competencies | Milestone review |
|------|-------|---------------|-----------|--------------|------------------|
| 1 | Vision & Purpose | Identity & Purpose | Visioning, Goal Setting | Vision Review |
| 2 | Target Market Strategy | Market Intelligence | Client Discovery, Financial Literacy | Market Understanding Review |
| 3 | Client Experience Strategy | Advisor Startup Blueprint | Risk Management, Operations Awareness | Business Operations Review |
| 4 | Professional Standards | Professional Development | Compliance, Ethics | Licensing Readiness Review |
| 5 | Growth Blueprint | 3-Year Blueprint | Entrepreneurship, Business Planning | Proof of Concept Venture Board |

---

# PHASE 3 — BUSINESS PLAN ENGINE

## Business plan chapter

```typescript
interface BusinessPlanChapter {
  id: string
  title: string
  description: string
  weekOwner: number
}
```

**Seed:** Chapters 1–5 (Vision & Purpose, Target Market Strategy, Client Experience Strategy, Professional Standards, Growth Blueprint).

## Business plan artifact

```typescript
interface BusinessPlanArtifact {
  id: string
  participantId: string
  chapterId: string
  title: string
  content: string
  sourceType: string
  sourceId: string
}
```

Every lesson can contribute to the participant's 3-Year Business Plan.

---

# PHASE 4 — VENTURE PORTFOLIO ENGINE

## Portfolio section

```typescript
interface PortfolioSection {
  id: string
  title: string
  description: string
}
```

**Seed:** Identity & Purpose, Market Intelligence, Financial Blueprint, Professional Development, Advisor Startup Blueprint, 3-Year Blueprint.

## Portfolio artifact

```typescript
interface PortfolioArtifact {
  id: string
  participantId: string
  sectionId: string
  title: string
  content: string
  sourceType: string
  sourceId: string
  status: 'draft' | 'submitted' | 'approved'
}
```

## Portfolio review

```typescript
interface PortfolioReview {
  id: string
  participantId: string
  reviewerId: string
  notes: string
  score: number
}
```

---

# PHASE 5 — CAREER TRACK ENGINE

## Career track

```typescript
interface CareerTrack {
  id: string
  title: string
  framework: string[]
  description: string
}
```

**Seed:**

- **Agency Builder** — Educate, Expand, Empower
- **Specialist Consultant** — Educate, Establish, Elevate

## Track requirement

```typescript
interface TrackRequirement {
  id: string
  trackId: string
  title: string
  description: string
}
```

**Agency Builder:** Recruitment Plan, Unit Development Plan, Leadership Blueprint, Growth Forecast.

**Specialist:** Niche Strategy, Authority Building Plan, Professional Practice Plan, Thought Leadership Plan.

---

# PHASE 6 — PLAYBOOK CONTENT ENGINE

Content storage:

```text
/content
  /segment-1
    /week-1
      /day-1
        day.json
        presentation.json
        activities.json
        worksheets.json
        assessment.json
        survey.json
```

Must support future curriculum imports. **Do NOT hardcode content.**

---

# PHASE 7 — PRESENTATION ENGINE

Location: `/components/playbook`

Components: `PresentationViewer`, `SlideViewer`, `SpeakerNotesPanel`, `DiscussionPanel`, `SlideNavigator`.

Features: Previous/Next slide, speaker notes, discussion questions, progress indicator.

---

# PHASE 8 — ACTIVITY ENGINE

`ActivityViewer` — duration, materials, instructions, outputs, debrief questions.

---

# PHASE 9 — WORKSHEET ENGINE

Support: short text, long text, rating, checkbox, file upload.

Future-ready: portfolio artifact generation (placeholder in Sprint 02).

---

# PHASE 10 — DAY CONTRIBUTION MAPPING

```typescript
interface DayContribution {
  dayId: string
  contributesToPortfolio: string[]
  contributesToBusinessPlan: string[]
  contributesToCompetencies: string[]
}
```

Every lesson maps into multiple systems.

---

# PHASE 11 — RESEARCH ENGINE FOUNDATION

Interfaces: `Survey`, `SurveyQuestion`, `ResearchProject`, `ResearchSquad`.

Do not implement collection yet.

---

# PHASE 12 — VENTURE BOARD FOUNDATION

```typescript
interface VentureBoard {
  id: string
  segmentId: string
  title: string
  targetHour: number
}
```

```typescript
interface VentureBoardCriterion {
  id: string
  boardId: string
  title: string
  weight: number
}
```

**Seed — Hour 200 Board:** Vision Clarity 20%, Market Understanding 20%, Business Feasibility 20%, Professional Readiness 20%, Presentation Quality 20%.

---

# PHASE 13 — DATABASE MIGRATIONS

Tables: `programs`, `segments`, `weeks`, `days`, `competencies`, `milestones`, `week_integrations`, `business_plan_chapters`, `business_plan_artifacts`, `portfolio_sections`, `portfolio_artifacts`, `portfolio_reviews`, `career_tracks`, `track_requirements`, `presentations`, `slides`, `activities`, `worksheets`, `worksheet_questions`, `assessments`, `rubrics`, `surveys`, `survey_questions`, `research_projects`, `venture_boards`, `venture_board_criteria`, `day_contributions`.

---

# PHASE 14 — NAVIGATION EXPANSION

Add module routes:

- Playbook
- Business Plan
- Portfolio
- Research
- Milestones
- Venture Board

Keep existing **Dashboard** (and Sprint 01 **Reports** / **Admin** for staff).

---

# PHASE 15 — MOCK CONTENT

Load Segment 1 / Week 1 / Day 1 sample content.

Validate: Playbook rendering, portfolio mapping, business plan mapping, competency mapping.

---

# ACCEPTANCE CRITERIA

```text
Playbook → Segment 1 → Week 1 → Day 1
```

Day 1 must display:

- Learning Objectives
- Slides + Speaker Notes
- Activities
- Worksheets
- Assessments
- Portfolio Deliverables
- Business Plan Contributions
- Competency Contributions

The architecture must support the entire 200-hour Segment 1 and later the full 600-hour SPIKE ecosystem **without structural redesign**.

---

# OUT OF SCOPE (Sprint 02)

- Complete 200h / 600h curriculum content
- Final LMS (grading workflows, attendance, etc.)
- Final scoring / venture board adjudication
- Survey collection in production
- PDF export
- Mentor scoring automation

---

**END OF SPRINT 02**
