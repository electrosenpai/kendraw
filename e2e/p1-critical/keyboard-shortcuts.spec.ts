/**
 * @feature Keyboard shortcuts
 * @priority P1
 * @covers Tool shortcuts (V, A, B, R, E), Ctrl combos (Z, Y, I, M)
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';

test.describe('P1 Critical — Keyboard Shortcuts @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();
  });

  test('V selects the select tool', async ({ page }) => {
    await page.keyboard.press('v');
    // Status bar first span shows tool name
    await expect(page.getByText('Select', { exact: true }).first()).toBeVisible({ timeout: 2_000 });
  });

  test('B selects the bond tool', async ({ page }) => {
    await page.keyboard.press('b');
    await expect(page.getByText('Bond', { exact: true }).first()).toBeVisible({ timeout: 2_000 });
  });

  test('A selects the atom tool', async ({ page }) => {
    await page.keyboard.press('a');
    await expect(page.getByText('Atom', { exact: true }).first()).toBeVisible({ timeout: 2_000 });
  });

  test('R selects the ring tool', async ({ page }) => {
    await page.keyboard.press('r');
    await expect(page.getByText('Ring', { exact: true }).first()).toBeVisible({ timeout: 2_000 });
  });

  test('E selects the eraser tool', async ({ page }) => {
    await page.keyboard.press('e');
    await expect(page.getByText('Eraser', { exact: true }).first()).toBeVisible({ timeout: 2_000 });
  });

  test('Ctrl+I opens import dialog', async ({ page }) => {
    await page.keyboard.press('Control+i');
    await expect(page.locator('textarea[placeholder*="Paste"]')).toBeVisible({ timeout: 3_000 });
  });

  test('Ctrl+M opens NMR panel', async ({ page }) => {
    await page.keyboard.press('Control+m');
    await expect(page.locator('[data-testid="nmr-panel"]')).toBeVisible({ timeout: 5_000 });
  });

  test('Ctrl+Z / Ctrl+Y undo and redo', async ({ page }) => {
    const canvas = new CanvasPage(page);
    await canvas.drawBond();
    const bondsBefore = await canvas.getBondCount();
    expect(bondsBefore).toBeGreaterThan(0);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(200);
    const bondsUndo = await canvas.getBondCount();
    expect(bondsUndo).toBeLessThan(bondsBefore);

    await page.keyboard.press('Control+y');
    await page.waitForTimeout(200);
    const bondsRedo = await canvas.getBondCount();
    expect(bondsRedo).toBe(bondsBefore);
  });
});
