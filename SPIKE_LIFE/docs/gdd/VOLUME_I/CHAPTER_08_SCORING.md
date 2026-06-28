# Volume I — Chapter 8: Scoring

**SPIKE LIFE™ Game Design Document**

---

## Purpose

**Life Score™** compresses financial health and decision quality into a single progression metric players care about — without replacing detailed FNA.

---

## Life Score components

| Component | Source |
|-----------|--------|
| Cash flow | FNA cash flow score |
| Protection | FNA protection score |
| Goals | FNA goal score |
| Wealth | Net worth vs annual income bands |
| Retirement | FNA retirement score |
| Impact | Decision quality of latest choice |
| **Overall** | Weighted composite |

---

## Decision quality → impact

| Quality | Impact score |
|---------|--------------|
| Excellent | 100 |
| Good | 85 |
| Needs attention | 55 |
| High risk | 25 |
| No decision yet | 70 (neutral) |

---

## Ratings (overall)

| Range | Label |
|-------|-------|
| 90+ | Exceptional Preparedness |
| 80–89 | Strong Foundation |
| 70–79 | Progressing Well |
| 60–69 | Needs Attention |
| 50–59 | At Risk |
| &lt;50 | Critical Gaps |

---

## Design intent

- **Life Score motivates** — visible on HUD and header.
- **FNA educates** — dimensional gaps explain *why* score moved.
- **Impact punishes high-risk choices** without random failure.

---

## Workshop use

Facilitators compare Life Score across players after each macro turn; turn history stores `lifeScoreOverall` per completed year.

---

## Implementation

`life-score-engine.ts` · `calculateLifeScore()` · UI: `LifeScoreRing`, dashboard projections
