import { test, expect } from '@playwright/test';

test.describe('Molecule Drawing', () => {
  test('can draw a bond on canvas', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="drawing-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Select bond tool via keyboard shortcut
    await page.keyboard.press('b');

    // Draw a bond: click-drag on canvas
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx - 50, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 50, cy);
    await page.mouse.up();

    // After drawing, the status bar should show atoms and bonds
    await expect(page.locator('text=/[1-9]\\d*a/')).toBeVisible({ timeout: 5_000 });
  });

  test('can place an atom with atom tool', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="drawing-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Select atom tool
    await page.keyboard.press('a');

    // Click on canvas to place an atom
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Should have at least 1 atom
    await expect(page.locator('text=/[1-9]\\d*a/')).toBeVisible({ timeout: 5_000 });
  });

  test('undo/redo works after drawing', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="drawing-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Draw a bond
    await page.keyboard.press('b');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 50, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 50, cy);
    await page.mouse.up();

    // Verify something was drawn
    await expect(page.locator('text=/[1-9]\\d*a/')).toBeVisible({ timeout: 5_000 });

    // Undo — bond is removed, atoms may remain
    await page.keyboard.press('Control+z');
    await expect(page.locator('text=/0b/')).toBeVisible({ timeout: 3_000 });

    // Redo — bond is restored
    await page.keyboard.press('Control+y');
    await expect(page.locator('text=/[1-9]\\d*b/')).toBeVisible({ timeout: 3_000 });
  });

  test('import SMILES via import dialog', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="drawing-canvas"]').waitFor({ state: 'visible' });

    // Open import dialog with Ctrl+I
    await page.keyboard.press('Control+i');

    // Find the textarea and type a SMILES
    const textarea = page.locator('textarea[placeholder*="Paste"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill('CCO');

    // Click Import button and wait for dialog to auto-close
    await page.locator('button', { hasText: /^Import$/ }).click();
    await page.waitForTimeout(1_000);

    // Verify the molecule appeared (atoms count in status bar increases)
    await expect(page.locator('text=/[1-9]\\d*a/')).toBeVisible({ timeout: 5_000 });
  });
});
