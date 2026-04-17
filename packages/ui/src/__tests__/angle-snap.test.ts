import { describe, it, expect } from 'vitest';
import { DEFAULT_TOOL_STATE } from '../ToolPalette';

/** Pure-logic mirror of the Canvas freeAngle decision used by
 *  calculateBondTarget(). The Shift key inverts whichever mode is active,
 *  so the truth table must hold for both angleSnap=true and false. */
function resolveFreeAngle(angleSnap: boolean, shiftHeld: boolean): boolean {
  return angleSnap ? shiftHeld : !shiftHeld;
}

describe('wave-3 A5: bond angle snap', () => {
  it('DEFAULT_TOOL_STATE.angleSnap is true (snap on by default)', () => {
    expect(DEFAULT_TOOL_STATE.angleSnap).toBe(true);
  });

  it('snap on, no shift: freeAngle = false (snaps to 30°)', () => {
    expect(resolveFreeAngle(true, false)).toBe(false);
  });

  it('snap on, shift held: freeAngle = true (shift escapes snap)', () => {
    expect(resolveFreeAngle(true, true)).toBe(true);
  });

  it('snap off, no shift: freeAngle = true (free by default)', () => {
    expect(resolveFreeAngle(false, false)).toBe(true);
  });

  it('snap off, shift held: freeAngle = false (shift re-enables snap)', () => {
    expect(resolveFreeAngle(false, true)).toBe(false);
  });
});
