# Production Deployment Guide (DEPLOYMENT.md)

This document provides setup, configuration, and scaling instructions for deploying DevTrack in production environments.

---

## 🏗️ Architectural Scaling Modes

DevTrack can be run as a monolithic single-process system or separated into specialized, independently scalable micro-containers. This is configured using the `WORKER_TYPE` environment variable in `backend/src/worker-entrypoint.ts`.

### 1. Unified Deployment (Standard Docker Compose)
Recommended for staging, demo environments, or small deployments. Runs the API server and all background workers within the same runtime.
- **Run command**: `npm start`
- **Environment**: `WORKER_TYPE=all` (default)

### 2. Multi-Process Production Scaling (Kubernetes / ECS / Railway)
For high-scale environments, scale the web container (HTTP requests) and background crawler workers independently.

- **Frontend Container** (Vercel / Nginx):
  - Builds the production React code using Vite.
  - Serves static assets, proxies `/api/*` to the Backend API.

- **API Web Container** (Scale horizontally, e.g. 3 replicas):
  - Handles incoming HTTP traffic, routes, and SSE streaming.
  - Does NOT run any BullMQ job processing loops.
  - **Run command**: `npm start`
  - **Environment**: `WORKER_TYPE=none` (or omit worker script bootup)

- **Isolated Background Sync Worker** (Scale independently based on task queue depth):
  - Dedicated to crawling platform telemetry APIs (LeetCode, Codeforces, CodeChef, GitHub).
  - **Run command**: `WORKER_TYPE=sync npm run worker`

- **Isolated Gamification Worker**:
  - Computes XP progression algorithms, levels, achievements, and streaks.
  - **Run command**: `WORKER_TYPE=xp npm run worker`

---

## 🔑 Environment Variables Matrix

Create a `.env` file at the root or inject these variables into your container environments.

| Variable | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | Yes | Set to `production` or `development` |
| `PORT` | Number | Yes | Port the API server binds to (default: `3001`) |
| `CORS_ORIGIN` | String | Yes | HTTPS origin of the frontend (e.g. `https://devtrack.vercel.app`) |
| `MONGODB_URI` | String | Yes | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | String | Yes | Cryptographic secret for signing short-lived access tokens |
| `JWT_REFRESH_SECRET`| String | Yes | Cryptographic secret for signing long-lived refresh tokens |
| `REDIS_URL` | String | Yes | Redis connection string (e.g. `redis://default:xxx@endpoint:6379`) |
| `GITHUB_TOKEN` | String | No | Personal Access Token (PAT) to prevent GitHub API rate-limiting |

---

## 🐳 Docker Production Deployment

To launch the full stack locally in a production-simulated container environment:

1. Build and run containers in detached mode:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
2. Verify container health status:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
3. View runtime logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```
