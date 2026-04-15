---
stepsCompleted:
  [
    'step-01-init',
    'step-02-discovery',
    'step-02b-vision',
    'step-02c-executive-summary',
    'step-03-success',
    'step-04-journeys',
    'step-05-domain',
    'step-06-innovation',
    'step-07-project-type',
    'step-08-scoping',
    'step-09-functional',
    'step-10-nonfunctional',
    'step-11-polish',
    'step-12-complete',
  ]
status: complete
completedAt: '2026-04-12'
classification:
  projectType: web_app
  domain: scientific
  complexity: medium
  projectContext: brownfield
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-kendraw-nmr.md'
  - '_bmad-output/planning-artifacts/product-brief-kendraw-nmr-distillate.md'
  - 'docs/prd-kendraw-2026-04-12.md'
  - 'docs/architecture-kendraw-2026-04-12.md'
  - 'docs/ux-design-kendraw-2026-04-12.md'
  - 'docs/chemdraw-technical-reference.md'
workflowType: 'prd'
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 4
---

# Product Requirements Document - Kendraw NMR Prediction

**Author:** Jean-Baptiste DONNETTE
**Date:** 2026-04-12

## Executive Summary

Kendraw NMR Prediction adds interactive 1H and 13C NMR spectrum prediction to the Kendraw molecular editor — the free, open-source alternative to ChemDraw. When Kendraw's V1 was scoped, NMR prediction was explicitly excluded. That changed in January 2025 when Revvity eliminated ChemDraw perpetual licenses and raised academic site-license pricing by approximately 500%. Universities are losing access to ChemNMR, and students cite NMR prediction as the #1 missing capability when switching to free alternatives. Free NMR prediction is now the single strongest migration argument from ChemDraw to Kendraw.

The feature targets two distinct audiences with different accuracy needs. For **educators and students**, MVP-level accuracy (MAE < 1.0 ppm via additive tables) is excellent — the goal is conceptual understanding of spectral regions. For **researchers**, the MVP provides a quick sanity check, with V1 (HOSE code + NMRShiftDB2, MAE < 0.5 ppm) delivering accuracy sufficient for routine structure verification of common organic molecules.

The implementation extends Kendraw's existing FastAPI + RDKit backend (operational since Sprint 0) with a new `/api/v1/compute/nmr` endpoint, and adds a dedicated resizable spectrum panel to the frontend. The phased approach — additive tables for MVP, HOSE code + optional NMRShiftDB2 data for V1, experimental overlay in late V1 — delivers value early while building toward ChemNMR-level capability.

### What Makes This Special

No other free tool combines a molecular editor, interactive NMR spectrum, and bidirectional atom-peak highlighting — the workflow that makes ChemNMR indispensable. Click a peak to see the atom, click an atom to see the peak. Kendraw adds what ChemDraw does not: **per-peak confidence indicators** (color-coded by prediction reliability) and **transparent method display** showing which algorithm produced each prediction. This turns a potential weakness (lower accuracy than commercial tools) into a trust advantage — the chemist always knows exactly how much to rely on each prediction.

Self-hosted, offline-capable, and MIT-licensed, Kendraw NMR works without cloud dependencies, institutional licenses, or IT involvement — a genuine differentiator for academic environments with restricted budgets and infrastructure.

## Project Classification

| Attribute       | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Project Type    | Web Application (React SPA + FastAPI backend)                         |
| Domain          | Scientific — computational chemistry                                  |
| Complexity      | Medium — validation methodology, accuracy benchmarks, reproducibility |
| Project Context | Brownfield — extends existing Kendraw editor with new feature module  |

## Success Criteria

### User Success

| Criterion                           | Target                                                                                                 | Measurement                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| Structure-to-spectrum workflow      | < 2 clicks from drawn molecule to visible predicted spectrum                                           | UX audit                   |
| Bidirectional highlighting response | < 100ms (feels instantaneous)                                                                          | Performance profiling      |
| "Aha moment" for teaching persona   | Student correctly identifies spectral region for a functional group using Kendraw prediction           | Beta testing at URD Abbaye |
| "Sanity check" for research persona | Researcher uses MVP prediction to quickly accept/reject a candidate structure before detailed analysis | Beta testing at URD Abbaye |
| Confidence clarity                  | Chemist can distinguish reliable predictions (green) from uncertain ones (red) at a glance             | User testing               |

