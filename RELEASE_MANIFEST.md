# 📋 DevTrack Release Manifest

This document serves as the single source of truth for the **`feature/unified-growth-loop`** release. It audits every modified and untracked file, categorizes them by domain impact, evaluates risk parameters, outlines a safe commit schedule, and identifies files to ignore or review manually.

---

## 🗃️ Codebase Categorization Audit

### 1. Unified Growth Loop
Persistent task lists, Pomodoro stopwatches, active mission drawer cards, and consolidated gamification/streak metrics.

* **Modified Files:**
  - `frontend/src/pages/FocusPage.tsx` (Core task control view)
  - `frontend/src/components/dashboard/PomodoroTimer.tsx` (Timer ticking engine)
  - `frontend/src/components/focus/FocusAnalytics.tsx` (Deep Work velocity graphs)
  - `frontend/src/store/gamificationStore.ts` (Active XP listeners)
* **Untracked Files:**
  - `frontend/src/store/progressionStore.ts` (Consolidated persistent Zustand store)
  - `frontend/src/store/missionStore.ts` (Store delegator for backward compatibility)
  - `frontend/src/components/focus/MissionCard.tsx` (Card widget depicting active missions)
  - `frontend/src/components/focus/MissionControlSection.tsx` (Section manager)
  - `frontend/src/components/focus/NewMissionModal.tsx` (Modal to boot new missions)
  - `frontend/src/components/focus/RuntimeIntelligenceSection.tsx` (Live focus statistics)
  - `frontend/src/components/focus/drawer/` (Focused sidebar analytics drawer)
* **Risk Parameters:**
  - **Purpose:** Provide a persistent gamified environment for daily coding focus.
  - **Why it changed:** Consolidated legacy separated stores (dashboard/mission/gamification) into a single unified `progressionStore` to avoid race conditions.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🟡 Low. Standard Zustand-to-layout connections.

---

### 2. Readiness Intelligence
Skill gap analysis algorithms, dynamic career discovery models, evolution timelines, and career alignment scores.

* **Modified Files:**
  - `backend/src/modules/readiness/readiness.controller.ts` (Core Express controller for domain parameters)
  - `backend/src/modules/readiness/readiness.routes.ts` (Diagnostic router handlers)
  - `backend/src/modules/readiness/index.ts` (Module entrypoint)
  - `frontend/src/services/readinessService.ts` (API connector mapping strictly-typed response models)
  - `frontend/src/pages/readiness/RoadmapIntelligencePage.tsx` (Personalized roadmap interface)
  - `frontend/src/pages/readiness/EvolutionIntelligencePage.tsx` (Growth timeline view)
  - `frontend/src/pages/ReadinessPage.tsx` (Central diagnostics dashboard)
* **Untracked Files:**
  - `backend/src/db/models/readinessBenchmarks.model.ts` (Percentile ranking database schema)
  - `backend/src/db/models/readinessCore.model.ts` (Overall diagnostics dashboard schema)
  - `backend/src/db/models/readinessDsa.model.ts` (Specialized DSA milestones database schema)
  - `backend/src/db/models/readinessProjects.model.ts` (Repository quality / system design signals database schema)
  - `backend/src/db/models/readinessRoadmap.model.ts` (Personalized learning path node database schema)
  - `backend/src/db/models/readinessSkills.model.ts` (Engineering skill maturity database schema)
  - `backend/src/db/models/careerIntent.model.ts` (User goals database schema)
  - `backend/src/db/models/userSkillProgress.model.ts` (Manual skill tracking database schema)
  - `backend/src/db/models/profileTimelineEvent.model.ts` (Timeline log database schema)
  - `backend/src/db/models/intelligenceRecommendation.model.ts` (Scoring weights schema)
  - `backend/src/db/models/recommendation.model.ts` (Active recommendations database schema)
  - `backend/src/db/models/recommendationMemory.model.ts` (Cooldown/re-generation schema)
  - `backend/src/modules/readiness/` (Folder enclosing diagnostic domains)
  - `backend/src/modules/recommendations/` (Engine driving personalized recommendations)
  - `backend/src/modules/persistence/` (Temporal state capture engines)
  - `backend/src/modules/testing/` (Recommendation stability tests)
  - `frontend/src/features/readiness/` (Shared header components and custom query hooks)
* **Risk Parameters:**
  - **Purpose:** Analyze and map developer proficiency against role alignment guidelines.
  - **Why it changed:** Implemented specialized schemas to isolate metrics and dynamically compute gap benchmarks.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🔴 High. Direct impact on core database scoring operations.

---

### 3. Resume Intelligence
CV document parsers, layout keyword indexers, credibility verifiers, and evidence mapping processors.

