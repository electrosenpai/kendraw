/**
 * Unit tests for the hotkey-gating primitive.
 *
 * @see packages/ui/src/hooks/useIsEditingText.ts
 *
 * These tests guarantee the single-source-of-truth gate behaves correctly
 * for every kind of focused element we care about. A regression here means
 * typing in a text input would once again fire atom hotkeys (the Nano bug).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isEditingTextNow } from '../hooks/useIsEditingText';

function mount(el: HTMLElement): void {
  document.body.appendChild(el);
}

function cleanup(): void {
  document.body.innerHTML = '';
}

describe('isEditingTextNow', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('returns true for a focused <input> with default type', () => {
    const input = document.createElement('input');
    mount(input);
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(isEditingTextNow()).toBe(true);
  });

  it('returns true for a focused <input type="text">', () => {
    const input = document.createElement('input');
    input.type = 'text';
    mount(input);
    input.focus();
    expect(isEditingTextNow()).toBe(true);
  });

  it('returns true for a focused <input type="search">', () => {
    const input = document.createElement('input');
    input.type = 'search';
    mount(input);
    input.focus();
    expect(isEditingTextNow()).toBe(true);
  });

  it('returns true for a focused <input type="email">', () => {
    const input = document.createElement('input');
    input.type = 'email';
    mount(input);
    input.focus();
    expect(isEditingTextNow()).toBe(true);
  });

  it('returns true for a focused <input type="number">', () => {
    const input = document.createElement('input');
    input.type = 'number';
    mount(input);
    input.focus();
    expect(isEditingTextNow()).toBe(true);
  });

  it('returns true for a focused <textarea>', () => {
    const ta = document.createElement('textarea');
    mount(ta);
    ta.focus();
    expect(isEditingTextNow()).toBe(true);
  });

  it('returns true for an element with data-text-editing="true"', () => {
    const div = document.createElement('div');
    div.setAttribute('data-text-editing', 'true');
    div.tabIndex = 0;
    mount(div);
    div.focus();
    expect(isEditingTextNow()).toBe(true);
  });

  it('returns false for a focused <button>', () => {
    const btn = document.createElement('button');
    mount(btn);
    btn.focus();
    expect(isEditingTextNow()).toBe(false);
  });

  it('returns false for a focused <input type="checkbox">', () => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    mount(input);
    input.focus();
    expect(isEditingTextNow()).toBe(false);
  });

  it('returns false for a focused <input type="file">', () => {
    const input = document.createElement('input');
    input.type = 'file';
    mount(input);
    expect(isEditingTextNow()).toBe(false);
  });

  it('returns false when only <body> is active', () => {
    cleanup();
    expect(
      document.activeElement === document.body || document.activeElement === null,
    ).toBe(true);
    expect(isEditingTextNow()).toBe(false);
  });

  it('returns false when activeElement is null', () => {
    const origDesc = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(document),
      'activeElement',
    );
    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: () => null,
    });
    try {
      expect(isEditingTextNow()).toBe(false);
    } finally {
      if (origDesc) {
        Object.defineProperty(
          Object.getPrototypeOf(document),
          'activeElement',
          origDesc,
        );
      }
      // Remove the instance override so native getter is used again
      // @ts-expect-error — cleanup of our configurable override
      delete (document as Document).activeElement;
    }
  });
});

describe('hotkey handler gating pattern', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('a gated handler short-circuits when a text input has focus', () => {
    const action = vi.fn();
    function handleKeyDown(_e: KeyboardEvent) {
      if (isEditingTextNow()) return;
      action();
    }
    const input = document.createElement('input');
    input.type = 'text';
    mount(input);
    input.focus();
    expect(isEditingTextNow()).toBe(true);
    handleKeyDown(new KeyboardEvent('keydown', { key: 'n' }));
    expect(action).not.toHaveBeenCalled();
  });

  it('a gated handler runs when no text input has focus', () => {
    const action = vi.fn();
    function handleKeyDown(_e: KeyboardEvent) {
      if (isEditingTextNow()) return;
      action();
    }
    const btn = document.createElement('button');
    mount(btn);
    btn.focus();
    handleKeyDown(new KeyboardEvent('keydown', { key: 'n' }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('the gate becomes permissive again after the input is removed', () => {
    const action = vi.fn();
    function handleKeyDown(_e: KeyboardEvent) {
      if (isEditingTextNow()) return;
      action();
    }
    const input = document.createElement('input');
    input.type = 'text';
    mount(input);
    input.focus();
    expect(isEditingTextNow()).toBe(true);
    handleKeyDown(new KeyboardEvent('keydown', { key: 'n' }));
    expect(action).not.toHaveBeenCalled();

    cleanup();
    handleKeyDown(new KeyboardEvent('keydown', { key: 'n' }));
    expect(action).toHaveBeenCalledTimes(1);
  });
});
