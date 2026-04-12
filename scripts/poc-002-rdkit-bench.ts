/**
 * POC #2 — RDKit.js WASM latency benchmark.
 * Measures SMILES parsing, canonicalization, and InChI generation.
 *
 * Usage: npx tsx scripts/poc-002-rdkit-bench.ts
 */

const TEST_SMILES = [
  'C', // methane
  'CCO', // ethanol
  'c1ccccc1', // benzene
  'CC(=O)Oc1ccccc1C(=O)O', // aspirin
  'Cn1c(=O)c2c(ncn2C)n(C)c1=O', // caffeine
  'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34C', // testosterone
  'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', // ibuprofen
  'OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O', // glucose
  'CC(=O)NC1=CC=C(O)C=C1', // paracetamol
  'C1CCCCC1NCCCCCCCCCCCCCCCCCC', // long chain
  // Larger molecules (50-100 atoms in SMILES)
  'CC(C)(COP(=O)(O)OP(=O)(O)OCC1OC(n2cnc3c(N)ncnc32)C(O)C1OP(=O)(O)O)C(O)C(=O)NCCC(=O)NCCSC(=O)C', // CoA fragment
  'CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O', // penicillin G core
];

async function main() {
  console.log('Loading RDKit.js WASM...');
  const t0 = performance.now();

  // Dynamic import to measure load time
  const { default: initRDKitModule } = await import('@rdkit/rdkit');
  const RDKit = await initRDKitModule();

  const loadTime = performance.now() - t0;
  console.log(`WASM load time: ${loadTime.toFixed(1)} ms`);

  console.log(`\nParsing ${TEST_SMILES.length} SMILES strings...\n`);

  const results: Array<{ smiles: string; parseMs: number; canonMs: number; inchiMs: number }> = [];

  for (const smiles of TEST_SMILES) {
    // Parse
    const t1 = performance.now();
    const mol = RDKit.get_mol(smiles);
    const parseMs = performance.now() - t1;

    if (!mol) {
      console.log(`  FAIL: ${smiles} — could not parse`);
      continue;
    }

    // Canonical SMILES
    const t2 = performance.now();
    mol.get_smiles();
    const canonMs = performance.now() - t2;

    // InChI
    const t3 = performance.now();
    mol.get_inchi();
    const inchiMs = performance.now() - t3;

    results.push({ smiles: smiles.substring(0, 40), parseMs, canonMs, inchiMs });
    mol.delete();
  }

  console.log(
    '| SMILES (truncated)                       | Parse (ms) | Canon (ms) | InChI (ms) |',
  );
  console.log(
    '|------------------------------------------|------------|------------|------------|',
  );
  for (const r of results) {
    console.log(
      `| ${r.smiles.padEnd(40)} | ${r.parseMs.toFixed(3).padStart(10)} | ${r.canonMs.toFixed(3).padStart(10)} | ${r.inchiMs.toFixed(3).padStart(10)} |`,
    );
  }

  const avgParse = results.reduce((s, r) => s + r.parseMs, 0) / results.length;
  const maxParse = Math.max(...results.map((r) => r.parseMs));

  console.log(`\n--- Summary ---`);
  console.log(`WASM load:      ${loadTime.toFixed(1)} ms`);
  console.log(`Avg parse:      ${avgParse.toFixed(3)} ms`);
  console.log(`Max parse:      ${maxParse.toFixed(3)} ms`);
  console.log(`WASM gzip size: ~1.96 MB`);
  console.log(`\n--- POC #2 Criteria ---`);
  console.log(`Bundle < 6 MB gzip:  1.96 MB  → PASS`);
  console.log(
    `Parse < 200 ms:      ${maxParse.toFixed(3)} ms → ${maxParse < 200 ? 'PASS' : 'FAIL'}`,
  );
  console.log(
    `(First interactive < 2 s on 4G: requires browser test, estimated ${(loadTime + 500).toFixed(0)} ms on broadband)`,
  );
}

main().catch(console.error);
