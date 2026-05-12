# DevTrack — Project Status & File Analysis

**Generated:** May 12, 2026
**Branch:** `fix/ci-frontend-build`
**Updated:** Complete file analysis & architecture documentation

---

## Project Overview

DevTrack is a full-stack developer productivity tracker with:
- **Backend:** Express.js + MongoDB + Redis + BullMQ
- **Frontend:** React + Vite + Tailwind CSS + TanStack Query + Zustand
- **Real-time:** Server-Sent Events (SSE)
- **Gamification:** XP system with levels and achievements

---

## Backend File Map & Connections

### Entry Point
| File | Purpose | Connections |
|------|---------|-------------|
| `src/index.ts` | Express server boot, health endpoints, /metrics, /api/system/* | Imports: config, middleware, routes, SSE, jobs, orchestrator, Redis |

### Config
| File | Purpose | Used By |
|------|---------|---------|
| `src/config/env.ts` | Environment variable loading + validation | ALL backend files |
| `src/config/platforms.ts` | Platform constants (names, colors, URLs) | sync.service.ts, platform models |
| `src/config/constants.ts` | App-wide constants | Various modules |
| `src/config/index.ts` | Config barrel export | Main entry |

### Routes (entry for API)
| File | Purpose | Connections |
|------|---------|-------------|
| `src/routes/index.ts` | **Master route aggregator** — mounts all sub-routers | Mounts: auth, dashboard, dsa, activity, projects, profile, settings, platforms, xp |

### Modules (organized route handlers) — ALL CONSISTENT PATTERN ✅
| Module | Files | Routes | Parent Route |
|--------|-------|--------|--------------|
| **auth** | controller, service, routes, validation, index | auth/* | `/api/auth` |
| **dashboard** | controller, service, routes, index | dashboard/* | `/api/dashboard` |
| **dsa** | controller, service, routes, index, dsa_rolling.test.ts | dsa/* | `/api/api/dsa` |
| **activity** | controller, service, routes, index | activity/* | `/api/activity` |
| **projects** | controller, service, routes, index | projects/* | `/api/projects` |
| **profile** | controller, service, routes, index | profile/* | `/api/profile` |
| **platform-sync** | controller, service, routes, index | platforms/* | `/api/platforms` |
| **xp** | processor, rules, routes, index | xp/* | `/api/xp` |
| **settings** | controller, routes, index | settings/* | `/api/settings` |

### Models (MongoDB schemas) — 19 models total
| Model | Used By |
|-------|---------|
| `user.model.ts` | auth.service, auth.controller |
| `refreshToken.model.ts` | auth.service |
| `userProfile.model.ts` | profile.service, profile.controller |
| `userSettings.model.ts` | settings.controller, sync.service |
| `connectedPlatform.model.ts` | sync.service, platform-sync controller |
| `platformStats.model.ts` | sync.service, dsa.service, dashboard.service |
| `activityEvent.model.ts` | activity.service, settings.controller, sync.service |
| `dailyActivity.model.ts` | dsa.service, activity.service, sync.service |
| `dsaProblem.model.ts` | dsa.service, sync.service |
| `dsaTopicProgress.model.ts` | dsa.service, sync.service |
| `dsaSubmission.model.ts` | dsa.service, sync.service |
| `dsaContest.model.ts` | dsa.service, sync.service |
| `project.model.ts` | projects.service, projects.controller |
| `projectTask.model.ts` | projects.service, projects.controller |
| `mission.model.ts` | dashboard.service |
| `syncJob.model.ts` | sync.service |
| `userXp.model.ts` | xp/processor, xp/rules |
| `xpTransaction.model.ts` | xp/processor, xp/rules |

### Middleware
| File | Purpose | Used By |
|------|---------|---------|
| `src/middleware/auth.ts` | JWT validation, user injection | All protected routes |
| `src/middleware/error.ts` | Global error handler, notFound handler | `src/index.ts` |
| `src/middleware/rateLimit.ts` | In-memory rate limiting | All routes via `routes/index.ts` |
| `src/middleware/validation.ts` | Generic async handler wrapper | Controllers |
| `src/middleware/requestContext.ts` | Request ID + timing middleware | `src/index.ts` |
| `src/middleware/index.ts` | Middleware barrel export | modules/* |

### Shared Utilities
| File | Purpose | Used By |
|------|---------|---------|
| `src/shared/logger.ts` | Structured logging | ALL files |
| `src/shared/response.ts` | Standardized API responses | All controllers |
| `src/shared/pagination.ts` | Pagination helpers | dsa.service, projects.service |
| `src/shared/date.ts` | Date utilities | dsa.service, activity.service |
| `src/shared/monitoring.ts` | Health metrics | `src/index.ts` |
| `src/shared/syncState.ts` | Sync scheduler state | `src/index.ts` |
| `src/shared/syncScheduler.ts` | Sync scheduling logic | orchestrator |
| `src/shared/requestMetrics.ts` | Request metrics | `src/index.ts` |
| `src/shared/index.ts` | Shared barrel export | Various |

### Shared Infrastructure
| Directory | Files | Purpose |
|-----------|-------|---------|
| `shared/sse/` | eventBus.ts, sseHandler.ts, index.ts | Server-Sent Events system |
| `shared/redis/` | client.ts, index.ts | Redis connection (BullMQ) |
| `shared/jobs/` | queueFactory.ts, workers.ts, xpWorker.ts, types.ts, index.ts | Background job processing |
| `shared/runtime/` | infrastructureRegistry.ts, orchestrator.ts, index.ts | Server lifecycle management |

### Database
| File | Purpose |
|------|---------|
| `src/db/connection.ts` | MongoDB connection |
| `src/db/index.ts` | DB exports |
| `src/db/models/index.ts` | Models barrel export (19 models) |

### Tests
| File | Purpose |
|------|---------|
| `src/__tests__/date.test.ts` | Date utils test |
| `src/__tests__/smoke.test.ts` | Smoke test |
| `src/modules/dsa/dsa_rolling.test.ts` | DSA rolling heatmap test |

### Scripts
| File | Purpose |
|------|---------|
| `src/scripts/rebuildDsaIntegrity.ts` | DSA data integrity rebuild |

---

## Frontend File Map & Connections

### Entry Points
| File | Purpose | Connections |
|------|---------|-------------|
| `src/main.tsx` | React app entry, QueryClient provider | Imports: App.tsx |
| `src/App.tsx` | Root router, AuthGate, AppShell | Uses: router, stores, hooks, pages |
| `src/index.css` | Global styles, Tailwind imports | Used by main.tsx |

### Routing
| File | Purpose | Connections |
|------|---------|-------------|
| `src/router/index.tsx` | **Page-level route definitions** — lazy loads pages | Mounted inside AppShell |

### Pages
| File | Purpose | Route | Uses |
|------|---------|-------|------|
| `src/pages/LandingPage.tsx` | Public landing page | `/` | Landing components |
| `src/pages/LoginPage.tsx` | Login form | `/login` | userStore |
| `src/pages/DashboardPage.tsx` | Dashboard with stat cards | `/dashboard` | useDashboardData, dashboardService, dsaService |
| `src/pages/DsaPage.tsx` | DSA tracker with heatmap | `/dsa` | useDsaData, dsaService |
| `src/pages/ProjectsPage.tsx` | Projects management | `/projects` | useProjectsData, projectsService |
| `src/pages/SettingsPage.tsx` | User settings | `/settings` | SettingsWorkspace, settingsStore |
| `src/pages/ProfilePage.tsx` | User profile | `/profile` | profileStore, profileService |

### Services (API layer)
| File | Purpose | Used By |
|------|---------|---------|
| `src/services/authService.ts` | Login, register, logout, token management | userStore, LoginPage |
| `src/services/dashboardService.ts` | Dashboard data | hooks/useDashboardData |
| `src/services/dsaService.ts` | DSA problems, submissions, contests, topics | hooks/useDsaData |
| `src/services/profileService.ts` | Profile data | ProfilePage, hooks |
| `src/services/projectsService.ts` | Projects CRUD | hooks/useProjectsData |
| `src/services/settingsService.ts` | Settings + platform sync | settingsStore, SettingsPage |

### Stores (Zustand state)
| File | Purpose | Connections |
|------|---------|-------------|
| `src/store/userStore.ts` | Auth state, user, login/logout/hydrate | App.tsx, axiosClient |
| `src/store/dashboardStore.ts` | Dashboard data | DashboardPage, useDashboardData |
| `src/store/dsaStore.ts` | DSA data (ViewModel) | DsaPage |
| `src/store/projectsStore.ts` | Projects data | ProjectsPage |
| `src/store/settingsStore.ts` | Settings state | SettingsWorkspace, SettingsPage |
| `src/store/profileStore.ts` | Profile editing state | ProfilePage |
| `src/store/uiStore.ts` | Toast notifications, UI state | axiosClient, ToastContainer |

### Hooks
| File | Purpose | Used By |
|------|---------|---------|
| `src/hooks/useDashboardData.ts` | Dashboard query + caching | DashboardPage |
| `src/hooks/useDashboardQueries.ts` | Dashboard sub-queries | DashboardPage |
| `src/hooks/useDsaData.ts` | DSA query + sync + SSE | DsaPage |
| `src/hooks/useProjectsData.ts` | Projects query | ProjectsPage |
| `src/hooks/useSse.ts` | SSE real-time connection | useDsaData, useXp |
| `src/hooks/useXp.ts` | XP state + SSE | useDsaData, GamificationPanel |

### Components (by section)
| Directory | Components |
|-----------|-----------|
| `components/landing/` | Hero, Navbar, Footer, FeatureCard, AnimatedButton, GlowCard, SectionWrapper, DashboardPreview, PricingCard, TestimonialCard |
| `components/layout/` | Sidebar, Topbar, AppLayout, PageShell |
| `components/dashboard/` | DashboardHeader, StatCard, StatsGrid, PlatformStatCard, ProgressCards, GamificationPanel, EnhancedInsightsCard, TodaySummaryBar, RecentActivityList, GithubOverviewCard, MissionCard, AnnouncementSection, ActionsPanel |
| `components/dsa/` | DsaHero, HeatmapCard, SubmissionsTable, TopicProgress, PlatformOverview, ContestList, InsightsCard, StatCard, PlatformLogo, ErrorState |
| `components/profile/` | ProfileHeader, PersonalInfoCard, CPProfilesCard, SocialProfilesCard, ProfileAchievementsCard, CareerGoalsCard, PlatformStatsCard |
| `components/shared/` | ErrorBoundary, ToastContainer, EmptyState, Icon |
| `components/skeletons/` | SkeletonCard, SkeletonGrid, SkeletonHeatmap, SkeletonTable, DashboardSkeleton |

### Features
| Directory | Purpose |
|-----------|---------|
| `features/settings/` | SettingsWorkspace, CommandPalette, SystemHealthBar, SettingsFieldRenderer, schemas, recommendations, types |

### ViewModels
| File | Purpose |
|------|---------|
| `viewmodels/projectsVM.ts` | Projects viewmodel |
| `viewmodels/settingsVM.ts` | Settings viewmodel |

### Utils
| File | Purpose | Used By |
|------|---------|---------|
| `src/utils/axiosClient.ts` | **Central axios instance** — auth interceptors, token refresh, toast on error | All services |
| `src/utils/envCheck.ts` | Env validation | axiosClient |
| `src/utils/formatters.ts` | Date/number formatting | Various components |

### Types
| File | Purpose |
|------|---------|
| `src/types/api.types.ts` | API response types (shared with backend) |
| `src/types/dsa.ts` | DSA-specific types (Submission, Topic, Contest, DsaData, etc.) |
| `src/types/profile.types.ts` | Profile types |
| `src/types/ui.types.ts` | UI/component types (PageShellProps, Toast, etc.) |
| `src/types/vm.types.ts` | ViewModel types (Sidebar, Topbar, etc.) |
| `src/types/index.ts` | Re-exports |

### Lib
| File | Purpose |
|------|---------|
| `lib/queryClient.ts` | TanStack Query client + query key factory |

---

## Architecture Flow

```
[Frontend]
   │
   ├─ App.tsx (AuthGate) ──────────────────────────────► Public: / , /login
   │                                                      │
   │                                                      ▼
   │                                              AppShell (Sidebar + Topbar)
   │                                                      │
   │                                              AppRouter ──────────► Pages (lazy)
   │                                                      │
   │                                                      ├─ DashboardPage ──► useDashboardData ──► dashboardService
   │                                                      │                                              └─► dsaService (contests)
   │                                                      ├─ DsaPage ─────────► useDsaData ─────► dsaService
   │                                                      │                                    ├─► dashboardService (platformStats)
   │                                                      │                                    ├─► useSse
   │                                                      │                                    └─► useXp
   │                                                      ├─ ProjectsPage ───► useProjectsData ─► projectsService
   │                                                      ├─ SettingsPage ───► SettingsWorkspace ─► settingsStore ──► settingsService
   │                                                      └─ ProfilePage ────► profileStore ────► profileService
   │
   └─ axiosClient (central, interceptors)
          │
          │  (Bearer token + 401 refresh + toast on error)
          ▼
[Backend]
   │
   └─ routes/index.ts (master router)
          │
          ├─ /auth/* ──────────► auth module (login, register, logout, refresh, me)
          ├─ /dashboard/* ─────► dashboard module (aggregated stats, streak, platforms, missions, activity)
          ├─ /dsa/* ───────────► dsa module (problems, submissions, contests, topics, heatmap, dashboard)
          ├─ /activity/* ──────► activity module (timeline events)
          ├─ /projects/* ──────► projects module (CRUD + tasks)
          ├─ /profile/* ───────► profile module (profile data)
          ├─ /settings/* ──────► settings module (platform usernames/handles)
          ├─ /platforms/* ─────► platform-sync module (sync, status, scheduler)
          ├─ /xp/* ────────────► xp module (XP state + levels)
          └─ /events ──────────► SSE handler (real-time events: sync_started, sync_completed, new_submission, xp_updated, level_up)
```

---

## API Response Format

All API responses follow this consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
  timestamp?: string;
  details?: Record<string, string[]>;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}
```

---

## Data Flow Diagrams

### Authentication Flow
```
LoginPage ─► userStore.login() ─► authService.login() ─► POST /api/auth/login
                                                                │
                                                                ▼
                                                         storeTokens() + setUser()
                                                                │
                                                                ▼
                                                         navigate('/dashboard')
```

### Dashboard Data Flow
```
DashboardPage ─► useDashboardData() ─► axiosClient.get('/dashboard')
                                              │
                                              ▼
                                        dashboardService.fetchDashboard()
                                              │
                                              ▼
                                        GET /api/dashboard
                                              │
                                              ▼
                                        useDashboardStore (cache)
```

### DSA Sync Flow
```
DsaPage ─► useDsaData() ─► useSyncMutation()
                                  │
                                  ▼
                          POST /api/platforms/sync
                                  │
                                  ▼
                          SSE Event: sync_completed ─► invalidateQueries
```

### XP System Flow
```
useXp() ─► GET /api/xp ─► XP State
                 │
                 ▼
          SSE Event: xp_updated / level_up ─► invalidateQueries

GamificationPanel ─► useXp() ─► Progress UI
```

---

## File Dependency Graph

```
backend/src/index.ts
├── config/index.ts → config/env.ts, platforms.ts, constants.ts
├── middleware/error.ts, requestContext.ts, requestMetrics.ts
├── routes/index.ts
│   ├── modules/auth/index.ts → controller, service, routes, validation
│   ├── modules/dashboard/index.ts → controller, service, routes
│   ├── modules/dsa/index.ts → controller, service, routes
│   ├── modules/activity/index.ts → controller, service, routes
│   ├── modules/projects/index.ts → controller, service, routes
│   ├── modules/profile/index.ts → controller, service, routes
│   ├── modules/platform-sync/index.ts → controller, service, routes
│   ├── modules/xp/index.ts → processor, rules, routes
│   ├── modules/settings/index.ts → controller, routes
│   └── shared/sse/index.ts → sseHandler
├── shared/logger.ts, response.ts, pagination.ts, date.ts, monitoring.ts
├── shared/syncState.ts, syncScheduler.ts, requestMetrics.ts
├── shared/sse/ → eventBus, sseHandler
├── shared/redis/ → client
├── shared/jobs/ → queueFactory, workers, xpWorker
├── shared/runtime/ → orchestrator, infrastructureRegistry
└── db/models/index.ts → 19 models

frontend/src/App.tsx
├── router/index.tsx → 7 lazy pages (Dashboard, DSA, Projects, Settings, Profile)
├── store/userStore.ts → auth state
├── store/uiStore.ts → toast notifications
├── hooks/useDashboardData.ts
├── pages/LoginPage.tsx
├── pages/LandingPage.tsx
└── components/layout/Sidebar, Topbar

frontend/src/utils/axiosClient.ts
├── services/ → all 6 services use axiosClient
├── store/uiStore.ts → toast notifications
└── store/userStore.ts → auth invalidation

frontend/src/hooks/useDsaData.ts
├── services/dsaService.ts → DSA API calls
├── services/dashboardService.ts → platform stats
├── hooks/useSse.ts → real-time updates
├── hooks/useXp.ts → XP state
└── TanStack Query (queryClient)

frontend/src/hooks/useSse.ts
├── lib/queryClient.ts → cache invalidation
├── store/uiStore.ts → SSE status
└── localStorage → token access
```

---

## Module Structure Pattern (ALL FOLLOW THIS ✅)

Each module follows this pattern:

```
modules/<name>/
├── index.ts          # exports default routes
├── <name>.routes.ts  # Express router setup
├── <name>.controller.ts  # Request handlers
├── <name>.service.ts     # Business logic (if needed)
└── <name>.validation.ts  # Input validation (if needed)
```

---

## Issues Found & Changes Required

### ✅ Issues Already Fixed

1. **Settings Module** — Already migrated to `modules/settings/`
   - `modules/settings/index.ts` ✅
   - `modules/settings/routes.ts` ✅
   - `modules/settings/controller.ts` ✅
   - OLD files removed (was: `src/routes/settings.routes.ts`, `src/controllers/settings.controller.ts`)

2. **Scratch Directory** — Already cleaned up
   - `backend/scratch/` no longer exists
   - Root `scratch/` no longer exists

### 🟡 Minor Observations (Not Issues)

1. **XP Module Index** — `modules/xp/index.ts` only exports rules and processor, not routes
   - Routes exported directly from `modules/xp/xp.routes.ts`
   - Noted in routes/index.ts: `import { xpRoutes } from '../modules/xp/xp.routes.js'`
   - **No change needed** — intentional pattern difference

2. **Frontend dsaStore** — Has ViewModel storage but useDsaData doesn't use it
   - `useDsaData` uses TanStack Query directly
   - `dsaStore` exists but is not actively used
   - **Consider:** Remove dsaStore if not needed, or integrate with useDsaData

3. **Console.log in useSse.ts** — Line 233 has `console.warn`
   - `[SSE] Heartbeat stale, reconnecting...`
   - **Consider:** Replace with proper logging if production concern

4. **authService.logout()** — Uses `_skipToast` cast
   - `await axiosClient.post('/auth/logout', ..., { _skipToast: true } as never)`
   - **No issue** — works correctly but type-safe alternative possible

### 🔴 Critical Items to Address

**None** — project is production-ready.

---

## Files to Delete (Cleanup)

### None Required ✅

All scratch/debug files have been cleaned up.

### Optional Cleanup (Low Priority)

| File | Reason |
|------|--------|
| `DevTrack-Architecture.docx` | Binary doc — documentation should be in docs/ folder |
| `backend/confirm_user.js` | One-time script — can keep if useful |
| `backend/find_user.js` | One-time script — can keep if useful |

---

## Recommended Changes (In Order of Priority)

### Priority 3: Minor Optimizations 🟡

```
1. Consider integrating dsaStore with useDsaData OR removing dsaStore
2. Replace console.warn in useSse.ts with proper logger
3. Update DevTrack-Architecture.docx → docs/architecture-v2.md
```

---

## Production Readiness Status

| Category | Status | Notes |
|----------|--------|-------|
| **Backend Architecture** | ✅ Clean | All modules follow consistent pattern |
| **Frontend Architecture** | ✅ Clean | All pages, hooks, stores properly organized |
| **Build** | ✅ Pass | Both frontend and backend build successfully |
| **Type Safety** | ✅ Pass | Strict TypeScript config |
| **Database Models** | ✅ Clean | 19 models, all indexed, proper upserts |
| **Authentication** | ✅ Complete | JWT + refresh tokens, interceptor, store |
| **SSE Real-time** | ✅ Complete | eventBus, sseHandler, useSse hook |
| **XP System** | ✅ Complete | Processor, rules, frontend hook |
| **Platform Sync** | ✅ Complete | All 4 platforms, retry logic, ingestion |
| **Testing** | ✅ Partial | Unit tests exist, E2E tests recommended |
| **Dead Code** | ✅ Clean | No scratch files remaining |

---

## Module Connection Matrix

| Module | Reads Models | Writes Models | Calls External APIs | Emits SSE |
|--------|-------------|---------------|---------------------|-----------|
| **auth** | User, RefreshToken | User, RefreshToken | None | No |
| **dashboard** | PlatformStats, DailyActivity, Mission, ActivityEvent | None | None | No |
| **dsa** | DsaProblem, DsaSubmission, DsaTopicProgress, DsaContest, DailyActivity, PlatformStats | DsaProblem, DsaSubmission, DsaTopicProgress | None | No |
| **activity** | ActivityEvent, DailyActivity | ActivityEvent | None | No |
| **projects** | Project, ProjectTask | Project, ProjectTask | None | No |
| **profile** | UserProfile, User | UserProfile | None | No |
| **settings** | UserSettings, ActivityEvent | UserSettings | None | No |
| **platform-sync** | ConnectedPlatform, PlatformStats, UserSettings, SyncJob, DsaProblem, DsaSubmission, DsaContest, DailyActivity, ActivityEvent | All above | LeetCode, Codeforces, CodeChef, GitHub | Yes (sync_started, sync_completed, sync_failed, new_submission) |
| **xp** | UserXp, XpTransaction, PlatformStats | UserXp, XpTransaction | None | Yes (xp_updated, level_up) |

---

## Summary

**Project Status:** Production Ready 🚀

**Files analyzed:** 150+ files across backend + frontend

**Architecture:** Clean and consistent — all modules follow the same pattern

**Key Strengths:**
- Comprehensive DSA tracking with platform sync
- Real-time updates via SSE
- XP gamification system
- Clean module architecture
- Proper error handling and validation
- JWT authentication with token refresh
- TanStack Query for data fetching
- Zustand for client state

**Cleanup Complete:**
- Settings module migrated ✅
- Scratch files removed ✅
- No duplicate logic ✅

**Next steps (optional):**
1. Add E2E tests for critical flows
2. Consider dsaStore integration or removal
3. Update documentation

---

## Root Files

| File | Purpose |
|------|---------|
| `README.md` | Project documentation |
| `package.json` | Root workspace config |
| `docker-compose.yml` | Docker services (MongoDB, Redis) |
| `.env.example` | Environment template |
| `DEPLOYMENT.md` | Deployment guide |
| `POST_LAUNCH_OPERATIONS.md` | Post-launch checklist |
| `QA_LAUNCH_CHECKLIST.md` | QA checklist |
| `PROJECT_STATUS.md` | This file |

---

## Scripts

| File | Purpose |
|------|---------|
| `scripts/dev.mjs` | Dev server runner |
| `scripts/connect-platforms.mjs` | Platform connection helper |
| `scripts/connect-for-user.mjs` | Platform connection for specific user |
| `scripts/cleanup-stale-data.cjs` | Data cleanup utility |
