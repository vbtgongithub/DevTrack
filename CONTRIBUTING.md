# Contributing Guidelines (CONTRIBUTING.md)

Welcome! Thank you for contributing to DevTrack. To maintain high code quality, operational resilience, and architectural cohesion, please follow the guidelines and patterns outlined below.

---

## 🏗️ Architecture Conventions

DevTrack is a monorepo consisting of:
1. `/backend` — Express 5 + MongoDB + Redis + BullMQ (domain-driven modules)
2. `/frontend` — React 19 + Vite + Zustand + Tailwind CSS

---

## 💻 Backend Coding Patterns

All backend features must reside inside domain-specific subdirectories under `backend/src/modules/`.
Each module should use the standard barrel pattern:

```
backend/src/modules/<module-name>/
├── index.ts              # Exports routes and public services
├── <module-name>.routes.ts  # Express routes configuration
├── <module-name>.controller.ts # Validates request payloads and maps responses
├── <module-name>.service.ts    # Contains business and persistence logic
└── <module-name>.validation.ts # Zod schemas for input validation
```

### Key Practices:
- **No Console Logging**: Always use the unified winston logger (`import logger from '../../shared/logger'`).
- **No Silent Failures**: Propagate errors cleanly to the Express error boundary using custom HTTP Exceptions (e.g., `BadRequestException`, `UnauthorizedException`).
- **Strict Zod Validation**: Never trust client inputs. Always validate the request body, queries, and params before processing.

---

## 🎨 Frontend Styling & Component Architecture

### Component Organization
- **`/src/components/ui/`**: Low-level, generic, stateless UI elements (buttons, inputs, tooltips, loaders).
- **`/src/components/layout/`**: Global layout shells (AppShell, PageShell).
- **`/src/features/<feature-name>/`**: High-level, state-connected sub-features (e.g., Onboarding, Notification drawer, board views).

### Styling Guidelines
- Use native **Vanilla Tailwind CSS v4** patterns. Avoid inline Tailwind directives or raw ad-hoc classes.
- Ensure proper accessibility tags (`aria-label`, `role="dialog"`, etc.) are attached to interactive interfaces.
- Optimize rendering performance by avoiding excessive inline arrow functions or expensive non-memoized state derivations in React render loops.

---

## 🧪 Testing Requirements

We enforce strict test coverage requirements:
- **Unit & Integration Tests**: Written with **Vitest**.
- **Running Tests**:
  - Backend: Run `npm run test` in `/backend` to check the suite.
  - Make sure all mock assertions clean up after themselves cleanly using `afterEach` and `afterAll` connection terminations.

---

## 🌿 Branch & Git Flow

To keep the history pristine and professional:
- **Branch Naming**:
  - Features: `feat/short-description`
  - Bug fixes: `fix/short-description`
  - Optimization/Hardening: `harden/short-description`
  - Documentation: `docs/short-description`
- **Prerequisites for PR Creation**:
  1. Ensure both `/frontend` and `/backend` build cleanly without TypeScript errors:
     ```bash
     npm run build
     ```
  2. Run the test suite and verify 100% pass rates:
     ```bash
     npm run test
     ```
  3. Ensure no trailing debug comments (`console.log`, `TODO`) are committed.
