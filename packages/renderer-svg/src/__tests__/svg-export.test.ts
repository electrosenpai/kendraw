import { describe, it, expect } from 'vitest';
import { exportToSVG } from '../svg-export.js';
import { createAtom, createBond } from '@kendraw/scene';
import type { Page, Arrow, ArrowId, Annotation, AnnotationId, GroupId } from '@kendraw/scene';

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

  it('renders forward arrows with arrowhead polygon', () => {
    const page = createPage([]);
    const arrow: Arrow = {
      id: 'arrow-1' as ArrowId,
      type: 'forward',
      geometry: {
        start: { x: 0, y: 50 },
        c1: { x: 50, y: 50 },
        c2: { x: 100, y: 50 },
        end: { x: 150, y: 50 },
      },
      startAnchor: { kind: 'free' },
      endAnchor: { kind: 'free' },
    };
    page.arrows = { [arrow.id]: arrow } as Page['arrows'];
    const svg = exportToSVG(page);
    expect(svg).toContain('<polygon');
    expect(svg).toContain('<line');
  });

  it('renders curly arrows with Bezier path', () => {
    const page = createPage([]);
    const arrow: Arrow = {
      id: 'arrow-2' as ArrowId,
      type: 'curly-pair',
      geometry: {
        start: { x: 10, y: 10 },
        c1: { x: 30, y: -20 },
        c2: { x: 70, y: -20 },
        end: { x: 90, y: 10 },
      },
      startAnchor: { kind: 'free' },
      endAnchor: { kind: 'free' },
    };
    page.arrows = { [arrow.id]: arrow } as Page['arrows'];
    const svg = exportToSVG(page);
    expect(svg).toContain('<path');
    expect(svg).toContain('marker-end');
  });

  it('renders annotations with text', () => {
    const page = createPage([]);
    const ann: Annotation = {
      id: 'ann-1' as AnnotationId,
      x: 50,
      y: 80,
      richText: [{ text: 'THF, reflux, 2h' }],
    };
    page.annotations = { [ann.id]: ann } as Page['annotations'];
    const svg = exportToSVG(page);
    expect(svg).toContain('THF, reflux, 2h');
    expect(svg).toContain('<text');
  });

  it('emits title, desc, and role="img" for accessibility (a11y)', () => {
    const page = createPage([createAtom(100, 100, 6)]);
    const svg = exportToSVG(page, { title: 'Methane', description: 'CH4' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="kendraw-title kendraw-desc"');
    expect(svg).toContain('<title id="kendraw-title">Methane</title>');
    expect(svg).toContain('<desc id="kendraw-desc">CH4</desc>');
    const titleIdx = svg.indexOf('<title');
    const descIdx = svg.indexOf('<desc');
    const svgOpen = svg.indexOf('>');
    expect(titleIdx).toBeGreaterThan(svgOpen);
    expect(descIdx).toBeGreaterThan(titleIdx);
  });

  it('provides sensible default title and desc when not supplied', () => {
    const a1 = createAtom(0, 0);
    const a2 = createAtom(100, 0);
    const page = createPage([a1, a2], [createBond(a1.id, a2.id)]);
    const svg = exportToSVG(page);
    expect(svg).toContain('<title id="kendraw-title">Chemical structure</title>');
    expect(svg).toContain('2 atoms');
    expect(svg).toContain('1 bond');
  });

  it('escapes XML special characters in title/desc', () => {
    const page = createPage([createAtom(0, 0)]);
    const svg = exportToSVG(page, { title: 'Compound <1> & "2"', description: "It's a test" });
    expect(svg).toContain('&lt;1&gt;');
    expect(svg).toContain('&amp;');
    expect(svg).toContain('&quot;');
    expect(svg).toContain('&apos;');
  });

  it('renders retro arrows with two parallel lines and an open arrowhead', () => {
    const page = createPage([]);
    const arrow: Arrow = {
      id: 'arrow-retro' as ArrowId,
      type: 'retro',
      geometry: {
        start: { x: 0, y: 50 },
        c1: { x: 50, y: 50 },
        c2: { x: 100, y: 50 },
        end: { x: 150, y: 50 },
      },
      startAnchor: { kind: 'free' },
      endAnchor: { kind: 'free' },
    };
    page.arrows = { [arrow.id]: arrow } as Page['arrows'];
    const svg = exportToSVG(page);
    const lineCount = (svg.match(/<line /g) || []).length;
    expect(lineCount).toBeGreaterThanOrEqual(2);
    expect(svg).toMatch(/<polygon[^>]*fill="none"/);
  });

  it('renders equilibrium arrows with two lines', () => {
    const page = createPage([]);
    const arrow: Arrow = {
      id: 'arrow-3' as ArrowId,
      type: 'equilibrium',
      geometry: {
        start: { x: 0, y: 50 },
        c1: { x: 50, y: 50 },
        c2: { x: 100, y: 50 },
        end: { x: 150, y: 50 },
      },
      startAnchor: { kind: 'free' },
      endAnchor: { kind: 'free' },
    };
    page.arrows = { [arrow.id]: arrow } as Page['arrows'];
    const svg = exportToSVG(page);
    // Equilibrium has 2 parallel lines + 2 arrowheads = at least 2 lines
    const lineCount = (svg.match(/<line /g) || []).length;
    expect(lineCount).toBeGreaterThanOrEqual(2);
  });
});
