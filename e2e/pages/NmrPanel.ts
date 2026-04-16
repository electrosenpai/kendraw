import { type Page, type Locator, expect } from '@playwright/test';

/** Page Object Model for the NMR prediction panel. */
export class NmrPanel {
  readonly page: Page;
  readonly panel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-testid="nmr-panel"]');
  }

  /** Toggle the NMR panel with Ctrl+M */
  async toggle() {
    await this.page.keyboard.press('Control+m');
  }

  /** Open the NMR panel and wait for it to load */
  async open() {
    await this.toggle();
    await expect(this.panel).toBeVisible({ timeout: 5_000 });
    // Wait for lazy loading to complete
    await expect(this.page.locator('text=Loading NMR...')).not.toBeVisible({ timeout: 10_000 });
  }

  /** Close the NMR panel */
  async close() {
    if (await this.panel.isVisible()) {
      await this.toggle();
      await expect(this.panel).not.toBeVisible({ timeout: 3_000 });
    }
  }

  /** Check the panel has rendered content (not just empty shell) */
  async hasContent(): Promise<boolean> {
    const html = await this.panel.innerHTML();
    return html.length > 100;
  }
}
