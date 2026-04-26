# 🚀 DevTrack — Project Status (Brutal, Repo-Grounded)

**Generated:** April 26, 2026  
**Branch:** `feature/profile-platform-stats` (tracks `origin/feature/profile-platform-stats`)  
**Build Health:** ✅ Builds pass locally (`backend: npm run build`, `frontend: npm run build`)

---

## 1) 📌 Project Understanding

### What DevTrack is
DevTrack is an all-in-one developer productivity + tracking platform that aims to unify:

- DSA progress (problems solved, heatmap, submissions)
- Project tracking (projects, tasks, progress)
- Activity history (timeline + heatmap)
- Later: AI assistant for planning/insights

### The real problem it solves
It tries to replace scattered tracking across LeetCode/Codeforces/GitHub/notes with one loop:
**track → reflect → plan → execute**, with minimal manual overhead.

### Target users (precise)
- Students preparing for placements (DSA + consistency)
- Self-taught devs who need accountability
- Solo builders juggling multiple side projects

---

## 2) 📊 Current Status (Reality Check)

This section is based on what exists in *this repo right now*.

### ✅ Done (Verified in repo)
- [x] Frontend pages exist with strong UI surface: Dashboard, DSA, Activity, Projects, Settings, Profile
- [x] Frontend architecture exists: hooks + services + viewmodels + Zustand stores
- [x] Backend exists (Express + TypeScript) with modular routes mounted under `/api`
- [x] MongoDB + backend local dev stack exists via `docker-compose.yml`
- [x] Auth scaffolding exists: JWT + refresh flow on backend; axios refresh-on-401 retry on frontend

### 🔄 In Progress (Partially working / partially integrated)
- [ ] Frontend↔backend integration consistency (some pages are API-backed; others use mocks or browser platform calls)
- [ ] Platform stats strategy (hybrid of backend sync + direct browser fetch + cached localStorage)
- [ ] Unified “single source of truth” for totals/streaks across Dashboard/DSA/Profile

### ❌ Not Started (No real implementation evidence)
- [ ] AI assistant (actual backend, prompts, storage, evals, UI)
- [ ] Emotional-aware/Jarvis layer (this is a separate roadmap item, not MVP)
- [ ] CI + automated test coverage acting as a safety net
- [ ] Production deployment pipeline + operational hardening

### ⚠️ Unclear / Risky (High likelihood of stalling you)
- [ ] Stats correctness risk due to mixed sources (mock + browser fetch + backend)
- [ ] Scope creep risk (AI + “Jarvis” vision before core tracking is stable)

---

## 3) 🧩 Architecture Breakdown (Expected vs Current)

### Frontend
- **Expected components:** auth routing boundary, API client, stores, viewmodels, consistent error/loading states
- **Current maturity:** 🟡 Partial (UI is strong; data + auth consistency is not)
- **Missing pieces:**
    - One consistent logged-out experience (no hidden dev bypasses)
    - A single canonical data path (backend should be source-of-truth)

### Backend
- **Expected components:** auth, domain modules, sync jobs, validation, error handling, caching
- **Current maturity:** 🟡 Partial (good structure; builds are currently green)
- **Missing pieces:**
    - Keep a build-green baseline (must stay compiling)
    - Hardening for external calls (timeouts/retries/rate limiting)

### Database (MongoDB)
- **Expected:** users, refresh tokens, connected platforms, platform stats snapshots, activity events, projects/tasks
- **Current maturity:** 🟡 Early-to-mid (models exist, but correctness lifecycle isn’t proven)
- **Missing pieces:**
    - Indexes/uniques + data lifecycle clarity (what’s computed vs stored)

### AI Layer
- **Expected:** assistant API, prompt orchestration, tool calling, storage, evals, cost controls
- **Current maturity:** 🔴 Not started
- **Missing pieces:** everything (do not start before core data is trusted)

### Integrations
- **Expected:** LeetCode/CF/CodeChef/GitHub/HackerRank with sync jobs and normalized models
- **Current maturity:** 🟡 Partial
- **Missing pieces:**
    - Backend sync coverage for GitHub/HackerRank
    - Consistent UX for sync state + errors

---

## 4) 📋 Feature Status Table

