---
title: 'Product Brief: Kendraw NMR Prediction'
status: 'complete'
created: '2026-04-12'
updated: '2026-04-12'
inputs:
  - docs/product-brief-kendraw-2026-04-12.md
  - docs/prd-kendraw-2026-04-12.md
  - docs/architecture-kendraw-2026-04-12.md
  - docs/chemdraw-technical-reference.md
  - docs/ux-design-kendraw-2026-04-12.md
---

# Product Brief: Kendraw NMR Prediction

## Executive Summary

Kendraw is the free, open-source molecular editor built to replace ChemDraw. Its MVP is nearly complete — structure drawing, CDXML import, property computation, and publication-quality export all work. Now we are adding the single most requested feature in computational chemistry: **NMR spectrum prediction**.

ChemDraw Professional bundles its NMR prediction module (ChemNMR) behind a ~$4,000/year subscription. In January 2025, Revvity eliminated perpetual licenses entirely and raised academic site-license pricing by approximately 500%. Universities are losing access. PhD students and researchers who relied on ChemNMR to verify synthesis results are now either paying out of pocket or going without.

Kendraw NMR Prediction fills that gap — for free. A chemist draws a molecule, clicks "Predict NMR," and gets an interactive spectrum with **bidirectional highlighting**: click a peak to see which atom produces it, click an atom to see its peak. This is the workflow ChemNMR pioneered, and the capability no other free tool replicates.

### Why Now — A Deliberate Scope Change

When Kendraw's V1 was scoped, NMR prediction was explicitly excluded as out-of-scope. ChemDraw's pricing was high but stable, and the effort-to-impact ratio didn't justify inclusion. That calculus changed in January 2025. Revvity's decision to eliminate perpetual licenses and dramatically increase academic pricing created a strategic opening: free NMR prediction is now the single strongest argument for academic migration from ChemDraw to Kendraw. This is no longer a nice-to-have — it is the feature that makes Kendraw the obvious choice.

## The Problem

Every organic chemistry researcher needs NMR prediction. The workflow is universal: synthesize a compound, draw its expected structure, predict the NMR spectrum, compare it against the experimental spectrum from the spectrometer. If they match, the structure is confirmed. If they don't, something went wrong.

Today, chemists face three options:

1. **Pay for ChemDraw Professional** (~$4,000/year) — prohibitively expensive for most individual researchers and increasingly for departments after the 2025 price hike.
2. **Use free web tools** (nmrdb.org, NMRShiftDB2) — functional but fragmented. No integrated editor, no bidirectional atom-peak highlighting, no offline capability. You draw the structure in one tool, copy it to another, and lose the interactive link between structure and spectrum.
3. **Go without** — a surprising number of students and postdocs simply skip NMR prediction because they can't access ChemDraw and the free alternatives are too cumbersome.

The cost of the status quo is tangible: slower structure confirmation, less confidence in synthesis results, and a generation of chemistry students who learn spectroscopy without the interactive tools that make it intuitive.

## The Solution

Kendraw NMR Prediction integrates directly into the molecular editor as a dedicated bottom panel — no context switching, no separate tools, no subscriptions.

**Core experience:**

- Draw or open a molecule in Kendraw
- Click "Predict NMR" (or Ctrl+N) to open the spectrum panel
- A predicted 1H (and later 13C) NMR spectrum renders interactively below the canvas
- **Click a peak** on the spectrum — the corresponding atom highlights on the molecule
- **Click an atom** on the molecule — the corresponding peak highlights on the spectrum
- Each peak is **color-coded by confidence** (green/yellow/red) based on reference data coverage for that chemical environment — the chemist always knows how much to trust each prediction
- Chemical shifts and (in V1) multiplicities, coupling constants, and integration values are displayed alongside the spectrum

**UX:** The canvas occupies the upper ~2/3 of the viewport, the spectrum panel the lower ~1/3, with a resizable handle between them. When the NMR panel is closed, the canvas reclaims 100% of the space. This matches ChemDraw's layout and is the standard for spectrum visualization in chemistry editors.

