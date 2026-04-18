/**
 * @feature Canvas-new wave-8 HF-D2 — Indigo template fusion wiring
 * @priority P0
 * @covers The ringTool's atom/bond fusion paths fire-and-forget a
 *         POST /structure/fuse-template after the local fusion. This spec
 *         verifies BOTH halves end-to-end:
 *           - the backend accepts the payload via the Vite proxy and
 *             returns naphthalene from benzene+benzene bond fusion
 *             (toluene from ethane+benzene atom fusion).
 *           - drawing a bond + clicking the benzene tool on it triggers
 *             a POST /structure/fuse-template with mode='bond' and a
 *             non-empty mol_block.
 *
 * Auto-skips outside VITE_ENABLE_NEW_CANVAS=true (mirrors the other
 * canvas-new specs).
 */

import { test, expect } from '../fixtures/base-test';

test.describe('Canvas-new template fusion @canvas-new', () => {
  test('backend /structure/fuse-template returns naphthalene for benzene+benzene', async ({
    request,
  }) => {
    // Build a benzene MOL block via /structure/clean(full) so the backend
    // produces a valid V2000 input with computed coordinates.
    const benzene = `
  Kendraw

  6  6  0  0  0  0  0  0  0  0999 V2000
    0.0000    1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2124    0.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2124   -0.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2124   -0.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2124    0.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
M  END`;
    const res = await request.post('/api/structure/fuse-template', {
      data: {
        mol_block: benzene,
        template_smiles: 'c1ccccc1',
        mode: 'bond',
        target_index: 0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { mol_block: string; success: boolean };
    expect(body.success).toBe(true);

    // Naphthalene = 10 carbons in V2000.
    const atomLines = body.mol_block
      .split('\n')
      .filter((ln) =>
        ln.endsWith(' C   0  0  0  0  0  0  0  0  0  0  0  0'),
      );
    expect(atomLines.length).toBe(10);
  });

  test('backend /structure/fuse-template returns toluene for methyl+benzene', async ({
    request,
  }) => {
    const ethane = `
  Kendraw

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END`;
    const res = await request.post('/api/structure/fuse-template', {
      data: {
        mol_block: ethane,
        template_smiles: 'c1ccccc1',
        mode: 'atom',
        target_index: 0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { mol_block: string; success: boolean };
    expect(body.success).toBe(true);

    const atomLines = body.mol_block
      .split('\n')
      .filter((ln) =>
        ln.endsWith(' C   0  0  0  0  0  0  0  0  0  0  0  0'),
      );
    // Toluene = 7 carbons (CH3 + 6 ring carbons).
    expect(atomLines.length).toBe(7);
  });

  test('drawing a bond + clicking benzene tool triggers /structure/fuse-template', async ({
    page,
  }) => {
    await page.goto('/');
    const newTb = page.getByTestId('new-toolbox');
    if (!(await newTb.isVisible().catch(() => false))) {
      test.skip(true, 'New-canvas toolbox only mounts under VITE_ENABLE_NEW_CANVAS=true');
    }

    // Step 1 — draw a single bond by clicking + dragging.
    await page.getByTestId('new-tool-bond-single').click();
    const root = page.getByTestId('canvas-new-root');
    const canvas = root.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('No bounding box for canvas');
    const sx = box.x + box.width * 0.4;
    const ex = box.x + box.width * 0.6;
    const y = box.y + box.height * 0.5;

    await page.mouse.click(sx, y);
    await page.waitForTimeout(50);
    await page.mouse.move(sx, y);
    await page.mouse.down();
    await page.mouse.move((sx + ex) / 2, y, { steps: 6 });
    await page.mouse.move(ex, y, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(80);

    // Step 2 — start watching for the fusion request.
    const fusionPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/structure/fuse-template') && req.method() === 'POST',
      { timeout: 5000 },
    );

    // Step 3 — switch to benzene + click the bond's midpoint.
    await page.getByTestId('new-tool-ring-benzene').click();
    const midX = (sx + ex) / 2;
    await page.mouse.click(midX, y);

    const req = await fusionPromise;
    const body = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>;
    expect(body.mode).toBe('bond');
    expect(body.template_smiles).toBe('c1ccccc1');
    expect(typeof body.target_index).toBe('number');
    expect(typeof body.mol_block).toBe('string');
    expect((body.mol_block as string).length).toBeGreaterThan(0);
  });
});
