# Volume I — Chapter 7: Financial Advisor

**SPIKE LIFE™ Game Design Document**

---

## Purpose

SPIKE LIFE teaches the **professional financial advisor workflow** — not product sales. The “Financial Advisor” is the combined player + system lens that mirrors how planners work with clients.

---

## Advisor workflow (per year)

```text
Situation presented
  ↓
Discovery — “What changed? What risks? What opportunities?”
  ↓
Financial Needs Analysis (FNA)
  ↓
Recommendations (solution language, ranked)
  ↓
Client decision (player chooses ONE strategy)
  ↓
Consequences + reflection
  ↓
Advisor readiness insight
```

---

## Discovery

Six structured questions with evidence-based answers tied to profile numbers and situation copy. Teaches **diagnosis before action**.

---

## Financial Needs Analysis (FNA)

Five dimensions scored 0–100 with gap narratives:

| Dimension | Question |
|-----------|----------|
| Cash flow | Sustainable today? |
| Protection | Covered if life shocks? |
| Debt | Borrowing helping or hurting? |
| Goals | Funding what matters on schedule? |
| Retirement | Will today’s choices work in 30 years? |

Outputs: overall score, rating, top priority, emergency fund progress, protection needs.

---

## Recommendations

Ranked list from `recommendation-engine` using **solution categories**:

- Build Emergency Fund  
- Strengthen Family / Health Protection Plans  
- Protect Income · Secure Education Goals · Strengthen Retirement Security  
- Reduce Unsustainable Debt · Accelerate Goal Funding · Maintain Lifestyle Discipline  

Rules: protection before aggressive wealth building when gaps are critical; emergency fund before speculative investing.

---

## Reflection

Post-decision prompts lock learning; `advisorInsight` summarizes readiness to advise others.

---

## Five-lens workspace (UX)

| Lens | Advisor analog |
|------|----------------|
| Life | Client overview, Life Score, current event |
| Plan | FNA, recommendations, decision |
| Protect | Protection plans and gaps |
| Grow | Cash flow, assets, liabilities |
| Journey | Timeline, reflection, story |

---

## Implementation

`discovery-engine` · `fna-engine` · `recommendation-engine` · `reflection-engine` · Five-lens projections in `@spike-life/application`
