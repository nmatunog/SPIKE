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

Pushes to `main` auto-deploy. Manual deploy with checks:

```bash
npm run deploy:cf -- "feat: your message"
```

Or commit + push only (also triggers Cloudflare):

```bash
npm run push:dev
```

**Cloudflare Pages env vars** (Settings → Environment variables):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

Rebuild/redeploy after changing env vars.

## Supabase setup

See [`supabase/README.md`](./supabase/README.md). Run SQL files in the Supabase SQL Editor (`schema.sql`, `activation_codes.sql`, `password_reset_requests.sql`).

## Sprint 01 refactor

See [`CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md`](./CURSOR_REFACTOR_SPRINT_01_EXECUTION_PLAN.md).

## Files

- `public/_redirects` — SPA fallback for Cloudflare Pages
- `public/_headers` — security headers copied into `dist`
- `scripts/deploy-cloudflare.sh` — lint, build, commit, push
- `scripts/auto-push-dev-revisions.sh` — auto-save on Cursor session end
