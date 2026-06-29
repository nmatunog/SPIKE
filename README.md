# SPIKE Portal

Production: **https://portal.1cma.online** (Cloudflare Pages + Supabase). Staging: https://spike-asc.pages.dev

## Stack

- **Frontend:** Vite + React, deployed to Cloudflare Pages
- **Auth + data:** Supabase (PostgreSQL + RLS)
- **Local API (optional):** `api/` Express + Prisma + SQLite for JWT dev without Supabase
- **Mobile:** Capacitor 7 (iOS + Android native shells around the Vite build)

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Set Supabase keys in `.env` to match production behavior:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Without Supabase keys, you can run a read-only preview with `VITE_STATIC_ONLY=true` (orientation + master blueprint only).

**Local demo sign-in (optional):** Set `VITE_MOCK_AUTH=true` in `.env` for allowlisted `@example.com` accounts (`password123`). Production builds disable this; use real Supabase Auth users for testing.

### Optional: local Express API

In a second terminal:

```bash
cd api
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000`. Leave `VITE_SUPABASE_*` empty and do not set `VITE_STATIC_ONLY` to use JWT auth locally.

## Mobile (Capacitor — iOS & Android)

The web app is wrapped with [Capacitor](https://capacitorjs.com/). Native projects live in `ios/` and `android/` (open in **Xcode** / **Android Studio**).

**Prerequisites:** Node 20+, Xcode (macOS), CocoaPods (`sudo gem install cocoapods`), Android Studio (for Android).

```bash
# .env must include VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (baked into native build)
cp .env.example .env

npm run cap:ios       # build, sync, open Xcode
npm run cap:android   # build, sync, open Android Studio
```

After UI changes: `npm run cap:sync` (rebuilds `dist` and copies into native projects).

**Live reload on device** (optional): in `capacitor.config.json`, set `server.url` to your machine’s LAN address (e.g. `http://192.168.1.10:5173`), run `npm run dev`, then `npx cap run ios`. Remove `server.url` before store builds.

**Supabase auth on mobile:** add redirect URLs in Supabase → Authentication → URL configuration:

- `com.asc.spike://**` (custom scheme)
- Your production URL `https://portal.1cma.online/**`

**Store assets:** replace default launcher icons/splash via `@capacitor/assets` before App Store / Play submission.

## Production domain (`portal.1cma.online`)

SPIKE runs on the **1CMA** apex domain as subdomain **portal**:

| URL | Role |
|-----|------|
| https://portal.1cma.online | Production portal |
| https://spike-asc.pages.dev | Cloudflare Pages default (staging / fallback) |

**One-time DNS + Pages setup** (after `1cma.online` is added to Cloudflare and nameservers are active):

```bash
chmod +x scripts/setup-portal-domain.sh
./scripts/setup-portal-domain.sh
```

Then in **Supabase → Authentication → URL configuration**, add redirect URL:

- `https://portal.1cma.online/**`

Keep `https://spike-asc.pages.dev/**` during transition if needed.

## Deploy (Cloudflare Pages)

**Primary:** push to `main` runs [`.github/workflows/deploy-cloudflare-pages.yml`](./.github/workflows/deploy-cloudflare-pages.yml) (lint, build with Supabase env, `wrangler pages deploy`).

**One-time CI setup** (GitHub repo secrets):

```bash
chmod +x scripts/setup-github-deploy-secrets.sh
./scripts/setup-github-deploy-secrets.sh
```

Requires a [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with **Pages Edit** (Edit Cloudflare Workers template works).

**Local deploy helper** (commit + push → triggers GitHub Actions):

```bash
npm run deploy:cf -- "feat: your message"
```

Put Supabase keys in `.env` before `npm run build` or `deploy:cf` so Vite bakes them into `dist/`.

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | `.env` (local) + GitHub secret (CI) |
| `VITE_SUPABASE_ANON_KEY` | `.env` (local) + GitHub secret (CI) |
| `CLOUDFLARE_API_TOKEN` | GitHub secret only |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub secret (`66e72ecb625c7e76d017a366156ec53f`) |

**If GitHub Actions fails** (billing lock, missing `CLOUDFLARE_API_TOKEN`): build + deploy directly:

```bash
# .env must include VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run deploy:prod
```

**Reconnect Cloudflare Git** (optional): Cloudflare Dashboard → Workers & Pages → **spike** → Settings → Builds & deployments → reconnect **nmatunog/SPIKE** / branch `main`. Ensure Production env vars include the `VITE_SUPABASE_*` keys so Cloudflare’s build step bakes them in.

## Create a test intern (admin)

1. Sign in as **ADMIN** at https://portal.1cma.online (incognito avoids cached old JS).
2. Open **Admin** → **Users** tab.
3. Fill **Create user account**:
   - Role: **Intern**
   - Email, password (min 8 chars), name
   - University / squad (optional)
4. Click **Create account**.
5. Open **Reports** — the new intern should appear with hours `0/600` and Sprint 01 metric columns.

**Email confirmation:** All portal signups (intern, staff, admin-created) use Cloudflare APIs with `email_confirm: true` when `SUPABASE_SERVICE_ROLE_KEY` is set — accounts are pre-confirmed and **no signup email is sent**. You can leave Supabase “Confirm email” on or off; the APIs bypass it. Set the service key on Cloudflare Pages (Production). Without it, legacy `signUp` fallbacks may still send mail and hit Supabase rate limits.

**Self-signup (optional):** A new activation code is auto-generated at **midnight Asia/Manila** (also created when staff open their dashboard). Program Coach, Mentor, and Admin dashboards show today’s code; interns enter it on the welcome page. Run [`supabase/migrations/20260614_daily_activation_code_auto.sql`](./supabase/migrations/20260614_daily_activation_code_auto.sql) in Supabase SQL Editor (enable **pg_cron** extension for scheduled midnight generation).

## Supabase setup

See [`supabase/README.md`](./supabase/README.md) for the **full 16-step SQL checklist** (schema + all sprint migrations through Content Studio 06A). Do not run only `schema.sql` — steps 2–16 are required for Playbook, Blueprint, Coach, and Content Studio.

## Sprint 01 refactor

See [`CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md`](./CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md).

## Sprint 02 — Instructional architecture substrate

Types, content tree, DB scaffold, curriculum service, and Playbook viewers (foundation for Sprint 03).

- Spec: [`PLAYBOOK_SCHEMA_V1.md`](./PLAYBOOK_SCHEMA_V1.md)
- Gap analysis: [`PLAYBOOK_SCHEMA_V1_GAP_ANALYSIS.md`](./PLAYBOOK_SCHEMA_V1_GAP_ANALYSIS.md)
- Execution plan (8 PRs): [`PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md`](./PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md)

## Sprint 03 — Playbook engine & curriculum execution

Session layer, role views (participant / faculty / mentor), completion tracking, Segment 1 week ladder.

- Execution plan: [`SPRINT_03_PLAYBOOK_EXECUTION_PLAN.md`](./SPRINT_03_PLAYBOOK_EXECUTION_PLAN.md)

## Sprint 06A — Content Studio™

No-code curriculum authoring for faculty and admins.

- Spec: [`SPRINT_06A_CONTENT_STUDIO.md`](./SPRINT_06A_CONTENT_STUDIO.md)
- Route: `/admin/content-studio`
- Migration: step **16** in [`supabase/README.md`](./supabase/README.md)

## Master roadmap (Sprints 04–11)

Integrated plan: **Learn → Execute → Track → Scale**

- [`SPIKE_MASTER_ROADMAP.md`](./SPIKE_MASTER_ROADMAP.md) — canonical sequence
- [`SPRINT_04_EXECUTION_ACTIVITY_ENGINE.md`](./SPRINT_04_EXECUTION_ACTIVITY_ENGINE.md) — next sprint PRs

## Venture Blueprint™ — product requirements

The Venture Blueprint is the platform operating system (not an LMS page). Defines modules, platform engines, automation, and default intern experience.

- PRD (V1.1): [`PRD_SPIKE_VENTURE_BLUEPRINT_V1.md`](./PRD_SPIKE_VENTURE_BLUEPRINT_V1.md)
- Gap analysis: [`PRD_SPIKE_VENTURE_BLUEPRINT_V1_GAP_ANALYSIS.md`](./PRD_SPIKE_VENTURE_BLUEPRINT_V1_GAP_ANALYSIS.md)

## Major projects

| Project | Path | Description |
|---------|------|-------------|
| **SPIKE Portal** | `/` (this repo root) | Venture incubator platform — playbook, blueprint, portfolio |
| **SPIKE_LIFE** | [`SPIKE_LIFE/`](./SPIKE_LIFE/) | Financial Decision Simulator — [GDS v1.0](SPIKE_LIFE/docs/gdd/GDS_v1.0/SPIKE_LIFE_GDS_v1.0.pdf), [gap analysis](SPIKE_LIFE/docs/gdd/GDS_v1_GAP_ANALYSIS.md), [realignment plan](SPIKE_LIFE/docs/gdd/GDS_v1_REALIGNMENT_PHASES.md) |

## Files

- `public/_redirects` — SPA fallback for Cloudflare Pages
- `public/_headers` — security headers copied into `dist`
- `scripts/deploy-cloudflare.sh` — lint, build, commit, push
- `scripts/auto-push-dev-revisions.sh` — auto-save on Cursor session end
