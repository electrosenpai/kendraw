import { test, expect } from '@playwright/test';

test.describe('NMR Panel', () => {
  test('NMR panel toggles with Ctrl+M', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });

    // NMR panel should not be visible initially
    await expect(page.locator('[data-testid="nmr-panel"]')).not.toBeVisible();

    // Toggle open with Ctrl+M
    await page.keyboard.press('Control+m');
    await expect(page.locator('[data-testid="nmr-panel"]')).toBeVisible({ timeout: 5_000 });

    // Toggle closed with Ctrl+M
    await page.keyboard.press('Control+m');
    await expect(page.locator('[data-testid="nmr-panel"]')).not.toBeVisible({ timeout: 3_000 });
  });

  test('NMR panel loads without errors', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });

    // Open NMR panel
    await page.keyboard.press('Control+m');

    // Wait for lazy loading to complete (Loading NMR... should disappear)
    await expect(page.locator('text=Loading NMR...')).not.toBeVisible({ timeout: 10_000 });

    // NMR panel container should be visible
    await expect(page.locator('[data-testid="nmr-panel"]')).toBeVisible();
  });

  test('NMR predicts spectrum after molecule import', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });

    // Import ethanol via import dialog
    await page.keyboard.press('Control+i');
    const textarea = page.locator('textarea[placeholder*="Paste"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill('CCO');
    await page.locator('button', { hasText: /^Import$/ }).click();
    await page.waitForTimeout(1_000);

    // Wait for molecule to appear (atoms show in status bar)
    await expect(page.locator('text=/[1-9]\\d*a/')).toBeVisible({ timeout: 5_000 });

    // Open NMR panel
    await page.keyboard.press('Control+m');
    await expect(page.locator('[data-testid="nmr-panel"]')).toBeVisible({ timeout: 5_000 });

    // Wait for loading to finish and spectrum to render
    await expect(page.locator('text=Loading NMR...')).not.toBeVisible({ timeout: 10_000 });

    // The NMR panel should contain spectrum data (canvas or peak information)
    // Wait a bit for the API call to complete and render
    await page.waitForTimeout(3_000);

    // Verify the NMR panel has rendered content (not just the empty shell)
    const nmrPanel = page.locator('[data-testid="nmr-panel"]');
    const panelContent = await nmrPanel.innerHTML();
    expect(panelContent.length).toBeGreaterThan(100);
  });
});
