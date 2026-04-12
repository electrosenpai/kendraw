import { describe, it, expect } from 'vitest';
import { serializeKdx, deserializeKdx } from '../kdx-serializer.js';
import { createEmptyDocument, createAtom, createBond } from '@kendraw/scene';

describe('KDX serialization', () => {
  it('round-trips empty document', () => {
    const doc = createEmptyDocument();
    const json = serializeKdx(doc);
    const restored = deserializeKdx(json);
    expect(restored.schemaVersion).toBe(doc.schemaVersion);
    expect(restored.pages).toHaveLength(1);
  });

  it('round-trips document with atoms', () => {
    const doc = createEmptyDocument();
    const page = doc.pages[0];
    if (!page) throw new Error('no page');
    const atom = createAtom(100, 200, 8);
    page.atoms[atom.id] = atom;

    const json = serializeKdx(doc);
    const restored = deserializeKdx(json);
    const rPage = restored.pages[0];
    expect(rPage).toBeDefined();
    if (!rPage) return;
    expect(Object.keys(rPage.atoms)).toHaveLength(1);
    const rAtom = Object.values(rPage.atoms)[0];
    expect(rAtom?.element).toBe(8);
    expect(rAtom?.x).toBe(100);
  });

  it('round-trips document with bonds', () => {
    const doc = createEmptyDocument();
    const page = doc.pages[0];
    if (!page) throw new Error('no page');
    const a1 = createAtom(0, 0);
    const a2 = createAtom(100, 0);
    page.atoms[a1.id] = a1;
    page.atoms[a2.id] = a2;
    const bond = createBond(a1.id, a2.id, 2, 'double');
    page.bonds[bond.id] = bond;

    const json = serializeKdx(doc);
    const restored = deserializeKdx(json);
    const rPage = restored.pages[0];
    expect(Object.keys(rPage?.bonds ?? {})).toHaveLength(1);
    const rBond = Object.values(rPage?.bonds ?? {})[0];
    expect(rBond?.order).toBe(2);
  });

  it('preserves metadata', () => {
    const doc = createEmptyDocument();
    doc.metadata.title = 'Test Molecule';
    const json = serializeKdx(doc);
    const restored = deserializeKdx(json);
    expect(restored.metadata.title).toBe('Test Molecule');
  });

  it('produces valid JSON', () => {
    const doc = createEmptyDocument();
    const json = serializeKdx(doc);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
