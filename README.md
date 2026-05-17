# 🌌 DevTrack — The Developer Operating System

> A next-generation engineering productivity platform that transforms coding activity into a real-time, gamified operating system for developers.

DevTrack is not just another developer dashboard. It is a full-scale engineering telemetry platform designed to unify competitive programming, GitHub activity, productivity analytics, progression systems, and real-time infrastructure into a single immersive experience.

Built with a modern distributed architecture, DevTrack combines high-performance ingestion pipelines, real-time synchronization, scalable worker orchestration, and a premium SaaS-grade interface to create an ecosystem where developers can track growth, maintain momentum, and visualize progress like a high-end RPG progression engine.

---

# ✨ Why DevTrack Exists

Modern developers operate across fragmented ecosystems:

- Competitive programming platforms
- GitHub repositories
- Daily coding streaks
- Contribution graphs
- Contest ratings
- Personal productivity metrics

Most tools only show isolated statistics.

DevTrack unifies everything into a single intelligent engineering command center — delivering live telemetry, progression systems, achievement mechanics, and deep behavioral analytics in real time.

The result feels closer to a developer-focused operating system than a traditional dashboard.

---

# 🚀 Core Features

## ⚡ Real-Time Engineering Telemetry

A fully immersive developer dashboard powered by live synchronization systems.

Track:
- Coding velocity
- Submission activity
- Daily progression
- XP growth
- Platform sync status
- Contest analytics
- Contribution consistency
- System health metrics

All rendered through a premium dark-mode SaaS interface with glassmorphism layers, motion systems, and real-time visual feedback.

---

## 🧠 Multi-Platform DSA Intelligence Engine

DevTrack aggregates developer performance across major coding ecosystems through a unified ingestion and analytics pipeline.

Supported integrations currently include:
- LeetCode
- Codeforces
- CodeChef
- GitHub

The ingestion layer supports:
- API integrations
- GraphQL adapters
- Smart scraping pipelines
- Cached fallback recovery
- Delta synchronization
- Idempotent indexing

This creates a unified engineering identity across all connected platforms.

---

## 📈 Dynamic Progression & XP System

DevTrack introduces RPG-inspired developer progression mechanics powered by transactional background pipelines.

Developers earn:
- Experience Points (XP)
- Levels
- Streaks
- Badges
- Achievement unlocks
- Milestone rewards

The system includes:
- Anti-abuse validation
- Duplicate prevention
- Submission anomaly detection
- Saga rollback compensation
- Distributed queue orchestration

This ensures progression remains accurate, scalable, and exploit-resistant.

---

## 🔥 Unified Activity Heatmap

A rolling contribution heatmap combines:
- DSA submissions
- GitHub commits
- Platform activity
- Daily coding streaks

into a single visual timeline.

Instead of switching between platforms, developers get one cohesive view of engineering consistency.

---

## 📡 High-Coherence Real-Time Sync Engine

DevTrack uses a custom SSE Singleton WebChannel architecture.

Unlike traditional implementations that create redundant browser connections per tab, DevTrack coordinates all tabs through a shared synchronization layer.

Benefits:
- Lower server load
- Reduced socket exhaustion
- Better browser performance
- Real-time state propagation
- Efficient multi-tab synchronization

This architecture enables SaaS-scale real-time telemetry without unnecessary infrastructure overhead.

---

# 🏗️ Architecture Overview

DevTrack follows a distributed monorepo architecture optimized for scalability, observability, and isolated background processing.

## Frontend Stack

- React 19
- Vite 8
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Zustand
- TanStack Query
- React Router v7

The frontend is engineered around:
- ultra-fast rendering
- motion-driven UI systems
- modular feature domains
- synchronized external state stores
- premium SaaS interaction patterns

---

## Backend Stack

- Node.js
- TypeScript
- Express 5
- MongoDB
- Redis
- BullMQ
- Axios
- Cheerio
- Vitest

The backend focuses heavily on:
- event-driven orchestration
- isolated workers
- transactional consistency
- ingestion reliability
- horizontal scalability

---

# ⚙️ Distributed Worker Infrastructure

DevTrack separates HTTP traffic from heavy background processing through isolated worker containers.

Worker modes include:

| Worker Type | Responsibility |
|---|---|
| `sync` | Platform crawling & ingestion |
| `xp` | XP calculations & progression |
| `orchestration` | Saga rollback coordination |
| `maintenance` | Cleanup jobs & diagnostics |
| `all` | Full unified worker runtime |

This architecture prevents worker failures from impacting the public API layer.

---

# 🧬 Progression Saga Pipeline

One of DevTrack’s defining systems is its transactional progression orchestration engine.

Pipeline stages include:

1. Platform synchronization
2. Delta comparison
3. Anti-abuse validation
4. Duplicate filtering
5. XP computation
6. Achievement evaluation
7. Streak synchronization
8. Compensation rollback handling

If any downstream stage fails, rollback mechanisms restore consistent user state automatically.

This creates database-level integrity without relying on monolithic transactions.

---

# 🎨 Premium SaaS Design System

DevTrack’s visual system is inspired by:
- futuristic telemetry interfaces
- high-end SaaS dashboards
- gaming HUD systems
- engineering observability tools

Design characteristics:
- Deep-space dark themes
- Glassmorphism surfaces
- Motion-driven UI feedback
- Conic radar gradients
- Telemetry scan layers
- Soft neon accent systems
- Orbital micro-interactions

The result is a UI designed to feel alive.

---

# 🧪 Testing & Reliability

DevTrack emphasizes runtime resilience and validation integrity.

Testing includes:
- ingestion validation
- heatmap correctness
- schema integrity
- orchestration consistency
- date synchronization
- worker health checks
- platform adapter resilience

Powered by:
- Vitest
- smoke testing
- modular validation suites

---

# 🐳 Local Development Setup

## Requirements

- Node.js ≥ 18
- npm ≥ 9
- Docker Desktop

---

## Clone Repository

```bash
git clone https://github.com/VarshithReddy2006/DevTrack.git
cd DevTrack
```

---

## Start Infrastructure

```bash
npm run docker:up
```

Services:
- MongoDB → `localhost:27017`
- Redis → `localhost:6379`

---

## Configure Environment Variables

```bash
cp .env.example .env
```

Optionally configure:
- GitHub API tokens
- platform credentials
- Redis connection URLs
- database URIs

---

## Install Dependencies

```bash
npm run install-all
```

---

## Run Development Environment

```bash
npm run dev
```

Endpoints:
- Frontend → `http://localhost:5173`
- Backend → `http://localhost:3001`
- SSE Stream → `http://localhost:3001/events`

---

# 📦 Monorepo Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts frontend + backend concurrently |
| `npm run build` | Production build |
| `npm run test` | Executes backend test suite |
| `npm run docker:up` | Starts MongoDB & Redis |
| `npm run docker:down` | Stops infrastructure |
| `npm run clean` | Removes all node_modules |
| `npm run install-all` | Installs all workspace dependencies |

---

# 🌍 Vision

DevTrack is evolving into a fully connected Developer Operating System.

The long-term vision includes:
- AI-assisted productivity insights
- Advanced engineering analytics
- Team collaboration systems
- Competitive leaderboards
- Personalized growth recommendations
- Live coding telemetry
- Infrastructure observability
- Developer progression intelligence

The goal is simple:

Build the definitive platform for measuring, visualizing, and accelerating developer growth.

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Authors

Built by:

- Varshith Reddy — focused on building immersive systems, scalable engineering infrastructure, and next-generation developer experiences.
- Bhanu Teja — collaborator and contributor to the DevTrack ecosystem and platform engineering architecture.
