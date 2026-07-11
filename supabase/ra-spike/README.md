# RA-SPIKE database (separate from SPIKE Internship)

RA-SPIKE rookies use Supabase project **`yruwfdjqigxxwbqsqhho`**.

SPIKE Internship uses **`lzbfjbtjropoaynbcxew`**.

These databases are **not linked**. Do not point RA-SPIKE builds, auth, or migrations at the internship project (or vice versa).

## Migrations

```bash
npm run db:migrate:ra-spike
```

This script always links the CLI to `yruwfdjqigxxwbqsqhho` before applying `supabase/ra-spike/migrations/`.

## Internship migrations

```bash
npm run db:migrate
```

Applies only to `lzbfjbtjropoaynbcxew` via `supabase/migrations/`.
