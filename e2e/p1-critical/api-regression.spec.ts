/**
 * @feature API regression — numerical validation
 * @priority P1
 * @covers MW, LogP, tPSA, Lipinski for reference molecules
 */

import { test, expect } from '../fixtures/base-test';
import { MOLECULES, BACKEND_URL } from '../fixtures/molecules';

test.describe('P1 Critical — API Regression @p1', () => {
  test('ethanol MW ≈ 46.07', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.ethanol.smiles },
    });
    const data = await res.json();
    expect(data.molecular_weight).toBeCloseTo(MOLECULES.ethanol.mw, 0);
  });

  test('caffeine MW ≈ 194.19', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.caffeine.smiles },
    });
    const data = await res.json();
    expect(data.molecular_weight).toBeCloseTo(MOLECULES.caffeine.mw, 0);
  });

  test('aspirin tPSA ≈ 63.6', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.aspirin.smiles },
    });
    const data = await res.json();
    expect(data.tpsa).toBeCloseTo(MOLECULES.aspirin.tpsa ?? 0, 0);
  });

  test('benzene MW ≈ 78.11', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.benzene.smiles },
    });
    const data = await res.json();
    expect(data.molecular_weight).toBeCloseTo(MOLECULES.benzene.mw, 0);
  });

  test('ibuprofen MW ≈ 206.28 and Lipinski pass', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: MOLECULES.ibuprofen.smiles },
    });
    const data = await res.json();
    expect(data.molecular_weight).toBeCloseTo(MOLECULES.ibuprofen.mw, 0);
    expect(data.lipinski_pass).toBe(true);
  });
});