* **Modified Files:**
  - `frontend/src/services/profileService.ts` (Connects resume profile parameters)
  - `frontend/src/components/profile/PlatformStatsCard.tsx` (Score gauges)
* **Untracked Files:**
  - `backend/src/db/models/resumeProfile.model.ts` (Extracted resume details database schema)
  - `backend/src/db/models/resumeSession.model.ts` (Active upload logs database schema)
  - `backend/src/db/models/resumeVariant.model.ts` (Tailored CV layouts database schema)
  - `backend/src/db/models/resumeVersion.model.ts` (Historical backup database schema)
  - `backend/src/db/models/resumeCredibility.model.ts` (Commit validator database schema)
  - `backend/src/db/models/resumeEvidenceClaim.model.ts` (Extracted claims mapping database schema)
  - `backend/src/db/models/resumeExport.model.ts` (PDF/Word exporter metadata database schema)
  - `backend/src/db/models/atsAnalysis.model.ts` (ATS scoring statistics database schema)
  - `backend/src/db/models/semanticAnalysis.model.ts` (Contextual keyword database schema)
  - `backend/src/db/models/embedding.model.ts` (Vector database embedding schema)
  - `backend/src/modules/resume/` (Resume parsing workspace folder)
  - `backend/src/modules/ai/` (AI wording and dossier builders)
  - `backend/src/modules/ml/` (Vector processing layers)
  - `frontend/src/features/resume-tracker/` (Resume parsing layout workspace)
  - `frontend/src/services/resumeUploadService.ts` (Multipart file upload connectors)
* **Risk Parameters:**
  - **Purpose:** Evaluate claimed proficiencies against active code proofs.
  - **Why it changed:** Created specialized parsing pipeline to parse PDFs and map claims.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🔴 High. Imports third-party parsers and AI connectors.

---

### 4. Analytics
Conversion indicators, feedback ingestion trackers, and administrator beta dashboards.

* **Modified Files:**
  - `frontend/src/pages/admin/BetaDashboardPage.tsx` (Funnel charting and user telemetry console)
  - `frontend/src/pages/AdminPage.tsx` (Route portal)
* **Untracked Files:**
  - `backend/src/db/models/analyticsEvent.model.ts` (Raw event schema)
  - `backend/src/db/models/userFeedback.model.ts` (Written feedback schema)
  - `backend/src/db/models/aiResponseAuditLog.model.ts` (LLM token auditing schema)
  - `backend/src/modules/analytics/` (Analytics routing engine)
  - `frontend/src/services/analyticsService.ts` (Frontend event tracking connector)
* **Risk Parameters:**
  - **Purpose:** Monitor PMF variables, funnels, and UX feedback loops.
  - **Why it changed:** Implemented administrative observability features for the private beta release.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🟡 Low. Administrative and analytics telemetry overlays.

---

### 5. Infrastructure
Singleton SSE channel synchronization, BullMQ factories, deep memory systems, and orchestrator configs.

* **Modified Files:**
  - `backend/src/shared/redis/client.ts` / `index.ts` (Redis connection pooling)
  - `backend/src/shared/jobs/queueFactory.ts` (BullMQ wrapper)
  - `backend/src/shared/jobs/types.ts` / `workers.ts` / `index.ts` (Worker definitions)
  - `backend/src/shared/jobs/dlq.service.ts` (Dead-letter queue router)
  - `backend/src/shared/sse/eventBus.ts` / `sseHandler.ts` (Server-Sent Events multi-tab singleton handler)
  - `backend/src/shared/runtime/orchestrator.ts` / `workerLifecycle.ts` (Process orchestrators)
  - `backend/src/worker-entrypoint.ts` / `index.ts` (Process hooks)
  - `backend/src/middleware/auth.ts` / `error.ts` / `rateLimitAdvanced.ts` (Middlewares)
  - `backend/src/config/constants.ts` / `env.ts` (Config managers)
* **Untracked Files:**
  - `backend/src/db/models/deadLetterJob.model.ts` (DLQ audit database schema)
  - `backend/src/db/models/datasetIngestion.model.ts` (Telemetry database schema)
  - `backend/src/datasets/` (Mock telemetry files)
  - `backend/src/infrastructure/` (Shared services)
  - `backend/src/shared/jobs/platformSyncWorker.ts` (Background crawler)
  - `backend/src/shared/jobs/profileRebuildWorker.ts` (Worker reconstructing core stats)
  - `backend/src/shared/jobs/workers/` (Aggregated background handlers)
  - `backend/src/shared/startup-validation.ts` (DB environment boot validator)
  - `dev-orchestrator/` (Local dev servers orchestrator)
