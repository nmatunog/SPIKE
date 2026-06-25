# SPIKE LIFE™ — Software Architecture Bible

**Volume I — Domain Architecture**  
**Chapter 4 — Entities, Value Objects & Specifications**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Canonical |
| Purpose | Define every business object that exists inside SPIKE LIFE. This chapter becomes the blueprint for TypeScript Models, Domain Classes, Validation Rules, Database Schema, APIs, and Simulation Engine. No implementation should introduce additional business entities without updating this chapter. |

---

## 1. Domain Object Categories

SPIKE LIFE contains three categories of domain objects:

```
Entities → Value Objects → Specifications
```

---

## 2. Entities

Entities possess: Identity, Lifecycle, Mutable state.

Examples: Simulation, Goal, LifeEvent, Decision, Character, AnnualReview.

---

## 3. Value Objects

Value Objects: Have no identity, Are immutable, Are replaced rather than modified.

Examples: Money, Percentage, LifeScore, FNAScore, DebtRatio, ProtectionGap, Age, LifeStage.

---

## 4. Specifications

Specifications define templates used by the simulation.

Examples: CareerTemplate, GoalTemplate, LifeEventTemplate, AchievementTemplate, ReflectionTemplate, RecommendationTemplate.

Specifications are read-only.

---

## ENTITY DEFINITIONS

### 5. Player

**Identity:** `playerId`

**Purpose:** Represents the real participant.

**Attributes:** Player ID, Display Name, Email, Avatar, Preferences, Current Simulation ID, Completed Simulations, Achievements.

**Behavior:** Create Simulation, Resume Simulation, Archive Simulation, Update Preferences.

**Rules:** A Player may own multiple simulations. Only one simulation may be active at a time.

---

### 6. Simulation

**Identity:** `simulationId`

**Purpose:** Represents one complete financial life.

**Attributes:** Simulation ID, Current Age, Current Year, Current Life Stage, Status, Difficulty, Character ID, Financial Profile, Journey, Life Score, FNA Snapshot.

**Behavior:** Advance Year, Apply Event, Record Decision, Generate Review, Complete Simulation.

**Rules:** Simulation controls all business state. No other entity advances time.

---

### 7. Character

**Identity:** `characterId`

**Purpose:** Represents the simulated person.

**Attributes:** Name, Age, Career, Marital Status, Dependents, Risk Preference, Life Stage, Occupation.

**Behavior:** Advance Age, Change Career, Change Family Status, Transition Life Stage.

**Rules:** Age cannot decrease. Life Stage derives from Age.

---

### 8. Financial Profile

**Identity:** `financialProfileId`

**Purpose:** Represents financial condition.

**Attributes:** Income, Expenses, Assets, Liabilities, Cash, Emergency Fund, Net Worth, Debt Ratio, Cash Flow.

**Behavior:** Apply Income, Apply Expense, Update Assets, Update Debt, Calculate Cash Flow, Calculate Net Worth.

**Rules:** Net Worth always equals Assets minus Liabilities.

---

### 9. Goal

**Identity:** `goalId`

**Purpose:** Represents a financial objective.

**Attributes:** Goal Type, Target Amount, Current Funding, Priority, Target Age, Status.

**Behavior:** Fund Goal, Pause Goal, Complete Goal, Calculate Progress.

**Rules:** Progress 0–100%. Completed goals become read-only.

---

### 10. Protection Plan

**Identity:** `planId`

**Purpose:** Represents an FNA planning solution.

**Categories:** Family Protection, Health Protection, Income Protection, Education Protection, Retirement Security.

**Attributes:** Current Readiness, Required Readiness, Gap, Priority.

**Behavior:** Improve Readiness, Calculate Gap, Publish Gap Change.

**Rules:** Plans are evaluated. Not purchased.

---

### 11. Life Event

**Identity:** `eventId`

**Purpose:** Represents a significant life occurrence.

**Attributes:** Title, Category, Life Stage, Financial Impact, Narrative, Probability, Severity.

**Behavior:** Apply, Resolve, Publish Event.

**Rules:** Events never directly modify UI. Events modify Simulation state.

---

### 12. Decision

**Identity:** `decisionId`

**Purpose:** Represents a player action.

**Attributes:** Decision Type, Decision Year, Decision Cost, Expected Benefit, Actual Outcome.

