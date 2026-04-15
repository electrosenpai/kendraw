import type { Page, Atom, Bond, Annotation, Arrow, BezierGeometry } from '@kendraw/scene';
import { getColor, getSymbol } from '@kendraw/scene';

const ATOM_RADIUS = 14;
const FONT_SIZE = 12;
const PADDING = 30;

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function exportToSVG(page: Page, options?: { width?: number; height?: number }): string {
  const atoms = Object.values(page.atoms);
  const bonds = Object.values(page.bonds);
  const arrows = Object.values(page.arrows);
  const annotations = Object.values(page.annotations);

  // Compute bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const a of atoms) {
    minX = Math.min(minX, a.x - ATOM_RADIUS);
    minY = Math.min(minY, a.y - ATOM_RADIUS);
    maxX = Math.max(maxX, a.x + ATOM_RADIUS);
    maxY = Math.max(maxY, a.y + ATOM_RADIUS);
  }
  for (const arrow of arrows) {
    const g = arrow.geometry;
    for (const p of [g.start, g.c1, g.c2, g.end]) {
      minX = Math.min(minX, p.x - 10);
      minY = Math.min(minY, p.y - 10);
      maxX = Math.max(maxX, p.x + 10);
      maxY = Math.max(maxY, p.y + 10);
    }
  }
  for (const ann of annotations) {
    const textWidth = ann.richText.reduce((w, s) => w + s.text.length * 8, 0);
    const fontSize = ann.fontSize ?? FONT_SIZE;
    minX = Math.min(minX, ann.x);
    minY = Math.min(minY, ann.y);
    maxX = Math.max(maxX, ann.x + textWidth);
    maxY = Math.max(maxY, ann.y + fontSize);
  }
  if (!isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 400;
    maxY = 300;
  }

  const vbX = minX - PADDING;
  const vbY = minY - PADDING;
  const vbW = maxX - minX + PADDING * 2;
  const vbH = maxY - minY + PADDING * 2;
  const width = options?.width ?? Math.round(vbW);
  const height = options?.height ?? Math.round(vbH);

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">`,
  );
  parts.push('<rect width="100%" height="100%" fill="white"/>');

  // Bonds
  for (const bond of bonds) {
    const from = page.atoms[bond.fromAtomId];
    const to = page.atoms[bond.toAtomId];
    if (!from || !to) continue;
    parts.push(renderBondSVG(bond, from, to));
  }

  // Atoms (with lone pairs)
  for (const atom of atoms) {
    parts.push(renderAtomSVG(atom));
    if (atom.lonePairs > 0) {
      parts.push(renderLonePairsSVG(atom, page));
    }
  }

  // Arrows (reaction, curly)
  for (const arrow of arrows) {
    parts.push(renderArrowSVG(arrow));
  }

  // Annotations
  for (const ann of annotations) {
    parts.push(renderAnnotationSVG(ann));
  }

  parts.push('</svg>');
  return parts.join('\n');
}

function renderAtomSVG(atom: Atom): string {
  const color = getColor(atom.element);
  const label = atom.label ?? getSymbol(atom.element);
  const textColor = isLightColor(color) ? '#000' : '#fff';
  return [
    `<circle cx="${atom.x}" cy="${atom.y}" r="${ATOM_RADIUS}" fill="${color}"/>`,
    `<text x="${atom.x}" y="${atom.y}" text-anchor="middle" dominant-baseline="central" font-size="${FONT_SIZE}" font-family="system-ui,sans-serif" fill="${textColor}">${escapeXml(label)}</text>`,
  ].join('\n');
}

