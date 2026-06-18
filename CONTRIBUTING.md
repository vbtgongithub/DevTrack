# Contributing to DevTrack

Thank you for contributing. Follow these conventions to keep the codebase consistent and maintainable.

---

## Repository Layout

| Directory | Stack | Role |
|-----------|-------|------|
| `backend/` | Express 5, Mongoose, BullMQ, Clerk | API server and workers |
| `frontend/` | React 19, Vite, Zustand, Tailwind 4 | SPA client |
| `dev-orchestrator/` | TypeScript | Local multi-process dev boot |

---

## Getting Started

```bash
npm run install-all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in CLERK_SECRET_KEY and VITE_CLERK_PUBLISHABLE_KEY
npm run dev:infra
npm run dev:all
```

On Windows, `.\start-dev.ps1` automates the same flow.

---

## Backend Conventions

### Module structure

Every feature lives under `backend/src/modules/<module-name>/`:

```
backend/src/modules/<module-name>/
├── index.ts                  # Public exports
├── <module-name>.routes.ts   # Express route definitions
├── <module-name>.controller.ts
├── <module-name>.service.ts
└── <module-name>.validation.ts  # Zod schemas
```

Register new routes in `backend/src/routes/index.ts`.

### Practices

- **Logging:** Use `import { logger } from '../../shared/logger'` — never `console.log`.
- **Errors:** Propagate to the Express error boundary via `asyncHandler` and HTTP exceptions (`BadRequestException`, `UnauthorizedException`, etc.).
- **Validation:** Validate request body, query, and params with Zod before processing.
- **Database:** Prefer `.lean()` on read paths; use atomic updates (`$inc`, `$set`) for counters.
- **Auth:** Routes requiring authentication use `authMiddleware` from `middleware/auth.ts` (Clerk-based).

### API paths

Mount routes under `/api/v1`. The versioned base path is defined in `config/constants.ts`.

---

## Frontend Conventions

### Directory layout

| Path | Purpose |
|------|---------|
| `src/components/ui/` | Generic stateless UI primitives |
| `src/components/layout/` | AppShell, page shells, navigation |
| `src/features/<name>/` | Domain-connected feature modules |
| `src/pages/` | Route-level page components |
| `src/services/` | Axios API client wrappers |
| `src/store/` | Zustand stores |
| `src/hooks/` | Shared React hooks |

### Styling

- Use **Tailwind CSS v4** utility classes and design tokens (`dt-*` variables).
- Motion animations go through `src/design-system/motion/` — no inline transition values.
- Include accessibility attributes (`aria-label`, `role`, keyboard handlers) on interactive elements.

### State

- **Server data:** TanStack Query (cache, refetch, mutations).
- **Client UI state:** Zustand with selective persistence.
- **Real-time:** SSE via `useSse` hook — do not open per-component EventSource connections.

---

## Testing Requirements

### Backend

```bash
cd backend
npm run test:unit          # Unit tests (excludes integration)
npm run test:integration   # Requires Mongo + Redis
npm test                   # All tests
```

- Write tests in `backend/src/__tests__/` or co-located `*.test.ts` files.
- Integration tests use `vitest.integration.config.ts`.
- Clean up connections in `afterEach` / `afterAll`.

### Frontend

```bash
cd frontend
npm run test:unit          # Vitest
npm run test:e2e           # Playwright (requires running stack)
```

E2E tests verify operational intelligence (real ATS scores, embeddings, persistence) — not UI snapshots. See [frontend/e2e/README.md](./frontend/e2e/README.md).

---

## Branch & PR Workflow

### Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<description>` | `feat/dsa-heatmap-filter` |
| Bug fix | `fix/<description>` | `fix/sse-reconnect` |
| Docs | `docs/<description>` | `docs/deployment-guide` |
| Hardening | `harden/<description>` | `harden/rate-limit-sync` |

### PR checklist

1. Both packages build without TypeScript errors:
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```
2. Tests pass:
   ```bash
   cd backend && npm run test:unit
   cd frontend && npm run test:unit
   ```
3. No debug artifacts (`console.log`, stray `TODO`, commented-out code blocks).
4. New API routes are registered in `routes/index.ts` and documented if public-facing.
5. Environment variable changes update `backend/.env.example` and/or `frontend/.env.example`.

### Commit messages

Follow conventional commits:

```
feat(readiness): add roadmap gap analyzer
fix(auth): correct Clerk token validation on SSE
chore(repo): update deployment docs
test(ops): add DLQ resilience cases
```

---

## Code Review Focus

- Does the change match existing module patterns?
- Are Zod schemas applied to all external inputs?
- Are database queries using indexes and `.lean()` where appropriate?
- Does the frontend use existing service modules instead of raw `fetch`?
- Are animations using the motion system tokens?

---

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Known gaps
- [CLAUDE.md](./CLAUDE.md) — AI assistant context
