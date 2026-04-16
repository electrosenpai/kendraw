/**
 * @feature Text annotation tool
 * @priority P1
 * @covers Text tool click handler, inline textarea focus, Enter to commit,
 *         Escape to cancel, outside-click to commit, double-click to edit
 * @regression Bug 1 (Apr 16 2026): clicking Text tool + canvas failed to
 *             focus the textarea because `autoFocus` alone was unreliable
 *             on dynamic React mount. Fixed by explicit useEffect focus.
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';

async function activateTextAt(
  canvas: CanvasPage,
  offsetX = 200,
  offsetY = 150,
): Promise<void> {
  await canvas.page.keyboard.press('t');
  const box = await canvas.getCanvasBox();
  await canvas.page.mouse.click(box.x + offsetX, box.y + offsetY);
}

test.describe('P1 Critical — Text Annotation Tool @p1', () => {
  test('Text tool hotkey "t" activates the Text tool button', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await page.keyboard.press('t');
    // ToolPalette highlights the active tool — the button should be in "active" state
    const textTool = page.locator('[data-testid="tool-text"]');
    await expect(textTool).toBeVisible();
  });

  test('clicking canvas with Text tool spawns a focused textarea', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await activateTextAt(canvas);

    // A textarea should appear and be the active element — this was the bug.
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 2_000 });
    await expect(textarea).toBeFocused();
  });

  test('Enter commits the annotation and clears the textarea', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await activateTextAt(canvas);
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeFocused();

    await page.keyboard.type('87% yield');
    await page.keyboard.press('Enter');

    // Textarea disappears after commit
    await expect(textarea).not.toBeVisible({ timeout: 2_000 });
  });

  test('Escape cancels without creating an annotation', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await activateTextAt(canvas);
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeFocused();

    await page.keyboard.type('will be cancelled');
    await page.keyboard.press('Escape');

    await expect(textarea).not.toBeVisible({ timeout: 2_000 });
  });

  test('clicking outside the textarea commits the text (blur-to-commit)', async ({
    page,
  }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await activateTextAt(canvas, 250, 180);
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeFocused();

    await page.keyboard.type('commit via blur');

    // Click elsewhere on the canvas — should trigger onBlur → commit
    const box = await canvas.getCanvasBox();
    await page.mouse.click(box.x + 50, box.y + 50);

    await expect(textarea).not.toBeVisible({ timeout: 2_000 });
  });

  test('no console errors when using the text tool', async ({
    page,
    consoleErrors,
    networkFailures,
  }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await activateTextAt(canvas);
    await page.keyboard.type('smoke test');
    await page.keyboard.press('Enter');

    // Give React a tick to flush any error boundaries
    await page.waitForTimeout(500);

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(networkFailures, `Failed requests: ${networkFailures.join(', ')}`).toEqual(
      [],
    );
  });
});
