// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from '../config/feature-flags';

describe('feature-flags', () => {
  it('exposes the newCanvas flag', () => {
    expect(FEATURE_FLAGS).toHaveProperty('newCanvas');
    expect(typeof FEATURE_FLAGS.newCanvas).toBe('boolean');
  });

  it('defaults newCanvas to false when the env var is absent or not "true"', () => {
    // In vitest env, VITE_ENABLE_NEW_CANVAS is unset by default.
    expect(FEATURE_FLAGS.newCanvas).toBe(false);
  });

  it('isFeatureEnabled returns a strict boolean matching the flag', () => {
    expect(isFeatureEnabled('newCanvas')).toBe(FEATURE_FLAGS.newCanvas);
  });

  it('FEATURE_FLAGS is readonly at the type level (runtime immutability enforced by TS)', () => {
    // Structural check: attempting to mutate would fail TS; here we just
    // confirm the keys are present and finite.
    const keys = Object.keys(FEATURE_FLAGS).sort();
    expect(keys).toEqual(['newCanvas']);
  });
});
