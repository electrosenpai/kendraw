/**
 * CDXML parser — reads ChemDraw XML format.
 * Source: chemdraw-technical-reference.md Section 3.3
 *
 * Coordinate system: Y increases downward (screen coords).
 * Units: PostScript points.
 * Default element = Carbon (Z=6) if no Element attribute.
 */

import type { Atom, AtomId, Bond, BondId } from '@kendraw/scene';

export interface CdxmlParseResult {
  atoms: Atom[];
  bonds: Bond[];
}

const SCALE = 96 / 72; // pt to px at 96 DPI

export function parseCdxml(xml: string): CdxmlParseResult {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const idMap = new Map<string, AtomId>();

  // First, remove nested <fragment> blocks inside <n> nodes (NodeType="Fragment" expansions).
  // These contain internal atoms/bonds that should not be imported as top-level objects.
  const cleaned = xml.replace(
    /(<n\b[^>]*NodeType="Fragment"[^>]*>)\s*<fragment[\s\S]*?<\/fragment>/g,
    '$1',
  );

  // Parse all <n> nodes (may be self-closing or have children like <t>)
  const nodeRegex = /<n\b\s([^>]+?)(?:\/>|>)/g;
  let m: RegExpExecArray | null;
  while ((m = nodeRegex.exec(cleaned)) !== null) {
    const attrs = m[1] ?? '';

    const id = getAttr(attrs, 'id');
    const p = getAttr(attrs, 'p');
    if (!id || !p) continue;

    const nodeType = getAttr(attrs, 'NodeType') ?? '';
    if (nodeType === 'ExternalConnectionPoint') continue;

    const parts = p.split(/\s+/).map(Number);
    const px = parts[0];
    const py = parts[1];
    if (px === undefined || py === undefined || isNaN(px) || isNaN(py)) continue;

    const element = parseInt(getAttr(attrs, 'Element') ?? '6', 10);
    const charge = parseInt(getAttr(attrs, 'Charge') ?? '0', 10);
    const isotope = parseInt(getAttr(attrs, 'Isotope') ?? '0', 10);
    const radical = parseInt(getAttr(attrs, 'Radical') ?? '0', 10);

    const atomId = crypto.randomUUID() as AtomId;
    idMap.set(id, atomId);

    const atom: Atom = {
      id: atomId,
      x: px * SCALE,
      y: py * SCALE,
      element,
      charge,
      radicalCount: (radical === 2 ? 1 : radical === 3 ? 2 : 0) as 0 | 1 | 2,
      lonePairs: 0,
    };
    if (isotope) atom.isotope = isotope;
    atoms.push(atom);
  }

  // Parse all <b> bonds
  const bondRegex = /<b\b\s([^>]+?)(?:\/>|>)/g;
  while ((m = bondRegex.exec(cleaned)) !== null) {
    const attrs = m[1] ?? '';

    const beginId = getAttr(attrs, 'B');
    const endId = getAttr(attrs, 'E');
    if (!beginId || !endId) continue;

    const fromAtomId = idMap.get(beginId);
    const toAtomId = idMap.get(endId);
    if (!fromAtomId || !toAtomId) continue;

    const orderStr = getAttr(attrs, 'Order') ?? '1';
    const display = getAttr(attrs, 'Display') ?? '';

    bonds.push({
      id: crypto.randomUUID() as BondId,
      fromAtomId,
      toAtomId,
      order: parseOrder(orderStr),
      style: parseDisplay(display, parseOrder(orderStr)),
    });
  }

  return { atoms, bonds };
}

function getAttr(text: string, name: string): string | undefined {
  const regex = new RegExp(`\\b${name}="([^"]*)"`, '');
  const match = text.match(regex);
  return match?.[1];
}

function parseOrder(s: string): Bond['order'] {
  if (s === '2') return 2;
  if (s === '3') return 3;
  if (s === '1.5') return 1.5;
  return 1;
}

function parseDisplay(display: string, order: Bond['order']): Bond['style'] {
  const d = display.toLowerCase();
  if (d.includes('wedge')) return 'wedge';
  if (d === 'bold') return 'bold';
  if (d === 'wavy') return 'wavy';
  if (d === 'dash' || d.includes('hash')) return 'dash';
  if (order === 2) return 'double';
  if (order === 3) return 'triple';
  if (order === 1.5) return 'aromatic';
  return 'single';
}
