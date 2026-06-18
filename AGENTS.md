# FinMark AI — Agent Guide

## Project Overview

Enterprise multi-agent financial marketing platform. Monorepo: Vite+React frontend + 3 Express microservices behind Kong gateway. Gemini-powered AI agents orchestrate marketing campaigns.

## Quick Start

```sh
npm install        # frontend (root)
cp .env.example .env.local   # set GEMINI_API_KEY
npm run dev        # frontend on :3000, proxies /api → :3001
```

Backend (separate terminal):
```sh
cd finmark-backend
pnpm install
# requires: PostgreSQL on :5432, Redis on :6379
pnpm dev           # starts all 3 services in parallel
```

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Vite dev server, port 3000, host 0.0.0.0 |
| `npm run build` | `vite build` → `dist/` |
| `npm run preview` | `vite preview` |
| `npm run lint` | **`tsc --noEmit`** — NOT ESLint; this is the only static check |
| `npm run test` | `vitest` (jsdom env) |
| `npm test -- --run` | Run tests once (single run) |
| `npm run test:coverage` | Vitest with v8 coverage (thresholds: 60% lines, 60% functions, 50% branches) |
| `npm run clean` | `rm -rf dist` |

## Architecture

### Frontend (`src/`)

```
src/
  main.tsx              → entry: QueryClientProvider + RouterProvider + ErrorBoundary
  app/routes.tsx        → React Router (browser router, auth guards)
  app/{copilot,factory,factory-detail,brain,expert,agents,performance,settings,login,404}/
  components/{ui,common,layout,auth,agents,brain,copilot,expert,settings}/
  services/             → axios-based API clients (14 modules: api.ts base + per-domain)
  stores/               → Zustand stores (app, auth, copilot, performance, scenario, strategy)
  lib/utils.ts          → cn() helper (clsx + tailwind-merge)
  i18n.ts               → Manual zh/en translations (NOT i18next)
  hooks/useMockMode.ts
  types.ts              → Shared domain types
```

- **Auth**: JWT token in localStorage (`auth-token` key), axios interceptor for Bearer header + 401 redirect
- **API base**: VITE_API_BASE_URL env var, defaults to `/api` (which Vite proxies to :3001)
- **Mock mode**: Set `VITE_USE_MOCK=true` in `.env.local`; `geminiService.ts` returns canned responses when no `GEMINI_API_KEY` is set
- **Routing**: AuthGuard wraps all protected routes, GuestGuard wraps /login
- **Dark mode**: Toggled via `.dark` class on `<html>`

### Backend Microservices (`finmark-backend/`)

```
finmark-backend/
  services/
    data-service/   → Express + Prisma (PostgreSQL) + BullMQ (Redis) :3001
      src/routes/   → auth, scenarios, atoms, users, performance, settings, strategy,
                      agentProxy, alarms, reports, expert, crm (13 route modules)
      prisma/       → schema.prisma (10 models), migrations, seed.ts
    llm-gateway/    → Express + @google/genai (Gemini API proxy) :3002
      POST /v1/completions (non-streaming)
      POST /v1/stream (SSE streaming)
    agent-service/  → Express + 7 Gemini-powered agents :3003
      POST /agents/{insight,segment,content,compliance,strategy,analyst,master}
      POST /agents/master/stream (SSE streaming)
  kong/             → kong.yml (declarative Kong gateway config)
  docker-compose.yml    → postgres + redis + kong + all 3 services
  docker-compose.prod.yml → stripped-down prod compose (same services, no Kong)
```

**Service dependency chain**: agent-service → llm-gateway → Gemini API

## Key Framework Versions

- React 19, Vite 6, TypeScript 5.8
- Tailwind CSS v4 (`@tailwindcss/vite` plugin, no tailwind.config — CSS-based config in `index.css`)
- shadcn/ui style: `base-nova`, icon library: lucide
- TanStack React Query v5, Zustand v5, Recharts v3
- @xyflow/react (React Flow) for workflow graph
- react-router-dom v7, react-hook-form v7 + zod v4
- motion v12 (Framer Motion successor)
- Vitest v4 with jsdom29 + @testing-library/react v16

## Design System

Defined in `.impeccable.md` (also mirrored in `.opencode-context.json`):

- **Font**: Geist Variable (`@fontsource-variable/geist`)
- **Radius**: 0.625rem base (scaled via CSS: --radius-sm through --radius-4xl)
- **Colors**: OKLCH throughout, indigo/neutral palette, emerald/amber/red for status
- **Theme**: Light-first with full dark mode support via `.dark` class
- **CSS**: Tailwind v4 `@import "tailwindcss"` + CSS custom properties in `index.css`
- **shadcn aliases**: `@/components/ui`, `@/lib/utils`, `@/hooks`

## Testing

- `vitest` with jsdom, setup: `src/test/setup.ts` (imports `@testing-library/jest-dom`)
- Coverage threshold: 60% lines, 60% functions, 50% branches
- No E2E or integration test runner configured for frontend
- Backend agent integration test: `pnpm test:agent` (runs `tsx test/integration.test.ts` in agent-service)

## Backend-Specific

- **Prisma**: `pnpm db:push` to sync schema, `pnpm db:generate` for client, `pnpm db:studio` for GUI
- Data migration: Prisma migrations in `data-service/prisma/migrations/`
- **Dev mode**: all 3 services use `tsx watch` for hot reload
- **Alarm queue**: BullMQ with Redis, auto-evaluates every 5 minutes
- **CORS**: data-service allows all origins in dev; `CORS_ORIGIN` env var for production
- Env example files: check `.env.example` in each service directory

### LLM Gateway — Multi-Provider Support

The `llm-gateway` supports multiple LLM providers through a provider abstraction:

- **Gemini** (default, `LLM_PROVIDER=gemini`): Uses `@google/genai` SDK
- **OpenAI-compatible** (`LLM_PROVIDER=openai`): Works with DeepSeek, OpenAI, and any OpenAI-compatible API. Uses native `fetch` streaming.

**Config** (set in `llm-gateway/.env` or shell environment):
```env
LLM_PROVIDER=gemini           # gemini | openai
# Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
# OpenAI-compatible (used when LLM_PROVIDER=openai)
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
```

The provider is chosen at startup and fixed for the lifetime of the process. All `/v1/completions` and `/v1/stream` endpoints work identically regardless of provider.

## Known Gotchas

1. **`npm run lint` = `tsc --noEmit`** — NOT ESLint. No ESLint/Prettier config found. Fix TS errors directly.
2. **Vite proxy** in dev: `/api` → `http://localhost:3001`. The frontend expects the data-service at :3001.
3. The frontend `.env.local` is NOT in .gitignore (only `.env*` is, except `.env.example`). Be careful about committing secrets.
4. Backend uses `pnpm`, frontend uses `npm`. Two package managers.
5. **i18n is manual** — a single `i18n.ts` with `translations.zh` and `translations.en`. No i18next or react-i18next.
6. **Mock mode**: When `GEMINI_API_KEY` is not set, `geminiService.ts` falls back to static Chinese mock strings. For English output, set the key.
7. Gemini model: `gemini-3-flash-preview` (frontend) / `gemini-2.5-flash` (llm-gateway docker default). These may differ — check before assuming.
8. The `tsconfig.json` has `"paths": {"@/*": ["./src/*", "./*"]}` — the fallback `"./*"` allows importing from root. This is non-standard.
9. `index.html` still shows the default title "My Google AI Studio App" — it hasn't been updated.
10. Production build: `Dockerfile` at root, `docker-compose.prod.yml` at root. Deploy via `scripts/deploy-prod.sh`.
