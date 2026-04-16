/**
 * @feature Performance with large molecules
 * @priority P3
 * @covers Cholesterol import, large alkane chain
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { MOLECULES, BACKEND_URL } from '../fixtures/molecules';

test.describe('P3 Edge — Large Molecules @p3', () => {
  test('cholesterol imports without freeze', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.cholesterol.smiles);
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBeGreaterThan(20);
  });

  test('large molecule properties compute without timeout', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.cholesterol.smiles },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.molecular_weight).toBeCloseTo(MOLECULES.cholesterol.mw, 0);
  });
});
