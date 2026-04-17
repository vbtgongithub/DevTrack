# DevTrack

DevTrack is split into a frontend (React + Vite + TypeScript) and a backend (Node + Express + TypeScript).

## Repo Structure

- `frontend/` — web app
- `backend/` — API server (planned/early scaffold)
- `docs/` — documentation

## Docker Setup

Run the backend and MongoDB together with Docker Compose from the repo root:

```bash
docker compose up --build
```

Or use the PowerShell launcher from the workspace root that contains this repo:

```powershell
.\start-backend-and-db.ps1
```

The stack exposes:

- MongoDB on `localhost:27017`
- Backend on `localhost:3001`

Requirements:

- Docker Desktop installed and running
- PowerShell for the launcher script

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Build:

```bash
cd frontend
npm run build
```

## Backend

```bash
cd backend
npm install
npm run dev
```

Health check: `GET /health`

## Environment

The backend reads its local development settings from `backend/.env` when present. The provided Docker setup uses the built-in development defaults for JWT and CORS, while MongoDB runs in the `mongo` Compose service.
