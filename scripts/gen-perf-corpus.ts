/**
 * Deterministic generator for performance benchmark structures.
 * Produces JSON files compatible with Kendraw scene model (architecture §6.1).
 *
 * Usage: npx tsx scripts/gen-perf-corpus.ts
 *
 * Output: tests/fixtures/perf-benchmarks/synthetic/*.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// ---- Types (minimal subset of scene model) ----

interface Atom {
  id: string;
  x: number;
  y: number;
  element: number; // atomic number Z
  charge: number;
}

interface Bond {
  id: string;
  fromAtomId: string;
  toAtomId: string;
  order: number;
  style: string;
}

interface BenchmarkStructure {
  name: string;
  pattern: string;
  atomCount: number;
  bondCount: number;
  atoms: Record<string, Atom>;
  bonds: Record<string, Bond>;
}

// ---- Deterministic PRNG (Mulberry32) ----

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Generators ----

function generateChain(targetAtoms: number, seed: number): BenchmarkStructure {
  const rng = mulberry32(seed);
  const atoms: Record<string, Atom> = {};
  const bonds: Record<string, Bond> = {};

  const bondLength = 1.5;
  const angle = (120 * Math.PI) / 180; // zigzag

  for (let i = 0; i < targetAtoms; i++) {
    const id = `a${i}`;
    const direction = i % 2 === 0 ? 1 : -1;
    atoms[id] = {
      id,
      x: i * bondLength * Math.cos(angle / 2),
      y: direction * bondLength * Math.sin(angle / 2) * (i % 2 === 0 ? 0 : 1),
      element: rng() < 0.9 ? 6 : rng() < 0.5 ? 7 : 8, // mostly C, some N/O
      charge: 0,
    };

    if (i > 0) {
      const bid = `b${i - 1}`;
      bonds[bid] = {
        id: bid,
        fromAtomId: `a${i - 1}`,
        toAtomId: id,
        order: 1,
        style: 'single',
      };
    }
  }

  return {
    name: `chain-${targetAtoms}`,
    pattern: 'chain',
    atomCount: targetAtoms,
    bondCount: targetAtoms - 1,
    atoms,
    bonds,
  };
}

function generateRingCluster(targetAtoms: number, seed: number): BenchmarkStructure {
  const rng = mulberry32(seed);
  const atoms: Record<string, Atom> = {};
  const bonds: Record<string, Bond> = {};

  let atomIdx = 0;
  let bondIdx = 0;
  const ringSize = 6;
  const ringsNeeded = Math.ceil(targetAtoms / ringSize);
  const ringRadius = 1.4;
  const ringSpacing = 3.0;

  for (let r = 0; r < ringsNeeded && atomIdx < targetAtoms; r++) {
    const cols = Math.ceil(Math.sqrt(ringsNeeded));
    const cx = (r % cols) * ringSpacing;
    const cy = Math.floor(r / cols) * ringSpacing;
    const ringAtomIds: string[] = [];

    for (let i = 0; i < ringSize && atomIdx < targetAtoms; i++) {
      const id = `a${atomIdx}`;
      const theta = (2 * Math.PI * i) / ringSize;
      atoms[id] = {
        id,
        x: cx + ringRadius * Math.cos(theta),
        y: cy + ringRadius * Math.sin(theta),
        element: rng() < 0.8 ? 6 : rng() < 0.5 ? 7 : 8,
        charge: 0,
      };
      ringAtomIds.push(id);
      atomIdx++;
    }

    // Close the ring
    for (let i = 0; i < ringAtomIds.length; i++) {
      const next = (i + 1) % ringAtomIds.length;
      if (next < ringAtomIds.length && ringAtomIds[next] !== undefined) {
        const bid = `b${bondIdx}`;
        const fromId = ringAtomIds[i];
        const toId = ringAtomIds[next];
        if (!fromId || !toId) continue;
        bonds[bid] = {
          id: bid,
          fromAtomId: fromId,
          toAtomId: toId,
          order: i % 2 === 0 ? 2 : 1, // alternating for aromatic-like
          style: i % 2 === 0 ? 'double' : 'single',
        };
        bondIdx++;
      }
    }
  }

  return {
    name: `rings-${targetAtoms}`,
    pattern: 'ring-cluster',
    atomCount: Object.keys(atoms).length,
    bondCount: Object.keys(bonds).length,
    atoms,
    bonds,
  };
}

function generateMixed(targetAtoms: number, seed: number): BenchmarkStructure {
  const rng = mulberry32(seed);
  const atoms: Record<string, Atom> = {};
  const bonds: Record<string, Bond> = {};

  let atomIdx = 0;
  let bondIdx = 0;

  // Mix of chains and rings placed on a grid
  const gridSize = Math.ceil(Math.sqrt(targetAtoms / 4));
  const spacing = 2.0;

  for (let gx = 0; gx < gridSize && atomIdx < targetAtoms; gx++) {
    for (let gy = 0; gy < gridSize && atomIdx < targetAtoms; gy++) {
      const clusterSize = Math.min(4 + Math.floor(rng() * 4), targetAtoms - atomIdx);
      const cx = gx * spacing * 3;
      const cy = gy * spacing * 3;
      const clusterStart = atomIdx;

      for (let i = 0; i < clusterSize; i++) {
        const id = `a${atomIdx}`;
        atoms[id] = {
          id,
          x: cx + (rng() - 0.5) * spacing * 2,
          y: cy + (rng() - 0.5) * spacing * 2,
          element: [6, 6, 6, 7, 8, 16][Math.floor(rng() * 6)] ?? 6,
          charge: 0,
        };
        if (atomIdx > clusterStart) {
          const bid = `b${bondIdx}`;
          bonds[bid] = {
            id: bid,
            fromAtomId: `a${atomIdx - 1}`,
            toAtomId: id,
            order: rng() < 0.7 ? 1 : 2,
            style: rng() < 0.7 ? 'single' : 'double',
          };
          bondIdx++;
        }
        atomIdx++;
      }
    }
  }

  return {
    name: `mixed-${targetAtoms}`,
    pattern: 'mixed',
    atomCount: Object.keys(atoms).length,
    bondCount: Object.keys(bonds).length,
    atoms,
    bonds,
  };
}

// ---- Main ----

const outDir = join(
  import.meta.dirname ?? '.',
  '..',
  'tests',
  'fixtures',
  'perf-benchmarks',
  'synthetic',
);
mkdirSync(outDir, { recursive: true });

const sizes = [100, 250, 500, 750];
const generators = [
  { fn: generateChain, label: 'chain' },
  { fn: generateRingCluster, label: 'rings' },
  { fn: generateMixed, label: 'mixed' },
];

const SEED_BASE = 42;
const manifest: Array<{ file: string; pattern: string; atoms: number; bonds: number }> = [];

for (const size of sizes) {
  for (const gen of generators) {
    const structure = gen.fn(size, SEED_BASE + size + gen.label.length);
    const filename = `${gen.label}-${size}.json`;
    const filepath = join(outDir, filename);
    writeFileSync(filepath, JSON.stringify(structure, null, 2));
    manifest.push({
      file: filename,
      pattern: gen.label,
      atoms: structure.atomCount,
      bonds: structure.bondCount,
    });
    console.log(`  ${filename}: ${structure.atomCount} atoms, ${structure.bondCount} bonds`);
  }
}

writeFileSync(
  join(outDir, 'manifest.json'),
  JSON.stringify(
    { seed: SEED_BASE, generated: new Date().toISOString(), structures: manifest },
    null,
    2,
  ),
);
console.log(`\nGenerated ${manifest.length} structures in ${outDir}`);
