# Supabase migration (Phase 2)

This folder contains the first Supabase baseline for replacing the current Express/Prisma API over time.

## 1) Create project

1. Create a new Supabase project.
2. Keep Auth enabled (email/password is fine to start).

## 2) Apply schema

1. Open **SQL Editor** in Supabase.
2. Paste and run `supabase/schema.sql`.

This creates:

- `profiles` (role + user identity metadata linked to `auth.users`)
- `intern_progress`
- `traction_logs`
- RLS policies aligned with SPIKE roles (`INTERN`, `FACULTY`, `MENTOR`, `ADMIN`)

## 3) Create first admin

After your first sign-up in Supabase Auth:

1. Find that user UUID in `auth.users`.
2. Run the commented SQL at the bottom of `schema.sql` to promote that profile to `ADMIN`.

## 4) Frontend env vars (Cloudflare/Netlify)

Add these to your frontend host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Keep `VITE_STATIC_ONLY=true` until Supabase-powered auth/data calls are wired in the frontend.

## 5) Migration strategy (recommended)

1. Wire auth to Supabase first.
2. Replace `/api/interns` and `/api/interns/:id/progress` screens with Supabase queries.
3. Replace traction log endpoints.
4. Remove backend dependency once all flows are migrated.
