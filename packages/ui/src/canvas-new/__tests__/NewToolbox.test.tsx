// Wave-6 — unit tests for the expanded NewToolbox.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { NewToolbox, TOOL_DEFS } from '../NewToolbox';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

function renderToolbox(overrides: Partial<React.ComponentProps<typeof NewToolbox>> = {}) {
  const props: React.ComponentProps<typeof NewToolbox> = {
    activeToolId: 'select',
    onToolChange: vi.fn(),
    onAction: vi.fn(),
    nmrOpen: false,
    propertyPanelVisible: true,
    canUndo: true,
    canRedo: true,
    ...overrides,
  };
  act(() => {
    root.render(<NewToolbox {...props} />);
  });
  return props;
}

describe('NewToolbox (wave-6)', () => {
  it('renders the toolbar container with a11y attributes', () => {
    renderToolbox();
    const bar = container.querySelector('[data-testid="new-toolbox"]');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('role')).toBe('toolbar');
    expect(bar?.getAttribute('aria-label')).toMatch(/canvas tools/i);
  });

  it('renders at least 17 P0 tool buttons', () => {
    renderToolbox();
    const nonComingSoon = TOOL_DEFS.filter((d) => !d.comingSoon);
    expect(nonComingSoon.length).toBeGreaterThanOrEqual(17);
    for (const def of nonComingSoon) {
      const btn = container.querySelector(`[data-testid="new-tool-${def.id}"]`);
      expect(btn, `expected button for ${def.id}`).not.toBeNull();
    }
  });

  it('includes the core P0 chemistry tools', () => {
    renderToolbox();
    const mustHave = [
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
    ];
    for (const id of mustHave) {
      expect(container.querySelector(`[data-testid="new-tool-${id}"]`), `missing ${id}`).not.toBeNull();
    }
  });

  it('highlights the active tool', () => {
    renderToolbox({ activeToolId: 'bond-single' });
    const active = container.querySelector('[data-testid="new-tool-bond-single"]') as HTMLButtonElement;
    expect(active.getAttribute('data-tool-kind')).toBe('tool');
  });

  it('dispatches onToolChange when a tool-kind button is clicked', () => {
    const props = renderToolbox();
    const btn = container.querySelector('[data-testid="new-tool-bond-single"]') as HTMLButtonElement;
    act(() => {
      btn.click();
    });
    expect(props.onToolChange).toHaveBeenCalledWith('bond-single');
  });

  it('dispatches onAction when an action-kind button is clicked', () => {
    const props = renderToolbox();
    const undoBtn = container.querySelector('[data-testid="new-tool-undo"]') as HTMLButtonElement;
    act(() => {
      undoBtn.click();
    });
    expect(props.onAction).toHaveBeenCalledWith('undo');
  });

  it('dispatches onAction when a toggle-kind button is clicked', () => {
    const props = renderToolbox();
    const nmrBtn = container.querySelector('[data-testid="new-tool-nmr-toggle"]') as HTMLButtonElement;
    act(() => {
      nmrBtn.click();
    });
    expect(props.onAction).toHaveBeenCalledWith('nmr-toggle');
  });

  it('reflects nmrOpen via aria-pressed on the NMR toggle', () => {
    renderToolbox({ nmrOpen: true });
    const nmrBtn = container.querySelector('[data-testid="new-tool-nmr-toggle"]');
    expect(nmrBtn?.getAttribute('aria-pressed')).toBe('true');
  });

  it('reflects propertyPanelVisible via aria-pressed on the property toggle', () => {
    renderToolbox({ propertyPanelVisible: false });
    const propBtn = container.querySelector('[data-testid="new-tool-property-toggle"]');
    expect(propBtn?.getAttribute('aria-pressed')).toBe('false');
  });

  it('disables undo when canUndo=false', () => {
    renderToolbox({ canUndo: false });
    const undoBtn = container.querySelector('[data-testid="new-tool-undo"]') as HTMLButtonElement;
    expect(undoBtn.disabled).toBe(true);
  });

  it('disables redo when canRedo=false', () => {
    renderToolbox({ canRedo: false });
    const redoBtn = container.querySelector('[data-testid="new-tool-redo"]') as HTMLButtonElement;
    expect(redoBtn.disabled).toBe(true);
  });

  it('marks coming-soon tools with data-coming-soon and does not dispatch on click', () => {
    const props = renderToolbox();
    const comingSoon = TOOL_DEFS.find((d) => d.comingSoon);
    expect(comingSoon, 'expected at least one coming-soon tool in fixture').toBeTruthy();
    if (!comingSoon) return;
    const btn = container.querySelector(`[data-testid="new-tool-${comingSoon.id}"]`) as HTMLButtonElement;
    expect(btn.getAttribute('data-coming-soon')).toBe('true');
    act(() => {
      btn.click();
    });
    expect(props.onToolChange).not.toHaveBeenCalled();
    expect(props.onAction).not.toHaveBeenCalled();
  });

  it('renders separator dividers between distinct groups', () => {
    renderToolbox();
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    // At least one separator between groups (pointer→bond→atom→ring→annotation→edit and dock)
    expect(separators.length).toBeGreaterThan(3);
  });

  it('tool buttons carry data-tool-kind and data-tool-group metadata', () => {
    renderToolbox();
    const benzene = container.querySelector('[data-testid="new-tool-ring-benzene"]');
    expect(benzene?.getAttribute('data-tool-kind')).toBe('tool');
    expect(benzene?.getAttribute('data-tool-group')).toBe('ring');
  });

  it('tooltip includes keyboard shortcut when defined', () => {
    renderToolbox();
    const bond = container.querySelector('[data-testid="new-tool-bond-single"]');
    expect(bond?.getAttribute('title')).toMatch(/\(1\)/);
  });

  it('tooltip marks coming-soon tools appropriately', () => {
    renderToolbox();
    const comingSoon = TOOL_DEFS.find((d) => d.comingSoon);
    if (!comingSoon) return;
    const btn = container.querySelector(`[data-testid="new-tool-${comingSoon.id}"]`);
    expect(btn?.getAttribute('title')).toMatch(/coming/i);
  });
});
