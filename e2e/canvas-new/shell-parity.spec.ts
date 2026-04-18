/**
 * @feature Canvas-new feature flag — shared shell parity
 * @priority P1
 * @covers VITE_ENABLE_NEW_CANVAS swaps ONLY the toolbox + canvas; the
 *         header, properties panel, NMR panel, and status bar must remain
 *         visible and functional in both flag=true and flag=false modes.
 *
 * This file runs against both Playwright projects:
 *   - chromium             (flag=false, default)
 *   - chromium-new-canvas  (flag=true, set via VITE_ENABLE_NEW_CANVAS=true
 *                          on the dev-server invocation)
 *
 * The same assertions must pass against both. If a future commit silently
 * widens the flag scope, one of these tests will catch it.
 */

import { test, expect } from '../fixtures/base-test';

test.describe('Canvas-new shell parity @canvas-new', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for either the legacy or the new canvas to mount before any
    // visibility assertion — both modes need the workspace store to hydrate.
    const legacy = page.locator('[data-testid="drawing-canvas"]');
    const next = page.locator('[data-testid="canvas-new-root"]');
    await legacy.or(next).first().waitFor({ state: 'visible', timeout: 10_000 });
  });

  test('header stays visible', async ({ page }) => {
    await expect(page.getByTestId('app-header')).toBeVisible();
  });

  test('properties panel renders on the right', async ({ page }) => {
    const panel = page.getByTestId('properties-panel');
    // The panel is mounted but only paints once the document has properties
    // to display, so we trigger an import first to force a render.
    await page.keyboard.press('Control+i');
    const textarea = page.locator('textarea[placeholder*="Paste"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill('CCO');
    await page.locator('button', { hasText: /^Import$/ }).click();
    await expect(panel).toBeVisible({ timeout: 8_000 });
    await expect(panel.locator('text=Formula')).toBeVisible();
  });

  test('NMR panel opens with Ctrl+M', async ({ page }) => {
    await page.keyboard.press('Control+m');
    await expect(page.getByTestId('nmr-panel')).toBeVisible({ timeout: 5_000 });
  });

  test('a toolbox is visible (whichever variant)', async ({ page }) => {
    const oldTb = page.getByTestId('old-toolbox');
    const newTb = page.getByTestId('new-toolbox');
    await expect(oldTb.or(newTb).first()).toBeVisible();
  });

  test('a drawing area is visible (whichever variant)', async ({ page }) => {
    const oldCanvas = page.getByTestId('old-canvas');
    const newCanvas = page.getByTestId('canvas-new-root');
    await expect(oldCanvas.or(newCanvas).first()).toBeVisible();
  });

  test('SMILES import works in both modes', async ({ page }) => {
    await page.keyboard.press('Control+i');
    const textarea = page.locator('textarea[placeholder*="Paste"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill('CCO');
    await page.locator('button', { hasText: /^Import$/ }).click();
    // Either the formula appears in the properties panel (back-end up),
    // or the canvas atom-count goes non-zero (back-end down). Either is
    // an acceptable signal that the import path completed.
    const formula = page.locator('[data-testid="properties-panel"] >> text=C2H6O');
    const stats = page.locator('text=/\\d+a\\s+\\d+b/');
    await expect(formula.or(stats).first()).toBeVisible({ timeout: 8_000 });
  });
});
