import type { AtomId, Document, SceneDiff, Bond, Atom, Page } from '@kendraw/scene';
import {
  getColor,
  shouldShowLabel,
  buildAtomLabel,
  getLabelJustification,
  type LabelSegment,
  type LabelDisplayOptions,
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

/** Document-level rendering metrics (from CDXML or style preset). */
export interface RenderSettings {
  lineWidth: number;
  boldWidth: number;
  marginWidth: number;
  bondSpacingPx: number;
  hashSpacing: number;
  wedgeWide: number;
  labelSize: number;
  subScale: number;
  subShift: number;
  labelDisplayOptions: LabelDisplayOptions;
}

export interface Renderer {
  attach(container: HTMLElement): void;
  detach(): void;
  render(doc: Document, diff?: SceneDiff): void;
  setSelectedAtoms(ids: Set<AtomId>): void;
  setHighlightedAtoms(ids: Set<AtomId>): void;
  setSelectionRect(rect: { x1: number; y1: number; x2: number; y2: number } | null): void;
  setLassoPath(points: Array<{ x: number; y: number }> | null): void;
  setViewport(zoom: number, panX: number, panY: number): void;
  setValenceIssues(ids: Set<AtomId>): void;
  setGraphics(graphics: GraphicOverlay[]): void;
  setDocumentStyle(settings: Partial<RenderSettings>): void;
}

/** Build default RenderSettings from the NEW_DOCUMENT preset. */
function defaultRenderSettings(): RenderSettings {
  return {
    lineWidth: ptToPx(NEW_DOCUMENT.lineWidthPt),
    boldWidth: ptToPx(NEW_DOCUMENT.boldWidthPt),
    marginWidth: ptToPx(NEW_DOCUMENT.marginWidthPt),
    bondSpacingPx: NEW_DOCUMENT.bondSpacing * ptToPx(NEW_DOCUMENT.bondLengthPt),
    hashSpacing: ptToPx(NEW_DOCUMENT.hashSpacingPt),
    wedgeWide: ptToPx(1.5 * NEW_DOCUMENT.boldWidthPt),
    labelSize: ptToPx(NEW_DOCUMENT.labelSizePt),
    subScale: 0.75, // subscript/superscript scale factor (ref: Section 1.4)
    subShift: 0.33, // baseline shift as fraction of cap height
    labelDisplayOptions: {},
  };
}

const ATOM_RADIUS = 10; // visual hit radius for selection (not rendering)

export type CanvasTheme = 'dark' | 'light';

export interface ThemePalette {
  /** Canvas background; the label box fill must match this to "erase" bond lines. */
  background: string;
  /** Primary text / stroke color for atoms with no element-specific palette. */
  text: string;
}

const DARK_PALETTE: ThemePalette = { background: '#0a0a0a', text: '#e0e0e0' };
const LIGHT_PALETTE: ThemePalette = { background: '#f5f5f5', text: '#1a1a1a' };

export class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private selectedAtoms = new Set<AtomId>();
  private highlightedAtoms = new Set<AtomId>();
  private valenceIssues = new Set<AtomId>();
  private selectionRect: { x1: number; y1: number; x2: number; y2: number } | null = null;
  private lassoPath: Array<{ x: number; y: number }> | null = null;
  private lastDoc: Document | null = null;
  private zoom = 1;
  private graphicOverlays: GraphicOverlay[] = [];
  private panX = 0;
  private panY = 0;
  private S: RenderSettings = defaultRenderSettings();
  private theme: CanvasTheme = 'dark';
  private palette: ThemePalette = DARK_PALETTE;

  /** Switch the canvas palette between dark and light presets. */
  setTheme(theme: CanvasTheme): void {
    this.theme = theme;
    this.palette = theme === 'light' ? LIGHT_PALETTE : DARK_PALETTE;
    if (this.lastDoc) this.render(this.lastDoc);
  }

  /** Read-only accessor used by tests and overlays. */
  getTheme(): CanvasTheme {
    return this.theme;
  }

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
  setHighlightedAtoms(ids: Set<AtomId>): void {
    this.highlightedAtoms = ids;
    if (this.lastDoc) this.render(this.lastDoc);
  }
  setSelectionRect(rect: { x1: number; y1: number; x2: number; y2: number } | null): void {
    this.selectionRect = rect;
    if (this.lastDoc) this.render(this.lastDoc);
  }
  setLassoPath(points: Array<{ x: number; y: number }> | null): void {
    this.lassoPath = points && points.length > 0 ? points : null;
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

  setDocumentStyle(settings: Partial<RenderSettings>): void {
    this.S = { ...this.S, ...settings };
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

    const S = this.S;

    // Precompute which atoms have visible labels and their justification
    const labelVisible = new Map<AtomId, boolean>();
    const labelSegments = new Map<AtomId, LabelSegment[]>();
    const labelJust = new Map<AtomId, 'left' | 'right'>();
    for (const atom of Object.values(page.atoms)) {
      const show = shouldShowLabel(page, atom.id, S.labelDisplayOptions);
      labelVisible.set(atom.id, show);
      if (show) {
        labelSegments.set(atom.id, buildAtomLabel(page, atom.id));
        labelJust.set(atom.id, getLabelJustification(page, atom.id));
      }
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
        labelJust.get(atom.id),
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

    // 6. Lasso path
    if (this.lassoPath && this.lassoPath.length >= 2) {
      const first = this.lassoPath[0];
      if (first) {
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < this.lassoPath.length; i++) {
          const p = this.lassoPath[i];
          if (p) ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(77, 171, 247, 0.9)';
        ctx.lineWidth = 1 / this.zoom;
        ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);
        ctx.stroke();
        ctx.fillStyle = 'rgba(77, 171, 247, 0.1)';
        ctx.fill();
        ctx.setLineDash([]);
      }
    }
  }

  // ── Atom rendering ──────────────────────────────────────

  private drawAtom(
    ctx: CanvasRenderingContext2D,
    atom: Atom,
    page: Page,
    showLabel: boolean,
    segments: LabelSegment[] | undefined,
    justification?: 'left' | 'right',
  ): void {
    const selected = this.selectedAtoms.has(atom.id);
    const highlighted = this.highlightedAtoms.has(atom.id);
    const valenceWarn = this.valenceIssues.has(atom.id);
    const S = this.S;

    // NMR highlight halo (gold)
    if (highlighted) {
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, ATOM_RADIUS + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 193, 7, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#ffc107';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

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

    // Draw label background (clear area behind text), accounting for
    // justification offset so the element symbol sits at atom.x.
    const totalWidth = this.measureLabelWidth(ctx, segments);
    let bgX: number;
    if (justification === 'right') {
      const last = this.measureLastElementOffset(ctx, segments);
      bgX = atom.x - last.offset - last.width / 2;
    } else if (justification === 'left') {
      const first = this.measureElementWidth(ctx, segments);
      bgX = atom.x - first.offset - first.width / 2;
    } else {
      bgX = atom.x - totalWidth / 2;
    }
    const pad = 2;
    const halfH = S.labelSize / 2 + pad;
    ctx.fillStyle = this.palette.background; // match canvas bg (themed)
    ctx.fillRect(bgX - pad, atom.y - halfH, totalWidth + pad * 2, halfH * 2);

    // Render label segments (formula mode), anchored so the element symbol
    // sits at the atom coordinate (bond connection point).
    this.renderLabelSegments(ctx, atom.x, atom.y, segments, atom.element, justification);

    // Lone pair dots: render as paired dots around the atom
    if (atom.lonePairs > 0) {
      const lpRadius = ATOM_RADIUS + 8;
      const dotSize = 2;
      ctx.fillStyle = '#888';
      // Get bond angles to avoid placing dots where bonds exist
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
      // Place lone pairs at angles avoiding bonds
      const candidates = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
      const available = candidates.filter((angle) => {
        return bondAngles.every((ba) => {
          let diff = Math.abs(angle - ba);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          return diff > Math.PI / 4;
        });
      });
      const slots = available.length > 0 ? available : candidates;
      for (let lp = 0; lp < Math.min(atom.lonePairs, slots.length); lp++) {
        const angle = slots[lp] ?? 0;
        const cx = atom.x + lpRadius * Math.cos(angle);
        const cy = atom.y + lpRadius * Math.sin(angle);
        const perpX = -Math.sin(angle) * 3;
        const perpY = Math.cos(angle) * 3;
        // Two dots side by side
        ctx.beginPath();
        ctx.arc(cx + perpX, cy + perpY, dotSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - perpX, cy - perpY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private measureLabelWidth(ctx: CanvasRenderingContext2D, segments: LabelSegment[]): number {
    const S = this.S;
    let w = 0;
    for (const seg of segments) {
      const size = seg.style === 'normal' ? S.labelSize : S.labelSize * S.subScale;
      ctx.font = `${size}px Arial, system-ui, sans-serif`;
      w += ctx.measureText(seg.text).width;
    }
    return w;
  }

  /** Measure the width of the first element symbol segment in the label. */
  private measureElementWidth(
    ctx: CanvasRenderingContext2D,
    segments: LabelSegment[],
  ): { offset: number; width: number } {
    const S = this.S;
    // Find the first normal-style segment that is a letter (the element symbol).
    // In reversed labels like "HO", the element is the last normal letter.
    // But since buildAtomLabel already reversed, the element is where it should be
    // relative to justification. For left-justified: element is the first letter.
    // For right-justified: element is the last letter (on the right side).
    let offset = 0;
    for (const seg of segments) {
      const size = seg.style === 'normal' ? S.labelSize : S.labelSize * S.subScale;
      ctx.font = `${size}px Arial, system-ui, sans-serif`;
      const w = ctx.measureText(seg.text).width;
      if (seg.style === 'normal' && /[A-Z]/.test(seg.text)) {
        return { offset, width: w };
      }
      offset += w;
    }
    return { offset: 0, width: 0 };
  }

  private renderLabelSegments(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    segments: LabelSegment[],
    element: number,
    justification?: 'left' | 'right',
  ): void {
    const S = this.S;
    const totalW = this.measureLabelWidth(ctx, segments);
    let x: number;

    if (justification === 'right') {
      // Right-justified: element symbol is on the right side of the label.
      // Find the LAST uppercase letter segment and center it at cx.
      const lastElem = this.measureLastElementOffset(ctx, segments);
      x = cx - lastElem.offset - lastElem.width / 2;
    } else if (justification === 'left') {
      // Left-justified: element symbol is on the left side (first letter).
      const firstElem = this.measureElementWidth(ctx, segments);
      x = cx - firstElem.offset - firstElem.width / 2;
    } else {
      // Default center
      x = cx - totalW / 2;
    }

    const color = getColor(element);
    // Element color must contrast with the current background:
    // in dark mode we keep light palette entries; in light mode we keep
    // dark ones. Anything that fails the contrast check falls back to the
    // themed text color.
    const contrastOk =
      this.theme === 'light' ? !this.isLightColor(color) : this.isLightColor(color);
    const textColor = contrastOk ? color : this.palette.text;

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

  /** Find the offset and width of the last uppercase letter segment (element symbol on right). */
  private measureLastElementOffset(
    ctx: CanvasRenderingContext2D,
    segments: LabelSegment[],
  ): { offset: number; width: number } {
    const S = this.S;
    let offset = 0;
    let lastOffset = 0;
    let lastWidth = 0;
    for (const seg of segments) {
      const size = seg.style === 'normal' ? S.labelSize : S.labelSize * S.subScale;
      ctx.font = `${size}px Arial, system-ui, sans-serif`;
      const w = ctx.measureText(seg.text).width;
      if (seg.style === 'normal' && /[A-Z]/.test(seg.text)) {
        lastOffset = offset;
        lastWidth = w;
      }
      offset += w;
    }
    return { offset: lastOffset, width: lastWidth };
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
    const S = this.S;
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
        // Use explicit DoublePosition if available, otherwise detect from ring
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
        // Render like a double bond (solid inner line) — standard Kekulé style
        ctx.lineWidth = S.lineWidth;
        const side2 = this.getDoubleBondSide(bond, from, to, page);
        if (side2 === 0) {
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
          const s = side2 || 1;
          this.line(ctx, x1, y1, x2, y2);
          const shrink2 = len * 0.1;
          this.line(
            ctx,
            x1 + ux * shrink2 + px * offset * s,
            y1 + uy * shrink2 + py * offset * s,
            x2 - ux * shrink2 + px * offset * s,
            y2 - uy * shrink2 + py * offset * s,
          );
        }
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
   *  Returns +1, -1, or 0 (center).
   *  Priority: explicit DoublePosition > ring center detection > default right. */
  private getDoubleBondSide(bond: Bond, from: Atom, to: Atom, page: Page): number {
    // 1. Use explicit DoublePosition from CDXML if available
    if (bond.doublePosition === 'center') return 0;
    if (bond.doublePosition === 'left') return -1;
    if (bond.doublePosition === 'right') return 1;

    // 2. Ring detection: find ALL common neighbors and average their positions
    const fromNeighbors = new Set<AtomId>();
    const toNeighbors = new Set<AtomId>();
    for (const b of Object.values(page.bonds)) {
      if (b.fromAtomId === from.id && b.toAtomId !== to.id) fromNeighbors.add(b.toAtomId);
      if (b.toAtomId === from.id && b.fromAtomId !== to.id) fromNeighbors.add(b.fromAtomId);
      if (b.fromAtomId === to.id && b.toAtomId !== from.id) toNeighbors.add(b.toAtomId);
      if (b.toAtomId === to.id && b.fromAtomId !== from.id) toNeighbors.add(b.fromAtomId);
    }

    // Average position of all common neighbors (handles larger rings better)
    let sumDot = 0;
    let commonCount = 0;
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const bdx = to.x - from.x;
    const bdy = to.y - from.y;
    const perpX = -bdy;
    const perpY = bdx;

    for (const nId of fromNeighbors) {
      if (toNeighbors.has(nId)) {
        const n = page.atoms[nId];
        if (!n) continue;
        sumDot += (n.x - mx) * perpX + (n.y - my) * perpY;
        commonCount++;
      }
    }

    if (commonCount > 0) {
      return sumDot > 0 ? 1 : -1;
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
    ann: {
      x: number;
      y: number;
      richText: Array<{ text: string; style?: string }>;
      fontSize?: number;
      bold?: boolean;
      italic?: boolean;
      color?: string;
    },
  ): void {
    const baseFontSize = ann.fontSize ?? this.S.labelSize;
    const weight = ann.bold ? 'bold' : 'normal';
    const style = ann.italic ? 'italic' : 'normal';
    const fillColor = ann.color ?? this.palette.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let x = ann.x;
    let y = ann.y;
    const lineHeight = baseFontSize * 1.4;

    for (const seg of ann.richText) {
      const parts = seg.text.split('\n');
      for (let pi = 0; pi < parts.length; pi++) {
        if (pi > 0) {
          x = ann.x;
          y += lineHeight;
        }
        const text = parts[pi] ?? '';
        if (!text) continue;

        const isSubscript = seg.style === 'subscript';
        const isSuperscript = seg.style === 'superscript';
        const size = isSubscript || isSuperscript ? baseFontSize * 0.75 : baseFontSize;
        ctx.font = `${style} ${weight} ${size}px Arial, system-ui, sans-serif`;
        ctx.fillStyle = fillColor;
        let drawY = y;
        if (isSubscript) drawY += baseFontSize * 0.3;
        if (isSuperscript) drawY -= baseFontSize * 0.3;
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
      arrowheadHead?: 'full' | 'half' | 'none';
      arrowheadTail?: 'full' | 'half' | 'none';
    },
  ): void {
    const { start, c1, c2, end } = arrow.geometry;
    const isCurly = arrow.type === 'curly-pair' || arrow.type === 'curly-radical';
    const isRetro = arrow.type === 'retro';
    const color = isCurly ? '#e06633' : this.palette.text;

    // Default arrowhead config: curly arrows always have head, reaction arrows use parsed config
    const headType = arrow.arrowheadHead ?? (isCurly ? 'full' : 'full');
    const tailType = arrow.arrowheadTail ?? 'none';

    // Draw the shaft (Bézier curve). Retro = double parallel line (open arrow).
    ctx.strokeStyle = color;
    ctx.lineWidth = isCurly ? 1.5 : 1.5;
    if (isRetro) {
      const adx = end.x - start.x;
      const ady = end.y - start.y;
      const alen = Math.sqrt(adx * adx + ady * ady) || 1;
      const nx = -ady / alen;
      const ny = adx / alen;
      const gap = 3;
      for (const s of [gap, -gap]) {
        ctx.beginPath();
        ctx.moveTo(start.x + nx * s, start.y + ny * s);
        ctx.bezierCurveTo(
          c1.x + nx * s,
          c1.y + ny * s,
          c2.x + nx * s,
          c2.y + ny * s,
          end.x + nx * s,
          end.y + ny * s,
        );
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
      ctx.stroke();
    }

    const hl = isCurly ? 6 : 10; // arrowhead length
    const hw = isCurly ? 2.5 : 4; // arrowhead half-width

    // Draw arrowhead at head (end) — direction from c2 to end
    if (headType !== 'none') {
      const adx = end.x - c2.x;
      const ady = end.y - c2.y;
      const alen = Math.sqrt(adx * adx + ady * ady);
      if (alen > 0) {
        const ux = adx / alen;
        const uy = ady / alen;
        this.drawArrowhead(ctx, end.x, end.y, ux, uy, hl, hw, headType, color);
      }
    }

    // Draw arrowhead at tail (start) — direction from c1 to start
    if (tailType !== 'none') {
      const adx = start.x - c1.x;
      const ady = start.y - c1.y;
      const alen = Math.sqrt(adx * adx + ady * ady);
      if (alen > 0) {
        const ux = adx / alen;
        const uy = ady / alen;
        this.drawArrowhead(ctx, start.x, start.y, ux, uy, hl, hw, tailType, color);
      }
    }
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    tipX: number,
    tipY: number,
    ux: number,
    uy: number,
    length: number,
    halfWidth: number,
    headType: 'full' | 'half',
    color: string,
  ): void {
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - ux * length + uy * halfWidth, tipY - uy * length - ux * halfWidth);
    if (headType === 'full') {
      ctx.lineTo(tipX - ux * length - uy * halfWidth, tipY - uy * length + ux * halfWidth);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
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
