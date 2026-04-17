import { describe, it, expect } from 'vitest';
import { createSceneStore, createEmptyDocument, createAtom, createBond } from '../index.js';
import {
  findConnectedComponents,
  reconcileCompoundNumbers,
  repackCompoundNumbers,
  computeCompoundLabels,
} from '../compound-numbering.js';
import type { Document, Page } from '../types.js';

function getPage(doc: Document): Page {
  const page = doc.pages[0];
  if (!page) throw new Error('no page');
  return page;
}

function addMolecule(
  doc: Document,
  coords: Array<[number, number]>,
): { atomIds: string[] } {
  const page = getPage(doc);
  const atoms = coords.map(([x, y]) => createAtom(x, y, 6));
  for (const a of atoms) page.atoms[a.id] = a;
  for (let i = 1; i < atoms.length; i++) {
    const prev = atoms[i - 1];
    const curr = atoms[i];
    if (!prev || !curr) continue;
    const b = createBond(prev.id, curr.id, 1, 'single');
    page.bonds[b.id] = b;
  }
  return { atomIds: atoms.map((a) => a.id) };
}

describe('findConnectedComponents', () => {
  it('returns empty for empty page', () => {
    const doc = createEmptyDocument();
    expect(findConnectedComponents(getPage(doc))).toEqual([]);
  });

  it('finds one component for a connected molecule', () => {
    const doc = createEmptyDocument();
    addMolecule(doc, [
      [0, 0],
      [10, 0],
      [20, 0],
    ]);
    const components = findConnectedComponents(getPage(doc));
    expect(components).toHaveLength(1);
    expect(components[0]?.atomIds).toHaveLength(3);
  });

  it('finds separate components for disjoint molecules', () => {
    const doc = createEmptyDocument();
    addMolecule(doc, [
      [0, 0],
      [10, 0],
    ]);
    addMolecule(doc, [
      [100, 100],
      [110, 100],
    ]);
    const components = findConnectedComponents(getPage(doc));
    expect(components).toHaveLength(2);
  });

  it('computes bbox for each component', () => {
    const doc = createEmptyDocument();
    addMolecule(doc, [
      [0, 0],
      [50, 30],
    ]);
    const components = findConnectedComponents(getPage(doc));
    expect(components[0]?.bbox).toEqual({ x: 0, y: 0, w: 50, h: 30 });
  });
});

describe('reconcileCompoundNumbers', () => {
  it('is a no-op when numbering is not enabled', () => {
    const doc = createEmptyDocument();
    addMolecule(doc, [
      [0, 0],
      [10, 0],
    ]);
    const page = getPage(doc);
    reconcileCompoundNumbers(page);
    expect(page.compoundNumbering).toBeUndefined();
  });

  it('assigns 1 to a single new component', () => {
    const doc = createEmptyDocument();
    addMolecule(doc, [
      [0, 0],
      [10, 0],
    ]);
    const page = getPage(doc);
    page.compoundNumbering = { enabled: true, assignments: {}, nextNumber: 1 };
    reconcileCompoundNumbers(page);
    const labels = computeCompoundLabels(page);
    expect(labels).toHaveLength(1);
    expect(labels[0]?.number).toBe(1);
  });

  it('assigns 1, 2, 3 to three disjoint components', () => {
    const doc = createEmptyDocument();
    addMolecule(doc, [[0, 0]]);
    addMolecule(doc, [[100, 0]]);
    addMolecule(doc, [[200, 0]]);
    const page = getPage(doc);
    page.compoundNumbering = { enabled: true, assignments: {}, nextNumber: 1 };
    reconcileCompoundNumbers(page);
    const labels = computeCompoundLabels(page);
    expect(labels).toHaveLength(3);
    const numbers = labels.map((l) => l.number).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3]);
  });

  it('leaves stable gaps when a middle component is deleted', () => {
    const doc = createEmptyDocument();
    const a = addMolecule(doc, [[0, 0]]);
    const b = addMolecule(doc, [[100, 0]]);
    const c = addMolecule(doc, [[200, 0]]);
    const page = getPage(doc);
    page.compoundNumbering = { enabled: true, assignments: {}, nextNumber: 1 };
    reconcileCompoundNumbers(page);
    // Delete middle molecule b
    const bIds = new Set<string>(b.atomIds);
    page.atoms = Object.fromEntries(
      Object.entries(page.atoms).filter(([id]) => !bIds.has(id)),
    ) as typeof page.atoms;
    reconcileCompoundNumbers(page);
    const labels = computeCompoundLabels(page);
    expect(labels).toHaveLength(2);
    const numbers = labels.map((l) => l.number).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 3]);
    expect(a).toBeDefined();
    expect(c).toBeDefined();
  });

  it('merges numbering when two components become joined', () => {
    const doc = createEmptyDocument();
    const m1 = addMolecule(doc, [[0, 0]]);
    const m2 = addMolecule(doc, [[100, 0]]);
    const page = getPage(doc);
    page.compoundNumbering = { enabled: true, assignments: {}, nextNumber: 1 };
    reconcileCompoundNumbers(page);
    // Link them with a bond
    const bond = createBond(
      m1.atomIds[0] as never,
      m2.atomIds[0] as never,
      1,
      'single',
    );
    page.bonds[bond.id] = bond;
    reconcileCompoundNumbers(page);
    const labels = computeCompoundLabels(page);
    expect(labels).toHaveLength(1);
    expect(labels[0]?.number).toBe(1);
  });
});

