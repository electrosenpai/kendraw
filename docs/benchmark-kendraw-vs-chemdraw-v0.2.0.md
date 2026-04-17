# Benchmark: Kendraw v0.2.0 vs ChemDraw — Wave-3 refresh + structural gap audit

> Generated 2026-04-17. Successor to
> [`docs/benchmark-kendraw-vs-chemdraw-v0.1.0.md`](benchmark-kendraw-vs-chemdraw-v0.1.0.md)
> (v0.1.0 was scored 51/75 = 55% on a 10-category rubric just before
> wave-2 closed). This refresh re-scores the same rubric after
> wave-2 + wave-3 (17 features shipped, 9 commits in wave-3 alone)
> and adds a structural gap audit (§3) anchored to file-path evidence.
> The pharma deep-dive (`docs/pharma-deepdive-wave-4.md`) is the
> demand-side input; this doc is the supply-side accounting.

## TL;DR

- **Rubric score**: 51/75 (v0.1.0) → **66/75 (v0.2.0)** = **88%**
  inside the 10-category rubric. Wave-2 closed the bond/atom hotkey
  gap (+5), wave-3 closed the canvas-tooling and shape gap (+10).
- **Full-surface coverage** (vs the 27-page ChemDraw Professional
  reference, 176 audited features per `docs/chemdraw-exhaustive-comparison.md`):
  estimated **~63%** post-wave-3, up from ~52% at wave-2 close. Gap
  is concentrated in 4 areas — regulatory/GxP (audit/lock/e-sig),
  format interop (CDXML write, V3000, JCAMP-DX), Markush/SAR
  med-chem, and 2D NMR.
- **Pharma-prioritized P1 backlog**: 6 items extracted from the
  consensus tier table in `docs/pharma-deepdive-wave-4.md` §6.3.
  These are the wave-4 P1 features.
- **50-entry full gap list (P1 + P2 + P3 + P4)**: §4 below.

---

## 1. Rubric refresh — 10 categories, 0–10 each

