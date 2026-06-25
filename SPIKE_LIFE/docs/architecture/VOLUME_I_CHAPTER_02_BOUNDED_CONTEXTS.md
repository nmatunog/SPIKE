# SPIKE LIFE™ — Software Architecture Bible

**Volume I — Domain Architecture**  
**Chapter 2 — Bounded Contexts & Domain Map**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Canonical |
| Depends on | Volume I – Chapter 1 (Domain Vision & Ubiquitous Language) |
| Authority | This chapter defines the major business domains (Bounded Contexts) of SPIKE LIFE and the relationships between them. No business logic may exist outside one of these bounded contexts. |

---

## 1. Purpose

SPIKE LIFE is not one large application. It is a collection of independent business domains working together.

Each domain:

- Owns its own business rules
- Owns its own data
- Owns its own services
- Exposes only public interfaces

This separation prevents the platform from becoming a monolithic application.

---

## 2. Architectural Philosophy

SPIKE LIFE follows a Domain-Driven Design (DDD) architecture. The platform is organized around business capabilities rather than technical layers.

Instead of:

```
Controllers → Services → Database
```

SPIKE LIFE is organized as:

```
Simulation → Planning → Learning → Analytics → Identity → Reporting
```

Technology serves the business domain. Never the opposite.

---

## 3. High-Level Domain Map

```
                    SPIKE LIFE

                    Identity
                       │
                       ▼
                 Player Domain
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼

 Simulation      Planning      Learning

         ▼             ▼             ▼

 Financial      Recommendation  Reflection

         └─────────────┬─────────────┘
                       ▼

                Analytics Domain
```

The Simulation Domain is the heart of the platform. Everything else supports it.

---

## 4. Core Bounded Contexts

SPIKE LIFE MVP contains eight bounded contexts:

1. Identity
2. Player
3. Simulation
4. Financial
5. Planning
6. Learning
7. Analytics
8. Reporting

---

## 5. Identity Context

**Purpose:** Manage authentication and authorization.

**Responsibilities:** Player registration, Authentication, Session management, Roles, Permissions, User preferences.

**Owns:** User, Session, Role, Permission, OAuth identities.

**Does NOT own:** Simulation, Financial data, Life Score.

**External Interfaces:** Authentication API, Authorization API.

---

## 6. Player Context

**Purpose:** Represent the human participant.

**Responsibilities:** Player profile, Character selection, Simulation ownership, Preferences, Progress.

**Owns:** Player, Character, Simulation History, Achievements.

**Does NOT own:** Financial calculations, FNA, Events.

**External Interfaces:** Player Service, Character Service.

---

## 7. Simulation Context

**Purpose:** Execute the financial life simulation. This is the **Core Domain**. Everything revolves around it.

**Responsibilities:** Simulation lifecycle, Annual progression, Decision processing, Life stages, Time advancement, Game state.

**Owns:** Simulation, Simulation Year, Life Stage, Decision Queue, Simulation State.

**Collaborates With:** Financial Context, Planning Context, Learning Context.

**No other context may directly modify Simulation State.**

---

## 8. Financial Context

**Purpose:** Manage financial calculations.

**Responsibilities:** Income, Expenses, Assets, Liabilities, Cash Flow, Net Worth, Protection, Goal Funding.

**Owns:** Financial Profile, Asset Portfolio, Liabilities, Cash Flow, Protection Plans, Goals.

**Provides:** Financial Engine.

**Never performs:** UI logic, Recommendation ranking.

---

## 9. Planning Context

**Purpose:** Evaluate financial needs. Generate recommendations.

**Responsibilities:** FNA, Gap Analysis, Priority Ranking, Recommendation Engine, Decision Evaluation.

**Owns:** FNA Snapshot, Gap Analysis, Recommendations, Planning Priorities.

**Consumes:** Financial Data, Simulation Data.

**Produces:** Planning Recommendations.

---

## 10. Learning Context

**Purpose:** Transform simulation into education.

**Responsibilities:** Achievements, Reflection, Learning outcomes, Feedback, Advisor Readiness, Financial Personality.

**Owns:** Reflection Reports, Learning Milestones, Educational Outcomes, Achievements.

**Consumes:** Simulation Data, Planning Results.

---

## 11. Analytics Context

**Purpose:** Measure everything.

