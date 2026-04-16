import { test, expect } from '@playwright/test';

test.describe('Kendraw Smoke Tests', () => {
  test('app loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Kendraw');
  });

  test('canvas is visible', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="drawing-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10_000 });
  });

  test('toolbar has tool buttons', async ({ page }) => {
    await page.goto('/');
    // Core drawing tools should be present
    for (const tool of ['select', 'add-atom', 'add-bond', 'ring', 'eraser']) {
      await expect(page.locator(`[data-testid="tool-${tool}"]`)).toBeVisible();
    }
  });

  test('properties panel is visible', async ({ page }) => {
    await page.goto('/');
    // Properties panel renders when a document is open
    const panel = page.locator('[data-testid="properties-panel"]');
    await expect(panel).toBeVisible({ timeout: 10_000 });
  });

  test('status bar shows atom/bond counts', async ({ page }) => {
    await page.goto('/');
    // Empty canvas should show "0a 0b"
    await expect(page.locator('text=/\\d+a\\s+\\d+b/')).toBeVisible({ timeout: 5_000 });
  });
});
