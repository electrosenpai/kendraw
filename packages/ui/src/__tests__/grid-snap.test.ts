import { describe, it, expect } from 'vitest';
import { GRID_SIZE_PX } from '@kendraw/renderer-canvas';

/** Wave-3 B2: verify the snap modulus is the canvas GRID_SIZE_PX and that
 *  the rounding helper collapses near-grid points correctly. */
function snap(v: number): number {
  return Math.round(v / GRID_SIZE_PX) * GRID_SIZE_PX;
}

describe('grid-snap (wave-3 B2)', () => {
  it('rounds 0 to 0', () => {
    expect(snap(0)).toBe(0);
  });

  it('rounds a value 12 px off the lattice down to the nearest step', () => {
    expect(snap(12)).toBe(0);
    expect(snap(13)).toBe(25);
  });

  it('rounds a multiple of step to itself', () => {
    expect(snap(50)).toBe(50);
    expect(snap(75)).toBe(75);
    expect(snap(-25)).toBe(-25);
  });

  it('uses 25 px as the default grid size', () => {
    expect(GRID_SIZE_PX).toBe(25);
  });
});
