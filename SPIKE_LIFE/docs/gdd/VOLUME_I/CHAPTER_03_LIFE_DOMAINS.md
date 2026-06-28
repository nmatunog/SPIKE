# Volume I — Chapter 3: Life Domains

**SPIKE LIFE™ Game Design Document**

---

## Purpose

**Life domains** are the categories of experience SPIKE LIFE simulates. The category die selects one domain per year; board spaces, encounter cards, and content pack life situations all tag content to domains.

---

## Primary domains (category die)

Career · Finance · Family · Health · Business · Education

These six map to the category die and drive encounter filtering.

---

## Extended board domains

The spatial board uses richer space types for layout and legend (Amendment A3):

Career · Finance · Opportunity · Risk · Family · Health · Business · Investment · Education · Life Event · Milestone · Rest · Bonus · Community

Encounter cards declare one or more `spaceTypes` so a single card can appear under multiple domain labels.

---

## Domain design rules

1. **Domain = theme, not outcome** — landing on Health does not mean “bad year”; it means health-themed situations are eligible.
2. **Content belongs in packs** — Philippine life moments (Pag-IBIG, OFW, sari-sari store) live in `@spike-life/content-philippines`, not in engine code.
3. **FNA is cross-domain** — every situation still runs full Financial Needs Analysis; domain only frames narrative.

---

## Financial Worlds

Domains are **universal**. **Financial Worlds** (GDD + A4) swap regional content inside the same domain model:

- 🇵🇭 Philippine Financial World (MVP)
- 🇸🇬 🇦🇺 🇺🇸 🇮🇩 Planned

---

## Life stage overlay (workshop)

Macro turns align with workshop life stages: Launch → Build → Grow → Lead → Legacy. Future balancing may bias category weights by stage.

---

## Implementation

| Artifact | Location |
|----------|----------|
| Category die faces | `category-die.ts` |
| Board space types | `board-config` / `board.json` |
| PH life situations | `content-philippines/.../life-situations.json` |
| Encounter routing | `encounter-deck.ts` |
