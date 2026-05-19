# 🌌 DevTrack: Developer Productivity & Engineering Gamification OS

DevTrack is a high-performance, developer-centric monorepo platform designed to aggregate engineering activity, track daily productivity, and gamify coding achievements. By integrating competitive programming platforms with real-time analytics and a rich telemetry UI, DevTrack turns software engineering into an engaging, progression-based experience.

---

## 🚀 Core Capabilities

* **Engineering OS Dashboard:** A sleek, dark-mode, glassmorphism-based developer dashboard with platform telemetry, daily coding velocity graphs, systems status bars, and active widgets.
* **DSA Telemetry Ingestion:** Crawlers and adapters that ingest profile statistics, contests, and problem solving data across **LeetCode**, **Codeforces**, **CodeChef**, and **GitHub**.
* **Unified Progression Engine:** Computes experience points (XP), levels, coding streaks, and badges based on real-time activity metrics.
* **High-Coherence SSE WebChannel**: Real-time server-push state synchronization over a Server-Sent Events (SSE) singleton channel, ensuring multi-tab browser instances share a single connection to bypass browser tab connection limits.
* **Command Palette Navigation:** A quick-action command palette (`Ctrl+K` / `Cmd+K`) for lightning-fast workspace navigation, system diagnostics, and settings management.

---

## 🏗️ System Architecture Overview

DevTrack uses a decoupled, monorepo architecture separating a rich **React 19** frontend from a robust **Express 5** + **MongoDB** + **Redis** backend. Background operations, platform indexing, and gamification processing are delegated to isolated **BullMQ workers**.

For a deep dive into the system components, data flow, and singleton connection management, refer to the [System Architecture Guide](ARCHITECTURE.md).

---

## 🛠️ Technology Stack & Ecosystem

### 💻 Backend (API & Ingestion)
* **Core Platform:** Node.js, TypeScript, Express.js (v5)
* **Database:** MongoDB via Mongoose (with compound indexing, strict validation, and `.lean()` read paths)
* **Distributed Queue & Cache:** Redis + BullMQ (for asynchronous background ingestion, cron operations, and scheduler tasks)
* **Testing Suite:** Vitest (smoke, unit, and integration tests)

### 🎨 Frontend (Engineering UI)
* **Client Core:** React 19, Vite, TypeScript, Vanilla Tailwind CSS v4
* **State & Caching:** Zustand v5 (transient UI, sidebar, modal states), TanStack Query v5 (React Query for server state caching and client validation)
* **Animations:** Framer Motion (premium micro-animations, radar scanners, orbital physics, and spring-based layouts)
* **Iconography:** Lucide React

---

## 📁 Repository Documentation Index

To help contributors and operators find operational details quickly:

- **[System Architecture Guide (ARCHITECTURE.md)](ARCHITECTURE.md)**: Deep dive into the SSE Singleton Pattern, event streaming, PubSub, and worker architectures.
- **[Production Deployment Guide (DEPLOYMENT.md)](DEPLOYMENT.md)**: Configuration matrix, independent scaling topology (API vs. Workers), Docker Setup, and environment variables.
- **[Contributing Guidelines (CONTRIBUTING.md)](CONTRIBUTING.md)**: Repository conventions, domain-driven backend folder structures, frontend layout paradigms, styling guidelines, and Git branch flow.
- **[Security Policy (SECURITY.md)](SECURITY.md)**: Vulnerability reporting workflow, production config verification policies, and rate-limiting setup details.

---

## 💻 Local Setup & Development

### System Requirements
* **Node.js:** `>= 18.0.0`
* **npm:** `>= 9.0.0`
* **Docker Desktop:** Installed & running (for local MongoDB & Redis services)

### Quick Start

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/VarshithReddy2006/DevTrack.git
   cd DevTrack
   ```

2. **Spin up Core Infrastructure (Docker):**
   Ensure Docker is running, then launch MongoDB and Redis:
   ```bash
   npm run docker:up
   ```
   *This exposes MongoDB on `localhost:27017` and Redis on `localhost:6379`.*

3. **Configure Environment Variables:**
   Copy the example template to `.env` in the root:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill out your local parameters (and optionally a `GITHUB_TOKEN` to prevent GitHub rate-limiting).

4. **Install Dependencies:**
   Install workspace-wide dependencies recursively:
   ```bash
   npm run install-all
   ```

5. **Start Local Development Servers:**
   Launch the Express API and Vite client concurrently:
   ```bash
   npm run dev
   ```
   * **Frontend:** `http://localhost:5173`
   * **Backend:** `http://localhost:3001`
   * **SSE Channel:** `http://localhost:3001/events`

---

## 📜 Workspace Commands Reference

| Command | Action |
| :--- | :--- |
| `npm run install-all` | Runs `npm install` recursively in the root, `/frontend`, and `/backend` |
| `npm run dev` | Spins up the Frontend client and Backend API servers in concurrent watch mode |
| `npm run build` | Compiles both Frontend and Backend workspaces for production deployment |
| `npm run test` | Runs the test suite on the backend using Vitest |
| `npm run docker:up` | Builds and launches MongoDB & Redis containers with automated health checks |
| `npm run docker:down` | Gracefully shuts down and purges local Docker containers |
| `npm run clean` | Recursively wipes out `node_modules` folders to trigger a fresh install |
