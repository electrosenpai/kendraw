// Wave-7 HF-4 — compute a viewport that fits all atoms of a Page into
// the given canvas dimensions with a pixel margin, clamped to a zoom max
// so a single atom doesn't blow up to absurd scale.

import type { Page } from '@kendraw/scene';

export interface FitViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface FitOptions {
  margin?: number;
  maxZoom?: number;
  minZoom?: number;
}

/** Compute a viewport that centers the bbox of all atoms of `page` within a
 *  canvas of size `canvasW x canvasH`. Returns a neutral viewport (zoom=1,
 *  centered origin) when the page has zero atoms. */
export function computeFitViewport(
  page: Page | null,
  canvasW: number,
  canvasH: number,
  opts: FitOptions = {},
): FitViewport {
  const margin = opts.margin ?? 60;
  const maxZoom = opts.maxZoom ?? 3;
  const minZoom = opts.minZoom ?? 0.1;

  if (!page || canvasW <= 0 || canvasH <= 0) {
    return { zoom: 1, panX: canvasW / 2, panY: canvasH / 2 };
  }

  const atoms = Object.values(page.atoms);
  if (atoms.length === 0) {
    return { zoom: 1, panX: canvasW / 2, panY: canvasH / 2 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const a of atoms) {
    if (a.x < minX) minX = a.x;
    if (a.y < minY) minY = a.y;
    if (a.x > maxX) maxX = a.x;
    if (a.y > maxY) maxY = a.y;
  }

  const bboxW = Math.max(1, maxX - minX) + margin * 2;
  const bboxH = Math.max(1, maxY - minY) + margin * 2;

  const rawZoom = Math.min(canvasW / bboxW, canvasH / bboxH);
  const zoom = Math.max(minZoom, Math.min(maxZoom, rawZoom));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const panX = canvasW / 2 - centerX * zoom;
  const panY = canvasH / 2 - centerY * zoom;

  return { zoom, panX, panY };
}