**Behavior:** Execute, Validate, Evaluate.

**Rules:** Every decision belongs to exactly one simulation year.

---

### 13. Annual Review

**Identity:** `reviewId`

**Purpose:** Snapshot of one completed year.

**Attributes:** Year, Life Score, FNA Score, Achievements, Reflection, Recommendations.

**Rules:** Immutable after creation.

---

### 14. Reflection

**Identity:** `reflectionId`

**Purpose:** Educational feedback.

**Attributes:** Questions, Player Responses, Lessons, Advisor Notes.

**Behavior:** Generate, Store, Summarize.

---

## VALUE OBJECT DEFINITIONS

### 15. Money

**Contains:** Amount, Currency.

**Rules:** Immutable. Cannot contain invalid currency. Supports arithmetic.

### 16. Percentage

**Contains:** Value.

**Rules:** 0–100. Immutable.

### 17. Age

**Contains:** Years.

**Rules:** 18+. Never decreases.

### 18. Life Stage

**Enumeration:** Launch, Build, Grow, Lead, Legacy. Derived from Age.

### 19. Risk Level

**Enumeration:** Conservative, Moderate, Growth. Used by investment and entrepreneurship models.

### 20. Life Score

**Contains:** Cash Flow, Protection, Goals, Wealth, Retirement, Impact, Overall Score.

Immutable snapshot.

### 21. FNA Score

**Contains:** Cash Flow Score, Protection Score, Debt Score, Goal Score, Retirement Score, Priority Ranking.

Immutable snapshot.

### 22. Debt Ratio

**Formula:** Debt Payments ÷ Income. Immutable.

### 23. Cash Flow

**Contains:** Income, Expenses, Surplus. Immutable annual snapshot.

### 24. Protection Gap

**Contains:** Required Readiness, Current Readiness, Gap Value, Priority. Immutable.

---

## SPECIFICATION OBJECTS

### 25. CareerTemplate

**Defines:** Career Name, Income Curve, Volatility, Promotion Rates, Typical Events.

**Examples:** Employee, Freelancer, Advisor, Entrepreneur.

### 26. GoalTemplate

**Defines:** Goal Type, Suggested Target, Recommended Age, Priority, Funding Curve.

### 27. EventTemplate

**Defines:** Category, Narrative, Trigger Rules, Financial Effects, Educational Objective, Probability Weight.

Used to instantiate Life Events.

### 28. RecommendationTemplate

**Defines:** Recommendation Title, Applicable FNA Gap, Priority Logic, Educational Explanation, Recommended Actions.

### 29. AchievementTemplate

**Defines:** Achievement Name, Requirements, Badge, Learning Objective.

### 30. ReflectionTemplate

**Defines:** Questions, Reflection Prompts, Learning Focus.

---

## Object Lifecycle

```
Templates → Simulation Starts → Entities Created → Simulation Runs → Entities Change → Snapshots Created → Simulation Ends → Reports Generated → Entities Archived
```

Specifications never change. Entities evolve. Value Objects capture state at a point in time.

---

## Entity Relationships

```
Player → Simulation → Character → Financial Profile
  ├── Goals
  ├── Protection Plans
  ├── Decisions
  ├── Life Events
  ├── Annual Reviews
  └── Reflection
```

---

## Validation Rules

All entities must validate themselves before state changes.

Examples:

- Cannot fund a completed goal.
- Cannot advance beyond Legacy.
- Cannot create negative income.
- Cannot reduce age.
- Cannot complete the simulation twice.

Validation belongs in the domain layer—not the UI.

---

## Design Guardrails

- Entities own behavior.
- Value Objects remain immutable.
- Specifications define reusable templates.
- Business rules belong in domain classes.
- Persistence models must mirror—but not replace—the domain model.
- Every API command must invoke entity behavior rather than directly updating storage.

---

## Chapter Summary

This chapter defines the complete business vocabulary of SPIKE LIFE. It separates runtime entities, immutable values, and reusable specifications.

This distinction will simplify:

- TypeScript domain classes
- Database normalization
- Event generation
- AI recommendations
- Future extensibility

The next chapter, Domain Events & Simulation Lifecycle, will define how these objects interact over time and establish the event-driven flow that powers the entire SPIKE LIFE simulation.

---

*End of Volume I — Chapter 4*
