# SPIKE LIFE™ — Architecture Amendment A1

## Domain-Centric Layered Architecture

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | MANDATORY |
| Authority | This amendment supersedes any previous implication that the database is the center of the application. The Domain Layer is the source of truth. Everything else is replaceable. |

---

## 1. Core Philosophy

SPIKE LIFE is not a database-driven application. SPIKE LIFE is a domain-driven simulation platform.

The business rules define the software. The database merely stores state. The UI merely visualizes state. The API merely exposes state. AI merely assists decision-making. The Simulation Domain remains authoritative.

---

## 2. Architectural Hierarchy

```
                 SPIKE LIFE

                React Frontend
                       │
                       ▼
         ┌─────────────────────────┐
         │  Application Layer      │
         │ (Use Cases / Commands)  │
         └─────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │     DOMAIN LAYER        │
         │  Business Rules         │
         │  Simulation Engine      │
         │  FNA Engine             │
         │  Decision Engine        │
         │  Recommendation Engine  │
         └─────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │ Repository Interfaces   │
         └─────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
 PostgreSQL                     Future Storage
   (Neon)                   (SQLite / IndexedDB /
                               Other Providers)
```

---

## 3. Layer Responsibilities

### Presentation Layer

**Technology:** React, Astro, Tailwind.

**Responsibilities:** Render data. Capture user input. Display simulation results.

**Never:** Perform business calculations. Modify entities directly.

### Application Layer

**Purpose:** Coordinate workflows.

**Examples:** Start Simulation, Advance Year, Apply Decision, Generate Annual Review, Complete Simulation.

**Responsibilities:** Validate commands. Coordinate domain services. Handle transactions. Publish domain events.

**Never:** Contain business rules.

### Domain Layer ⭐

This is the heart of SPIKE LIFE.

**Contains:** Entities, Value Objects, Aggregates, Domain Services, Business Rules, Simulation Engine, Financial Engine, Planning Engine, Scoring Engine, Reflection Engine.

The Domain Layer must have zero dependencies on: React, Astro, PostgreSQL, Cloudflare, REST, GraphQL, AI SDKs, Browser APIs.

It should run in isolation.

### Repository Layer

**Purpose:** Translate between Domain Objects and Persistence Models.

**Responsibilities:** Load aggregates. Save aggregates. Hide database implementation.

The Domain Layer never knows SQL exists.

### Infrastructure Layer

**Examples:** Neon PostgreSQL, Cloudflare D1 (future), Cloudflare R2, Cloudflare KV, Queues, Email, Logging, Caching, AI Providers.

Infrastructure is replaceable.

---

## 4. Dependency Rule

Dependencies always point inward.

```
UI → Application → Domain → Repository Interfaces → Infrastructure
```

The Domain Layer depends on nothing. Everything depends on the Domain Layer.

---

## 5. Business Rule Ownership

Only the Domain Layer may determine:

Cash Flow, Net Worth, Protection Gap, Goal Progress, Retirement Readiness, Life Score, FNA, Recommendations, Life Events, Simulation Progression, Reflection Logic.

If a calculation exists anywhere else, it is a bug.

---

## 6. UI Rule

React Components are views. They should resemble:

```tsx
<LifeScoreCard score={lifeScore} />
<ProtectionCard gap={gap} />
<GoalCard goal={goal} />
```

They never compute: Net Worth, Debt Ratio, Protection Readiness, FNA Score. Those values arrive already calculated.

---

## 7. Repository Pattern

Repositories expose business objects. Never SQL.

**Correct:** `simulationRepository.load(simulationId)`, `simulationRepository.save(simulation)`

**Incorrect:** `SELECT * FROM simulation JOIN goals JOIN protection JOIN decisions`

SQL belongs inside infrastructure.

---

## 8. Future Proofing

Because the Domain Layer is independent, SPIKE LIFE can later support: Native Mobile, Desktop, CLI Simulator, Batch Simulations, AI Agents, Offline Play, Cloud Sync — without rewriting business logic.

---

## 9. Testing Strategy

Every engine must be testable without: Database, Internet, Browser, Cloudflare, Authentication, UI.

```typescript
const simulation = Simulation.create(...)
simulation.advanceYear()
expect(simulation.lifeScore.total).toEqual(742)
```

This should execute entirely in memory.

---

## 10. AI Boundary

AI never owns business rules.

| Correct | Incorrect |
|---------|-----------|
| AI explains | AI calculates Life Score |
| AI coaches | AI calculates FNA |
| AI summarizes | AI determines financial outcomes |
| AI reflects | |

All financial outcomes originate from deterministic domain logic.

---

## 11. Security Boundary

Security begins outside the Domain Layer.

Authentication, Authorization, Rate Limiting, Validation, Audit Logging, Input Sanitization occur before commands reach the domain.

The Domain Layer assumes only valid, authorized commands are executed but still enforces business invariants (for example, preventing impossible state transitions).

---

## 12. Domain as the Single Source of Truth

Every artifact derives from the Domain Layer:

```
Domain Model
├── Database Schema
├── REST API
├── React Components
├── Reports
├── AI Coach
├── LMS Integration
├── Analytics
└── Future Mobile Apps
```

The Domain Model is never generated from: Database, React Components, REST Endpoints, AI Prompts. Those are downstream implementations.

---

## 13. Cursor Development Rule

Cursor must never generate code that places business logic inside: React components, API routes, Database migrations, Hooks, Utility functions.

Business logic belongs inside `/domain`. All other layers call into it.

---

## 14. Folder Structure (Canonical)

```
/apps
    /web

/packages
    /domain          ⭐ Core business model
    /application     Use cases & commands
    /infrastructure  Database, repositories, storage
    /ui              Shared components
    /shared          Utilities (non-business)

Inside /packages/domain:
domain/
    aggregates/
    entities/
    value-objects/
    specifications/
    services/
    events/
    policies/
    repositories/
    exceptions/
```

This package must have no dependency on React, Astro, databases, Cloudflare SDKs, or browser APIs.

---

## 15. Architecture Invariant

This rule is non-negotiable:

**If PostgreSQL disappeared tomorrow, SPIKE LIFE should still run in memory.**

The only thing lost would be persistence. The simulation itself would continue to function unchanged.

---

## 16. Amendment Summary

This amendment establishes the most important architectural principle of SPIKE LIFE:

- The Domain Layer is the heart of the system.
- The database is an implementation detail.
- The UI is an implementation detail.
- APIs are an implementation detail.
- AI is an implementation detail.
- Business logic exists in exactly one place.

Every future blueprint, technical specification, and Cursor implementation must conform to this architecture.

---

## One Additional Recommendation

Before we move into Chapter 5, introduce **CQRS (Command Query Responsibility Segregation)** at the Application Layer, but not Event Sourcing.

- **Commands** change the simulation (e.g., AdvanceYear, RecordDecision, FundGoal).
- **Queries** read the simulation (e.g., GetDashboard, GetJourney, GetFNASummary).

This keeps writes and reads cleanly separated without adding the complexity of a full event-sourced system. It fits SPIKE LIFE's educational simulation very well and will make the APIs, frontend, and future AI integrations significantly cleaner while remaining approachable for the team.

---

*End of Architecture Amendment A1*
