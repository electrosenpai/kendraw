import type { Document, SceneDiff } from '@kendraw/scene';

export interface Renderer {
  attach(container: HTMLElement): void;
  detach(): void;
  render(doc: Document, diff?: SceneDiff): void;
}

// CPK-inspired color palette keyed by atomic number
const CPK_COLORS: Record<number, string> = {
  1: '#ffffff', // H — white
  6: '#333333', // C — dark gray (not pure black, better on dark bg)
  7: '#3050f8', // N — blue
  8: '#ff0000', // O — red
  9: '#90e050', // F — green
  15: '#ff8000', // P — orange
  16: '#ffff30', // S — yellow
  17: '#1ff01f', // Cl — green
  35: '#a62929', // Br — dark red
  53: '#940094', // I — purple
};

const DEFAULT_COLOR = '#808080';

// Element symbols keyed by atomic number (common subset)
const ELEMENT_SYMBOLS: Record<number, string> = {
  1: 'H',
  2: 'He',
  3: 'Li',
  4: 'Be',
  5: 'B',
  6: 'C',
  7: 'N',
  8: 'O',
  9: 'F',
  10: 'Ne',
  11: 'Na',
  12: 'Mg',
  13: 'Al',
  14: 'Si',
  15: 'P',
  16: 'S',
  17: 'Cl',
  18: 'Ar',
  19: 'K',
  20: 'Ca',
  26: 'Fe',
  29: 'Cu',
  30: 'Zn',
  35: 'Br',
  53: 'I',
};

const ATOM_RADIUS = 14;
const FONT_SIZE = 12;

export class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

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

  render(doc: Document): void {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Get active page
    const page = doc.pages[doc.activePageIndex];
    if (!page) return;

    // Render all atoms
    for (const atom of Object.values(page.atoms)) {
      const color = CPK_COLORS[atom.element] ?? DEFAULT_COLOR;
      const label = atom.label ?? ELEMENT_SYMBOLS[atom.element] ?? '?';

      // Filled circle
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, ATOM_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label text
      ctx.font = `${FONT_SIZE}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Use white text on dark backgrounds, black on light
      ctx.fillStyle = this.isLightColor(color) ? '#000000' : '#ffffff';
      ctx.fillText(label, atom.x, atom.y);
    }
  }

  private syncCanvasSize(): void {
    const { canvas, container } = this;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }

  private isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Relative luminance approximation
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
}
