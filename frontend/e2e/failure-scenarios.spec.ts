import { test, expect } from '@playwright/test';

/**
 * E2E Test: Failure Scenarios & Graceful Degradation
 * 
 * Validates platform degrades gracefully under various failure conditions:
 * - ATS worker failure
 * - Semantic timeout
 * - Redis disconnect
 * - Missing API keys
 * - Queue stalls
 * - Replay failures
 */
test.describe('Failure Scenarios & Graceful Degradation', () => {
  test('should handle missing AI provider gracefully', async ({ page }) => {
    // Simulate missing AI API keys by mocking the response
    await page.route('**/api/ai/generate', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'AI services unavailable',
          degraded: true,
          fallback: 'Using deterministic fallback' 
        })
      });
    });

    await page.goto('/readiness');
    await page.click('[data-testid="generate-guidance"]');

    // Verify degraded mode notification
    await expect(page.locator('[data-testid="degraded-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="degraded-notice"]')).toContainText('AI services temporarily unavailable');
    
    // Verify fallback content is still shown
    await expect(page.locator('[data-testid="guidance-content"]')).toBeVisible();
  });

  test('should handle Redis disconnect gracefully', async ({ page, request }) => {
    // Simulate Redis disconnect by mocking health endpoint
    await page.route('**/api/system/queue-status', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Redis connection lost',
          redis: { status: 'disconnected' }
        })
      });
    });

    await page.goto('/dashboard');

    // Verify Redis disconnect notification
    await expect(page.locator('[data-testid="redis-warning"]')).toBeVisible();
    
    // Verify dashboard still renders with cached data
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
  });

  test('should handle queue stall and retry', async ({ page, request }) => {
    // Simulate queue stall by mocking queue status
    let stallCount = 0;
    await page.route('**/api/system/queue-status', route => {
      stallCount++;
      if (stallCount < 3) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            queues: [
              { name: 'resume-generation', active: 5, waiting: 100, failed: 0 }
            ],
            stalled: true
          })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/resume-tracker');
    await page.click('[data-testid="generate-replay"]');

    // Verify queue stall notification
    await expect(page.locator('[data-testid="queue-stall-notice"]')).toBeVisible();
    
    // Verify retry mechanism kicks in
    await page.waitForSelector('[data-testid="retry-active"]', { timeout: 10000 });
    
    // Verify queue recovers
    await page.waitForSelector('[data-testid="queue-recovered"]', { timeout: 20000 });
  });

  test('should handle worker restart recovery', async ({ page, request }) => {
    // Simulate worker restart by mocking worker status
    let restartCount = 0;
    await page.route('**/api/system/infrastructure', route => {
      restartCount++;
      if (restartCount < 2) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            platformSyncWorker: { status: 'restarting' },
            degraded: true,
            degradedComponents: ['platformSyncWorker']
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            platformSyncWorker: { status: 'healthy' },
            degraded: false,
            degradedComponents: []
          })
        });
      }
    });

    await page.goto('/dashboard');

    // Verify worker restart notification
    await expect(page.locator('[data-testid="worker-restart-notice"]')).toBeVisible();
    
    // Verify worker recovers
    await page.waitForSelector('[data-testid="worker-recovered"]', { timeout: 15000 });
    
    // Verify functionality restored
    await expect(page.locator('[data-testid="sync-button"]')).toBeEnabled();
  });

  test('should handle session persistence during failures', async ({ page }) => {
    // Step 1: Login and create session
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('/dashboard');
    
    // Step 2: Simulate session server failure
    await page.route('**/api/auth/refresh', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Auth service unavailable' })
      });
    });

    // Step 3: Navigate to another page
    await page.goto('/projects');
    
    // Step 4: Verify session persisted locally (user not logged out)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Step 5: Verify graceful degradation message
    await expect(page.locator('[data-testid="session-warning"]')).toBeVisible();
  });

  test('should handle concurrent operation failures', async ({ page }) => {
    // Simulate multiple concurrent failures
    await page.route('**/api/ai/generate', route => {
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'AI unavailable' }) });
    });
    await page.route('**/api/semantic/extract', route => {
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'Semantic unavailable' }) });
    });
    await page.route('**/api/replay/generate', route => {
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'Replay unavailable' }) });
    });

    await page.goto('/readiness');
    await page.click('[data-testid="analyze-all"]');

    // Verify comprehensive degraded mode
    await expect(page.locator('[data-testid="comprehensive-degraded"]')).toBeVisible();
    
    // Verify multiple service warnings
    const warnings = page.locator('[data-testid^="service-warning"]');
    await expect(warnings).toHaveCount(3);
    
    // Verify core functionality still works
    await expect(page.locator('[data-testid="readiness-dashboard"]')).toBeVisible();
  });
});
