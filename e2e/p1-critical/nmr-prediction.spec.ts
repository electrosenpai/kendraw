/**
 * @feature NMR prediction
 * @priority P1
 * @covers NMR panel toggle, 1H prediction, numerical shift validation
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { NmrPanel } from '../pages/NmrPanel';
import { MOLECULES, BACKEND_URL } from '../fixtures/molecules';

test.describe('P1 Critical — NMR Prediction @p1', () => {
  test('NMR panel toggles with Ctrl+M', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });
    const nmr = new NmrPanel(page);

    await expect(nmr.panel).not.toBeVisible();
    await nmr.open();
    await expect(nmr.panel).toBeVisible();
    await nmr.close();
    await expect(nmr.panel).not.toBeVisible();
  });

  test('NMR panel loads without errors after import', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    const importDialog = new ImportDialog(page);
    await importDialog.importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();
    await page.waitForTimeout(3_000);
    const hasContent = await nmr.hasContent();
    expect(hasContent).toBe(true);
  });

  test('API: ethanol 1H-NMR returns peaks in correct ppm range', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: MOLECULES.ethanol.smiles, format: 'smiles', nucleus: '1H' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.peaks.length).toBeGreaterThan(0);

    // All ethanol peaks should be between 0 and 5 ppm
    for (const peak of data.peaks) {
      expect(peak.shift_ppm).toBeGreaterThanOrEqual(0);
      expect(peak.shift_ppm).toBeLessThan(6);
    }
  });

  test('API: caffeine C8-H shift in [7.0, 8.5] ppm — regression bug #4', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: {
        input: MOLECULES.caffeine.smiles,
        format: 'smiles',
        nucleus: '1H',
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    // C8-H is the aromatic proton — should be the most downfield peak
    const shifts = data.peaks.map((p: { shift_ppm: number }) => p.shift_ppm);
    const maxShift = Math.max(...shifts);
    // Bug #4: was overcorrected to >12 ppm. Must be < 8.5
    expect(maxShift).toBeGreaterThan(7.0);
    expect(maxShift).toBeLessThan(8.5);
  });

  test('API: 13C NMR returns peaks', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: 'CCO', format: 'smiles', nucleus: '13C' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.peaks.length).toBeGreaterThan(0);
  });
});
