# SPIKE LIFE™ — Software Architecture Bible

**Volume I — Domain Architecture**  
**Chapter 1 — Domain Vision & Ubiquitous Language**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Canonical |
| Authority | This document is the highest-level source of truth for the SPIKE LIFE domain model. All future technical documents—including database schemas, APIs, React components, AI prompts, reports, and simulation engines—must conform to the concepts and terminology defined in this chapter. |

---

## 1. Purpose

SPIKE LIFE is a **Financial Life Simulation Platform** designed to teach participants how to make sound financial decisions and think like professional financial planners.

It combines:

- Financial Literacy
- Financial Planning
- Financial Needs Analysis (FNA)
- Protection Planning
- Financial Entrepreneurship
- Advisory Thinking

through a realistic life simulation.

**SPIKE LIFE is not:**

- an insurance quotation system
- a budgeting application
- an investment simulator
- a stock market game
- a board game converted to the web

Those may exist inside the platform later. They are not the product.

**The product is a Financial Life Simulation Engine.**

---

## 2. Product Mission

Enable every participant to safely experience decades of financial decisions in a few hours and learn from both success and failure.

The platform should answer:

> **What happens if I make this decision?**

before users make similar decisions in real life.

---

## 3. Product Vision

Every participant should leave SPIKE LIFE with:

- Better financial judgment.
- Better planning skills.
- Greater confidence.
- A deeper understanding of risk.
- An appreciation of financial advice.

The simulation exists to improve decision quality. Not to maximize entertainment.

---

## 4. Educational Philosophy

SPIKE LIFE follows one educational sequence.

```
Experience
    ↓
Reflection
    ↓
Understanding
    ↓
Planning
    ↓
Action
    ↓
Mastery
```

Learning happens because players experience consequences. Not because they memorize concepts.

---

## 5. Core Educational Outcomes

Every feature must support one or more of these six outcomes.

### Cash Flow Literacy

Understand income. Manage expenses. Create surplus. Avoid financial distress.

### Protection Planning

Recognize financial risks. Understand financial vulnerability. Reduce protection gaps. Improve financial resilience.

### Goal Planning

Set priorities. Allocate resources. Manage tradeoffs. Achieve meaningful objectives.

### Wealth Building

Understand long-term growth. Balance risk. Diversify appropriately. Create sustainable wealth.

### Retirement Readiness

Prepare future income. Plan healthcare. Maintain financial independence.

### Advisory Thinking

Observe. Analyze. Prioritize. Recommend. Reflect.

---

## 6. Domain Principles

These principles govern every design decision.

| # | Principle |
|---|-----------|
| **1** | **Life comes before money.** Financial decisions exist within life. Not the other way around. |
| **2** | **Planning is continuous.** Financial planning is never "completed." The simulation reflects continual adjustment. |
| **3** | **Every decision has consequences.** Immediate. Long-term. Expected. Unexpected. |
| **4** | **Tradeoffs are unavoidable.** Choosing one goal delays another. The platform intentionally creates scarcity. |
| **5** | **Protection creates resilience.** Protection does not create wealth. It preserves progress. |
| **6** | **Cash Flow is the heartbeat.** Without positive cash flow: Everything eventually fails. |
| **7** | **Advice creates value.** The objective is not selling products. The objective is improving financial outcomes. |

---

## 7. Domain Language

The following words have precise meanings inside SPIKE LIFE. Developers must not substitute alternative terminology.

### Player

A human using SPIKE LIFE. The player experiences the simulation. The player is not necessarily an advisor.

### Character

The simulated financial identity controlled by the player.

A character has: Age, Career, Family, Financial profile, Goals, Protection, Journey.

### Simulation

One complete financial life. Begins at Launch. Ends at Legacy.

### Life Stage

A progression period representing major financial responsibilities: Launch, Build, Grow, Lead, Legacy.

### Life Event

An occurrence that changes the financial situation.

Examples: Promotion, Marriage, Job Loss, Critical Illness, Inheritance, Business Opportunity.

