# Volume I — Chapter 9: Replayability

**SPIKE LIFE™ Game Design Document**

---

## Purpose

Keep sessions fresh so players return — as learners, workshop cohorts, and future regional editions.

---

## Replay vectors

### 1. Financial Worlds

Different country packs (Philippines MVP; Singapore, Australia, US, Indonesia planned) swap institutions, currency, life situations, and copy while the core loop stays fixed.

### 2. Encounter variety

15+ encounter cards × category/situation die → different titles and learning concepts each year. Deck expansion via content, not code changes.

### 3. Archetypes

Starting profiles (Fresh Graduate, Young Family, etc. — Blueprint v2.4) change opening FNA and valid strategies.

### 4. Decision paths

Seven strategies × two scenario engines × quality outcomes → distinct profile trajectories over 5 years.

### 5. Hidden long-term consequences

Same visible choice can produce different revealed echoes by strategy and quality — encourages replay to see delayed effects.

### 6. Workshop multiplayer

Up to 6 parallel simulations; same facilitator scenario, divergent player decisions → compare Life Scores and reflections.

### 7. Life stage progression

Workshop macro turns advance Launch → Legacy; future content can stage-weight category die and events.

---

## Anti-replay fatigue rules

- Never repeat identical situation copy twice in one 5-year run (target; deck size enforces variety).
- Reflection prompts rotate; advisor insights reference actual gap movement.
- Board spatial layout provides visual novelty even when scenarios repeat.

---

## Metrics to watch (live ops)

- Completion rate per year / full 5-year run  
- Decision distribution (are players always picking savings?)  
- Life Score variance in workshop rooms  

---

## Implementation

`content-philippines` · `FINANCIAL_WORLDS` · `encounter-deck.ts` · `fresh-graduate.ts` / `protection-stress.ts` · `GameRoom` orchestration
