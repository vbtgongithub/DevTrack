/**
 * DevTrack AI Reference Project Entrypoint
 * 
 * This file serves as the system-wide architecture overview and module boundary reference
 * for AI tools, code generation, and developer onboarding.
 * 
 * DevTrack is structured as a Modular Monolith. Do not create duplicate logic across these
 * boundaries. Re-use existing services and helpers inside each domain.
 */

// 1. Module Boundaries Definition
export const MODULES = {
  AUTHENTICATION: {
    purpose: "Handles Clerk JWT session verification and route guards.",
    mainFile: "backend/src/middleware/auth.ts",
  },
  PLATFORM_SYNC: {
    purpose: "Ingests developer solves and statistics from LeetCode, CodeForces, CodeChef, and GitHub.",
    mainFile: "backend/src/modules/platform-sync/sync.service.ts",
  },
  RESUME_INTELLIGENCE: {
    purpose: "Orchestrates multi-stage parsing, embedding, and LLM advice via BullMQ queues.",
    mainFile: "backend/src/modules/resume/orchestration/ResumeProcessingOrchestrator.ts",
  },
  BEHAVIORAL_TELEMETRY: {
    purpose: "Tracks frontend Pomodoro, focus, and onboarding interaction telemetries.",
    mainFile: "backend/src/modules/activity/activity.service.ts",
  },
};

// 2. High-Level Dependency Schema
export const ARCHITECTURE_FLOW = `
 [Frontend (Vite + React)] 
            │
            ▼ (Secure API requests synchronized via Clerk Axios Client)
  [Express API Router]
            │
  ┌─────────┴─────────┐
  ▼                   ▼
[Domain Services]  [BullMQ Job Queues]
  │                   │
  ▼                   ▼
[MongoDB Query]    [Background Workers (XP, Ingestion, Resume parsing)]
`;

export function getSystemVerificationCommand(): string {
  return "npm run dev:all";
}
