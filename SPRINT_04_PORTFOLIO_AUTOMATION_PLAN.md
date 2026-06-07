# Sprint 04 — Venture Portfolio Automation

**Objective:** Every completed Playbook item automatically updates Venture Blueprint modules — no duplicate data entry.

**Baseline:** Sprint 03 Playbook engine with worksheet → Blueprint sync (Day 1 Personal Why).

---

## PR 1 — Automation engine core *(this commit)*

- `playbookAutomation.js` — unified hook on item complete
- Activity + reflection → portfolio / business plan drafts
- `blueprintTimeline.js` — local activity feed on Blueprint updates
- Vision panel reads from `playbookProgress.js`

---

## PR 2 — Survey completion path

- Interactive survey taker in Playbook Day view
- Market research survey → Market Intelligence portfolio section

---

## PR 3 — FNA stub → Client Growth

- Link traction / FNA placeholders to Client Growth panel from real completion events

---

## PR 4 — Supabase timeline + artifact persistence

- `participant_timeline_events` migration
- Replace localStorage timeline when migration applied

**END**
