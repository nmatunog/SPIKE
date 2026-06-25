# SPIKE LIFE™ — Software Architecture Bible

**Volume I — Domain Architecture**  
**Chapter 3 — Aggregates & Aggregate Roots**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Canonical |
| Depends on | Chapter 1 — Domain Vision & Ubiquitous Language; Chapter 2 — Bounded Contexts & Domain Map |
| Purpose | Define the Aggregate Roots and business aggregates that make up the SPIKE LIFE domain model. These aggregates enforce business rules and transactional consistency. |

---

## 1. What is an Aggregate?

An Aggregate is a cluster of related business objects that are treated as a single consistency boundary. Only the Aggregate Root may be modified directly. Everything else is accessed through it.

**Example:**

```
Simulation
├── Character
├── Financial Profile
├── Goals
├── Protection Plans
├── Journey
└── Scores
```

The Simulation controls all changes.

---

## 2. Aggregate Design Principles

Every aggregate:

- Owns its own data
- Protects its own invariants
- Exposes behavior instead of public mutable state
- Publishes domain events when state changes
- Never directly modifies another aggregate

---

## 3. Aggregate Map

```
Player
│
└── owns
    Simulation
    │
    ├── Character
    ├── Financial Profile
    ├── Protection Portfolio
    ├── Goal Portfolio
    ├── Journey
    ├── Annual Reviews
    ├── Life Score
    └── Reflection Report
```

Simulation is the primary Aggregate Root.

---

## 4. Aggregate Roots

SPIKE LIFE MVP contains the following Aggregate Roots.

### Player

**Purpose:** Represents the real user.

**Owns:** Identity, Preferences, Simulation History, Achievements.

**Does NOT own** simulation logic.

### Simulation ⭐ (Core Aggregate Root)

**Owns:** Character, Financial Profile, Goals, Protection Plans, Journey, Current Year, Current Life Stage, Simulation State, Life Score, FNA Snapshot, Recommendations, Reflection.

Every financial decision passes through this aggregate.

### Report

Represents a completed simulation output.

**Owns:** Annual Reports, Final Report, Reflection, Advisor Readiness Summary.

Reports are immutable once generated.

---

## 5. Simulation Aggregate

The Simulation Aggregate is the heart of SPIKE LIFE.

```
Simulation
├── Character
├── Timeline
├── Financial Profile
├── Protection Portfolio
├── Goal Portfolio
├── Life Events
├── Decisions
├── FNA Snapshot
├── Recommendations
├── Annual Reviews
├── Life Score
└── Reflection
```

No object outside the aggregate may modify these directly.

---

## 6. Character Entity

**Purpose:** Represents the simulated life.

**Properties:** Age, Career, Risk Preference, Marital Status, Dependents, Current Life Stage.

**Behavior:** Advance Age, Change Career, Update Family Situation, Transition Life Stage.

---

## 7. Financial Profile Entity

**Purpose:** Represents the player's financial state.

**Owns:** Income, Expenses, Assets, Liabilities, Cash Flow, Net Worth, Emergency Fund.

**Behavior:** Apply Income, Apply Expense, Update Assets, Update Debt, Recalculate Cash Flow, Recalculate Net Worth.

---

## 8. Protection Portfolio

**Purpose:** Tracks planning readiness.

**Owns:** Family Protection, Health Protection, Income Protection, Education Protection, Retirement Security.

**Behavior:** Increase Readiness, Calculate Gap, Evaluate Adequacy, Publish `ProtectionGapChanged` event.

---

## 9. Goal Portfolio

**Purpose:** Manage all financial goals.

**Contains:** Home Goal, Education Goal, Business Goal, Travel Goal, Retirement Goal.

**Behavior:** Create Goal, Fund Goal, Pause Goal, Complete Goal, Evaluate Progress.

---

## 10. Journey

**Purpose:** Represents the player's life story.

**Contains:** Life Events, Decisions, Achievements, Reflections, Milestones.

**Behavior:** Append Event, Append Decision, Generate Timeline, Generate Story.

---

## 11. Annual Review

**Purpose:** Capture one completed simulation year.

**Contains:** Life Score, FNA Score, Top Gaps, Top Recommendations, Financial Snapshot, Reflection.

