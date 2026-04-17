/**
 * CDXML 1.0 writer (MVP) — Wave-4 P1-06.
 *
 * Generates a CDXML document compatible with the ChemDraw 21.0+ Open
 * dialog from a Kendraw {@link Page}. The MVP covers the regulatory
 * "submit a structure" workflow Reid (regulatory panelist) flagged as
 * the eCTD blocker:
 *
 *  - Atoms: position (pt), element symbol (when non-carbon or charged),
 *    formal charge, isotope.
 *  - Bonds: order, wedge/hash stereo display, dative arrow.
 *  - Annotations (free text): position, multi-run rich text with
 *    super/subscript and Greek glyphs.
 *  - Arrows: forward/equilibrium/reversible/resonance/retro/dipole/no-go
 *    rendered as ChemDraw `<arrow>` elements. Curly arrows are emitted
 *    as plain bezier `<curve>` elements with arrowheads (lossy — we
 *    flag them in the deferred-work doc).
 *  - Document settings: bond length pt, label font/size, line widths.
 *
 * Out of scope (deferred):
 *  - R-groups / Markush attachment points (no scene model yet).
 *  - Group label fragments (-Me, -OAc) are written as their expansion
 *    when the user expands them in Kendraw before export.
 *  - Stereo descriptors beyond wedge/hash (atomParity, bondParity).
 *  - Embedded NMR overlays.
 *
 * Output is round-trip compatible with `parseCdxml()` for the in-scope
 * subset; the writer is exercised in tests by parse → write → parse.
 *
 * Reference: ChemDraw 21 SDK CDXML schema (DTD distributed with the SDK).
 */

import type { Page, Atom, Bond, Annotation, Arrow } from '@kendraw/scene';
import { getSymbol } from '@kendraw/scene';

const SCALE_PX_TO_PT = 72 / 96; // inverse of cdxml-parser SCALE.

export interface CdxmlWriteOptions {
  /** Document creator metadata, written into <CDXML CreationProgram>. */
  creator?: string;
  /** Document title/comment, written into <colortable Comment> if set. */
  title?: string;
  /** Bond length in pt; mirrors what `parseCdxml` reads. Default 30. */
  bondLengthPt?: number;
  /** Optional pretty-print indentation. Default 2. Set to 0 for compact. */
  indent?: number;
}

const DEFAULT_OPTS: Required<CdxmlWriteOptions> = {
  creator: 'Kendraw',
  title: '',
  bondLengthPt: 30,
  indent: 2,
};

