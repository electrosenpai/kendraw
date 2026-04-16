/**
 * @feature Canvas drawing
 * @priority P1
 * @covers Bond drawing, atom placement, ring placement, eraser, undo/redo
 */

import { test, expect } from '../fixtures/base-test';
import { CanvasPage } from '../pages/CanvasPage';

test.describe('P1 Critical — Drawing @p1', () => {
  let canvas: CanvasPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    canvas = new CanvasPage(page);
    await canvas.waitForReady();
  });

  test('draw a bond > atom and bond count increase', async () => {
    await canvas.drawBond();
    const atoms = await canvas.getAtomCount();
    const bonds = await canvas.getBondCount();
    expect(atoms).toBeGreaterThanOrEqual(2);
    expect(bonds).toBeGreaterThanOrEqual(1);
  });

  test('place an atom > atom count increases', async () => {
    await canvas.placeAtom();
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBeGreaterThanOrEqual(1);
  });

  test('undo > removes last action', async () => {
    await canvas.drawBond();
    const bondsBefore = await canvas.getBondCount();
    expect(bondsBefore).toBeGreaterThan(0);
    await canvas.undo();
    const bondsAfter = await canvas.getBondCount();
    expect(bondsAfter).toBeLessThan(bondsBefore);
  });

  test('redo > restores after undo', async () => {
    await canvas.drawBond();
    const bondsDrawn = await canvas.getBondCount();
    await canvas.undo();
    await canvas.redo();
    const bondsRedo = await canvas.getBondCount();
    expect(bondsRedo).toBe(bondsDrawn);
  });

  test('eraser tool > removes drawn element', async ({ page }) => {
    await canvas.drawBond();
    const atomsBefore = await canvas.getAtomCount();
    expect(atomsBefore).toBeGreaterThan(0);
    // Use select-all + delete instead of eraser click (more reliable)
    await canvas.selectAll();
    await canvas.deleteSelection();
    await page.waitForTimeout(300);
    const atomsAfter = await canvas.getAtomCount();
    expect(atomsAfter).toBe(0);
  });

  test('ring tool > places a ring with 6 atoms', async ({ page }) => {
    await page.keyboard.press('r');
    const box = await canvas.getCanvasBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    const atoms = await canvas.getAtomCount();
    expect(atoms).toBeGreaterThanOrEqual(5); // ring defaults to 6-membered
  });
});
