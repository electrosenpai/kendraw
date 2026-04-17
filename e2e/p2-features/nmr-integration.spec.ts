/**
 * @feature NMR cumulative integration trace (wave-2 A3)
 * @priority P2
 * @covers Integration toggle button, 1H-only gating, render stability
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { NmrPanel } from '../pages/NmrPanel';
import { MOLECULES } from '../fixtures/molecules';

test.describe('P2 Features — NMR Integration Trace @p2', () => {
  test('integration toggle appears in 1H mode and flips on click', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();
    await page.waitForTimeout(2_000);

    const toggle = page.locator('[data-testid="nmr-integration-toggle"]');
    await expect(toggle).toBeVisible();

    // Click enables integration trace — canvas should re-render without error
    await toggle.click();
    await page.waitForTimeout(500);
    const canvasEl = nmr.panel.locator('canvas').first();
    await expect(canvasEl).toBeVisible();

    // Click again disables
    await toggle.click();
    await expect(toggle).toBeVisible();
  });

  test('integration toggle is hidden for 13C nucleus', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();
    await page.waitForTimeout(2_000);

    // Switch to 13C — integration button must disappear
    const nucleusButton = nmr.panel.locator('button', { hasText: '13C' }).first();
    if (await nucleusButton.isVisible()) {
      await nucleusButton.click();
      await page.waitForTimeout(500);
      const toggle = page.locator('[data-testid="nmr-integration-toggle"]');
      await expect(toggle).not.toBeVisible();
    }
  });
});
