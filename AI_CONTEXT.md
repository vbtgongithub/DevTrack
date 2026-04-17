# DevTrack - Project Context

## Project Overview
DevTrack is a modern web application designed for developers to track their progress, particularly in DSA (Data Structures and Algorithms), personal projects, and overall activity. It consists of a React-based frontend and an Express/Node.js backend.

## Tech Stack
### Frontend
- **Framework**: React.js with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Vanilla CSS (`index.css` with dynamic design elements)
- **Routing**: `react-router-dom`
- **State Management**: Zustand-style hooks or Context-based stores (`store/userStore.ts`)
- **UI Architecture**: Shell layout with Sidebar and Topbar

### Backend
- **Framework**: Node.js & Express
- **Language**: TypeScript
- **State**: Early scaffold / Health check endpoints (`/health`)

## Folder Structure
```text
DevTrack/
├── README.md               - Project documentation
├── frontend/               - React SPA
│   ├── index.html
│   ├── package.json        - Frontend dependencies
│   ├── src/                - Frontend source rules
│   │   ├── components/     - Reusable UI components (layout, dsa, shared)
│   │   ├── pages/          - Route pages (DsaPage, ActivityPage, ProjectsPage, SettingsPage)
│   │   ├── hooks/          - Custom React hooks (e.g. useDsaData)
│   │   ├── store/          - State management
│   │   ├── router/         - Application routing
│   │   ├── types/          - TypeScript interfaces/types
│   │   ├── services/       - API calls and business logic
│   │   ├── utils/          - Helper functions
│   │   └── index.css       - Global styles / Custom CSS variables
├── backend/                - API Server
│   ├── src/                - Backend source code
│   │   └── index.ts        - Express entry point
│   └── package.json        - Backend dependencies
```

## Core Features & Pages
1. **Dashboard (`/`)**: Main entry point and overview.
2. **DSA Tracker (`/dsa`)**: 
   - Uses `DsaPage.tsx`
   - Features: Activity Heatmap (GitHub style), Recent Submissions table, Topic Mastery progress, Platform Overview, Insights.
   - Fetches data via `useDsaData` hook (falls back to mock data).
3. **Projects (`/projects`)**: Tracks personal coding projects.
4. **Activity (`/activity`)**: General developer activity feed.
5. **Profile / Settings (`/profile`, `/settings`)**: User management.

## Current State & Next Steps
- The frontend is well-structured with mock data integration (e.g., `mockData` from `mocks/dsaMockData.ts`).
- The backend is a minimal stub (`app.get('/health')`).
- Visuals are geared towards a modern aesthetic (fades, pulses, custom CSS variables, Tailwind classes).

## Notes for AI Assistant
- Update this file whenever new major architectural decisions are made or as the backend develops.
- Prioritize visual excellence as requested by project standards (rich aesthetics, modern typography, micro-animations).