### Business Success

| Metric              | 3-month target                                                                     | 12-month target                                            |
| ------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| URD Abbaye adoption | > 50% of lab members using NMR prediction at least 2x/week                         | Standard tool for all new lab members                      |
| GitHub engagement   | 10+ NMR-related issues from external users                                         | External code contributions to NMR module                  |
| Organic awareness   | First mentions of "Kendraw NMR" on ResearchGate/Twitter-X/chemistry forums         | Kendraw appears in "free NMR tools" recommendation threads |
| Migration signal    | At least 1 department evaluates Kendraw as ChemDraw replacement citing NMR feature | Multiple institutional evaluations                         |

### Technical Success

| Criterion                                     | Target                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| 1H prediction accuracy (MVP, additive tables) | MAE < 1.0 ppm on benchmark set of common aliphatic/simple aromatic molecules |
| 1H prediction accuracy (V1, HOSE code)        | MAE < 0.5 ppm on same benchmark set                                          |
| Prediction response time                      | < 300ms for molecules up to 500 atoms                                        |
| Spectrum panel render                         | < 100ms initial render, < 16ms interaction updates (60fps)                   |
| Backend availability                          | NMR endpoint follows existing compute endpoint reliability patterns          |
| Reproducibility                               | Identical input always produces identical output (deterministic predictions) |
| Benchmark validation                          | Published accuracy report against SDBS or NMRShiftDB2 holdout test set       |

### Measurable Outcomes

- **MVP launch:** A PhD student at URD Abbaye draws a molecule, predicts 1H NMR, sees a confidence-colored spectrum, clicks a peak, sees the atom highlighted — and says "this is useful" rather than "this is wrong"
- **V1 launch:** Same researcher runs the HOSE code prediction on their latest synthesis product, overlays the experimental JCAMP-DX file, and uses it to confirm structure — replacing what would have required ChemDraw
- **12-month outcome:** "Free NMR prediction in Kendraw" is a known talking point in organic chemistry academic circles

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — deliver the minimum that makes a chemist say "this is useful for a quick check." The MVP proves that free, integrated NMR prediction with bidirectional highlighting is worth using, even at approximate accuracy. Learning goal: do chemists actually use the prediction regularly, or is the accuracy too low to be actionable?

**Resource Requirements:** Single developer (JB) with chemistry domain expertise. Backend (Python/FastAPI/RDKit) and frontend (React/Canvas) skills required. No additional team members needed for MVP.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

- Journey 1 (Elise — research happy path): partial — prediction + highlighting works, no experimental overlay yet
- Journey 2 (Marc — teaching happy path): fully supported — predict, explore, export
- Journey 3 (Elise — edge case): fully supported — confidence indicators communicate limitations
- Journey 4 (Thomas — deployment): partial — Docker works out of the box, HOSE upgrade path is V1

**Must-Have Capabilities:**

| Capability                                     | Rationale                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| 1H prediction (additive tables)                | Core value — without this, nothing works                                      |
| Interactive spectrum panel (bottom, resizable) | The visualization surface — users need to see the spectrum                    |
| Bidirectional click highlighting               | THE differentiator — without this, we're just a worse nmrdb.org               |
| Per-peak confidence indicators                 | Trust mechanism — without this, first bad prediction kills adoption           |
| Confidence tooltips with method explanation    | Transparency — turns limitations into an honest feature                       |
| PNG export                                     | Publication workflow — chemists need to get the spectrum into their documents |
| `POST /api/v1/compute/nmr` endpoint            | Backend prediction service following existing patterns                        |

**Explicitly Deferred from MVP:**

- 13C prediction (V1)
- Multiplicity/J-coupling (V1)
- HOSE code + NMRShiftDB2 (V1)
- Experimental overlay (late V1)
- SVG/PDF/CSV export (V1)
- 2D NMR, manual assignment (V2)

### Post-MVP Features

**Phase 2 — V1 (Growth):**

