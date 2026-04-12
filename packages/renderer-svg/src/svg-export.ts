import type { Page, Atom, Bond } from '@kendraw/scene';
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

  // Atoms
  for (const atom of atoms) {
    parts.push(renderAtomSVG(atom));
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

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
