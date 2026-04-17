// Design inspired by Ketcher (EPAM Systems, Apache 2.0) and ChemDraw.
// Reimplemented from scratch for Kendraw.
//
// Wave-5 W4-R-08 — pure mapping from a keyboard key to either an
// `update-atom` (element change) or a `cycle-bond` (bond order change).
// No DOM, no store, no React.

import type { AtomId, BondId, Command, Page } from '@kendraw/scene';

/** Atomic-number lookup for the keyboard shortcuts ChemDraw and Ketcher
 *  agree on. Values come from the periodic table; the choices are the
 *  conventional one-keystroke aliases. */
const ELEMENT_KEY_TO_Z: Readonly<Record<string, number>> = Object.freeze({
  C: 6,
  N: 7,
  O: 8,
  S: 16,
  F: 9,
  P: 15,
  B: 5,
  L: 17, // Cl (chlorine — "L" matches ChemDraw's lowercase L mnemonic)
  I: 53,
  H: 1,
});

const METHYL_KEY = 'M';

const BOND_ORDER_KEYS: Readonly<Record<string, 1 | 2 | 3>> = Object.freeze({
  '1': 1,
  '2': 2,
  '3': 3,
});

const STYLE_FOR_ORDER: Record<1 | 2 | 3, 'single' | 'double' | 'triple'> = {
  1: 'single',
  2: 'double',
  3: 'triple',
};

export interface QuickEditTarget {
  readonly atomId?: AtomId | null;
  readonly bondId?: BondId | null;
}

/** Resolve a single keypress against a hover target into a scene command.
 *  Returns null when the key is not a recognised quick-edit shortcut, or
 *  when the change would be a no-op (same element, same order). */
export function resolveQuickEditCommand(
  key: string,
  target: QuickEditTarget,
  page: Page,
): Command | null {
  const upper = key.toUpperCase();

  // Element change on hovered atom (C / N / O / S / F / P / B / L / I / H).
  if (target.atomId) {
    const atom = page.atoms[target.atomId];
    if (!atom) return null;
    const z = ELEMENT_KEY_TO_Z[upper];
    if (z !== undefined && atom.element !== z) {
      // Drop any explicit label when the element changes — the renderer
      // falls back to the canonical symbol.
      const changes: { element: number; label?: string } = { element: z };
      return {
        type: 'update-atom',
        id: target.atomId,
        changes,
      };
    }
    if (upper === METHYL_KEY) {
      // "M" on a hovered atom means "set this atom to a methyl group" —
      // we model that as carbon with an explicit "Me" label so the
      // renderer shows the abbreviation; no fragment expansion in wave-5.
      if (atom.element === 6 && atom.label === 'Me') return null;
      return {
        type: 'update-atom',
        id: target.atomId,
        changes: { element: 6, label: 'Me' },
      };
    }
  }

  // Bond order change. If a bond is hovered, key 1/2/3 sets that order. If
  // an atom is hovered with exactly one outgoing bond, the same keys mutate
  // that bond — matching ChemDraw's "hover atom + 2" workflow.
  const orderKey = BOND_ORDER_KEYS[upper];
  if (orderKey) {
    const bondId = target.bondId ?? singleIncidentBond(page, target.atomId);
    if (!bondId) return null;
    const bond = page.bonds[bondId];
    if (!bond) return null;
    if (bond.order === orderKey) return null;
    return {
      type: 'set-bond-style',
      id: bondId,
      order: orderKey,
      style: STYLE_FOR_ORDER[orderKey],
    };
  }

  return null;
}

function singleIncidentBond(page: Page, atomId: AtomId | null | undefined): BondId | null {
  if (!atomId) return null;
  let only: BondId | null = null;
  for (const id in page.bonds) {
    const bond = page.bonds[id as BondId];
    if (!bond) continue;
    if (bond.fromAtomId === atomId || bond.toAtomId === atomId) {
      if (only) return null;
      only = bond.id;
    }
  }
  return only;
}

export const __testing__ = {
  ELEMENT_KEY_TO_Z,
  BOND_ORDER_KEYS,
  STYLE_FOR_ORDER,
};
