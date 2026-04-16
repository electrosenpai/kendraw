import { type Page, type Locator } from '@playwright/test';

/** Page Object Model for the properties panel. */
export class PropertyPanel {
  readonly page: Page;
  readonly panel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-testid="properties-panel"]');
  }

  /** Get the displayed formula text */
  async getFormula(): Promise<string> {
    const row = this.panel.locator('text=Formula').locator('..');
    return (await row.textContent()) ?? '';
  }

  /** Get the displayed molecular weight as a number */
  async getMW(): Promise<number> {
    const row = this.panel.locator('text=MW').locator('..');
    const text = (await row.textContent()) ?? '';
    const match = text.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /** Check if the export button for a given format exists */
  async hasExportButton(format: 'SVG' | 'MOL' | 'PNG' | 'PDF'): Promise<boolean> {
    return this.panel.locator('button', { hasText: format }).isVisible();
  }

  /** Click an export button */
  async clickExport(format: 'SVG' | 'MOL' | 'PNG' | 'PDF') {
    await this.panel.locator('button', { hasText: format }).click();
  }
}
