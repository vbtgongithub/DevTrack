# DevTrack Development Orchestrator

Unified local development runtime for the DevTrack platform.

## Overview

The orchestrator boots the full DevTrack stack in the correct order:

1. Environment validation
2. Infrastructure (MongoDB, Redis via Docker)
3. Backend API
4. BullMQ workers
5. Frontend dev server
6. Health monitoring

Press `Ctrl+C` for graceful shutdown (workers → API → frontend; infrastructure stays running).

## Installation

```bash
npm run install:orchestrator
```

Or install everything from the repo root:

```bash
npm run install-all
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Full orchestrated startup |
| `npm run health:check` | Validate env, Redis, MongoDB, ports |
| `npm run clean:runtime` | Kill stale processes, clear ports |
| `npm run dev:infra` | Docker mongo + redis only |
| `npm run dev:backend` | Backend API only |
| `npm run dev:frontend` | Frontend only |
| `npm run dev:workers` | BullMQ workers only |

## Windows Alternative

`start-dev.ps1` at the repo root provides the same functionality with PowerShell:

```powershell
.\start-dev.ps1              # Full startup
.\start-dev.ps1 -SkipDocker  # Skip container boot
.\start-dev.ps1 -StopAll     # Kill all processes + docker compose down
.\start-dev.ps1 -ShowStatus  # Port and connectivity status
```

## Startup Sequence

```
Environment Validation
  ↓
Redis Verification
  ↓
MongoDB Verification
  ↓
Backend API Startup
  ↓
Worker Runtime Startup
  ↓
Frontend Startup
  ↓
Unified Runtime Ready
```

## Service Priority

| Priority | Service | Port |
|----------|---------|------|
| 1 | Infrastructure (mongo, redis) | 27017, 6379 |
| 2 | Backend API | 3001 |
| 3 | BullMQ workers | — |
| 4 | Frontend (Vite) | 5173 |

## Components

| Class | Role |
|-------|------|
| `EnvironmentReadinessValidator` | Pre-flight env checks |
| `DevelopmentHealthMonitor` | Service health tracking |
| `UnifiedRuntimeConsole` | Colored centralized logging |
| `DevelopmentRuntimeOrchestrator` | Main boot engine |
| `RuntimeCleaner` | Process and port cleanup |

Source: `dev-orchestrator/src/`

## Environment Variables

Uses the same variables as the backend. Defaults work for local development:

| Variable | Default |
|----------|---------|
| `MONGODB_URI` | `mongodb://localhost:27017/devtrack` |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |

Optional for full intelligence features:

- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`

## Troubleshooting

**Port already in use:**

```bash
npm run clean:runtime
```

**Redis or MongoDB connection failed:**

```bash
npm run dev:infra
```

**Workers not processing jobs:**

Ensure Redis is running and start workers separately:

```bash
npm run dev:workers
```

## Configuration

Edit `dev-orchestrator/src/index.ts` to adjust startup order, health check intervals, and shutdown timeouts.

## Related Docs

- [README.md](../README.md) — Full quick start guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Worker and queue topology
