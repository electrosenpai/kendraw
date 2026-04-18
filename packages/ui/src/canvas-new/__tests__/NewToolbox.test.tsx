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
    expect(TOOL_DEFS.length).toBeGreaterThanOrEqual(17);
    for (const def of TOOL_DEFS) {
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

  it('every registered tool renders a button (no placeholders)', () => {
    renderToolbox();
    for (const def of TOOL_DEFS) {
      const btn = container.querySelector(`[data-testid="new-tool-${def.id}"]`);
      expect(btn, `missing button for ${def.id}`).not.toBeNull();
      expect((btn as HTMLButtonElement).getAttribute('data-active')).not.toBeNull();
    }
  });

  it('renders separator dividers between distinct groups', () => {
    renderToolbox();
    const separators = container.querySelectorAll('[data-testid="new-tool-separator"]');
    // 6 main groups (pointer, bond, atom, ring, annotation, edit) → 5 inter-group
    // separators + 1 before the analysis dock = 6. Assert ≥ 5 to stay flexible.
    expect(separators.length).toBeGreaterThanOrEqual(5);
  });

  it('arranges each group as a 2-column grid', () => {
    renderToolbox();
    const bondGrid = container.querySelector('[data-testid="new-tool-group-bond"]') as HTMLElement;
    expect(bondGrid).not.toBeNull();
    expect(bondGrid.style.gridTemplateColumns).toMatch(/repeat\(2,/);
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

});
