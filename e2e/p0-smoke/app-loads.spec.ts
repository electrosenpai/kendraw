/**
 * @feature Application startup
 * @priority P0
 * @covers App loads, canvas renders, toolbar present
 */

import { test, expect } from '../fixtures/base-test';
import { ToolPalette } from '../pages/ToolPalette';

test.describe('P0 Smoke — App Startup @p0', () => {
  test('app loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Kendraw');
  });

  test('canvas renders with non-zero dimensions', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="drawing-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10_000 });
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);
  });

  test('all core toolbar tools are present and clickable', async ({ page }) => {
    await page.goto('/');
    const toolbar = new ToolPalette(page);
    const coreTtools = ['select', 'add-atom', 'add-bond', 'ring', 'eraser'] as const;
    for (const id of coreTtools) {
      await toolbar.assertToolVisible(id);
    }
    // Click each tool — should not throw
    for (const id of coreTtools) {
      await toolbar.selectTool(id);
    }
  });

  test('properties panel shows data after import', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });
    // Import ethanol
    await page.keyboard.press('Control+i');
    const textarea = page.locator('textarea[placeholder*="Paste"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill('CCO');
    await page.locator('button', { hasText: /^Import$/ }).click();
    await page.waitForTimeout(1_200);
    // Properties panel should show formula
    const panel = page.locator('[data-testid="properties-panel"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('text=Formula')).toBeVisible();
  });

  test('status bar shows atom/bond counts', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });
    await expect(page.locator('text=/\\d+a\\s+\\d+b/')).toBeVisible({
      timeout: 5_000,
    });
  });
});
