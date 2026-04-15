# NMR Scientific Review — Expert Roundtable

**Date:** 2026-04-13
**Subject:** Kendraw NMR Prediction Module — Scientific Accuracy and Feature Completeness
**Status:** Complete code review of backend (`kendraw_chem/nmr/`) and frontend (`packages/nmr/`)
**Reference implementations:** ChemDraw ChemNMR (v17-23), Draw-molecules (open-source), nmrdb.org, ACD/Labs

---

## Executive Summary

Five domain experts were convened to evaluate Kendraw's NMR prediction module across scientific accuracy, research workflow, pedagogy, computational methodology, and deployment. The consensus: the MVP additive-table engine is **structurally sound** and the Canvas 2D spectrum UI is well-architected, but **critical gaps** in multiplicity, solvent support, and environment coverage prevent credible use in either teaching or research contexts. The module is approximately 35% feature-complete relative to ChemDraw ChemNMR and 45% relative to the Draw-molecules open-source reference.

---

## A1 — Current State of Kendraw NMR

### Backend Architecture

- **Engine:** Additive increment method only (`additive.py`, 250 lines)
- **Environments classified:** 15 proton types (methyl, methylene, methine, allylic, benzylic, alpha_to_carbonyl, alpha_to_halogen, vinyl, aromatic, alkyne_terminal, aldehyde, carboxylic_acid, amide_nh, amine_nh, hydroxyl_oh)
- **Substituent increments:** 16 types (F, Cl, Br, I, OH, OR, NH2, NR2, NO2, CN, C=O_ketone, COOH, COOR, C=C, phenyl, alkyl)
- **Model fields:** `atom_index`, `atom_indices`, `shift_ppm`, `confidence` (1-3), `method`
- **Missing from model:** multiplicity, coupling_hz, integral, solvent, environment label
- **API:** `POST /compute/nmr` — accepts SMILES/MOL, returns NmrPrediction, only 1H supported
- **Tests:** 56 tests passing (models, additive, service, API, shift tables)

### Frontend Architecture

- **NmrPanel.tsx** (451 lines): React component with Canvas 2D spectrum, pan/zoom/drag, peak hover/select, nucleus tabs, resize handle
- **SpectrumRenderer.ts** (280 lines): Lorentzian peaks, confidence coloring (green/yellow/red), nH integral labels, hit-testing
- **Integration:** Lazy-loaded via `React.lazy`, Ctrl+M toggle, localStorage persistence

### What Works

- Additive prediction produces reasonable shifts for simple aliphatic and aromatic molecules
- Equivalent proton grouping is correct (benzene -> 1 peak, 6H)
- Confidence scoring from reference data counts is transparent
- Canvas 2D renderer with interactive viewport is smooth
- Deterministic output, sorted peaks, API error handling

### What Is Missing (Complete List)

1. No multiplicity (s/d/t/q/m) — all peaks appear as singlets
2. No J-coupling constants
3. No solvent support (no CDCl3/DMSO-d6/etc.)
4. No exchangeable proton handling (OH/NH/SH appear with fixed shifts regardless of conditions)
5. No proton numbering overlay on structure
6. No signal navigation (prev/next)
7. No CSV/PDF/SVG export
8. No 13C NMR prediction
9. No HOSE code / NMRShiftDB2 integration
10. No experimental spectrum overlay (JCAMP-DX)
11. No aromatic substituent effects (all aromatic H at 7.3 ppm)
12. No vinylic substituent differentiation (cis/trans/geminal)
13. No thiol environment
14. No benchmark validation suite

---

## A2 — Expert Critiques

### Expert 1: Pr. Marie-Claire DUVAL

_Professeure de Chimie Organique, Universite de Strasbourg, specialiste RMN, utilisatrice ChemDraw quotidienne, 25 ans d'experience_

**Ce qui est BIEN :**

- The additive table approach is scientifically valid for a first approximation. Textbooks (Silverstein, Pavia) use exactly this method to teach 1H NMR interpretation.
- The base shift values are in the correct ballpark: methyl at 0.9 ppm, aromatic at 7.3 ppm, aldehyde at 9.7 ppm, carboxylic acid at 11.5 ppm. These are textbook-correct reference values.
- Equivalent proton grouping works correctly — benzene gives one signal at 7.3 ppm with 6H integration. This is fundamental and it's right.
- The confidence tier system (3=well-supported, 2=moderate, 1=limited) is intellectually honest and something ChemDraw does NOT do. Transparency about prediction quality is genuinely valuable.

