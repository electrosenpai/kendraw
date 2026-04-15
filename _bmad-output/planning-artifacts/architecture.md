---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
status: complete
completedAt: '2026-04-13'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-kendraw-nmr-distillate.md'
  - 'docs/architecture-kendraw-2026-04-12.md'
  - 'docs/ux-design-kendraw-2026-04-12.md'
  - 'docs/adr/0001-modular-monolith.md'
  - 'docs/adr/0004-stateless-backend-no-db.md'
workflowType: 'architecture'
project_name: 'Kendraw NMR Prediction'
user_name: 'Jean-Baptiste DONNETTE'
date: '2026-04-12'
---

# Architecture Decision Document — Kendraw NMR Prediction

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
41 FRs organized into 8 capability areas: NMR Prediction Engine (FR1-9), Spectrum Visualization (FR10-18), Structure-Spectrum Interaction (FR19-22), Prediction Transparency (FR23-27), Data Export & Publication (FR28-33), Experimental Comparison (FR34-35), NMR Data Management (FR36-38), Accessibility (FR39-41).

Architecturally, these map to 3 new components:

1. **Backend NmrService** (FR1-9) — new service in `kendraw_chem`, following `ComputeService` pattern
2. **Frontend NMR Panel** (FR10-22, FR23-27, FR28-33, FR39-41) — new lazy-loaded React component
3. **API Endpoint** (FR1, FR8-9) — new route in `kendraw_api` compute router

**Non-Functional Requirements:**

- Performance: < 300ms prediction, < 100ms render, 60fps interaction
- Reliability: deterministic predictions, graceful degradation, regression protection
- Accessibility: WCAG AA, keyboard navigation, screen reader, colorblind-safe
- Integration: API contract stability, format compliance (JCAMP-DX, CSV, PNG/SVG)

**Scale & Complexity:**

- Primary domain: Scientific computing (NMR prediction)
- Complexity level: Medium
- New architectural components: 3 (NmrService, NMR panel, NMR API route)
- Existing components modified: 2 (scene state, api-client)

### Technical Constraints & Dependencies

| Constraint                           | Source                 | Impact                                                                |
| ------------------------------------ | ---------------------- | --------------------------------------------------------------------- |
| Stateless backend, no DB             | ADR-0004               | NMRShiftDB2 data must be static files loaded at startup               |
| Modular monolith                     | ADR-0001               | NMR module lives inside existing `kendraw_chem`                       |
| 350 kB frontend bundle limit         | Existing NFR           | Spectrum panel must be lazy-loaded; Canvas 2D preferred over D3.js    |
| KENDRAW_MAX_MOL_ATOMS (5000)         | Existing cap           | NMR endpoint respects same cap; practical limit ~500 for performance  |
| MIT license                          | Project constraint     | NMRShiftDB2 (CC-BY-SA) cannot be bundled — separate optional download |
| Docker compose deployment            | Existing pattern       | No new containers; NMR is part of existing backend container          |
| No network in steady-state edit loop | Architecture principle | NMR prediction is async (user-triggered), not part of edit loop       |

### Cross-Cutting Concerns

1. **NMR data in scene state:** `Page` type needs a new `nmrPrediction` field for prediction results
2. **API client extension:** `@kendraw/api-client` needs `predictNmr()` method
3. **Bidirectional highlighting:** Cross-component communication between NMR panel and Canvas renderer
4. **Confidence data pipeline:** Full-stack concern — backend computes, API transports, scene stores, UI renders

## Starter Template Evaluation

### Not Applicable — Brownfield Feature Addition

The NMR prediction module integrates into Kendraw's existing, operational stack. No starter template or project scaffolding is needed. New `NmrService` in `kendraw_chem`, new route in `kendraw_api/routers/`, new lazy-loaded React component for spectrum panel, new `predictNmr()` in `@kendraw/api-client`.

## Core Architectural Decisions

### Decision Priority Analysis

**Already Decided (inherited from existing architecture):**

