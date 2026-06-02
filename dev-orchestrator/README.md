# DevTrack Development Orchestrator

Unified development runtime orchestration system for the DevTrack platform.

## Overview

The Development Orchestrator provides a single command to boot the entire DevTrack intelligence platform locally, including:

- Infrastructure services (MongoDB, Redis)
- Backend API
- BullMQ workers
- Frontend application
- Health monitoring
- Graceful shutdown

## Installation

```bash
npm run install:orchestrator
```

## Available Commands

### `npm run dev:all`

Starts the entire DevTrack platform in the correct order:

1. Environment validation
2. Infrastructure startup (MongoDB, Redis)
3. Backend API startup
4. Worker startup
5. Frontend startup
6. Health monitoring

### `npm run health:check`

Runs environment validation and health checks:

- Node.js version compatibility
- Environment variables
- Redis connection
- MongoDB connection
- Port availability

### `npm run clean:runtime`

Cleans up development runtime state:

- Kills stale processes
- Clears temp files
- Checks orphaned ports

### Individual Service Commands

```bash
npm run dev:infra      # Start infrastructure only
npm run dev:backend    # Start backend only
npm run dev:frontend   # Start frontend only
npm run dev:workers   # Start workers only
```

## Startup Sequence

The orchestrator follows this startup sequence:

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

## Graceful Shutdown

Press `CTRL+C` to gracefully shutdown all services:

1. Workers stopped first
2. Backend API stopped
3. Frontend stopped
4. Infrastructure remains running (use `docker-compose down` to stop)

## Configuration

Edit `dev-orchestrator/src/index.ts` to configure:

- Service startup order
- Health check intervals
- Startup timeouts
- Graceful shutdown timeouts

## Environment Variables

The orchestrator uses sensible defaults for development. Required variables:

- `MONGODB_URI` (defaults to `mongodb://localhost:27017/devtrack`)
- `REDIS_HOST` (defaults to `localhost`)
- `REDIS_PORT` (defaults to `6379`)

Optional variables:

- `OPENAI_API_KEY` (for AI features)
- `GEMINI_API_KEY` (for AI features)

## Architecture

### Components

- **EnvironmentReadinessValidator**: Validates environment before startup
- **DevelopmentHealthMonitor**: Tracks service health status
- **UnifiedRuntimeConsole**: Centralized logging with colors
- **DevelopmentRuntimeOrchestrator**: Main orchestration engine
- **RuntimeCleaner**: Cleanup utilities

### Service Priority

Services are started by priority (lower = earlier):

1. Infrastructure (priority 1)
2. Backend API (priority 2)
3. Workers (priority 3)
4. Frontend (priority 4)

## Troubleshooting

### Port Already in Use

If you see "Port already in use" errors:

```bash
npm run clean:runtime
```

### Redis Connection Failed

Start infrastructure:

```bash
npm run dev:infra
```

### MongoDB Connection Failed

Start infrastructure:

```bash
npm run dev:infra
```

## Development

The orchestrator is built with TypeScript and uses:

- `tsx` for TypeScript execution
- `chalk` for colored console output
- `ioredis` for Redis connection checks
- `mongoose` for MongoDB connection checks

## License

Part of the DevTrack platform.