**Technical approach — phased accuracy:**

- **MVP:** Additive chemical shift tables for 1H prediction. Fast, no external dependencies, target MAE < 1.0 ppm on common aliphatic and simple aromatic molecules. Best suited as an approximate guide for teaching and quick sanity checks. MVP spectra show predicted shift positions as Lorentzian peaks without multiplicity splitting — splitting patterns are added in V1. **Known limitations:** additive methods degrade for polysubstituted aromatics, intramolecular hydrogen bonding (shifts can move 2–5 ppm), strained ring systems, and heterocyclic compounds. These limitations are communicated to the user via per-peak confidence indicators.
- **V1:** HOSE code algorithm + NMRShiftDB2 database for 1H and 13C. Target MAE < 0.5 ppm for common organic molecules — approaching but not matching ChemDraw ChemNMR's accuracy on complex structures. NMRShiftDB2 data is provided as an **optional download** (`kendraw nmr-data install`) to maintain MIT license compatibility — the CC-BY-SA database is not bundled in the Docker image. Without it, prediction gracefully degrades through a transparent chain: HOSE code (long sphere match) → HOSE code (short sphere) → additive table fallback. Each peak displays which method produced it — a transparency advantage ChemDraw does not offer.

## What Makes This Different

**No other free tool combines these three things:**

1. **Integrated molecular editor** — draw and predict in one tool, no copy-paste between apps
2. **Bidirectional atom-peak highlighting** — the interactive link between structure and spectrum that makes ChemNMR indispensable
3. **Self-hosted and offline** — no cloud dependency, no subscription, runs on department servers or personal laptops

nmrdb.org predicts spectra but has no editor integration and no bidirectional highlighting. NMRShiftDB2 has a database and API but no modern interface. Ketcher and MolView draw molecules but have no NMR prediction at all. ACD/Labs and MestReNova are accurate but expensive and closed-source.

Kendraw delivers the best free alternative to ChemNMR — the full integrated workflow at zero cost, under an open-source MIT license. For researchers who currently have no access to ChemNMR due to cost, this provides 80% of the capability at 0% of the price.

## Who This Serves

