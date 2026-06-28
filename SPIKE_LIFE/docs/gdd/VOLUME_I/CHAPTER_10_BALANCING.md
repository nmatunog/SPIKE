# Volume I — Chapter 10: Balancing

**SPIKE LIFE™ Game Design Document**

---

## Purpose

Guidelines for tuning SPIKE LIFE so it stays **fair, educational, and fun** — without becoming a punitive simulator or a trivial win.

---

## Balancing philosophy

1. **No unwinnable years** — every situation has at least one “good” and one “risky” decision path.
2. **No dice-driven poverty** — bad luck is situation *theme*, not automatic wealth destruction.
3. **Protection stress must teach, not trap** — medical/job events hurt, but improve_protection and discipline remain viable.
4. **Promotion must tempt lifestyle creep** — `increase_lifestyle` should feel good short-term with measurable long-term cost (hidden consequence).
5. **FNA top priority must shift** — different archetypes and years should change which gap ranks first.

---

## Primary levers

| Lever | What it affects | Where tuned |
|-------|-----------------|-------------|
| Income / expense multipliers | Situation severity | `situation-engine` constants |
| Allocation factors | Decision payoff | `consequence-engine` |
| FNA gap thresholds | Score sensitivity | `fna-engine` |
| Recommendation weights | Advisor guidance | `recommendation-engine` |
| Life Score weights | HUD overall feel | `life-score-engine` |
| Hidden reveal delay | Long-term tension | `long-term-consequence-engine` |
| Category die weights | Domain frequency | `category-die.ts` (future) |
| Encounter pool size | Repeat rate | `encounter-deck` / content JSON |

---

## MVP calibration anchors (Philippines)

- Fresh graduate monthly income ~₱25k–35k band (archetype spec)  
- Promotion +15% income (`PROMOTION_INCOME_MULTIPLIER`)  
- Protection stress: ₱45k medical hit + ₱2.5k/mo care (tunable in content pack)  
- Emergency fund target: ~6 months expenses via FNA  
- 5-year workshop = complete “mini life” session  

---

## Playtest checklist

- [ ] Can a disciplined player reach Life Score 70+ by year 5?  
- [ ] Does `high_risk` quality occur when ignoring top protection recommendation during stress scenario?  
- [ ] Do hidden consequences reveal at least once in a typical 5-year run?  
- [ ] Is FNA readable in under 90 seconds for a new player?  
- [ ] Workshop: 6 players can finish a turn within facilitator pacing?  

---

## Simulation Blueprint cross-reference

Detailed economic formulas and event severity live in:

- `SIMULATION_BLUEPRINT_v2.7_ECONOMICS.md`  
- `SIMULATION_BLUEPRINT_v2.3_FNA.md`  
- `SIMULATION_BLUEPRINT_v2.6_SCORING.md`  

GDD Volume I defines **intent**; Blueprints define **numbers**. When they conflict, Blueprint numbers win for formulas; GDD wins for player experience intent.

---

## Implementation

Tune in domain services first; migrate tunables to `@spike-life/content-philippines` JSON as A4 matures.
