# SPIKE LIFE™ — Architecture Amendment A2

## CQRS Application Architecture

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | MANDATORY |
| Authority | This amendment defines how every request flows through SPIKE LIFE. It applies to React UI, REST APIs, Future Mobile Apps, AI Coach, Mentor Dashboard, Reports. |

---

## 1. Design Philosophy

SPIKE LIFE performs two fundamentally different activities.

Players: **Read information.** OR **Change information.**

These should never be mixed.

---

## 2. CQRS Overview

**Command Query Responsibility Segregation** separates WRITE operations from READ operations.

```
React UI
       │
────────┼────────
       │
Commands      Queries
       │           │
Application Layer
       │           │
Domain        Read Models
       │
Repositories
       │
Database
```

Commands modify the simulation. Queries never modify anything.

---

## 3. Commands

Commands express intent.

Examples: `AdvanceYear`, `RecordDecision`, `FundGoal`, `StrengthenProtectionPlan`, `StartBusiness`, `UpdateRiskPreference`, `CompleteSimulation`, `GenerateAnnualReview`.

Commands answer: **"What does the player want to do?"**

---

## 4. Query Examples

Queries retrieve information.

Examples: `GetDashboard`, `GetJourney`, `GetGoals`, `GetProtectionStatus`, `GetWealthSummary`, `GetLifeScore`, `GetFNASummary`, `GetReflectionReport`.

Queries never change state.

---

## 5. Command Flow

Example: Player clicks **Advance Year**

```
React → POST /commands/advance-year → AdvanceYearHandler → Simulation Aggregate
  → Financial Engine → Planning Engine → Scoring Engine → Repositories → Return Success
```

The UI then refreshes using queries.

---

## 6. Query Flow

Example: Dashboard

```
React → GET /queries/dashboard → DashboardQuery → Read Repository → Dashboard DTO → React
```

No business logic. No state changes.

---

## 7. Application Layer Structure

```
/application
  commands/
  queries/
  handlers/
  dto/
  validators/
  mappers/
```

The Application Layer coordinates work. It never contains business rules.

---

## 8. Command Structure

**AdvanceYearCommand** contains: Simulation ID, Player ID, Timestamp.

**Command Handler responsibilities:** Authorization, Validation, Load Aggregate, Execute Aggregate Method, Persist Aggregate, Publish Domain Events, Return Result.

---

## 9. Query Structure

**DashboardQuery** returns: Age, Life Stage, Life Score, Goals, Protection, Cash Flow, Recommendations.

Queries may optimize for speed. They never update data.

---

## 10. Read Models

Read Models exist solely for presentation.

Examples: Dashboard View, Journey View, Goals View, Annual Review View, SPIKE LIFE Report.

These are projections of domain data. They are disposable.

---

## 11. Domain Ownership

Only commands invoke: Simulation Aggregate, Financial Engine, Planning Engine, Scoring Engine, Reflection Engine.

Queries never invoke domain behavior.

---

## 12. API Design

**Commands** — `POST /commands/*`

Examples: `/commands/advance-year`, `/commands/record-decision`, `/commands/fund-goal`, `/commands/start-business`

**Queries** — `GET /queries/*`

Examples: `/queries/dashboard`, `/queries/journey`, `/queries/fna`, `/queries/goals`, `/queries/report`

---

## 13. Frontend Architecture

React never mutates domain state.

```
await api.advanceYear() → reloadDashboard() → reloadJourney() → reloadGoals()
```

Everything updates from queries.

---

## 14. AI Integration

AI may execute queries. AI may recommend commands. AI never executes commands automatically.

Example: AI recommends "Consider improving your Family Protection Plan." → Player clicks Strengthen Plan → Command executes. The player remains in control.

---

## 15. Authorization

Every command requires: Authentication, Authorization, Simulation Ownership, Permission Validation.

Queries require: Authentication, Ownership checks (where applicable).

---

## 16. Validation Layers

Every command passes:

```
Transport Validation → Authentication → Authorization → Application Validation → Domain Validation → Repository Save
```

The Domain Layer remains the final authority.

---

## 17. Idempotency

Commands that modify financial state must support idempotency where appropriate.

Example: `AdvanceYear` must not execute twice if the same request is retried due to network issues. Each command should carry a unique request identifier so duplicate submissions can be safely ignored.

---

## 18. Error Handling

**Commands** return: Success, Validation Errors, Business Rule Violations, Authorization Errors, Concurrency Conflicts.

**Queries** return: Requested Data or Not Found.

---

## 19. Performance

Queries should be optimized independently from commands. Example: Dashboard may read a denormalized projection. Commands always operate on aggregates.

---

## 20. Future Extensions

CQRS naturally supports: AI Coach, Mentor Dashboard, Analytics, Leaderboards, Reports, Mobile Apps, Offline Synchronization — without changing the domain model.

---

## 21. What We Are NOT Doing

The MVP will not implement full Event Sourcing.

Reasons: Higher complexity, Replay infrastructure, Snapshot management, Event versioning, Migration challenges, Storage growth.

The simulation already maintains a Journey and Annual Reviews, which provide the educational history we need without requiring event replay.

---

## 22. Domain Events vs Event Sourcing

SPIKE LIFE still publishes Domain Events.

Examples: `LifeEventApplied`, `DecisionRecorded`, `GoalCompleted`, `LifeScoreUpdated`, `ReflectionGenerated`.

These notify other parts of the system. They are not the authoritative data store. The Simulation Aggregate remains the source of truth.

---

## 23. Folder Structure

```
/application/commands
  AdvanceYearCommand
  FundGoalCommand
  StrengthenProtectionPlanCommand
  StartBusinessCommand

/application/queries
  GetDashboardQuery
  GetJourneyQuery
  GetGoalsQuery
  GetReportQuery
```

Every feature follows this pattern.

---

## 24. Design Guardrails

- Commands change state.
- Queries never change state.
- Business rules belong only in the Domain Layer.
- Handlers coordinate but do not calculate.
- Read models are disposable.
- APIs mirror the command/query split.
- The UI consumes queries and initiates commands.

---

## 25. Summary

CQRS provides SPIKE LIFE with:

- Clear separation of responsibilities
- Simpler frontend state management
- Cleaner APIs
- Better scalability
- Easier testing
- Better support for AI and analytics

without the operational overhead of Event Sourcing.

This architecture aligns with the educational mission of SPIKE LIFE while remaining practical for an MVP and extensible for future growth.

---

*End of Architecture Amendment A2*
