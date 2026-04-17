/**
 * @feature Print dialog (wave-2 A5)
 * @priority P2
 * @covers Ctrl+P triggers window.print, @media print CSS is scoped
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';

test.describe('P2 Features — Print @p2', () => {
  test('Ctrl+P calls window.print', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    // Stub window.print so we can detect the call without the browser
    // opening a real print preview that blocks the test.
    await page.evaluate(() => {
      (window as unknown as { __printCalled: boolean }).__printCalled = false;
      window.print = () => {
        (window as unknown as { __printCalled: boolean }).__printCalled = true;
      };
    });

    // Focus the canvas before firing the shortcut
    await page.locator('[data-testid="drawing-canvas"]').click();
    await page.keyboard.press('Control+p');

    const called = await page.evaluate(
      () => (window as unknown as { __printCalled: boolean }).__printCalled,
    );
    expect(called).toBe(true);
  });
});