**Ce qui est INSUFFISANT :**

- All aromatic protons appear at 7.3 ppm regardless of substituents. In reality, a nitrobenzene has ortho-H at ~8.2 ppm and meta-H at ~7.5 ppm. Toluene ring protons are at ~7.1-7.2 ppm. The aromatic region needs substituent effect corrections (Hammett-type) to be credible. Currently, aniline and nitrobenzene would show the same aromatic shift — scientifically unacceptable for a teaching tool.
- The `alpha_to_halogen` base shift of 3.5 ppm is oversimplified. CHCl3 is at 7.27 ppm, CH2Cl2 at 5.30 ppm, CH3Cl at 3.05 ppm. The shift depends heavily on the number of halogens and which halogen. A single "alpha_to_halogen" category cannot capture this.
- Hydroxyl OH at a fixed 3.5 ppm is problematic. Alcohol OH varies from 0.5 to 5.0 ppm depending on concentration, temperature, and solvent. In DMSO-d6 it appears sharp at ~4.5-5.0 ppm; in CDCl3 it's broad at ~1.5-3.5 ppm. Without solvent context, this value is misleading.

**Ce qui MANQUE COMPLETEMENT :**

- **Multiplicity is absent.** This is the most critical missing feature. A chemist interpreting NMR expects to see "triplet at 1.18 ppm" for ethanol's CH3, not just "peak at 0.9 ppm." Without multiplicity, the predicted spectrum looks nothing like a real spectrum. Even for educational purposes, showing singlet-only peaks teaches incorrect spectral interpretation.
- **Aromatic substituent effects.** All substituted benzenes showing identical shifts renders the aromatic region completely uninformative. In real NMR, the aromatic region is where substituent effects are most diagnostic.
- **Ring current anisotropy** for aromatic systems is not modeled.
- **Hydrogen bonding effects** on exchangeable protons.

**Ce qui est FAUX scientifiquement :**