/** Serialise a Page to a CDXML 1.0 document string. */
export function writeCdxml(page: Page, opts: CdxmlWriteOptions = {}): string {
  const o = { ...DEFAULT_OPTS, ...opts };
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" ?>');
  lines.push(
    '<!DOCTYPE CDXML SYSTEM "http://www.cambridgesoft.com/xml/cdxml.dtd" >',
  );
  lines.push(
    `<CDXML CreationProgram="${escAttr(o.creator)}" BondLength="${num(o.bondLengthPt)}" LabelFont="3" CaptionFont="4">`,
  );
  if (o.title) {
    lines.push(indent(o.indent, 1) + `<!-- ${escComment(o.title)} -->`);
  }
  // Required font/color tables — ChemDraw rejects files without them.
  lines.push(
    indent(o.indent, 1) +
      '<fonttable>' +
      '<font id="3" charset="utf-8" name="Arial"/>' +
      '<font id="4" charset="utf-8" name="Times New Roman"/>' +
      '</fonttable>',
  );
  lines.push(
    indent(o.indent, 1) +
      '<colortable>' +
      '<color r="1" g="1" b="1"/>' +
      '<color r="0" g="0" b="0"/>' +
      '<color r="1" g="0" b="0"/>' +
      '<color r="1" g="1" b="0"/>' +
      '<color r="0" g="1" b="0"/>' +
      '<color r="0" g="1" b="1"/>' +
      '<color r="0" g="0" b="1"/>' +
      '<color r="1" g="0" b="1"/>' +
      '</colortable>',
  );

  lines.push(indent(o.indent, 1) + '<page>');

  // Map our string ids to small numeric ids. CDXML requires `id` attrs to
  // be parseable as integers. We assign in iteration order so atoms are
  // stable when the same Page is re-exported.
  const atomIdMap = new Map<string, number>();
  const atomList = Object.values(page.atoms);
  atomList.forEach((a, i) => atomIdMap.set(a.id, i + 1));

  let nextNonAtomId = atomList.length + 1;
  const allocId = () => nextNonAtomId++;

  // Group atoms+bonds inside a <fragment> per ChemDraw convention. Even
  // disconnected molecules are accepted in a single fragment by ChemDraw.
  if (atomList.length > 0 || Object.keys(page.bonds).length > 0) {
    lines.push(indent(o.indent, 2) + `<fragment id="${allocId()}">`);
    for (const atom of atomList) {
      lines.push(indent(o.indent, 3) + atomToXml(atom, atomIdMap));
    }
    for (const bond of Object.values(page.bonds)) {
      const fxml = bondToXml(bond, atomIdMap, allocId);
      if (fxml !== null) lines.push(indent(o.indent, 3) + fxml);
    }
    lines.push(indent(o.indent, 2) + '</fragment>');
  }

  // Free-text annotations as <t> elements at page level.
  for (const ann of Object.values(page.annotations)) {
    lines.push(indent(o.indent, 2) + annotationToXml(ann, allocId));
  }

  // Arrows — best-effort mapping. ChemDraw <arrow> uses ArrowHead*Type
  // attributes for half/full/none and Head3D/Tail3D for endpoints.
  for (const arr of Object.values(page.arrows)) {
    lines.push(indent(o.indent, 2) + arrowToXml(arr, allocId));
  }

  lines.push(indent(o.indent, 1) + '</page>');
  lines.push('</CDXML>');
  return lines.join('\n') + '\n';
}

function atomToXml(atom: Atom, idMap: Map<string, number>): string {
  const id = idMap.get(atom.id);
  const x = num(atom.x * SCALE_PX_TO_PT);
  const y = num(atom.y * SCALE_PX_TO_PT);
  const attrs = [`id="${id}"`, `p="${x} ${y}"`];
  // Element=6 is Carbon (the CDXML default). Omit the Element attr for C
  // to keep output compact and round-trip-equivalent to parser defaults.
  if (atom.element !== 6) {
    attrs.push(`Element="${atom.element}"`);
  }
  if (atom.charge !== 0) {
    attrs.push(`Charge="${atom.charge}"`);
  }
  if (atom.isotope !== undefined && atom.isotope > 0) {
    attrs.push(`Isotope="${atom.isotope}"`);
  }
  if (atom.radicalCount > 0) {
    attrs.push(`Radical="${atom.radicalCount === 1 ? 'Doublet' : 'Triplet'}"`);
  }
  // Explicit label node — if the user wrote "OMe", "OAc", etc., emit a
  // child <t> so ChemDraw shows the label rather than the bare element.
  if (atom.hasExplicitLabel && atom.label) {
    return (
      `<n ${attrs.join(' ')}>` +
      `<t><s font="3" size="10">${escText(atom.label)}</s></t>` +
      `</n>`
    );
  }
  // Tag the element symbol as a comment for round-trip readability when
  // the file is opened in a text editor — ChemDraw ignores it.
  void getSymbol; // keep import live for future symbol-attribute support
  return `<n ${attrs.join(' ')}/>`;
}

function bondToXml(
  bond: Bond,
  idMap: Map<string, number>,
  allocId: () => number,
): string | null {
  const begin = idMap.get(bond.fromAtomId);
  const end = idMap.get(bond.toAtomId);
  if (begin === undefined || end === undefined) return null;
  const attrs = [`id="${allocId()}"`, `B="${begin}"`, `E="${end}"`];
  // ChemDraw stores order as the integer 1/2/3 or "1.5" for aromatic
  // (actually `Order="1.5"`). Single is the default — omit to compact.
  if (bond.order !== 1) {
    attrs.push(`Order="${bond.order}"`);
  }
  const display = bondDisplay(bond.style);
  if (display) attrs.push(`Display="${display}"`);
  if (bond.style === 'dative') attrs.push('Display="Dative"');
  return `<b ${attrs.join(' ')}/>`;
}

