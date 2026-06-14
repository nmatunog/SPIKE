# SPIKE ASC — Sprint 06A: Content Studio™

**Version 1.0** — Curriculum authoring & content management (no-code).

Production: https://portal.1cma.online/admin/content-studio

---

## Objective

Faculty and admins can build, edit, version, and publish SPIKE curriculum without software changes.

---

## Shipped in this slice

| Area | Status |
|------|--------|
| Route `/admin/content-studio` | ✅ Shell + sidebar nav |
| Curriculum tree browser | ✅ Segment → Week → Day |
| Block managers (presentations, worksheets, activities, surveys, assessments, rubrics, guides) | ✅ List views (Supabase-backed) |
| Day Builder | ✅ Reorder + attach blocks to a day |
| Media Library | ✅ List shell (upload → Storage in next slice) |
| Version statuses | ✅ draft / review / published / archived |
| Supabase migration | ✅ `20260627_sprint_06a_content_studio.sql` |
| Week 1 preload | ✅ Days 1–5 themes + Day 1 builder blocks |

---

## Database

**Apply in Supabase SQL Editor:**

`supabase/migrations/20260627_sprint_06a_content_studio.sql`

### Tables & views

| PRD name | Implementation |
|----------|----------------|
| `curriculum_segments` | View on `segments` (+ slug, description, hours, status) |
| `curriculum_weeks` | View on `weeks` (+ theme, description, status) |
| `curriculum_days` | View on `days` (+ title, theme, deliverables, status) |
| `curriculum_sessions` | View on `sessions` (+ slug, description, status) |
| `content_blocks` | New — reusable blocks with `payload jsonb` |
| `content_assets` | New — media library metadata |
| `day_content_sequences` | Day Builder ordering |

---

## Navigation

Admin → **Content** tab → **Open Content Studio**

Or direct: `/admin/content-studio`

Roles: **admin**, **faculty**

---

## Next slices (not in 06A)

1. **Create / edit forms** for each block type (PPTX upload, worksheet questions)
2. **Supabase Storage** wiring for Media Library
3. **Publish pipeline** — DB-first `curriculumService` when tree is published
4. **Drag-and-drop** Day Builder (currently move up/down)
5. **Playbook read path** — render published `day_content_sequences` to participants

---

## Success criteria (PRD)

- [x] Faculty can browse curriculum hierarchy in CMS
- [x] Day can be assembled from content blocks and saved
- [x] Content supports draft → published lifecycle
- [ ] Full week authoring without code *(forms + publish pipeline)*
- [ ] Playbook auto-renders published CMS content *(06B)*
