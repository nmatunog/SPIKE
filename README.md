# SPIKE Portal

Production: **https://spike-asc.pages.dev** (Cloudflare Pages + Supabase).

## Stack

- **Frontend:** Vite + React, deployed to Cloudflare Pages
- **Auth + data:** Supabase (PostgreSQL + RLS)
- **Local API (optional):** `api/` Express + Prisma + SQLite for JWT dev without Supabase

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

1. Sign in as **ADMIN** at https://spike-asc.pages.dev (incognito avoids cached old JS).
2. Open **Admin** → **Users** tab.
3. Fill **Create user account**:
   - Role: **Intern**
   - Email, password (min 8 chars), name
   - University / squad (optional)
4. Click **Create account**.
5. Open **Reports** — the new intern should appear with hours `0/600` and Sprint 01 metric columns.

**Supabase email confirmation:** If sign-up requires confirmation, either disable “Confirm email” under Authentication → Providers → Email, or confirm the user in Supabase **Authentication → Users** before they can sign in.

**Self-signup (optional):** Admin → Users → **Generate today code**; interns use the activation code on the welcome page.

## Supabase setup

See [`supabase/README.md`](./supabase/README.md). Run SQL files in the Supabase SQL Editor (`schema.sql`, `activation_codes.sql`, `password_reset_requests.sql`).

## Sprint 01 refactor

See [`CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md`](./CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md).

## Sprint 02 — Playbook engine + instructional architecture

15-phase platform foundation (portfolio, business plan, competencies, career tracks, venture board, research). Architecture only — not full curriculum or final LMS.

- Spec: [`PLAYBOOK_SCHEMA_V1.md`](./PLAYBOOK_SCHEMA_V1.md)
- Gap analysis: [`PLAYBOOK_SCHEMA_V1_GAP_ANALYSIS.md`](./PLAYBOOK_SCHEMA_V1_GAP_ANALYSIS.md)
- Execution plan (8 PRs): [`PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md`](./PLAYBOOK_SCHEMA_V1_EXECUTION_PLAN.md)

## Venture Blueprint™ — product requirements

The Venture Blueprint is the platform operating system (not an LMS page). Defines modules, platform engines, automation, and default intern experience.

- PRD (V1.1): [`PRD_SPIKE_VENTURE_BLUEPRINT_V1.md`](./PRD_SPIKE_VENTURE_BLUEPRINT_V1.md)
- Gap analysis: [`PRD_SPIKE_VENTURE_BLUEPRINT_V1_GAP_ANALYSIS.md`](./PRD_SPIKE_VENTURE_BLUEPRINT_V1_GAP_ANALYSIS.md)

## Files

- `public/_redirects` — SPA fallback for Cloudflare Pages
- `public/_headers` — security headers copied into `dist`
- `scripts/deploy-cloudflare.sh` — lint, build, commit, push
- `scripts/auto-push-dev-revisions.sh` — auto-save on Cursor session end