function renderBondSVG(bond: Bond, from: Atom, to: Atom): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return '';

  const px = (-dy / len) * 3;
  const py = (dx / len) * 3;
  const stroke = '#555';

  if (bond.order === 1 || bond.order === 1.5) {
    let svg = `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${stroke}" stroke-width="1.5"/>`;
    if (bond.order === 1.5) {
      svg += `\n<line x1="${from.x + px}" y1="${from.y + py}" x2="${to.x + px}" y2="${to.y + py}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="3,3"/>`;
    }
    return svg;
  }
  if (bond.order === 2) {
    return [
      `<line x1="${from.x + px}" y1="${from.y + py}" x2="${to.x + px}" y2="${to.y + py}" stroke="${stroke}" stroke-width="1.5"/>`,
      `<line x1="${from.x - px}" y1="${from.y - py}" x2="${to.x - px}" y2="${to.y - py}" stroke="${stroke}" stroke-width="1.5"/>`,
    ].join('\n');
  }
  if (bond.order === 3) {
    return [
      `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${stroke}" stroke-width="1.5"/>`,
      `<line x1="${from.x + px * 1.5}" y1="${from.y + py * 1.5}" x2="${to.x + px * 1.5}" y2="${to.y + py * 1.5}" stroke="${stroke}" stroke-width="1.5"/>`,
      `<line x1="${from.x - px * 1.5}" y1="${from.y - py * 1.5}" x2="${to.x - px * 1.5}" y2="${to.y - py * 1.5}" stroke="${stroke}" stroke-width="1.5"/>`,
    ].join('\n');
  }
  return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${stroke}" stroke-width="1.5"/>`;
}

function renderLonePairsSVG(atom: Atom, page: Page): string {
  const lpRadius = ATOM_RADIUS + 8;
  const dotSize = 2;
  const bondAngles: number[] = [];
  for (const bond of Object.values(page.bonds)) {
    if (bond.fromAtomId === atom.id) {
      const other = page.atoms[bond.toAtomId];
      if (other) bondAngles.push(Math.atan2(other.y - atom.y, other.x - atom.x));
    } else if (bond.toAtomId === atom.id) {
      const other = page.atoms[bond.fromAtomId];
      if (other) bondAngles.push(Math.atan2(other.y - atom.y, other.x - atom.x));
    }
  }
  const candidates = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  const available = candidates.filter((angle) =>
    bondAngles.every((ba) => {
      let diff = Math.abs(angle - ba);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      return diff > Math.PI / 4;
    }),
  );
  const slots = available.length > 0 ? available : candidates;
  const dots: string[] = [];
  for (let lp = 0; lp < Math.min(atom.lonePairs, slots.length); lp++) {
    const angle = slots[lp] ?? 0;
    const cx = atom.x + lpRadius * Math.cos(angle);
    const cy = atom.y + lpRadius * Math.sin(angle);
    const px = -Math.sin(angle) * 3;
    const py = Math.cos(angle) * 3;
    dots.push(`<circle cx="${cx + px}" cy="${cy + py}" r="${dotSize}" fill="#666"/>`);
    dots.push(`<circle cx="${cx - px}" cy="${cy - py}" r="${dotSize}" fill="#666"/>`);
  }
  return dots.join('\n');
}

function bezierPath(g: BezierGeometry): string {
  return `M${g.start.x},${g.start.y} C${g.c1.x},${g.c1.y} ${g.c2.x},${g.c2.y} ${g.end.x},${g.end.y}`;
}

function arrowheadMarker(id: string, type: 'full' | 'half'): string {
  if (type === 'half') {
    return `<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,5 L10,5 L10,0" fill="none" stroke="#333" stroke-width="1.5"/></marker>`;
  }
  return `<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#333"/></marker>`;
}

