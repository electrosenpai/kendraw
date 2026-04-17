// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect } from 'vitest';
import {
  BOND_FANOUT_OFFSET_PX,
  HOVER_ICON_OFFSET_PX,
  HOVER_ICON_RADIUS_PX,
  computeAtomHoverPreview,
  computeBondHoverPreview,
  hitTestBond,
  isCursorOnHoverIcon,
} from '../bondPreview';
import { createAtom, createBond, type AtomId, type BondId, type Page } from '@kendraw/scene';

function makePage(): Page {
  return {
    id: 'p',
    atoms: {},
    bonds: {},
    arrows: {},
    annotations: {},
    groups: {},
    shapes: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  } as Page;
}

function withAtom(page: Page, x: number, y: number): { page: Page; id: AtomId } {
  const a = createAtom(x, y);
  page.atoms[a.id] = a;
  return { page, id: a.id };
}

function withBond(page: Page, from: AtomId, to: AtomId): { page: Page; id: BondId } {
  const b = createBond(from, to);
  page.bonds[b.id] = b;
  return { page, id: b.id };
}

describe('computeAtomHoverPreview (W4-R-04)', () => {
  it('isolated atom: icon sits along the +x axis (default 0°)', () => {
    const { page, id } = withAtom(makePage(), 100, 100);
    const preview = computeAtomHoverPreview(page, id);
    if (!preview) throw new Error('expected preview');
    expect(preview.kind).toBe('atom-extension');
    expect(preview.iconAt.x).toBeCloseTo(100 + HOVER_ICON_OFFSET_PX, 5);
    expect(preview.iconAt.y).toBeCloseTo(100, 5);
  });

  it('atom with one bond: extension rotates by ~120°', () => {
    const page = makePage();
    const a = withAtom(page, 0, 0).id;
    const b = withAtom(page, 40, 0).id; // bond along +x
    withBond(page, a, b);
    const preview = computeAtomHoverPreview(page, a);
    if (!preview) throw new Error('expected preview');
    const angleDeg = (preview.angle * 180) / Math.PI;
    // Existing bond at 0°, ideal next bond is +120° (zigzag).
    expect(angleDeg).toBeCloseTo(120, 1);
  });

  it('returns null for an unknown atom id', () => {
    const page = makePage();
    expect(computeAtomHoverPreview(page, 'nope' as AtomId)).toBeNull();
  });
});

describe('computeBondHoverPreview (W4-R-04)', () => {
  it('icon sits perpendicular at midpoint, on the cursor side', () => {
    const page = makePage();
    const a = withAtom(page, 0, 0).id;
    const b = withAtom(page, 40, 0).id;
    const bond = withBond(page, a, b).id;
    // Cursor above the bond (y < 0 in canvas) → icon should land y < 0.
    const aboveCursor = { x: 20, y: -5 };
    const above = computeBondHoverPreview(page, bond, aboveCursor);
    if (!above) throw new Error('expected above preview');
    expect(above.iconAt.x).toBeCloseTo(20, 5);
    expect(above.iconAt.y).toBeLessThan(0);
    expect(Math.abs(above.iconAt.y)).toBeCloseTo(BOND_FANOUT_OFFSET_PX, 5);
    // Cursor below → icon flips sign.
    const below = computeBondHoverPreview(page, bond, { x: 20, y: 5 });
    if (!below) throw new Error('expected below preview');
    expect(below.iconAt.y).toBeGreaterThan(0);
  });

  it('returns null for missing bond endpoints', () => {
    const page = makePage();
    const a = withAtom(page, 0, 0).id;
    const b = createBond(a, 'orphan' as AtomId);
    page.bonds[b.id] = b;
    expect(computeBondHoverPreview(page, b.id, { x: 0, y: 0 })).toBeNull();
  });
});

describe('hitTestBond (W4-R-04)', () => {
  it('hits a bond when cursor is within the corridor', () => {
    const page = makePage();
    const a = withAtom(page, 0, 0).id;
    const b = withAtom(page, 40, 0).id;
    const id = withBond(page, a, b).id;
    expect(hitTestBond(page, { x: 20, y: 2 })).toBe(id);
    expect(hitTestBond(page, { x: 20, y: 50 })).toBeNull();
  });

  it('returns the closest bond when multiple bonds are nearby', () => {
    const page = makePage();
    const a = withAtom(page, 0, 0).id;
    const b = withAtom(page, 40, 0).id;
    const c = withAtom(page, 0, 40).id;
    const horizontal = withBond(page, a, b).id;
    withBond(page, a, c);
    expect(hitTestBond(page, { x: 20, y: 1 })).toBe(horizontal);
  });
});

describe('isCursorOnHoverIcon (W4-R-04)', () => {
  it('returns true within the icon radius and false beyond it', () => {
    const preview = {
      kind: 'atom-extension' as const,
      anchor: { x: 0, y: 0 },
      iconAt: { x: 50, y: 50 },
      endpoint: { x: 100, y: 50 },
      angle: 0,
      sourceId: 'a' as AtomId,
    };
    expect(isCursorOnHoverIcon(preview, { x: 50, y: 50 })).toBe(true);
    expect(isCursorOnHoverIcon(preview, { x: 50 + HOVER_ICON_RADIUS_PX - 0.1, y: 50 })).toBe(true);
    expect(isCursorOnHoverIcon(preview, { x: 50 + HOVER_ICON_RADIUS_PX + 0.1, y: 50 })).toBe(false);
    expect(isCursorOnHoverIcon(null, { x: 0, y: 0 })).toBe(false);
  });
});
