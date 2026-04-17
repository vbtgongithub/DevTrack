---
name: implement-devtrack-backend
description: "Implement DevTrack backend architecture and MongoDB database from frontend contracts and the prior sync pipeline design."
argument-hint: "Scope override (optional): full | foundation | dashboard+dsa | profile+settings | projects+activity"
agent: agent
---
Build the DevTrack backend for the existing frontend, using the current frontend fields as source of truth and the previous architecture principles (sequential platform sync pipeline, cache-first reads, clean layer boundaries).

If an argument is provided, treat it as a scope override. Otherwise implement full scope.

Read these files first:
- [AI context](../../AI_CONTEXT.md)
- [Repo README](../../README.md)
- [Previous architecture doc](../../DevTrack-Architecture.docx)
- [Frontend API contracts](../../frontend/src/types/api.types.ts)
- [Current DSA page contracts](../../frontend/src/types/dsa.ts)
- [Frontend service routes](../../frontend/src/services/dashboardService.ts)
- [Frontend service routes](../../frontend/src/services/dsaService.ts)
- [Frontend service routes](../../frontend/src/services/activityService.ts)
- [Frontend service routes](../../frontend/src/services/projectsService.ts)
- [Frontend service routes](../../frontend/src/services/settingsService.ts)
- [Profile local-store contracts](../../frontend/src/types/profile.types.ts)
- [Profile state usage](../../frontend/src/store/profileStore.ts)
- [Backend entrypoint](../../backend/src/index.ts)

Goal:
Create a production-ready backend in TypeScript + Express that serves all required fields for pages at /, /dsa, /activity, /projects, /profile, /settings with a MongoDB database design.

Constraints:
- Preserve frontend response envelope shapes from api.types.ts.
- Keep architecture modular: route -> controller -> service -> repository -> mapper.
- Validate all request inputs (zod or equivalent).
- Centralize error handling into ApiError-compatible responses.
- Keep platform sync pipeline sequential per platform and cache-aware.
- Add indexes for all query paths used by filters/sorting/pagination.
- No hardcoded secrets; use env vars.

Implement this backend architecture:
- src/config: env, constants, platform config, cache TTLs
- src/db: mongoose connection, models, indexes
- src/modules/auth
- src/modules/user
- src/modules/profile
- src/modules/dashboard
- src/modules/dsa
- src/modules/activity
- src/modules/projects
- src/modules/settings
- src/modules/platform-sync (workers + orchestrator)
- src/middleware: auth, validation, error
- src/shared: pagination, response builders, logger, date helpers
- src/routes: compose all module routers under /api

Page-by-page backend requirements:

1) Dashboard (/)
Fields needed:
- header: displayName, avatarUrl, date, quick stats
- streak: currentStreak, longestStreak, streak history days
- stat cards: totalProblems, totalSubmissions, totalActiveDays, currentStreak, totalProjects, totalCommits
- platform summary: per platform solved counts, difficulty counts, rating, rank, lastSyncedAt
- missions: title, description, targetCount/currentCount, xpReward, expiresAt, status
- recent activity: type/title/description/platform/url/occurredAt
API:
- GET /api/dashboard
- GET /api/dashboard/stats
- GET /api/dashboard/streak
- GET /api/dashboard/platforms
- GET /api/dashboard/missions
- GET /api/dashboard/recent-activity?limit=
Collections:
- activity_events
- daily_activity_rollups
- missions
- connected_platforms
- platform_stats_snapshots
- projects
- dsa_submissions

2) DSA Tracker (/dsa)
Fields needed (current page):
- heatmap: 365 daily counts
- submissions table: id/status/problem/topic/platform/language/date/difficulty
- topics: name/progress
- platform overview: platform + stat
- insights input: submissions + topics + optional rating stat
Fields needed (contracted API):
- problems list with filters and pagination
- category stats and weekly progress
- CRUD for problems, favorite toggle, bulk status update
API:
- GET /api/dsa/problems
- GET /api/dsa/problems/:id
- POST /api/dsa/problems
- PATCH /api/dsa/problems/:id
- DELETE /api/dsa/problems/:id
- POST /api/dsa/problems/:id/favorite
- PATCH /api/dsa/problems/bulk-status
- GET /api/dsa/stats
Compatibility endpoint for current page:
- GET /api/dsa/page
Collections:
- dsa_problems
- dsa_submissions
- dsa_topic_progress
- daily_activity_rollups
Indexes:
- userId + status + difficulty + platform + category
- text index for title/tags
- userId + lastSubmittedAt desc

