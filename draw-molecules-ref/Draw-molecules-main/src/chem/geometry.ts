import type { Point, SelectionBounds } from './types';

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function normalize(point: Point): Point {
  const magnitude = Math.hypot(point.x, point.y) || 1;
  return { x: point.x / magnitude, y: point.y / magnitude };
}

export function perpendicular(point: Point): Point {
  return { x: -point.y, y: point.x };
}

export function angleBetween(a: Point, b: Point) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function polar(origin: Point, radius: number, angle: number): Point {
  return {
    x: origin.x + Math.cos(angle) * radius,
    y: origin.y + Math.sin(angle) * radius,
  };
}

export function projectPointToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
    t,
  };
}

export function selectionBounds(points: Point[]): SelectionBounds | null {
  if (points.length === 0) {
    return null;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export function pointsInRect(points: Array<Point & { id: string }>, start: Point, end: Point) {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);

  return points.filter((point) => {
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  });
}

export function snapPoint(point: Point, gridSize: number) {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function createRegularPolygon(center: Point, sides: number, sideLength: number) {
  const radius = sideLength / (2 * Math.sin(Math.PI / sides));
  const startAngle = -Math.PI / 2;
  return Array.from({ length: sides }, (_, index) => {
    const angle = startAngle + (Math.PI * 2 * index) / sides;
    return polar(center, radius, angle);
  });
}

export function createZigZagPoints(start: Point, end: Point, segments: number, bondLength: number) {
  if (segments <= 0) {
    return [start];
  }

  const mainAngle = angleBetween(start, end);
  const points: Point[] = [start];

  for (let index = 1; index <= segments; index += 1) {
    const direction = index % 2 === 0 ? -1 : 1;
    const angle = mainAngle + (direction * Math.PI) / 3;
    const previous = points[index - 1];
    points.push(polar(previous, bondLength, angle));
  }

  return points;
}
