---
title: 'Product Brief Distillate: Kendraw NMR Prediction'
type: llm-distillate
source: 'product-brief-kendraw-nmr.md'
created: '2026-04-12'
purpose: 'Token-efficient context for downstream PRD creation'
---

# Product Brief Distillate: Kendraw NMR Prediction

## Scope Change Context

- NMR prediction was explicitly listed as "permanently out of scope" in both Product Brief (line 373) and PRD (line 1561): "Spectroscopie / prediction de spectres (RMN, IR, UV-Vis)"
- Scope change triggered by Revvity eliminating ChemDraw perpetual licenses (Jan 2025) and raising academic site-license pricing ~500% (~$6K → ~$30K)
- Free NMR prediction is now the single strongest migration argument from ChemDraw to Kendraw

## Technical Architecture — Existing Infrastructure

- FastAPI + Python 3.11+ backend ALREADY EXISTS in `backend/` (Sprint 0 deliverable)
- RDKit ALREADY INSTALLED, can generate HOSE codes natively
- Existing endpoints: `/api/v1/compute/properties`, `/api/v1/convert/*`
- Backend pattern: `kendraw_chem` (pure-logic services) + `kendraw_api` (FastAPI routers). NMR = new `NmrService` + new router
- All endpoints are stateless pure transformations (SMILES/MOL in → JSON out), idempotent, cacheable
- Pydantic v2 validation, structlog, OpenAPI auto-generation — all in place
- API pattern: `POST /api/v1/compute/nmr` with `{input, format, nucleus}` body
- Error envelope: `{error: {code, message, details}}`, status codes 200/400/413/422/500/503
- Anti-DOS cap: `KENDRAW_MAX_MOL_ATOMS` defaults to 5000 atoms — NMR endpoint must respect
- Graceful degradation pattern exists in `ComputeService` (checks `self._rdkit_available`, falls back to stub)
- ADR-0004: stateless, no server-side DB — NMRShiftDB2 data must be static files or loaded at startup
- Docker: two containers (nginx frontend + uvicorn backend), docker-compose orchestration
- Backend image ~200MB with RDKit; NMRShiftDB2 data adds ~50-100MB

## Technical Architecture — Frontend

- React 18 + TypeScript, Vite, pnpm workspaces monorepo
- Packages: `@kendraw/ui`, `@kendraw/scene`, `@kendraw/chem` (RDKit.js WASM), `@kendraw/renderer-canvas`, `@kendraw/renderer-svg`, `@kendraw/persistence`, `@kendraw/io`, `@kendraw/api-client`
- Canvas 2D rendering + SVG export — D3.js NOT currently in stack
- Frontend bundle limit: 350 kB gzip
- Property Panel: 320px right strip, glassmorphism, expandable sections with chevrons
- Performance budget: ≤100ms for ≤100 atoms (frontend), ≤500ms for ≤500 atoms
- Architecture principle: "no network in the steady-state edit loop" — NMR prediction is async (TanStack Query), not blocking edit loop

## Spectrum Panel UX Decisions

- Dedicated bottom panel, NOT in the 320px property panel (too narrow for interactive spectrum)
- Canvas upper ~2/3, spectrum panel lower ~1/3, resizable handle between them
- Panel closed → canvas reclaims 100%. Toggle via "NMR" button or Ctrl+N
- Matches ChemDraw's layout — standard for chemistry editors
- Spectrum renderer: architecture decision pending — D3.js selective import (~80 kB) vs native Canvas 2D (0 kB, leverages existing renderer). JB's instinct: Canvas 2D native

## NMR Prediction — Technical Approaches

### MVP: Additive Tables (1H only)

- Chemical shift base value per proton type + additive increments per neighboring substituent
- Target: MAE < 1.0 ppm on common aliphatic and simple aromatic molecules
- Known limitations: degrades for polysubstituted aromatics, intramolecular H-bonding (2-5 ppm shifts), strained rings, heterocycles
- **IP concern**: Pretsch/Silverstein tables are copyrighted textbook content. Must use clean-room implementation from open-access literature or derive tables from NMRShiftDB2 experimental data
- Fast computation, easily within 300ms budget
- MVP spectra show shift positions as Lorentzian peaks WITHOUT multiplicity splitting

### V1: HOSE Code + NMRShiftDB2 (1H + 13C)

- HOSE code = Hierarchical Organisation of Spherical Environments — encodes chemical environment in concentric spheres
- RDKit generates HOSE codes natively
- NMRShiftDB2: ~40,000-50,000 spectra, open source, CC-BY-SA 3.0 license
- ChemDraw's proprietary database: estimated ~200,000+ spectra — coverage gap is real
- Target: MAE < 0.5 ppm for common organics (approaches but does not match ChemNMR on complex structures)
- Graceful degradation chain: HOSE long sphere → HOSE short sphere → additive table fallback
- Per-peak method transparency: display which method produced each prediction

### NMRShiftDB2 License Strategy (DECIDED)

- CC-BY-SA 3.0 cannot be bundled in MIT Docker image
- Strategy: separate optional download via `kendraw nmr-data install`
- Downloads ~50-100MB data to `data/` folder
- Without database: additive tables only (less precise)
- With database: HOSE code high-precision mode
- First prediction without database triggers in-app prompt explaining accuracy difference

## Confidence Indicators (MVP feature, DECIDED)

- Per-peak color coding: green (high confidence) / yellow (moderate) / red (low confidence/fallback)
- Based on reference data coverage count for that chemical environment — simple lookup count, no ML
- Transparency advantage: ChemDraw gives NO confidence information per prediction
- Critical for adoption: chemist must know when to trust a prediction

