# Software Architecture Bible

## Architecture Amendment A0

### Core Design Reorientation

Version: 1.0

Status: **FOUNDATIONAL**

Priority: **HIGHEST**

Authority:

This document supersedes and reinterprets all previous design documents.

If any previous PRD, Blueprint, UX document, technical specification, or implementation decision conflicts with this amendment, **this amendment takes precedence**.

---

# The First Principle

SPIKE LIFE is **NOT** a life simulation game.

SPIKE LIFE is **NOT** a financial literacy game.

SPIKE LIFE is **NOT** a digital version of Cashflow.

SPIKE LIFE is **NOT** a personal finance application.

SPIKE LIFE is a:

# Financial Decision Simulator

Life exists only to provide realistic context.

Financial planning is the actual product.

---

# Product Mission

The mission of SPIKE LIFE is:

> To develop financial judgment by allowing participants to repeatedly experience the complete financial planning process inside realistic life situations.

The objective is not to maximize entertainment.

The objective is to improve financial decision quality.

---

# Educational Foundation

SPIKE LIFE is built around the professional financial planning process.

Every simulation cycle follows this sequence.

```text
Situation

↓

Discovery

↓

Financial Needs Analysis (FNA)

↓

Recommendation

↓

Decision

↓

Outcome

↓

Reflection

↓

Improved Financial Judgment
```

This sequence is the primary gameplay loop.

Everything else supports it.

---

# Life Is Context

Marriage is not the lesson.

Promotion is not the lesson.

Critical illness is not the lesson.

Buying a home is not the lesson.

These are merely situations.

The educational objective begins only after the situation occurs.

The player must answer:

* What changed?
* What financial risks now exist?
* What financial opportunities now exist?
* What should I prioritize?
* What should I recommend?
* Why?

---

# The Real Gameplay Loop

Replace the traditional game loop.

Old Thinking

```text
Advance Year

↓

Life Event

↓

Decision

↓

Score
```

New Thinking

```text
Financial Situation

↓

Discovery

↓

Analysis

↓

Recommendation

↓

Decision

↓

Consequence

↓

Reflection

↓

Next Situation
```

This is the canonical SPIKE LIFE loop.

---

# The Role of Financial Needs Analysis

The FNA Engine is the intelligence layer of SPIKE LIFE.

Every meaningful decision must pass through Financial Needs Analysis.

FNA is not a feature.

FNA is the core educational engine.

Without FNA, SPIKE LIFE loses its purpose.

---

# Recommendation Before Action

The player should never be asked:

"What do you want to do?"

Instead, the simulation should ask:

"What financial problem are you trying to solve?"

The Recommendation Engine should identify priorities before the player acts.

Examples

Build Emergency Fund

Strengthen Family Protection

Reduce Unsustainable Debt

Fund Education Goal

Increase Retirement Readiness

Only after understanding the situation should the player make a decision.

---

# Reflection Completes Learning

Reflection is mandatory.

Learning is incomplete without it.

Every planning cycle concludes with:

What happened?

Why did it happen?

What worked?

What would you change?

How would you advise someone else?

Reflection converts experience into judgment.

---

# The Player Is Always the Advisor

There is no separate "Advisor Mode."

The player is always acting as the financial advisor for their own simulated life.

Future client simulations reuse the same engine.

The only difference is:

Instead of advising yourself,

you advise another character.

The planning process remains identical.

---

# Core Product Identity

SPIKE LIFE is:

A Financial Decision Simulator

powered by

Financial Needs Analysis

using

Realistic Life Situations

to develop

Financial Judgment

and

Advisory Thinking.

This identity must remain consistent throughout the product.

---

# Educational Alignment

Every feature must support at least one of these competencies.

Cash Flow Management

Protection Planning

Financial Needs Analysis

Goal Planning

Retirement Readiness

Financial Entrepreneurship

Advisory Thinking

If a proposed feature does not strengthen one or more of these competencies, it does not belong in the MVP.

---

# Navigation Philosophy

The application is not a collection of unrelated pages.

The player remains inside one continuous financial planning workspace.

The Five Lenses represent different perspectives on the same financial life.

1.

Situation

Current financial reality.

---

2.

Analyze

Financial Needs Analysis

Gap Identification

Risk Discovery

---

3.

Plan

Recommendations

Priorities

Alternative Strategies

---

4.

Execute

Financial Decisions

Resource Allocation

Outcome Evaluation

---

5.

Reflect

Journey

Lessons Learned

Advisor Growth

This navigation mirrors the educational process rather than software modules.

---

# Architectural Implications

Rename the conceptual "Simulation Engine" to the:

Financial Decision Engine

The Financial Decision Engine consists of:

Situation Engine

↓

Discovery Engine

↓

Financial Needs Analysis Engine

↓

Recommendation Engine

↓

Decision Engine

↓

Consequence Engine

↓

Reflection Engine

Life events feed the engine.

They are not the engine.

---

# UX Philosophy

Every screen should answer one or more of the following questions:

What is happening?

Why does it matter?

What does the analysis tell me?

What should I do next?

What are the consequences?

What have I learned?

The interface exists to guide thinking rather than display numbers.

---

# Domain Philosophy

The Domain Layer is the heart of SPIKE LIFE.

The Financial Decision Engine is the heart of the Domain Layer.

Every calculation, recommendation, consequence, score, and reflection originates from deterministic domain logic.

The UI visualizes it.

The API exposes it.

The database stores it.

AI explains it.

None of those layers define it.

---

# Development Guardrails

Before implementing any feature, ask these questions in order:

1. Does this feature represent a realistic financial situation?

2. Does it trigger Financial Needs Analysis?

3. Does it require a meaningful financial decision?

4. Does it produce understandable financial consequences?

5. Does it encourage reflection?

6. Does it improve advisory thinking?

If the answer to any question is "No," redesign the feature before implementation.

---

# MVP Design Rule

The MVP is successful if, after completing one simulation, a participant becomes better at making financial decisions in real life.

Not because they memorized financial concepts.

But because they repeatedly practiced the financial planning process.

That is the purpose of SPIKE LIFE.

---

# Final Constitutional Rule

Whenever there is uncertainty between building:

* a game feature,
* a financial feature,
* a UI enhancement,
* an AI capability,
* or a technical optimization,

always choose the option that most improves the participant's ability to make better financial decisions and think more like a trusted financial advisor.

This principle overrides all other design preferences.

---

End of Architecture Amendment A0
