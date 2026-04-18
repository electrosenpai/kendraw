/**
 * @feature Canvas-new wave-7 toolbox click handlers
 * @priority P0
 * @covers Wave-7 HF-6 regression — the wave-4 CanvasNew shell used to
 *         mount placeholder <div>s at gridArea 'toolbar' / 'properties' /
 *         'status'. Under the wave-5 shell split those placeholders sat
 *         ON TOP of the real widgets in the same grid cells and silently
 *         intercepted pointer events, breaking every toolbox click while
 *         keyboard shortcuts (bound on window) still worked.
 *
 * These tests lock every click path end-to-end: each tool button
 * activates its tool, each toggle flips aria-pressed, each action
 * dispatches. They also assert the toolbar row is free of overlay
 * interception (no element on top at the button's centre).
 *
 * Auto-skips under the default chromium project — only runs when the
 * dev-server is booted with VITE_ENABLE_NEW_CANVAS=true
 * (`pnpm test:e2e:new-canvas`).
 */

import { test, expect } from '../fixtures/base-test';

const TOOL_BUTTONS = [
  'select',
  'bond-single',
  'bond-double',
  'bond-triple',
  'atom-c',
  'atom-h',
  'atom-n',
  'atom-o',
  'atom-s',
  'ring-benzene',
  'ring-cyclohexane',
  'text',
  'arrow',
  'erase',
] as const;

const TOGGLE_BUTTONS = ['nmr-toggle', 'property-toggle'] as const;

test.describe('Canvas-new toolbox clicks @canvas-new', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const newTb = page.getByTestId('new-toolbox');
    const visible = await newTb.isVisible().catch(() => false);
    test.skip(!visible, 'New-canvas toolbox only mounts under VITE_ENABLE_NEW_CANVAS=true');
  });

  test('no element intercepts pointer events at the toolbox centre', async ({ page }) => {
    // The wave-7 HF-6 regression: CanvasNew's placeholder divs
    // (canvas-new-toolbar / -properties / -status) overlaid the real
    // shell and absorbed every click. The unit test covers the DOM
    // absence; this one locks the document-level hit-test.
    for (const id of TOOL_BUTTONS) {
      const btn = page.getByTestId(`new-tool-${id}`);
      const box = await btn.boundingBox();
      expect(box, `missing bounding box for ${id}`).not.toBeNull();
      if (!box) continue;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const hitId = await page.evaluate(
        ([x, y]) => {
          const el = document.elementFromPoint(x as number, y as number);
          return el?.closest('[data-testid^="new-tool-"]')?.getAttribute('data-testid') ?? null;
        },
        [cx, cy],
      );
      expect(hitId, `pointer at ${id} centre hit ${hitId}`).toBe(`new-tool-${id}`);
    }
  });

  for (const id of TOOL_BUTTONS) {
    test(`clicking new-tool-${id} flips data-active=true`, async ({ page }) => {
      await page.getByTestId(`new-tool-${id}`).click();
      await expect(page.getByTestId(`new-tool-${id}`)).toHaveAttribute('data-active', 'true');
    });
  }

  test('clicking a different tool deactivates the previous one', async ({ page }) => {
    await page.getByTestId('new-tool-bond-double').click();
    await expect(page.getByTestId('new-tool-bond-double')).toHaveAttribute('data-active', 'true');
    await page.getByTestId('new-tool-atom-o').click();
    await expect(page.getByTestId('new-tool-atom-o')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('new-tool-bond-double')).toHaveAttribute('data-active', 'false');
  });

  test('toolbox clicks drive the canvas active-tool attribute', async ({ page }) => {
    await page.getByTestId('new-tool-bond-single').click();
    await expect(page.getByTestId('canvas-new-root')).toHaveAttribute('data-active-tool', 'bond-single');
    await page.getByTestId('new-tool-bond-double').click();
    await expect(page.getByTestId('canvas-new-root')).toHaveAttribute('data-active-tool', 'bond-double');
    await page.getByTestId('new-tool-bond-triple').click();
    await expect(page.getByTestId('canvas-new-root')).toHaveAttribute('data-active-tool', 'bond-triple');
    await page.getByTestId('new-tool-atom-n').click();
    await expect(page.getByTestId('canvas-new-root')).toHaveAttribute('data-active-tool', 'atom-n');
    await page.getByTestId('new-tool-select').click();
    await expect(page.getByTestId('canvas-new-root')).toHaveAttribute('data-active-tool', 'select');
  });

  test('NMR toggle click opens the NMR panel', async ({ page }) => {
    const btn = page.getByTestId('new-tool-nmr-toggle');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await btn.click();
    await expect(page.getByTestId('nmr-panel')).toBeVisible({ timeout: 5_000 });
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('Property toggle click flips aria-pressed', async ({ page }) => {
    const btn = page.getByTestId('new-tool-property-toggle');
    const before = await btn.getAttribute('aria-pressed');
    await btn.click();
    const after = await btn.getAttribute('aria-pressed');
    expect(after).not.toBe(before);
  });

  test('paste-smiles action click opens the import dialog', async ({ page }) => {
    await page.getByTestId('new-tool-paste-smiles').click();
    await expect(page.locator('textarea[placeholder*="Paste"]')).toBeVisible({ timeout: 5_000 });
  });

  test('search-molecule action click opens the molecule search dialog', async ({ page }) => {
    await page.getByTestId('new-tool-search-molecule').click();
    await expect(page.locator('input[placeholder*="Search molecule"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('every tool and non-modal action button is clickable (no overlay interception)', async ({
    page,
  }) => {
    // Contract: every visible new-tool-* button must be clickable within
    // 2s — i.e. not swallowed by a stacking-context overlay. paste-smiles
    // and search-molecule are excluded because they open a modal that
    // would hide the rest of the toolbox for subsequent clicks.
    const nonModalIds: string[] = [
      ...TOOL_BUTTONS,
      ...TOGGLE_BUTTONS,
      'fit-to-view',
      'structure-clean',
      'structure-refine',
      'undo',
      'redo',
    ];
    expect(nonModalIds.length).toBeGreaterThanOrEqual(20);
    for (const id of nonModalIds) {
      const btn = page.getByTestId(`new-tool-${id}`);
      await expect(btn, `missing button ${id}`).toBeVisible();
      const disabled = await btn.getAttribute('aria-disabled');
      if (disabled === 'true') continue;
      // The wave-7 HF-6 bug timed out here with "div intercepts pointer
      // events"; a 2s budget is generous for a healthy click.
      await btn.click({ timeout: 2_000 });
    }
  });

  test('keyboard shortcut path still works after the click fix (no regression)', async ({
    page,
  }) => {
    await page.keyboard.press('1');
    await expect(page.getByTestId('new-tool-bond-single')).toHaveAttribute('data-active', 'true');
    await page.keyboard.press('2');
    await expect(page.getByTestId('new-tool-bond-double')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('new-tool-bond-single')).toHaveAttribute('data-active', 'false');
  });
});
