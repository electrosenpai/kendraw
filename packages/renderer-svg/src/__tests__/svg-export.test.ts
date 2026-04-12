import { describe, it, expect } from 'vitest';
import { exportToSVG } from '../svg-export.js';
import { createAtom, createBond } from '@kendraw/scene';
import type { Page, ArrowId, AnnotationId, GroupId } from '@kendraw/scene';

function createPage(
  atoms: ReturnType<typeof createAtom>[],
  bonds: ReturnType<typeof createBond>[] = [],
): Page {
  const atomMap = {} as Page['atoms'];
  for (const a of atoms) atomMap[a.id] = a;
  const bondMap = {} as Page['bonds'];
  for (const b of bonds) bondMap[b.id] = b;
  return {
    id: 'test',
    atoms: atomMap,
    bonds: bondMap,
    arrows: {} as Record<ArrowId, never>,
    annotations: {} as Record<AnnotationId, never>,
    groups: {} as Record<GroupId, never>,
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

describe('exportToSVG', () => {
  it('produces valid SVG for empty page', () => {
    const page = createPage([]);
    const svg = exportToSVG(page);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('renders atoms as circles', () => {
    const a = createAtom(100, 100, 6);
    const page = createPage([a]);
    const svg = exportToSVG(page);
    expect(svg).toContain('<circle');
    expect(svg).toContain('C'); // label
  });

  it('renders bonds as lines', () => {
    const a1 = createAtom(0, 0);
    const a2 = createAtom(100, 0);
    const bond = createBond(a1.id, a2.id);
    const page = createPage([a1, a2], [bond]);
    const svg = exportToSVG(page);
    expect(svg).toContain('<line');
  });

  it('includes xmlns attribute', () => {
    const page = createPage([]);
    const svg = exportToSVG(page);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('sets viewBox from atom bounds', () => {
    const a1 = createAtom(50, 50);
    const a2 = createAtom(200, 150);
    const page = createPage([a1, a2]);
    const svg = exportToSVG(page);
    expect(svg).toContain('viewBox=');
  });
});
