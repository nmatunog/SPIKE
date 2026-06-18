# Venture data model

Single canonical object per squad (or solo intern draft before squad assignment).

## Shape

```text
venture
├── identity      squadName, ventureName, tagline, vision
├── research      customerSegment, insights[], evidence[], opportunityStatement, ventureOpportunity
├── fec           uniqueVentureProposition, clientExperience, growthEngine, financialEngine, roadmap
├── pitch         story, speakerAssignments[], presentationDeck, readinessScore
└── stage         currentWeek, currentDay, completedMilestones[], unlockedModules[]
```

Types: `src/types/venture.ts`  
Factories / merge: `src/lib/ventureDocument.js`  
Supabase CRUD: `src/lib/supabase/ventures.js`  
Legacy compile: `src/lib/ventureDocumentCompile.js`

## Database

Migration: `supabase/migrations/20260719_venture_document.sql`

| Column | Purpose |
|--------|---------|
| `squad_id` | Shared squad venture (unique when set) |
| `owner_user_id` | Intern who owns solo draft or created squad venture |
| `identity` … `stage` | JSONB sections matching the tree above |
| `compiled_snapshot` | Last legacy merge for audit / diff |

## Legacy mapping (today)

| Venture section | Current source |
|-----------------|----------------|
| `identity.squadName` | `intern_progress.squad`, Venture Studio Day 3 |
| `identity.ventureName` / `tagline` | Venture Design Studio step 4 |
| `identity.vision` | Blueprint `vision-purpose` entries |
| `research.*` | Venture Studio Day 3 steps 1–5 + evidence list |
| `research.opportunityStatement` | Venture Design step 3 / Studio step 5 |
| `fec.uniqueVentureProposition` | `canvas_summary.unified_venture_proposition` |
| `fec.roadmap` | `canvas_summary.roadmap_*`, `success_narrative` |
| `fec.financialEngine` | `canvas_summary.success_*` |
| `fec.clientExperience` / `growthEngine` | Venture Design steps 1–4 |
| `pitch.story` | Blueprint future-self narrative |
| `pitch.readinessScore` | `computeVentureReadinessScore(blueprint sections)` |
| `stage.currentWeek/Day` | `intern_progress` |

Existing tables remain authoritative until modules write through `ventures`. Use `compileVentureDocumentFromLegacy()` to hydrate the document without a big-bang migration.

## Apply migration

Run `20260719_venture_document.sql` in Supabase SQL Editor, then:

```sql
NOTIFY pgrst, 'reload schema';
```

Bootstrap script: `node scripts/create-admin-viewer.mjs` is unrelated — for ventures, use app sync or a future backfill script.
