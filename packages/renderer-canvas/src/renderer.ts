import type { AtomId, Document, SceneDiff, Bond, Atom } from '@kendraw/scene';
import { getColor, getSymbol } from '@kendraw/scene';

export interface Renderer {
  attach(container: HTMLElement): void;
  detach(): void;
  render(doc: Document, diff?: SceneDiff): void;
  setSelectedAtoms(ids: Set<AtomId>): void;
  setSelectionRect(rect: { x1: number; y1: number; x2: number; y2: number } | null): void;
  setViewport(zoom: number, panX: number, panY: number): void;
  setValenceIssues(ids: Set<AtomId>): void;
}

const ATOM_RADIUS = 14;
const FONT_SIZE = 12;

export class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private selectedAtoms = new Set<AtomId>();
  private valenceIssues = new Set<AtomId>();
  private selectionRect: { x1: number; y1: number; x2: number; y2: number } | null = null;
  private lastDoc: Document | null = null;
  private zoom = 1;
  private panX = 0;
  private panY = 0;

  attach(container: HTMLElement): void {
    this.container = container;

    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.resizeObserver = new ResizeObserver(() => {
      this.syncCanvasSize();
    });
    this.resizeObserver.observe(container);
    this.syncCanvasSize();
  }

  detach(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.canvas && this.container) {
      this.container.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.container = null;
  }

  setSelectedAtoms(ids: Set<AtomId>): void {
    this.selectedAtoms = ids;
    if (this.lastDoc) this.render(this.lastDoc);
  }

  setSelectionRect(rect: { x1: number; y1: number; x2: number; y2: number } | null): void {
    this.selectionRect = rect;
    if (this.lastDoc) this.render(this.lastDoc);
  }

  setViewport(zoom: number, panX: number, panY: number): void {
    this.zoom = zoom;
    this.panX = panX;
    this.panY = panY;
    if (this.lastDoc) this.render(this.lastDoc);
  }

  setValenceIssues(ids: Set<AtomId>): void {
    this.valenceIssues = ids;
    if (this.lastDoc) this.render(this.lastDoc);
  }

  render(doc: Document): void {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) return;
    this.lastDoc = doc;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Reset transform and clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Apply zoom/pan
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Get active page
    const page = doc.pages[doc.activePageIndex];
    if (!page) return;

    // Render arrows (behind everything)
    for (const arrow of Object.values(page.arrows)) {
      this.renderArrow(ctx, arrow);
    }

    // Render bonds
    for (const bond of Object.values(page.bonds)) {
      const fromAtom = page.atoms[bond.fromAtomId];
      const toAtom = page.atoms[bond.toAtomId];
      if (fromAtom && toAtom) {
        this.renderBond(ctx, bond, fromAtom, toAtom);
      }
    }

    // Render all atoms
    for (const atom of Object.values(page.atoms)) {
      const color = getColor(atom.element);
      const label = atom.label ?? getSymbol(atom.element);
      const selected = this.selectedAtoms.has(atom.id);

      // Valence issue highlight
      if (this.valenceIssues.has(atom.id)) {
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, ATOM_RADIUS + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd43b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Selection highlight ring
      if (selected) {
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, ATOM_RADIUS + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#4dabf7';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Filled circle
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, ATOM_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label text
      ctx.font = `${FONT_SIZE}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.isLightColor(color) ? '#000000' : '#ffffff';
      ctx.fillText(label, atom.x, atom.y);

      // Charge indicator
      if (atom.charge !== 0) {
        const chargeStr =
          atom.charge > 0
            ? atom.charge === 1
              ? '+'
              : `${atom.charge}+`
            : atom.charge === -1
              ? '\u2013'
              : `${Math.abs(atom.charge)}\u2013`;
        ctx.font = `${FONT_SIZE - 3}px system-ui, sans-serif`;
        ctx.fillStyle = atom.charge > 0 ? '#ff6b6b' : '#4dabf7';
        ctx.textAlign = 'left';
        ctx.fillText(chargeStr, atom.x + ATOM_RADIUS - 2, atom.y - ATOM_RADIUS + 4);
      }
    }

    // Draw selection rectangle (in world space, same transform as atoms/bonds)
    if (this.selectionRect) {
      const { x1, y1, x2, y2 } = this.selectionRect;
      ctx.strokeStyle = 'rgba(77, 171, 247, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = 'rgba(77, 171, 247, 0.1)';
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]);
    }
  }

  private renderArrow(
    ctx: CanvasRenderingContext2D,
    arrow: {
      type: string;
      geometry: {
        start: { x: number; y: number };
        c1: { x: number; y: number };
        c2: { x: number; y: number };
        end: { x: number; y: number };
      };
    },
  ): void {
    const { start, c1, c2, end } = arrow.geometry;
    const isCurly = arrow.type === 'curly-pair' || arrow.type === 'curly-radical';

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
    ctx.strokeStyle = isCurly ? '#e06633' : '#cccccc';
    ctx.lineWidth = isCurly ? 2 : 2.5;
    ctx.stroke();

    // Arrowhead
    const dx = end.x - c2.x;
    const dy = end.y - c2.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const ux = dx / len;
      const uy = dy / len;
      const headLen = 10;
      const headW = isCurly ? 4 : 6;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - ux * headLen + uy * headW, end.y - uy * headLen - ux * headW);
      ctx.lineTo(end.x - ux * headLen - uy * headW, end.y - uy * headLen + ux * headW);
      ctx.closePath();
      ctx.fillStyle = isCurly ? '#e06633' : '#cccccc';
      ctx.fill();

      // Half arrowhead for radical (single-headed)
      if (arrow.type === 'curly-radical') {
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - ux * headLen + uy * headW, end.y - uy * headLen - ux * headW);
        ctx.lineTo(end.x - ux * headLen * 0.6, end.y - uy * headLen * 0.6);
        ctx.closePath();
        ctx.fillStyle = '#e06633';
        ctx.fill();
      }
    }
  }

  private renderBond(ctx: CanvasRenderingContext2D, bond: Bond, from: Atom, to: Atom): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    // Perpendicular offset for double/triple bonds
    const px = (-dy / len) * 3;
    const py = (dx / len) * 3;

    ctx.strokeStyle = '#888888';
    ctx.lineWidth = bond.style === 'bold' ? 3 : 1.5;

    if (bond.style === 'wedge') {
      // Filled wedge (stereo)
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x + px * 2, to.y + py * 2);
      ctx.lineTo(to.x - px * 2, to.y - py * 2);
      ctx.closePath();
      ctx.fillStyle = '#888888';
      ctx.fill();
      return;
    }

    if (bond.style === 'dash' || bond.style === 'wavy') {
      ctx.setLineDash(bond.style === 'dash' ? [4, 3] : [2, 2]);
    }

    switch (bond.order) {
      case 1:
      case 1.5:
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        if (bond.order === 1.5) {
          // Dashed inner line for aromatic
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(from.x + px, from.y + py);
          ctx.lineTo(to.x + px, to.y + py);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      case 2:
        ctx.beginPath();
        ctx.moveTo(from.x + px, from.y + py);
        ctx.lineTo(to.x + px, to.y + py);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(from.x - px, from.y - py);
        ctx.lineTo(to.x - px, to.y - py);
        ctx.stroke();
        break;
      case 3:
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(from.x + px * 1.5, from.y + py * 1.5);
        ctx.lineTo(to.x + px * 1.5, to.y + py * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(from.x - px * 1.5, from.y - py * 1.5);
        ctx.lineTo(to.x - px * 1.5, to.y - py * 1.5);
        ctx.stroke();
        break;
    }

    ctx.setLineDash([]);
  }

  private syncCanvasSize(): void {
    const { canvas, container } = this;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Re-render to apply correct transform
    if (this.lastDoc) this.render(this.lastDoc);
  }

  private isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Relative luminance approximation
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
}