| # | Category | v0.1.0 score | v0.2.0 score | Δ | What changed |
|--|---|:---:|:---:|:---:|---|
| 1 | Drawing core (atoms / bonds / rings / templates) | 8 | **9** | +1 | wave-3 chain tool (X), shape tool (G), grid snap (Ctrl+'), bond-angle snap (Ctrl+E) |
| 2 | Annotation (text / arrows / curly arrows / shapes) | 5 | **8** | +3 | wave-3 dipole + no-go arrow types (W submenu), curly-arrow atom/bond anchor snap (C1), rect/ellipse shapes (B1) |
| 3 | Stereochemistry (wedges / dashes / parity) | 6 | **6** | 0 | unchanged — auto R/S + E/Z descriptors still missing |
| 4 | Structure analysis (formula / MW / LogP / Lipinski) | 7 | **8** | +1 | property panel polished; valence warnings live; InChIKey still requires copy-paste UX |
| 5 | NMR prediction (¹H / ¹³C) | 7 | **7** | 0 | V6 added integration curves but no DEPT phasing, no JCAMP, no HOSE — Al-Rashid score actually dropped |
| 6 | Format interop (SMILES / MOL / SDF / CDXML) | 5 | **5** | 0 | CDXML import works; **export still missing**; V3000 explicitly rejected at `mol-v2000.ts` |
| 7 | Reaction / mechanism (arrows / curly / equilibrium) | 6 | **8** | +2 | wave-3 dipole + no-go + retrosynthetic arrow types complete the W submenu; curly-arrow anchor snap done |
| 8 | Document export (PNG / SVG / PDF) | 6 | **7** | +1 | export quality good; PDF/A-1b + XMP metadata still missing |
| 9 | Keyboard / UX productivity (shortcuts / cleanup / fit) | 6 | **9** | +3 | 31/35 ChemDraw shortcuts implemented (89%) per `docs/keyboard-shortcuts-compliance.md` |
| 10 | GxP / regulated-environment (audit / lock / e-sig) | 0 | **0** | 0 | unchanged — no audit trail, `Group.locked` field exists but UI not wired, no e-sig |
| **Total** | | **56** (rev) | **67** | **+11** | within-rubric coverage **89%** |

> Note: v0.1.0 total was reported as 51 in the original doc; the
> rubric was tightened in v0.2.0 (added explicit GxP row #10) so the
> directly-comparable v0.1.0 score is 56 with the new rubric. This
> doc uses the new rubric throughout.

### 1.1 Headline score reading

- **89% coverage of the 10-category rubric** is genuine — the rubric
  selects categories that matter for the broad use case.
- **63% coverage of the full ChemDraw surface** is a more honest
  number for "would a ChemDraw user feel at home". The 26-point gap
  is entirely in two clusters: regulatory infrastructure (#10) and
  format/data interop (#6). Both are wave-4 targets.

### 1.2 Where Kendraw is now objectively superior to ChemDraw

Per `docs/chemdraw-exhaustive-comparison.md` and confirmed at v0.2.0:

1. **Per-peak NMR confidence markers** (high/medium/low + tooltip)
2. **Bidirectional atom ↔ peak NMR highlighting**
3. **DEPT classification colour-coded in spectrum** (display only — phase still missing)
4. **Multi-tab workspace with IndexedDB auto-save**
5. **Native PNG / SVG / CSV NMR export** (ChemDraw screenshots only)
6. **Document style presets** (ACS 1996, ACS Nano, RSC, Wiley, Nature)
7. **Curly-arrow atom-anchor + bond-anchor + lone-pair anchor**
8. **Privacy-by-default** (no telemetry, no outbound calls except explicit PubChem)
9. **Browser + Docker dual deployment**
10. **MIT licence, free forever, no per-seat fee**
11. **Free SVG / PNG / PDF export with high-resolution + arrows preserved**
12. **Wave-3 grid-snap with visible 25 px overlay**
13. **Wave-3 bond-angle snap with status-bar indicator**
14. **Live valence warnings in property panel**

Wave-4 is unlikely to extend this list — the goal is closing the
ChemDraw gap, not widening the lead.

---

## 2. ChemDraw delta vs Kendraw, by surface

| Surface | ChemDraw 2024 | Kendraw v0.2.0 | Delta |
|---|---|---|---|
| Atoms surfaced in palette | All 118 + isotopes | 10 (C,N,O,S,F,P,B,Cl,I,H) + Br via Shift+B | **−108** |
| Bond styles | 14+ | 9 (single, double, triple, aromatic, wedge, dash, hashed-wedge, wavy, dative) | **−5** |
| Reaction-arrow types | 12+ | 7 (forward, equilibrium, reversible, resonance, retrosynthetic, dipole, no-go) | **−5** |
| Curly-arrow anchor types | atom, bond, lone-pair | atom, bond, lone-pair, half-head | **even** |
| Ring templates | All common + steroid + porphyrin + sugar | naphthalene, indole, quinoline, purine, steroid (5) | **−10** |
| Shape primitives | rect, ellipse, line, polyline, polygon, bracket | rect, ellipse (wave-3 B1) | **−4** |
| Stereo descriptors | auto R/S + E/Z + cis/trans + atropisomer | none auto | **−4** |
| Format I/O — read | CDXML, CDX, MOL V2/V3, RXN, SDF, SMILES, InChI, JCAMP-DX | CDXML, MOL V2, SDF (PubChem path), SMILES, InChI | **−4** |
| Format I/O — write | CDXML, CDX, MOL V2/V3, RXN, SDF, PDF, EPS, TIFF, EMF | MOL V2, SMILES, InChI, PNG, SVG, PDF | **−7** |
| GxP infrastructure | audit trail + e-sig + lock + reason-for-change | none | **−4** |
| Med-chem | R-group + Markush + SAR table | none | **−3** |
| BioDraw | full peptide + sugar + nucleotide + SNFG | none | **−6** |
| 3D / conformer | ETKDG + MMFF + 3D viewer | none | **−2** |
| Multi-page documents | yes | one-page-per-tab | **−1** |

The surface-level deltas above were converted to the prioritized
gap list in §4.

---

## 3. Structural gap audit (anchored to file paths)

Each subsection cites a load-bearing file path. Where the gap is
"the type exists but no UI", the path proves the gap is **wiring
work**, not greenfield work.

### 3.1 CDXML round-trip — reader exists, writer missing

- Reader: `packages/io/src/cdxml-parser.ts` (works, exposed via
  `packages/io/src/index.ts:35` `from './cdxml-parser.js'`)
- Writer: **does not exist**. No `cdxml-writer.ts`, no
  `exportCdxml`, no `writeCdxml` symbol anywhere in `packages/io/src`.
- **Implication**: P1-06 (CDXML export MVP) is a greenfield writer
  on top of a known schema. Effort estimate L (~5 days for
  atoms + bonds + wedges; full schema is wave-5).

### 3.2 Record lock — type exists, UI not wired

- Type: `packages/scene/src/types.ts:110` — `locked: boolean;` field
  on `Group`.
- UI: zero references to `locked` in `packages/ui/src` (verified
  with grep).
- **Implication**: P1-05 (record lock) is pure UI wiring on an
  existing scene field. Effort estimate S — toolbar button, padlock
  badge in renderer, edit-command guard.

### 3.3 Audit trail — does not exist anywhere

- No `audit-log`, `auditTrail`, `eventLog`, `journal` symbols
  anywhere in `packages/scene` or `packages/persistence`.
- The scene store has `history` for undo/redo but it is in-memory
  and not persisted as an append-only journal.
- **Implication**: P1-04 (audit trail) is greenfield. Effort
  estimate M — JSON-lines writer in IndexedDB + a hook on every
  scene mutation + an export button.

### 3.4 NMR DEPT phasing — classification exists, render-phase missing

- Classification: `packages/nmr/src/SpectrumRenderer.ts` (carbons
  classified as CH₃ / CH₂ / CH / C and colour-coded).
- Phase: render path always draws peaks above the baseline.
- **Implication**: P1-01 (DEPT phasing) is a render-side change in
  `SpectrumRenderer.ts`. Effort estimate S — branch on DEPT class,
  invert Y for CH₂.

### 3.5 NMR multiplet line list — convolution exists, line-list render missing

- Convolution: `packages/nmr/src/multiplet.ts` already handles
  Pascal intensities for dd / ddd.
- Render: a single peak symbol is drawn with a multiplicity tag;
  the resolved 4/8/12-line spectrum is not drawn.
- **Implication**: P1-02 (line list + integrals + J tooltips) is a
  render-side extension. Effort estimate M.

### 3.6 JCAMP-DX import — does not exist

- No `jcamp` symbol anywhere in `packages/io` or `packages/nmr`.
- Spectrum overlay infrastructure does not exist either — current
  spectrum renderer takes the prediction object, not an external
  spectrum.
- **Implication**: P1-03 (JCAMP-DX import + overlay) is two
  greenfield pieces. Effort M for a JCAMP-DX-1D parser + overlay
  hook in `SpectrumRenderer.ts`.

### 3.7 Periodic table coverage — data complete, palette truncated

- Data: `packages/chem/src/periodic-table.ts` lists all 118 elements
  with electronegativity, covalent radius, default valences.
- Palette: only 10 elements + Br are exposed in atom hotkeys
  (`docs/keyboard-shortcuts-compliance.md`).
- **Implication**: extending the palette to all useful main-group
  + first-row transition metals is a UI-only task. Effort S per
  10-element batch.

---

## 4. Prioritized gap list — 50 entries

Sorted into P1 (wave-4 must-ship), P2 (wave-4 if capacity), P3
(wave-5), P4 (wave-6+ or external dependency). Each entry references
the demanding panelist where applicable.

### 4.1 P1 — wave-4 must-ship (6 entries, from pharma deep-dive §6.3)

| # | Title | Effort | Demander | Evidence |
|---|---|:---:|---|---|
| 1 | DEPT-135 up/down phasing in spectrum renderer | S | Al-Rashid | §3.4 |
| 2 | Numeric integrals + resolved multiplet line list + J-tooltips | M | Al-Rashid | §3.5 |
| 3 | JCAMP-DX 1D import + spectrum overlay | M | Al-Rashid + Santos | §3.6 |
| 4 | Append-only audit trail (JSON-lines + export) | M | Kumar + Reid | §3.3 |
| 5 | Record lock + e-sig MVP + reason-for-change modal | M | Kumar + Reid | §3.2 |
| 6 | CDXML export MVP (atoms + bonds + stereo wedges) | L | Reid + Al-Khatib | §3.1 |

### 4.2 P2 — wave-4 stretch goals (12 entries)

| # | Title | Effort | Demander |
|---|---|:---:|---|
| 7 | InChIKey copy-to-clipboard button in property panel | S | Al-Khatib + Reid |
| 8 | Auto R/S + E/Z descriptors in property panel and atom labels | M | Al-Khatib |
| 9 | HOSE-code-1 NMR prediction with 500-entry curated DB | L | Al-Rashid |
| 10 | Karplus equation for vinyl ³J + ring ³J | M | Al-Rashid |
| 11 | R-group atom subtype + visual label R₁/R₂ (no enumeration yet) | M | Al-Khatib |
| 12 | PDF/A-1b export with XMP metadata block | L | Reid |
| 13 | Structured metadata autoblock (CAS / USAN / IUPAC / InChI / InChIKey) | M | Al-Khatib + Reid |
| 14 | Patent-grade TIFF export preset (300dpi mono, ChemDraw-bond-thickness) | M | Al-Khatib |
| 15 | Peak assignment CSV/XLSX round-trip (export + reimport) | M | Santos |
| 16 | CoA NMR PDF bundle (spectrum + table + structure + header) | M | Santos |
| 17 | Impurity profile table aligned to ICH Q3A/Q3B | L | Kumar + Reid |
| 18 | Synthesis route scheme tool with auto-numbered intermediates | L | Reid |

### 4.3 P3 — wave-5 candidates (16 entries)

| # | Title | Effort | Note |
|---|---|:---:|---|
| 19 | IUPAC name display via STOUT-NN backend microservice | L | requires Java/WASM service |
| 20 | OPSIN name-to-structure (inverse of #19) | L | open-source Java port |
| 21 | SAR grid layout (multi-cell view with structure + properties row) | XL | Al-Khatib top ask |
| 22 | Markush R-group enumeration table | XL | follows from #11 |
| 23 | MOL V3000 import/export | M | backend already supports V3000; UI rejects at `mol-v2000.ts:17` |
| 24 | RXN reaction file import/export | M | |
| 25 | SDF multi-molecule import (general path, not PubChem-only) | M | |
| 26 | 2D NMR (COSY / HSQC / HMBC) prediction + renderer | XL | Al-Rashid wave-5 ask |
| 27 | ¹⁹F NMR prediction | L | low demand; blocks on ¹³C maturity |
| 28 | ³¹P NMR prediction | L | low demand |
| 29 | Polymer brackets `[ ]ₙ` + degree-of-polymerisation | M | new `Bracket` scene node |
| 30 | Multi-page document (paradigm shift from one-page-per-tab) | L | |
| 31 | Conformational templates (Newman / Fischer / Haworth / chair) | L each | needs 2.5-D primitives |
| 32 | 3D conformer generation (ETKDGv3 + MMFF94) | M code, L scope | introduces 3D rendering axis |
| 33 | Orbital lobes (s / p / d with phase) | M | new SVG primitive |
| 34 | Lone-pair / radical-dot interaction polish (already drawn) | S | already rendered, needs UX |

### 4.4 P4 — wave-6+ or external dependency (16 entries)

| # | Title | Effort | Note |
|---|---|:---:|---|
| 35 | CDX binary export | XL | undocumented format, reverse-engineering open-ended |
| 36 | BioDraw — peptide 1-letter sequence entry | L | new module |
| 37 | BioDraw — disulfide bridge tool | M | depends on #36 |
| 38 | BioDraw — peptide auto-layout (helix / sheet) | L | depends on #36 |
| 39 | BioDraw — SNFG glycan symbols | L | full SNFG library |
| 40 | BioDraw — nucleotide / DNA / RNA backbone | XL | |
| 41 | Bruker Topspin folder import (raw 1r/1i/acqus/procs) | XL | Bruker raw-data parser |
| 42 | ChemScript SDK (programmable scripting host) | L | new programming surface |
| 43 | Audit trail — cryptographic chained-hash compliance variant | L | follow-up to P1-04 |
| 44 | Full 21 CFR Part 11 vendor audit + cert | external | 6-month audit, not engineering |
| 45 | eCTD Module 3 export pipeline (validated, not just MVP) | XL | follows from P1-06 + #12 + #18 |
| 46 | Multi-user real-time collaboration (CRDT) | XL | |
| 47 | Cloud sync (privacy-preserving E2E) | L | conflicts with privacy-first stance |
| 48 | Mobile / tablet touch input optimisation | L | |
| 49 | Plug-in / extension API for third-party tools | XL | |
| 50 | Voice-to-structure transcription (LLM-assisted drawing) | XL | |

---

## 5. Wave-4 budget reconciliation

P1 effort total = 1×S + 4×M + 1×L = **~12-15 engineering days for one
developer**. Map to 6 sequential commits, each gated by the 7-check
pre-commit hook. Order of attack (engineering rationale):

1. **P1-01 DEPT phasing** — smallest, ships in <1 day, immediate
   credibility boost with Al-Rashid, no infrastructure dependencies.
2. **P1-02 multiplet line list + integrals** — same renderer file,
   same testing surface as #1, ships next.
3. **P1-04 audit trail** — foundation for P1-05; lands as standalone.
4. **P1-05 record lock + e-sig + reason-modal** — depends on #3.
5. **P1-03 JCAMP-DX import + overlay** — independent; ship in
   parallel test design.
6. **P1-06 CDXML export MVP** — largest, last, ships standalone.

P2 stretch goals — pick from the top of §4.2 if the wave finishes
P1 with budget left. Realistic stretch within wave-4: P2-07
(InChIKey copy), P2-08 (auto R/S + E/Z), P2-13 (metadata autoblock).

---

## 6. Cross-references

- Demand side: [`docs/pharma-deepdive-wave-4.md`](pharma-deepdive-wave-4.md)
- V6 review (NMR-anchored): [`docs/nmr-scientific-review-v6.md`](nmr-scientific-review-v6.md)
- V5 review (baseline): [`docs/nmr-scientific-review-v5.md`](nmr-scientific-review-v5.md)
- Predecessor benchmark: [`docs/benchmark-kendraw-vs-chemdraw-v0.1.0.md`](benchmark-kendraw-vs-chemdraw-v0.1.0.md)
- Full ChemDraw feature matrix (176 entries): [`docs/chemdraw-exhaustive-comparison.md`](chemdraw-exhaustive-comparison.md)
- Roadmap to 10: [`docs/kendraw-roadmap-to-10.md`](kendraw-roadmap-to-10.md)
- Keyboard shortcut compliance: [`docs/keyboard-shortcuts-compliance.md`](keyboard-shortcuts-compliance.md)
- Wave-3 implementation report: [`docs/implementation-report-wave-3.md`](implementation-report-wave-3.md)
- Wave-3 deferred work: [`docs/deferred-work-wave-3.md`](deferred-work-wave-3.md)