* **Risk Parameters:**
  - **Purpose:** Safeguard monorepo processes, database pooling, and connection stability.
  - **Why it changed:** Introduced distributed background handlers and high-coherence SSE singletons.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🔴 High. Direct structural impact on infrastructure.

---

### 6. Testing
Vitest configurations and frontend end-to-end browser checkers.

* **Modified Files:**
  - `backend/vitest.config.ts` (Vitest loader)
* **Untracked Files:**
  - `backend/src/__tests__/infrastructure/` (Queue resilience checkers)
  - `backend/src/__tests__/modules/` (Resume parsing dossier checkers)
  - `backend/src/__tests__/vitest.setup.ts` (Mongo memory server rig)
  - `frontend/e2e/` (Playwright automated E2E checklists)
  - `frontend/playwright.config.ts` (Playwright configuration)
* **Risk Parameters:**
  - **Purpose:** Guarantee system stability.
  - **Why it changed:** Introduced tests for ATS parsing and job-resilience models.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🟢 Low. Testing framework isolate.

---

### 7. Repository Hygiene
Ignoring developer configuration scrap, metadata files, and environment templates.

* **Modified Files:**
  - `.gitignore` (Ignore list extended for scratch-query scripts and local uploads)
  - `README.md` (Modernized from scratch to map actual implementation)
  - `PROJECT_STATUS.md` (Phase status matrix)
  - `backend/.env.example` / `frontend/.env.example` (Updated templates)
  - `deleted:    .claude/settings.local.json` (Legacy settings cleanly purged)
  - `deleted:    SECURITY.md` (Cleanly purged)
* **Risk Parameters:**
  - **Purpose:** Maintain pristine git trees.
  - **Why it changed:** Kept local telemetry parameters out of index files.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🟢 Low. Pure metadata.

---

### 8. Unrelated Changes
Unrelated auth cleanups, legacy route purges, and telemetry components.

* **Modified Files:**
  - `deleted:    backend/src/db/models/refreshToken.model.ts` (Removed legacy tokens)
  - `deleted:    backend/src/modules/auth/auth.service.ts` / `auth.validation.ts` (Purged redundant structures)
  - `backend/src/modules/auth/auth.controller.ts` / `auth.routes.ts` (Updated routes)
  - `backend/src/modules/coaching/coaching.controller.ts` (Telemetry details)
  - `backend/src/modules/missions/missions.routes.ts` (Delegated to readiness modules)
  - `backend/src/modules/ops/ops.controller.ts` / `ops.routes.ts` (Telemetry console)
  - `backend/src/modules/profile/profile.controller.ts` (Validation connectors)
  - `backend/src/modules/streak/streak.controller.ts` (Active streak indicators)
  - `backend/src/routes/index.ts` (Portal router)
  - `frontend/src/App.tsx` / `main.tsx` / `router/index.tsx` (Route layouts)
  - `frontend/src/components/layout/AppShell.tsx` (Active sidebar navigation links)
  - `frontend/src/store/userStore.ts` / `dashboardStore.ts` (State delegation wrappers)
* **Risk Parameters:**
  - **Purpose:** Streamline authentication controllers and prune duplicate endpoints.
  - **Why it changed:** Aligned routes and cleanups with the new readiness architecture.
  - **Safe to commit:** ✅ Yes. Builds cleanly.
  - **Requires review:** 🟡 Medium. Auth routers must be verified against integration tests.

---

## 🚀 Recommended Staging Order

To ensure commit isolation, group and stage files in the following strict order:

