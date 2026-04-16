import { type Page, type Locator, expect } from '@playwright/test';

/** Page Object Model for the import dialog (Ctrl+I). */
export class ImportDialog {
  readonly page: Page;
  readonly textarea: Locator;
  readonly importButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textarea = page.locator('textarea[placeholder*="Paste"]');
    this.importButton = page.locator('button', { hasText: /^Import$/ });
  }

  /** Open the import dialog with Ctrl+I */
  async open() {
    await this.page.keyboard.press('Control+i');
    await expect(this.textarea).toBeVisible({ timeout: 5_000 });
  }

  /** Import a SMILES string and wait for the dialog to close */
  async importSmiles(smiles: string) {
    await this.open();
    await this.textarea.fill(smiles);
    await this.importButton.click();
    // Dialog auto-closes after 800ms on success
    await this.page.waitForTimeout(1_200);
  }
}
