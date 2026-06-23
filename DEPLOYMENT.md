# Production Deployment Guide

Instructions for deploying DevTrack in staging and production environments.

---

## Deployment Targets

| Component | Recommended Host | Notes |
|-----------|-----------------|-------|
| Frontend | Vercel | Static SPA + env injection at build time |
| Backend API | Render | Express + SSE; set `ENABLE_WORKERS=false` |
| Workers | Render (separate services) | One service per `WORKER_TYPE` |
| MongoDB | MongoDB Atlas | Required |
| Redis | Upstash / Redis Cloud | Required for BullMQ and SSE pub/sub |

GitHub Actions workflows in `.github/workflows/` automate staging and production deploys on merge to `main`.


---

## Scaling Modes

### Mode 1: Unified (development / small staging)

Single process runs API and all workers.

```bash
cd backend
npm run build && npm start
# Workers in a second terminal:
npm run worker
```


Or use `docker compose up --build` from the repo root.


### Mode 2: Split production (recommended)


Separate the HTTP server from background workers so each scales independently.

| Service | Command | Environment |
|---------|---------|-------------|
| API | `node dist/index.js` | `ENABLE_WORKERS=false` |
| Sync worker | `node dist/worker-entrypoint.js` | `WORKER_TYPE=sync` |
| XP worker | `node dist/worker-entrypoint.js` | `WORKER_TYPE=xp` |
| Orchestration worker | `node dist/worker-entrypoint.js` | `WORKER_TYPE=orch` |
| Maintenance worker | `node dist/worker-entrypoint.js` | `WORKER_TYPE=maint` |
| Resume intelligence | `node dist/worker-entrypoint.js` | `WORKER_TYPE=resume-intelligence` |

Use `docker-compose.prod.yml` for a local production simulation:

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

> **Port note:** `docker-compose.prod.yml` defaults API to port **4000**. Development uses **3001**. Set `PORT` and `API_PORT` consistently across your environment.


---

## Environment Variables

### Backend (required in production)


| Variable | Required | Default (dev) | Description |
|----------|----------|---------------|-------------|
| `NODE_ENV` | Yes | `development` | `production` in prod |
| `PORT` | No | `3001` | HTTP listen port |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/devtrack` | MongoDB connection string |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Frontend origin - **must be HTTPS in production** |
| `CLERK_SECRET_KEY` | Yes | - | Clerk backend secret |
| `REDIS_URL` | Recommended | - | Full Redis URL (overrides host/port) |
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | `''` | Redis password |
| `OPENAI_API_KEY` | One of two | - | OpenAI for embeddings and intelligence |
| `GEMINI_API_KEY` | One of two | - | Google Gemini fallback |
| `GITHUB_TOKEN` | No | - | Raises GitHub API rate limits |
| `ENABLE_WORKERS` | No | - | Set `false` on API-only containers |
| `WORKER_TYPE` | No | `all` | Worker process selector |
| `SYNC_ENABLED` | No | `true` | Platform sync scheduler |
| `SYNC_INTERVAL_MINUTES` | No | `15` (prod) | Sync cron interval |
| `CLOSED_BETA` | No | `false` | Restrict access to beta users |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Global rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

Copy `.env.example` (root) as a starting template for production.

> **Auth note:** DevTrack uses **Clerk** for authentication. The root `.env.example` templates all required environment variables for both Render and Vercel deployments.


### Frontend (build-time)

| Variable | Required | Default (dev) | Description |
|----------|----------|---------------|-------------|
| `VITE_API_BASE_URL` | Yes | `http://localhost:3001/api` | Backend API base URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | - | Clerk frontend key |

Copy `frontend/.env.example` as a starting template.

> **Docker build note:** The frontend `Dockerfile` may accept a `VITE_API_URL` build arg. The application code reads `VITE_API_BASE_URL` - ensure your CI/CD injects the correct variable name.

---

## Docker Deployment

### Development full-stack

```bash
docker compose up --build
```


Services: `mongo` (7), `redis` (7-alpine), `backend`, `frontend` (Nginx).

- Frontend: ports 80/443, proxies `/api` to backend
- Backend: port 3001
- Requires `backend/.env` with Clerk and AI keys

### Production split topology

`docker-compose.prod.yml` defines:

- `api` - Express only, `ENABLE_WORKERS=false`
- `worker-sync` (2 replicas), `worker-xp`, `worker-orch`, `worker-maint`
- `mongo`, `redis` with health checks

Requires `.env.production` at the repo root.

### Shell deploy script

```bash
./deploy.sh
```


Builds images, starts containers, and checks backend health.

---

## Frontend (Vercel)

1. Import the GitHub repo at https://vercel.com/new
2. Set root directory to `frontend/`
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Inject environment variables:
   - `VITE_API_BASE_URL=https://your-api.render.com/api`
   - `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...`

Rollback: Vercel Dashboard - Deployments - select last working build - Promote to Production.