```powershell
# Phase 1: Repository Hygiene & Manifests
git add .gitignore README.md PROJECT_STATUS.md backend/.env.example frontend/.env.example RELEASE_MANIFEST.md

# Phase 2: Core Infrastructure, SSE WebChannels, & Telemetry Logging
git add backend/src/shared/redis/ backend/src/shared/jobs/ backend/src/shared/sse/ backend/src/shared/runtime/ backend/src/worker-entrypoint.ts backend/src/index.ts backend/src/middleware/ backend/src/config/ backend/src/db/models/deadLetterJob.model.ts backend/src/db/models/datasetIngestion.model.ts backend/src/datasets/ backend/src/infrastructure/ backend/src/shared/startup-validation.ts dev-orchestrator/

# Phase 3: Diagnostics Schemas & Readiness Intelligence modules
git add backend/src/db/models/readiness*.model.ts backend/src/db/models/careerIntent.model.ts backend/src/db/models/userSkillProgress.model.ts backend/src/db/models/profileTimelineEvent.model.ts backend/src/db/models/intelligenceRecommendation.model.ts backend/src/db/models/recommendation*.model.ts backend/src/modules/readiness/ backend/src/modules/recommendations/ backend/src/modules/persistence/ backend/src/modules/testing/ frontend/src/features/readiness/ frontend/src/services/readinessService.ts frontend/src/pages/readiness/ frontend/src/pages/ReadinessPage.tsx

# Phase 4: Resume Parsing & ATS scoring Engines
git add backend/src/db/models/resume*.model.ts backend/src/db/models/atsAnalysis.model.ts backend/src/db/models/semanticAnalysis.model.ts backend/src/db/models/embedding.model.ts backend/src/modules/resume/ backend/src/modules/ai/ backend/src/modules/ml/ frontend/src/features/resume-tracker/ frontend/src/services/resumeUploadService.ts frontend/src/services/profileService.ts frontend/src/components/profile/PlatformStatsCard.tsx

# Phase 5: Consolidated Gamification, active Mission stores, & Focus Page UI
git add frontend/src/store/progressionStore.ts frontend/src/store/missionStore.ts frontend/src/pages/FocusPage.tsx frontend/src/components/dashboard/PomodoroTimer.tsx frontend/src/components/focus/ frontend/src/components/shared/

# Phase 6: Beta dash Analytics, Feedback schemas, & Observability
git add backend/src/db/models/analyticsEvent.model.ts backend/src/db/models/userFeedback.model.ts backend/src/db/models/aiResponseAuditLog.model.ts backend/src/modules/analytics/ frontend/src/services/analyticsService.ts frontend/src/pages/admin/ BetaDashboardPage.tsx frontend/src/pages/AdminPage.tsx

# Phase 7: Testing Framework Configs & automated checklists
git add backend/vitest.config.ts backend/src/__tests__/ frontend/e2e/ frontend/playwright.config.ts

# Phase 8: Auth Routings & redundant Legacy Purges
git add backend/src/modules/auth/ frontend/src/App.tsx frontend/src/main.tsx frontend/src/router/index.tsx frontend/src/components/layout/AppShell.tsx backend/src/routes/index.ts backend/src/modules/coaching/ backend/src/modules/missions/ backend/src/modules/ops/ backend/src/modules/profile/ backend/src/modules/streak/ frontend/src/store/userStore.ts frontend/src/store/dashboardStore.ts
```

---

## 📦 Recommended Commit Structure

1. **`chore(repo): update hygiene matrices, ignore policies, and release manifest`** (Phase 1)
2. **`feat(infra): integrate high-coherence SSE singletons and BullMQ DLQ factory`** (Phase 2)
3. **`feat(readiness): introduce diagnostics schemas and adaptive career roadmap`** (Phase 3)
4. **`feat(resume): implement PDF/DOCX parsing and semantic ATS scoring engines`** (Phase 4)
5. **`feat(focus): implement persistent daily mission control and Pomodoro trackers`** (Phase 5)
6. **`feat(ops): add beta conversion funnels and observability telemetry dashboards`** (Phase 6)
7. **`test(ops): add queue resilience tests and playwright automated checklists`** (Phase 7)
8. **`chore(auth): streamline routing tables, clean auth controllers, and purge legacy tokens`** (Phase 8)

---

## ❌ Excluded Files (Do NOT Stage)

The following files are **local developer parameters** or local scratch variables, and have been successfully ignored via the modernized `.gitignore`. Ensure they are **never** staged or committed:
- `backend/.env` (Local developer configuration)
- `frontend/.env` (Local developer configuration)
- `.env` (Monorepo root environment file)
- `backend/src/scratch-query.ts` (Local developer query sandbox)
- `backend/src/scratch-query-v2.ts` (Local developer query sandbox)
- `backend/src/test-fallback.ts` (Local developer test file)
- `backend/src/test-pdf.ts` (Local developer test file)
- `backend/uploads/` (Local resume file upload buffers)

---

## 🔍 Files Requiring Manual Review

The following files represent high-risk operations affecting critical database routines or authentication scopes, and should be carefully peer-reviewed:
1. **[auth.ts](file:///c:/VARSHITHREDDY/projects/DevTrack/backend/src/middleware/auth.ts):** Evaluates authentication checks. Must verify that JWT and Clerk token validations operate smoothly across tabs.
2. **[readiness.controller.ts](file:///c:/VARSHITHREDDY/projects/DevTrack/backend/src/modules/readiness/readiness.controller.ts):** Directs database records and cohort statistics. Ensure read paths leverage `.lean()` correctly to minimize heap allocation.
3. **[queueFactory.ts](file:///c:/VARSHITHREDDY/projects/DevTrack/backend/src/shared/jobs/queueFactory.ts):** Allocates Redis connection blocks. Ensure connections close cleanly during tests to prevent Mongoose/Redis leakage warnings.
