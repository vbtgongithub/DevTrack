# DevTrack E2E Operational Validation Suite

## Overview

This Playwright-based E2E testing suite validates **operational intelligence** flows in DevTrack, focusing on real runtime outputs and data persistence rather than UI snapshot testing.

## Testing Philosophy

**NOT:** UI snapshot testing
**YES:** Operational intelligence verification

Tests verify:
- Real runtime outputs (embeddings, ATS scores, recommendations)
- Data persistence across page reloads
- Queue processing and job completion
- Graceful degradation under failures
- Dynamic behavior (recommendations change with context)

## Test Structure

### Critical Flow Tests

1. **resume-ats-flow.spec.ts**
   - Resume Upload → ATS Parsing
   - Verifies ATS outputs are real (not mocked)
   - Tests ATS worker failure handling

2. **semantic-recommendation-flow.spec.ts**
   - Semantic Extraction → Recommendation Generation
   - Verifies embeddings persist with correct dimensions
   - Tests dynamic recommendation updates

3. **replay-persistence-flow.spec.ts**
   - Replay Generation → Frontend Rendering → Persistence
   - Verifies replay content updates with profile changes
   - Tests persistence across page reloads
   - Validates queue processing

### Failure Scenario Tests

4. **failure-scenarios.spec.ts**
   - Missing AI provider handling
   - Redis disconnect graceful degradation
   - Queue stall and retry mechanism
   - Worker restart recovery
   - Session persistence during failures
   - Concurrent operation failures

## Running Tests

### Install Dependencies
```bash
cd frontend
npm install
npx playwright install
```

### Run All Tests
```bash
npm run test:e2e
```

### Run with UI
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

## Test Data

Test fixtures are located in `e2e/fixtures/`:
- `sample-resume.txt` - Sample resume for upload tests

## Requirements

Tests require:
- Backend running on port 3001
- Frontend running on port 5173
- MongoDB connection
- Redis connection
- AI API keys (OPENAI_API_KEY or GEMINI_API_KEY)

## Environment Variables

```bash
BASE_URL=http://localhost:5173
```

## Key Assertions

Tests verify:
- **Real Intelligence:** ATS scores, embeddings, recommendations are computed (not hardcoded)
- **Persistence:** Data survives page reloads and service restarts
- **Dynamic Behavior:** Recommendations change when context changes
- **Graceful Degradation:** Platform remains functional during partial failures
- **Queue Processing:** Jobs complete and queues drain correctly

## Failure Testing

Tests simulate:
- ATS worker failure (503 errors)
- Semantic extraction timeout
- Redis disconnect
- Missing AI API keys
- Queue stalls
- Replay generation failures

All failure scenarios verify graceful degradation with user-friendly error messages.
