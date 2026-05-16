# DevTrack

> Your complete developer productivity command center.

DevTrack unifies your competitive programming journey and project tracking into one powerful dashboard. Connect your LeetCode, Codeforces, CodeChef, and GitHub accounts to see your entire developer story in one place.

## Why DevTrack?

Most developers juggle multiple platforms to track their progress:

- **LeetCode** for interview prep
- **Codeforces** for contests
- **CodeChef** for additional practice
- **GitHub** for projects
- **Notion/Excel** for notes

DevTrack brings everything together. One dashboard. Complete visibility.

## Features

- **Multi-platform sync** — Connect LeetCode, Codeforces, CodeChef, and GitHub
- **Progress dashboard** — Solved count, ratings, streak analytics
- **Project tracking** — Track your side projects alongside your coding journey
- **Activity history** — See what you worked on, when
- **Dark mode** — Because developers prefer it

## Tech Stack

```
Frontend:  React 19 + Vite + TypeScript + Tailwind + Zustand + React Query
Backend:   Node.js + Express + TypeScript + MongoDB + JWT + Zod
```

## Quick Start

### Docker (Recommended)

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:3001`

### Manual

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Roadmap

DevTrack is evolving in phases:

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Core tracking: multi-platform sync, dashboard, project management | ✅ Live |
| **Phase 2** | Gamification: badges, achievements, streak rewards | 🚧 Coming |
| **Phase 3** | AI-powered insights: personalized recommendations, paid tier with advanced analytics | 🔜 Later |

We're just getting started.

## API

- `GET /health` — Health check
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `GET /api/platforms/sync/:platform` — Sync platform data (Codeforces, LeetCode, etc.)
- `GET /api/problems/stats` — Get aggregated problem stats
- `GET /api/projects` — List your projects
- `POST /api/projects` — Create a project

## Contributing

This is the early version. Issues and PRs welcome.

## License

MIT