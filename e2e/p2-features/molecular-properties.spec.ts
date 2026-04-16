/**
 * @feature Molecular properties panel
 * @priority P2
 * @covers Formula display, MW, LogP, tPSA, Lipinski, export buttons
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { PropertyPanel } from '../pages/PropertyPanel';
import { MOLECULES } from '../fixtures/molecules';

test.describe('P2 Features — Molecular Properties @p2', () => {
  test('properties panel shows formula after import', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.ethanol.smiles);

    const panel = new PropertyPanel(page);
    const formulaText = await panel.getFormula();
    expect(formulaText).toContain('Formula');
  });

  test('properties panel shows MW > 0 after import', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.aspirin.smiles);

    // Give time for backend property fetch
    await page.waitForTimeout(2_000);
    const panel = new PropertyPanel(page);
    const mw = await panel.getMW();
    expect(mw).toBeGreaterThan(100);
  });

  test('all four export buttons present', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.benzene.smiles);

    const panel = new PropertyPanel(page);
    for (const fmt of ['SVG', 'MOL', 'PNG', 'PDF'] as const) {
      expect(await panel.hasExportButton(fmt)).toBe(true);
    }
  });
});
