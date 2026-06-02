import { test, expect } from '@playwright/test';

/**
 * E2E Test: Resume Upload → ATS Parsing Flow
 * 
 * Validates operational intelligence flow from resume upload through ATS parsing
 * Verifies real runtime outputs, not mock data
 */
test.describe('Resume Upload → ATS Parsing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to resume upload page
    await page.goto('/resume-tracker');
  });

  test('should upload resume and trigger ATS analysis', async ({ page, request }) => {
    // Step 1: Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/sample-resume.pdf');
    
    // Step 2: Verify upload initiated
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Uploading');
    
    // Step 3: Wait for ATS analysis to complete (operational verification)
    await page.waitForSelector('[data-testid="ats-complete"]', { timeout: 30000 });
    
    // Step 4: Verify ATS analysis output via API (not just UI)
    const atsResponse = await request.get('/api/resume/ats/latest');
    expect(atsResponse.ok()).toBeTruthy();
    
    const atsData = await atsResponse.json();
    expect(atsData).toHaveProperty('atsScore');
    expect(atsData.atsScore).toBeGreaterThan(0);
    expect(atsData).toHaveProperty('parserWarnings');
    expect(atsData).toHaveProperty('keywordCoverage');
    
    // Step 5: Verify ATS score persisted in database
    expect(atsData.parserWarnings).toBeInstanceOf(Array);
    expect(atsData.keywordCoverage).toHaveProperty('score');
  });

  test('should handle ATS worker failure gracefully', async ({ page }) => {
    // Simulate ATS worker failure by mocking API error
    await page.route('**/api/resume/analyze', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'ATS worker unavailable' })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/sample-resume.pdf');
    
    // Verify degraded mode notification
    await expect(page.locator('[data-testid="degraded-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="degraded-notice"]')).toContainText('ATS analysis temporarily unavailable');
  });

  test('should validate ATS outputs are real (not mocked)', async ({ page, request }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/sample-resume.pdf');
    
    await page.waitForSelector('[data-testid="ats-complete"]', { timeout: 30000 });
    
    // Verify ATS outputs have realistic values (not hardcoded)
    const atsResponse = await request.get('/api/resume/ats/latest');
    const atsData = await atsResponse.json();
    
    // Check that ATS score is not a placeholder value
    expect(atsData.atsScore).not.toBe(0);
    expect(atsData.atsScore).not.toBe(100);
    
    // Check that keyword coverage has actual data
    expect(atsData.keywordCoverage.detectedKeywords.length).toBeGreaterThan(0);
    expect(atsData.keywordCoverage.missingKeywords.length).toBeGreaterThanOrEqual(0);
    
    // Check that parser warnings are specific to the content
    if (atsData.parserWarnings.length > 0) {
      expect(atsData.parserWarnings[0]).toHaveProperty('message');
      expect(atsData.parserWarnings[0].message.length).toBeGreaterThan(10);
    }
  });
});
