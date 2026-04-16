import { test, expect } from '@playwright/test';

test('no critical errors during typical workflow', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', (err) => errors.push(`PageError: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known non-critical warnings
      if (text.includes('React DevTools')) return;
      if (text.includes('Download the React DevTools')) return;
      if (text.includes('favicon')) return;
      if (text.includes('404')) return; // Backend property fetch on empty canvas
      if (text.includes('Failed to load resource')) return; // Network fetch noise
      errors.push(`Console error: ${text}`);
    }
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    // Ignore favicon and sourcemap requests
    if (url.includes('favicon') || url.includes('.map')) return;
    errors.push(`Request failed: ${url} — ${req.failure()?.errorText}`);
  });

  // Load the app
  await page.goto('/');
  await page
    .locator('[data-testid="drawing-canvas"]')
    .waitFor({ state: 'visible', timeout: 10_000 });

  // Draw a bond
  await page.keyboard.press('b');
  const canvas = page.locator('[data-testid="drawing-canvas"]');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');

  await page.mouse.move(box.x + 200, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + 200);
  await page.mouse.up();

  // Wait for any async effects
  await page.waitForTimeout(1_000);

  // Open NMR panel
  await page.keyboard.press('Control+m');
  await page.waitForTimeout(3_000);

  // Close NMR panel
  await page.keyboard.press('Control+m');
  await page.waitForTimeout(500);

  // Check for errors
  if (errors.length > 0) {
    console.log('Errors detected during workflow:', errors);
  }
  expect(errors).toEqual([]);
});