**Persona 1 — Teaching and learning (educators, master's students).** Teachers preparing spectroscopy exercises need interactive predicted spectra for problem sets. Students learning NMR interpretation need the intuition that "OH is around 1–5 ppm, aromatic is 6–8 ppm." For this audience, MVP accuracy (MAE < 1.0 ppm) is excellent — the goal is conceptual understanding, not decimal precision. A free tool students can install on their own laptops removes the institutional licensing barrier entirely.

**Persona 2 — Research verification (PhD students, postdocs, researchers).** They draw 5–20 structures daily and routinely compare predicted vs. experimental NMR spectra to confirm synthesis products. For this audience, MVP accuracy is a useful starting point for quick sanity checks ("does my structure have roughly the right spectral signature?"), not a definitive confirmation tool. The real research value unlocks at V1 (HOSE code, MAE < 0.5 ppm), where predictions become reliable enough for structure verification of common organic molecules. This manages expectations: MVP is a fast first check, V1 is the tool you trust. Reference beta-testing cohort: URD Abbaye laboratory.

## Success Criteria

| Metric                                | Target                                                        | Why it matters                                                                     |
| ------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1H prediction accuracy (MVP)          | MAE < 1.0 ppm on common aliphatic/simple aromatic             | Sufficient as approximate guide for teaching and quick sanity checks               |
| 1H prediction accuracy (V1 with HOSE) | MAE < 0.5 ppm on common organics                              | Best free alternative; approaches but does not match ChemNMR on complex structures |
| Prediction response time              | < 300ms for molecules up to 500 atoms                         | Matches existing backend performance budget                                        |
| Bidirectional highlighting latency    | < 100ms                                                       | Must feel instantaneous to maintain flow                                           |
| Adoption at URD Abbaye                | Active use by > 50% of lab members within 3 months of release | Validates real-world utility                                                       |
| GitHub engagement                     | NMR-related issues and contributions from external users      | Signals organic adoption beyond beta lab                                           |

## Scope

### Feature MVP

- 1H NMR prediction via additive tables
- Interactive spectrum panel (dedicated bottom panel, resizable)
- Bidirectional click: peak-to-atom and atom-to-peak highlighting
- Chemical shift display (delta in ppm)
- Export spectrum as PNG

### Feature V1

- 13C NMR prediction
- Multiplicity and J-coupling constants for 1H
- DEPT classification for 13C (CH3, CH2, CH, quaternary C)
- HOSE code + NMRShiftDB2 for improved accuracy (optional data download)
- Export spectrum as SVG/PDF
- Tabular data export (CSV)
- **Late V1:** Minimal experimental spectrum overlay — import JCAMP-DX file and display predicted (blue) vs. experimental (red) spectra on the same axis. No automatic alignment or peak-picking — just visual superposition for manual comparison

### Feature MVP — Spectrum Panel Interactions

- Zoom and pan on spectrum X-axis (ppm range)
- Peak labels showing chemical shift values
- Bidirectional click highlighting (atom ↔ peak)
- Axis labeling (ppm scale, relative intensity)
- Deferred to V1: peak threshold filtering, customizable axis scales

### Explicitly Out of Scope

- 2D NMR spectra (COSY, HSQC, HMBC) — future V2
- Automatic peak alignment and peak-picking on experimental overlays — future V2
- Manual peak assignment mode — future V2
- Competing with ACD/Labs precision (0.05 ppm) — not the target
- Cloud-based prediction API — must work fully self-hosted

## Risks and Mitigations

| Risk                                                                                                                                        | Severity | Mitigation                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **First-impression poisoning**: a researcher tests on a complex molecule, gets a bad prediction, dismisses the tool permanently             | High     | Per-peak confidence indicators (color-coded); curated first-run example with a well-predicted molecule; explicit communication of method limitations in the UI                                      |
| **Additive table IP**: Pretsch/Silverstein tables are published in copyrighted textbooks; encoding them in MIT code needs legal clearance   | High     | Use clean-room implementation from published open-access literature, or derive tables from NMRShiftDB2 experimental data directly                                                                   |
| **J-coupling and multiplicity prediction** (V1) is dramatically harder than chemical shift prediction — requires 3D conformational analysis | High     | Acknowledge complexity in V1 planning; consider empirical coupling rules (Karplus equation) before attempting full conformational analysis                                                          |
| **NMRShiftDB2 coverage gaps**: HOSE code returns no prediction for uncommon substructures, silently degrading accuracy                      | Medium   | Transparent fallback chain with per-peak method display; graceful "low confidence" warnings                                                                                                         |
| **ChemDraw pricing reversal**: Revvity could respond with academic discounts or a free tier                                                 | Medium   | Build value beyond price — the open-source ecosystem, self-hosted capability, and transparency features are durable differentiators regardless of competitor pricing                                |
| **Spectrum rendering bundle size**: D3.js adds ~80 kB gzip to a frontend with a 350 kB limit                                                | Medium   | Architecture decision: evaluate D3 selective module import vs. native Canvas 2D rendering (zero added weight, leverages existing Canvas renderer infrastructure). Resolve during architecture phase |

## Vision

If Kendraw NMR succeeds, it becomes the proof point for a broader thesis: the most important computational chemistry tools should be free and open-source. NMR prediction is the first "premium feature" to migrate from ChemDraw's paywall to Kendraw's open platform.

The trajectory: 1H prediction (MVP) builds trust. 13C and improved accuracy (V1) achieve parity with ChemNMR. Experimental overlay and 2D spectra (V2) move beyond parity into territory ChemDraw doesn't offer for free. Each step expands the user base and strengthens the argument: there is no longer a reason to pay $4,000/year for ChemDraw Professional.

In 2-3 years, Kendraw's spectroscopy module could extend beyond NMR to IR and UV-Vis prediction — creating a complete, free spectroscopy toolkit integrated into the molecular editor. For academic chemistry, that changes everything.
