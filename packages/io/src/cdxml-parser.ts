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
  const idMap = new Map<string, AtomId>(); // CDXML id → AtomId

  // Parse nodes (atoms)
  const nodeRegex = /<n\s+([^>]*?)\/?>(?:[\s\S]*?<\/n>)?/g;
  let nodeMatch: RegExpExecArray | null;
  while ((nodeMatch = nodeRegex.exec(xml)) !== null) {
    const attrs = nodeMatch[1] ?? '';
    const id = getAttr(attrs, 'id') ?? '';
    const p = getAttr(attrs, 'p');
    const element = parseInt(getAttr(attrs, 'Element') ?? '6', 10); // default Carbon
    const charge = parseInt(getAttr(attrs, 'Charge') ?? '0', 10);
    const isotope = parseInt(getAttr(attrs, 'Isotope') ?? '0', 10);
    const radical = parseInt(getAttr(attrs, 'Radical') ?? '0', 10);

    if (!p) continue;
    const [px, py] = p.split(/\s+/).map(Number);
    if (px === undefined || py === undefined || isNaN(px) || isNaN(py)) continue;

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

  // Parse bonds
  const bondRegex = /<b\s+([^>]*?)\/?>(?:[\s\S]*?<\/b>)?/g;
  let bondMatch: RegExpExecArray | null;
  while ((bondMatch = bondRegex.exec(xml)) !== null) {
    const attrs = bondMatch[1] ?? '';
    const beginId = getAttr(attrs, 'B') ?? '';
    const endId = getAttr(attrs, 'E') ?? '';
    const orderStr = getAttr(attrs, 'Order') ?? '1';
    const display = getAttr(attrs, 'Display') ?? '';

    const fromAtomId = idMap.get(beginId);
    const toAtomId = idMap.get(endId);
    if (!fromAtomId || !toAtomId) continue;

    const order = parseOrder(orderStr);
    const style = parseDisplay(display, order);

    bonds.push({
      id: crypto.randomUUID() as BondId,
      fromAtomId,
      toAtomId,
      order,
      style,
    });
  }

  return { atoms, bonds };
}

function getAttr(attrs: string, name: string): string | undefined {
  const regex = new RegExp(`${name}="([^"]*)"`, 'i');
  const match = attrs.match(regex);
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
  if (d === 'wedgebegin' || d === 'wedgeend') return 'wedge';
  if (d === 'wedgedhashbegin' || d === 'wedgedhashend') return 'dash';
  if (d === 'bold') return 'bold';
  if (d === 'wavy') return 'wavy';
  if (d === 'dash') return 'dash';
  if (d === 'hash') return 'dash';
  if (order === 2) return 'double';
  if (order === 3) return 'triple';
  if (order === 1.5) return 'aromatic';
  return 'single';
}