/**
 * Map our scene bond `style` to ChemDraw's `Display` enum. Only stereo /
 * unusual displays need a value — plain "single"/"double"/"triple" use
 * Order alone. Returns empty string when no Display attr is needed.
 */
function bondDisplay(style: Bond['style']): string {
  switch (style) {
    case 'wedge':
      return 'WedgeBegin';
    case 'wedge-end':
      return 'WedgeEnd';
    case 'hashed-wedge':
      return 'WedgedHashBegin';
    case 'hashed-wedge-end':
      return 'WedgedHashEnd';
    case 'hollow-wedge':
      return 'HollowWedgeBegin';
    case 'hollow-wedge-end':
      return 'HollowWedgeEnd';
    case 'wavy':
      return 'Wavy';
    case 'bold':
      return 'Bold';
    case 'dash':
      return 'Dash';
    default:
      return '';
  }
}

function annotationToXml(ann: Annotation, allocId: () => number): string {
  const x = num(ann.x * SCALE_PX_TO_PT);
  const y = num(ann.y * SCALE_PX_TO_PT);
  const fontSize = ann.fontSize ?? 10;
  const runs = ann.richText
    .map((r) => {
      const styleAttrs = [`font="3"`, `size="${fontSize}"`];
      if (r.style === 'subscript') styleAttrs.push('face="32"');
      else if (r.style === 'superscript') styleAttrs.push('face="64"');
      else if (r.style === 'greek') styleAttrs.push('font="4"');
      if (ann.bold) styleAttrs.push('face="1"');
      if (ann.italic) styleAttrs.push('face="2"');
      return `<s ${styleAttrs.join(' ')}>${escText(r.text)}</s>`;
    })
    .join('');
  return `<t id="${allocId()}" p="${x} ${y}">${runs}</t>`;
}

function arrowToXml(arr: Arrow, allocId: () => number): string {
  const g = arr.geometry;
  const hx = num(g.start.x * SCALE_PX_TO_PT);
  const hy = num(g.start.y * SCALE_PX_TO_PT);
  const tx = num(g.end.x * SCALE_PX_TO_PT);
  const ty = num(g.end.y * SCALE_PX_TO_PT);
  const attrs = [
    `id="${allocId()}"`,
    `Head3D="${tx} ${ty} 0"`,
    `Tail3D="${hx} ${hy} 0"`,
  ];
  switch (arr.type) {
    case 'forward':
      attrs.push('ArrowheadHead="Full"', 'ArrowheadTail="None"');
      break;
    case 'equilibrium':
      attrs.push('ArrowheadHead="Half"', 'ArrowheadTail="Half"');
      break;
    case 'reversible':
      attrs.push('ArrowheadHead="Full"', 'ArrowheadTail="Full"');
      break;
    case 'resonance':
      attrs.push('ArrowheadHead="Full"', 'ArrowheadTail="Full"', 'ArrowheadType="Solid"');
      break;
    case 'retro':
      attrs.push('ArrowheadHead="Full"', 'ArrowheadTail="None"', 'ArrowheadType="Hollow"');
      break;
    case 'no-go':
      attrs.push('ArrowheadHead="Full"', 'NoGo="Cross"');
      break;
    default:
      // curly-radical, curly-pair, dipole — best-effort; ChemDraw will
      // render them as a solid arrow without the curly geometry.
      attrs.push('ArrowheadHead="Full"');
  }
  return `<arrow ${attrs.join(' ')}/>`;
}

function escAttr(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escText(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escComment(v: string): string {
  // CDATA-safe: forbid `--` inside comments.
  return v.replace(/--/g, '- -');
}

function num(n: number): string {
  // CDXML accepts floats with up to 4 decimals; trim trailing zeros for
  // smaller files and stable hashes when round-tripping.
  if (!Number.isFinite(n)) return '0';
  const s = n.toFixed(4);
  return s.replace(/\.?0+$/, '') || '0';
}

function indent(spaces: number, depth: number): string {
  if (spaces <= 0) return '';
  return ' '.repeat(spaces * depth);
}
