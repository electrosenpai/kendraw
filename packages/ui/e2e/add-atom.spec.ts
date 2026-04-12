import { test, expect } from '@playwright/test';

test('clicking canvas adds carbon atoms', async ({ page }) => {
  await page.goto('/');

  // Wait for the canvas to be attached
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Click 3 times at different positions
  await page.click('canvas', { position: { x: 200, y: 200 } });
  await page.click('canvas', { position: { x: 400, y: 300 } });
  await page.click('canvas', { position: { x: 300, y: 100 } });

  // Verify store has 3 atoms via the dev-mode exposed store
  const atomCount = await page.evaluate(() => {
    const store = (window as Record<string, unknown>).__kendraw_store__ as {
      getState(): { pages: { atoms: Record<string, unknown> }[] };
    };
    const page = store.getState().pages[0];
    return page ? Object.keys(page.atoms).length : 0;
  });

  expect(atomCount).toBe(3);
});
