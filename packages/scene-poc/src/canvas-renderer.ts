import type { Page, Viewport } from './types.js';

const CPK_COLORS: Record<number, string> = {
  1: '#FFFFFF', // H
  6: '#909090', // C
  7: '#3050F8', // N
  8: '#FF0D0D', // O
  9: '#90E050', // F
  15: '#FF8000', // P
  16: '#FFFF30', // S
  17: '#1FF01F', // Cl
  35: '#A62929', // Br
};

const ELEMENT_LABELS: Record<number, string> = {
  1: 'H',
  6: 'C',
  7: 'N',
  8: 'O',
  9: 'F',
  15: 'P',
  16: 'S',
  17: 'Cl',
  35: 'Br',
};

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(
    private canvas: HTMLCanvasElement | OffscreenCanvas,
    width: number,
    height: number,
  ) {
    this.width = width;
    this.height = height;
    if ('width' in canvas) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx as CanvasRenderingContext2D;
  }

  render(page: Page, viewport: Viewport): void {
    const { ctx, width, height } = this;
    const { x: vx, y: vy, zoom } = viewport;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Transform: world → screen
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-vx, -vy);

    // Bonds
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5 / zoom;
    for (const bond of Object.values(page.bonds)) {
      const from = page.atoms[bond.fromAtomId];
      const to = page.atoms[bond.toAtomId];
      if (!from || !to) continue;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Atoms
    const atomRadius = 8 / zoom;
    const fontSize = Math.max(10, 12 / zoom);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const atom of Object.values(page.atoms)) {
      const color = CPK_COLORS[atom.element] ?? '#CCCCCC';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atomRadius, 0, Math.PI * 2);
      ctx.fill();

      // Label (skip carbon in skeletal view)
      if (atom.element !== 6) {
        ctx.fillStyle = '#FFF';
        ctx.fillText(ELEMENT_LABELS[atom.element] ?? '?', atom.x, atom.y);
      }
    }

    ctx.restore();
  }
}
