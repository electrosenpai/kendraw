import { test, expect } from '@playwright/test';

const BACKEND = 'http://localhost:8081';

test.describe('API Integration', () => {
  test('backend health endpoint responds', async ({ request }) => {
    const res = await request.get(`${BACKEND}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('NMR prediction returns peaks for ethanol', async ({ request }) => {
    const res = await request.post(`${BACKEND}/compute/nmr`, {
      data: { input: 'CCO', format: 'smiles', nucleus: '1H' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.peaks).toBeDefined();
    expect(data.peaks.length).toBeGreaterThan(0);
    expect(data.nucleus).toBe('1H');
  });

  test('NMR via Vite proxy works', async ({ request }) => {
    const res = await request.post('/api/compute/nmr', {
      data: { input: 'CCO', format: 'smiles', nucleus: '1H' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.peaks.length).toBeGreaterThan(0);
  });

  test('properties endpoint returns molecular descriptors', async ({ request }) => {
    const res = await request.post(`${BACKEND}/compute/properties/smiles`, {
      data: { smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.formula).toBeDefined();
    expect(data.molecular_weight).toBeGreaterThan(0);
  });

  test('NMR endpoint rejects invalid SMILES', async ({ request }) => {
    const res = await request.post(`${BACKEND}/compute/nmr`, {
      data: { input: 'INVALID_SMILES_XXX', format: 'smiles', nucleus: '1H' },
    });
    expect([400, 422, 500]).toContain(res.status());
  });
});
