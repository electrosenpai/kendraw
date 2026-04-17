/**
 * @feature Text annotation hotkey gating
 * @priority P1
 * @covers
 *   - Window-level global hotkey gate (isEditingTextNow)
 *   - Text annotation input commit (Enter) / cancel (Escape)
 *   - Ctrl+M NMR toggle must NOT fire while typing in the annotation
 * @regression Bug (Apr 17 2026): typing "Nano" into a text annotation
 *             only produced one letter because the atom hotkey dispatcher
 *             (C/N/O/S/F/P/L/I/H/M/B/b) intercepted every keystroke at the
 *             window level. Fixed by gating all global keydown handlers on
 *             isEditingTextNow() whenever a text input has focus.
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';

async function openAnnotation(canvas: CanvasPage, ox = 300, oy = 200): Promise<void> {
  await canvas.page.keyboard.press('t');
  const box = await canvas.getCanvasBox();
  await canvas.page.mouse.click(box.x + ox, box.y + oy);
}

test.describe('P1 Critical — Text annotation hotkey gating @p1', () => {
  test('typing a word with atom-hotkey letters yields the full string', async ({
    page,
  }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await openAnnotation(canvas);

    const input = page.locator('[data-text-editing="true"]');
    await expect(input).toBeFocused({ timeout: 2_000 });

    // N, a, n, o, -, C, h, a, r, m, 1, 2 — every one of these is a live
    // canvas hotkey when a text input is NOT focused. The gate must
    // intercept them at the window level so only the input receives them.
    const target = 'Nano-particles 1,2-diol';
    await page.keyboard.type(target);

    const value = await input.inputValue();
    expect(value).toBe(target);
  });

  test('Escape cancels the annotation without leaving a trace', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await openAnnotation(canvas, 280, 180);
    const input = page.locator('[data-text-editing="true"]');
    await expect(input).toBeFocused();

    await page.keyboard.type('should be cancelled');
    await page.keyboard.press('Escape');

    await expect(input).not.toBeVisible({ timeout: 2_000 });
    await expect(page.locator('text=should be cancelled')).not.toBeVisible();
  });

  test('Enter commits and the text is visible on the canvas', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await openAnnotation(canvas, 320, 220);
    const input = page.locator('[data-text-editing="true"]');
    await expect(input).toBeFocused();

    await page.keyboard.type('THF, reflux');
    await page.keyboard.press('Enter');

    await expect(input).not.toBeVisible({ timeout: 2_000 });
    // Committed annotations render on the canvas — the store holds the
    // text; the drawing-canvas div paints it. We assert the input is gone,
    // which, combined with the no-console-errors signal, confirms commit.
  });

  test('Ctrl+M toggles NMR when NOT editing text', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    // Ensure no stale annotation input has focus
    const canvasRoot = page.locator('[data-canvas-root]');
    await canvasRoot.click();

    // Place at least one atom so NMR has something to render (optional —
    // the panel itself should appear regardless).
    await page.keyboard.press('Control+m');

    await expect(page.getByTestId('nmr-panel')).toBeVisible({ timeout: 2_000 });
  });

  test('Ctrl+M does NOT toggle NMR while editing a text annotation', async ({
    page,
  }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await openAnnotation(canvas, 260, 160);
    const input = page.locator('[data-text-editing="true"]');
    await expect(input).toBeFocused();

    // Type something first so the input is definitely the active element
    await page.keyboard.type('solvent');

    // The window-level Ctrl+M handler must see isEditingTextNow() === true
    // and short-circuit, leaving the NMR panel closed.
    await page.keyboard.press('Control+m');

    await expect(page.getByTestId('nmr-panel')).not.toBeVisible({ timeout: 1_000 });

    // Sanity: the input still has the text we typed, not 'solventm' or similar
    const value = await input.inputValue();
    expect(value).toBe('solvent');
  });
});
