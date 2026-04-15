# Feature Gap Analysis: Draw-molecules vs Kendraw

Generated: 2026-04-13 (Autonomous Session)

## Summary

Cross-reference of Draw-molecules reference implementation features against Kendraw's current state and roadmap.

## Classification Legend

- **Done** — Already implemented in Kendraw
- **Planned** — In PRD/epics, not yet built
- **New** — Not in Kendraw roadmap, worth adding
- **V2+** — Low priority, defer to future versions

---

## NMR Features

| #   | Feature                                | Draw-molecules                                          | Kendraw Status  | Classification            | Notes                                                  |
| --- | -------------------------------------- | ------------------------------------------------------- | --------------- | ------------------------- | ------------------------------------------------------ |
| 1   | 6 Solvents with shift corrections      | CDCl3, DMSO-d6, CD3OD, acetone-d6, C6D6, D2O            | Not implemented | **Planned** (V1)          | Deferred in Story 1.1; PRD mentions default CDCl3      |
| 2   | Multiplicity + J-coupling (SpinSystem) | Full Karplus-based estimation, multiplet labels         | Not implemented | **Planned** (Epic 9, V1)  | In roadmap as V1 feature                               |
| 3   | NMR benchmark suite (5 molecules)      | Vitest benchmarks with fixture data                     | Not implemented | **New** (MVP)             | Add benchmarks for validation — low effort, high value |
| 4   | Proton numbering overlay               | CIP-based diastereotopic H assignment                   | Not implemented | **New** (V1)              | Useful for assignment visualization                    |
| 5   | Analytical report HTML with print/PDF  | 865-line self-contained HTML generator                  | Not implemented | **New** (V1)              | Comprehensive report with spectra + properties         |
| 6   | JSON export (schema v1)                | Full analytical JSON payload                            | Not implemented | **Planned** (Epic 10, V1) | In roadmap                                             |
| 7   | CSV export (per-spectrum)              | Signal tables with metadata                             | Not implemented | **Planned** (Epic 10, V1) | In roadmap                                             |
| 8   | NMR mixture analyzer (Python)          | 838 lines, 7 modules, peak detection + library matching | Not in Kendraw  | **V2+**                   | Research tool, not MVP/V1 priority                     |

## Editor / Drawing Features

| #   | Feature                                                       | Draw-molecules                          | Kendraw Status | Classification | Notes                          |
| --- | ------------------------------------------------------------- | --------------------------------------- | -------------- | -------------- | ------------------------------ |
| 9   | Constraints-aware drawing (angles sp/sp2/sp3)                 | 1120 lines with steric/valence/geometry | **Done**       | Done           | packages/constraints/          |
| 10  | Bond types (single→aromatic, wedge, dash, wavy, bold, dative) | 10+ types                               | **Done**       | Done           | scene/types.ts has full enum   |
| 11  | Ring templates (cyclopropane→cyclohexane + benzene)           | 5 templates (3-6 membered)              | **Done**       | Done           | scene/rings.ts has 8 templates |
| 12  | Structure cleanup (coordinate regeneration)                   | OCL inventCoordinates()                 | **Done**       | Done           | constraints/engine/            |

## Chemical Analysis Features

| #   | Feature                                     | Draw-molecules               | Kendraw Status     | Classification   | Notes                                 |
| --- | ------------------------------------------- | ---------------------------- | ------------------ | ---------------- | ------------------------------------- |
| 13  | LogP (partition coefficient)                | Via OpenChemLib              | Not implemented    | **New** (V1)     | Requires RDKit.js or backend endpoint |
| 14  | TPSA (topological polar surface area)       | Via OpenChemLib              | Not implemented    | **New** (V1)     | Same as LogP — add to compute service |
| 15  | Lipinski Rule of Five                       | 4-criteria checker           | Not implemented    | **New** (V1)     | Easy to add once LogP/TPSA exist      |
| 16  | Stereocenter CIP R/S detection              | Via OpenChemLib CIP          | Placeholder exists | **Planned** (V1) | backend/kendraw_chem/stereo.py stub   |
| 17  | Mass spec adducts ([M+H]+, [M+Na]+, [M-H]-) | 3 adduct calculations        | Not implemented    | **New** (V1)     | Simple MW arithmetic — low effort     |
| 18  | Elemental analysis (% composition)          | Formula → mass % per element | Partial            | **New** (V1)     | chem/formula.ts has formula but not % |
| 19  | Degree of unsaturation (IHD/DBE)            | (2C+2+N+P-H-X)/2 formula     | Not implemented    | **New** (MVP)    | Trivial to add to PropertyPanel       |

## Export / Import Features

| #   | Feature                 | Draw-molecules      | Kendraw Status | Classification | Notes               |
| --- | ----------------------- | ------------------- | -------------- | -------------- | ------------------- |
| 20  | MOL V2000 import/export | Via OCL             | **Done**       | Done           | io/mol-v2000.ts     |
| 21  | SMILES import           | Parser              | **Done**       | Done           | io/smiles-parser.ts |
| 22  | CDXML import            | Parser              | **Done**       | Done           | io/cdxml-parser.ts  |
| 23  | SVG export              | Publication-quality | **Done**       | Done           | renderer-svg/       |
| 24  | PNG export              | Canvas rendering    | **Done**       | Done           | PropertyPanel.tsx   |

---

## Recommendations

### Add to MVP (low effort, high value)

1. **IHD/DBE calculation** — 10 lines of code in PropertyPanel, teaches fundamental concept
2. **NMR benchmark fixtures** — Validate prediction accuracy against known molecules

### Add to V1 (medium effort)

3. **LogP + TPSA + Lipinski** — Add to backend compute service, display in PropertyPanel
4. **Mass spec adducts** — Simple [M+H]+, [M+Na]+, [M-H]- in PropertyPanel
5. **Elemental analysis %** — Extend existing formula.ts
6. **Analytical HTML report** — Self-contained report with spectra + properties
7. **Proton numbering overlay** — Visual assignment on canvas
8. **Solvent corrections** — 6 solvents with per-environment offsets

### Defer to V2+

9. **NMR mixture analyzer** — Research-grade feature, not educational MVP
10. **Full SpinSystem simulation** — Requires external nmr-simulation library

---

## Architecture Impact

Features 1-2 (solvents, multiplicity) are already planned in the NMR epics.
Features 3-7 (LogP, TPSA, Lipinski, adducts, elemental %) can be added as a new
"Chemical Properties" epic with 2-3 stories extending the existing compute service.
Feature 8 (report) is a standalone epic.
