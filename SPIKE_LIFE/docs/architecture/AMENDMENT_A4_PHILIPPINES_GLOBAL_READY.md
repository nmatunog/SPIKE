# Architecture Amendment A4 — Philippines-First, Global-Ready

**Version:** 1.0  
**Status:** Mandatory  
**Authority:** Extends A0–A3; does not replace Amendment A3 (Gameboard Engine).

---

## Design Philosophy

SPIKE LIFE shall be designed using a **Philippines-First, Global-Ready** architecture.

The initial product faithfully represents Philippine financial realities, culture, and decision-making.

The **Core Engine** remains country-neutral so additional country packs can ship without rewriting engine code.

---

## Guiding Principle

Separate **Core Logic** from **Local Content**.

The Core Engine must never contain country-specific assumptions.

Only the **Content Layer** may contain regional information.

---

## Architecture

```text
Presentation Layer
        ↓
Game Engine (board, turns, pacing)
        ↓
Financial Decision Engine (FNA, decisions, consequences)
        ↓
Content Engine (pack loader, locale, institutions)
        ↓
Philippines Pack (MVP)
```

Future content packs: Singapore, Malaysia, Indonesia, Vietnam, Australia, United States — **Core Engine unchanged**.

---

## Financial Worlds

SPIKE LIFE ships as distinct **Financial Worlds** — one per country edition. Each world is a content pack + locale; the core engine is shared.

| World | Status |
|-------|--------|
| 🇵🇭 Philippine Financial World | **Available (MVP)** |
| 🇸🇬 Singapore Financial World | Planned |
| 🇦🇺 Australian Financial World | Planned |
| 🇺🇸 American Financial World | Planned |
| 🇮🇩 Indonesian Financial World | Planned |

Catalog: `@spike-life/content-core` → `FINANCIAL_WORLDS`. Each pack manifest includes `financialWorldId`.

---

## MVP Country

**Philippine Edition.** Every initial encounter, scenario, and default archetype should feel familiar to a Filipino player.

---

## Philippine Design Principles

Design around real Filipino life stages and moments, including:

First Allowance · Graduation · First Job · BPO Career · Government Employment · OFW Opportunity · Family Financial Support · Small Business · Sari-sari Store · Motorcycle Purchase · Housing · Renting · Pag-IBIG Housing Loan · Wedding · First Child · Parents Becoming Dependent · Medical Emergency · Business Expansion · Retirement · Legacy

---

## Financial Topics (Philippine MVP)

Prioritize: Emergency Fund · Cash Flow · Family Support · Healthcare · Education · Protection · Housing · Entrepreneurship · OFW Decisions · Retirement · Legacy

Avoid uncommon-in-PH concepts in the MVP unless supplied by an optional pack.

---

## Government & Institutions

SSS, PhilHealth, Pag-IBIG, and BIR are **configurable content** in the Philippines pack — not hardcoded domain logic.

---

## Currency & Localization

- MVP currency: **PHP** via `@spike-life/content-philippines`
- Core `Money` value object uses currency **codes** and **locale-aware formatting** from pack config
- MVP language: **English (`en-PH`)**; future: Filipino, Cebuano, Ilocano via locale files only

---

## Architectural Rule

Before every feature:

> **Is this a Core Engine capability or Philippine content?**

| If… | Then… |
|-----|--------|
| Philippine-specific | `@spike-life/content-philippines` (or future pack) |
| Universal (FNA math, turns, scoring) | `@spike-life/domain` |
| Year loop weights & domain grid | Content pack `yearLoop` → `configureYearLoop()` |

---

## Code Map (Phase 1)

| Layer | Package |
|-------|---------|
| Content pack types & loader | `@spike-life/content-core` |
| Financial Worlds catalog | `@spike-life/content-core` → `financial-worlds.ts` |
| Philippines MVP data | `@spike-life/content-philippines` |
| Board layout (presentation) | `@spike-life/board-config` |
| Financial Decision Engine | `@spike-life/domain` |
| Gameboard aggregate | `@spike-life/domain` → `gameboard/` |

---

## Conformance Checklist

- [ ] No `₱`, `SSS`, `Pag-IBIG`, or Filipino life events in domain engine logic
- [ ] Currency formatting via `CurrencyConfig`, not string concatenation
- [ ] Encounters and scenarios loaded from content pack (target; deck migration in progress)
- [ ] New country = new pack + locale files only

---

*End of Architecture Amendment A4*
