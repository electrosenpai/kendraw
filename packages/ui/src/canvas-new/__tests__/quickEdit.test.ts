// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect } from 'vitest';
import { resolveQuickEditCommand } from '../quickEdit';
import {
  createAtom,
  createBond,
  type AtomId,
  type BondId,
  type Page,
} from '@kendraw/scene';

function pageWithSingleAtom(): { page: Page; atomId: AtomId } {
  const atom = createAtom(0, 0); // carbon by default
  const page: Page = {
    id: 'p',
    atoms: { [atom.id]: atom },
    bonds: {},
    arrows: {},
    annotations: {},
    groups: {},
    shapes: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  } as Page;
  return { page, atomId: atom.id };
}

function pageWithBond(): {
  page: Page;
  atomId: AtomId;
  bondId: BondId;
} {
  const a = createAtom(0, 0);
  const b = createAtom(40, 0);
  const bond = createBond(a.id, b.id, 1, 'single');
  const page: Page = {
    id: 'p',
    atoms: { [a.id]: a, [b.id]: b },
    bonds: { [bond.id]: bond },
    arrows: {},
    annotations: {},
    groups: {},
    shapes: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  } as Page;
  return { page, atomId: a.id, bondId: bond.id };
}

describe('resolveQuickEditCommand (W4-R-08)', () => {
  it('hover atom + N → update-atom to nitrogen (Z=7)', () => {
    const { page, atomId } = pageWithSingleAtom();
    const cmd = resolveQuickEditCommand('N', { atomId }, page);
    expect(cmd).not.toBeNull();
    expect(cmd?.type).toBe('update-atom');
    if (cmd?.type === 'update-atom') {
      expect(cmd.changes.element).toBe(7);
    }
  });

  it('hover atom + lowercase n → also nitrogen (case insensitive)', () => {
    const { page, atomId } = pageWithSingleAtom();
    const cmd = resolveQuickEditCommand('n', { atomId }, page);
    expect(cmd?.type).toBe('update-atom');
  });

  it('hover atom + L → chlorine (Cl) shorthand', () => {
    const { page, atomId } = pageWithSingleAtom();
    const cmd = resolveQuickEditCommand('L', { atomId }, page);
    if (cmd?.type !== 'update-atom') throw new Error('expected update-atom');
    expect(cmd.changes.element).toBe(17);
  });

  it('hover atom + M → methyl-style label "Me" on a carbon', () => {
    const { page, atomId } = pageWithSingleAtom();
    const cmd = resolveQuickEditCommand('M', { atomId }, page);
    if (cmd?.type !== 'update-atom') throw new Error('expected update-atom');
    expect(cmd.changes.label).toBe('Me');
    expect(cmd.changes.element).toBe(6);
  });

  it('hover atom + same element key is a no-op', () => {
    const { page, atomId } = pageWithSingleAtom(); // already C
    const cmd = resolveQuickEditCommand('C', { atomId }, page);
    expect(cmd).toBeNull();
  });

  it('unknown key returns null', () => {
    const { page, atomId } = pageWithSingleAtom();
    expect(resolveQuickEditCommand('Q', { atomId }, page)).toBeNull();
  });

  it('hover bond + 2 → set-bond-style order=2', () => {
    const { page, bondId } = pageWithBond();
    const cmd = resolveQuickEditCommand('2', { bondId }, page);
    if (cmd?.type !== 'set-bond-style') throw new Error('expected set-bond-style');
    expect(cmd.order).toBe(2);
    expect(cmd.style).toBe('double');
  });

  it('hover atom with single outgoing bond + 3 → set that bond to triple', () => {
    const { page, atomId, bondId } = pageWithBond();
    const cmd = resolveQuickEditCommand('3', { atomId }, page);
    if (cmd?.type !== 'set-bond-style') throw new Error('expected set-bond-style');
    expect(cmd.id).toBe(bondId);
    expect(cmd.order).toBe(3);
  });

  it('no hover target → null even for valid keys', () => {
    const { page } = pageWithSingleAtom();
    expect(resolveQuickEditCommand('N', {}, page)).toBeNull();
  });
});
