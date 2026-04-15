# Deferred Work

## Deferred from: code review of 1-1-additive-shift-table-data (2026-04-13)

- No confidence counts for SUBSTITUENT_INCREMENTS keys — confidence scoring (Story 3.1) will need increment reliability metadata
- All confidence counts >= 10, Medium/Low tiers unreachable — V1 environments with fewer references will exercise these tiers
- No beta/gamma position increment data structure — Story 1.2 additive predictor will need distance-decay heuristic
- Solvent-dependent exchangeable proton shifts (OH, NH, COOH) have no solvent context — MVP assumes default solvent (CDCl3)
- Br (0.45) < Cl (0.55) increment ordering is unusual for alpha-position Shoolery tables — validate against NMRShiftDB2 experimental data when available
- All EDG substituent increments are positive (alpha-only model) — revisit when Story 1.2 defines the additive algorithm with aromatic ring current effects

## Deferred from: code review of 1-2-nmr-prediction-service (2026-04-13)

- No substituent collection for O-H/N-H protons — phenol OH vs aliphatic OH get same base shift
- Float equality in equivalence grouping — needs epsilon-based approach for robust proton grouping
- No AC3/AC4 performance tests — need RDKit environment to measure timing constraints
- S/P/Si heteroatom protons fall through to "methyl" with misleading high confidence
- CN (nitrile) detection over-broad for complex N-bearing molecules
- Charged species (quaternary N, carboxylates) and radicals not handled
- \_classify_sp3_carbon first-match priority arbitrary for multi-environment carbons (e.g., Cl + C=O)