| Feature                       | Value                                                                            | Dependency                                            |
| ----------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 13C prediction                | Completes the NMR story — 13C is the second most-used nucleus                    | Additive tables for 13C (new table set)               |
| 1H multiplicity + J-coupling  | Makes spectra look real — singlets-only is visually wrong to trained chemists    | Karplus equation implementation                       |
| DEPT for 13C                  | Standard analysis technique, expected by researchers                             | 13C prediction                                        |
| HOSE code + NMRShiftDB2       | Accuracy upgrade from ~1 ppm to ~0.5 ppm — crosses the research-useful threshold | NMRShiftDB2 data pipeline, license-compliant download |
| SVG/PDF/CSV export            | Publication-grade output formats                                                 | Spectrum renderer                                     |
| JCAMP-DX experimental overlay | Closes the core research workflow (predict → compare → confirm)                  | JCAMP-DX parser                                       |

**Phase 3 — V2 (Expansion):**

- 2D NMR spectra (COSY, HSQC, HMBC) — extends into advanced spectroscopy
- Automatic peak alignment on overlays — automated comparison workflow
- Manual peak assignment mode — expert-level analysis
- ML/GNN prediction models — next-generation accuracy
- IR and UV-Vis prediction — complete free spectroscopy toolkit

### Risk Mitigation Strategy

**Technical Risks:**

| Risk                                                          | Likelihood | Impact                       | Mitigation                                                                                                                         |
| ------------------------------------------------------------- | ---------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Additive table accuracy worse than ~1 ppm on common molecules | Medium     | High — kills MVP credibility | Build benchmark test set of 20 molecules FIRST. Run accuracy validation before building UI. If MAE > 1.5 ppm, reconsider approach. |
| Spectrum panel performance issues (Canvas rendering at 60fps) | Low        | Medium                       | Kendraw already has a Canvas 2D renderer — reuse patterns. Profile early with 50+ peaks.                                           |
| Additive table IP risk (copyrighted textbook data)            | Medium     | High — legal exposure        | Derive tables from NMRShiftDB2 experimental data or published open-access papers. Never copy Pretsch/Silverstein tables directly.  |

**Market Risks:**

| Risk                                         | Likelihood | Impact | Mitigation                                                                                                                                   |
| -------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Revvity responds with free ChemNMR tier      | Low-Medium | High   | Ship fast while the pricing backlash is hot. Build durable value (transparency, open-source) that survives a price cut.                      |
| nmrdb.org adds bidirectional highlighting    | Low        | Medium | Being integrated into a full editor (not a standalone web tool) is the deeper moat. Ship first.                                              |
| Chemists dismiss ~1 ppm accuracy as unusable | Medium     | High   | Confidence indicators + honest communication manage expectations. Teaching persona validates MVP immediately. Research persona waits for V1. |

**Resource Risks:**

| Risk                                        | Mitigation                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Solo developer — bus factor of 1            | Open-source from day 1. Clean architecture, documented prediction engine. Community can contribute. |
| Scope creep from MVP to V1                  | Strict phase gates. MVP ships and gets user feedback before V1 development starts.                  |
| NMRShiftDB2 data pipeline complexity for V1 | Defer to V1. MVP works with zero external data dependencies.                                        |

## User Journeys

### Journey 1: Elise Confirms a Synthesis Product (Research — Happy Path)

**Elise**, 27, is a 3rd-year organic synthesis PhD student at URD Abbaye. She just finished a 6-step synthesis of a substituted benzamide — her first novel compound for her thesis. She ran the 1H NMR on the lab's Bruker 400 MHz this morning and has the experimental spectrum open in MestReNova.

**Opening Scene:** Elise draws her expected product structure in Kendraw. She has 12 protons across 4 distinct environments — two aromatic doublets, an amide NH, and a methyl singlet. She clicks "Predict NMR" (Ctrl+N).

**Rising Action:** The spectrum panel slides open below the canvas. In under 300ms, a predicted 1H spectrum appears with Lorentzian peaks. She sees 4 clusters of peaks at roughly the positions she expected. Three peaks are green (high confidence — simple aliphatic and monosubstituted aromatic environments), one is yellow (the amide NH — environment-sensitive, confidence is moderate).

