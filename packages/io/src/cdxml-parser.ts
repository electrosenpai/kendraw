/**
 * CDXML parser — reads ChemDraw XML format.
 * Source: chemdraw-technical-reference.md Section 3.3
 *
 * Parses: atoms, bonds, arrows, free text, R-group labels.
 * Preserves absolute positions from the CDXML file.
 */

import type {
  Atom,
  AtomId,
  Bond,
  BondId,
  Arrow,
  ArrowId,
  Annotation,
  AnnotationId,
} from '@kendraw/scene';

export interface CdxmlParseResult {
  atoms: Atom[];
  bonds: Bond[];
  arrows: Arrow[];
  annotations: Annotation[];
}

const SCALE = 96 / 72; // pt to px at 96 DPI

export function parseCdxml(xml: string): CdxmlParseResult {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const arrows: Arrow[] = [];
  const annotations: Annotation[] = [];
  const idMap = new Map<string, AtomId>();

  // Strip nested <fragment> inside NodeType="Fragment" nodes (CO2H expansions)
  const cleaned = xml.replace(
    /(<n\b[^>]*NodeType="Fragment"[^>]*>)\s*<fragment[\s\S]*?<\/fragment>/g,
    '$1',
  );

  // --- Parse <n> nodes (atoms) ---
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

    // For GenericNickname or Fragment nodes, extract the label text
    let label: string | undefined;
    if (nodeType === 'GenericNickname' || nodeType === 'Fragment' || nodeType === 'Unspecified') {
      // Find the <s> text content after this node
      const afterNode = cleaned.substring((m.index ?? 0) + m[0].length);
      const sMatch = afterNode.match(/<s\b[^>]*>([^<]*)<\/s>/);
      if (sMatch) label = sMatch[1];
    }

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
    if (label) atom.label = label;
    atoms.push(atom);
  }

  // --- Parse <b> bonds ---
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

  // --- Parse <arrow> elements (reaction arrows) ---
  const arrowRegex = /<arrow\b\s([^>]+?)(?:\/>|>)/g;
  while ((m = arrowRegex.exec(xml)) !== null) {
    const attrs = m[1] ?? '';
    const head3d = getAttr(attrs, 'Head3D');
    const tail3d = getAttr(attrs, 'Tail3D');
    if (!head3d || !tail3d) continue;

    const hp = head3d.split(/\s+/).map(Number);
    const tp = tail3d.split(/\s+/).map(Number);
    const hx = (hp[0] ?? 0) * SCALE;
    const hy = (hp[1] ?? 0) * SCALE;
    const tx = (tp[0] ?? 0) * SCALE;
    const ty = (tp[1] ?? 0) * SCALE;

    // Determine arrow type from attributes
    const arrowHead = getAttr(attrs, 'ArrowheadHead') ?? '';
    let type: Arrow['type'] = 'forward';
    if (arrowHead.toLowerCase().includes('retro')) type = 'reversible';

    arrows.push({
      id: crypto.randomUUID() as ArrowId,
      type,
      geometry: {
        start: { x: tx, y: ty },
        c1: { x: tx + (hx - tx) * 0.33, y: ty + (hy - ty) * 0.33 },
        c2: { x: tx + (hx - tx) * 0.66, y: ty + (hy - ty) * 0.66 },
        end: { x: hx, y: hy },
      },
      startAnchor: { kind: 'free' },
      endAnchor: { kind: 'free' },
    });
  }

  // --- Parse standalone <t> elements (free text: conditions, labels, "+", numbering) ---
  // These are <t> directly under <page>, not inside <n> nodes.
  // Strategy: find all <t> with a p attribute that are NOT inside a <n>...</n> block.
  const freeTextRegex = /<t\b\s([^>]*?)>[\s\S]*?<s\b[^>]*>([^<]*)<\/s>[\s\S]*?<\/t>/g;
  // We need to check that each match is not inside a <n>...</n>
  const nOpenRegex = /<n\b/g;
  const nCloseRegex = /<\/n>/g;
  let nOpen: RegExpExecArray | null;
  const nRanges: [number, number][] = [];
  const nStarts: number[] = [];
  while ((nOpen = nOpenRegex.exec(xml)) !== null) nStarts.push(nOpen.index);
  let nClose: RegExpExecArray | null;
  const nEnds: number[] = [];
  while ((nClose = nCloseRegex.exec(xml)) !== null) nEnds.push(nClose.index);
  // Simple pairing: each nStart pairs with the next nEnd after it
  for (const start of nStarts) {
    const end = nEnds.find((e) => e > start);
    if (end !== undefined) nRanges.push([start, end]);
  }

  while ((m = freeTextRegex.exec(xml)) !== null) {
    const pos = m.index;
    // Skip if inside a <n>...</n> block
    const insideNode = nRanges.some(([s, e]) => pos > s && pos < e);
    if (insideNode) continue;

    const attrs = m[1] ?? '';
    const textContent = m[2] ?? '';
    if (!textContent.trim()) continue;

    const p = getAttr(attrs, 'p');
    if (!p) continue;
    const parts = p.split(/\s+/).map(Number);
    const px = (parts[0] ?? 0) * SCALE;
    const py = (parts[1] ?? 0) * SCALE;

    annotations.push({
      id: crypto.randomUUID() as AnnotationId,
      x: px,
      y: py,
      richText: [{ text: textContent.trim() }],
    });
  }

  return { atoms, bonds, arrows, annotations };
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