function renderArrowSVG(arrow: Arrow): string {
  const g = arrow.geometry;
  const stroke = '#333';
  const sw = 1.5;

  // Curly arrows (Bezier curves with arrowhead)
  if (arrow.type === 'curly-pair' || arrow.type === 'curly-radical') {
    const headType = arrow.type === 'curly-radical' ? 'half' : 'full';
    const markerId = `ah-${arrow.id.slice(0, 8)}`;
    return [
      arrowheadMarker(markerId, headType),
      `<path d="${bezierPath(g)}" fill="none" stroke="${stroke}" stroke-width="${sw}" marker-end="url(#${markerId})"/>`,
    ].join('\n');
  }

  // Straight reaction arrows
  const dx = g.end.x - g.start.x;
  const dy = g.end.y - g.start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const headSize = 8;

  if (arrow.type === 'forward') {
    const tipX = g.end.x;
    const tipY = g.end.y;
    const ax = tipX - headSize * ux + headSize * 0.4 * uy;
    const ay = tipY - headSize * uy - headSize * 0.4 * ux;
    const bx = tipX - headSize * ux - headSize * 0.4 * uy;
    const by = tipY - headSize * uy + headSize * 0.4 * ux;
    return [
      `<line x1="${g.start.x}" y1="${g.start.y}" x2="${tipX - headSize * 0.5 * ux}" y2="${tipY - headSize * 0.5 * uy}" stroke="${stroke}" stroke-width="${sw}"/>`,
      `<polygon points="${tipX},${tipY} ${ax},${ay} ${bx},${by}" fill="${stroke}"/>`,
    ].join('\n');
  }

  if (arrow.type === 'equilibrium') {
    const nx = -uy * 3;
    const ny = ux * 3;
    return [
      `<line x1="${g.start.x + nx}" y1="${g.start.y + ny}" x2="${g.end.x + nx}" y2="${g.end.y + ny}" stroke="${stroke}" stroke-width="1"/>`,
      `<line x1="${g.start.x - nx}" y1="${g.start.y - ny}" x2="${g.end.x - nx}" y2="${g.end.y - ny}" stroke="${stroke}" stroke-width="1"/>`,
      // Right arrowhead on top line
      `<polygon points="${g.end.x + nx},${g.end.y + ny} ${g.end.x + nx - 6 * ux + 3 * uy},${g.end.y + ny - 6 * uy - 3 * ux} ${g.end.x + nx - 6 * ux - 1 * uy},${g.end.y + ny - 6 * uy + 1 * ux}" fill="${stroke}"/>`,
      // Left arrowhead on bottom line
      `<polygon points="${g.start.x - nx},${g.start.y - ny} ${g.start.x - nx + 6 * ux + 3 * uy},${g.start.y - ny + 6 * uy - 3 * ux} ${g.start.x - nx + 6 * ux - 1 * uy},${g.start.y - ny + 6 * uy + 1 * ux}" fill="${stroke}"/>`,
    ].join('\n');
  }

  if (arrow.type === 'reversible' || arrow.type === 'resonance') {
    // Double-headed arrow
    const tipX = g.end.x;
    const tipY = g.end.y;
    const tailX = g.start.x;
    const tailY = g.start.y;
    const makeHead = (tx: number, ty: number, dirX: number, dirY: number) => {
      const ax = tx - headSize * dirX + headSize * 0.4 * dirY;
      const ay = ty - headSize * dirY - headSize * 0.4 * dirX;
      const bx = tx - headSize * dirX - headSize * 0.4 * dirY;
      const by = ty - headSize * dirY + headSize * 0.4 * dirX;
      return `<polygon points="${tx},${ty} ${ax},${ay} ${bx},${by}" fill="${stroke}"/>`;
    };
    return [
      `<line x1="${tailX + headSize * 0.5 * ux}" y1="${tailY + headSize * 0.5 * uy}" x2="${tipX - headSize * 0.5 * ux}" y2="${tipY - headSize * 0.5 * uy}" stroke="${stroke}" stroke-width="${sw}"/>`,
      makeHead(tipX, tipY, ux, uy),
      makeHead(tailX, tailY, -ux, -uy),
    ].join('\n');
  }

  // Fallback: simple line
  return `<line x1="${g.start.x}" y1="${g.start.y}" x2="${g.end.x}" y2="${g.end.y}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function renderAnnotationSVG(ann: Annotation): string {
  const fontSize = ann.fontSize ?? FONT_SIZE;
  const weight = ann.bold ? 'bold' : 'normal';
  const style = ann.italic ? 'italic' : 'normal';
  const color = ann.color ?? '#333';
  const parts: string[] = [];
  const x = ann.x;
  const y = ann.y + fontSize; // SVG text baseline is bottom by default

  for (const seg of ann.richText) {
    const isSubscript = seg.style === 'subscript';
    const isSuperscript = seg.style === 'superscript';
    const size = isSubscript || isSuperscript ? fontSize * 0.75 : fontSize;
    let dy = '0';
    if (isSubscript) dy = `${fontSize * 0.3}`;
    if (isSuperscript) dy = `${-fontSize * 0.3}`;
    parts.push(`<tspan font-size="${size}" dy="${dy}">${escapeXml(seg.text)}</tspan>`);
    if (isSubscript || isSuperscript) {
      parts.push(`<tspan dy="${isSubscript ? -fontSize * 0.3 : fontSize * 0.3}"></tspan>`);
    }
  }

  return `<text x="${x}" y="${y}" font-family="Arial, system-ui, sans-serif" font-weight="${weight}" font-style="${style}" fill="${color}">${parts.join('')}</text>`;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
