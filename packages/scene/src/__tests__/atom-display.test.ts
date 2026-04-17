import { describe, it, expect } from 'vitest';
import {
  getImplicitHydrogens,
  shouldShowLabel,
  buildAtomLabel,
  formulaMode,
  getLabelJustification,
  reverseFormulaLabel,
} from '../atom-display.js';
import { createSceneStore, createAtom, createBond } from '../index.js';

function buildPage(...setup: Array<(store: ReturnType<typeof createSceneStore>) => void>) {
  const store = createSceneStore();
  for (const fn of setup) fn(store);
  const page = store.getState().pages[0];
  if (!page) throw new Error('no page');
  return page;
}

describe('getImplicitHydrogens', () => {
  it('carbon with no bonds → 4 (methane)', () => {
    const a = createAtom(0, 0, 6);
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: a }));
    expect(getImplicitHydrogens(page, a.id)).toBe(4);
  });

  it('carbon with 1 single bond → 3', () => {
    const a1 = createAtom(0, 0, 6);
    const a2 = createAtom(40, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: a1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: a2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(a1.id, a2.id) }),
    );
    expect(getImplicitHydrogens(page, a1.id)).toBe(3);
  });

  it('carbon with 4 bonds → 0', () => {
    const c = createAtom(0, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      ...Array.from({ length: 4 }, (_, i) => {
        const h = createAtom(20 * (i + 1), 0, 6);
        return (s: ReturnType<typeof createSceneStore>) => {
          s.dispatch({ type: 'add-atom', atom: h });
          s.dispatch({ type: 'add-bond', bond: createBond(c.id, h.id) });
        };
      }),
    );
    expect(getImplicitHydrogens(page, c.id)).toBe(0);
  });

  it('nitrogen with no bonds → 3', () => {
    const a = createAtom(0, 0, 7);
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: a }));
    expect(getImplicitHydrogens(page, a.id)).toBe(3);
  });

  it('oxygen with no bonds → 2', () => {
    const a = createAtom(0, 0, 8);
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: a }));
    expect(getImplicitHydrogens(page, a.id)).toBe(2);
  });

  it('nitrogen with charge +1 and 4 bonds → 0 (NH4+)', () => {
    const n = createAtom(0, 0, 7);
    n.charge = 1;
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: n }),
      ...Array.from({ length: 4 }, (_, i) => {
        const h = createAtom(20 * (i + 1), 0, 1);
        return (s: ReturnType<typeof createSceneStore>) => {
          s.dispatch({ type: 'add-atom', atom: h });
          s.dispatch({ type: 'add-bond', bond: createBond(n.id, h.id) });
        };
      }),
    );
    expect(getImplicitHydrogens(page, n.id)).toBe(0);
  });

  it('carbon with double bond → 2', () => {
    const a1 = createAtom(0, 0, 6);
    const a2 = createAtom(40, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: a1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: a2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(a1.id, a2.id, 2, 'double') }),
    );
    expect(getImplicitHydrogens(page, a1.id)).toBe(2);
  });
});

describe('shouldShowLabel', () => {
  it('carbon vertex with 2+ heavy bonds → hidden', () => {
    const c = createAtom(0, 0, 6);
    const a1 = createAtom(40, 0, 6);
    const a2 = createAtom(0, 40, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-atom', atom: a1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: a2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a1.id) }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a2.id) }),
    );
    expect(shouldShowLabel(page, c.id)).toBe(false);
  });

  it('nitrogen always shows', () => {
    const n = createAtom(0, 0, 7);
    const a1 = createAtom(40, 0, 6);
    const a2 = createAtom(0, 40, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: n }),
      (s) => s.dispatch({ type: 'add-atom', atom: a1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: a2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(n.id, a1.id) }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(n.id, a2.id) }),
    );
    expect(shouldShowLabel(page, n.id)).toBe(true);
  });

  it('charged carbon shows', () => {
    const c = createAtom(0, 0, 6);
    c.charge = 1;
    const a1 = createAtom(40, 0, 6);
    const a2 = createAtom(0, 40, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-atom', atom: a1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: a2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a1.id) }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a2.id) }),
    );
    expect(shouldShowLabel(page, c.id)).toBe(true);
  });

  it('terminal carbon shows', () => {
    const c = createAtom(0, 0, 6);
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: c }));
    expect(shouldShowLabel(page, c.id)).toBe(true);
  });
});

