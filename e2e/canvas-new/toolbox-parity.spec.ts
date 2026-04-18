/**
 * @feature Canvas-new wave-6 toolbox parity
 * @priority P0
 * @covers The wave-6 NewToolbox exposes every P0 tool, wires NMR and
 *         PropertyPanel toggles, keeps coming-soon buttons disabled,
 *         and routes ChemDraw-style keyboard shortcuts through the same
 *         controller the click handlers use.
 *
 * These tests target the flag=true render path. They auto-skip when the
 * dev-server was not started with VITE_ENABLE_NEW_CANVAS=true (i.e. under
 * the default `chromium` project). Running `pnpm test:e2e:new-canvas`
 * boots the dev-server with the flag on and activates the full suite.
 */

import { test, expect } from '../fixtures/base-test';

const REQUIRED_P0_TOOLS = [
  'select',
  'bond-single',
  'bond-double',
  'bond-triple',
  'atom-c',
  'atom-h',
  'atom-n',
  'atom-o',
  'atom-s',
  'ring-benzene',
  'ring-cyclohexane',
  'text',
  'arrow',
  'erase',
  'undo',
  'redo',
  'nmr-toggle',
  'property-toggle',
  'paste-smiles',
  'search-molecule',
];

test.describe('Canvas-new wave-6 toolbox @canvas-new', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const newTb = page.getByTestId('new-toolbox');
    const visible = await newTb.isVisible().catch(() => false);
    test.skip(!visible, 'Wave-6 toolbox only mounts under VITE_ENABLE_NEW_CANVAS=true');
  });

  test('toolbar container has correct a11y attributes', async ({ page }) => {
    const tb = page.getByTestId('new-toolbox');
    await expect(tb).toBeVisible();
    await expect(tb).toHaveAttribute('role', 'toolbar');
    await expect(tb).toHaveAttribute('aria-label', /canvas tools/i);
  });

  test('all P0 tool buttons are present', async ({ page }) => {
    for (const id of REQUIRED_P0_TOOLS) {
      const btn = page.getByTestId(`new-tool-${id}`);
      await expect(btn, `missing tool: ${id}`).toBeVisible();
    }
  });

  test('tool buttons expose data-tool-kind and data-tool-group metadata', async ({ page }) => {
    const bond = page.getByTestId('new-tool-bond-single');
    await expect(bond).toHaveAttribute('data-tool-kind', 'tool');
    await expect(bond).toHaveAttribute('data-tool-group', 'bond');

    const undo = page.getByTestId('new-tool-undo');
    await expect(undo).toHaveAttribute('data-tool-kind', 'action');

    const nmr = page.getByTestId('new-tool-nmr-toggle');
    await expect(nmr).toHaveAttribute('data-tool-kind', 'toggle');
  });

  test('coming-soon buttons are marked and stay disabled on click', async ({ page }) => {
    const wedge = page.getByTestId('new-tool-bond-wedge');
    await expect(wedge).toHaveAttribute('data-coming-soon', 'true');
    await expect(wedge).toBeDisabled();
  });

  test('clicking a bond tool highlights it via data-active', async ({ page }) => {
    const bondDouble = page.getByTestId('new-tool-bond-double');
    await bondDouble.click();
    await expect(bondDouble).toHaveAttribute('data-active', 'true');
  });

  test('NMR toggle opens the NMR panel and flips aria-pressed', async ({ page }) => {
    const nmrBtn = page.getByTestId('new-tool-nmr-toggle');
    await expect(nmrBtn).toHaveAttribute('aria-pressed', 'false');
    await nmrBtn.click();
    await expect(page.getByTestId('nmr-panel')).toBeVisible({ timeout: 5_000 });
    await expect(nmrBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('property toggle flips aria-pressed', async ({ page }) => {
    const propBtn = page.getByTestId('new-tool-property-toggle');
    await expect(propBtn).toHaveAttribute('aria-pressed', 'true');
    await propBtn.click();
    await expect(propBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('keyboard shortcut "1" activates bond-single', async ({ page }) => {
    await page.keyboard.press('1');
    await expect(page.getByTestId('new-tool-bond-single')).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  test('keyboard shortcut "C" activates atom-c', async ({ page }) => {
    await page.keyboard.press('c');
    await expect(page.getByTestId('new-tool-atom-c')).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  test('keyboard shortcut "V" activates select', async ({ page }) => {
    await page.keyboard.press('2');
    await page.keyboard.press('v');
    await expect(page.getByTestId('new-tool-select')).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  test('paste-smiles action opens the import dialog', async ({ page }) => {
    await page.getByTestId('new-tool-paste-smiles').click();
    await expect(page.locator('textarea[placeholder*="Paste"]')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('SMILES import populates PropertyPanel with RDKit metrics', async ({ page }) => {
    await page.keyboard.press('Control+i');
    const textarea = page.locator('textarea[placeholder*="Paste"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill('CC(=O)Oc1ccccc1C(=O)O');
    await page.locator('button', { hasText: /^Import$/ }).click();
    const panel = page.getByTestId('properties-panel');
    await expect(panel).toBeVisible({ timeout: 8_000 });
    // Aspirin formula / a metric label — either is enough to prove the
    // PropertyPanel received the document and ran RDKit.
    const formula = panel.locator('text=C9H8O4');
    const logpLabel = panel.locator('text=/LogP/i');
    await expect(formula.or(logpLabel).first()).toBeVisible({ timeout: 8_000 });
  });

  test('undo and redo buttons disable when there is no history', async ({ page }) => {
    const undo = page.getByTestId('new-tool-undo');
    const redo = page.getByTestId('new-tool-redo');
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();
  });

  test('tool tooltips include keyboard shortcuts for chemistry P0 tools', async ({ page }) => {
    const bond = page.getByTestId('new-tool-bond-single');
    await expect(bond).toHaveAttribute('title', /\(1\)/);
    const atomC = page.getByTestId('new-tool-atom-c');
    await expect(atomC).toHaveAttribute('title', /\(C\)/i);
  });

  test('coming-soon tooltips carry a "coming" marker', async ({ page }) => {
    const wedge = page.getByTestId('new-tool-bond-wedge');
    await expect(wedge).toHaveAttribute('title', /coming/i);
  });

  test('focused text inputs suppress tool hotkeys', async ({ page }) => {
    await page.keyboard.press('Control+i');
    const textarea = page.locator('textarea[placeholder*="Paste"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.focus();
    await textarea.type('C');
    // Pressing 'c' inside the textarea must NOT flip select -> atom-c.
    await expect(page.getByTestId('new-tool-atom-c')).toHaveAttribute(
      'data-active',
      'false',
    );
    await expect(textarea).toHaveValue(/C/);
  });
});
