/**
 * POC #1 — Performance benchmark for Kendraw scene model.
 *
 * Tests scene operations (Immer structural sharing) and spatial index (R-tree)
 * at 100/250/500/750 atom counts.
 *
 * Run: cd packages/scene-poc && npx vitest bench
 *
 * Acceptance criteria (architecture §15.1 POC #1):
 * - Scene operations at 500 atoms: < 16 ms per operation
 * - Spatial index hit-test at 500 atoms: < 1 ms
 * - Spatial index rectangle search at 500 atoms: < 5 ms
 *
 * NOTE: Canvas rendering FPS requires a real browser.
 * A separate browser-based benchmark (packages/scene-poc/bench/browser-bench.html)
 * should be used for the full 30 fps validation.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bench, describe } from 'vitest';
import { applyCommand, createEmptyPage } from '../src/scene-store.js';
import { SpatialIndex } from '../src/spatial-index.js';
import type { Atom, Bond, Page } from '../src/types.js';

interface BenchmarkStructure {
  atoms: Record<string, Atom>;
  bonds: Record<string, Bond>;
}

function loadFixture(name: string): Page {
  const fixtureDir = join(import.meta.dirname ?? '.', '..', '..', '..', 'tests', 'fixtures', 'perf-benchmarks', 'synthetic');
  const raw = readFileSync(join(fixtureDir, `${name}.json`), 'utf-8');
  const data = JSON.parse(raw) as BenchmarkStructure;
  return { atoms: data.atoms, bonds: data.bonds };
}

const sizes = [100, 250, 500, 750] as const;

for (const size of sizes) {
  describe(`Scene operations — ${size} atoms`, () => {
    const page = loadFixture(`chain-${size}`);

    bench('add atom', () => {
      applyCommand(page, {
        type: 'add-atom',
        atom: { id: `new-${Math.random()}`, x: 10, y: 10, element: 6, charge: 0 },
      });
    });

    bench('move atom', () => {
      applyCommand(page, { type: 'move-atom', id: 'a0', dx: 0.1, dy: 0.1 });
    });

    bench('remove atom', () => {
      applyCommand(page, { type: 'remove-atom', id: 'a0' });
    });
  });

  describe(`Spatial index — ${size} atoms`, () => {
    const page = loadFixture(`chain-${size}`);
    const index = new SpatialIndex();
    index.rebuild(page);

    bench('hit-test (single point)', () => {
      index.hitTest(5, 0.5, 0.5);
    });

    bench('rectangle search (10% of scene)', () => {
      // Search roughly 10% of the bounding box
      const maxX = size * 1.5 * 0.5;
      index.searchRect(0, -1, maxX * 0.1, 1);
    });

    bench('full rebuild', () => {
      index.rebuild(page);
    });
  });
}
