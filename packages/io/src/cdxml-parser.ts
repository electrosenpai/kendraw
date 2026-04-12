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

export interface CdxmlGraphic {
  type: 'rectangle' | 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CdxmlParseResult {
  atoms: Atom[];
  bonds: Bond[];
  arrows: Arrow[];
  annotations: Annotation[];
  graphics: CdxmlGraphic[];
}

const SCALE = 96 / 72; // pt to px at 96 DPI

/** Decode XML entities: &amp; &lt; &gt; &apos; &quot; */
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

export function parseCdxml(xml: string): CdxmlParseResult {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const arrows: Arrow[] = [];
  const annotations: Annotation[] = [];
  const graphics: CdxmlGraphic[] = [];
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
    if (label) atom.label = decodeXmlEntities(label);
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
  // Capture ALL <s> text content within each <t> block (multi-run support)
  const freeTextRegex = /<t\b\s([^>]*?)>([\s\S]*?)<\/t>/g;
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
    const innerHtml = m[2] ?? '';

    // Extract all <s> text content preserving newlines
    const sRegex2 = /<s\b([^>]*)>([^<]*)<\/s>/g;
    let sMatch2: RegExpExecArray | null;
    const richText: Array<{ text: string; style?: 'normal' | 'subscript' | 'superscript' }> = [];
    while ((sMatch2 = sRegex2.exec(innerHtml)) !== null) {
      const sAttrs = sMatch2[1] ?? '';
      const sText = decodeXmlEntities(sMatch2[2] ?? '');
      if (!sText) continue;
      const face = parseInt(getAttr(sAttrs, 'face') ?? '0', 10);
      // face=96 → formula mode (digits become subscript), face=97 → bold formula
      // Apply formula mode: split text into letter/digit segments
      if (face === 96 || face === 97) {
        // Formula mode: digits are subscripts
        let i2 = 0;
        while (i2 < sText.length) {
          const ch2 = sText[i2];
          if (ch2 && ch2 >= '0' && ch2 <= '9') {
            let num = '';
            while (i2 < sText.length) {
              const d = sText[i2];
              if (!d || d < '0' || d > '9') break;
              num += d;
              i2++;
            }
            richText.push({ text: num, style: 'subscript' });
          } else {
            richText.push({ text: ch2 ?? '', style: 'normal' });
            i2++;
          }
        }
      } else {
        // Plain text or bold (face=1) — render as normal
        richText.push({ text: sText, style: 'normal' });
      }
    }
    if (richText.length === 0) continue;

    const p2 = getAttr(attrs, 'p');
    if (!p2) continue;
    const parts2 = p2.split(/\s+/).map(Number);
    const px2 = (parts2[0] ?? 0) * SCALE;
    const py2 = (parts2[1] ?? 0) * SCALE;

    annotations.push({
      id: crypto.randomUUID() as AnnotationId,
      x: px2,
      y: py2,
      richText,
    });
  }

  // --- Parse <graphic> elements (rectangles, lines) ---
  const graphicRegex = /<graphic\b\s([^>]+?)(?:\/>|>)/g;
  while ((m = graphicRegex.exec(xml)) !== null) {
    const gAttrs = m[1] ?? '';
    const gType = getAttr(gAttrs, 'GraphicType') ?? '';
    const bb = getAttr(gAttrs, 'BoundingBox');
    if (!bb) continue;

    const bbParts = bb.split(/\s+/).map(Number);
    const bx1 = (bbParts[0] ?? 0) * SCALE;
    const by1 = (bbParts[1] ?? 0) * SCALE;
    const bx2 = (bbParts[2] ?? 0) * SCALE;
    const by2 = (bbParts[3] ?? 0) * SCALE;

    if (gType === 'Rectangle' || gType.includes('Rect')) {
      graphics.push({ type: 'rectangle', x1: bx1, y1: by1, x2: bx2, y2: by2 });
    } else if (gType === 'Line') {
      graphics.push({ type: 'line', x1: bx1, y1: by1, x2: bx2, y2: by2 });
    }
  }

  return { atoms, bonds, arrows, annotations, graphics };
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
  const d = display.toLowerCase().trim();

  // Numeric display types (CDX binary values 0-11)
  const numericMap: Record<string, Bond['style']> = {
    '0': 'single',
    '1': 'dash',
    '2': 'dash',
    '3': 'hashed-wedge',
    '4': 'hashed-wedge-end',
    '5': 'bold',
    '6': 'wedge',
    '7': 'wedge-end',
    '8': 'wavy',
    '9': 'hollow-wedge',
    '10': 'hollow-wedge-end',
    '11': 'double',
  };
  if (numericMap[d]) return numericMap[d];

  // String display types
  if (d === 'wavy' || d === 'wavycross') return 'wavy';
  if (d === 'wedgebegin') return 'wedge';
  if (d === 'wedgeend') return 'wedge-end';
  if (d === 'wedgedhashbegin') return 'hashed-wedge';
  if (d === 'wedgedhashend') return 'hashed-wedge-end';
  if (d === 'hollowwedgebegin') return 'hollow-wedge';
  if (d === 'hollowwedgeend') return 'hollow-wedge-end';
  if (d === 'bold') return 'bold';
  if (d === 'dash' || d === 'hash') return 'dash';

  // Default from bond order
  if (order === 2) return 'double';
  if (order === 3) return 'triple';
  if (order === 1.5) return 'aromatic';
  return 'single';
}