3) Activity (/activity)
Fields needed:
- yearly heatmap days with per-day activities
- feed items with filters: date range, platform, type, tags
- summary: totals, streaks, byPlatform, byType, avg/day
API:
- GET /api/activity/heatmap?year=
- GET /api/activity/feed?page=&pageSize=&platform=&type=&startDate=&endDate=&tags=
- GET /api/activity/date/:date
- POST /api/activity
- DELETE /api/activity/:id
Collections:
- activity_events
- daily_activity_rollups
Indexes:
- userId + occurredAt desc
- userId + platform + occurredAt desc
- userId + type + occurredAt desc
- userId + tags (multikey)

4) Projects (/projects)
Fields needed:
- list cards with status/visibility/language/stars/forks/issues/last commit/milestones progress
- project stats and language distribution
- detail view: contributors, milestones, tasks
API:
- GET /api/projects
- GET /api/projects/stats
- GET /api/projects/:id
- POST /api/projects
- PATCH /api/projects/:id
- DELETE /api/projects/:id
- GET /api/projects/:id/tasks
- POST /api/projects/:id/tasks
- PATCH /api/projects/:id/tasks/:taskId
- POST /api/projects/:id/sync
Collections:
- projects
- project_tasks
- project_milestones
- project_contributors (or embedded)
Indexes:
- userId + updatedAt desc
- userId + status + visibility + language
- projectId + status + priority + dueDate

5) Profile (/profile)
Fields needed:
- personal info: fullName/email/role/bio
- career goals: targetRole/targetCompanies/techStack
- social links: github/linkedin/portfolio
- cp usernames: leetcode/codeforces/codechef
- aggregated profile header stats: totalSolved, bestRating, streak
- platform stat cards for LeetCode, Codeforces, CodeChef
API:
- GET /api/profile
- PATCH /api/profile
- POST /api/profile/tech-stack
- DELETE /api/profile/tech-stack/:tag
- POST /api/profile/platforms/sync
- GET /api/profile/platforms/stats
Collections:
- users
- user_profiles
- connected_platforms
- platform_stats_snapshots
Indexes:
- users.email unique
- users.username unique
- connected_platforms userId + platform unique

6) Settings (/settings)
Fields needed:
- profile settings + social links
- connected platforms and sync status
- notifications preferences
- appearance preferences
- privacy preferences
API:
- GET /api/settings
- GET /api/settings/profile
- PATCH /api/settings/profile
- POST /api/settings/profile/avatar
- POST /api/settings/password
- GET /api/settings/platforms
- POST /api/settings/platforms/connect
- POST /api/settings/platforms/:platformId/disconnect
- POST /api/settings/platforms/:platformId/sync
- PATCH /api/settings/notifications
- PATCH /api/settings/appearance
- PATCH /api/settings/privacy
- POST /api/settings/account/delete
- GET /api/settings/export
Collections:
- user_settings
- connected_platforms
- users

Auth and session APIs needed by axios interceptor:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me

MongoDB schema baseline (minimum):
- users
- refresh_tokens
- user_profiles
- user_settings
- connected_platforms
- platform_stats_snapshots
- activity_events
- daily_activity_rollups
- dsa_problems
- dsa_submissions
- dsa_topic_progress
- projects
- project_milestones
- project_tasks
- missions
- sync_jobs

Platform sync architecture:
- Keep a worker per platform integration.
- Keep orchestrator sequential (for each connected platform).
- Pipeline per platform: check cache -> fetch remote if stale -> persist snapshot -> update rollups.
- Do not fail whole sync when one platform fails. Capture per-platform errors.
- Return partial success with detailed sync summary.

Implementation phases:
1. Foundation: env config, db connection, shared response/error middleware, auth middleware, base module scaffolds.
2. Data layer: mongoose schemas + indexes + seed data for one demo user.
3. Core APIs: dashboard, dsa, activity, projects, profile, settings.
4. Platform sync module: workers + orchestrator + cache TTL handling.
5. Hardening: request validation, pagination/sorting guards, rate limiting, logging.
6. Verification: build, lint, and endpoint smoke checks.

Validation checklist:
- backend build passes: npm run build
- backend dev server starts and /health works
- all service routes in frontend resolve with ApiResponse-compatible payloads
- filtering, sorting, pagination parameters behave as expected
- auth refresh flow works with axios interceptor contract

Required output from you:
1. Summary of architecture decisions and why.
2. Exact file tree created/updated in backend.
3. List of implemented endpoints grouped by module.
4. MongoDB collections, key fields, and indexes implemented.
5. Any gaps, TODOs, or assumptions.

Do not stop at planning. Implement code in this repository.