import RBush from 'rbush';
import type { Page } from './types.js';

interface AtomBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
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
      });
    }
    this.tree.load(items);
  }

  hitTest(x: number, y: number, radius: number = 0.5): string | null {
    const results = this.tree.search({
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    });
    return results.length > 0 ? (results[0]?.id ?? null) : null;
  }

  searchRect(x1: number, y1: number, x2: number, y2: number): string[] {
    const results = this.tree.search({
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    });
    return results.map((r) => r.id);
  }
}
