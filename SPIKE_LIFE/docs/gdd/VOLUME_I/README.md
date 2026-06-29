# SPIKE LIFE™ — Game Design Document

## Volume I — Core Systems

**Status:** Engineering GDD subset (Volume I gameplay topics only)  
**Canonical design authority:** [GDS v1.0](../GDS_v1.0/SPIKE_LIFE_GDS_v1.0.pdf) (28 chapters, 7 volumes)  
**Build vs spec:** [Gap analysis](../GDS_v1_GAP_ANALYSIS.md) · [Realignment phases](../GDS_v1_REALIGNMENT_PHASES.md)  
**Audience:** Design, engineering, content, balancing  
**Related:** Architecture Amendments A3–A5, Simulation Blueprints, `@spike-life/domain`

Volume I describes **how the game plays** — loops, dice, domains, engines, advisor workflow, scoring, and replay. Volume I of the **Architecture Bible** (`docs/architecture/VOLUME_I_*`) describes domain modeling; this GDD describes player-facing systems.

| Ch | Title | File |
|----|-------|------|
| 1 | Core Gameplay Loop | [`CHAPTER_01_CORE_GAMEPLAY_LOOP.md`](./CHAPTER_01_CORE_GAMEPLAY_LOOP.md) |
| 2 | Dice Engine | [`CHAPTER_02_DICE_ENGINE.md`](./CHAPTER_02_DICE_ENGINE.md) |
| 3 | Life Domains | [`CHAPTER_03_LIFE_DOMAINS.md`](./CHAPTER_03_LIFE_DOMAINS.md) |
| 4 | Situation Engine | [`CHAPTER_04_SITUATION_ENGINE.md`](./CHAPTER_04_SITUATION_ENGINE.md) |
| 5 | Decision Engine | [`CHAPTER_05_DECISION_ENGINE.md`](./CHAPTER_05_DECISION_ENGINE.md) |
| 6 | Consequence Engine | [`CHAPTER_06_CONSEQUENCE_ENGINE.md`](./CHAPTER_06_CONSEQUENCE_ENGINE.md) |
| 7 | Financial Advisor | [`CHAPTER_07_FINANCIAL_ADVISOR.md`](./CHAPTER_07_FINANCIAL_ADVISOR.md) |
| 8 | Scoring | [`CHAPTER_08_SCORING.md`](./CHAPTER_08_SCORING.md) |
| 9 | Replayability | [`CHAPTER_09_REPLAYABILITY.md`](./CHAPTER_09_REPLAYABILITY.md) |
| 10 | Balancing | [`CHAPTER_10_BALANCING.md`](./CHAPTER_10_BALANCING.md) |

**Implementation phases (GDS → engineering):** [`IMPLEMENTATION_PHASES.md`](./IMPLEMENTATION_PHASES.md)

---

## Design pillars

1. **Fun first, learning always** — play feels like a life board game; every turn teaches real planning.
2. **Dice pace, math decide** — randomness selects situations; outcomes come from decisions and FNA.
3. **One decision per year** — forced focus mirrors annual planning reviews.
4. **Advisor workflow** — Situation → FNA → Recommendation → Decision → Reflection.
5. **Philippines-first, global-ready** — MVP content in `@spike-life/content-philippines`; core engine is country-neutral.

---

## Engine map (implementation)

| GDD chapter | Primary package / module |
|-------------|--------------------------|
| Core loop | `Board` aggregate, `board-orchestrator`, Amendment A5 |
| Dice | `gameboard/services/year-loop/` |
| Domains | Category die faces, board space types, content pack |
| Situation | `situation-engine`, encounter deck, content pack |
| Decision | `decision-engine`, `Simulation.recordDecision` |
| Consequence | `consequence-engine`, `long-term-consequence-engine` |
| Advisor | `discovery-engine`, `fna-engine`, `recommendation-engine`, `reflection-engine` |
| Scoring | `life-score-engine`, Life Score™ |
| Replayability | Financial Worlds, encounter deck, archetypes, workshop mode |
| Balancing | Blueprint economics, FNA weights, decision quality rules |
