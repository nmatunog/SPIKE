# SPIKE LIFE™ — Production UI/UX Execution Plan

**Version:** 1.0  
**Status:** Recommended roadmap  
**References:** Sample UI mockups (2026), GDD Volume I, UX Blueprint v1.0, Amendments A3–A5

---

## 1. Design intent (from mockups)

Target feel:

- **Modern fintech dashboard** meets **lightweight mobile game**
- Dark chrome, colorful domain tiles, crisp typography
- **Vector-only** — icons, SVG dice, CSS gradients; no photo assets, no 3D renders
- **Fast** — CSS + Framer Motion only; no WebGL, no Lottie bloat, no image sprites required for MVP

Avoid: Monopoly clutter, Excel grids, stock photo advisors, heavy illustration pipelines.

---

## 2. Mockup → product mapping

| Mockup element | Current codebase | Production target |
|----------------|------------------|-------------------|
| Top stat bar (Age, Cash Flow, Cash, NW, Life Score, Year) | `BoardHUD` + `FinancialHUD` (split) | **`GameStatusBar`** — single dark strip |
| 4×3 domain grid (12 tiles) | 16-space **spatial** track (`GameBoard`) | **`DomainGridBoard`** — primary solo layout |
| Dice 1 Category + Dice 2 Situation | `rollYearSituation()` (6+6) | **Visual dual dice** + optional **12-face** category table |
| Situation + 4 decision cards | `EncounterCard` + `PlanLens` | **`SituationDecisionStage`** — bottom sheet / panel |
| Goals progress bars | Plan lens goals | **`GoalsRail`** sidebar |
| Talk to Advisor (3/yr) | FNA explainer + lenses | **`AdvisorChip`** — vector avatar, limited uses |
| Turn result bar | Consequence in dashboard | **`TurnOutcomeBar`** — immediate deltas |
| Life Journey 1–60 | 5-year workshop | **Phase 1:** 5 nodes · **Phase 2:** scalable timeline |
| Midway / End game | Partial | **`CheckpointModal`**, **`EndGameSummary`** |

**Recommendation:** Keep spatial board for **workshop/facilitator** mode; ship mockup-style **grid board** as default solo experience.

---

## 3. Visual system — “Tech Life” tokens

Extend `apps/web/tailwind.config.js` (do not replace spike brand red — use as accent).

```text
Background stack
  game-bg-deep     #0B1A30   (mockup navy)
  game-bg-panel    #111827   (slate-900)
  game-bg-elevated #1E293B   (slate-800)

Domain tile accents (vector fill + 8% opacity bg)
  domain-career      #3B82F6
  domain-opportunity #22C55E
  domain-family      #A855F7
  domain-health      #EF4444
  domain-business    #F97316
  domain-lifestyle   #EAB308
  domain-housing     #14B8A6
  domain-education   #6366F1
  domain-government  #64748B
  domain-community   #8B5CF6
  domain-chance      #F59E0B
  domain-milestone   #FBBF24

Effects (CSS only)
  tile-glow: ring-2 ring-white/20 + shadow-[0_0_24px_var(--tile-color)]
  glass: bg-white/5 backdrop-blur-md border border-white/10
  stat-up: text-emerald-400  stat-down: text-red-400
```

**Typography:** Keep Inter/system stack; tabular nums for ₱ (`font-variant-numeric: tabular-nums`).

