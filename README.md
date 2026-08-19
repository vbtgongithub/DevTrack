# DevTrack

### Developer Productivity & Career Readiness Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## Overview

DevTrack is a full-stack platform that helps developers track their coding progress, manage projects, analyze resumes with AI, and measure career readiness — all in one unified workspace.

It aggregates activity from **LeetCode**, **Codeforces**, **CodeChef**, and **GitHub**, then uses AI to generate personalized learning roadmaps, career insights, and readiness scores.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **DSA Progress Tracking** | Unified view of problems solved across LeetCode, Codeforces, and CodeChef with heatmaps, topic analytics, and contest history |
| **Platform Sync Engine** | Automated background sync from 4 coding platforms using scheduled BullMQ workers |
| **AI Resume Intelligence** | Upload PDF/DOCX resumes for ATS scoring, claim validation, credibility analysis, and AI-powered improvement suggestions |
| **Career Readiness Engine** | Skill gap analysis, personalized roadmaps, evolution timelines, and an AI copilot for career guidance |
| **Project Management** | Track personal projects with tasks, velocity metrics, and GitHub repository integration |
| **Focus Mode** | Daily missions, Pomodoro timers, and persistent task lists to maximize productivity |
| **Gamification** | XP system, levels, streaks with freeze protection, missions, and daily challenges |
| **Real-time Updates** | Server-Sent Events (SSE) for live dashboard notifications and activity feeds |
| **Admin Dashboard** | Queue monitoring, dead-letter queue replay, trust scores, and AI audit logs |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React 19 SPA)                        │
│   Zustand State  •  TanStack Query  •  SSE Client  •  Clerk Auth    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ REST + SSE
┌────────────────────────────────▼────────────────────────────────────┐
│                      API SERVER (Express 5)                           │
│   23 Domain Modules  •  Zod Validation  •  Rate Limiting  •  RBAC   │
└───────┬───────────────────────┬──────────────────────┬──────────────┘
        │                       │                      │
┌───────▼───────┐     ┌────────▼────────┐    ┌───────▼────────┐
│   MongoDB 7   │     │    Redis 7      │    │  BullMQ Workers │
│  60+ Models   │     │  Cache + PubSub │    │  6 Worker Types │
└───────────────┘     └─────────────────┘    └────────────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │  External APIs  │
                                              │ LeetCode, CF,   │
                                              │ GitHub, OpenAI, │
                                              │ Gemini          │
                                              └────────────────┘
```

**Backend** is modular with 23 domain modules following a clean service-controller-routes pattern. Each module has its own validation layer (Zod), business logic, and route definitions.

**Workers** handle platform sync, XP processing, resume intelligence (parsing, ATS scoring, embeddings), and system maintenance — all decoupled from the HTTP thread for low API latency.

---

## Tech Stack

### Frontend
- **React 19** with Vite 8 for fast HMR and optimized builds
- **TypeScript** for full type safety across the application
- **Tailwind CSS 4** with a custom design system and motion tokens
- **Zustand** for client-side state management with selective persistence
- **TanStack Query** for server state, caching, and optimistic updates
- **Framer Motion** for polished animations and transitions
- **Clerk** for authentication (OAuth, magic links, session management)

### Backend
- **Express 5** with async middleware and structured error handling
- **MongoDB 7** with Mongoose ODM (60+ schemas, indexed queries)
- **Redis 7** for caching, BullMQ job queues, and SSE pub/sub
- **BullMQ** for reliable background job processing with DLQ support
- **Zod** for runtime request validation on all endpoints
- **Clerk Express SDK** for JWT verification and user sync

### AI & Intelligence
- **OpenAI GPT** for resume analysis, coaching, and career intelligence
- **Google Gemini** for embeddings, semantic search, and fallback generation
- Custom credibility scoring algorithms and ATS simulation engines

### Infrastructure
- **Docker Compose** for local development and production deployment
- **GitHub Actions** CI/CD with automated testing and deploy pipelines
- **Railway + Vercel** for production hosting (API + static SPA)
- Split-process architecture: API and workers scale independently

---

## Project Structure

```
DevTrack/
├── backend/                    # Express 5 API + BullMQ Workers
│   ├── src/
│   │   ├── config/            # Environment and platform configuration
│   │   ├── db/models/         # 60+ Mongoose schemas
│   │   ├── middleware/        # Auth, rate limiting, error handling
│   │   ├── modules/           # 23 domain modules (routes/controller/service/validation)
│   │   ├── shared/            # Redis, SSE, queue utilities
│   │   └── workers/           # Background job processors
│   └── tests/                 # Unit, integration, and chaos tests
│
├── frontend/                   # React 19 SPA
│   ├── src/
│   │   ├── components/        # Reusable UI primitives and layouts
│   │   ├── features/          # Domain feature modules (15+)
│   │   ├── pages/             # Route-level page components
│   │   ├── services/          # Axios API client layer (16 modules)
│   │   └── store/             # Zustand state stores (14 stores)
│   └── e2e/                   # Playwright end-to-end tests
│
├── docker-compose.yml          # Full-stack development environment
├── docker-compose.prod.yml     # Production split topology
└── .github/workflows/          # CI/CD pipelines
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker Desktop (for MongoDB + Redis)

### Setup

```bash
# Clone the repository
git clone https://github.com/VarshithReddy2006/DevTrack.git
cd DevTrack

# Install all dependencies (backend + frontend)
npm run install-all

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start infrastructure (MongoDB + Redis)
npm run dev:infra

# Run the full application
npm run dev:all
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| API Docs | http://localhost:3001/health |

---

## API Design

RESTful API mounted at `/api/v1` with 23 route modules:

- **Authentication** — Clerk-based JWT with automatic user sync
- **DSA & Platforms** — Problem tracking, contest history, cross-platform analytics
- **Resume Intelligence** — Upload, parse, ATS score, credibility check, export
- **Readiness** — Skill gaps, roadmaps, evolution timeline, AI copilot
- **Projects** — CRUD with tasks, GitHub sync, velocity metrics
- **Gamification** — XP, streaks, missions, daily challenges, leaderboard
- **Real-time** — SSE event streams with Redis pub/sub backbone
- **Operations** — Queue health, DLQ management, system metrics

All endpoints use Zod schema validation, structured error responses, and rate limiting.

---

## Testing

```bash
# Backend unit tests
npm test

# Backend integration tests (requires running infrastructure)
cd backend && npm run test:integration

# Frontend E2E tests (Playwright)
cd frontend && npm run test:e2e
```

CI pipeline runs TypeScript type checking, linting, unit tests, integration tests, and Docker build verification on every pull request.

---

## Deployment

The application supports multiple deployment strategies:

- **Docker Compose** — Single command for the full stack
- **Split Production** — Independent scaling of API server and worker processes
- **Cloud Native** — Vercel (frontend) + Railway/Render (backend) with GitHub Actions automation

---

## Technical Highlights

- **60+ MongoDB schemas** with compound indexes and optimized query patterns
- **6 background worker types** processing jobs asynchronously via BullMQ
- **SSE real-time layer** with Redis pub/sub for multi-instance broadcast
- **Dead-letter queue** with replay capability for fault tolerance
- **Graceful AI degradation** — platform works fully without AI keys in dev mode
- **14 Zustand stores** with selective hydration and persistence
- **Chaos testing suite** — SSE reconnect storms, refresh floods, DLQ resilience

---

## License

Private — All rights reserved.
