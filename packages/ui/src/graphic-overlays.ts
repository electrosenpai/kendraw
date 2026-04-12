/** Module-level store for CDXML graphic overlays (rectangles, lines). */

export interface GraphicOverlay {
  type: 'rectangle' | 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

let overlays: GraphicOverlay[] = [];
const listeners = new Set<() => void>();

export function setGraphicOverlays(g: GraphicOverlay[]): void {
  overlays = g;
  for (const l of listeners) l();
}

export function getGraphicOverlays(): GraphicOverlay[] {
  return overlays;
}

export function onGraphicOverlaysChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