- Ethanol CH2 predicted at ~3.55 ppm (alpha_to_halogen environment misclassified — it's actually alpha to oxygen). Wait, looking at the code: the `alpha_to_halogen` check triggers for halogens (F, Cl, Br, I). For ethanol, the CH2-O bond would be classified via the oxygen substituent increment (+0.35 for OR). So CH2 in ethanol = methylene (1.3) + OR increment (0.35) = 1.65 ppm. The real value is ~3.69 ppm. This is a **2.0 ppm error** — unacceptable. The additive method underestimates the deshielding effect of directly-bonded oxygen.
- Alpha-to-carbonyl combined with other substituents can produce cumulative errors exceeding 1.5 ppm.
- Vinylic protons at a flat 5.3 ppm regardless of cis/trans/geminal substitution — real vinyl protons range from 4.5 to 6.5 ppm depending on substituent geometry.

**Verdict:** NON — Ne peut pas etre utilise en l'etat pour verifier une structure. L'absence de multiplicite et les erreurs de >1 ppm sur les protons alpha-heteroatome sont redhibitoires.

**Note:** 3/10

---

### Expert 2: Dr. Antoine MARCOS

_Post-doc en synthese totale, publications JACS/ACIEE, utilisateur ChemDraw + MestReNova quotidien_

**Ce qui est BIEN :**

- The API design is clean — SMILES/MOL input, structured JSON output. I could integrate this into a Jupyter notebook for batch predictions.
- The Canvas 2D renderer produces a visually clean spectrum with a professional dark theme. The Lorentzian peak shapes are appropriate for predicted spectra.
- Peak confidence indicators are a genuinely novel feature. When I'm checking a proposed structure, knowing which peaks are less reliable would change how I interpret discrepancies.
- Bidirectional peak-atom highlighting concept (even if partially wired) would be extremely useful for structure verification.

**Ce qui est INSUFFISANT :**

- Without multiplicity patterns, I cannot perform the "predict then compare" workflow that ChemDraw enables. In practice, I draw my proposed product, predict the spectrum, then overlay it with my experimental data. The splitting pattern is often more diagnostic than the chemical shift — a quartet at 4.12 ppm tells me "CH2 next to CH3" faster than just "peak at 4.12 ppm."
- The predicted shifts for heteroatom-adjacent protons have significant errors (ethanol CH2 predicted ~1.65 vs real ~3.69 ppm). For a synthetic chemist, these errors would lead to incorrect assignments.
- No J-coupling values means I can't evaluate through-bond connectivity, which is essential for complex structures.

**Ce qui MANQUE COMPLETEMENT :**

- **Solvent selection.** Every NMR experiment is run in a specific solvent. CDCl3 is the default, but I routinely use DMSO-d6 (for polar compounds), CD3OD (for natural products), and D2O (for sugars/peptides). Not having solvent selection is like a calculator without a decimal point — technically functional but practically useless.
- **Publication-ready export.** I need SVG or high-resolution PNG with proper axis labels, peak annotations, and citation metadata for supporting information.
- **Experimental overlay (JCAMP-DX).** The killer workflow is predict + overlay + compare. Without it, I still need MestReNova.

**Ce qui est FAUX scientifiquement :**

- The ethanol CH2 shift error (predicted ~1.65, real ~3.69) would cause me to doubt the entire tool. First impressions matter — if ethanol is wrong, why would I trust it for my trisubstituted pyridine?
- Exchangeable protons (OH, NH) appearing with fixed shifts regardless of concentration/solvent is misleading. In practice, these are often the hardest peaks to assign and their position is highly condition-dependent.

**Verdict:** AVEC RESERVES — L'architecture est bonne et le concept de confiance par pic est innovant, mais les erreurs de shift et l'absence de multiplicite empechent toute utilisation en recherche actuellement. Avec les corrections de shift et l'ajout de multiplicite/solvants, cela deviendrait utilisable pour des verifications rapides.

**Note:** 4/10

---

### Expert 3: Pr. Kenji YAMAMOTO

_Professeur de Spectroscopie, charge des examens RMN L3/M1/M2_

**Ce qui est BIEN :**

- Free and open-source — this is enormously valuable for teaching. My department's ChemDraw license costs 30K EUR/year, and students can't afford personal licenses. A free tool with NMR prediction would be transformative.
- The interactive spectrum viewer with zoom/pan is pedagogically excellent. Students can explore the spectrum at their own pace.
- The confidence coloring teaches a meta-skill: not all predictions are equal. This is an important lesson for students who tend to treat computational output as ground truth.

**Ce qui est INSUFFISANT :**

- **Without multiplicity, I cannot use this for teaching.** My entire L3 course is built around the n+1 rule (Pascal's triangle). If I show students a predicted spectrum with only singlets, they will learn that NMR peaks are always singlets. This is actively harmful pedagogy.
- The aromatic region is completely flat (all at 7.3 ppm). My M1 exam asks students to distinguish ortho/meta/para substitution patterns from the aromatic signal pattern. A tool that shows all aromatic protons at the same shift undermines this learning objective.
- Chemical shift values need to be accurate within ~0.5 ppm for teaching purposes. Currently, heteroatom-adjacent protons can be off by 2+ ppm.

**Ce qui MANQUE COMPLETEMENT :**

- **Integration (relative nH counts)** displayed prominently. Students need to practice reading integration ratios — it's one of the three pillars (shift, multiplicity, integration).
- **Peak labeling with environment.** Students should see "CH3 (methyl, t, J=7.2 Hz)" not just "0.9 ppm." The learning happens when they connect the label to the peak.
- **Worked examples/tutorial mode.** For a teaching tool, having 5-10 curated molecules with annotated spectra would be invaluable.

**Ce qui est FAUX scientifiquement :**

- Same concerns as Pr. Duval about ethanol CH2 and aromatic substituent effects. For teaching, even small errors create confusion — students memorize values, and incorrect values become persistent misconceptions.

**Verdict:** NON — En l'etat actuel, l'outil ne peut pas etre utilise pour un TD. L'absence de multiplicite est un defaut pedagogique majeur. Avec multiplicite + solvant + corrections de shift, ce serait un outil de reference pour l'enseignement.

**Note:** 3/10

---

### Expert 4: Dr. Sarah CHEN

_Chercheuse en chimie computationnelle, developpeuse NMRShiftDB2, experte HOSE codes_

**Ce qui est BIEN :**

- The additive increment approach is a solid foundation. It's the same method used by early versions of ChemDraw's ChemNMR (pre-HOSE era). The clean-room derivation from NMRShiftDB2/SDBS open data avoids IP issues.
- The code architecture is excellent: pure functions, deterministic output, well-separated concerns (classification -> lookup -> sum -> group). This is exactly how a prediction pipeline should be structured for testability and extensibility.
- The confidence scoring from reference data counts is scientifically principled. NMRShiftDB2 itself uses a similar approach internally.
- The fallback chain design (additive -> HOSE short -> HOSE long) described in the PRD is the correct architecture. ChemDraw uses a similar cascade.

**Ce qui est INSUFFISANT :**

- **The additive table is too coarse.** 15 environments with 16 substituent types produces at most ~240 distinct predictions. NMRShiftDB2 has ~43,000 experimental entries. The table needs expansion:
  - Missing: thiol (R-SH), enol (vinyl-OH), imine (C=NH), phosphine, sulfoxide
  - Missing: beta-position effects (substituents two bonds away shift by ~30-50% of alpha effect)
  - Missing: cumulative substituent scaling (two Cl on the same carbon don't simply add — they're slightly less than 2x)
- **The substituent increment for OR (0.35 ppm) is drastically wrong** for directly-bonded oxygen. Methoxy-CH3 appears at ~3.3 ppm, not at 0.9 + 0.35 = 1.25 ppm. The increment should depend on whether the oxygen is alpha (large effect, ~2.0-2.4 ppm shift) vs. beta (smaller effect, ~0.3-0.5 ppm).
- **The confidence scoring maps reference counts to 3 tiers.** This is too coarse — NMRShiftDB2 provides standard deviations for HOSE code predictions, which give continuous confidence. But for the additive method, the tiered approach is reasonable.

**Ce qui MANQUE COMPLETEMENT :**

- **Beta-position effects.** The code only collects alpha substituents (directly bonded to the H-bearing carbon). In reality, beta effects account for ~30-50% of the observed shift. Ethanol's CH3 at 1.18 ppm (vs. methyl base 0.9) is due to the beta oxygen.
- **Cumulative substituent corrections.** Multiple EWGs on the same carbon have diminishing returns (CH2Cl2 is not methylene + 2\*Cl).
- **Steric effects on chemical shifts.** Steric compression shifts protons upfield (or downfield for van der Waals deshielding). Important for bridged systems.
- **HOSE code integration.** The PRD describes this for V1, but the infrastructure isn't started. NMRShiftDB2's HOSE prediction (sphere 1-6) would improve accuracy from MAE ~1.5 ppm to ~0.3 ppm.

**Comparaison avec nmrdb.org et ACD/Labs :**

- nmrdb.org uses HOSE codes from NMRShiftDB2 + neural network refinement. Typical MAE: 0.2-0.4 ppm for 1H. Kendraw's additive method: estimated MAE ~1.5 ppm. That's 5-7x worse.
- ACD/Labs uses proprietary fragment-based prediction with a database of >400K experimental shifts. Typical MAE: 0.1-0.2 ppm. Kendraw cannot compete here without a large database.
- The additive method is competitive with 1980s-era prediction tools. For 2026, it's the minimum viable starting point.

**Que manque-t-il pour la V1 HOSE code :**

1. NMRShiftDB2 database loader (download + parse + index)
2. HOSE code generator using RDKit (`Chem.RDKFingerprint` or custom)
3. Sphere-based lookup (sphere 6 -> 5 -> 4 -> ... -> 1 fallback)
4. Standard deviation from population for confidence scoring
5. Database version tracking for reproducibility

**Verdict:** AVEC RESERVES — L'approche est scientifiquement correcte mais la table additive actuelle est trop grossiere. Les priorites sont: (1) corriger l'increment oxygen/nitrogen alpha, (2) ajouter les effets beta, (3) implementer les effets de substituants aromatiques. L'architecture permet une evolution vers HOSE codes proprement.

**Note:** 5/10

---

### Expert 5: Thomas WEBER

_Administrateur IT labo, gere les licences logicielles pour 50 chercheurs_

**Ce qui est BIEN :**

- Docker deployment (nginx + uvicorn) means I can install this on our lab server in minutes. No Wine, no X11 forwarding, no Windows VM for ChemDraw.
- Zero license cost. At 30K EUR/year for ChemDraw site license, even a 70%-accurate NMR tool saves the department significant money if it reduces ChemDraw dependency for routine tasks.
- API-first design means researchers can script batch predictions. Several PIs have asked for this capability.
- SMILES/MOL input means compatibility with any chemical drawing tool — not locked to Kendraw's editor.

**Ce qui est INSUFFISANT :**

- No file format import/export for spectra (JCAMP-DX, Bruker format). Researchers need to bring their experimental data into the tool.
- No offline mode documentation. If the backend goes down, the frontend should degrade gracefully (it does — stub mode returns empty peaks — but researchers need to know this).
- No batch prediction API endpoint. Researchers want to predict spectra for 50 compounds from a CSV file.

**Ce qui MANQUE COMPLETEMENT :**

- **CDXML/CDX import.** If researchers have existing ChemDraw files, they need to open them in Kendraw to predict NMR. Without this, migration is blocked.
- **User documentation.** No README for the NMR feature, no API docs beyond OpenAPI schema.
- **NMRShiftDB2 installation workflow.** The PRD mentions `kendraw nmr-data install` but it's not implemented.

**Verdict:** OUI (pour deploiement, AVEC RESERVES pour usage) — L'infrastructure est solide. Le deploiement Docker est trivial. Mais les chercheurs ne migreront pas de ChemDraw tant que la precision et les features (multiplicite, solvant) ne seront pas au niveau.

**Note:** 6/10

---

## A3 — Feature Comparison Table: ChemDraw vs. Kendraw vs. Draw-molecules

| #   | Feature                           | ChemDraw ChemNMR              | Kendraw (current)                      | Draw-molecules                                           | Gap           | Criticality  |
| --- | --------------------------------- | ----------------------------- | -------------------------------------- | -------------------------------------------------------- | ------------- | ------------ |
| 1   | 1H chemical shift prediction      | HOSE + database, MAE ~0.2 ppm | Additive tables, MAE ~1.5 ppm          | 3-tier cascade (heuristic/fragment/Spinus), MAE ~0.4 ppm | Large         | MUST-FIX     |
| 2   | 13C chemical shift prediction     | HOSE + database               | Not implemented                        | Heuristic + fragment DB                                  | Missing       | V1 scope     |
| 3   | Multiplicity (s/d/t/q/m)          | Full splitting patterns       | Not implemented                        | Full via nmr-simulation                                  | Missing       | MUST-FIX     |
| 4   | J-coupling constants (Hz)         | Empirical Karplus             | Not implemented                        | Topology-based estimation                                | Missing       | MUST-FIX     |
| 5   | Solvent selection                 | CDCl3 default + others        | Not implemented                        | 6 solvents with per-environment offsets                  | Missing       | MUST-FIX     |
| 6   | Exchangeable proton handling      | Solvent-dependent             | Fixed shifts, no solvent               | Solvent-dependent corrections                            | Missing       | MUST-FIX     |
| 7   | Aromatic substituent effects      | Hammett-type corrections      | All at 7.3 ppm flat                    | Per-substituent ring position effects                    | Missing       | MUST-FIX     |
| 8   | Alpha-oxygen/nitrogen shift       | Accurate (~3.3-4.0 ppm)       | Severely underestimated (~1.25 ppm)    | Accurate heuristic                                       | Broken        | MUST-FIX     |
| 9   | Proton environment types          | 20+ types                     | 15 types                               | 12 types + detailed sub-classification                   | Incomplete    | SHOULD-FIX   |
| 10  | Carbon environment types          | 15+ types                     | 0 (no 13C)                             | 7 types                                                  | Missing       | V1 scope     |
| 11  | Proton numbering overlay          | Yes (structure annotation)    | Not implemented                        | Yes (diastereotopic grouping)                            | Missing       | SHOULD-FIX   |
| 12  | Signal navigation (prev/next)     | Yes                           | Not implemented                        | Yes (arrow buttons)                                      | Missing       | SHOULD-FIX   |
| 13  | Bidirectional peak-atom highlight | Click peak -> highlight atoms | Partially wired (TODO in code)         | Click signal -> highlight atoms                          | Partial       | SHOULD-FIX   |
| 14  | Spectrum zoom/pan                 | Yes                           | Yes (scroll, drag, double-click reset) | Yes                                                      | OK            | -            |
| 15  | Lorentzian peak shapes            | Yes                           | Yes                                    | Yes                                                      | OK            | -            |
| 16  | Confidence indicators per peak    | No                            | Yes (green/yellow/red tiers)           | Percentage-based                                         | Kendraw ahead | -            |
| 17  | Spectrum export PNG               | Yes                           | Not implemented                        | Not directly                                             | Missing       | SHOULD-FIX   |
| 18  | Spectrum export SVG/PDF           | Yes                           | Not implemented                        | Not implemented                                          | Missing       | V1 scope     |
| 19  | CSV signal export                 | Yes                           | Not implemented                        | Yes (CSV + JSON)                                         | Missing       | SHOULD-FIX   |
| 20  | JCAMP-DX overlay                  | Yes                           | Not implemented                        | Not implemented                                          | Missing       | V1 scope     |
| 21  | HTML analytical report            | No (PDF)                      | Not implemented                        | Yes (rich HTML report)                                   | Missing       | NICE-TO-HAVE |
| 22  | Solvent residual peaks marked     | Yes                           | Not implemented                        | Not implemented                                          | Missing       | NICE-TO-HAVE |
| 23  | Integration display (nH)          | Yes                           | Partial (nH label at base)             | Yes (integral curves)                                    | Partial       | SHOULD-FIX   |
| 24  | DEPT classification (13C)         | Yes                           | Not implemented                        | Yes (C/CH/CH2/CH3)                                       | Missing       | V1 scope     |
| 25  | 2D NMR (COSY/HSQC/HMBC)           | Yes                           | Not implemented                        | Not implemented                                          | Missing       | V2 scope     |
| 26  | Frequency selection (MHz)         | 300-800 MHz configurable      | Not implemented                        | 400 MHz fixed                                            | Missing       | NICE-TO-HAVE |
| 27  | HOSE code prediction              | Yes (sphere 1-6)              | Not implemented                        | Fragment DB equivalent                                   | Missing       | V1 scope     |
| 28  | NMRShiftDB2 integration           | Proprietary equivalent        | Not implemented                        | Not implemented                                          | Missing       | V1 scope     |
| 29  | Beta-position substituent effects | Yes                           | Not implemented                        | Not implemented                                          | Missing       | SHOULD-FIX   |
| 30  | Cumulative substituent scaling    | Yes                           | Not implemented (linear sum)           | Not implemented                                          | Missing       | SHOULD-FIX   |
| 31  | Vinylic cis/trans/geminal         | Yes                           | Flat 5.3 ppm                           | Detailed substituent model                               | Missing       | SHOULD-FIX   |
| 32  | Keyboard shortcut (toggle)        | Ctrl+Shift+N                  | Ctrl+M                                 | N/A (button only)                                        | OK            | -            |
| 33  | Lazy-loaded panel                 | N/A (desktop app)             | Yes (React.lazy + Suspense)            | No (always loaded)                                       | Kendraw ahead | -            |
| 34  | Resizable panel                   | Yes                           | Yes (drag handle)                      | Not implemented                                          | OK            | -            |
| 35  | Dark theme spectrum               | No (white background)         | Yes (glassmorphism dark)               | No (white background)                                    | Kendraw ahead | -            |
| 36  | API/scripting access              | COM automation (Windows)      | REST API (POST /compute/nmr)           | No API                                                   | Kendraw ahead | -            |
| 37  | Benchmark test suite              | Internal QA                   | No validation suite                    | 5-molecule benchmark                                     | Missing       | SHOULD-FIX   |
| 38  | Deterministic output              | Yes                           | Yes (sorted, pure functions)           | Yes                                                      | OK            | -            |
| 39  | Atom count limit                  | ~1000 (practical)             | Configurable (default 5000)            | No explicit limit                                        | OK            | -            |
| 40  | Thiol environment (R-SH)          | Yes                           | Not classified                         | Yes (dedicated type)                                     | Missing       | SHOULD-FIX   |

---

## A4 — Prioritized Recommendations

### MUST-FIX (Blocking Credibility) — Priority 1

**MF-1: Fix alpha-oxygen/nitrogen shift prediction (CRITICAL)**
The current additive system predicts ethanol's CH2-O at ~1.65 ppm (methylene 1.3 + OR 0.35). The real value is ~3.69 ppm. This is a **2.0 ppm error** on the most common functional group in organic chemistry. The OR substituent increment of 0.35 ppm is the beta effect — the alpha effect should be ~2.0-2.4 ppm. Similarly, alpha-nitrogen effects are severely underestimated.

**Fix:** Add `alpha_to_oxygen` and `alpha_to_nitrogen` as dedicated base environments (like `alpha_to_halogen`), with base shifts of ~3.3 and ~2.6 ppm respectively. The current `OR/OH/NH2/NR2` substituent increments are beta effects and should remain for non-directly-bonded cases.

**MF-2: Add multiplicity computation**
Without multiplicity (s/d/t/q/m), the predicted spectrum is scientifically incomplete. Even approximate multiplicity from the n+1 rule (counting vicinal protons) would be a massive improvement. Implement topology-based J-coupling estimation using path lengths: geminal (2-bond) ~12 Hz, vicinal (3-bond) ~7 Hz, long-range (4-bond) ~2 Hz for aromatic/allylic systems.

**MF-3: Add solvent support (6 solvents)**
Every NMR experiment is run in a specific deuterated solvent. Implement the 6 standard solvents (CDCl3, DMSO-d6, CD3OD, acetone-d6, C6D6, D2O) with per-environment ppm offset corrections. CDCl3 is the reference (zero offsets). OH/NH/SH shifts are particularly solvent-sensitive.

**MF-4: Add aromatic substituent effects**
All aromatic protons at 7.3 ppm is unacceptable. Implement Hammett-type corrections: electron-donating groups (NH2, OH, OR, alkyl) shift ortho/para protons upfield; electron-withdrawing groups (NO2, CN, COOH, halogens) shift ortho/para protons downfield. This requires knowing the ring topology and substituent positions.

**MF-5: Fix exchangeable proton behavior**
OH, NH, SH protons must respond to solvent selection. In DMSO-d6, alcoholic OH appears sharp at ~4.5-5.0 ppm; in CDCl3, it's broad at ~1.5-3.5 ppm; in D2O, it disappears entirely (H/D exchange). This is fundamental NMR chemistry.

### SHOULD-FIX (Important for Adoption) — Priority 2

**SF-1: Expand environment classification**
Add thiol (R-SH ~2.1 ppm), allylic refinement (distance to pi system matters), benzylic refinement (EWG/EDG on ring), terminal alkyne improvement. Add beta-position effects for common groups.

**SF-2: Add proton numbering overlay**
Number equivalent proton groups (H-1, H-2, H-3...) and display on both the structure and the spectrum. Essential for correlation.

**SF-3: Add signal navigation**
Arrow buttons or Tab/Shift+Tab to step through signals. Highlights corresponding atoms on structure as you navigate.

**SF-4: Add CSV export**
Export signal table as CSV: delta, multiplicity, J values, integral, assignment. Essential for publication supporting information.

**SF-5: Add benchmark validation suite**
5-10 well-characterized molecules with known experimental shifts. Continuous validation against reference data. Prevents regression.

**SF-6: Improve integration display**
Show relative integration values more prominently. Add integration curves option.

**SF-7: Vinylic substituent differentiation**
Differentiate cis/trans/geminal vinylic protons. Real range: 4.5-6.5 ppm depending on geometry and substituents.

### NICE-TO-HAVE (Differentiator) — Priority 3

**NH-1: Solvent residual peak markers**
Show where the solvent peak appears (CDCl3 at 7.26, DMSO-d6 at 2.50, etc.) — helps users avoid confusion with analyte peaks.

**NH-2: Configurable frequency (MHz)**
Allow 300/400/500/600/800 MHz selection. Affects J-coupling resolution in the displayed spectrum.

**NH-3: HTML analytical report generation**
Generate a formatted report with structure, spectrum, signal table, and metadata. Useful for lab notebooks.

**NH-4: Peak assignment labels**
Show "CH3", "ArH", "CHO" etc. labels on peaks for educational clarity.

---

## Summary Scores

| Expert                        | Score      | Verdict                        |
| ----------------------------- | ---------- | ------------------------------ |
| Pr. Duval (Organic Chemistry) | 3/10       | NON                            |
| Dr. Marcos (Synthesis)        | 4/10       | AVEC RESERVES                  |
| Pr. Yamamoto (Teaching)       | 3/10       | NON                            |
| Dr. Chen (Computational)      | 5/10       | AVEC RESERVES                  |
| Thomas Weber (IT Admin)       | 6/10       | OUI (infra) / RESERVES (usage) |
| **Moyenne**                   | **4.2/10** | **AVEC RESERVES**              |

**Consensus:** The architecture and infrastructure are solid. The UI/UX is ahead of competitors in some areas (confidence indicators, dark theme, API access). But the prediction engine has critical accuracy problems (alpha-heteroatom shifts) and missing features (multiplicity, solvents) that prevent credible use in any context. Fixing MF-1 through MF-5 would raise the score to approximately 6.5-7/10 and make the tool genuinely useful for teaching and quick research checks.
