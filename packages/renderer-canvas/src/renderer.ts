import type { AtomId, Document, SceneDiff, Bond, Atom, Page } from '@kendraw/scene';
import {
  getColor,
  shouldShowLabel,
  buildAtomLabel,
  type LabelSegment,
  NEW_DOCUMENT,
  ptToPx,
} from '@kendraw/scene';

export interface GraphicOverlay {
  type: 'rectangle' | 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Renderer {
  attach(container: HTMLElement): void;
  detach(): void;
  render(doc: Document, diff?: SceneDiff): void;
  setSelectedAtoms(ids: Set<AtomId>): void;
  setSelectionRect(rect: { x1: number; y1: number; x2: number; y2: number } | null): void;
  setViewport(zoom: number, panX: number, panY: number): void;
  setValenceIssues(ids: Set<AtomId>): void;
  setGraphics(graphics: GraphicOverlay[]): void;
}

// Style settings derived from active preset (New Document default)
const S = {
  lineWidth: ptToPx(NEW_DOCUMENT.lineWidthPt),
  boldWidth: ptToPx(NEW_DOCUMENT.boldWidthPt),
  marginWidth: ptToPx(NEW_DOCUMENT.marginWidthPt),
  bondSpacingPx: NEW_DOCUMENT.bondSpacing * ptToPx(NEW_DOCUMENT.bondLengthPt),
  hashSpacing: ptToPx(NEW_DOCUMENT.hashSpacingPt),
  wedgeWide: ptToPx(1.5 * NEW_DOCUMENT.boldWidthPt),
  labelSize: ptToPx(NEW_DOCUMENT.labelSizePt),
  subScale: 0.75, // subscript/superscript scale factor (ref: Section 1.4)
  subShift: 0.33, // baseline shift as fraction of cap height
};

const ATOM_RADIUS = 10; // visual hit radius for selection (not rendering)

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
  private graphicOverlays: GraphicOverlay[] = [];
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
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.resizeObserver = new ResizeObserver(() => this.syncCanvasSize());
    this.resizeObserver.observe(container);
    this.syncCanvasSize();
  }

  detach(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.canvas && this.container) this.container.removeChild(this.canvas);
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

  setGraphics(graphics: GraphicOverlay[]): void {
    this.graphicOverlays = graphics;
    if (this.lastDoc) this.render(this.lastDoc);
  }

  render(doc: Document): void {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) return;
    this.lastDoc = doc;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    const page = doc.pages[doc.activePageIndex];
    if (!page) return;

    // Precompute which atoms have visible labels
    const labelVisible = new Map<AtomId, boolean>();
    const labelSegments = new Map<AtomId, LabelSegment[]>();
    for (const atom of Object.values(page.atoms)) {
      const show = shouldShowLabel(page, atom.id);
      labelVisible.set(atom.id, show);
      if (show) labelSegments.set(atom.id, buildAtomLabel(page, atom.id));
    }

    // 0. Graphic overlays (rectangles, lines from CDXML)
    for (const g of this.graphicOverlays) {
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = S.lineWidth * 0.8;
      if (g.type === 'rectangle') {
        const rx = Math.min(g.x1, g.x2);
        const ry = Math.min(g.y1, g.y2);
        const rw = Math.abs(g.x2 - g.x1);
        const rh = Math.abs(g.y2 - g.y1);
        const r = Math.min(6, rw * 0.1, rh * 0.1); // rounded corners
        ctx.beginPath();
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + rw - r, ry);
        ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r);
        ctx.lineTo(rx + rw, ry + rh - r);
        ctx.arcTo(rx + rw, ry + rh, rx + rw - r, ry + rh, r);
        ctx.lineTo(rx + r, ry + rh);
        ctx.arcTo(rx, ry + rh, rx, ry + rh - r, r);
        ctx.lineTo(rx, ry + r);
        ctx.arcTo(rx, ry, rx + r, ry, r);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(g.x1, g.y1);
        ctx.lineTo(g.x2, g.y2);
        ctx.stroke();
      }
    }

    // 1. Arrows (behind everything)
    for (const arrow of Object.values(page.arrows)) {
      this.drawArrow(ctx, arrow);
    }

    // 2. Bonds (with margin shortening near labels)
    for (const bond of Object.values(page.bonds)) {
      const from = page.atoms[bond.fromAtomId];
      const to = page.atoms[bond.toAtomId];
      if (from && to) {
        this.drawBond(
          ctx,
          bond,
          from,
          to,
          labelVisible.get(from.id) ?? false,
          labelVisible.get(to.id) ?? false,
          page,
        );
      }
    }

    // 3. Atoms
    for (const atom of Object.values(page.atoms)) {
      this.drawAtom(
        ctx,
        atom,
        page,
        labelVisible.get(atom.id) ?? false,
        labelSegments.get(atom.id),
      );
    }

    // 4. Annotations (free text: conditions, labels, numbering)
    for (const ann of Object.values(page.annotations)) {
      this.drawAnnotation(ctx, ann);
    }

    // 5. Selection rect
    if (this.selectionRect) {
      const { x1, y1, x2, y2 } = this.selectionRect;
      ctx.strokeStyle = 'rgba(77, 171, 247, 0.8)';
      ctx.lineWidth = 1 / this.zoom;
      ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = 'rgba(77, 171, 247, 0.1)';
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]);
    }
  }

  // ── Atom rendering ──────────────────────────────────────

  private drawAtom(
    ctx: CanvasRenderingContext2D,
    atom: Atom,
    page: Page,
    showLabel: boolean,
    segments: LabelSegment[] | undefined,
  ): void {
    const selected = this.selectedAtoms.has(atom.id);
    const valenceWarn = this.valenceIssues.has(atom.id);

    // Valence warning ring
    if (valenceWarn) {
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, ATOM_RADIUS + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd43b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Selection highlight
    if (selected) {
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, ATOM_RADIUS + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#4dabf7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (!showLabel || !segments || segments.length === 0) {
      // Invisible vertex — draw a tiny dot for non-selected atoms
      if (!selected) {
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#555';
        ctx.fill();
      }
      return;
    }

    // Draw label background (clear area behind text)
    const totalWidth = this.measureLabelWidth(ctx, segments);
    const halfW = totalWidth / 2 + 2;
    const halfH = S.labelSize / 2 + 2;
    ctx.fillStyle = '#0a0a0a'; // match canvas bg
    ctx.fillRect(atom.x - halfW, atom.y - halfH, halfW * 2, halfH * 2);

    // Render label segments (formula mode)
    this.renderLabelSegments(ctx, atom.x, atom.y, segments, atom.element);
  }

  private measureLabelWidth(ctx: CanvasRenderingContext2D, segments: LabelSegment[]): number {
    let w = 0;
    for (const seg of segments) {
      const size = seg.style === 'normal' ? S.labelSize : S.labelSize * S.subScale;
      ctx.font = `${size}px Arial, system-ui, sans-serif`;
      w += ctx.measureText(seg.text).width;
    }
    return w;
  }

  private renderLabelSegments(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    segments: LabelSegment[],
    element: number,
  ): void {
    const totalW = this.measureLabelWidth(ctx, segments);
    let x = cx - totalW / 2;
    const color = getColor(element);
    const textColor = this.isLightColor(color) ? color : '#e0e0e0';

    for (const seg of segments) {
      const isNormal = seg.style === 'normal';
      const size = isNormal ? S.labelSize : S.labelSize * S.subScale;
      ctx.font = `${size}px Arial, system-ui, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      let y = cy;
      if (seg.style === 'superscript') y -= S.labelSize * S.subShift;
      if (seg.style === 'subscript') y += S.labelSize * S.subShift;

      ctx.fillText(seg.text, x, y);
      x += ctx.measureText(seg.text).width;
    }
  }

  // ── Bond rendering (Section 2 of reference) ────────────

  private drawBond(
    ctx: CanvasRenderingContext2D,
    bond: Bond,
    from: Atom,
    to: Atom,
    fromHasLabel: boolean,
    toHasLabel: boolean,
    page: Page,
  ): void {
    let x1 = from.x;
    let y1 = from.y;
    let x2 = to.x;
    let y2 = to.y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.1) return;
    const ux = dx / len;
    const uy = dy / len;

    // Bond shortening near labels (MarginWidth, Section 2.4)
    if (fromHasLabel) {
      const gap = S.marginWidth + S.labelSize * 0.3;
      x1 += ux * gap;
      y1 += uy * gap;
    }
    if (toHasLabel) {
      const gap = S.marginWidth + S.labelSize * 0.3;
      x2 -= ux * gap;
      y2 -= uy * gap;
    }

    // Perpendicular for double/triple offsets
    const px = -uy;
    const py = ux;
    const offset = S.bondSpacingPx;

    ctx.strokeStyle = '#aaaaaa';
    ctx.fillStyle = '#aaaaaa';

    switch (bond.style) {
      case 'single':
        ctx.lineWidth = S.lineWidth;
        this.line(ctx, x1, y1, x2, y2);
        break;

      case 'double': {
        ctx.lineWidth = S.lineWidth;
        // Determine offset direction (toward ring center if in ring)
        const side = this.getDoubleBondSide(bond, from, to, page);
        if (side === 0) {
          // Center double bond
          this.line(
            ctx,
            x1 + px * offset * 0.5,
            y1 + py * offset * 0.5,
            x2 + px * offset * 0.5,
            y2 + py * offset * 0.5,
          );
          this.line(
            ctx,
            x1 - px * offset * 0.5,
            y1 - py * offset * 0.5,
            x2 - px * offset * 0.5,
            y2 - py * offset * 0.5,
          );
        } else {
          this.line(ctx, x1, y1, x2, y2);
          // Shorter second line (80% length, centered)
          const shrink = len * 0.1;
          const sx1 = x1 + ux * shrink + px * offset * side;
          const sy1 = y1 + uy * shrink + py * offset * side;
          const sx2 = x2 - ux * shrink + px * offset * side;
          const sy2 = y2 - uy * shrink + py * offset * side;
          this.line(ctx, sx1, sy1, sx2, sy2);
        }
        break;
      }

      case 'triple':
        ctx.lineWidth = S.lineWidth;
        this.line(ctx, x1, y1, x2, y2);
        this.line(ctx, x1 + px * offset, y1 + py * offset, x2 + px * offset, y2 + py * offset);
        this.line(ctx, x1 - px * offset, y1 - py * offset, x2 - px * offset, y2 - py * offset);
        break;

      case 'aromatic': {
        ctx.lineWidth = S.lineWidth;
        this.line(ctx, x1, y1, x2, y2);
        // Dashed second line (Kekulé-like aromatic indicator)
        ctx.setLineDash([3, 3]);
        const side2 = this.getDoubleBondSide(bond, from, to, page);
        const s = side2 || 1;
        const shrink2 = len * 0.1;
        this.line(
          ctx,
          x1 + ux * shrink2 + px * offset * s,
          y1 + uy * shrink2 + py * offset * s,
          x2 - ux * shrink2 + px * offset * s,
          y2 - uy * shrink2 + py * offset * s,
        );
        ctx.setLineDash([]);
        break;
      }

      // --- WEDGE: solid filled triangle, narrow at Begin atom ---
      case 'wedge': {
        const ww = S.wedgeWide;
        ctx.beginPath();
        ctx.moveTo(x1, y1); // narrow tip at stereocenter
        ctx.lineTo(x2 + px * ww, y2 + py * ww);
        ctx.lineTo(x2 - px * ww, y2 - py * ww);
        ctx.closePath();
        ctx.fill();
        break;
      }

      // --- WEDGE-END: solid filled triangle, narrow at End atom ---
      case 'wedge-end': {
        const wwe = S.wedgeWide;
        ctx.beginPath();
        ctx.moveTo(x2, y2); // narrow tip at end
        ctx.lineTo(x1 + px * wwe, y1 + py * wwe);
        ctx.lineTo(x1 - px * wwe, y1 - py * wwe);
        ctx.closePath();
        ctx.fill();
        break;
      }

      // --- HASHED WEDGE: triangle envelope filled with parallel hash lines ---
      case 'hashed-wedge': {
        const hww = S.wedgeWide;
        const numH = Math.max(3, Math.round(len / S.hashSpacing));
        ctx.lineWidth = S.lineWidth;
        for (let i = 0; i < numH; i++) {
          const t = (i + 0.5) / numH;
          const mx = x1 + (x2 - x1) * t;
          const my = y1 + (y2 - y1) * t;
          const hw = hww * t; // widens from narrow to wide
          ctx.beginPath();
          ctx.moveTo(mx + px * hw, my + py * hw);
          ctx.lineTo(mx - px * hw, my - py * hw);
          ctx.stroke();
        }
        break;
      }

      // --- HASHED WEDGE END: same but narrow at End ---
      case 'hashed-wedge-end': {
        const hwwe = S.wedgeWide;
        const numHE = Math.max(3, Math.round(len / S.hashSpacing));
        ctx.lineWidth = S.lineWidth;
        for (let i = 0; i < numHE; i++) {
          const t = (i + 0.5) / numHE;
          const mx = x2 + (x1 - x2) * t; // reversed direction
          const my = y2 + (y1 - y2) * t;
          const hw = hwwe * t;
          ctx.beginPath();
          ctx.moveTo(mx + px * hw, my + py * hw);
          ctx.lineTo(mx - px * hw, my - py * hw);
          ctx.stroke();
        }
        break;
      }

      // --- HOLLOW WEDGE: triangle outline only, narrow at Begin ---
      case 'hollow-wedge': {
        const hwr = S.wedgeWide;
        ctx.lineWidth = S.lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 + px * hwr, y2 + py * hwr);
        ctx.lineTo(x2 - px * hwr, y2 - py * hwr);
        ctx.closePath();
        ctx.stroke(); // outline only
        break;
      }

      // --- HOLLOW WEDGE END: outline, narrow at End ---
      case 'hollow-wedge-end': {
        const hwre = S.wedgeWide;
        ctx.lineWidth = S.lineWidth;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1 + px * hwre, y1 + py * hwre);
        ctx.lineTo(x1 - px * hwre, y1 - py * hwre);
        ctx.closePath();
        ctx.stroke();
        break;
      }

      // --- DASH: evenly dashed line (NOT hashed wedge) ---
      case 'dash':
        ctx.lineWidth = S.lineWidth;
        ctx.setLineDash([4, 3]);
        this.line(ctx, x1, y1, x2, y2);
        ctx.setLineDash([]);
        break;

      // --- BOLD: thick line at boldWidth ---
      case 'bold':
        ctx.lineWidth = S.boldWidth;
        this.line(ctx, x1, y1, x2, y2);
        break;

      case 'wavy': {
        // Sinusoidal bond — ~5 complete waves, clearly visible amplitude
        const bdLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const nWaves = Math.max(3, Math.round(bdLen / 8));
        // Amplitude must be clearly visible: at least 3px, proportional to bond
        const wAmp = Math.max(3, bdLen * 0.08);
        ctx.lineWidth = S.lineWidth * 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const nSteps = Math.max(30, nWaves * 10);
        for (let i = 1; i <= nSteps; i++) {
          const t = i / nSteps;
          const bx = x1 + (x2 - x1) * t;
          const by = y1 + (y2 - y1) * t;
          const wave = Math.sin(t * nWaves * 2 * Math.PI) * wAmp;
          ctx.lineTo(bx + px * wave, by + py * wave);
        }
        ctx.stroke();
        break;
      }

      case 'dative':
        ctx.lineWidth = S.lineWidth;
        ctx.setLineDash([6, 3]);
        this.line(ctx, x1, y1, x2, y2);
        ctx.setLineDash([]);
        break;

      default:
        ctx.lineWidth = S.lineWidth;
        this.line(ctx, x1, y1, x2, y2);
    }
  }

  /** Determine which side of a bond to place the double-bond offset.
   *  Returns +1, -1, or 0 (center). For endocyclic bonds, offset toward ring center. */
  private getDoubleBondSide(bond: Bond, from: Atom, to: Atom, page: Page): number {
    // Find atoms bonded to both from and to (ring detection heuristic)
    const fromNeighbors = new Set<AtomId>();
    const toNeighbors = new Set<AtomId>();
    for (const b of Object.values(page.bonds)) {
      if (b.fromAtomId === from.id && b.toAtomId !== to.id) fromNeighbors.add(b.toAtomId);
      if (b.toAtomId === from.id && b.fromAtomId !== to.id) fromNeighbors.add(b.fromAtomId);
      if (b.fromAtomId === to.id && b.toAtomId !== from.id) toNeighbors.add(b.toAtomId);
      if (b.toAtomId === to.id && b.fromAtomId !== from.id) toNeighbors.add(b.fromAtomId);
    }

    // Common neighbor = likely in a ring → offset toward that neighbor
    for (const nId of fromNeighbors) {
      if (toNeighbors.has(nId)) {
        const n = page.atoms[nId];
        if (!n) continue;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const px = -dy;
        const py = dx;
        const dot = (n.x - mx) * px + (n.y - my) * py;
        return dot > 0 ? 1 : -1;
      }
    }

    return 1; // default: right side
  }

  private line(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // ── Arrow rendering ─────────────────────────────────────

  private drawAnnotation(
    ctx: CanvasRenderingContext2D,
    ann: { x: number; y: number; richText: Array<{ text: string; style?: string }> },
  ): void {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let x = ann.x;
    let y = ann.y;
    const lineHeight = S.labelSize * 1.4;

    for (const seg of ann.richText) {
      // Handle newlines within text
      const parts = seg.text.split('\n');
      for (let pi = 0; pi < parts.length; pi++) {
        if (pi > 0) {
          // Newline: reset x, advance y
          x = ann.x;
          y += lineHeight;
        }
        const text = parts[pi] ?? '';
        if (!text) continue;

        const isSubscript = seg.style === 'subscript';
        const isSuperscript = seg.style === 'superscript';
        const size = isSubscript || isSuperscript ? S.labelSize * 0.75 : S.labelSize;
        ctx.font = `${size}px Arial, system-ui, sans-serif`;
        ctx.fillStyle = '#e0e0e0';
        let drawY = y;
        if (isSubscript) drawY += S.labelSize * 0.3;
        if (isSuperscript) drawY -= S.labelSize * 0.3;
        ctx.fillText(text, x, drawY);
        x += ctx.measureText(text).width;
      }
    }
  }

  private drawArrow(
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
    ctx.lineWidth = isCurly ? 1.5 : 2;
    ctx.stroke();

    const adx = end.x - c2.x;
    const ady = end.y - c2.y;
    const alen = Math.sqrt(adx * adx + ady * ady);
    if (alen > 0) {
      const aux = adx / alen;
      const auy = ady / alen;
      const hl = 8;
      const hw = isCurly ? 3 : 5;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - aux * hl + auy * hw, end.y - auy * hl - aux * hw);
      ctx.lineTo(end.x - aux * hl - auy * hw, end.y - auy * hl + aux * hw);
      ctx.closePath();
      ctx.fillStyle = isCurly ? '#e06633' : '#cccccc';
      ctx.fill();
    }
  }

  // ── Utility ─────────────────────────────────────────────

  private syncCanvasSize(): void {
    const { canvas, container } = this;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    if (this.lastDoc) this.render(this.lastDoc);
  }

  private isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
}
