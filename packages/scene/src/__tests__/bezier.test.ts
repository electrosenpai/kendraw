import { describe, it, expect } from 'vitest';
import {
  evaluateBezier,
  bezierBoundingBox,
  bezierLength,
  defaultCurlyGeometry,
} from '../bezier.js';

describe('Bezier utilities', () => {
  const linear = {
    start: { x: 0, y: 0 },
    c1: { x: 33, y: 0 },
    c2: { x: 66, y: 0 },
    end: { x: 100, y: 0 },
  };

  describe('evaluateBezier', () => {
    it('returns start at t=0', () => {
      const p = evaluateBezier(linear, 0);
      expect(p.x).toBeCloseTo(0);
      expect(p.y).toBeCloseTo(0);
    });

    it('returns end at t=1', () => {
      const p = evaluateBezier(linear, 1);
      expect(p.x).toBeCloseTo(100);
      expect(p.y).toBeCloseTo(0);
    });

    it('returns midpoint at t=0.5 for symmetric curve', () => {
      const p = evaluateBezier(linear, 0.5);
      expect(p.x).toBeCloseTo(50, 0);
    });
  });

  describe('bezierBoundingBox', () => {
    it('computes bounding box', () => {
      const bb = bezierBoundingBox(linear);
      expect(bb.minX).toBeCloseTo(0);
      expect(bb.maxX).toBeCloseTo(100);
    });

    it('handles curved path', () => {
      const curve = {
        start: { x: 0, y: 0 },
        c1: { x: 0, y: 100 },
        c2: { x: 100, y: 100 },
        end: { x: 100, y: 0 },
      };
      const bb = bezierBoundingBox(curve);
      expect(bb.minY).toBeLessThanOrEqual(0);
      expect(bb.maxY).toBeGreaterThan(0);
    });
  });

  describe('bezierLength', () => {
    it('approximates length of straight line', () => {
      const len = bezierLength(linear);
      expect(len).toBeCloseTo(100, 0);
    });
  });

  describe('defaultCurlyGeometry', () => {
    it('creates geometry from two points', () => {
      const geom = defaultCurlyGeometry({ x: 0, y: 0 }, { x: 100, y: 0 });
      expect(geom.start.x).toBe(0);
      expect(geom.end.x).toBe(100);
      expect(geom.c1.y).not.toBe(0); // should curve
    });
  });
});