**Icons:** [Lucide React](https://lucide.dev) — one icon per domain, decision, and HUD metric. No custom illustration pipeline.

**Dice:** SVG rounded squares + pips (extend existing `@spike-life/ui/Dice.tsx`); two instances side-by-side with labels “Category” / “Situation”.

---

## 4. Layout architecture

### Solo play (mockup layout)

```text
┌─────────────────────────────────────────────────────────────┐
│ GameStatusBar — Age | Cash Flow | Cash | NW | Life Score | Yr │
├──────────┬──────────────────────────────────────┬───────────┤
│ GoalsRail│  DomainGridBoard (4×3)               │ Advisor   │
│ + Worlds │  + DualDice + Roll CTA               │ + Insight │
├──────────┴──────────────────────────────────────┴───────────┤
│ SituationDecisionStage (situation left | 4 cards right)      │
├─────────────────────────────────────────────────────────────┤
│ TurnOutcomeBar + LifeJourneyTimeline + Next Year CTA         │
└─────────────────────────────────────────────────────────────┘
```

- **1440×900:** grid hero ~55% width; side rails collapse to bottom sheets on `< xl`.
- **No page scroll** on laptop — internal scroll only in decision panel if needed.

### Data flow (unchanged)

UI reads **projections only** — `getSpatialBoard`, `getDashboard`, `getLensView`. New grid board consumes same `SpatialBoardView` / extended `DomainGridView` from application layer.

---

## 5. Component library plan (`@spike-life/ui`)

| Component | Responsibility |
|-----------|----------------|
| `GameStatusBar` | Merge HUD metrics; Life Score ring mini |
| `DomainGridBoard` | 12 tiles from JSON; highlight active category |
| `DomainTile` | Icon + label + glow state; pure CSS |
| `DualDiceRoller` | Two `Dice` + roll button + result banner |
| `SituationDecisionStage` | Situation narrative + 4 decision cards |
| `DecisionCard` | Icon, title, cost/month, selected state |
| `TurnOutcomeBar` | Immediate deltas (+/− chips) |
| `GoalsRail` | Progress bars from plan lens |
| `AdvisorPanel` | Vector bust icon, “Talk now”, uses remaining |
| `LifeJourneyTimeline` | Horizontal year nodes; current glow |
| `CheckpointModal` | Age 30 midway (configurable) |
| `EndGameSummary` | Final score + Play again |

Build in **`packages/ui`** (reusable); compose in **`apps/web/LifeWorkspace`** or new `GameShell.jsx`.

---

## 6. JSON-driven domain grid

Extend `@spike-life/board-config` with optional **`grid-layout.json`**:

```json
{
  "layout": "grid-4x3",
  "domains": [
    { "id": "career", "label": "Career", "icon": "briefcase", "color": "#3B82F6", "row": 0, "col": 0 },
    { "id": "chance", "label": "Chance", "icon": "dice-5", "color": "#F59E0B", "row": 2, "col": 2 }
  ]
}
```

Category die maps roll → `domains[].id` → highlight tile → situation die picks encounter (existing `situation-die.ts`).

**Engine note:** Today category die is **d6 → 6 domains**. Mockup implies **d12 or 12-slot table**. Plan:

- **Phase A:** Display 12 tiles; map d6 roll to 2 tiles each (pair groups) for zero engine change.
- **Phase B:** `CATEGORY_DIE_FACES` → 12 entries; content-pack configurable.

---

## 7. Motion & performance budget

| Interaction | Motion | Max duration |
|-------------|--------|--------------|
| Tile highlight | scale 1 → 1.04, glow | 200ms |
| Dice roll | rotate + pip shuffle | 280ms |
| Situation panel enter | y: 16 → 0, opacity | 240ms |
| Decision card hover | y: -2, shadow | 150ms |
| Life Score tick | number count-up | 400ms |

Rules:

- `prefers-reduced-motion`: instant state, opacity-only fades.
- Animate **transform/opacity** only — no layout thrashing.
- Lazy-mount decision panel until encounter active.
- Target **LCP < 2.5s**, **JS bundle < 500KB** gzipped for web app (current ~145KB — headroom for +30KB UI).

---

## 8. Phased execution

### Phase 1 — Shell & tokens (1 sprint)

- [ ] Dark `GameShell` theme + token extension in Tailwind
- [ ] `GameStatusBar` replacing split HUD on solo route
- [ ] Lucide added to `@spike-life/ui`
- [ ] `DomainGridBoard` static (JSON-driven, no new engine)

### Phase 2 — Play loop UI (1 sprint)

- [ ] `DualDiceRoller` wired to existing `rollDice()`
- [ ] Tile highlight synced to `rolledCategory` / encounter
- [ ] `SituationDecisionStage` + `DecisionCard` (wire `submitDecision`)
- [ ] `TurnOutcomeBar` from consequence projection

### Phase 3 — Advisor & goals (0.5 sprint)

- [ ] `GoalsRail` from plan lens
- [ ] `AdvisorPanel` — vector icon, FNA shortcut, 3 uses/year (game rule + UI counter)
- [ ] `LifeJourneyTimeline` (5 years MVP)

### Phase 4 — Polish & platform (1 sprint)

- [ ] `CheckpointModal` / `EndGameSummary`
- [ ] Sound-off haptics optional; keyboard shortcuts preserved
- [ ] Responsive bottom sheets (mobile)
- [ ] Workshop mode keeps spatial board + facilitator layout
- [ ] Visual regression smoke (`board.test.tsx` + Playwright optional)

---

## 9. Advisor & decisions (mockup alignment)

Mockup shows **4 decision cards** with monthly costs. Map to existing **7 strategies** by showing top **4 recommendations** from FNA each year:

| UI card | Engine strategy (example) |
|---------|---------------------------|
| Increase Protection | `improve_protection` |
| Invest & Build Wealth | `fund_goals` / split |
| Upgrade Lifestyle | `increase_lifestyle` |
| Save & Build EF | `increase_savings` |

Show projected impact chips (Protection ↑↑, Cash Flow −₱7k) from **precomputed preview** in application projection — not live simulation on hover (keep FDE pure).

---

## 10. What not to build (scope guard)

- Photoreal avatars or AI-generated character art
- 3D dice WebGL
- 60-year full timeline data until content supports it
- Custom icon font / sprite atlas (Lucide is enough)
- Separate mobile native app (responsive PWA first)

---

## 11. Success criteria

1. Solo session recognizable vs mockup within **80% layout parity** on 1440×900.
2. First paint + interactive **< 3s** on mid laptop.
3. **No financial math in UI components** — projections only.
4. **Vectors only** in production bundle (audit: zero `.png`/`.jpg` in `apps/web/src`).
5. Workshop and solo share same FDE; only presentation layer differs.

---

## 12. Next implementation step

Start **Phase 1**: add `grid-layout.json`, `DomainGridBoard`, and `GameStatusBar`; feature-flag in `LifeWorkspace` via `?layout=grid` or env `VITE_BOARD_LAYOUT=grid` for parallel QA against current spatial board.

---

*End of Production UI/UX Execution Plan*
