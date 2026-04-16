/**
 * @feature SMILES import
 * @priority P1
 * @covers Import ethanol, caffeine, aspirin; property validation
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { MOLECULES, BACKEND_URL } from '../fixtures/molecules';

test.describe('P1 Critical — Import SMILES @p1', () => {
  let canvas: CanvasPage;
  let importDialog: ImportDialog;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    canvas = new CanvasPage(page);
    importDialog = new ImportDialog(page);
    await canvas.waitForReady();
  });

  test('import ethanol > correct atom count', async () => {
    await importDialog.importSmiles(MOLECULES.ethanol.smiles);
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBe(MOLECULES.ethanol.heavyAtoms);
  });

  test('import caffeine > correct atom count for complex molecule', async () => {
    await importDialog.importSmiles(MOLECULES.caffeine.smiles);
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBe(MOLECULES.caffeine.heavyAtoms);
  });

  test('import aspirin > MW matches reference via backend', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.aspirin.smiles },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.molecular_weight).toBeCloseTo(MOLECULES.aspirin.mw, 0);
  });

  test('import aspirin > Lipinski pass', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.aspirin.smiles },
    });
    const data = await res.json();
    expect(data.lipinski_pass).toBe(true);
  });

  test('import invalid SMILES > does not crash app', async ({ page, consoleErrors }) => {
    // Fresh page to ensure clean state
    await page.goto('/');
    canvas = new CanvasPage(page);
    importDialog = new ImportDialog(page);
    await canvas.waitForReady();

    await importDialog.open();
    await importDialog.textarea.fill(MOLECULES.invalid.smiles);
    await importDialog.importButton.click();
    await page.waitForTimeout(1_500);
    // The key assertion: no uncaught JS errors (app remains functional)
    expect(consoleErrors).toEqual([]);
    // Canvas should still be usable — try a basic action
    await canvas.drawBond();
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBeGreaterThan(0);
  });
});