describe('repackCompoundNumbers', () => {
  it('packs sparse numbering into dense 1..N', () => {
    const doc = createEmptyDocument();
    addMolecule(doc, [[0, 0]]);
    addMolecule(doc, [[100, 0]]);
    addMolecule(doc, [[200, 0]]);
    const page = getPage(doc);
    page.compoundNumbering = { enabled: true, assignments: {}, nextNumber: 5 };
    // Simulate sparse state: numbers 1, 3, 5
    const components = findConnectedComponents(page);
    const [a0, a1, a2] = components.map((c) => c.atomIds[0]);
    if (!a0 || !a1 || !a2) throw new Error('expected three components');
    page.compoundNumbering.assignments[a0] = 1;
    page.compoundNumbering.assignments[a1] = 3;
    page.compoundNumbering.assignments[a2] = 5;
    repackCompoundNumbers(page);
    const labels = computeCompoundLabels(page);
    const numbers = labels.map((l) => l.number).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3]);
    expect(page.compoundNumbering.nextNumber).toBe(4);
  });
});

describe('store integration', () => {
  it('auto-assigns a number when enabled and a molecule is added', () => {
    const store = createSceneStore();
    store.dispatch({ type: 'toggle-compound-numbering' });
    const atom = createAtom(0, 0, 6);
    store.dispatch({ type: 'add-atom', atom });
    const page = getPage(store.getState());
    expect(page.compoundNumbering?.enabled).toBe(true);
    expect(Object.values(page.compoundNumbering?.assignments ?? {})).toContain(1);
  });

  it('does not assign numbers when disabled', () => {
    const store = createSceneStore();
    const atom = createAtom(0, 0, 6);
    store.dispatch({ type: 'add-atom', atom });
    const page = getPage(store.getState());
    expect(page.compoundNumbering).toBeUndefined();
  });

  it('repack command densifies sparse numbering', () => {
    const store = createSceneStore();
    store.dispatch({ type: 'toggle-compound-numbering' });
    const a1 = createAtom(0, 0, 6);
    const a2 = createAtom(100, 0, 6);
    const a3 = createAtom(200, 0, 6);
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'add-atom', atom: a2 });
    store.dispatch({ type: 'add-atom', atom: a3 });
    // Remove middle
    store.dispatch({ type: 'remove-atom', id: a2.id });
    let labels = computeCompoundLabels(getPage(store.getState()));
    let nums = labels.map((l) => l.number).sort((a, b) => a - b);
    expect(nums).toEqual([1, 3]);
    store.dispatch({ type: 'repack-compound-numbers' });
    labels = computeCompoundLabels(getPage(store.getState()));
    nums = labels.map((l) => l.number).sort((a, b) => a - b);
    expect(nums).toEqual([1, 2]);
  });
});
