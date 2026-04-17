import { type Page, type Locator, expect } from '@playwright/test';

/** Tool IDs matching data-testid="tool-{id}" in ToolPalette.tsx */
export const TOOL_IDS = [
  'select',
  'add-atom',
  'add-bond',
  'ring',
  'eraser',
  'pan',
  'arrow',
  'curly-arrow',
  'text',
  'nmr',
  'molecules',
  'import',
  'compound-numbering',
  'undo',
  'redo',
  'fit',
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

/** Page Object Model for the toolbar / tool palette. */
export class ToolPalette {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Get the locator for a specific tool button */
  tool(id: ToolId): Locator {
    return this.page.locator(`[data-testid="tool-${id}"]`);
  }

  /** Click a tool button */
  async selectTool(id: ToolId) {
    await this.tool(id).click();
  }

  /** Check that a tool button is visible */
  async assertToolVisible(id: ToolId) {
    await expect(this.tool(id)).toBeVisible();
  }

  /** Get the list of all visible tool IDs */
  async getVisibleTools(): Promise<string[]> {
    const visible: string[] = [];
    for (const id of TOOL_IDS) {
      if (
        await this.tool(id)
          .isVisible()
          .catch(() => false)
      ) {
        visible.push(id);
      }
    }
    return visible;
  }
}