Annual Reviews are immutable once closed.

---

## 12. Life Score

**Purpose:** Represents educational performance.

**Contains:** Cash Flow Score, Protection Score, Goal Score, Wealth Score, Retirement Score, Impact Score.

**Behavior:** Recalculate, Publish `ScoreUpdated` event.

---

## 13. Reflection

**Purpose:** Convert simulation into learning.

**Contains:** Reflection Questions, Player Responses, Lessons Learned, Advisor Notes.

**Behavior:** Generate Reflection, Store Reflection, Summarize Journey.

---

## 14. Value Objects

The following are immutable value objects:

Money, Currency, Percentage, Age, Date, Risk Level, Life Stage, Goal Progress, Protection Gap, Cash Flow Ratio, Debt Ratio, Net Worth, FNA Score, Life Score Value.

These objects contain validation and formatting rules.

---

## 15. Aggregate Relationships

```
Player (1) → (Many) Simulation
Simulation (1) → (1) Character
Character (1) → (1) Financial Profile
Financial Profile (1) → (1) Protection Portfolio
Protection Portfolio (1) → (1) Goal Portfolio
Goal Portfolio (1) → (1) Journey
Journey (1) → (Many) Annual Reviews
```

---

## 16. Transaction Boundaries

One transaction should modify only one aggregate.

**Example — Advance Year** updates Simulation, Character, Financial Profile, Journey, Life Score, FNA Snapshot. Then publishes events. No other aggregate is modified directly.

---

## 17. Aggregate Invariants

### Simulation

- Must always have exactly one Character.
- Must always have one Financial Profile.
- Must always have one Journey.
- Must always have one current Life Stage.
- Current Age must never decrease.
- Simulation Year advances one step at a time.

### Financial Profile

- Assets cannot be negative.
- Income cannot be negative.
- Expenses cannot be negative.
- Net Worth must equal Assets − Liabilities.

### Protection Portfolio

- Readiness values remain within valid bounds.
- Gap calculations must derive from the FNA Engine.

### Goal Portfolio

- Progress cannot exceed 100%.
- Completed goals become read-only.

### Journey

- Events are append-only.
- History cannot be rewritten.

---

## 18. Aggregate Behaviors

The Simulation Aggregate exposes business methods rather than allowing direct property mutation.

Examples:

- `simulation.advanceYear()`
- `simulation.recordDecision()`
- `simulation.applyLifeEvent()`
- `simulation.generateAnnualReview()`
- `simulation.calculateLifeScore()`
- `simulation.generateReflection()`

No caller should directly manipulate internal entities.

---

## 19. Domain Events Produced

`SimulationStarted`, `YearAdvanced`, `LifeStageChanged`, `LifeEventApplied`, `DecisionRecorded`, `GoalCompleted`, `ProtectionGapChanged`, `FinancialProfileUpdated`, `LifeScoreUpdated`, `ReflectionGenerated`, `SimulationCompleted`.

These events are consumed by other bounded contexts.

---

## 20. Future Aggregate Roots

Not part of MVP but planned: Advisor Case, Mentor Session, Agency, Squad Competition, Course Progress, AI Coach Session.

Each future aggregate should follow the same design principles and integrate through domain events rather than direct coupling.

---

## 21. Design Guardrails

- Aggregate Roots own behavior.
- Entities own state.
- Value Objects remain immutable.
- Business rules belong inside aggregates.
- React components never modify entities directly.
- APIs invoke aggregate behaviors, not database tables.
- Persistence is an implementation detail.
- The aggregate model is the business truth.

---

## 22. Chapter Summary

This chapter establishes the core business structure of SPIKE LIFE. The Simulation Aggregate is the center of the platform. Everything that happens during a player's financial life flows through it.

This model provides:

- Clear ownership
- Strong consistency
- Deterministic simulation behavior
- Clean separation from infrastructure
- A stable foundation for APIs, databases, and UI

The next chapter will define every Entity and Value Object in detail, including their attributes, validation rules, lifecycle, and relationships. That chapter becomes the direct blueprint for generating the TypeScript domain models and, later, the database schema.

---

*End of Volume I — Chapter 3*
