# SPIKE Portal

## Frontend (Netlify-ready)

```bash
npm install
cp .env.example .env
npm run dev
npm run build
```

In development, run the API in another terminal (`cd api && npm run dev`). The Vite dev server proxies `/api` to `http://localhost:4000`.

### Deploy on Netlify (checklist)

**Git-connected (recommended)** — each `git push` to `main` can trigger a build.

1. In Netlify: **Add new site → Import an existing project** → authorize **GitHub** → pick **`nmatunog/SPIKE`** (or your fork). Production branch: **`main`**.
2. Leave **base directory** empty (repo root). Netlify reads **`netlify.toml`**: build **`npm run build`**, publish **`dist`**, Node **22**.
3. **Site settings → Environment variables:** add **`VITE_API_URL`** = full origin of your deployed API (**no** trailing slash), e.g. `https://spike-api.onrender.com`. Vite inlines it at **build** time — after changing it, run **Deploys → Clear cache and deploy site**.
4. **Deploys** should show a green build; open the site URL. Until the API is live, the UI loads but auth/API calls will fail.
5. Optional: **Site settings → Build & deploy → Continuous deployment** — confirm **Production branch** is `main` and builds run on push.

Files involved:

- `netlify.toml` — build, Node 22, SPA redirect, basic security headers (used for **Git-connected** deploys)
- `public/_redirects` — SPA fallback copied into `dist` by Vite (`/*` → `/index.html` 200)
- `public/_headers` — same security headers copied into `dist` (used for **drag-and-drop** deploys, where `netlify.toml` is not uploaded)

### Deploy by drag-and-drop (manual)

Netlify only publishes what you upload. Use the **built** `dist` folder, not the whole repo.

1. **Set API URL before you build** (optional but required for a working login/API against a remote server): in a `.env` at the project root, set  
   `VITE_API_URL=https://your-api-host.example.com`  
   (no trailing slash). Vite bakes this into the JS at build time.
2. From the project root: `npm install` (once), then `npm run build`.
3. In Netlify: **Add new site → Deploy manually** (or your team’s “Deploys” → drag a new folder).
4. Drag the **`dist`** folder onto the drop zone (or zip the **contents** of `dist` and upload the zip).  
   Do **not** upload the repo root: `netlify.toml` is ignored for manual deploys; routing relies on **`dist/_redirects`** and **`dist/_headers`**, which Vite copies from `public/`.
5. To change the API URL later, edit `.env`, run `npm run build` again, and upload the new `dist`.

## Backend API (Role-based auth + database)

The API lives in `api/` and uses:
- `Express`
- `Prisma`
- `SQLite` (for local development)
- `JWT` auth with RBAC roles: `INTERN`, `FACULTY`, `MENTOR`, `ADMIN`

### Setup

```bash
cd api
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Default seeded admin credentials (only if you run `prisma:seed`):
- `admin@spike.local`
- `ChangeMe123!`

Change this password immediately in production.

If you **skip the seed** on an empty production database, the portal shows **first-time setup** once: create the bootstrap **ADMIN** account. After any user exists, that form is hidden and only **Sign in** + **admin-created accounts** apply.

Optional on the API: set **`SETUP_SECRET`** so the bootstrap form also requires that secret (see `api/.env.example`).

## API quick reference

- `GET /api/auth/setup` — `{ needsBootstrap, secretRequired }` (no auth). `needsBootstrap` is true when there are zero users.
- `POST /api/auth/setup` — body `{ name, email, password, setupSecret? }`. Creates the first **ADMIN** only when the user table is empty (and `setupSecret` matches `SETUP_SECRET` when that env is set).
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/register` (admin-only)
- `GET /api/interns` (faculty/mentor/admin)
- `PATCH /api/interns/:id/progress` (faculty/mentor/admin; optional `hoursAdd` to increment hours and auto-update segment)
- `POST /api/traction-logs` (intern: submit pending hours)
- `GET /api/traction-logs/my` (intern)
- `GET /api/traction-logs/pending` (faculty/mentor/admin)
- `PATCH /api/traction-logs/:id` body `{ "action": "approve" | "reject" }` (faculty/mentor/admin)

## Production notes

- Use PostgreSQL in production by switching `provider` and `DATABASE_URL` in Prisma.
- Deploy the API to a host with Node (Railway, Render, Fly, etc.) and set **`VITE_API_URL`** in Netlify to that API origin (no trailing slash). The static site will call `VITE_API_URL` + `/api/...`.
- The Express API uses `cors({ origin: true })`, so browser calls from your Netlify domain to the API origin are allowed once `VITE_API_URL` points at that API.
- **First admin:** with an **empty** user table, the portal offers one-time setup (`POST /api/auth/setup`). If you run **`prisma:seed`**, that creates `admin@spike.local` and the UI setup form stays hidden — use **Sign in** instead.
- Set secure environment variables on your API host:
  - `JWT_SECRET`
  - `DATABASE_URL`
  - `PORT`
