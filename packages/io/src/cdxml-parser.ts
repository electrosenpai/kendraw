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

  // Extract all top-level <n ...> nodes from <fragment> blocks (not nested fragments)
  // We use a line-by-line approach for robustness
  const lines = xml.split('\n');
  let inNestedFragment = false;
  let fragmentDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track nested <fragment> inside a <n> (for NodeType="Fragment" expansion)
    if (trimmed.startsWith('<fragment') && fragmentDepth > 0) {
      inNestedFragment = true;
    }
    if (trimmed === '</fragment>' && inNestedFragment) {
      inNestedFragment = false;
      continue;
    }
    if (inNestedFragment) continue;

    // Track main fragment depth
    if (trimmed.startsWith('<fragment')) fragmentDepth++;
    if (trimmed === '</fragment>') {
      fragmentDepth--;
      continue;
    }

    // Parse node (atom)
    if (trimmed.startsWith('<n') && (trimmed.includes(' id=') || trimmed.includes('\tid='))) {
      const id = getAttr(trimmed, 'id') ?? '';
      const p = getAttr(trimmed, 'p');
      const element = parseInt(getAttr(trimmed, 'Element') ?? '6', 10);
      const charge = parseInt(getAttr(trimmed, 'Charge') ?? '0', 10);
      const isotope = parseInt(getAttr(trimmed, 'Isotope') ?? '0', 10);
      const radical = parseInt(getAttr(trimmed, 'Radical') ?? '0', 10);
      const nodeType = getAttr(trimmed, 'NodeType') ?? '';

      // Skip ExternalConnectionPoint nodes
      if (nodeType === 'ExternalConnectionPoint') continue;

      if (!p || !id) continue;
      const parts = p.split(/\s+/).map(Number);
      const px = parts[0];
      const py = parts[1];
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

    // Parse bond
    if (trimmed.startsWith('<b') && (trimmed.includes(' B=') || trimmed.includes('\tB='))) {
      // Make sure it's a bond, not <bracketedgroup> or other <b*> tag
      if (trimmed.startsWith('<br') || trimmed.startsWith('<bo')) continue;

      const beginId = getAttr(trimmed, 'B') ?? '';
      const endId = getAttr(trimmed, 'E') ?? '';
      const orderStr = getAttr(trimmed, 'Order') ?? '1';
      const display = getAttr(trimmed, 'Display') ?? '';

      if (!beginId || !endId) continue;

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
  }

  return { atoms, bonds };
}

function getAttr(line: string, name: string): string | undefined {
  // Match attribute: name="value" (case sensitive for CDXML)
  const regex = new RegExp(`\\b${name}="([^"]*)"`, '');
  const match = line.match(regex);
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
  if (d === 'dash' || d === 'hash' || d.includes('hash')) return 'dash';
  if (order === 2) return 'double';
  if (order === 3) return 'triple';
  if (order === 1.5) return 'aromatic';
  return 'single';
}
