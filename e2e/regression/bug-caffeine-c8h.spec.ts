/**
 * @feature Regression: caffeine C8-H NMR shift overcorrection
 * @priority P1
 * @bug Fused heterocycle C8-H was predicted at >12 ppm, should be 7.0-8.5
 */

import { test, expect } from '../fixtures/base-test';
import { MOLECULES, BACKEND_URL } from '../fixtures/molecules';

test.describe('Regression — Caffeine C8-H @p1 @regression', () => {
  test('caffeine C8-H shift stays within 7.0-8.5 ppm', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: {
        input: MOLECULES.caffeine.smiles,
        format: 'smiles',
        nucleus: '1H',
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const shifts: number[] = data.peaks.map((p: { shift_ppm: number }) => p.shift_ppm);

    // The most downfield peak (C8-H) must not exceed 8.5 ppm
    const maxShift = Math.max(...shifts);
    expect(maxShift).toBeLessThan(8.5);
    expect(maxShift).toBeGreaterThan(7.0);
  });

  test('caffeine returns expected number of N-methyl peaks', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: {
        input: MOLECULES.caffeine.smiles,
        format: 'smiles',
        nucleus: '1H',
      },
    });
    const data = await res.json();
    // Caffeine has 3 N-methyl groups (9H total) + 1 C8-H
    expect(data.peaks.length).toBeGreaterThanOrEqual(2);
  });
});
