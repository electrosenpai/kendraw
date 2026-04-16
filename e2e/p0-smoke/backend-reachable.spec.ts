/**
 * @feature Backend connectivity
 * @priority P0
 * @covers Health endpoint, Vite proxy, API reachability
 */

import { test, expect } from '../fixtures/base-test';
import { BACKEND_URL } from '../fixtures/molecules';

test.describe('P0 Smoke — Backend Reachable @p0', () => {
  test('health endpoint returns OK with valid body', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.nmr).toBeDefined();
  });

  test('Vite proxy forwards /api to backend', async ({ request }) => {
    const res = await request.post('/api/compute/properties/smiles', {
      data: { smiles: 'C' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.molecular_weight).toBeGreaterThan(0);
  });

  test('NMR endpoint via proxy returns peaks', async ({ request }) => {
    const res = await request.post('/api/compute/nmr', {
      data: { input: 'CCO', format: 'smiles', nucleus: '1H' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.peaks).toBeDefined();
    expect(body.peaks.length).toBeGreaterThan(0);
  });

  test('invalid SMILES returns 4xx error', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: 'NOT_VALID', format: 'smiles', nucleus: '1H' },
    });
    expect([400, 422, 500]).toContain(res.status());
  });

  test('properties endpoint returns molecular descriptors', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: 'CCO' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.formula).toBeDefined();
    expect(data.molecular_weight).toBeCloseTo(46.07, 0);
    expect(data.canonical_smiles).toBeDefined();
  });
});
