/**
 * @feature Export (SVG, MOL, PNG, PDF)
 * @priority P1
 * @covers Export buttons present, download triggered
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { PropertyPanel } from '../pages/PropertyPanel';
import { MOLECULES } from '../fixtures/molecules';

test.describe('P1 Critical — Export @p1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();
    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.benzene.smiles);
  });

  test('export buttons are visible after import', async ({ page }) => {
    const panel = new PropertyPanel(page);
    for (const fmt of ['SVG', 'MOL', 'PNG', 'PDF'] as const) {
      expect(await panel.hasExportButton(fmt)).toBe(true);
    }
  });

  test('SVG export triggers download', async ({ page }) => {
    const panel = new PropertyPanel(page);
    const downloadPromise = page.waitForEvent('download');
    await panel.clickExport('SVG');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
  });

  test('MOL export triggers download', async ({ page }) => {
    const panel = new PropertyPanel(page);
    const downloadPromise = page.waitForEvent('download');
    await panel.clickExport('MOL');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mol$/);
  });
});
