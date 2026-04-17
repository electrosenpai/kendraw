// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect } from 'vitest';
import { snapEndpoint, snapAngleRadians, SNAP_INCREMENT_DEG } from '../snap';

const mods = (shift = false) => ({ shift });

describe('snapEndpoint (W4-R-05)', () => {
  it('snaps a near-horizontal vector exactly to 0°', () => {
    const result = snapEndpoint({ x: 0, y: 0 }, { x: 100, y: 4 }, mods(false));
    expect(result.x).toBeCloseTo(Math.hypot(100, 4), 6);
    expect(result.y).toBeCloseTo(0, 6);
  });

  it('snaps a 20° vector to 15°', () => {
    const radius = 50;
    const theta20 = (20 * Math.PI) / 180;
    const endpoint = { x: radius * Math.cos(theta20), y: radius * Math.sin(theta20) };
    const result = snapEndpoint({ x: 0, y: 0 }, endpoint, mods(false));
    const theta15 = (15 * Math.PI) / 180;
    expect(result.x).toBeCloseTo(radius * Math.cos(theta15), 6);
    expect(result.y).toBeCloseTo(radius * Math.sin(theta15), 6);
  });

  it('passes through the endpoint unchanged when shift is held (free angle)', () => {
    const endpoint = { x: 13, y: 7 };
    const result = snapEndpoint({ x: 0, y: 0 }, endpoint, mods(true));
    expect(result).toEqual(endpoint);
  });

  it('preserves vector length at the snapped angle', () => {
    const anchor = { x: 5, y: 5 };
    const endpoint = { x: 55, y: 33 };
    const result = snapEndpoint(anchor, endpoint, mods(false));
    const originalR = Math.hypot(endpoint.x - anchor.x, endpoint.y - anchor.y);
    const snappedR = Math.hypot(result.x - anchor.x, result.y - anchor.y);
    expect(snappedR).toBeCloseTo(originalR, 6);
  });

  it('returns the endpoint unchanged when anchor == endpoint', () => {
    const p = { x: 42, y: 42 };
    const result = snapEndpoint(p, p, mods(false));
    expect(result).toEqual(p);
  });

  it('SNAP_INCREMENT_DEG is 15 per Wave-4 spec', () => {
    expect(SNAP_INCREMENT_DEG).toBe(15);
  });
});

describe('snapAngleRadians (W4-R-05)', () => {
  it('rounds to the nearest 15° step', () => {
    const theta20 = (20 * Math.PI) / 180;
    const result = snapAngleRadians(theta20, mods(false));
    const theta15 = (15 * Math.PI) / 180;
    expect(result).toBeCloseTo(theta15, 6);
  });

  it('returns the input unchanged when shift is held', () => {
    const theta = 0.4321;
    expect(snapAngleRadians(theta, mods(true))).toBe(theta);
  });
});
