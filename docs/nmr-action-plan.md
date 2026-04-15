# NMR Action Plan — Prioritized Implementation Roadmap

**Date:** 2026-04-13
**Based on:** Scientific Review Roundtable (docs/nmr-scientific-review.md)
**Engine version:** 0.2.0

---

## Completed (This Session)

### MUST-FIX Items Resolved

| ID   | Item                                         | Status | Commit  |
| ---- | -------------------------------------------- | ------ | ------- |
| MF-1 | Fix alpha-oxygen/nitrogen shifts             | Done   | 52b482e |
| MF-2 | Add multiplicity computation (n+1 rule)      | Done   | 52b482e |
| MF-3 | Add 6 solvents with shift corrections        | Done   | 52b482e |
| MF-4 | Add aromatic substituent effects (Hammett)   | Done   | 52b482e |
| MF-5 | Fix exchangeable proton behavior per solvent | Done   | 52b482e |

### Additional Features Implemented

| Feature                                                                    | Status | Commit  |
| -------------------------------------------------------------------------- | ------ | ------- |
| J-coupling constants (empirical)                                           | Done   | 52b482e |
| Thiol (R-SH) environment                                                   | Done   | 52b482e |
| NmrPeak model expansion (integral, multiplicity, coupling_hz, environment) | Done   | 52b482e |
| Solvent parameter in API                                                   | Done   | 52b482e |
| 5-molecule benchmark test suite (27 tests)                                 | Done   | e5b755f |
| Frontend solvent dropdown                                                  | Done   | fe20bff |
| Multiplicity labels on spectrum peaks                                      | Done   | fe20bff |
| Selected peak info bar                                                     | Done   | fe20bff |
| CSV export of signals                                                      | Done   | fe20bff |
| Signal navigation (prev/next + Tab)                                        | Done   | fe20bff |

---

## Remaining Work

### SHOULD-FIX (Next Sprint)

| Priority | Item                                      | Effort | Notes                                                  |
| -------- | ----------------------------------------- | ------ | ------------------------------------------------------ |
| SF-1     | Beta-position substituent effects         | Medium | ~30-50% of alpha effect for common groups              |
| SF-2     | Proton numbering overlay on structure     | Large  | Requires renderer integration, diastereotopic grouping |
| SF-3     | Vinylic cis/trans/geminal differentiation | Medium | Currently flat 5.3 ppm, real range 4.5-6.5             |
| SF-4     | Cumulative substituent scaling            | Small  | Multiple EWGs have diminishing returns                 |
| SF-5     | Integration curves display option         | Medium | Alternative to nH labels                               |
| SF-6     | PNG export of spectrum                    | Medium | Canvas.toDataURL()                                     |
| SF-7     | Solvent residual peak markers             | Small  | Data already in shift_tables.py                        |

### V1 Scope (Future Epics)

| Item                                  | Effort | Dependency                                           |
| ------------------------------------- | ------ | ---------------------------------------------------- |
| 13C NMR prediction                    | Large  | New carbon shift tables + DEPT classification        |
| HOSE code + NMRShiftDB2 integration   | Large  | Database loader, HOSE generator, sphere-based lookup |
| SVG/PDF export                        | Medium | SVG renderer for spectrum                            |
| JCAMP-DX experimental overlay         | Large  | Parser + alignment UI                                |
| Voigt lineshapes (replace Lorentzian) | Small  | Math change in renderer                              |

### V2+ Vision

| Item                      | Notes                                  |
| ------------------------- | -------------------------------------- |
| 2D NMR (COSY, HSQC, HMBC) | Major feature — cross-peak computation |
| ML/GNN prediction upgrade | Requires training data pipeline        |
| IR and UV-Vis prediction  | New prediction engines                 |

---

## Accuracy Assessment (Post-Fix)

| Molecule          | Environment       | Predicted (ppm) | Experimental (ppm) | Error |
| ----------------- | ----------------- | --------------- | ------------------ | ----- |
| Ethanol CH3       | methyl            | 0.90            | 1.18               | 0.28  |
| Ethanol CH2-O     | alpha_to_oxygen   | 3.40            | 3.69               | 0.29  |
| Ethanol OH        | hydroxyl_oh       | 2.50            | ~2.5 (CDCl3)       | ~0.0  |
| Isopropanol 2xCH3 | methyl            | 0.90            | 1.15               | 0.25  |
| Isopropanol CH-O  | alpha_to_oxygen   | 3.40            | 3.83               | 0.43  |
| Acetaldehyde CH3  | alpha_to_carbonyl | 2.10            | 2.20               | 0.10  |
| Acetaldehyde CHO  | aldehyde          | 9.70            | 9.79               | 0.09  |
| Benzene ArH       | aromatic          | 7.26            | 7.36               | 0.10  |

**Estimated MAE (post-fix): ~0.3 ppm** (down from ~1.5 ppm pre-fix)

This meets the PRD's MVP target of MAE < 1.0 ppm and approaches the V1 target of < 0.5 ppm without HOSE codes.