- Backend: FastAPI + RDKit, stateless, no DB (ADR-0004)
- Frontend: React 18, Zustand + TanStack Query, Canvas 2D
- API: REST JSON, OpenAPI, Pydantic v2, versioned `/api/v1/*`
- Auth: None at MVP
- Infra: Docker compose (nginx + uvicorn), pnpm workspaces monorepo

**Critical Decisions (NMR-specific):**

| #      | Decision                     | Choice                                                                                                                                                                                                         | Rationale                                                                                                    |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| NMR-D1 | Spectrum renderer            | **Canvas 2D native**                                                                                                                                                                                           | 0 kB bundle impact, reuses existing Canvas infrastructure, avoids 80 kB D3 against 350 kB budget             |
| NMR-D2 | Additive shift table format  | **TypeScript/Python dict literals** in source                                                                                                                                                                  | Static data <100 KB, versioned, tested, typed. Derived from open-access literature                           |
| NMR-D3 | NMR prediction API schema    | **POST `/api/v1/compute/nmr`** `{input, format, nucleus, frequency}` → `{peaks: [{atomIndex, shiftPpm, confidence, method, multiplicity?, couplingHz?}], metadata: {engine, dataVersion, nucleus, frequency}}` | Follows existing compute endpoint pattern. Per-peak confidence+method enable transparency UX                 |
| NMR-D4 | NMRShiftDB2 data format (V1) | **SQLite file** loaded read-only at startup                                                                                                                                                                    | Not a DB server — a static data file. Fast HOSE lookups, single-file distribution, trivial versioning        |
| NMR-D5 | Bidirectional highlighting   | **Zustand shared state** `highlightedAtomIds: Set<AtomId>`                                                                                                                                                     | Both Canvas renderer and NMR panel subscribe to same slice. Simple, debuggable, consistent                   |
| NMR-D6 | NMR panel package            | **New `@kendraw/nmr`** in monorepo                                                                                                                                                                             | Clean boundary. Contains spectrum renderer, panel component, shift tables, JCAMP-DX parser (V1). Lazy-loaded |

**Important Decisions:**

| #       | Decision               | Choice                                                                                              | Rationale                                                       |
| ------- | ---------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| NMR-D7  | NmrService structure   | **3 sub-modules**: `additive.py`, `hose.py`, `nmr_service.py` (orchestrator)                        | Independently testable. Orchestrator manages fallback chain     |
| NMR-D8  | Confidence scoring     | **Lookup count threshold** — green ≥10 refs, yellow 3-9, red <3/fallback                            | Simple, deterministic, no ML                                    |
| NMR-D9  | Scene state extension  | **Optional `nmrPrediction?: NmrPrediction` on `Page`**                                              | Non-breaking extension. Per-page (one molecule, one prediction) |
| NMR-D10 | Spectrometer frequency | **Frontend-only** — shifts in ppm are frequency-independent. Frontend renders at selected frequency | Avoids unnecessary API parameter for MVP                        |

**Deferred:** HOSE sphere depth (V1), JCAMP-DX parser (V1), ML serving (V2), 2D NMR model (V2)

### Decision Impact — Implementation Sequence

1. NMR-D2 + NMR-D7 → backend prediction works
2. NMR-D3 → endpoint exposed
3. NMR-D9 + NMR-D5 → frontend stores data
4. NMR-D1 + NMR-D6 → spectrum panel renders
5. NMR-D8 → confidence indicators
6. NMR-D10 → frequency selector

### Cross-Component Dependencies

```
@kendraw/nmr ──reads──> @kendraw/scene (highlightedAtomIds, nmrPrediction)
@kendraw/nmr ──calls──> @kendraw/api-client (predictNmr)
@kendraw/renderer-canvas ──reads──> @kendraw/scene (highlightedAtomIds)
kendraw_api ──calls──> kendraw_chem.NmrService
kendraw_chem.NmrService ──uses──> kendraw_chem.additive + kendraw_chem.hose
```

