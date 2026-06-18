# FinMark AI — 多智能体营销平台

Enterprise multi-agent financial marketing platform. 企业级多智能体金融营销平台。

## Architecture

```
┌──────────────┐    ┌─────────────┐    ┌───────────────┐
│   Frontend   │───▶│    Kong     │───▶│  Data Service │───▶ PostgreSQL
│  Vite+React  │    │   Gateway   │    │   Express     │───▶ Redis/BullMQ
│   :3000      │    │   :8000     │    │   :3001       │
└──────────────┘    └──────┬──────┘    └───────────────┘
                           │                   
                    ┌──────┴──────┐    ┌───────────────┐
                    │ Agent Svc  │───▶│  LLM Gateway  │───▶ Gemini/OpenAI
                    │  Express   │    │   Express     │
                    │   :3003    │    │   :3002       │
                    └────────────┘    └───────────────┘
```

## Quick Start

### Frontend

```sh
npm install
cp .env.example .env.local   # set GEMINI_API_KEY
npm run dev                   # :3000, proxies /api → :3001
```

### Backend (separate terminal)

```sh
cd finmark-backend
pnpm install
# requires: PostgreSQL on :5432, Redis on :6379
pnpm dev                      # starts all 3 services in parallel
```

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Vite dev server, port 3000 |
| `npm run build` | `vite build` → `dist/` |
| `npm run preview` | Vite preview |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm test -- --run` | Tests once |
| `npm run test:coverage` | Vitest with coverage (thresholds: 60% lines, 50% branches) |

## Tech Stack

- **Frontend**: React 19, Vite 6, TypeScript 5.8, Tailwind CSS v4, shadcn/ui, Zustand v5, TanStack Query v5
- **Backend**: Express, Prisma, BullMQ, Zod
- **AI**: Gemini API (multi-provider: Gemini + OpenAI-compatible)
- **Gateway**: Kong API Gateway
