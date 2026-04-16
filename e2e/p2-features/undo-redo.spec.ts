/**
 * @feature Undo/Redo
 * @priority P2
 * @covers Multiple undos, redo stack, undo beyond history
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';

test.describe('P2 Features — Undo/Redo @p2', () => {
  test('multiple undos revert all actions', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    // Draw three bonds
    await canvas.drawBond(30);
    await page.waitForTimeout(200);
    await canvas.drawBond(80);
    await page.waitForTimeout(200);

    const atomsBefore = await canvas.getAtomCount();
    expect(atomsBefore).toBeGreaterThan(0);

    // Undo everything
    for (let i = 0; i < 10; i++) {
      await canvas.undo();
      await page.waitForTimeout(100);
    }

    const atomsAfter = await canvas.getAtomCount();
    expect(atomsAfter).toBe(0);
  });

  test('undo beyond history does not crash', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    // Undo 20 times on empty canvas — should be no-op, no crash
    for (let i = 0; i < 20; i++) {
      await canvas.undo();
    }
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBe(0);
  });

  test('redo without prior undo is no-op', async ({ page }) => {
    await page.goto('/');
    const canvas = new CanvasPage(page);
    await canvas.waitForReady();

    await canvas.redo();
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBe(0);
  });
});