describe('formulaMode', () => {
  it('auto-subscripts numbers in NH3', () => {
    const segs = formulaMode('NH3');
    expect(segs).toHaveLength(3);
    expect(segs[0]).toEqual({ text: 'N', style: 'normal' });
    expect(segs[1]).toEqual({ text: 'H', style: 'normal' });
    expect(segs[2]).toEqual({ text: '3', style: 'subscript' });
  });

  it('handles SO4', () => {
    const segs = formulaMode('SO4');
    expect(segs[2]).toEqual({ text: '4', style: 'subscript' });
  });
});

describe('buildAtomLabel', () => {
  it('returns empty for hidden carbon vertex', () => {
    const c = createAtom(0, 0, 6);
    const a1 = createAtom(40, 0, 6);
    const a2 = createAtom(0, 40, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-atom', atom: a1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: a2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a1.id) }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a2.id) }),
    );
    expect(buildAtomLabel(page, c.id)).toHaveLength(0);
  });

  it('shows OH for oxygen with 1 bond', () => {
    const o = createAtom(0, 0, 8);
    const c = createAtom(-40, 0, 6); // bond to the left
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: o }),
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c.id) }),
    );
    const label = buildAtomLabel(page, o.id);
    // O with 1H, bond going left → H on right = "OH"
    const text = label.map((s) => s.text).join('');
    expect(text).toContain('O');
    expect(text).toContain('H');
  });

  it('CDXML explicit "OH" label does not double hydrogens', () => {
    const o = createAtom(0, 0, 8);
    o.label = 'OH';
    o.hasExplicitLabel = true;
    const c = createAtom(-40, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: o }),
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c.id) }),
    );
    const label = buildAtomLabel(page, o.id);
    const text = label.map((s) => s.text).join('');
    expect(text).toBe('OH');
  });

  it('CDXML explicit "OH" with bond to the right → reversed to "HO"', () => {
    const o = createAtom(0, 0, 8);
    o.label = 'OH';
    o.hasExplicitLabel = true;
    const c = createAtom(40, 0, 6); // bond to the right
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: o }),
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c.id) }),
    );
    const label = buildAtomLabel(page, o.id);
    const text = label.map((s) => s.text).join('');
    // Bond from the right → element O must face the bond → label reversed
    expect(text).toBe('HO');
  });

  it('CDXML explicit "O" label shows just "O" (no implicit H)', () => {
    const o = createAtom(0, 0, 8);
    o.label = 'O';
    o.hasExplicitLabel = true;
    const c1 = createAtom(-40, 0, 6);
    const c2 = createAtom(40, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: o }),
      (s) => s.dispatch({ type: 'add-atom', atom: c1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: c2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c1.id) }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c2.id) }),
    );
    const label = buildAtomLabel(page, o.id);
    const text = label.map((s) => s.text).join('');
    expect(text).toBe('O');
  });

  it('CDXML explicit "OH" with bond to the left → stays "OH"', () => {
    const o = createAtom(0, 0, 8);
    o.label = 'OH';
    o.hasExplicitLabel = true;
    const c = createAtom(-40, 0, 6); // bond to the left
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: o }),
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c.id) }),
    );
    const label = buildAtomLabel(page, o.id);
    const text = label.map((s) => s.text).join('');
    expect(text).toBe('OH');
  });

  it('CDXML explicit "NH2" with bond to the right → reversed to "H2N"', () => {
    const n = createAtom(0, 0, 7);
    n.label = 'NH2';
    n.hasExplicitLabel = true;
    const c = createAtom(40, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: n }),
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(n.id, c.id) }),
    );
    const label = buildAtomLabel(page, n.id);
    const text = label.map((s) => s.text).join('');
    expect(text).toBe('H2N');
  });

  it('shows charge as superscript', () => {
    const n = createAtom(0, 0, 7);
    n.charge = 1;
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: n }));
    const label = buildAtomLabel(page, n.id);
    const supSegs = label.filter((s) => s.style === 'superscript');
    expect(supSegs.length).toBeGreaterThan(0);
    expect(supSegs.some((s) => s.text.includes('+'))).toBe(true);
  });
});

