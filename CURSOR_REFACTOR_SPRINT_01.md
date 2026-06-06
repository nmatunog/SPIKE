# SPIKE ASC REFACTOR SPRINT 01

## Foundation Architecture Refactor

### How to use this document

Refactor this project to code and revise it **safely**. Stick to **security** and **database architecture**, but **integrate, incorporate, and revise the build** into this sprint plan.

Do not rush feature delivery. Prioritize architecture, navigation, schema scaffolding, and extensibility.

---

### Objective

Refactor the current SPIKE Portal from a static internship portal into a scalable Venture Incubator Platform.

**DO NOT build all features yet.**

Focus on architecture, navigation, database structure, and extensibility.

---

# CURRENT STATE

Current navigation:

* Role Dashboard
* Orientation Deck
* Master Blueprint
* Progress Reports

Current content is largely static.

The portal behaves like a website.

---

# TARGET STATE

The portal must behave like a Learning Management System (LMS), Venture Portfolio Builder, and Venture Incubator Platform.

---

# REQUIREMENTS

## Preserve

Keep:

* Branding
* Color Scheme
* Authentication
* User Management
* Existing Dashboard Styling
* Existing Role-Based Access

Do not redesign the visual identity.

---

# NAVIGATION REFACTOR

Replace current top navigation:

* Role Dashboard
* Orientation Deck
* Master Blueprint
* Progress Reports

With:

* Dashboard
* Playbook
* Portfolio
* Research
* Reports
* Admin

---

# DASHBOARD

Dashboard becomes role-aware.

---

## Participant Dashboard

Display:

* Current Segment
* Current Week
* Current Day
* Hours Completed
* Portfolio Completion %
* Pending Deliverables
* Mentor Feedback

---

## Mentor Dashboard

Display:

* Assigned Participants
* Coaching Notes
* Portfolio Progress
* At-Risk Participants

---

## Faculty Dashboard

Display:

* Cohort Progress
* Attendance
* Submission Status
* Assessment Results

---

## Admin Dashboard

Display:

* Active Participants
* Active Cohorts
* Segment Distribution
* Venture Board Readiness

---

# PLAYBOOK MODULE

Create new route:

```text
/playbook
```

Purpose:

Become the future curriculum engine.

Current sprint:

Create scaffolding only.

---

Structure:

* Segment
* Week
* Day
* Learning Objectives
* Presentations
* Activities
* Worksheets
* Assessments
* Portfolio Deliverables

---

Use mock data initially.

---

# PORTFOLIO MODULE

Create route:

```text
/portfolio
```

Purpose:

Participant Venture Portfolio.

Sections:

* Identity & Purpose
* Market Intelligence
* Financial Blueprint
* Professional Development
* Advisor Startup Blueprint
* 3-Year Blueprint

---

Each section must display:

* Progress %
* Completed Items
* Pending Items
* Placeholder Content

---

# RESEARCH MODULE

Create route:

```text
/research
```

Purpose:

Research Squad activities.

Subsections:

* Surveys
* Respondents
* Research Reports
* Opportunity Maps

---

Create empty placeholder UI.

No backend logic yet.

---

# REPORTS MODULE

Refactor current Progress Reports.

Add future-ready columns:

* Portfolio %
* Licensing Status
* Career Track
* Survey Completion
* FNA Completion
* Segment Status

---

Keep existing functionality.

---

# ADMIN MODULE

Create route:

```text
/admin
```

Move all administrative functions here.

Subsections:

* Users
* Cohorts
* Content
* Settings
* Reports

---

# DATABASE PREPARATION

Create schema placeholders.

Do **NOT** implement full business logic yet.

Tables:

* `cohorts`
* `participant_profiles`
* `segments`
* `weeks`
* `days`
* `presentations`
* `slides`
* `activities`
* `worksheets`
* `assessments`
* `surveys`
* `venture_portfolio_entries`

---

Only migration scaffolding required.

---

# CAREER TRACK SUPPORT

Add enum:

* `agency_builder`
* `specialist_consultant`

Store in participant profile.

No UI logic required yet.

---

# TECHNICAL REQUIREMENTS

Sprint 01 uses the **existing production stack** (see [`CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md`](./CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md)):

* **Vite + React** (not a Next.js rewrite in this sprint)
* **react-router-dom** for `/playbook`, `/portfolio`, etc.
* **Supabase** as the single production data layer
* **Tailwind** + Lucide (existing components)
* JavaScript first; TypeScript and shadcn/ui deferred to a later sprint

Maintain existing coding standards, branding, and Cloudflare Pages deployment.

---

# DELIVERABLE

At end of sprint:

The platform should look like a Venture Incubator Platform with proper navigation and module architecture.

Content may still be placeholder data.

Focus on extensibility and clean architecture.