### Decision

A deliberate action taken by the player.

Examples: Reduce debt. Strengthen Family Protection Plan. Fund retirement. Start a venture.

### Financial Profile

The complete financial state of a character.

Includes: Income, Expenses, Assets, Liabilities, Cash Flow, Net Worth.

### Goal

A future objective requiring financial resources.

Examples: Home, Education, Business, Retirement, Travel.

### Protection Plan

A planning solution that reduces financial vulnerability.

SPIKE LIFE never exposes insurance products as primary concepts.

User-facing solution categories are:

- Family Protection Plan
- Health Protection Plan
- Income Protection Plan
- Education Protection Plan
- Retirement Security Plan

Internally, the engine may map these to detailed coverage variables.

### Financial Needs Analysis (FNA)

The continuous process of identifying financial gaps, prioritizing needs, and recommending planning actions.

The FNA Engine is the intelligence layer of SPIKE LIFE.

### Recommendation

A planning action suggested by the FNA Engine. Recommendations are always solution-oriented. Never product-oriented.

### Life Score™

The primary educational performance indicator. Measures overall financial preparedness. Not simply wealth.

### Journey

The complete history of the player's financial life.

Includes: Events, Decisions, Milestones, Reflections, Achievements.

---

## 8. Domain Boundaries

SPIKE LIFE intentionally excludes the following from the MVP:

- Insurance product quotation
- Policy administration
- Premium computation
- Claims processing
- Bank account integration
- Real-money investing
- Real-money lending
- Tax preparation
- Legal advice
- Medical diagnosis

These may integrate later through external systems. They are not part of the simulation domain.

---

## 9. Bounded Context Overview

The platform consists of six major domains.

```
                     SPIKE LIFE

                    Player Domain
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
Simulation Domain     Planning Domain    Learning Domain
        │                 │                 │
 Financial Domain   Recommendation Domain  Analytics Domain
```

Each domain owns its own business rules. Domains communicate through domain events. No domain reaches directly into another domain's internal state. This separation reduces coupling and improves maintainability.

---

## 10. Ubiquitous Language Rules

Every developer, designer, mentor, AI prompt, report, and API must use the same terminology.

| Correct | Incorrect |
|---------|-----------|
| Life Score | Game Score |
| Protection Gap | Insurance Need |
| Protection Planning | Insurance Purchase |
| Recommendation | Sales Pitch |
| Journey | Game History |
| Financial Profile | Player Stats |

Consistency of language is a core architectural requirement.

---

## 11. Domain Design Rules

- No business logic inside React components.
- No financial calculations inside UI.
- No database logic inside domain services.
- No AI service becomes the source of truth.
- The simulation engine always owns business rules.
- AI may assist. AI never overrides deterministic simulation logic.

---

## 12. Architectural Invariants

These rules must never be violated.

- A Character always belongs to exactly one Player.
- A Simulation always owns one Journey.
- Every Decision belongs to one Simulation Year.
- Every Life Event creates at least one observable consequence.
- Every Recommendation is generated from FNA.
- Every Protection Plan addresses a measurable financial gap.
- Every Life Score is derived from simulation data.
- No user interface may modify simulation state directly.
- All simulation state changes must pass through the Simulation Engine.

---

## 13. Domain Success Criteria

The architecture succeeds when:

- Developers can understand the business vocabulary without referring to implementation details.
- Every feature maps to one or more educational outcomes.
- The same language is used consistently across UI, APIs, Database, Documentation, AI prompts, Reports, Mentor guides.
- Simulation rules remain independent of presentation technology.
- The platform can evolve without changing its core concepts.

---

## 14. Chapter Summary

This chapter defines the language and philosophy of SPIKE LIFE.

Future chapters will define:

- Domain boundaries
- Aggregates
- Entities
- Value Objects
- Domain Events
- Services
- Business Rules

All implementation work must trace back to the concepts established here.

---

*End of Volume I — Chapter 1*