---

## Backend (Render)

### 1. Create project and services

1. Create a new Web Service at https://dashboard.render.com
2. Connect your GitHub repository
3. Create a separate service for each worker type

### 2. Backend API Service

1. Name: `devtrack-api`
2. Root directory: `backend/`
3. Build command: `npm run build`
4. Start command: `node dist/index.js`
5. Environment: `Node`
6. Set `ENABLE_WORKERS=false`

### 3. Worker Services

Create one Render service per worker type:


| Service Name | `WORKER_TYPE` | Start Command |
|---------------|---------------|---------------|
| `devtrack-sync` | `sync` | `node dist/worker-entrypoint.js` |
| `devtrack-xp` | `xp` | `node dist/worker-entrypoint.js` |
| `devtrack-orch` | `orch` | `node dist/worker-entrypoint.js` |
| `devtrack-maint` | `maint` | `node dist/worker-entrypoint.js` |

### 4. Required Environment Variables (Render Dashboard)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `MONGODB_URI` | From MongoDB Atlas |
| `REDIS_URL` | From Upstash/Redis Cloud |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `CLERK_SECRET_KEY` | From Clerk dashboard |
| `OPENAI_API_KEY` or `GEMINI_API_KEY` | At least one |
| `ENABLE_WORKERS` | `false` (API only) |

### 5. Deployment Hook (GitHub Actions)

The `.github/workflows/deploy-production.yml` workflow triggers a redeploy of `devtrack-backend` on Render on every push to `main`.

Only **one** GitHub secret is required:

| Secret | Source |
|--------|--------|
| `RENDER_BACKEND_DEPLOY_HOOK` | Render Dashboard → `devtrack-backend` → Settings → Deploy Hook → Copy URL |

Health check: `GET /health`

---

## CI/CD

Workflows in `.github/workflows/`:

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `pr-checks.yml` | PR to `main`/`develop` | Typecheck, lint, unit + integration tests, Docker build |
| `deploy-production.yml` | Push to `main` | Pings Render deploy hook → redeploys `devtrack-backend` |
| `deploy-staging.yml` | Manual (`workflow_dispatch`) | Same as production, triggered on demand |
| `deploy-render.yml` | Disabled (legacy) | Superseded by `deploy-production.yml` |

> **Vercel (Frontend):** Vercel redeploys automatically via its native GitHub integration — no token or workflow step is needed. Verify at [vercel.com](https://vercel.com) → your project → **Settings → Git** → confirm your GitHub repo is connected and the production branch is set to `main`.

---

## Pre-deploy Checklist

- [ ] `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` configured |
- [ ] `MONGODB_URI` points to production cluster |
- [ ] `REDIS_URL` configured (BullMQ will not start without Redis) |
- [ ] `CORS_ORIGIN` is HTTPS and matches the frontend URL |
- [ ] At least one AI key (`OPENAI_API_KEY` or `GEMINI_API_KEY`) set |
- [ ] `ENABLE_WORKERS=false` on API containers |
- [ ] Worker services running with correct `WORKER_TYPE` |
- [ ] `VITE_API_BASE_URL` matches the deployed API URL (Render) |

---

## Monitoring

| Endpoint | Access | Purpose |
|----------|---------|---------|
| `GET /health` | Public | Liveness probe |
| `GET /health/detailed` | Admin | Dependency status |
| `GET /metrics` | Admin | Prometheus metrics |
| `GET /api/v1/ops/health` | Public | Ops module health |
| `GET /api/v1/ops/queues` | Ops auditor | Queue depths |
| `GET /api/v1/ops/metrics` | Ops auditor | Runtime metrics |

---

## Post-Deploy Verification

### Manual checklist

| Test | Expected |
|------|----------|
| Landing page loads | No console errors |
| Clerk sign-in | Redirect to dashboard |
| Dashboard | Stats, streak, missions render |
| DSA page | Platform stats and heatmap |
| Platform sync | Manual sync returns per-platform status |
| SSE events | Real-time updates after sync |
| Logout | Redirect to landing |

### Health endpoints

```bash
curl https://your-api.render.com/health
curl https://your-api.render.com/health/detailed  # requires admin auth
```


### Common issues


| Issue | Fix |
|-------|-----|
| CORS errors | Set `CORS_ORIGIN` to exact Vercel URL (HTTPS) |
| 401 on API calls | Verify `CLERK_SECRET_KEY` and frontend Clerk key match the same Clerk app |
| MongoDB connection failed | Check `MONGODB_URI` in Render variables |
| Blank frontend page | Verify `VITE_API_BASE_URL` in Vercel build env |
| Workers not processing | Confirm `REDIS_URL` is set and worker services are running |
| AI features unavailable | Set `OPENAI_API_KEY` or `GEMINI_API_KEY` |

---

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Worker topology and queue names
- [README.md](./README.md) - Local development setup
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Known production gaps
