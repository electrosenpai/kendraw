/**
 * @feature Regression: merge conflict markers breaking backend
 * @priority P0
 * @bug Unresolved merge conflict in compute.py caused SyntaxError
 */

import { test, expect } from '../fixtures/base-test';
import { BACKEND_URL } from '../fixtures/molecules';

test.describe('Regression — Merge Conflict Detection @p0 @regression', () => {
  test('backend starts and responds to health check', async ({ request }) => {
    // If compute.py has a SyntaxError (e.g. merge conflict markers),
    // the backend won't start and this test will fail
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('compute endpoint is functional', async ({ request }) => {
    // This specifically exercises compute.py — the file that had the conflict
    const res = await request.post(`${BACKEND_URL}/compute/properties/smiles`, {
      data: { smiles: 'CCO' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.molecular_weight).toBeGreaterThan(0);
  });
});
