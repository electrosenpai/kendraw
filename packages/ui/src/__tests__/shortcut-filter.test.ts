import { describe, it, expect } from 'vitest';
import { filterShortcuts } from '../ShortcutCheatsheet.js';

describe('filterShortcuts — wave-2 B3', () => {
  it('returns full list when query is empty', () => {
    const result = filterShortcuts('');
    expect(result.length).toBeGreaterThan(5);
  });

  it('returns full list when query is only whitespace', () => {
    const result = filterShortcuts('   ');
    expect(result.length).toBeGreaterThan(5);
  });

  it('filters by description (case-insensitive)', () => {
    const result = filterShortcuts('Undo');
    const allItems = result.flatMap((s) => s.items);
    expect(allItems.some((i) => i.desc === 'Undo')).toBe(true);
    expect(allItems.some((i) => i.desc === 'Redo')).toBe(false);
  });

  it('filters by key (case-insensitive)', () => {
    const result = filterShortcuts('ctrl+z');
    const allItems = result.flatMap((s) => s.items);
    expect(allItems.some((i) => i.key === 'Ctrl+Z')).toBe(true);
  });

  it('drops categories with no matches', () => {
    const result = filterShortcuts('xyznonexistent');
    expect(result).toHaveLength(0);
  });

  it('includes alignment shortcuts (wave-2 B1) in the dataset', () => {
    const result = filterShortcuts('align');
    const allItems = result.flatMap((s) => s.items);
    expect(allItems.length).toBeGreaterThanOrEqual(4);
  });

  it('includes Ctrl+P print shortcut (wave-2 A5) in the dataset', () => {
    const result = filterShortcuts('print');
    const allItems = result.flatMap((s) => s.items);
    expect(allItems.some((i) => i.key === 'Ctrl+P')).toBe(true);
  });

  it('includes compound numbering shortcut (wave-2 A1) in the dataset', () => {
    const result = filterShortcuts('compound');
    const allItems = result.flatMap((s) => s.items);
    expect(allItems.some((i) => i.desc.toLowerCase().includes('compound'))).toBe(true);
  });
});
