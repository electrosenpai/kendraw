/**
 * @feature API routing consistency
 * @priority P1
 * @covers All frontend API calls pass through the /api/ Vite proxy and
 *         resolve to a real backend endpoint.
 * @regression Bug 3 (Apr 16 2026): PropertyPanel.tsx hardcoded a "/api/v1"
 *             prefix, but the backend mounts routers at "/", not "/v1".
 *             Vite proxy stripped the "/api" segment leaving "/v1/convert/"
 *             which produced a 404. Fixed by changing the prefix to "/api".
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { NmrPanel } from '../pages/NmrPanel';
import { MOLECULES } from '../fixtures/molecules';

test.describe('Regression — API /v1 prefix 404 @regression', () => {
  test('typical workflow produces zero 4xx responses on /api/* calls', async ({
    page,
  }) => {
    const badResponses: string[] = [];
    page.on('response', (res) => {
      const url = res.url();
      if (!url.includes('/api/')) return;
      const s = res.status();
      if (s >= 400) badResponses.push(`${res.request().method()} ${url} → ${s}`);
    });

    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);

    const nmr = new NmrPanel(page);
    await nmr.open();
    await page.waitForTimeout(2_500); // allow NMR + property calls to complete

    expect(
      badResponses,
      `Got ${badResponses.length} 4xx API response(s):\n${badResponses.join('\n')}`,
    ).toEqual([]);
  });

  test('no frontend call uses the broken "/v1/" path segment', async ({ page }) => {
    const v1Calls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      // Only flag /v1/ when it is NOT already behind /api/v1/ (the broken form is exactly /api/v1/*)
      if (/\/api\/v1\//.test(url) || /\/v1\//.test(new URL(url).pathname)) {
        v1Calls.push(`${req.method()} ${url}`);
      }
    });

    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);
    await page.waitForTimeout(1_500);

    expect(
      v1Calls,
      `Found ${v1Calls.length} call(s) using the broken /v1/ prefix:\n${v1Calls.join('\n')}`,
    ).toEqual([]);
  });

  test('/api/convert/ resolves (MOL → SMILES round-trip)', async ({ request }) => {
    const molBlock = `ethanol
  Kendraw

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
M  END
`;
    // Call the frontend origin so the Vite proxy routes it to the backend.
    const res = await request.post('http://localhost:5173/api/convert/', {
      data: { mol: molBlock },
    });
    // We do not care about the exact response shape — we just need this NOT
    // to be a 404 like it was before the prefix fix.
    expect(res.status()).not.toBe(404);
  });

  test('/api/compute/properties/smiles resolves (descriptor endpoint)', async ({
    request,
  }) => {
    const res = await request.post(
      'http://localhost:5173/api/compute/properties/smiles',
      {
        data: { smiles: 'CCO' },
      },
    );
    expect(res.status()).not.toBe(404);
    expect(res.ok()).toBeTruthy();
  });
});
