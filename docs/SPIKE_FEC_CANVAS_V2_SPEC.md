# SPIKE Financial Entrepreneurship Canvas — V2 Spec (Phase 0 Locked)

**Status:** Approved — Phase 0 complete  
**Date:** 2026-06-15  
**Short name:** FEC (shortcut label in tight UI only)

---

## 1. Naming

| Context | Label |
|---------|--------|
| Full title (everywhere default) | **SPIKE Financial Entrepreneurship Canvas** |
| Tight UI (nav, chips, tabs) | **FEC** |
| Module slug | `canvas` (unchanged) |
| Retire in user-facing copy | “Executive Canvas”, “three growth engines” as primary framing |

---

## 2. Design principle

**Start at the center, not Box 1.**

Every box must justify the **Unified Venture Proposition (UVP)** at the center. Top banner (static):

> Every decision on this canvas must strengthen ONE Unified Venture Proposition. If a box doesn't support it, rethink the box.

---

## 3. Center — Unified Venture Proposition

**Field:** `unified_venture_proposition` (free text)

**Helper prompt (UI, not enforced):**

> For *(customer)*, we create *(financial outcome)* by delivering *(solution)* profitably and sustainably.

**Example suggestive text (placeholder / coach cue):**

> We help young Filipino professionals achieve financial independence through affordable protection and disciplined investing while building a scalable advisory business.

**Rules:**

- Free text — no rigid template validation
- Helper + suggestive text visible in editor and coach view
- Replaces “Overall Strategy Statement” as the primary center artifact
- Auto-generate from other fields is **optional assist only**, never default overwrite once user edits

---

## 4. Layout — four pillars + compass (conceptual)

Compass labels (visual only, not separate data boxes): CUSTOMER ▲ · VALUE ◄ UVP ► REVENUE · PROFIT ENGINE ▼

### Pillar 1 — CREATE VALUE

| # | Box | Field key |
|---|-----|-----------|
| 1 | Customer Segments | `customer_segments` |
| 2 | Customer Problem | `customer_problem` |
| 3 | Value Offering | `value_offering` |

### Pillar 2 — CAPTURE VALUE

| # | Box | Field key |
|---|-----|-----------|
| 4 | Revenue Streams | `revenue_streams` |
| 5 | Cost Structure | `cost_structure` |
| 6 | Profit Formula | `profit_formula` |

### Pillar 3 — ENABLE VALUE

| # | Box | Field key |
|---|-----|-----------|
| 7 | Key Resources | `key_resources` |
| 8 | Key Partners | `key_partners` |
| 9 | Funding Strategy | `funding_strategy` |

### Pillar 4 — PROVE VALUE

| Box | Field key | Structure |
|-----|-----------|-----------|
| Venture Scorecard | `venture_scorecard` | See §6 |

### Bottom strip

| Box | Field key |
|-----|-----------|
| Roadmap | `roadmap_12mo`, `roadmap_24mo`, `roadmap_36mo` |
| Success Statement | See §7 |

---

## 5. Agency Builder extensions (agency track only)

Shown **below** core FEC for `career_track === 'agency_builder'`. Hidden for Specialist Consultant.

| Section | Fields (migrated from v1 engines) |
|---------|-----------------------------------|
| Talent & recruitment | `talent_segments`, `recruit_value_proposition`, `recruitment_channels`, `talent_development_system` |
| Leadership & scale | `culture_statement`, `leadership_system`, `expansion_strategy`, `growth_multipliers` |

**Not on the core one-page board export** unless user opts “Include Agency Extensions” on export. Core FEC export stays clean for all tracks.

---

## 6. Venture Scorecard

Replaces “Unit Economics” / generic metrics snapshot naming.

**Autofill:** from FNA funnel + impact-related sources; **always manually overwritable**.

