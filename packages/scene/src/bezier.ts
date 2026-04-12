import type { BezierGeometry, Point } from './types.js';

export function evaluateBezier(g: BezierGeometry, t: number): Point {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * g.start.x + 3 * u2 * t * g.c1.x + 3 * u * t2 * g.c2.x + t3 * g.end.x,
    y: u3 * g.start.y + 3 * u2 * t * g.c1.y + 3 * u * t2 * g.c2.y + t3 * g.end.y,
  };
}

export function bezierBoundingBox(g: BezierGeometry): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const steps = 20;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i <= steps; i++) {
    const p = evaluateBezier(g, i / steps);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

export function bezierLength(g: BezierGeometry, steps: number = 20): number {
  let len = 0;
  let prev = evaluateBezier(g, 0);
  for (let i = 1; i <= steps; i++) {
    const curr = evaluateBezier(g, i / steps);
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    len += Math.sqrt(dx * dx + dy * dy);
    prev = curr;
  }
  return len;
}

export function defaultCurlyGeometry(from: Point, to: Point): BezierGeometry {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.max(20, len * 0.3);
  // Perpendicular offset for curvature
  const nx = len > 0 ? -dy / len : 0;
  const ny = len > 0 ? dx / len : 1;

  return {
    start: { x: from.x, y: from.y },
    c1: { x: from.x + dx * 0.33 + nx * curvature, y: from.y + dy * 0.33 + ny * curvature },
    c2: { x: from.x + dx * 0.66 + nx * curvature, y: from.y + dy * 0.66 + ny * curvature },
    end: { x: to.x, y: to.y },
  };
}
