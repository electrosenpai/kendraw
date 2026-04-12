import RBush from 'rbush';
import type { AtomId, Page } from './types.js';

interface AtomBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: AtomId;
  cx: number;
  cy: number;
}

export class SpatialIndex {
  private tree = new RBush<AtomBBox>();

  rebuild(page: Page): void {
    this.tree.clear();
    const items: AtomBBox[] = [];
    for (const atom of Object.values(page.atoms)) {
      items.push({
        minX: atom.x - 0.5,
        minY: atom.y - 0.5,
        maxX: atom.x + 0.5,
        maxY: atom.y + 0.5,
        id: atom.id,
        cx: atom.x,
        cy: atom.y,
      });
    }
    this.tree.load(items);
  }

  hitTest(x: number, y: number, radius: number = 14): AtomId | null {
    const results = this.tree.search({
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    });
    if (results.length === 0) return null;

    // Return the closest atom to the click point
    let closest: AtomBBox | null = null;
    let closestDist = Infinity;
    for (const r of results) {
      const dx = r.cx - x;
      const dy = r.cy - y;
      const dist = dx * dx + dy * dy;
      if (dist < closestDist) {
        closestDist = dist;
        closest = r;
      }
    }
    return closest?.id ?? null;
  }

  searchRect(x1: number, y1: number, x2: number, y2: number): AtomId[] {
    const results = this.tree.search({
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    });
    return results.map((r) => r.id);
  }
}