| Category | Fields | Autofill source |
|----------|--------|-----------------|
| **Financial** | `revenue`, `profit`, `cac`, `ltv` | FNA funnel / client growth summary where available; manual override |
| **Growth** | `clients`, `referrals`, `conversion` | FNA funnel stages; manual override |
| **Impact** | `families_protected`, `premium_placed`, `lives_improved` | Impact builder / mission hints for suggestive defaults; manual override |

**UX:** each metric shows “Auto-filled from FNA” badge when value came from sync; user edit clears badge and locks manual.

---

## 7. Success Statement

**One narrative + five numeric fields** (stored separately, rendered as one block on board).

| Field key | Type |
|-----------|------|
| `success_narrative` | Text — “Three years from now, this venture will…” |
| `success_revenue` | Numeric |
| `success_customers` | Numeric |
| `success_families_protected` | Numeric |
| `success_jobs` | Numeric |
| `success_annual_profit` | Numeric |

**Rendered pattern:**

> Three years from now, this venture will… *[narrative]*  
> — generate **{revenue}** revenue · serve **{customers}** customers · protect **{families}** families · create **{jobs}** jobs · produce **{profit}** annual profit

Replaces bottom “Purpose & Impact” strip on FEC board (Ambition & Impact module unchanged).

---

## 8. SPIKE Flow (guided read order)

In-app stepper — same order for coaches and participants:

1. WHO has the problem? → Customer Segments  
2. WHAT problem exists? → Customer Problem  
3. WHAT value do we create? → Value Offering  
4. Can customers pay? → Revenue Streams  
5. Can we earn profit? → Profit Formula (+ Cost Structure context)  
6. What resources are needed? → Key Resources  
7. Who helps us? → Key Partners  
8. How do we finance growth? → Funding Strategy  
9. How do we measure success? → Venture Scorecard  
10. Where do we want to be in 3 years? → Roadmap + Success Statement  

Center UVP is step 0 / anchor — revisited after each pillar in coach debrief.

---

## 9. V1 → V2 migration map

| V1 (`canvas_entries`) | V2 field |
|-----------------------|----------|
| `client_growth.customer_segments` | `customer_segments` |
| — | `customer_problem` (new) |
| `client_growth.value_proposition` | `value_offering` |
| `client_growth.revenue_streams` | `revenue_streams` |
| `foundation.cost_structure` | `cost_structure` |
| — | `profit_formula` (new) |
| `foundation.resources` | `key_resources` |
| `foundation.partners` | `key_partners` |
| — | `funding_strategy` (new) |
| `canvas_summary.strategy_statement` | `unified_venture_proposition` |
| `year1/2/3_goal` | `roadmap_12/24/36mo` |
| Talent + leadership engine fields | Agency Builder extensions only |

Existing participant data preserved; `canvas_schema_version: 'v2'` after migration.

---

## 10. Out of scope for FEC v2 (unchanged modules)

- Client Growth funnel / FNA engine (feeds scorecard autofill)  
- Recruitment Growth module  
- Leadership journal module  
- Ambition & Impact / Venture Coach builders  

---

## 11. Implementation phases (next)

| Phase | Scope | Gate |
|-------|--------|------|
| **1** | Schema, constants, migration script | After explicit go on Phase 1 |
| **2** | Editor UX (center-first + flow + extensions) | Staging review |
| **3** | FEC board + PNG/PDF/PPT exports | Export review |
| **4** | Day 4 curriculum + coach decks | Content review |
| **5** | Cutover + v1 deprecation | Production sign-off |

---

## Phase 0 sign-off

| # | Decision | Approved answer |
|---|----------|-----------------|
| 1 | Naming | SPIKE Financial Entrepreneurship Canvas everywhere; **FEC** shortcut |
| 2 | Agency track | **Agency Builder extensions** section (talent + leadership fields) |
| 3 | Venture Scorecard | **Autofill from FNA funnel + impact**; manual override always |
| 4 | Success Statement | **One narrative + 5 numeric fields** |
| 5 | UVP | **Free text** with helper prompt + suggestive example |

**Approved by:** Program owner (2026-06-15 conversation)
