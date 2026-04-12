import { describe, it, expect } from 'vitest';
import {
  createSelection,
  addToSelection,
  removeFromSelection,
  toggleInSelection,
  clearSelection,
  isSelected,
} from '../selection.js';
import type { AtomId, BondId } from '../types.js';

const atomId = (id: string) => id as AtomId;
const bondId = (id: string) => id as BondId;

describe('Selection', () => {
  describe('createSelection', () => {
    it('creates an empty selection', () => {
      const sel = createSelection();
      expect(sel.atomIds).toEqual([]);
      expect(sel.bondIds).toEqual([]);
    });
  });

  describe('addToSelection', () => {
    it('adds atom ids', () => {
      let sel = createSelection();
      sel = addToSelection(sel, { atomIds: [atomId('a1'), atomId('a2')] });
      expect(sel.atomIds).toEqual([atomId('a1'), atomId('a2')]);
    });

    it('adds bond ids', () => {
      let sel = createSelection();
      sel = addToSelection(sel, { bondIds: [bondId('b1')] });
      expect(sel.bondIds).toEqual([bondId('b1')]);
    });

    it('does not duplicate ids', () => {
      let sel = createSelection();
      sel = addToSelection(sel, { atomIds: [atomId('a1')] });
      sel = addToSelection(sel, { atomIds: [atomId('a1')] });
      expect(sel.atomIds).toEqual([atomId('a1')]);
    });
  });

  describe('removeFromSelection', () => {
    it('removes atom ids', () => {
      let sel = createSelection();
      sel = addToSelection(sel, { atomIds: [atomId('a1'), atomId('a2')] });
      sel = removeFromSelection(sel, { atomIds: [atomId('a1')] });
      expect(sel.atomIds).toEqual([atomId('a2')]);
    });
  });

  describe('toggleInSelection', () => {
    it('adds if not present', () => {
      let sel = createSelection();
      sel = toggleInSelection(sel, { atomIds: [atomId('a1')] });
      expect(sel.atomIds).toContain(atomId('a1'));
    });

    it('removes if already present', () => {
      let sel = createSelection();
      sel = addToSelection(sel, { atomIds: [atomId('a1')] });
      sel = toggleInSelection(sel, { atomIds: [atomId('a1')] });
      expect(sel.atomIds).not.toContain(atomId('a1'));
    });
  });

  describe('clearSelection', () => {
    it('empties all ids', () => {
      let sel = createSelection();
      sel = addToSelection(sel, {
        atomIds: [atomId('a1')],
        bondIds: [bondId('b1')],
      });
      sel = clearSelection(sel);
      expect(sel.atomIds).toEqual([]);
      expect(sel.bondIds).toEqual([]);
    });
  });

  describe('isSelected', () => {
    it('returns true for selected atom', () => {
      let sel = createSelection();
      sel = addToSelection(sel, { atomIds: [atomId('a1')] });
      expect(isSelected(sel, atomId('a1'))).toBe(true);
    });

    it('returns false for non-selected atom', () => {
      const sel = createSelection();
      expect(isSelected(sel, atomId('a1'))).toBe(false);
    });
  });
});
