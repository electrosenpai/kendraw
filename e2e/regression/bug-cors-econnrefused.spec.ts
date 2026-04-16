/**
 * @feature Regression: CORS / ECONNREFUSED between frontend and backend
 * @priority P0
 * @bug Frontend could not reach backend due to proxy misconfiguration
 */

import { test, expect } from '../fixtures/base-test';
import { BACKEND_URL } from '../fixtures/molecules';

test.describe('Regression — CORS/Proxy @p0 @regression', () => {
  test('frontend can reach backend via Vite proxy', async ({ request }) => {
    // This test ensures the proxy /api -> localhost:8081 works
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('backend direct access works', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.ok()).toBeTruthy();
  });

  test('POST via proxy returns data, not CORS error', async ({ request }) => {
    const res = await request.post('/api/compute/properties/smiles', {
      data: { smiles: 'C' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.molecular_weight).toBeGreaterThan(0);
  });
});
