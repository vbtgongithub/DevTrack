# DevTrack E2E Operational Validation Suite

Playwright-based E2E tests that verify **operational intelligence** — real runtime outputs and data persistence — not UI snapshots.

## Philosophy

| We test | We do not test |
|---------|----------------|
| Real ATS scores, embeddings, recommendations | Pixel-perfect UI snapshots |
| Data persistence across reloads | Static mock responses |
| Queue processing and job completion | Component isolation |
| Graceful degradation under failures | Happy-path-only flows |

## Test Suites

| File | Flow |
|------|------|
| `resume-ats-flow.spec.ts` | Upload → ATS parsing; verifies real (non-mocked) scores |
| `semantic-recommendation-flow.spec.ts` | Semantic extraction → recommendations; embedding dimensions |
| `replay-persistence-flow.spec.ts` | Replay generation → render → persistence across reload |
| `failure-scenarios.spec.ts` | Missing AI keys, Redis disconnect, queue stalls, worker recovery |

## Setup

```bash
cd frontend
npm install
npx playwright install
```

### Prerequisites

A running DevTrack stack:

```bash
# From repo root
npm run dev:infra
npm run dev:all
```

Required services:

| Service | Port |
|---------|------|
| Backend API | 3001 |
| Frontend (Vite) | 5173 |
| MongoDB | 27017 |
| Redis | 6379 |

Environment:

- `OPENAI_API_KEY` or `GEMINI_API_KEY` (for intelligence flows)
- `CLERK_SECRET_KEY` + `VITE_CLERK_PUBLISHABLE_KEY` (for auth)

## Running Tests

```bash
npm run test:e2e           # Headless
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:debug     # Debug mode
```

Optional:

```bash
BASE_URL=http://localhost:5173
```

## Test Fixtures

`e2e/fixtures/sample-resume.txt` — sample resume for upload tests.

## Key Assertions

- **Real intelligence:** ATS scores, embeddings, and recommendations are computed, not hardcoded
- **Persistence:** Data survives page reloads
- **Dynamic behavior:** Recommendations change when profile context changes
- **Graceful degradation:** Platform stays functional during partial failures
- **Queue processing:** Jobs complete and queues drain

## Failure Scenarios Tested

- ATS worker failure (503)
- Semantic extraction timeout
- Redis disconnect
- Missing AI API keys
- Queue stalls
- Replay generation failures

All scenarios verify user-friendly error messages and no silent data loss.

## CI

E2E tests are not currently in the PR check workflow (`.github/workflows/pr-checks.yml`). Run locally before merging intelligence-related changes.

## Related Docs

- [../README.md](../README.md) — Full dev setup
- [../../CONTRIBUTING.md](../../CONTRIBUTING.md) — PR testing requirements