## Experimental Spectrum Overlay (Late V1, DECIDED)

- Import JCAMP-DX file
- Display predicted (blue) + experimental (red) on same axis
- No automatic alignment, no peak-picking — just visual superposition
- Closes the core workflow: predict → compare → confirm

## Two User Personas with Different Accuracy Expectations

### Persona 1: Teaching (educators, master's students)

- MVP accuracy (±1 ppm) is EXCELLENT for this audience
- Goal: conceptual understanding ("OH is 1-5 ppm, aromatic is 6-8 ppm")
- Use cases: preparing spectroscopy exercises, teaching NMR interpretation
- Free tool on personal laptops removes institutional licensing barrier

### Persona 2: Research (PhD students, postdocs, researchers)

- MVP accuracy (±1 ppm) = useful starting point for quick sanity checks
- V1 accuracy (±0.5 ppm with HOSE) = reliable for structure verification of common organics
- Core workflow: synthesize → draw expected structure → predict NMR → compare to experimental
- Reference cohort: URD Abbaye laboratory
- Persona "Elise" from Compass: 27yo organic synthesis PhD, draws 5-20 structures/day

## Competitive Landscape (from web research)

- **ChemDraw ChemNMR** (Revvity): additive + neural-net HOSE, ~200K spectra DB, subscription-only since Jan 2025, ~$30/mo individual, ~$4K/yr pro
- **ACD/Labs**: HOSE + neural network, enterprise pricing, free academic version DISCONTINUED
- **MestReNova (Mnova)**: ML + HOSE + increments, campus licenses ~38K EUR suite, ~2.2K EUR undergrad
- **nmrdb.org**: free web-based, 1H/13C/COSY/HSQC/HMBC, NO editor integration, NO bidirectional highlighting, NO offline, NOT open-source
- **NMRShiftDB2**: open DB + HOSE predictor + REST API, dated UI, no editor, no spectrum viewer
- **Gap**: NO free tool combines molecular editor + interactive NMR + bidirectional atom-peak highlighting

## Market Timing Signals

- ChemDraw perpetual licenses eliminated Jan 2025 — departments actively seeking alternatives
- Academic users describe ChemDraw as "unaffordable" after 500% price increase
- NMR prediction is the #1 most-cited missing capability when switching from ChemDraw to free alternatives
- Open-source cheminformatics reaching infrastructure grade (RDKit, Open Babel)
- ML NMR predictors published as open-source (nmr_mpnn_pytorch, NMR-GCN) — future upgrade path
- Ketcher gaining traction in ELN/LIMS — signals open-source chemistry tools crossing to production

## Risks Captured

- **First-impression poisoning**: bad prediction on complex molecule → permanent dismissal. Mitigation: confidence indicators, curated first-run example
- **Additive table IP**: copyrighted textbook tables. Mitigation: clean-room implementation or derive from open data
- **J-coupling prediction complexity**: requires 3D conformational analysis. Mitigation: start with empirical Karplus equation
- **NMRShiftDB2 coverage gaps**: ~40K spectra vs ChemDraw's ~200K. Mitigation: transparent fallback chain
- **ChemDraw pricing reversal**: Revvity could add free tier. Mitigation: build durable value beyond price
- **Bundle size**: D3.js ~80kB vs 350kB limit. Mitigation: Canvas 2D native rendering (preferred)
- **Two-tier experience**: users without NMRShiftDB2 get worse accuracy. Mitigation: prominent in-app install prompt
- **Scope creep MVP→V1**: pressure to deliver V1 before MVP proves value. Mitigation: strict phasing

## Rejected Ideas and Decisions

- **ML/GNN approach for MVP**: rejected — too heavy, training data requirements, deployment complexity. Keep as future V2+ upgrade path
- **External API dependency (NMRShiftDB2 REST)**: rejected — must work fully self-hosted/offline
- **NMR in Property Panel**: rejected — 320px too narrow for interactive spectrum. Dedicated bottom panel chosen
- **Bundling NMRShiftDB2 in Docker image**: rejected — CC-BY-SA license incompatible with MIT bundling
- **Competing with ACD/Labs precision (±0.05 ppm)**: explicitly out of scope — not the target market

## Open Questions for PRD

- Which specific additive table source to use (clean-room derivation from open data vs. published open-access tables)?
- Exact HOSE code sphere depth for optimal accuracy/coverage tradeoff (3-sphere? 5-sphere?)
- JCAMP-DX parser: build or use existing open-source library?
- Multiplicity prediction approach for V1: full Karplus equation or simplified empirical rules?
- NMRShiftDB2 data format for local storage: SQLite? JSON? Binary lookup table?
- Benchmark test set for accuracy validation: use SDBS database? NMRShiftDB2 holdout set?

## Scope Summary

### Feature MVP

- 1H prediction (additive tables)
- Interactive spectrum panel (bottom, resizable)
- Bidirectional click (atom ↔ peak)
- Per-peak confidence indicators (green/yellow/red)
- Zoom, pan, peak labels, axis labels
- Export PNG

### Feature V1

- 13C prediction
- Multiplicity + J-coupling (1H)
- DEPT (13C)
- HOSE code + NMRShiftDB2 (optional download)
- Export SVG/PDF/CSV
- Late V1: JCAMP-DX import + experimental overlay (blue predicted, red experimental)

### Feature V2

- 2D NMR (COSY, HSQC, HMBC)
- Automatic peak alignment on overlays
- Manual peak assignment mode
- ML/GNN prediction upgrade path
