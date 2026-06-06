# Supabase

Production database and auth for SPIKE. Apply scripts in the Supabase **SQL Editor**.

## 1) Create project

1. Create a Supabase project.
2. Keep Auth enabled (email/password).

## 2) Apply schema

Run in order:

1. `schema.sql` — `profiles`, `intern_progress`, `traction_logs`, RLS
2. `activation_codes.sql` — intern signup codes
3. `password_reset_requests.sql` — admin-assisted password help queue

## 3) First admin

After the first Auth sign-up:

1. Find the user UUID in `auth.users`.
2. Run the commented SQL at the bottom of `schema.sql` to set role `ADMIN`.

## 4) Cloudflare Pages env vars

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key |

Redeploy after changing env vars.

## 5) App integration

- Auth: `src/AuthContext.jsx`, `src/supabaseClient.js`
- Data helpers: `src/lib/supabase/` (`interns.js`, `tractionLogs.js`)

The `api/` folder is for optional local JWT development only; production uses Supabase.
