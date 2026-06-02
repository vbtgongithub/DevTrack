import { test, expect } from '@playwright/test';

/**
 * E2E Test: Semantic Extraction → Recommendation Generation Flow
 * 
 * Validates operational intelligence flow from semantic extraction through recommendation generation
 * Verifies real runtime outputs and dynamic behavior
 */
test.describe('Semantic Extraction → Recommendation Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/readiness');
  });

  test('should generate semantic embeddings and persist them', async ({ page, request }) => {
    // Step 1: Trigger semantic analysis
    await page.click('[data-testid="analyze-semantic"]');
    
    // Step 2: Wait for semantic extraction to complete
    await page.waitForSelector('[data-testid="semantic-complete"]', { timeout: 30000 });
    
    // Step 3: Verify embeddings are persisted via API
    const embeddingsResponse = await request.get('/api/semantic/embeddings/latest');
    expect(embeddingsResponse.ok()).toBeTruthy();
    
    const embeddingsData = await embeddingsResponse.json();
    expect(embeddingsData).toHaveProperty('vector');
    expect(embeddingsData.vector).toBeInstanceOf(Array);
    expect(embeddingsData.vector.length).toBeGreaterThan(0);
    
    // Step 4: Verify embedding dimensions match expected (e.g., 1536 for OpenAI)
    expect(embeddingsData.vector.length).toBe(1536);
    
    // Step 5: Verify embedding is not all zeros (real computation)
    const sum = embeddingsData.vector.reduce((a: number, b: number) => a + Math.abs(b), 0);
    expect(sum).toBeGreaterThan(0);
  });

  test('should generate dynamic recommendations that change with context', async ({ page, request }) => {
    // Step 1: Get initial recommendations
    const initialResponse = await request.get('/api/recommendations');
    const initialData = await initialResponse.json();
    const initialCount = initialData.recommendations.length;
    
    // Step 2: Update user context (e.g., add a new skill)
    await page.click('[data-testid="add-skill"]');
    await page.fill('[data-testid="skill-input"]', 'Kubernetes');
    await page.click('[data-testid="save-skill"]');
    
    // Step 3: Wait for recommendations to update
    await page.waitForTimeout(2000);
    
    // Step 4: Get updated recommendations
    const updatedResponse = await request.get('/api/recommendations');
    const updatedData = await updatedResponse.json();
    
    // Step 5: Verify recommendations changed (dynamic behavior)
    expect(updatedData.recommendations.length).toBeGreaterThan(0);
    
    // Step 6: Verify recommendations are not static (different from initial)
    const initialIds = initialData.recommendations.map((r: any) => r.id);
    const updatedIds = updatedData.recommendations.map((r: any) => r.id);
    
    // At least some recommendations should be different
    const hasNewRecommendations = updatedIds.some((id: string) => !initialIds.includes(id));
    expect(hasNewRecommendations).toBeTruthy();
  });

  test('should handle semantic timeout gracefully', async ({ page }) => {
    // Simulate semantic extraction timeout
    await page.route('**/api/semantic/extract', route => {
      setTimeout(() => {
        route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Semantic extraction timeout' })
        });
      }, 35000); // Exceed default timeout
    });

    await page.click('[data-testid="analyze-semantic"]');
    
    // Verify timeout handling
    await expect(page.locator('[data-testid="timeout-notice"]')).toBeVisible({ timeout: 40000 });
    await expect(page.locator('[data-testid="timeout-notice"]')).toContainText('Semantic extraction timed out');
  });

  test('should verify recommendations are real (not mocked)', async ({ page, request }) => {
    const recommendationsResponse = await request.get('/api/recommendations');
    const recommendationsData = await recommendationsResponse.json();
    
    // Verify recommendations have realistic structure
    expect(recommendationsData.recommendations).toBeInstanceOf(Array);
    expect(recommendationsData.recommendations.length).toBeGreaterThan(0);
    
    const firstRec = recommendationsData.recommendations[0];
    expect(firstRec).toHaveProperty('title');
    expect(firstRec).toHaveProperty('description');
    expect(firstRec).toHaveProperty('relevanceScore');
    
    // Verify relevance score is realistic (not placeholder)
    expect(firstRec.relevanceScore).toBeGreaterThan(0);
    expect(firstRec.relevanceScore).toBeLessThanOrEqual(1);
    
    // Verify title is not generic
    expect(firstRec.title.length).toBeGreaterThan(5);
    expect(firstRec.title).not.toBe('Sample Recommendation');
  });
});
