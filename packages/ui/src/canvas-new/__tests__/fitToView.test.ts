// Wave-7 HF-4 — unit tests for the fit-to-view viewport calculation.

import { describe, it, expect } from 'vitest';
import type { Atom, AtomId, Page } from '@kendraw/scene';
import { computeFitViewport } from '../fitToView';

function makePage(atoms: Array<{ id: string; x: number; y: number }>): Page {
  const atomMap: Record<AtomId, Atom> = {};
  for (const a of atoms) {
    const id = a.id as AtomId;
    atomMap[id] = {
      id,
      x: a.x,
      y: a.y,
      element: 6,
      charge: 0,
      radicalCount: 0,
      lonePairs: 0,
    };
  }
  return {
    id: 'p1',
    atoms: atomMap,
    bonds: {},
    arrows: {},
    annotations: {},
    groups: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

describe('computeFitViewport', () => {
  it('returns a neutral centered viewport for an empty page', () => {
    const page = makePage([]);
    const v = computeFitViewport(page, 800, 600);
    expect(v.zoom).toBe(1);
    expect(v.panX).toBe(400);
    expect(v.panY).toBe(300);
  });

  it('returns a neutral centered viewport when page is null', () => {
    const v = computeFitViewport(null, 800, 600);
    expect(v.zoom).toBe(1);
    expect(v.panX).toBe(400);
    expect(v.panY).toBe(300);
  });

  it('returns a neutral viewport when canvas size is zero', () => {
    const page = makePage([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 100, y: 100 },
    ]);
    const v = computeFitViewport(page, 0, 0);
    expect(v.zoom).toBe(1);
  });

  it('centers the bbox in the canvas', () => {
    // atoms span (-50,-50)..(50,50); center at origin
    const page = makePage([
      { id: 'a', x: -50, y: -50 },
      { id: 'b', x: 50, y: 50 },
    ]);
    const v = computeFitViewport(page, 800, 600, { margin: 0, maxZoom: 10 });
    // center world (0,0) → screen (canvasW/2, canvasH/2)
    expect(v.panX).toBeCloseTo(400);
    expect(v.panY).toBeCloseTo(300);
  });

  it('caps zoom at maxZoom so a tiny bbox does not explode', () => {
    const page = makePage([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 1, y: 1 },
    ]);
    const v = computeFitViewport(page, 800, 600, { maxZoom: 3 });
    expect(v.zoom).toBe(3);
  });

  it('honors margin so atoms do not touch the canvas edge', () => {
    const page = makePage([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 100, y: 100 },
    ]);
    const v = computeFitViewport(page, 200, 200, { margin: 50, maxZoom: 100 });
    // bbox + margin = 200 wide → zoom = 200/200 = 1
    expect(v.zoom).toBeCloseTo(1);
  });

  it('picks the tighter axis for zoom when the canvas is rectangular', () => {
    const page = makePage([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 100, y: 200 }, // taller than wide
    ]);
    const v = computeFitViewport(page, 500, 500, { margin: 0, maxZoom: 100 });
    // height constrains: 500 / 200 = 2.5, width would give 5
    expect(v.zoom).toBeCloseTo(2.5);
  });
});