**Climax:** Elise clicks the peak at 7.8 ppm on the spectrum — and the ortho-aromatic proton on her structure highlights instantly. She clicks the next peak, the methyl group lights up. This is the bidirectional link she used to have with ChemDraw. She compares against her experimental spectrum side-by-side (in V1, she'll overlay them directly). The predicted shifts are within 0.5 ppm of experimental for all four environments. Her structure is confirmed.

**Resolution:** Elise exports the predicted spectrum as PNG and includes it alongside her experimental spectrum in her thesis chapter draft. She didn't need ChemDraw. She didn't need to ask her advisor for a license. She opened Kendraw, drew, predicted, confirmed — done.

**Requirements revealed:** NMR prediction endpoint, spectrum panel rendering, bidirectional highlighting, per-peak confidence display, PNG export, performance < 300ms.

### Journey 2: Marc Prepares a Spectroscopy Exercise (Teaching — Happy Path)

**Marc**, 45, teaches organic spectroscopy to 2nd-year master's students at a French university. His department dropped ChemDraw last year after the price hike. He's preparing a TD (travaux dirigés) where students must identify unknown structures from NMR spectra.

**Opening Scene:** Marc draws 5 molecules of increasing complexity in Kendraw: ethanol, toluene, ethyl acetate, 4-nitroaniline, and aspirin. For each, he clicks Predict NMR.

**Rising Action:** He quickly generates 5 predicted 1H spectra. For the teaching context, the ~1 ppm accuracy is perfect — students need to learn that methyl groups appear around 0.9-1.5 ppm and aromatic protons around 6.5-8.5 ppm. Marc notices the confidence indicators: ethanol and toluene are all green, aspirin has a yellow peak for the carboxylic acid proton. Good — he can use this to teach students about when predictions are more or less reliable.

**Climax:** Marc clicks on the aromatic peaks of 4-nitroaniline and watches the corresponding atoms highlight on the structure. He screenshots each molecule-spectrum pair. He realizes he can build the exercise backwards: show students the spectrum, ask them to draw the structure, then reveal the answer with the bidirectional highlighting.

**Resolution:** Marc exports all 5 spectra as PNGs and pastes them into his LaTeX exercise document. His students will install Kendraw on their personal laptops to practice — no departmental license needed. He posts the exercise with a note: "Use Kendraw (free, open-source) to check your answers."

**Requirements revealed:** Multi-molecule workflow (predict, export, repeat), PNG export, confidence indicators as teaching tool, low-friction student installation.

### Journey 3: Elise Hits a Low-Confidence Prediction (Research — Edge Case)

**Elise** is now working on a more complex molecule: a trisubstituted pyridine with an intramolecular hydrogen bond between an ortho-hydroxyl and the pyridine nitrogen.

**Opening Scene:** She draws the structure and clicks Predict NMR. The spectrum appears, but this time two peaks are red (low confidence) and one is yellow.

**Rising Action:** Elise hovers over a red peak — a tooltip shows "Additive table fallback — limited reference data for this chemical environment." She knows this means the prediction may be off by more than 1 ppm for this peak. The intramolecular hydrogen bond shifts the OH proton dramatically, and the additive table can't capture that.

**Climax:** Elise doesn't dismiss Kendraw. She sees that the non-hydrogen-bonded peaks (green, high confidence) match her experimental spectrum well. The red peaks alert her to where the prediction is unreliable — which is exactly where her experimental spectrum differs most. The transparency helps rather than hurts: she now knows which parts of her spectrum are unusual and worth investigating further.

**Resolution:** Elise notes in her lab notebook that the OH and ortho-aromatic shifts require closer analysis (possibly literature comparison or DFT calculation). Kendraw didn't solve this edge case, but it told her honestly where it couldn't help — and that's more useful than a silent wrong answer.

**Requirements revealed:** Confidence indicator tooltips with method explanation, graceful degradation messaging, honest failure communication, per-peak method display.

### Journey 4: Lab Admin Deploys Kendraw with NMR Data (Operations)

**Thomas**, 35, is the IT administrator for URD Abbaye. The lab director asks him to deploy Kendraw on the department's server so all researchers can access it.

**Opening Scene:** Thomas pulls the Kendraw Docker image and runs `docker-compose up`. The frontend and backend containers start. NMR prediction works immediately with additive tables — no extra setup required.

**Rising Action:** The lab director mentions that researchers want better accuracy. Thomas runs `kendraw nmr-data install` which downloads the NMRShiftDB2 data (~50-100 MB) into the persistent data volume. He restarts the backend container. HOSE code predictions are now available.

**Climax:** Thomas checks the health endpoint — `/api/v1/health` reports NMR service as operational with HOSE code mode. He runs a quick test: `curl -X POST /api/v1/compute/nmr` with a simple SMILES string. JSON response comes back in 180ms with predicted shifts and confidence scores. Everything works.

**Resolution:** Thomas adds the NMR data download to his deployment script so future server rebuilds include it automatically. No license to manage, no keys to rotate, no subscription to renew. One less thing on his plate.

**Requirements revealed:** Docker deployment, optional NMR data download CLI, health endpoint with NMR status, stateless backend (no persistent sessions), data volume management.

### Journey Requirements Summary

| Capability                                 | Journeys   | Priority |
| ------------------------------------------ | ---------- | -------- |
| NMR prediction endpoint (additive tables)  | 1, 2, 3, 4 | MVP      |
| Interactive spectrum panel                 | 1, 2, 3    | MVP      |
| Bidirectional atom-peak highlighting       | 1, 2, 3    | MVP      |
| Per-peak confidence indicators (color)     | 1, 2, 3    | MVP      |
| Confidence tooltip with method explanation | 3          | MVP      |
| PNG spectrum export                        | 1, 2       | MVP      |
| Docker deployment with NMR support         | 4          | MVP      |
| HOSE code + NMRShiftDB2 prediction         | 1, 4       | V1       |
| Optional NMR data download CLI             | 4          | V1       |
| Health endpoint NMR status                 | 4          | V1       |
| JCAMP-DX experimental overlay              | 1          | Late V1  |

## Domain-Specific Requirements

### Validation Methodology

- **Benchmark test set:** Define a standard set of molecules (20-50) with known experimental 1H and 13C shifts from published sources (SDBS, NMRShiftDB2 holdout). Run predictions against this set and publish MAE results.
- **Molecule class coverage:** Benchmark must include aliphatic chains, simple aromatics, heteroaromatics, carbonyl-adjacent protons, and at least 3 hydrogen-bonding cases — to honestly expose where additive tables fail.
- **Regression testing:** Every change to the prediction engine must re-run the benchmark set. MAE must not regress beyond a defined tolerance (e.g., +0.05 ppm).
- **Published accuracy report:** Ship an accuracy report with each release (markdown in docs/) showing benchmark results by molecule class. This is a credibility requirement — chemists trust tools they can verify.

### Reproducibility

- **Deterministic predictions:** Same molecular input (SMILES, MOL, CDXML) must always produce identical shift values and confidence scores. No stochastic elements in the prediction pipeline.
- **Method provenance:** Each prediction response must include the method used per atom (additive table, HOSE code N-sphere, fallback) so results are explainable and reproducible by others.
- **Version pinning:** Prediction results must be tagged with the prediction engine version and NMRShiftDB2 data version, so a chemist can cite "Kendraw NMR v1.2, NMRShiftDB2 2026.1" in a publication.

### Accuracy & Computational Constraints

- **Graceful degradation chain:** HOSE code long sphere → short sphere → additive table. Each step is transparent to the user. No silent accuracy drops.
- **Molecule size cap:** Respect existing `KENDRAW_MAX_MOL_ATOMS` (default 5000). NMR prediction may set a lower practical limit (~500 atoms) for performance reasons — document and enforce.
- **Response time budget:** < 300ms for molecules up to 500 atoms, consistent with existing backend performance targets (FR-021 AC4 from main PRD).
- **Memory footprint:** NMRShiftDB2 data loaded in memory must not exceed a defined ceiling (~200 MB) to keep the backend container lightweight.

### Licensing & IP

- **Additive shift tables:** Must be derived from open-access literature or computed from NMRShiftDB2 experimental data. No direct encoding of copyrighted textbook tables (Pretsch, Silverstein) without clean-room derivation.
- **NMRShiftDB2 (CC-BY-SA 3.0):** Distributed as a separate optional download, not bundled in the MIT-licensed Docker image. Attribution must be displayed when HOSE code predictions use NMRShiftDB2 data.
- **All prediction code:** MIT licensed, consistent with the rest of Kendraw.

### Publication Support

- **Simulation conditions:** Spectrometer frequency configurable at 300, 400 (default), 500, 600, and 800 MHz. Frequency affects J-coupling appearance and peak separation in the rendered spectrum. Selected frequency is displayed on the spectrum and included in all exports.
- **Standard data formats:** Predicted spectra exportable in formats chemists actually use for publications — PNG/SVG for figures, CSV for supplementary data tables.
- **Citation-ready metadata:** Export includes molecule identifier (SMILES, InChI), prediction method, engine version, data source, and simulation frequency — sufficient for a methods section in a chemistry paper.

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Transparency-first prediction (novel UX pattern)**
No existing NMR prediction tool — free or commercial — shows the user how confident each prediction is or which method produced it. ChemDraw ChemNMR gives a number with no error bar, no explanation, no reliability signal. Kendraw's per-peak confidence indicators and method provenance display are genuinely new. This inverts the typical "black box accuracy" approach into "transparent approximate prediction" — a fundamentally different trust model for scientific software.

**2. Bidirectional highlighting in a free integrated editor (market-first)**
While ChemDraw offers bidirectional atom-peak highlighting, no free or open-source tool replicates this. nmrdb.org has partial atom-to-peak hover, but not the full bidirectional click interaction integrated into a molecular editor. This is the first time this workflow is available without a paid license.

**3. Graceful degradation as a feature (architectural innovation)**
The additive table → HOSE short sphere → HOSE long sphere chain isn't just a fallback strategy — it's designed to be visible to the user. Each prediction level is labeled, colored, and explained. This means the tool is useful at every accuracy tier and honest about its limits. Most scientific software hides its uncertainty; Kendraw displays it.

### Market Context & Competitive Landscape

The web_app innovation signal "New interaction" maps directly to the bidirectional highlighting pattern. The "transparency-first" approach has no direct competitor — it's a positioning choice that turns Kendraw's lower accuracy (vs. commercial tools) from a weakness into a differentiated strength.

### Validation Approach

- **Transparency UX:** User test with 5+ chemists at URD Abbaye — do confidence indicators change how they interpret and trust predictions? Do they prefer visible uncertainty over hidden uncertainty?
- **Bidirectional highlighting:** A/B test or qualitative comparison — how does the structure confirmation workflow compare to using nmrdb.org (no highlighting) and ChemDraw (highlighting but no confidence)?
- **Graceful degradation:** Track how often users with NMRShiftDB2 installed see fallback predictions. If > 20% of peaks fall back to additive tables for common molecules, the HOSE coverage needs improvement.

### Risk Mitigation

| Innovation                 | Risk                                                                                                 | Mitigation                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Transparency-first         | Chemists may interpret red/yellow confidence as "this tool is bad" rather than "this tool is honest" | Onboarding tooltip explaining the color system; curated first-run example with mixed confidence |
| Bidirectional highlighting | Technically simple — competitors could replicate quickly                                             | Speed to market matters; being first and free builds brand recognition before competitors react |
| Graceful degradation       | Two-tier experience confuses users who don't understand why accuracy differs                         | In-app prompt on first NMR prediction explaining the optional database download                 |

## Web Application Specific Requirements

### Project-Type Overview

Kendraw is an existing SPA (React 18 + Vite + TypeScript). The NMR feature adds a new UI surface (spectrum panel) and a new backend endpoint to the established architecture. No fundamental web app decisions change — the feature inherits the existing browser matrix, responsive design system, and performance framework.

### Browser Support

Inherits existing Kendraw browser matrix. NMR-specific consideration: the spectrum panel renderer (Canvas 2D or D3.js) must work across all supported browsers. Canvas 2D is universally supported. If D3.js is chosen, SVG rendering performance varies across browsers — benchmark on Firefox (historically slower SVG) before committing.

### Responsive Design

| Viewport            | Spectrum Panel Behavior                                         |
| ------------------- | --------------------------------------------------------------- |
| Desktop (≥ 1024px)  | Bottom panel, resizable handle, default 1/3 height              |
| Tablet (768-1023px) | Bottom panel, fixed 40% height, no resize handle                |
| Mobile (< 768px)    | Full-screen overlay triggered by "NMR" button, swipe to dismiss |

The bidirectional highlighting must work on touch devices: tap a peak to highlight the atom, tap an atom to highlight the peak. Touch targets on spectrum peaks must be ≥ 44px (WCAG touch target minimum).

_Performance targets and accessibility requirements are defined in the Non-Functional Requirements section._

### Implementation Considerations

- **State management:** NMR prediction results stored in the existing scene state (Zustand). Spectrum panel reads from this state reactively. No new state management layer needed.
- **API client:** New `predictNmr()` method in `@kendraw/api-client` package, following existing `computeProperties()` pattern. Uses TanStack Query for caching and loading states.
- **Code splitting:** Spectrum panel should be lazy-loaded (`React.lazy`) since most users won't use NMR on every session. Target: zero impact on initial bundle for users who don't open the NMR panel.
- **Offline behavior:** When backend is unreachable, the NMR button shows a disabled state with tooltip "NMR prediction requires the Kendraw backend." No silent failure.

## Functional Requirements

### NMR Prediction Engine

- **FR1:** Chemist can request 1H NMR chemical shift prediction for any drawn molecule by providing its structural representation (SMILES, MOL, or CDXML)
- **FR2:** Chemist can request 13C NMR chemical shift prediction for any drawn molecule (V1)
- **FR3:** System can predict chemical shifts using additive increment tables without external data dependencies
- **FR4:** System can predict chemical shifts using HOSE code algorithm with NMRShiftDB2 database when the optional data is installed (V1)
- **FR5:** System can fall back gracefully through the prediction chain (HOSE long sphere → HOSE short sphere → additive table) when higher-accuracy methods lack data for a given atom
- **FR6:** System can predict 1H multiplicity (singlet, doublet, triplet, multiplet) and J-coupling constants using empirical rules (V1)
- **FR7:** System can classify 13C atoms by DEPT category (CH3, CH2, CH, quaternary C) (V1)
- **FR8:** System can compute predictions within 300ms for molecules up to 500 atoms
- **FR9:** System can reject molecules exceeding the configured atom limit with a clear error message

### Spectrum Visualization

- **FR10:** Chemist can view a predicted NMR spectrum as an interactive chart in a dedicated panel below the molecular canvas
- **FR11:** Chemist can open and close the spectrum panel via a toolbar button or keyboard shortcut (Ctrl+N)
- **FR12:** Chemist can resize the spectrum panel by dragging a handle between the canvas and the panel
- **FR13:** Chemist can zoom into a specific ppm range on the spectrum
- **FR14:** Chemist can pan across the spectrum's ppm axis
- **FR15:** Chemist can view peak labels showing chemical shift values in ppm
- **FR16:** Chemist can view the ppm axis scale and relative intensity axis on the spectrum
- **FR17:** Chemist can select the simulated spectrometer frequency (300, 400, 500, 600, 800 MHz) with 400 MHz as the default
- **FR18:** Chemist can view Lorentzian peak shapes for each predicted chemical shift

### Structure-Spectrum Interaction

- **FR19:** Chemist can click a peak on the spectrum to highlight the corresponding atom(s) on the molecular structure
- **FR20:** Chemist can click an atom on the molecular structure to highlight the corresponding peak on the spectrum
- **FR21:** Chemist can tap a peak or atom on touch devices to trigger the same bidirectional highlighting
- **FR22:** System can update bidirectional highlighting within 16ms (60fps) of user interaction

### Prediction Transparency

- **FR23:** Chemist can see a color-coded confidence indicator on each predicted peak (green = high, yellow = moderate, red = low confidence)
- **FR24:** Chemist can distinguish confidence levels without relying on color alone (shape/icon differentiation for colorblind accessibility)
- **FR25:** Chemist can hover/tap a peak to see a tooltip explaining which prediction method produced it and the confidence rationale
- **FR26:** Chemist can view which prediction method (additive table, HOSE N-sphere, fallback) produced each individual peak (V1)
- **FR27:** System can display a prompt explaining the accuracy difference when NMRShiftDB2 data is not installed and the user first requests a prediction

### Data Export & Publication

- **FR28:** Chemist can export the predicted spectrum as a PNG image
- **FR29:** Chemist can export the predicted spectrum as an SVG image (V1)
- **FR30:** Chemist can export the predicted spectrum as a PDF document (V1)
- **FR31:** Chemist can export predicted shift data as a CSV table with atom index, shift (ppm), confidence, and method columns (V1)
- **FR32:** System can include simulation metadata in all exports: molecule identifier (SMILES, InChI), spectrometer frequency, prediction method, engine version, and data source version
- **FR33:** Chemist can view a tabular data representation of predicted peaks alongside the graphical spectrum (accessible screen-reader-friendly format)

### Experimental Comparison

- **FR34:** Chemist can import a JCAMP-DX file containing an experimental NMR spectrum (late V1)
- **FR35:** Chemist can view the predicted spectrum and imported experimental spectrum overlaid on the same axis with distinct colors (predicted blue, experimental red) (late V1)

### NMR Data Management

- **FR36:** Administrator can install the optional NMRShiftDB2 database via a CLI command (`kendraw nmr-data install`) (V1)
- **FR37:** System can detect whether NMRShiftDB2 data is installed and automatically use the highest-accuracy prediction method available
- **FR38:** Administrator can verify NMR service status and active prediction mode via the health endpoint (V1)

### Accessibility

- **FR39:** Chemist can navigate between peaks using keyboard (Tab/Shift+Tab) and activate highlighting with Enter
- **FR40:** Chemist can pan the spectrum using arrow keys and zoom using +/- keys
- **FR41:** Screen reader users can access predicted peak data as a structured data table with shift, atom type, and confidence per peak

## Non-Functional Requirements

### Performance

| Metric                             | Requirement                                | Rationale                                                        |
| ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| NMR prediction API response        | < 300ms for molecules ≤ 500 atoms          | Matches existing backend performance budget (FR-021 AC4)         |
| NMR prediction API response        | < 100ms for molecules ≤ 100 atoms          | Common teaching molecules are small — must feel instant          |
| Spectrum panel initial render      | < 100ms after API response received        | User perceives prediction + render as one action                 |
| Bidirectional highlight update     | < 16ms (60fps)                             | Click-to-highlight must feel instantaneous                       |
| Spectrum zoom/pan interaction      | Sustained 60fps                            | Smooth exploration without jank                                  |
| PNG export generation              | < 1s                                       | User clicks export → file ready                                  |
| Backend memory overhead            | NMRShiftDB2 data in memory ≤ 200 MB        | Keeps Docker container lightweight on commodity hardware         |
| Frontend bundle impact (NMR panel) | 0 kB added to initial bundle (lazy-loaded) | NMR panel only loaded when opened — no penalty for non-NMR users |

### Reliability

| Requirement             | Target                                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic output    | Same molecular input always produces identical shift values, confidence scores, and method attribution. No stochastic elements.                                            |
| Prediction availability | NMR endpoint returns a valid prediction whenever the backend is running. Additive tables require no external data — MVP always works.                                      |
| Graceful degradation    | If NMRShiftDB2 data is corrupted or missing, system falls back silently to additive tables with appropriate confidence downgrade. No crashes, no empty responses.          |
| Error handling          | Invalid molecular input (malformed SMILES, empty structure, unsupported format) returns a structured error message within 100ms. Never hangs or returns 500.               |
| Regression protection   | Automated benchmark test suite of 20-50 molecules. Any code change to the prediction engine must not regress MAE by more than +0.05 ppm on the benchmark set. CI enforced. |

### Accessibility

| Requirement           | Target                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| WCAG compliance       | AA level for all NMR panel UI elements                                                                                                      |
| Keyboard operability  | All spectrum interactions (peak navigation, zoom, pan, highlight trigger) achievable without a mouse                                        |
| Screen reader support | Peak data available as a structured table with semantic markup (shift, atom type, confidence)                                               |
| Color independence    | Confidence levels distinguishable by shape/icon in addition to color. Minimum contrast ratio 4.5:1 for all text, 3:1 for graphical elements |
| Touch targets         | Minimum 44x44 CSS pixels for all interactive peak areas on touch devices                                                                    |
| Reduced motion        | If user prefers reduced motion (OS setting), disable highlight animations — show static state change instead                                |

### Integration

| Requirement                    | Target                                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API contract stability         | `POST /api/v1/compute/nmr` response schema is versioned. Breaking changes require a new API version (`/api/v2/`).                                                            |
| Input format support           | Accept SMILES, MOL (V2000/V3000), and CDXML molecular representations. Format auto-detection.                                                                                |
| Export format compliance       | PNG: standard raster. SVG: valid SVG 1.1. CSV: RFC 4180 compliant. JCAMP-DX import: compliant with IUPAC JCAMP-DX 5.0 standard.                                              |
| NMRShiftDB2 data compatibility | Data download tool pins to a specific NMRShiftDB2 release version. Version included in prediction metadata for reproducibility.                                              |
| Existing system compatibility  | NMR endpoint integrates into the existing FastAPI app without modifying any current endpoint behavior. Zero regression to `/compute/properties`, `/convert/*`, or `/health`. |
