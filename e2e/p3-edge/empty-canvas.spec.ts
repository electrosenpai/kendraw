/**
 * @feature Empty canvas edge cases
 * @priority P3
 * @covers Empty canvas export, NMR on empty, properties on empty
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { NmrPanel } from '../pages/NmrPanel';

test.describe('P3 Edge — Empty Canvas @p3', () => {
  test('NMR panel on empty canvas shows no errors', async ({ page, consoleErrors }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const nmr = new NmrPanel(page);
    await nmr.open();
    await page.waitForTimeout(2_000);
    // No page errors should have been recorded
    expect(consoleErrors).toEqual([]);
  });

  test('status bar shows 0a 0b on empty canvas', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });
    await expect(page.locator('text=/0a/')).toBeVisible();
    await expect(page.locator('text=/0b/')).toBeVisible();
  });
});
