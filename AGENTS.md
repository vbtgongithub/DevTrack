# DevTrack Project Context

Context for AI assistants working in this repository.

## Project Overview

DevTrack is a developer productivity and career readiness platform. It unifies DSA progress (LeetCode, Codeforces, CodeChef, GitHub), project tracking, resume intelligence, readiness scoring, gamification, and real-time activity history.

## Tech Stack

- **Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS 4, Framer Motion, Zustand, React Query, Axios, Clerk
- **Backend:** Node.js, Express 5, TypeScript (tsx), MongoDB (Mongoose), Redis, BullMQ, Zod, Clerk Express
- **AI:** OpenAI, Google Gemini
- **Infrastructure:** Docker Compose, GitHub Actions, Railway + Vercel

## Architecture

- **Frontend:** Modular React app with `pages/`, `components/`, `features/`, and `services/` for API calls
- **Backend:** Express server with 23 domain modules under `backend/src/modules/`
- **Workers:** BullMQ workers in `backend/src/worker-entrypoint.ts` and `backend/src/workers/`
- **Routing:** Protected routes via Clerk auth + `AuthSyncGate` + `AppShell`
- **API base:** `/api/v1` (legacy `/api` alias with deprecation header)
- **Real-time:** SSE singleton via Redis pub/sub

## Key Integrations

| Platform | Status |
|----------|--------|
| Codeforces | Stable — full history |
| GitHub | Stable — REST/GraphQL API |
| LeetCode | Partial — public API limitations |
| CodeChef | Stats only |

## Auth

Uses **Clerk** — not custom JWT.

- Backend: `CLERK_SECRET_KEY` + `@clerk/express`
- Frontend: `VITE_CLERK_PUBLISHABLE_KEY` + `@clerk/clerk-react`
- User records synced to MongoDB via `ClerkUserSyncService`

## Environment Variables

**Backend (`backend/.env`):**
- Required: `MONGODB_URI`, `CLERK_SECRET_KEY`
- Production: `REDIS_URL` or `REDIS_HOST`, `CORS_ORIGIN` (HTTPS), one of `OPENAI_API_KEY` / `GEMINI_API_KEY`
- Optional: `GITHUB_TOKEN`, `SYNC_ENABLED`, `CLOSED_BETA`

**Frontend (`frontend/.env`):**
- Required: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`

## Run Commands

```bash
# Infrastructure only
npm run dev:infra

# API + frontend (no workers)
npm run dev

# Full stack with workers
npm run dev:all

# Windows helper
.\start-dev.ps1

# Docker full stack
docker compose up --build

# Tests
npm run test                          # backend unit
cd backend && npm run test:integration
cd frontend && npm run test:unit
cd frontend && npm run test:e2e
```

## Module Conventions

Backend modules follow:

```
backend/src/modules/<name>/
├── index.ts
├── <name>.routes.ts
├── <name>.controller.ts
├── <name>.service.ts
└── <name>.validation.ts  (Zod schemas)
```

Frontend features live in `frontend/src/features/<name>/`.

## Code Principles

1. Minimize scope — smallest correct diff
2. Match existing conventions (naming, types, imports)
3. Use the Winston logger in backend — no `console.log`
4. Validate all inputs with Zod
5. Propagate errors to the Express error boundary

## Documentation

| File | Contents |
|------|----------|
| [README.md](./README.md) | Overview and quick start |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System topology |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production setup |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | PR conventions |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Current gaps |

## Known Gotchas

- Root `.env.example` has stale JWT vars — use `backend/.env.example`
- Frontend Dockerfile build arg may say `VITE_API_URL`; code uses `VITE_API_BASE_URL`
- `docker-compose.prod.yml` API port defaults to 4000; dev uses 3001
- AI features degrade without API keys but server still starts in dev
