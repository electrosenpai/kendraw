/**
 * Multiplet rendering regression tests.
 *
 * Verifies that the NMR spectrum renders real J-coupled patterns (3-line
 * triplet, 4-line quartet, 4-line doublet-of-doublets, etc.) rather than a
 * single Lorentzian per peak — and that changing the spectrometer frequency
 * recomputes line spacing (Δppm = J_hz / ν₀) without touching chemical shifts.
 *
 * Instead of doing canvas-pixel hit-testing (fragile under DPR / antialias),
 * the renderer exposes `window.__nmrDebugData` with the expanded sub-line list
 * when `exposeDebug: true` is passed from `NmrPanel`. All assertions here walk
 * that data structure, then cross-check a couple of visual affordances
 * (frequency badge, tooltip wording) via text queries.
 */

import { test, expect } from '../fixtures/base-test';
import type { Page } from '@playwright/test';
import { CanvasPage } from '../pages/CanvasPage';
import { ImportDialog } from '../pages/ImportDialog';
import { NmrPanel } from '../pages/NmrPanel';
import { MOLECULES } from '../fixtures/molecules';

interface NmrDebugSubLine {
  shiftPpm: number;
  intensity: number;
}

interface NmrDebugPeak {
  peakIdx: number;
  shiftPpm: number;
  multiplicity: string;
  couplingHz: number[];
  subLines: NmrDebugSubLine[];
}

interface NmrDebugData {
  frequencyMhz: number;
  peaks: NmrDebugPeak[];
}

async function waitForDebugData(page: Page, expectedFrequency?: number): Promise<NmrDebugData> {
  const handle = await page.waitForFunction(
    (freq: number | null) => {
      const d = (window as unknown as { __nmrDebugData?: NmrDebugData }).__nmrDebugData;
      if (!d) return null;
      if (freq !== null && d.frequencyMhz !== freq) return null;
      return d;
    },
    expectedFrequency ?? null,
    { timeout: 10_000 },
  );
  return handle.jsonValue() as Promise<NmrDebugData>;
}

function sortedLines(peak: NmrDebugPeak): NmrDebugSubLine[] {
  return [...peak.subLines].sort((a, b) => a.shiftPpm - b.shiftPpm);
}

function requirePeak(
  data: NmrDebugData,
  predicate: (p: NmrDebugPeak) => boolean,
  label: string,
): NmrDebugPeak {
  const peak = data.peaks.find(predicate);
  if (!peak) throw new Error(`expected to find ${label} in debug data`);
  return peak;
}

test.describe('NMR multiplet rendering', () => {
  test('ethanol CH₃ renders as a 3-line triplet with Δppm = J / 400 MHz', async ({
    page,
  }) => {
    await page.goto('/');
    await new CanvasPage(page).waitForReady();
    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);
    await new NmrPanel(page).open();

    const data = await waitForDebugData(page);
    expect(data.frequencyMhz).toBe(400);

    const ch3 = requirePeak(
      data,
      (p) => p.multiplicity === 't' && p.shiftPpm > 0.5 && p.shiftPpm < 2,
      'ethanol CH₃ triplet',
    );

    const lines = sortedLines(ch3);
    expect(lines.length).toBe(3);
    const [lo, mid, hi] = lines;
    if (!lo || !mid || !hi) throw new Error('triplet should have 3 lines');

    const j = ch3.couplingHz[0] ?? 7;
    const expectedDeltaPpm = j / 400;
    expect(mid.shiftPpm - lo.shiftPpm).toBeCloseTo(expectedDeltaPpm, 4);
    expect(hi.shiftPpm - mid.shiftPpm).toBeCloseTo(expectedDeltaPpm, 4);

    // Pascal 1:2:1 — centre line intensity == 2× each outer.
    expect(mid.intensity / lo.intensity).toBeCloseTo(2, 1);
    expect(mid.intensity / hi.intensity).toBeCloseTo(2, 1);
  });

  test('ethanol CH₂ renders as a 4-line quartet with Pascal 1:3:3:1', async ({ page }) => {
    await page.goto('/');
    await new CanvasPage(page).waitForReady();
    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);
    await new NmrPanel(page).open();

    const data = await waitForDebugData(page);
    const ch2 = requirePeak(
      data,
      (p) => p.multiplicity === 'q' && p.shiftPpm > 3 && p.shiftPpm < 4.5,
      'ethanol CH₂ quartet',
    );

    const lines = sortedLines(ch2);
    expect(lines.length).toBe(4);
    const [i0, i1, i2, i3] = lines;
    if (!i0 || !i1 || !i2 || !i3) throw new Error('quartet should have 4 lines');

    // 1:3:3:1 → outer/inner = 1/3
    expect(i1.intensity / i0.intensity).toBeCloseTo(3, 1);
    expect(i2.intensity / i3.intensity).toBeCloseTo(3, 1);
    expect(i1.intensity / i2.intensity).toBeCloseTo(1, 1);
  });

  test('frequency change: 300 → 600 MHz halves the triplet spacing', async ({ page }) => {
    await page.goto('/');
    await new CanvasPage(page).waitForReady();
    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);
    await new NmrPanel(page).open();

    await waitForDebugData(page);

    await page.locator('button[role="radio"]', { hasText: '300' }).click();
    const data300 = await waitForDebugData(page, 300);
    const t300 = requirePeak(data300, (p) => p.multiplicity === 't', 'triplet @ 300 MHz');
    const lines300 = sortedLines(t300);
    const [a300, b300] = lines300;
    if (!a300 || !b300) throw new Error('triplet @ 300 MHz missing lines');
    const gap300 = b300.shiftPpm - a300.shiftPpm;

    await page.locator('button[role="radio"]', { hasText: '600' }).click();
    const data600 = await waitForDebugData(page, 600);
    const t600 = requirePeak(data600, (p) => p.multiplicity === 't', 'triplet @ 600 MHz');
    const lines600 = sortedLines(t600);
    const [a600, b600] = lines600;
    if (!a600 || !b600) throw new Error('triplet @ 600 MHz missing lines');
    const gap600 = b600.shiftPpm - a600.shiftPpm;

    // 600 MHz → half the ppm spacing of 300 MHz (within ~5% numerical tolerance).
    expect(gap600 / gap300).toBeCloseTo(0.5, 1);

    // Chemical shift (centroid in ppm) must be invariant under frequency change.
    expect(t600.shiftPpm).toBeCloseTo(t300.shiftPpm, 3);
  });

  test('tooltip exposes verbal multiplicity + J', async ({ page }) => {
    await page.goto('/');
    await new CanvasPage(page).waitForReady();
    await new ImportDialog(page).importSmiles(MOLECULES.ethanol.smiles);
    await new NmrPanel(page).open();

    await waitForDebugData(page);

    const panel = page.locator('[data-testid="nmr-panel"]');
    await expect(panel.getByText(/triplet/i).first()).toBeVisible();
    await expect(panel.getByText(/J = /).first()).toBeVisible();
  });
});
