# SPIKE_LIFE

Major initiative under the **SPIKE ASC Platform** (`/SPIKE`).

SPIKE_LIFE is a standalone application within the SPIKE monorepo. It shares the SPIKE brand system and can integrate with the main portal (auth, Supabase, Venture Blueprint) as the product scope is defined.

## Stack

- **Frontend:** Vite + React + Tailwind CSS
- **Data (planned):** Supabase — same project as SPIKE Portal or a dedicated schema
- **Deploy (planned):** Cloudflare Pages subdomain under `1cma.online`

## Local development

```bash
cd SPIKE_LIFE
npm install
cp .env.example .env
npm run dev
```

Dev server defaults to **http://localhost:5174** (SPIKE Portal uses 5173).

## Project docs

| Document | Purpose |
|----------|---------|
| [`PRD_SPIKE_LIFE_V1.md`](./PRD_SPIKE_LIFE_V1.md) | Product requirements (draft) |
| [`../README.md`](../README.md) | SPIKE Portal root |
| [`../SPIKE_MASTER_ROADMAP.md`](../SPIKE_MASTER_ROADMAP.md) | Platform roadmap |

## Status

**Bootstrap** — project scaffold created. Define scope in the PRD before building features.
