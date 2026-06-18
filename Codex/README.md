# DevTrack AI Reference (Codex)

Reference package for AI agents working in this repository.

## Reading Order

1. [../CLAUDE.md](../CLAUDE.md) — Project context and conventions
2. [../README.md](../README.md) — Overview and quick start
3. [../ARCHITECTURE.md](../ARCHITECTURE.md) — System topology
4. [../CONTRIBUTING.md](../CONTRIBUTING.md) — Code patterns
5. [../PROJECT_STATUS.md](../PROJECT_STATUS.md) — Current gaps

## Repository Layout

```
DevTrack/
├── backend/src/          # Express API + workers
│   ├── modules/          # 23 domain modules
│   ├── db/models/        # Mongoose schemas
│   ├── routes/           # Route composition
│   └── shared/           # Redis, BullMQ, SSE, logger
├── frontend/src/         # React SPA
│   ├── features/         # Domain feature modules
│   ├── services/         # API clients
│   └── store/            # Zustand stores
├── dev-orchestrator/     # Local dev boot
└── Codex/                # This package
```

## Key Conventions

- **Auth:** Clerk (not JWT). `CLERK_SECRET_KEY` + `VITE_CLERK_PUBLISHABLE_KEY`
- **API:** `/api/v1` base path
- **Backend modules:** routes → controller → service → validation (Zod)
- **Frontend features:** `src/features/<name>/` with co-located components and hooks
- **Logging:** Winston logger in backend; no `console.log`
- **Testing:** Vitest (unit + integration), Playwright (E2E)

## Run Commands

```bash
npm run dev:infra    # Mongo + Redis
npm run dev          # API + frontend
npm run dev:all      # Full stack with workers
npm run test         # Backend tests
```

## Tests

| Location | Framework | Scope |
|----------|-----------|-------|
| `backend/src/__tests__/` | Vitest | Unit + integration |
| `backend/tests/chaos/` | Vitest | Resilience scenarios |
| `frontend/e2e/` | Playwright | Operational intelligence flows |
| `Codex/` | Vitest | Reference tests only |

## This Package

`Codex/` contains a small auxiliary package with reference tests. It is not part of the main application build or CI test suite.
