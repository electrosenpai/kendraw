/**
 * @feature Canvas-new wave-8 HF-A2 — bond rendering verification
 * @priority P0
 * @covers Wave-7 HF-A added 3 distinct bond tools (single/double/triple).
 *         The original verification only checked the data-active-tool attribute;
 *         it never drew a bond and never inspected the rendered canvas. This
 *         spec drives a real pointer drag, reads the resulting Canvas2D pixels,
 *         and counts the parallel stripes that cross the bond. A correct
 *         render shows 1, 2, 3 stripes for single/double/triple respectively.
 *
 * Auto-skips outside the new-canvas flag (mirrors toolbox-clicks.spec.ts).
 */

import { test, expect } from '../fixtures/base-test';

const CASES = [
  { tool: 'bond-single', stripes: 1 },
  { tool: 'bond-double', stripes: 2 },
  { tool: 'bond-triple', stripes: 3 },
] as const;

async function countStripesAcrossDraggedBond(
  page: import('@playwright/test').Page,
  toolId: string,
): Promise<number> {
  await page.goto('/');
  const newTb = page.getByTestId('new-toolbox');
  if (!(await newTb.isVisible().catch(() => false))) {
    test.skip(true, 'New-canvas toolbox only mounts under VITE_ENABLE_NEW_CANVAS=true');
  }

  await page.getByTestId(`new-tool-${toolId}`).click();

  const root = page.getByTestId('canvas-new-root');
  const canvas = root.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error(`No bounding box for canvas under ${toolId}`);

  // bondTool requires an anchor atom on pointerdown to begin a bond drag.
  // Step 1 — click empty space to seed an atom.
  // Step 2 — drag from that atom to free space; that emits the bond at
  //          the active tool's `bondOrder`.
  const startX = box.x + box.width * 0.4;
  const endX = box.x + box.width * 0.6;
  const y = box.y + box.height * 0.5;

  await page.mouse.click(startX, y);
  await page.waitForTimeout(50);

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move((startX + endX) / 2, y, { steps: 6 });
  await page.mouse.move(endX, y, { steps: 6 });
  await page.mouse.up();

  await page.waitForTimeout(80);

  return canvas.evaluate(
    (el, p) => {
      const c = el as HTMLCanvasElement;
      const ctx2d = c.getContext('2d');
      if (!ctx2d) return -1;
      const dpr = window.devicePixelRatio || 1;
      // Sample a vertical strip at the midpoint of the bond, spanning 40 CSS px.
      const cx = Math.round((((p.startX + p.endX) / 2) - p.boxX) * dpr);
      const yTop = Math.max(0, Math.round((p.y - p.boxY - 20) * dpr));
      const yBot = Math.min(c.height, Math.round((p.y - p.boxY + 20) * dpr));
      const h = yBot - yTop;
      const data = ctx2d.getImageData(cx, yTop, 1, h).data;
      // Bond stroke is `#aaaaaa` (R=G=B=170). Anti-aliased edges are lighter.
      // Count maximal runs of "dark-enough" pixels separated by gaps.
      let stripes = 0;
      let inDark = false;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const alpha = data[i + 3];
        const dark = alpha > 0 && r < 215;
        if (dark && !inDark) stripes++;
        inDark = dark;
      }
      return stripes;
    },
    { startX, endX, y, boxX: box.x, boxY: box.y },
  );
}

test.describe('Canvas-new bond rendering @canvas-new', () => {
  for (const { tool, stripes: expected } of CASES) {
    test(`${tool} renders ${expected} parallel stroke${expected === 1 ? '' : 's'}`, async ({
      page,
    }) => {
      const observed = await countStripesAcrossDraggedBond(page, tool);
      expect(
        observed,
        `Expected ${expected} stripes for ${tool}, observed ${observed}. ` +
          `If this fails the bond renderer is collapsing distinct bond.style values.`,
      ).toBe(expected);
    });
  }

  test('the three bond tools produce three distinct stripe counts (no aliasing)', async ({
    page,
  }) => {
    const single = await countStripesAcrossDraggedBond(page, 'bond-single');
    const double = await countStripesAcrossDraggedBond(page, 'bond-double');
    const triple = await countStripesAcrossDraggedBond(page, 'bond-triple');
    expect(new Set([single, double, triple]).size).toBe(3);
  });
});
