/**
 * @feature Solvent change affects NMR shifts
 * @priority P2
 * @covers Solvent parameter changes NMR prediction output
 */

import { test, expect } from '../fixtures/base-test';
import { BACKEND_URL } from '../fixtures/molecules';

test.describe('P2 Features — Solvent Effects @p2', () => {
  test('CDCl3 and DMSO produce different shifts for ethanol OH', async ({ request }) => {
    const cdcl3 = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: 'CCO', format: 'smiles', nucleus: '1H', solvent: 'CDCl3' },
    });
    const dmso = await request.post(`${BACKEND_URL}/compute/nmr`, {
      data: { input: 'CCO', format: 'smiles', nucleus: '1H', solvent: 'DMSO-d6' },
    });

    expect(cdcl3.ok()).toBeTruthy();
    expect(dmso.ok()).toBeTruthy();

    const cdcl3Data = await cdcl3.json();
    const dmsoData = await dmso.json();

    // Both should return peaks
    expect(cdcl3Data.peaks.length).toBeGreaterThan(0);
    expect(dmsoData.peaks.length).toBeGreaterThan(0);

    // Solvent should produce at least some difference in shifts
    const cdcl3Shifts = cdcl3Data.peaks.map((p: { shift_ppm: number }) => p.shift_ppm).sort();
    const dmsoShifts = dmsoData.peaks.map((p: { shift_ppm: number }) => p.shift_ppm).sort();

    // At least one peak should differ by more than 0.1 ppm
    let hasDifference = false;
    for (let i = 0; i < Math.min(cdcl3Shifts.length, dmsoShifts.length); i++) {
      if (Math.abs(cdcl3Shifts[i] - dmsoShifts[i]) > 0.1) {
        hasDifference = true;
        break;
      }
    }
    expect(hasDifference).toBe(true);
  });

  test('all supported solvents produce results', async ({ request }) => {
    const solvents = ['CDCl3', 'DMSO-d6', 'D2O', 'CD3OD', 'C6D6'];
    for (const solvent of solvents) {
      const res = await request.post(`${BACKEND_URL}/compute/nmr`, {
        data: { input: 'CCO', format: 'smiles', nucleus: '1H', solvent },
      });
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.peaks.length).toBeGreaterThan(0);
    }
  });
});
