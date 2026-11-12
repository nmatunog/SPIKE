# RA-SPIKE database (separate Supabase project)

RA-SPIKE runs on its **own Supabase project**, independent from **SPIKE Internship** (Cassiopeia / Argo Navis / Pegasus cohort).

| | SPIKE Internship | RA-SPIKE |
|---|------------------|----------|
| **Git branch** | `main` | `ra-spike` |
| **Supabase project** | SPIKE (`lzbfjbtjropoaynbcxew`) | RA-SPIKE (`yruwfdjqigxxwbqsqhho`) |
| **Portal** | https://portal.1cma.online | TBD (ra-spike branch deploy) |
| **Curriculum / portfolio** | Internship playbook & venture portfolio | `content/ra-spike/*` only |

## CLI setup (one-time)

```bash
git checkout ra-spike
supabase login
npm run db:bootstrap:ra-spike
```

This links the CLI to the RA-SPIKE project, resets `public` + `supabase_migrations`, applies `schema.sql`, then runs the **allowlisted** migrations in `supabase/ra-spike/migrations-allowlist.txt` (cohorts, staff signup, RA-SPIKE only — no pitch panel, SPIKE Life, or venture portfolio).

## Day-to-day

```bash
git checkout ra-spike
npm run db:link:ra-spike      # point CLI at RA-SPIKE
npm run db:migrate:ra-spike   # apply new migrations only
```

To work on SPIKE Internship DB again:

```bash
git checkout main
supabase link --project-ref lzbfjbtjropoaynbcxew --yes
npm run db:migrate
```

## Local app env

```bash
cp .env.ra-spike.example .env.ra-spike.local
# Fill VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY from:
#   supabase projects api-keys --project-ref yruwfdjqigxxwbqsqhho
```

For Vite, either merge into `.env` on this branch or:

```bash
export $(grep -v '^#' .env.ra-spike.local | xargs) && npm run dev
```

## Cloudflare / production (ra-spike branch)

Set **separate** env vars on the RA-SPIKE Pages project (when created):

- `VITE_SUPABASE_URL` → `https://yruwfdjqigxxwbqsqhho.supabase.co`
- `VITE_SUPABASE_ANON_KEY` → RA-SPIKE anon key
- `SUPABASE_SERVICE_ROLE_KEY` → RA-SPIKE service role (encrypted)

Do **not** point RA-SPIKE at the SPIKE Internship Supabase URL.

## Database password

Created at project provision time; stored locally in `supabase/ra-spike/.db-password.local` (gitignored). Reset via Supabase Dashboard if lost.

## What is *not* shared

- Auth users and `profiles`
- Cohorts, squads, intern progress
- Portfolio artifacts, venture blueprint, pitch panel
- SPIKE Life game rooms

RA-SPIKE rookies and coaches use the RA-SPIKE project only.
