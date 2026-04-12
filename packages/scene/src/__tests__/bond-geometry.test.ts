import { describe, it, expect } from 'vitest';
import {
  getExistingBondAngles,
  getIdealBondAngle,
  snapAngleToGrid,
  calculateBondTarget,
  getNextChainPosition,
  STANDARD_BOND_LENGTH_PX,
} from '../bond-geometry.js';
import { createSceneStore, createAtom, createBond } from '../index.js';

describe('snapAngleToGrid', () => {
  it('snaps 0 to 0', () => {
    expect(snapAngleToGrid(0)).toBeCloseTo(0);
  });

  it('snaps 14° to 0°', () => {
    expect(snapAngleToGrid((14 * Math.PI) / 180)).toBeCloseTo(0, 1);
  });

  it('snaps 16° to 30°', () => {
    const snapped = snapAngleToGrid((16 * Math.PI) / 180);
    expect(snapped).toBeCloseTo((30 * Math.PI) / 180, 1);
  });

  it('snaps 119° to 120°', () => {
    const snapped = snapAngleToGrid((119 * Math.PI) / 180);
    expect(snapped).toBeCloseTo((120 * Math.PI) / 180, 1);
  });
});

describe('getExistingBondAngles', () => {
  it('returns empty for atom with no bonds', () => {
    const store = createSceneStore();
    const a = createAtom(100, 100);
    store.dispatch({ type: 'add-atom', atom: a });
    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');
    expect(getExistingBondAngles(page, a.id)).toHaveLength(0);
  });

  it('returns one angle for atom with one bond', () => {
    const store = createSceneStore();
    const a1 = createAtom(100, 100);
    const a2 = createAtom(140, 100); // bond going right (0°)
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'add-atom', atom: a2 });
    store.dispatch({ type: 'add-bond', bond: createBond(a1.id, a2.id) });

    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');
    const angles = getExistingBondAngles(page, a1.id);
    expect(angles).toHaveLength(1);
    expect(angles[0]).toBeCloseTo(0); // pointing right
  });
});

describe('getIdealBondAngle', () => {
  it('returns 0 for atom with no bonds', () => {
    const store = createSceneStore();
    const a = createAtom(100, 100);
    store.dispatch({ type: 'add-atom', atom: a });
    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');
    expect(getIdealBondAngle(page, a.id)).toBe(0);
  });

  it('returns ~120° offset for atom with one horizontal bond', () => {
    const store = createSceneStore();
    const a1 = createAtom(100, 100);
    const a2 = createAtom(140, 100);
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'add-atom', atom: a2 });
    store.dispatch({ type: 'add-bond', bond: createBond(a1.id, a2.id) });

    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');
    const angle = getIdealBondAngle(page, a1.id);
    // Should be ~120° from 0° = 2π/3 ≈ 2.094
    expect(angle).toBeCloseTo((2 * Math.PI) / 3, 1);
  });
});

describe('getNextChainPosition', () => {
  it('first bond goes horizontal right', () => {
    const store = createSceneStore();
    const a = createAtom(100, 100);
    store.dispatch({ type: 'add-atom', atom: a });
    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');

    const pos = getNextChainPosition(page, a.id);
    expect(pos.x).toBeCloseTo(100 + STANDARD_BOND_LENGTH_PX);
    expect(pos.y).toBeCloseTo(100);
  });

  it('second bond goes up-right (zigzag)', () => {
    const store = createSceneStore();
    const a1 = createAtom(100, 100);
    const a2 = createAtom(140, 100);
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'add-atom', atom: a2 });
    store.dispatch({ type: 'add-bond', bond: createBond(a1.id, a2.id) });

    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');

    const pos = getNextChainPosition(page, a2.id);
    // From a2 at (140, 100), bond from a1 goes left (angle = π)
    // Next should be at +120° from π = π + 2π/3 ≈ 300° from horizontal
    // That's roughly down-right
    expect(pos.x).toBeGreaterThan(140); // moves right
  });

  it('produces zigzag chain with fixed length', () => {
    const store = createSceneStore();
    const a1 = createAtom(100, 200);
    store.dispatch({ type: 'add-atom', atom: a1 });

    let prevId = a1.id;
    const positions = [{ x: a1.x, y: a1.y }];

    // Build 5-atom chain
    for (let i = 0; i < 4; i++) {
      const page = store.getState().pages[0];
      if (!page) throw new Error('no page');
      const pos = getNextChainPosition(page, prevId);
      const atom = createAtom(pos.x, pos.y);
      store.dispatch({ type: 'add-atom', atom });
      store.dispatch({ type: 'add-bond', bond: createBond(prevId, atom.id) });
      prevId = atom.id;
      positions.push(pos);
    }

    // Verify all bonds have same length
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      if (!prev || !curr) continue;
      const dist = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      expect(dist).toBeCloseTo(STANDARD_BOND_LENGTH_PX, 0);
    }

    // Verify chain spreads out (not all at same position)
    const firstPos = positions[0];
    const lastPos = positions[positions.length - 1];
    if (firstPos && lastPos) {
      const totalSpread = Math.sqrt((lastPos.x - firstPos.x) ** 2 + (lastPos.y - firstPos.y) ** 2);
      expect(totalSpread).toBeGreaterThan(20); // chain spread, not all stacked
    }
  });
});

describe('calculateBondTarget', () => {
  it('returns snapped position', () => {
    const store = createSceneStore();
    const a = createAtom(100, 100);
    store.dispatch({ type: 'add-atom', atom: a });
    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');

    // Mouse pointing roughly right
    const target = calculateBondTarget(page, a.id, 200, 105);
    // Should snap to 0° (horizontal)
    expect(target.y).toBeCloseTo(100, 0);
    // Length should be STANDARD_BOND_LENGTH_PX
    const dist = Math.sqrt((target.x - 100) ** 2 + (target.y - 100) ** 2);
    expect(dist).toBeCloseTo(STANDARD_BOND_LENGTH_PX, 0);
  });

  it('freeAngle disables snap', () => {
    const store = createSceneStore();
    const a = createAtom(100, 100);
    store.dispatch({ type: 'add-atom', atom: a });
    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');

    // Mouse at 45° exactly
    const mx = 100 + 50;
    const my = 100 + 50;
    const target = calculateBondTarget(page, a.id, mx, my, { freeAngle: true });
    const angle = Math.atan2(target.y - 100, target.x - 100);
    expect(angle).toBeCloseTo(Math.PI / 4, 1); // 45°
  });
});
