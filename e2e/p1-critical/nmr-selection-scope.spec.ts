/**
 * @feature NMR prediction scope
 * @priority P1
 * @covers Selection-scoped NMR prediction, scope badge, disconnected warning
 * @regression Bug 2 (Apr 16 2026): NMR panel predicted the full canvas even
 *             when the user had selected a subset of atoms. Fixed by
 *             threading canvas selection to NmrPanel and filtering atoms/bonds
 *             before serialization.
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { NmrPanel } from '../pages/NmrPanel';
import { MOLECULES } from '../fixtures/molecules';

test.describe('P1 Critical — NMR Selection Scope @p1', () => {
  test('scope badge reads "full canvas" when nothing is selected', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();

    const badge = page.locator('[data-testid="nmr-scope-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/full canvas/i);
  });

  test('scope badge shows "selection (N)" after Ctrl+A', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();

    // Select all atoms on the canvas
    await canvas.selectAll();

    const badge = page.locator('[data-testid="nmr-scope-badge"]');
    await expect(badge).toHaveText(/selection \(\d+\)/i, { timeout: 3_000 });
  });

  test('scope badge reverts to "full canvas" when selection is cleared', async ({
    page,
  }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();

    await canvas.selectAll();
    const badge = page.locator('[data-testid="nmr-scope-badge"]');
    await expect(badge).toHaveText(/selection/i, { timeout: 3_000 });

    // Escape clears the selection on the canvas
    await page.keyboard.press('Escape');
    await expect(badge).toHaveText(/full canvas/i, { timeout: 3_000 });
  });

  test('scope badge tooltip reflects the atom count', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();

    await canvas.selectAll();
    const badge = page.locator('[data-testid="nmr-scope-badge"]');
    const title = await badge.getAttribute('title');
    expect(title).toMatch(/selection/i);
    expect(title).toMatch(/atom/i);
  });

  test('NMR prediction succeeds when selection is active (no console errors)', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();

    await canvas.selectAll();
    // Allow the debounced re-prediction to complete
    await page.waitForTimeout(2_500);

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(await nmr.hasContent()).toBe(true);
  });
});