**Responsibilities:** Progress tracking, Cohort analysis, Life Score trends, Decision quality, Learning analytics, Mentor dashboards.

**Owns:** Metrics, Aggregated Statistics, Learning Progress.

**Never modifies:** Simulation, Financial data.

---

## 12. Reporting Context

**Purpose:** Generate human-readable reports.

**Responsibilities:** Annual Reports, SPIKE LIFE Report, PDF exports, Portfolio artifacts, Mentor summaries.

**Consumes:** Every other domain.

**Produces:** Read-only reports.

---

## 13. Domain Ownership Matrix

| Domain | Owns | Reads | Writes |
|--------|------|-------|--------|
| Identity | Users | — | Identity only |
| Player | Character | Identity | Player |
| Simulation | Simulation State | Player | Simulation |
| Financial | Financial Profile | Simulation | Financial |
| Planning | Recommendations | Financial | Planning |
| Learning | Reflections | Simulation | Learning |
| Analytics | Metrics | All | Analytics |
| Reporting | Reports | All | Reports |

Only one domain owns any piece of data.

---

## 14. Context Dependencies

```
Identity → Player → Simulation → Financial → Planning → Learning → Analytics → Reporting
```

Dependencies always point downward. Never upward.

---

## 15. Domain Events

Domains communicate using events.

Examples: `SimulationStarted`, `YearAdvanced`, `LifeEventOccurred`, `DecisionRecorded`, `FinancialProfileUpdated`, `ProtectionGapChanged`, `GoalCompleted`, `LifeStageChanged`, `LifeScoreUpdated`, `ReflectionGenerated`, `ReportsGenerated`.

Domains listen. They do not call each other directly.

---

## 16. Anti-Corruption Layer

External systems must never directly modify SPIKE LIFE domains.

Examples: LMS, Future CRM, Future Insurance Systems, Future Banking APIs, AI Services, Cloud Storage.

All integrations pass through an Anti-Corruption Layer (ACL).

**Responsibilities:** Validation, Translation, Normalization, Security, Version compatibility.

This prevents external changes from corrupting the core domain.

---

## 17. Domain Rules

| Rule | Statement |
|------|-----------|
| **Rule 1** | Simulation owns time. No other domain advances the year. |
| **Rule 2** | Financial owns calculations. No UI performs financial math. |
| **Rule 3** | Planning owns recommendations. Simulation never recommends actions. |
| **Rule 4** | Learning owns educational outcomes. Financial calculations never generate reflections. |
| **Rule 5** | Analytics never changes business data. Analytics only observes. |
| **Rule 6** | Reporting never owns business logic. Reports only present information. |

---

## 18. Domain Independence

Every bounded context should be independently testable.

Example: The Financial Context should run entirely without React, Astro, Database, Cloudflare, AI, Browser. It should operate purely as a deterministic domain service.

The same applies to the Planning and Simulation contexts.

This architecture enables:

- Fast unit testing
- Easier debugging
- Reusable simulation engines
- Future mobile or desktop clients

---

## 19. Domain Evolution Strategy

Future features must extend an existing bounded context before creating a new one.

| Feature | Context |
|---------|---------|
| Advisor Mode | Planning Context |
| Agency Builder | Simulation + Financial |
| AI Coach | Learning + Planning |
| Squad Competitions | Learning + Analytics |
| Mentor Dashboard | Analytics |

This prevents unnecessary domain proliferation.

---

## 20. Architecture Guardrails

The following rules are mandatory:

- A domain may never bypass another domain's public interface.
- Business rules belong to exactly one domain.
- Domain services must remain deterministic.
- AI services are advisory only and cannot become authoritative.
- React components consume domain outputs but never contain business rules.
- Infrastructure (database, queues, APIs, storage) is replaceable without changing the domain model.

The domain model is the most stable part of SPIKE LIFE. Everything else is an implementation detail.

---

## 21. Chapter Summary

This chapter defines the business boundaries of SPIKE LIFE. The platform is organized into bounded contexts rather than technical layers.

This separation provides:

- High cohesion
- Low coupling
- Clear ownership
- Easier testing
- Future scalability

These contexts form the backbone for the remaining architecture. The next chapter will define the Aggregates and Aggregate Roots, which are the primary business objects that exist within these bounded contexts and enforce the core business invariants of SPIKE LIFE.

---

*End of Volume I — Chapter 2*
