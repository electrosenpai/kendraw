import { describe, it, expect } from 'vitest';
import {
  rotateAtoms,
  snapAngle,
  mirrorAtomsH,
  mirrorAtomsV,
  computeCenter,
} from '../transforms.js';
import { createAtom } from '../helpers.js';

describe('Transforms', () => {
  describe('rotateAtoms', () => {
    it('rotates 90 degrees', () => {
      const atom = createAtom(110, 100);
      const result = rotateAtoms([atom], 100, 100, Math.PI / 2);
      expect(result[0]?.x).toBeCloseTo(100);
      expect(result[0]?.y).toBeCloseTo(110);
    });

    it('rotates 180 degrees', () => {
      const atom = createAtom(110, 100);
      const result = rotateAtoms([atom], 100, 100, Math.PI);
      expect(result[0]?.x).toBeCloseTo(90);
      expect(result[0]?.y).toBeCloseTo(100);
    });

    it('preserves non-position atom data', () => {
      const atom = createAtom(110, 100, 8);
      const result = rotateAtoms([atom], 100, 100, Math.PI / 2);
      expect(result[0]?.element).toBe(8);
      expect(result[0]?.id).toBe(atom.id);
    });
  });

  describe('snapAngle', () => {
    it('snaps to 15 degree increments by default', () => {
      const angle = (14 * Math.PI) / 180; // just under 15
      const snapped = snapAngle(angle);
      expect(snapped).toBeCloseTo((15 * Math.PI) / 180);
    });

    it('snaps to 0 for small angles', () => {
      const angle = (3 * Math.PI) / 180;
      const snapped = snapAngle(angle);
      expect(snapped).toBeCloseTo(0);
    });

    it('supports custom snap increments', () => {
      const angle = (44 * Math.PI) / 180;
      const snapped = snapAngle(angle, 45);
      expect(snapped).toBeCloseTo((45 * Math.PI) / 180);
    });
  });

  describe('mirrorAtomsH', () => {
    it('mirrors atoms horizontally around center', () => {
      const atom = createAtom(110, 50);
      const result = mirrorAtomsH([atom], 100);
      expect(result[0]?.x).toBeCloseTo(90);
      expect(result[0]?.y).toBe(50);
    });
  });

  describe('mirrorAtomsV', () => {
    it('mirrors atoms vertically around center', () => {
      const atom = createAtom(50, 110);
      const result = mirrorAtomsV([atom], 100);
      expect(result[0]?.y).toBeCloseTo(90);
      expect(result[0]?.x).toBe(50);
    });
  });

  describe('computeCenter', () => {
    it('computes center of atoms', () => {
      const atoms = [createAtom(0, 0), createAtom(100, 100)];
      const center = computeCenter(atoms);
      expect(center.x).toBe(50);
      expect(center.y).toBe(50);
    });

    it('returns origin for empty array', () => {
      const center = computeCenter([]);
      expect(center.x).toBe(0);
      expect(center.y).toBe(0);
    });
  });
});
