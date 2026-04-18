// Wave-6 — unit tests for the tool hotkey hook.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import {
  buildToolHotkeyMap,
  useToolHotkeys,
} from '../toolbox/useToolHotkeys';
import type { NewToolboxToolId } from '../toolbox/types';

describe('buildToolHotkeyMap', () => {
  const map = buildToolHotkeyMap();

  it('maps core ChemDraw shortcuts to the expected tool ids', () => {
    expect(map['V']).toBe('select');
    expect(map['1']).toBe('bond-single');
    expect(map['2']).toBe('bond-double');
    expect(map['3']).toBe('bond-triple');
    expect(map['C']).toBe('atom-c');
    expect(map['H']).toBe('atom-h');
    expect(map['N']).toBe('atom-n');
    expect(map['O']).toBe('atom-o');
    expect(map['S']).toBe('atom-s');
    expect(map['R']).toBe('ring-benzene');
    expect(map['T']).toBe('text');
    expect(map['E']).toBe('erase');
  });

  it('skips coming-soon tools so their shortcuts are free for live tools', () => {
    // 'W' belongs to bond-wedge (coming-soon) AND arrow (live);
    // only arrow should land in the map.
    expect(map['W']).toBe('arrow');
  });

  it('never stores a multi-character shortcut (Ctrl+Z etc.) in the single-key map', () => {
    for (const k of Object.keys(map)) {
      expect(k.length).toBe(1);
    }
  });
});

describe('useToolHotkeys', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onChange: (id: NewToolboxToolId) => void;
  let onChangeCalls: NewToolboxToolId[];

  function Harness({
    enabled,
    cb,
  }: {
    enabled: boolean;
    cb: (id: NewToolboxToolId) => void;
  }) {
    useToolHotkeys(cb, { enabled });
    return null;
  }

  function mount(enabled = true) {
    onChangeCalls = [];
    onChange = (id: NewToolboxToolId) => {
      onChangeCalls.push(id);
    };
    act(() => {
      root.render(<Harness enabled={enabled} cb={onChange} />);
    });
  }

  function press(key: string, modifiers: Partial<KeyboardEventInit> = {}) {
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key, ...modifiers, bubbles: true }),
      );
    });
  }

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
    document.body.innerHTML = '';
  });

  it('dispatches onToolChange for a single-key tool shortcut', () => {
    mount();
    press('1');
    expect(onChangeCalls).toContain('bond-single');
  });

  it('is case-insensitive — lowercase matches uppercase shortcuts', () => {
    mount();
    press('c');
    expect(onChangeCalls).toContain('atom-c');
  });

  it('ignores keystrokes when a modifier is held (Ctrl/Meta/Alt)', () => {
    mount();
    press('1', { ctrlKey: true });
    press('C', { metaKey: true });
    press('S', { altKey: true });
    expect(onChangeCalls).toEqual([]);
  });

  it('ignores keystrokes while an input has focus', () => {
    mount();
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();
    press('H');
    expect(onChangeCalls).toEqual([]);
  });

  it('ignores keystrokes while a textarea has focus', () => {
    mount();
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    press('N');
    expect(onChangeCalls).toEqual([]);
  });

  it('ignores keys with no matching tool', () => {
    mount();
    press('Q');
    press('Z');
    expect(onChangeCalls).toEqual([]);
  });

  it('does not install any listener when enabled=false', () => {
    mount(false);
    press('V');
    expect(onChangeCalls).toEqual([]);
  });

  it('cleans up the listener on unmount', () => {
    mount();
    act(() => {
      root.unmount();
    });
    press('V');
    expect(onChangeCalls).toEqual([]);
  });
});