## Implementation Patterns & Consistency Rules

### Inherited Patterns

All existing Kendraw patterns apply unchanged: snake_case Python, PascalCase Pydantic, camelCase TS, kebab-case files, co-located tests, Immer immutable updates, Zustand slices.

### NMR-Specific Patterns

**Backend: NmrService follows ComputeService exactly**

- MUST use `self._rdkit_available` check (graceful degradation)
- All prediction methods MUST be pure functions (same input → same output)
- Shift table data as module-level constants, not file I/O
- Confidence scores as integers 1-3 (red/yellow/green), not strings

**NMR Prediction Response Model:**

- `NmrPeak`: `{atom_index, shift_ppm, confidence (1-3), method ("additive"|"hose_N"|"fallback"), multiplicity?, coupling_hz?}`
- `NmrPrediction`: `{nucleus, frequency_mhz, peaks[], metadata}`
- `NmrMetadata`: `{engine_version, data_version, method}`

**Frontend: @kendraw/nmr package structure:**

- `NmrPanel.tsx` — main component, lazy-loaded entry
- `SpectrumRenderer.ts` — pure Canvas 2D render function (no React, no state)
- `PeakInteraction.ts` — hit-testing, highlight dispatch
- `useNmrPrediction.ts` — TanStack Query hook, queryKey `['nmr', smiles, nucleus]`

**Bidirectional Highlighting:**

- SINGLE source of truth: `highlightedAtomIds: Set<AtomId>` in scene store
- Both Canvas renderer and NMR panel subscribe to same Zustand slice
- Click peak → `setHighlightedAtoms([atomIndex])`, click atom → same dispatch
- Clear highlights on any structure edit command

**Confidence Indicators:**

- `{3: green/filled-circle, 2: yellow/half-circle, 1: red/hollow-circle}`
- Shape MUST accompany color (colorblind accessibility)
- Same mapping everywhere (peaks, tooltips, exports)

**Testing: Benchmark pattern**

- 20-50 molecules with known experimental shifts in `tests/benchmark/`
- CI runs benchmark on every `kendraw_chem/nmr/` change
- MAE must not regress beyond +0.05 ppm from stored baseline

### Anti-Patterns (FORBIDDEN)

| Forbidden                            | Correct                                  |
| ------------------------------------ | ---------------------------------------- |
| Separate Zustand store for NMR       | `nmrPrediction` field on existing `Page` |
| D3.js import                         | Canvas 2D native                         |
| NMR in edit loop                     | User-triggered only (button/Ctrl+N)      |
| Bundle NMRShiftDB2 in source         | Separate download, read-only SQLite      |
| String confidence values             | Integer 1/2/3                            |
| WebSocket/event bus for highlighting | Zustand shared state                     |

## Project Structure & Boundaries

### New Files Added by NMR Feature

```
kendraw/
├── backend/
│   ├── kendraw_chem/
│   │   ├── nmr/                          # NEW — NMR prediction module
│   │   │   ├── __init__.py               # Exports NmrService
│   │   │   ├── nmr_service.py            # Orchestrator: fallback chain
│   │   │   ├── additive.py               # Additive table prediction (MVP)
│   │   │   ├── shift_tables.py           # Shift table constants
│   │   │   ├── hose.py                   # HOSE code prediction (V1)
│   │   │   └── confidence.py             # Confidence scoring logic
│   │   └── compute.py                    # EXISTING — unchanged
│   ├── kendraw_api/
│   │   └── routers/
│   │       ├── compute.py                # EXISTING — unchanged
│   │       └── nmr.py                    # NEW — /api/v1/compute/nmr
│   ├── kendraw_settings/
│   │   └── settings.py                   # MODIFIED — add KENDRAW_NMR_DATA_PATH
│   └── tests/
│       ├── test_nmr_service.py           # NEW — unit tests
│       ├── test_nmr_api.py               # NEW — API integration tests
│       └── benchmark/
│           ├── nmr_benchmark.py          # NEW — accuracy benchmark
│           └── benchmark_molecules.json  # NEW — reference molecules
├── packages/
│   └── nmr/                              # NEW — @kendraw/nmr package
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── NmrPanel.tsx              # Main panel (lazy entry)
│       │   ├── SpectrumRenderer.ts       # Pure Canvas 2D draw
│       │   ├── PeakInteraction.ts        # Hit-testing, clicks
│       │   ├── SpectrumExport.ts         # PNG/SVG export
│       │   ├── useNmrPrediction.ts       # TanStack Query hook
│       │   ├── types.ts
│       │   ├── constants.ts
│       │   └── __tests__/
├── packages/scene/src/types.ts           # MODIFIED — NmrPrediction on Page
├── packages/api-client/src/nmr.ts        # NEW — predictNmr()
├── packages/ui/src/panels/NmrPanelLoader.tsx  # NEW — React.lazy wrapper
└── data/                                 # NEW — optional NMRShiftDB2 dir
```