describe('buildAtomLabel isotopes', () => {
  it('13C emits "13" as superscript before C', () => {
    const c = createAtom(0, 0, 6);
    c.isotope = 13;
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: c }));
    const label = buildAtomLabel(page, c.id);
    const sup = label.filter((s) => s.style === 'superscript');
    expect(sup.some((s) => s.text === '13')).toBe(true);
    const idxSup = label.findIndex((s) => s.style === 'superscript' && s.text === '13');
    const idxC = label.findIndex((s) => s.text === 'C' && s.style === 'normal');
    expect(idxSup).toBeLessThan(idxC);
  });

  it('15N emits "15" as superscript before N', () => {
    const n = createAtom(0, 0, 7);
    n.isotope = 15;
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: n }));
    const label = buildAtomLabel(page, n.id);
    expect(label.some((s) => s.style === 'superscript' && s.text === '15')).toBe(true);
    expect(label.some((s) => s.text === 'N' && s.style === 'normal')).toBe(true);
  });

  it('H with isotope=2 renders as "D" (shorthand, no superscript)', () => {
    const h = createAtom(0, 0, 1);
    h.isotope = 2;
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: h }));
    const label = buildAtomLabel(page, h.id);
    const text = label.map((s) => s.text).join('');
    expect(text).toBe('D');
    expect(label.every((s) => s.style !== 'superscript')).toBe(true);
  });

  it('H with isotope=3 renders as "T" (shorthand, no superscript)', () => {
    const h = createAtom(0, 0, 1);
    h.isotope = 3;
    const page = buildPage((s) => s.dispatch({ type: 'add-atom', atom: h }));
    const label = buildAtomLabel(page, h.id);
    const text = label.map((s) => s.text).join('');
    expect(text).toBe('T');
    expect(label.every((s) => s.style !== 'superscript')).toBe(true);
  });

  it('carbon with isotope is still shown even if it would be a hidden vertex', () => {
    const c = createAtom(0, 0, 6);
    c.isotope = 13;
    const a1 = createAtom(40, 0, 6);
    const a2 = createAtom(0, 40, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-atom', atom: a1 }),
      (s) => s.dispatch({ type: 'add-atom', atom: a2 }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a1.id) }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(c.id, a2.id) }),
    );
    const label = buildAtomLabel(page, c.id);
    expect(label.length).toBeGreaterThan(0);
    expect(label.some((s) => s.text === 'C' && s.style === 'normal')).toBe(true);
  });
});

describe('reverseFormulaLabel', () => {
  it('OH → HO', () => {
    expect(reverseFormulaLabel('OH')).toBe('HO');
  });

  it('NH2 → H2N', () => {
    expect(reverseFormulaLabel('NH2')).toBe('H2N');
  });

  it('SH → HS', () => {
    expect(reverseFormulaLabel('SH')).toBe('HS');
  });

  it('OCH3 → H3CO', () => {
    expect(reverseFormulaLabel('OCH3')).toBe('H3CO');
  });

  it('OMe → MeO', () => {
    expect(reverseFormulaLabel('OMe')).toBe('MeO');
  });

  it('OTBS → TBSO (abbreviation fallback with element hint)', () => {
    // T is not a recognized element, so falls back to element+abbreviation split
    expect(reverseFormulaLabel('OTBS', 8)).toBe('TBSO');
  });

  it('single char unchanged', () => {
    expect(reverseFormulaLabel('O')).toBe('O');
  });
});

describe('getLabelJustification', () => {
  it('bond to the left → Left justification (normal label)', () => {
    const o = createAtom(0, 0, 8);
    const c = createAtom(-40, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: o }),
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c.id) }),
    );
    expect(getLabelJustification(page, o.id)).toBe('left');
  });

  it('bond to the right → Right justification (reversed label)', () => {
    const o = createAtom(0, 0, 8);
    const c = createAtom(40, 0, 6);
    const page = buildPage(
      (s) => s.dispatch({ type: 'add-atom', atom: o }),
      (s) => s.dispatch({ type: 'add-atom', atom: c }),
      (s) => s.dispatch({ type: 'add-bond', bond: createBond(o.id, c.id) }),
    );
    expect(getLabelJustification(page, o.id)).toBe('right');
  });
});
