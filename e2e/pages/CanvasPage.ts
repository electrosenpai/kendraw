import { type Page, type Locator } from '@playwright/test';

/** Page Object Model for the Kendraw drawing canvas. */
export class CanvasPage {
  readonly page: Page;
  readonly canvas: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('[data-testid="drawing-canvas"]');
  }

  async waitForReady() {
    await this.canvas.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async getCanvasBox() {
    const box = await this.canvas.boundingBox();
    if (!box) throw new Error('Canvas bounding box not found');
    return box;
  }

  /** Draw a bond from center-left to center-right */
  async drawBond(offsetX = 50) {
    await this.page.keyboard.press('b');
    const box = await this.getCanvasBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await this.page.mouse.move(cx - offsetX, cy);
    await this.page.mouse.down();
    await this.page.mouse.move(cx + offsetX, cy);
    await this.page.mouse.up();
  }

  /** Place an atom at the center of the canvas */
  async placeAtom() {
    await this.page.keyboard.press('a');
    const box = await this.getCanvasBox();
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  /** Click on a specific position on the canvas */
  async clickAt(x: number, y: number) {
    const box = await this.getCanvasBox();
    await this.page.mouse.click(box.x + x, box.y + y);
  }

  /** Select the given tool by keyboard shortcut */
  async selectTool(shortcut: string) {
    await this.page.keyboard.press(shortcut);
  }

  /** Get the atom count from the status bar */
  async getAtomCount(): Promise<number> {
    const text = await this.page.locator('text=/\\d+a/').first().textContent();
    const match = text?.match(/(\d+)a/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /** Get the bond count from the status bar */
  async getBondCount(): Promise<number> {
    const text = await this.page.locator('text=/\\d+b/').first().textContent();
    const match = text?.match(/(\d+)b/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async undo() {
    await this.page.keyboard.press('Control+z');
  }

  async redo() {
    await this.page.keyboard.press('Control+y');
  }

  async selectAll() {
    await this.page.keyboard.press('Control+a');
  }

  async deleteSelection() {
    await this.page.keyboard.press('Delete');
  }
}
