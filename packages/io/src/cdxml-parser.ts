/**
 * CDXML parser — reads ChemDraw XML format.
 * Source: chemdraw-technical-reference.md Section 3.3
 *
 * Parses: atoms, bonds, arrows, free text, R-group labels, graphic overlays.
 * Preserves absolute positions from the CDXML file.
 * Extracts document-level style settings from the <CDXML> root element.
 *
 * Uses DOMParser for reliable XML traversal (replaces fragile regex approach).
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

/** Document-level style settings parsed from the <CDXML> root element. */
export interface CdxmlDocumentSettings {
  bondLengthPt: number;
  labelSizePt: number;
  lineWidthPt: number;
  boldWidthPt: number;
  hashSpacingPt: number;
  marginWidthPt: number;
  bondSpacing: number; // fraction (0.18 = 18%)
  chainAngle: number;
  showTerminalCarbonLabels: boolean;
  showNonTerminalCarbonLabels: boolean;
  labelFont: string;
}

export interface CdxmlParseResult {
  atoms: Atom[];
  bonds: Bond[];
  arrows: Arrow[];
  annotations: Annotation[];
  graphics: CdxmlGraphic[];
  documentSettings: CdxmlDocumentSettings;
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

/** New Document defaults (fallbacks when CDXML omits an attribute). */
const DEFAULTS: CdxmlDocumentSettings = {
  bondLengthPt: 30,
  labelSizePt: 10,
  lineWidthPt: 1.0,
  boldWidthPt: 2.0,
  hashSpacingPt: 2.7,
  marginWidthPt: 2.0,
  bondSpacing: 0.12,
  chainAngle: 120,
  showTerminalCarbonLabels: true,
  showNonTerminalCarbonLabels: false,
  labelFont: 'Arial',
};

/** Parse a float attribute with a fallback. */
function floatAttr(el: Element, name: string, fallback: number): number {
  const v = el.getAttribute(name);
  if (v === null) return fallback;
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

/** Parse a boolean-ish attribute ("yes"/"no", default fallback). */
function boolAttr(el: Element, name: string, fallback: boolean): boolean {
  const v = el.getAttribute(name);
  if (v === null) return fallback;
  return v.toLowerCase() === 'yes';
}

/** Extract document-level settings from the <CDXML> root element. */
function parseDocumentSettings(root: Element): CdxmlDocumentSettings {
  const bondSpacingRaw = floatAttr(root, 'BondSpacing', DEFAULTS.bondSpacing * 100);
  return {
    bondLengthPt: floatAttr(root, 'BondLength', DEFAULTS.bondLengthPt),
    labelSizePt: floatAttr(root, 'LabelSize', DEFAULTS.labelSizePt),
    lineWidthPt: floatAttr(root, 'LineWidth', DEFAULTS.lineWidthPt),
    boldWidthPt: floatAttr(root, 'BoldWidth', DEFAULTS.boldWidthPt),
    hashSpacingPt: floatAttr(root, 'HashSpacing', DEFAULTS.hashSpacingPt),
    marginWidthPt: floatAttr(root, 'MarginWidth', DEFAULTS.marginWidthPt),
    // BondSpacing is stored as percentage (18) in CDXML, convert to fraction (0.18)
    bondSpacing: bondSpacingRaw > 1 ? bondSpacingRaw / 100 : bondSpacingRaw,
    chainAngle: floatAttr(root, 'ChainAngle', DEFAULTS.chainAngle),
    showTerminalCarbonLabels: boolAttr(
      root,
      'ShowTerminalCarbonLabels',
      DEFAULTS.showTerminalCarbonLabels,
    ),
    showNonTerminalCarbonLabels: boolAttr(
      root,
      'ShowNonTerminalCarbonLabels',
      DEFAULTS.showNonTerminalCarbonLabels,
    ),
    labelFont: root.getAttribute('LabelFont') ? 'Arial' : DEFAULTS.labelFont,
  };
}

export function parseCdxml(xml: string): CdxmlParseResult {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const arrows: Arrow[] = [];
  const annotations: Annotation[] = [];
  const graphics: CdxmlGraphic[] = [];
  const idMap = new Map<string, AtomId>();

  // Parse XML with DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { atoms, bonds, arrows, annotations, graphics, documentSettings: DEFAULTS };
  }

  // Find the <CDXML> root element (case-insensitive search)
  const root = doc.documentElement;
  const documentSettings = parseDocumentSettings(root);

  // --- Parse <n> nodes (atoms) from all <fragment> elements ---
  const allNodes = doc.querySelectorAll('fragment > n');
  for (const nEl of allNodes) {
    const id = nEl.getAttribute('id');
    const p = nEl.getAttribute('p');
    if (!id || !p) continue;

    const nodeType = nEl.getAttribute('NodeType') ?? '';
    if (nodeType === 'ExternalConnectionPoint') continue;

    const parts = p.split(/\s+/).map(Number);
    const px = parts[0];
    const py = parts[1];
    if (px === undefined || py === undefined || isNaN(px) || isNaN(py)) continue;

    const element = parseInt(nEl.getAttribute('Element') ?? '6', 10);
    const charge = parseInt(nEl.getAttribute('Charge') ?? '0', 10);
    const isotope = parseInt(nEl.getAttribute('Isotope') ?? '0', 10);
    const radical = parseInt(nEl.getAttribute('Radical') ?? '0', 10);

    // Check for <t> child (explicit label) — skip <t> inside nested <fragment>
    const tEl = nEl.querySelector(':scope > t');
    const hasExplicitLabel = tEl !== null;

    // Determine label text
    let label: string | undefined;
    if (nodeType === 'GenericNickname' || nodeType === 'Fragment' || nodeType === 'Unspecified') {
      // For nickname/fragment nodes, always use the <s> text
      if (tEl) {
        label = extractTextFromT(tEl);
      }
    } else if (hasExplicitLabel && tEl) {
      // Normal node with explicit text — use the CDXML text as-is
      // (Preserves explicit formatting like "OH", "OMe", "CH₃", etc.)
      const text = extractTextFromT(tEl);
      if (text) label = text;
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
    if (hasExplicitLabel) atom.hasExplicitLabel = true;
    atoms.push(atom);
  }

  // --- Parse <b> bonds ---
  const allBonds = doc.querySelectorAll('fragment > b');
  for (const bEl of allBonds) {
    const beginId = bEl.getAttribute('B');
    const endId = bEl.getAttribute('E');
    if (!beginId || !endId) continue;

    const fromAtomId = idMap.get(beginId);
    const toAtomId = idMap.get(endId);
    if (!fromAtomId || !toAtomId) continue;

    const orderStr = bEl.getAttribute('Order') ?? '1';
    const display = bEl.getAttribute('Display') ?? '';
    const order = parseOrder(orderStr);

    const bond: Bond = {
      id: crypto.randomUUID() as BondId,
      fromAtomId,
      toAtomId,
      order,
      style: parseDisplay(display, order),
    };

    // Parse DoublePosition attribute
    const dp = bEl.getAttribute('DoublePosition');
    if (dp) {
      const dpLower = dp.toLowerCase();
      if (dpLower === 'left') bond.doublePosition = 'left';
      else if (dpLower === 'right') bond.doublePosition = 'right';
      else if (dpLower === 'center') bond.doublePosition = 'center';
    }

    bonds.push(bond);
  }

  // --- Parse <arrow> elements (reaction arrows) ---
  const allArrows = doc.querySelectorAll('arrow');
  for (const arEl of allArrows) {
    const head3d = arEl.getAttribute('Head3D');
    const tail3d = arEl.getAttribute('Tail3D');
    if (!head3d || !tail3d) continue;

    const hp = head3d.split(/\s+/).map(Number);
    const tp = tail3d.split(/\s+/).map(Number);
    const hx = (hp[0] ?? 0) * SCALE;
    const hy = (hp[1] ?? 0) * SCALE;
    const tx = (tp[0] ?? 0) * SCALE;
    const ty = (tp[1] ?? 0) * SCALE;

    // --- Arrowhead configuration ---
    const headAttr = (arEl.getAttribute('ArrowheadHead') ?? '').toLowerCase();
    const tailAttr = (arEl.getAttribute('ArrowheadTail') ?? '').toLowerCase();
    const typeAttr = (arEl.getAttribute('ArrowheadType') ?? '').toLowerCase();

    const arrowheadHead: Arrow['arrowheadHead'] =
      headAttr === 'full' ? 'full' : headAttr === 'half' ? 'half' : headAttr ? 'full' : 'none';
    const arrowheadTail: Arrow['arrowheadTail'] =
      tailAttr === 'full' ? 'full' : tailAttr === 'half' ? 'half' : tailAttr ? 'full' : 'none';

    // Determine arrow type from arrowhead configuration
    let type: Arrow['type'] = 'forward';
    if (typeAttr.includes('retro')) {
      type = 'reversible';
    } else if (arrowheadHead !== 'none' && arrowheadTail !== 'none') {
      type = 'equilibrium';
    }

    // --- Curve geometry ---
    // CurvePoints provides explicit Bézier control points (space-separated 3D coords).
    // AngularSize indicates an arc-based arrow.
    const curvePoints = arEl.getAttribute('CurvePoints');
    const angularSize = arEl.getAttribute('AngularSize');
    let geometry: Arrow['geometry'];

    if (curvePoints) {
      // CurvePoints is "x1 y1 z1 x2 y2 z2 x3 y3 z3 x4 y4 z4" (4 points = cubic Bézier)
      const pts = curvePoints.split(/\s+/).map(Number);
      const numPoints = Math.floor(pts.length / 3);
      if (numPoints >= 4) {
        // Full cubic Bézier: 4 control points
        geometry = {
          start: { x: (pts[0] ?? 0) * SCALE, y: (pts[1] ?? 0) * SCALE },
          c1: { x: (pts[3] ?? 0) * SCALE, y: (pts[4] ?? 0) * SCALE },
          c2: { x: (pts[6] ?? 0) * SCALE, y: (pts[7] ?? 0) * SCALE },
          end: { x: (pts[9] ?? 0) * SCALE, y: (pts[10] ?? 0) * SCALE },
        };
      } else if (numPoints === 3) {
        // Quadratic Bézier elevated to cubic: use middle point as both c1 and c2
        const mx = (pts[3] ?? 0) * SCALE;
        const my = (pts[4] ?? 0) * SCALE;
        geometry = {
          start: { x: (pts[0] ?? 0) * SCALE, y: (pts[1] ?? 0) * SCALE },
          c1: { x: mx, y: my },
          c2: { x: mx, y: my },
          end: { x: (pts[6] ?? 0) * SCALE, y: (pts[7] ?? 0) * SCALE },
        };
      } else {
        // Fall back to straight line
        geometry = {
          start: { x: tx, y: ty },
          c1: { x: tx + (hx - tx) * 0.33, y: ty + (hy - ty) * 0.33 },
          c2: { x: tx + (hx - tx) * 0.66, y: ty + (hy - ty) * 0.66 },
          end: { x: hx, y: hy },
        };
      }
    } else if (angularSize) {
      // Arc-based arrow: approximate arc with a cubic Bézier
      const angle = parseFloat(angularSize) || 0;
      const midX = (tx + hx) / 2;
      const midY = (ty + hy) / 2;
      const dx = hx - tx;
      const dy = hy - ty;
      // Perpendicular offset proportional to angular size
      const bulge = (Math.abs(angle) / 180) * Math.sqrt(dx * dx + dy * dy) * 0.5;
      const nx = dy === 0 && dx === 0 ? 0 : -dy / Math.sqrt(dx * dx + dy * dy);
      const ny = dy === 0 && dx === 0 ? 1 : dx / Math.sqrt(dx * dx + dy * dy);
      const sign = angle >= 0 ? 1 : -1;
      geometry = {
        start: { x: tx, y: ty },
        c1: { x: midX + nx * bulge * sign - dx * 0.17, y: midY + ny * bulge * sign - dy * 0.17 },
        c2: { x: midX + nx * bulge * sign + dx * 0.17, y: midY + ny * bulge * sign + dy * 0.17 },
        end: { x: hx, y: hy },
      };
    } else {
      // Straight arrow: collinear control points
      geometry = {
        start: { x: tx, y: ty },
        c1: { x: tx + (hx - tx) * 0.33, y: ty + (hy - ty) * 0.33 },
        c2: { x: tx + (hx - tx) * 0.66, y: ty + (hy - ty) * 0.66 },
        end: { x: hx, y: hy },
      };
    }

    arrows.push({
      id: crypto.randomUUID() as ArrowId,
      type,
      geometry,
      startAnchor: { kind: 'free' },
      endAnchor: { kind: 'free' },
      arrowheadHead,
      arrowheadTail,
    });
  }

  // --- Parse standalone <t> elements (free text annotations) ---
  // Only include <t> elements that are direct children of <page>,
  // excluding those inside <n>, <objecttag>, <represent>, <crossreference>.
  const pageTElements = doc.querySelectorAll('page > t');
  for (const tEl of pageTElements) {
    const p = tEl.getAttribute('p');
    if (!p) continue;

    const richText = extractRichTextFromT(tEl);
    if (richText.length === 0) continue;

    const parts = p.split(/\s+/).map(Number);
    const px = (parts[0] ?? 0) * SCALE;
    const py = (parts[1] ?? 0) * SCALE;

    annotations.push({
      id: crypto.randomUUID() as AnnotationId,
      x: px,
      y: py,
      richText,
    });
  }

  // --- Parse <graphic> elements ---
  // Skip graphics that are superseded by arrow elements (they are duplicates).
  const allGraphics = doc.querySelectorAll('graphic');
  for (const gEl of allGraphics) {
    if (gEl.getAttribute('SupersededBy')) continue;
    const gType = gEl.getAttribute('GraphicType') ?? '';
    const bb = gEl.getAttribute('BoundingBox');
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

  return { atoms, bonds, arrows, annotations, graphics, documentSettings };
}

/** Extract plain text from all <s> children of a <t> element. */
function extractTextFromT(tEl: Element): string | undefined {
  const sElements = tEl.querySelectorAll('s');
  if (sElements.length === 0) return undefined;
  let text = '';
  for (const s of sElements) {
    text += s.textContent ?? '';
  }
  return text || undefined;
}

/** Extract structured rich text (with formula mode) from a <t> element. */
function extractRichTextFromT(
  tEl: Element,
): Array<{ text: string; style?: 'normal' | 'subscript' | 'superscript' }> {
  const richText: Array<{ text: string; style?: 'normal' | 'subscript' | 'superscript' }> = [];
  const sElements = tEl.querySelectorAll('s');

  for (const s of sElements) {
    const sText = decodeXmlEntities(s.textContent ?? '');
    if (!sText) continue;
    const face = parseInt(s.getAttribute('face') ?? '0', 10);

    // face=96 → formula mode (digits become subscript), face=97 → bold formula
    if (face === 96 || face === 97) {
      let i = 0;
      while (i < sText.length) {
        const ch = sText[i];
        if (ch && ch >= '0' && ch <= '9') {
          let num = '';
          while (i < sText.length) {
            const d = sText[i];
            if (!d || d < '0' || d > '9') break;
            num += d;
            i++;
          }
          richText.push({ text: num, style: 'subscript' });
        } else {
          richText.push({ text: ch ?? '', style: 'normal' });
          i++;
        }
      }
    } else {
      richText.push({ text: sText, style: 'normal' });
    }
  }

  return richText;
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
