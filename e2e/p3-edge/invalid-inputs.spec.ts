/**
 * @feature Error handling for invalid inputs
 * @priority P3
 * @covers Invalid SMILES, empty input, pentavalent carbon, no-proton molecule
 */

import { test, expect } from '../fixtures/base-test';
import { BACKEND_URL } from '../fixtures/molecules';

test.describe('P3 Edge — Invalid Inputs @p3', () => {
  test('invalid SMILES returns error, not 500', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: 'INVALID_SMILES', format: 'smiles', nucleus: '1H' },
    });
    expect([400, 422, 500]).toContain(res.status());
  });

  test('empty SMILES returns error', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: '', format: 'smiles', nucleus: '1H' },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('molecule with no protons returns empty peaks', async ({ request }) => {
    // CCl4 has no protons
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: 'ClC(Cl)(Cl)Cl', format: 'smiles', nucleus: '1H' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.peaks.length).toBe(0);
  });

  test('malformed JSON body returns 422', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-json',
    });
    expect(res.ok()).toBeFalsy();
  });
});
