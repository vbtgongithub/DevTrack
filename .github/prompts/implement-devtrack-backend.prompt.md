---
name: implement-devtrack-backend
description: "Extend or fix DevTrack backend modules while preserving frontend API contracts and architectural conventions."
argument-hint: "Scope override (optional): full | foundation | dashboard+dsa | profile+settings | projects+activity | readiness | resume"
agent: agent
---

Implement or extend the DevTrack backend. The backend is already built — use this prompt when adding new endpoints, fixing modules, or aligning responses with frontend contracts.

If an argument is provided, treat it as a scope override. Otherwise implement only what is requested.

## Read First

- [CLAUDE.md](../../CLAUDE.md) — Project context
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — Module topology
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Backend conventions
- [Frontend API types](../../frontend/src/types/api.types.ts)
- [Route composition](../../backend/src/routes/index.ts)
- [Backend entrypoint](../../backend/src/index.ts)

## Current Architecture

- **Stack:** Express 5, TypeScript, Mongoose, BullMQ, Redis, Clerk auth
- **API base:** `/api/v1` (legacy `/api` alias exists)
- **Auth:** Clerk via `@clerk/express` — NOT custom JWT. Endpoints: `GET /auth/me`, `POST /auth/sse-handshake`
- **Modules:** 23 domain modules under `backend/src/modules/`
- **Workers:** BullMQ in `backend/src/worker-entrypoint.ts`

## Module Pattern

```
backend/src/modules/<name>/
├── index.ts
├── <name>.routes.ts
├── <name>.controller.ts
├── <name>.service.ts
└── <name>.validation.ts  (Zod)
```

Register new routes in `backend/src/routes/index.ts`.

## Constraints

- Preserve frontend `ApiResponse` envelope shapes from `api.types.ts`
- Route → controller → service layering (no business logic in routes)
- Validate all inputs with Zod
- Use Winston logger — no `console.log`
- Propagate errors via `asyncHandler` and HTTP exceptions
- Platform sync is sequential per platform with per-platform error capture
- Add MongoDB indexes for query paths used by filters/sorting/pagination
- No hardcoded secrets — use env vars from `config/env.ts`

## Active API Modules

| Module | Mount | Key endpoints |
|--------|-------|---------------|
| dashboard | `/dashboard` | `/`, `/stats`, `/streak`, `/platforms`, `/missions`, `/recent-activity` |
| dsa | `/dsa` | `/problems`, `/stats`, `/heatmap`, `/submissions`, `/contests`, `/topics` |
| activity | `/activity` | `/heatmap`, `/feed`, `/date/:date`, focus session endpoints |
| projects | `/projects` | CRUD + `/tasks`, `/sync` |
| profile | `/profile` | `/`, `/platforms`, `/platforms/stats`, `/public/:username` |
| settings | `/settings` | `GET /`, `PUT /` |
| platform-sync | `/platforms` | `/sync-all`, `/sync/:platformName`, `/sync-status` |
| readiness | `/readiness` | `/snapshot`, `/intent`, `/skill-progress`, DSA sub-routes |
| resume | `/resume` | `/upload`, `/session/:id` |
| resume-intelligence | `/resume-intelligence` | ATS, variants, credibility, export |
| xp / streak / missions | `/xp`, `/streak`, `/missions` | Gamification |
| ops | `/ops` | Admin console, queues, DLQ |

## Platform Sync

- Adapters: LeetCode (partial), Codeforces (full), CodeChef (stats), GitHub (full)
- Queue: `platform-sync` via BullMQ
- Idempotent ingestion: `platform + externalId` compound key
- Cache TTLs in `config/constants.ts`

## Verification Checklist

- [ ] `cd backend && npm run build` passes
- [ ] `cd backend && npm run test:unit` passes
- [ ] New routes registered in `routes/index.ts`
- [ ] Zod validation on all new endpoints
- [ ] Frontend service contracts still match response shapes
- [ ] Indexes added for new query paths

## Required Output

1. Summary of changes and rationale
2. Files created or modified
3. New endpoints (method + path + auth requirement)
4. Schema/index changes if any
5. Gaps, TODOs, or assumptions

Do not stop at planning. Implement code in this repository.