| Feature | Status | Complexity | Priority | Notes |
|---|---|---:|---:|---|
| Backend build health | ✅ Done | Medium | P0 | `backend npm run build` passes |
| Authentication (API + client refresh) | 🟡 Partial | Medium | P0 | Plumbing exists; UX boundary consistency not proven |
| Dashboard (UI) | ✅ Done | Medium | P1 | UI strong |
| Dashboard (real data) | 🟡 Partial | Medium | P0 | Dev-mode mock fallback exists when no user |
| DSA page (UI) | ✅ Done | Medium | P1 | UI present |
| DSA page (real data via backend) | 🟡 Partial | High | P0 | Currently uses direct browser platform APIs + mock fallback |
| Activity (heatmap + feed) | 🟡 Partial | Medium | P0 | Calls backend; depends on auth and stable API |
| Projects (list/detail/tasks) | 🟡 Partial | Medium | P0 | Calls backend; needs end-to-end CRUD confidence |
| Settings | 🟡 Partial | Low-Med | P1 | Fetch exists; ensure saving/edit flows as needed |
| Profile platform stats | 🟡 Partial | Medium | P1 | Hybrid: localStorage + browser fetch + backend fetch |
| Platform sync (LC/CF/CC) | 🟡 Partial (Blocked) | High | P0 | Build failing; sync pipeline maturity unclear |
| GitHub integration | 🔴 Not started | High | P2 | OAuth + rate limits + repo selection is non-trivial |
| AI assistant | 🔴 Not started | Very High | P3 | Do after MVP only |

---

## 5) 🚨 Critical Gaps (What will break if you keep going)

- **You don’t have a reliable backend until it compiles.** Build-green is table stakes.
- **Mixed data sources will create contradictions.** Users won’t trust stats if Dashboard/DSA/Profile disagree.
- **No tests/CI = regression factory.** Every change will break auth + aggregates.
- **AI scope will stall you.** If you start “assistant” now, you’ll freeze core product shipping.

---

## 6) 📆 Next 7-Day Execution Plan (Strict, Ship Usable)

**Goal:** a user can register → login → set usernames → sync → see real Dashboard/DSA/Activity without mocks.

### Day 1 — Stabilize
- ✅ Backend builds cleanly (`backend npm run build`)
- Confirm `docker compose up --build` runs backend + Mongo cleanly

### Day 2 — Lock Auth Boundary
- Ensure protected routes behave consistently in frontend
- Remove or env-gate dev mock paths (Dashboard dev fallback)

### Day 3 — Single Source of Truth for Dashboard
- Backend owns totals/streak/aggregates
- Frontend dashboard reads only from backend when authenticated

### Day 4 — Move DSA to Backend-Owned Data
- Backend endpoint provides DSA totals/overview derived from stored platform snapshots
- Frontend DSA page reads from backend (no direct platform browser fetch for MVP totals)

### Day 5 — Minimal Sync UX
- Add “Sync now” for LC + CF (minimum)
- Store snapshot + last sync time + error message surfaced in UI

### Day 6 — Data correctness hardening
- Add critical DB indexes/uniques
- Add basic rate limiting/timeouts for external sync calls

### Day 7 — Release candidate
- Remove remaining mock fallbacks for MVP surfaces
- Add minimal smoke tests + a CI step that runs build(s)

---

## 7) 📦 MVP Definition (STRICT)

### Include ONLY
- [ ] Auth: login/signup + refresh session
- [ ] Profile: set platform usernames (at least LeetCode + Codeforces)
- [ ] Sync now: fetch/store snapshots
- [ ] Dashboard: real totals from backend
- [ ] DSA: real totals/overview from backend snapshots
- [ ] Activity: feed + heatmap from backend
- [ ] Projects: minimal CRUD (create + status update + list)

### Remove for now
- ❌ AI assistant / planning / insights
- ❌ Emotional-aware assistant (Jarvis vision)
- ❌ Advanced analytics, achievements, contests
- ❌ Extra integrations beyond 2 platforms

---

## 8) ⚙️ Tech Decisions Review

### Keep (good choices)
- React + TypeScript + Vite on the frontend
- Express + TypeScript + Zod validation on the backend
- MongoDB + Mongoose for MVP speed
- Docker Compose for local parity

### Avoid (right now)
- Multi-service architecture, queues, event buses
- LLM framework sprawl before core stats are correct
- Browser-based platform scraping as the primary data path

### Overkill
- “Jarvis / emotional intelligence” before you ship a stable tracker

---

## 9) 🧠 Reality Check

- The vision is big. The product is only viable if you **freeze scope**.
- Simplify immediately: **two integrations, one truth source (backend), build-green always**.

---

## 10) 🏁 Final Verdict

**Readiness Score:** 3.5 / 10  
**Status:** ❌ You are not on track

### Why (non-negotiable)
- Backend build regressions would block reliable progress.
- Core data is inconsistent (mock + browser fetch + backend).
- No test/CI safety net.

### One-line focus
Ship a build-green, backend-owned, two-platform MVP before touching AI.

---

## Appendix — How to Run

```bash
docker compose up --build
```

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run build
```