### FR → Structure Mapping

| FR Range | Capability                   | Backend                  | Frontend                               |
| -------- | ---------------------------- | ------------------------ | -------------------------------------- |
| FR1-9    | Prediction Engine            | `kendraw_chem/nmr/`      | —                                      |
| FR10-18  | Spectrum Visualization       | —                        | `packages/nmr/`                        |
| FR19-22  | Bidirectional Highlighting   | —                        | `PeakInteraction.ts`, `scene/types.ts` |
| FR23-27  | Transparency                 | `nmr/confidence.py`      | `constants.ts`, `NmrPanel.tsx`         |
| FR28-33  | Export                       | —                        | `SpectrumExport.ts`                    |
| FR34-35  | Experimental Comparison (V1) | —                        | `packages/nmr/` (V1)                   |
| FR36-38  | Data Management              | `kendraw_settings/`, CLI | —                                      |
| FR39-41  | Accessibility                | —                        | `NmrPanel.tsx`                         |

### Architectural Boundaries

- **API:** Single new endpoint `POST /api/v1/compute/nmr`. Zero changes to existing endpoints.
- **Packages:** `@kendraw/nmr` depends on `@kendraw/scene` (read) + `@kendraw/api-client`. NOT on `@kendraw/renderer-canvas`.
- **Lazy loading:** `@kendraw/ui` lazy-loads `@kendraw/nmr` — never in critical path.

### Data Flow

```
User clicks "Predict NMR"
  → useNmrPrediction → api-client/predictNmr()
  → POST /api/v1/compute/nmr → NmrService
  → Response → scene.nmrPrediction updated
  → SpectrumRenderer re-renders
  → renderer-canvas reads highlightedAtomIds (on click)
```

## Architecture Validation Results

### Coherence Validation

All NMR decisions align with existing architecture. No version conflicts, no boundary violations. NMR patterns mirror existing patterns exactly (NmrService ↔ ComputeService, NMR route ↔ compute route, TanStack Query hook ↔ existing api-client).

### Requirements Coverage

**FR Coverage: 41/41 (100%)** — every FR maps to a specific file/module in the project structure.
**NFR Coverage: All addressed** — performance (stateless pure computation + Canvas 2D), reliability (deterministic + benchmark CI), accessibility (WCAG AA), integration (Pydantic schema versioning).

### Gap Analysis

**Critical Gaps: 0**

Minor (non-blocking, deferred to V1 implementation):

1. CLI tool for `kendraw nmr-data install` — recommend `backend/scripts/install_nmr_data.py`
2. Frequency watermark on PNG/SVG exports — implementation detail

### Architecture Readiness Assessment

**Status: READY FOR IMPLEMENTATION**
**Confidence: High** — pure additive brownfield integration, every decision extends proven patterns.

**Implementation Priority:**

1. Backend: shift tables + NmrService + API endpoint
2. Frontend: scene state extension + api-client method
3. Frontend: NMR panel + spectrum renderer + bidirectional highlighting
4. Integration: end-to-end flow testing
