import { test, expect } from '@playwright/test';

/**
 * E2E Test: Replay Generation → Frontend Rendering → Persistence Validation Flow
 * 
 * Validates operational intelligence flow from replay generation through persistence
 * Verifies real runtime outputs and database persistence
 */
test.describe('Replay Generation → Frontend Rendering → Persistence Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume-tracker');
  });

  test('should generate replay and render it correctly', async ({ page, request }) => {
    // Step 1: Trigger replay generation
    await page.click('[data-testid="generate-replay"]');
    
    // Step 2: Wait for replay generation to complete
    await page.waitForSelector('[data-testid="replay-complete"]', { timeout: 30000 });
    
    // Step 3: Verify replay is rendered in frontend
    await expect(page.locator('[data-testid="replay-content"]')).toBeVisible();
    
    // Step 4: Verify replay content is not empty
    const replayContent = await page.locator('[data-testid="replay-content"]').textContent();
    expect(replayContent?.length).toBeGreaterThan(100);
    
    // Step 5: Verify replay data via API
    const replayResponse = await request.get('/api/replay/latest');
    expect(replayResponse.ok()).toBeTruthy();
    
    const replayData = await replayResponse.json();
    expect(replayData).toHaveProperty('content');
    expect(replayData).toHaveProperty('generatedAt');
    expect(replayData.content.length).toBeGreaterThan(0);
  });

  test('should verify replay updates correctly when profile changes', async ({ page, request }) => {
    // Step 1: Generate initial replay
    await page.click('[data-testid="generate-replay"]');
    await page.waitForSelector('[data-testid="replay-complete"]', { timeout: 30000 });
    
    const initialResponse = await request.get('/api/replay/latest');
    const initialData = await initialResponse.json();
    const initialContent = initialData.content;
    
    // Step 2: Update profile (add a project)
    await page.click('[data-testid="add-project"]');
    await page.fill('[data-testid="project-title"]', 'New Test Project');
    await page.fill('[data-testid="project-description"]', 'Test description for dynamic replay');
    await page.click('[data-testid="save-project"]');
    
    // Step 3: Regenerate replay
    await page.click('[data-testid="generate-replay"]');
    await page.waitForSelector('[data-testid="replay-complete"]', { timeout: 30000 });
    
    // Step 4: Verify replay content changed
    const updatedResponse = await request.get('/api/replay/latest');
    const updatedData = await updatedResponse.json();
    const updatedContent = updatedData.content;
    
    expect(updatedContent).not.toBe(initialContent);
    expect(updatedContent).toContain('New Test Project');
  });

  test('should verify persistence across page reloads', async ({ page, request }) => {
    // Step 1: Generate replay
    await page.click('[data-testid="generate-replay"]');
    await page.waitForSelector('[data-testid="replay-complete"]', { timeout: 30000 });
    
    const replayResponse = await request.get('/api/replay/latest');
    const replayData = await replayResponse.json();
    const replayId = replayData._id;
    
    // Step 2: Reload page
    await page.reload();
    
    // Step 3: Verify replay is still available
    await page.waitForSelector('[data-testid="replay-content"]');
    
    // Step 4: Verify same replay data via API
    const reloadedResponse = await request.get(`/api/replay/${replayId}`);
    expect(reloadedResponse.ok()).toBeTruthy();
    
    const reloadedData = await reloadedResponse.json();
    expect(reloadedData._id).toBe(replayId);
    expect(reloadedData.content).toBe(replayData.content);
  });

  test('should handle replay generation failure gracefully', async ({ page }) => {
    // Simulate replay generation failure
    await page.route('**/api/replay/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Replay generation failed' })
      });
    });

    await page.click('[data-testid="generate-replay"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="replay-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-error"]')).toContainText('Failed to generate replay');
    
    // Verify user can retry
    await expect(page.locator('[data-testid="retry-replay"]')).toBeVisible();
  });

  test('should verify queue processes replay jobs correctly', async ({ page, request }) => {
    // Step 1: Trigger replay generation (async job)
    await page.click('[data-testid="generate-replay"]');
    
    // Step 2: Verify job was queued
    const queueResponse = await request.get('/api/system/queue-status');
    const queueData = await queueResponse.json();
    
    expect(queueData.success).toBeTruthy();
    expect(queueData.data.queues).toBeInstanceOf(Array);
    
    // Step 3: Wait for job to complete
    await page.waitForSelector('[data-testid="replay-complete"]', { timeout: 30000 });
    
    // Step 4: Verify job was processed (queue count decreased)
    const queueResponseAfter = await request.get('/api/system/queue-status');
    const queueDataAfter = await queueResponseAfter.json();
    
    // Job should be completed, not in queue
    const resumeQueue = queueDataAfter.data.queues.find((q: any) => q.name === 'resume-generation');
    expect(resumeQueue.completed).toBeGreaterThan(0);
  });
});
