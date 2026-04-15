---
stepsCompleted:
  [
    'step-01-validate-prerequisites',
    'step-02-design-epics',
    'step-03-create-stories',
    'step-04-final-validation',
  ]
status: complete
completedAt: '2026-04-13'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Kendraw NMR Prediction - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Kendraw NMR Prediction, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Chemist can request 1H NMR chemical shift prediction for any drawn molecule
- FR2: Chemist can request 13C NMR chemical shift prediction for any drawn molecule (V1)
- FR3: System can predict chemical shifts using additive increment tables without external data dependencies
- FR4: System can predict chemical shifts using HOSE code algorithm with NMRShiftDB2 database when optional data is installed (V1)
- FR5: System can fall back gracefully through the prediction chain (HOSE long sphere → short sphere → additive table)
- FR6: System can predict 1H multiplicity and J-coupling constants using empirical rules (V1)
- FR7: System can classify 13C atoms by DEPT category (V1)
- FR8: System can compute predictions within 300ms for molecules up to 500 atoms
- FR9: System can reject molecules exceeding the configured atom limit with a clear error message
- FR10: Chemist can view a predicted NMR spectrum as an interactive chart in a dedicated panel below the canvas
- FR11: Chemist can open and close the spectrum panel via a toolbar button or Ctrl+N
- FR12: Chemist can resize the spectrum panel by dragging a handle
- FR13: Chemist can zoom into a specific ppm range on the spectrum
- FR14: Chemist can pan across the spectrum's ppm axis
- FR15: Chemist can view peak labels showing chemical shift values in ppm
- FR16: Chemist can view the ppm axis scale and relative intensity axis
- FR17: Chemist can select the simulated spectrometer frequency (300/400/500/600/800 MHz)
- FR18: Chemist can view Lorentzian peak shapes for each predicted chemical shift
- FR19: Chemist can click a peak on the spectrum to highlight the corresponding atom(s)
- FR20: Chemist can click an atom on the molecular structure to highlight the corresponding peak
- FR21: Chemist can tap a peak or atom on touch devices for bidirectional highlighting
- FR22: System can update bidirectional highlighting within 16ms (60fps)
- FR23: Chemist can see a color-coded confidence indicator on each predicted peak
- FR24: Chemist can distinguish confidence levels without relying on color alone (shape differentiation)
- FR25: Chemist can hover/tap a peak to see a tooltip with prediction method and confidence rationale
- FR26: Chemist can view which prediction method produced each individual peak (V1)
- FR27: System can display a prompt when NMRShiftDB2 data is not installed
- FR28: Chemist can export the predicted spectrum as a PNG image
- FR29: Chemist can export the predicted spectrum as an SVG image (V1)
- FR30: Chemist can export the predicted spectrum as a PDF document (V1)
- FR31: Chemist can export predicted shift data as a CSV table (V1)
- FR32: System can include simulation metadata in all exports
- FR33: Chemist can view a tabular data representation of predicted peaks (accessible format)
- FR34: Chemist can import a JCAMP-DX file containing an experimental NMR spectrum (late V1)
- FR35: Chemist can view predicted and experimental spectra overlaid on the same axis (late V1)
- FR36: Administrator can install the optional NMRShiftDB2 database via CLI (V1)
- FR37: System can detect whether NMRShiftDB2 data is installed and use highest-accuracy method
- FR38: Administrator can verify NMR service status via health endpoint (V1)
- FR39: Chemist can navigate between peaks using keyboard (Tab/Shift+Tab) and activate with Enter
- FR40: Chemist can pan the spectrum using arrow keys and zoom using +/- keys
- FR41: Screen reader users can access predicted peak data as a structured data table

### Non-Functional Requirements

- NFR1: NMR prediction API response < 300ms for molecules ≤ 500 atoms
- NFR2: NMR prediction API response < 100ms for molecules ≤ 100 atoms
- NFR3: Spectrum panel initial render < 100ms after API response
- NFR4: Bidirectional highlight update < 16ms (60fps)
- NFR5: Spectrum zoom/pan interaction sustained 60fps
- NFR6: PNG export generation < 1s
- NFR7: Backend memory overhead for NMRShiftDB2 ≤ 200 MB
- NFR8: Frontend bundle impact 0 kB (lazy-loaded)
- NFR9: Deterministic output — same input always produces identical results
- NFR10: Prediction availability — additive tables require no external data, MVP always works
- NFR11: Graceful degradation — NMRShiftDB2 missing falls back to additive tables silently
- NFR12: Error handling — invalid input returns structured error within 100ms
- NFR13: Regression protection — benchmark test suite, MAE must not regress > +0.05 ppm
- NFR14: WCAG AA compliance for all NMR panel UI elements
- NFR15: Keyboard operability for all spectrum interactions
- NFR16: Screen reader support via structured data table
- NFR17: Color independence — confidence levels distinguishable by shape + color
- NFR18: Touch targets minimum 44×44 CSS pixels
- NFR19: Reduced motion — disable animations under prefers-reduced-motion
- NFR20: API contract stability — breaking changes require new API version
- NFR21: Input format support — SMILES, MOL V2000/V3000, CDXML with auto-detection
- NFR22: Export format compliance — PNG standard, SVG 1.1, CSV RFC 4180, JCAMP-DX 5.0
- NFR23: Existing system compatibility — zero regression to existing endpoints

### Additional Requirements (Architecture)

- AR1: NmrService follows ComputeService pattern (graceful degradation, \_rdkit_available check)
- AR2: Additive shift tables as Python dict literals in source code (no file I/O)
- AR3: NMR API endpoint: POST /api/v1/compute/nmr with Pydantic schema
- AR4: NMRShiftDB2 data as read-only SQLite file loaded at startup (V1)
- AR5: Bidirectional highlighting via Zustand shared state (highlightedAtomIds)
- AR6: New @kendraw/nmr package in monorepo, lazy-loaded from @kendraw/ui
- AR7: NmrService has 3 sub-modules: additive.py, hose.py (V1), nmr_service.py
- AR8: Confidence scoring as integer 1-3 based on lookup count threshold
- AR9: Scene state extension: optional nmrPrediction field on Page type
- AR10: Spectrometer frequency is frontend-only (shifts in ppm are frequency-independent)
- AR11: Benchmark test suite of 20-50 molecules required in CI
- AR12: Canvas 2D native for spectrum rendering (not D3.js)

### UX Design Requirements

- UX-DR1: NMR panel as dedicated bottom panel with glass surface (Glasswerk), full width, 33vh default height
- UX-DR2: Resize handle (NMR-C5): 8px tall, row-resize cursor, --color-primary on hover, double-click resets
- UX-DR3: Panel header (NMR-C4): 40px, [nucleus label] [frequency ▾] [spacer] [Export ▾] [✕]
- UX-DR4: Spectrum Canvas (NMR-C1): Lorentzian peaks, ppm axis right-to-left, grid lines, peak labels
- UX-DR5: Peak indicators (NMR-C2): 2px line + confidence color + shape (filled/half/hollow circle 8px), 44px hit area
- UX-DR6: Peak tooltips (NMR-C3): glass surface, δ ppm (copyable), atom type, confidence, method. 400ms delay.
- UX-DR7: Atom highlight glow (NMR-C6): 24px radius, --color-primary 50% opacity, 120ms fade-in
- UX-DR8: Accessible data table (NMR-C7): sr-only table with atom index, shift, confidence, method columns
- UX-DR9: Auto-predict on panel open (no "Run" button). Re-predict on molecule edit (debounced 500ms).
- UX-DR10: Panel open/close animation: 320ms, --ease-out. Reduced motion: instant.
- UX-DR11: Zoom by drag-select on X axis, pan by click-drag, double-click reset
- UX-DR12: Tablet (768-1023px): fixed 40% height, frequency/export in overflow menu
- UX-DR13: Mobile (<768px): full-screen overlay, swipe down to dismiss, simplified header
- UX-DR14: Focus management: panel open → focus first peak, panel close → focus NMR button
- UX-DR15: aria-live="polite" for prediction loading/complete/error announcements
- UX-DR16: Export flow: dropdown button, default PNG, 2 clicks total, toast confirmation
- UX-DR17: Loading state: subtle pulse on panel header text during prediction
- UX-DR18: Error state: inline message in spectrum area, --color-error icon, persists until next valid prediction

### FR Coverage Map

| FR   | Epic    | Description                     |
| ---- | ------- | ------------------------------- |
| FR1  | Epic 1  | Request 1H prediction           |
| FR2  | Epic 7  | Request 13C prediction (V1)     |
| FR3  | Epic 1  | Additive table prediction       |
| FR4  | Epic 8  | HOSE code prediction (V1)       |
| FR5  | Epic 8  | Graceful fallback chain (V1)    |
| FR6  | Epic 9  | Multiplicity & J-coupling (V1)  |
| FR7  | Epic 7  | DEPT classification (V1)        |
| FR8  | Epic 1  | 300ms prediction budget         |
| FR9  | Epic 1  | Atom limit rejection            |
| FR10 | Epic 1  | Interactive spectrum panel      |
| FR11 | Epic 1  | Open/close panel                |
| FR12 | Epic 4  | Resize panel                    |
| FR13 | Epic 4  | Zoom spectrum                   |
| FR14 | Epic 4  | Pan spectrum                    |
| FR15 | Epic 1  | Peak labels                     |
| FR16 | Epic 1  | Axis scale                      |
| FR17 | Epic 4  | Frequency selector              |
| FR18 | Epic 1  | Lorentzian peaks                |
| FR19 | Epic 2  | Click peak → highlight atom     |
| FR20 | Epic 2  | Click atom → highlight peak     |
| FR21 | Epic 6  | Touch bidirectional             |
| FR22 | Epic 2  | 16ms highlight response         |
| FR23 | Epic 3  | Color-coded confidence          |
| FR24 | Epic 3  | Shape differentiation           |
| FR25 | Epic 3  | Confidence tooltip              |
| FR26 | Epic 8  | Method display per peak (V1)    |
| FR27 | Epic 3  | NMRShiftDB2 install prompt      |
| FR28 | Epic 5  | PNG export                      |
| FR29 | Epic 10 | SVG export (V1)                 |
| FR30 | Epic 10 | PDF export (V1)                 |
| FR31 | Epic 10 | CSV export (V1)                 |
| FR32 | Epic 5  | Export metadata                 |
| FR33 | Epic 6  | Accessible data table           |
| FR34 | Epic 11 | JCAMP-DX import (late V1)       |
| FR35 | Epic 11 | Experimental overlay (late V1)  |
| FR36 | Epic 8  | NMRShiftDB2 CLI install (V1)    |
| FR37 | Epic 8  | Auto-detect installed data (V1) |
| FR38 | Epic 8  | Health endpoint NMR status (V1) |
| FR39 | Epic 6  | Keyboard peak navigation        |
| FR40 | Epic 6  | Keyboard zoom/pan               |
| FR41 | Epic 6  | Screen reader data table        |

## Epic List

### Epic 1: NMR Prediction & Spectrum Display (MVP)

Chemist can draw a molecule, open the NMR panel, and see a predicted 1H spectrum with labeled Lorentzian peaks on a glass-surfaced bottom panel.
**FRs:** FR1, FR3, FR8, FR9, FR10, FR11, FR15, FR16, FR18

### Epic 2: Bidirectional Highlighting (MVP)

Chemist can click a peak to highlight the corresponding atom, and click an atom to highlight the corresponding peak.
**FRs:** FR19, FR20, FR22

### Epic 3: Confidence Indicators & Transparency (MVP)

Chemist can see per-peak confidence with color+shape indicators, hover for method tooltips, and get prompted to install NMRShiftDB2.
**FRs:** FR23, FR24, FR25, FR27

### Epic 4: Spectrum Interaction (MVP)

Chemist can zoom into a ppm range, pan the spectrum, resize the panel, and select spectrometer frequency.
**FRs:** FR12, FR13, FR14, FR17

### Epic 5: Export & Publication (MVP)

Chemist can export the spectrum as PNG with citation-ready metadata.
**FRs:** FR28, FR32

### Epic 6: Accessibility & Responsive (MVP)

All users can navigate via keyboard and screen reader. Works on tablet and mobile with touch.
**FRs:** FR21, FR33, FR39, FR40, FR41

### Epic 7: 13C Prediction & DEPT (V1)

Chemist can predict 13C NMR with DEPT classification.
**FRs:** FR2, FR7

### Epic 8: HOSE Code & NMRShiftDB2 (V1)

Higher-accuracy predictions with HOSE code, transparent fallback chain, CLI data install, health endpoint.
**FRs:** FR4, FR5, FR26, FR36, FR37, FR38

### Epic 9: Multiplicity & J-Coupling (V1)

1H spectrum shows splitting patterns and coupling constants.
**FRs:** FR6

### Epic 10: Advanced Export (V1)

Export as SVG, PDF, CSV.
**FRs:** FR29, FR30, FR31

### Epic 11: Experimental Overlay (Late V1)

Import JCAMP-DX, overlay predicted vs experimental spectra.
**FRs:** FR34, FR35

## Epic 1: NMR Prediction & Spectrum Display

Chemist can draw a molecule, open the NMR panel, and see a predicted 1H spectrum with labeled Lorentzian peaks.

### Story 1.1: Additive Shift Table Data

As a developer,
I want a complete set of 1H additive chemical shift tables derived from open-access data,
So that the prediction engine has reference data to work from.

**Acceptance Criteria:**

**Given** the shift_tables.py module is loaded
**When** querying shift values for common functional groups
**Then** base shifts and substituent increments are returned as typed Python dictionaries
**And** all data is derived from open-access sources (not copyrighted textbook tables)
**And** coverage includes at least 15 common organic functional group environments

### Story 1.2: NMR Prediction Service (Backend)

As a chemist,
I want the backend to predict 1H chemical shifts from a molecular structure,
So that I can get NMR predictions for any molecule I draw.

**Acceptance Criteria:**

**Given** a valid SMILES string for ethanol ("CCO")
**When** NmrService.predict_nmr(mol, format="smiles", nucleus="1H") is called
**Then** a NmrPrediction response is returned with peaks containing atom_index, shift_ppm, confidence (1-3), and method ("additive")
**And** response time is < 300ms for molecules ≤ 500 atoms
**And** the \_rdkit_available graceful degradation pattern is followed
**And** molecules exceeding KENDRAW_MAX_MOL_ATOMS return a structured error

### Story 1.3: NMR API Endpoint

As a chemist,
I want an API endpoint that accepts a molecule and returns NMR predictions,
So that the frontend can request predictions.

**Acceptance Criteria:**

**Given** the backend is running
**When** POST /api/v1/compute/nmr is called with `{"input": "CCO", "format": "smiles", "nucleus": "1H"}`
**Then** a JSON response with peaks array and metadata is returned
**And** invalid input returns 400 with error envelope
**And** molecules exceeding atom limit return 413
**And** the endpoint appears in /openapi.json

### Story 1.4: Scene State Extension & API Client

As a developer,
I want NMR prediction data stored in the scene state and an API client method to fetch it,
So that frontend components can access prediction results reactively.

**Acceptance Criteria:**

**Given** a Page in the scene store
**When** an NMR prediction is received from the API
**Then** page.nmrPrediction is populated with the prediction data
**And** predictNmr() method exists in @kendraw/api-client using TanStack Query with key ['nmr', smiles, nucleus]
**And** existing serialization ignores the nmrPrediction field gracefully

### Story 1.5: NMR Panel Shell & Toggle

As a chemist,
I want to open and close an NMR panel below the canvas,
So that I have a dedicated space to view spectra.

**Acceptance Criteria:**

**Given** a molecule is drawn on the canvas
**When** I click the "NMR" toolbar button or press Ctrl+N
**Then** a glass-surfaced bottom panel slides up (320ms, --ease-out) with header bar
**And** the canvas resizes to accommodate the panel (default 33vh)
**And** pressing Ctrl+N again or clicking ✕ closes the panel
**And** the panel is lazy-loaded with 0 kB initial bundle impact
**And** when panel opens, auto-predict fires for the current molecule

### Story 1.6: Spectrum Renderer (Canvas 2D)

As a chemist,
I want to see my predicted NMR spectrum as Lorentzian peaks with labeled axes,
So that I can visually interpret the prediction.

**Acceptance Criteria:**

**Given** the NMR panel is open and a prediction exists
**When** the spectrum renderer draws to the Canvas 2D surface
**Then** Lorentzian peak shapes are drawn at each predicted shift position
**And** ppm axis is right-to-left (high ppm left, low ppm right)
**And** relative intensity axis is displayed vertically
**And** peak labels show shift values in ppm (JetBrains Mono)
**And** render completes in < 100ms
**And** loading state shows subtle pulse on header text during prediction

## Epic 2: Bidirectional Highlighting

Chemist can click peaks and atoms to see their relationship.

### Story 2.1: Highlighted Atoms Shared State

As a developer,
I want a shared highlight state in the scene store,
So that both the spectrum panel and canvas renderer can read/write atom highlights.

**Acceptance Criteria:**

**Given** the scene store
**When** setHighlightedAtoms([atomId]) is dispatched
**Then** highlightedAtomIds contains the specified atoms
**And** both @kendraw/nmr and @kendraw/renderer-canvas subscribe to this state
**And** clearHighlightedAtoms() empties the set
**And** any structure edit command automatically clears highlights

### Story 2.2: Click Peak → Highlight Atom

As a chemist,
I want to click a peak on the spectrum and see the corresponding atom highlighted,
So that I can understand which atom produces which signal.

**Acceptance Criteria:**

**Given** a predicted spectrum is displayed
**When** I click a peak on the spectrum
**Then** the corresponding atom shows a glow ring (--color-primary, 24px radius, 50% opacity, 120ms fade-in)
**And** equivalent atoms all highlight
**And** highlight update completes within 16ms
**And** clicking a different peak clears previous and sets new highlight
**And** clicking empty space clears all highlights

### Story 2.3: Click Atom → Highlight Peak

As a chemist,
I want to click an atom on the molecule and see its peak highlighted,
So that I can find any atom's NMR signal.

**Acceptance Criteria:**

**Given** a predicted spectrum is displayed
**When** I click an atom on the molecular canvas
**Then** the corresponding peak gets a 2px --color-primary border ring
**And** if the peak is outside viewport, spectrum auto-scrolls
**And** clicking empty canvas clears all highlights

## Epic 3: Confidence Indicators & Transparency

Chemist can see how reliable each prediction is.

### Story 3.1: Backend Confidence Scoring

As a chemist,
I want each predicted peak to include a confidence score,
So that I know how much to trust each prediction.

**Acceptance Criteria:**

**Given** a prediction is computed
**When** NmrService returns results
**Then** each peak has confidence: 3 (≥10 refs), 2 (3-9 refs), 1 (<3 or fallback)
**And** confidence is deterministic (same molecule = same scores)

### Story 3.2: Confidence Peak Rendering

As a chemist,
I want peaks colored and shaped by confidence,
So that I can see reliability at a glance.

**Acceptance Criteria:**

**Given** a spectrum with confidence data
**When** viewing peaks
**Then** high (3) = --color-success + filled circle (8px)
**And** medium (2) = --color-warning + half circle
**And** low (1) = --color-error + hollow circle
**And** shapes alone distinguish confidence (colorblind-safe)
**And** contrast ≥ 3:1 against glass background

### Story 3.3: Peak Tooltip

As a chemist,
I want to hover a peak for detailed information,
So that I can understand each prediction's basis.

**Acceptance Criteria:**

**Given** a spectrum with peaks
**When** hovering a peak for 400ms (or focusing via keyboard)
**Then** glass tooltip shows: δ ppm (copyable), atom type, confidence shape+label, method
**And** copy icon copies ppm to clipboard with "Copied" flash
**And** tooltip dismisses on leave, blur, or Escape

### Story 3.4: NMRShiftDB2 Install Prompt

As a chemist,
I want to be informed about better accuracy availability,
So that I can upgrade prediction quality.

**Acceptance Criteria:**

**Given** NMRShiftDB2 is not installed and this is first prediction
**When** spectrum renders
**Then** non-blocking banner: "Install NMR database for 3x better accuracy — one-time 50 MB download"
**And** banner is dismissible and does not reappear after dismissal

## Epic 4: Spectrum Interaction

Chemist can zoom, pan, resize, and configure the spectrum.

### Story 4.1: Panel Resize

As a chemist,
I want to resize the NMR panel by dragging,
So that I can balance spectrum visibility with canvas space.

**Acceptance Criteria:**

**Given** NMR panel is open
**When** dragging the resize handle
**Then** panel height changes between 200px min and 60vh max
**And** handle shows --color-primary on hover/drag
**And** double-click resets to 33vh
**And** cursor is row-resize on hover

### Story 4.2: Spectrum Zoom

As a chemist,
I want to zoom into a ppm range,
So that I can examine closely spaced peaks.

**Acceptance Criteria:**

**Given** a spectrum is displayed
**When** click-dragging on X axis to select a range
**Then** spectrum zooms to that range
**And** double-click resets to full range
**And** zoom maintains 60fps

### Story 4.3: Spectrum Pan

As a chemist,
I want to pan when zoomed in,
So that I can explore different regions.

**Acceptance Criteria:**

**Given** spectrum is zoomed
**When** click-dragging on spectrum area
**Then** view pans horizontally
**And** arrow keys also pan
**And** panning stops at boundaries

### Story 4.4: Frequency Selector

As a chemist,
I want to change spectrometer frequency,
So that the spectrum matches my instrument.

**Acceptance Criteria:**

**Given** NMR panel header
**When** clicking frequency dropdown
**Then** options 300/400/500/600/800 MHz shown, 400 default
**And** changing frequency re-renders spectrum
**And** frequency included in export metadata

## Epic 5: Export & Publication

Chemist can export the spectrum for publications.

### Story 5.1: PNG Export with Metadata

As a chemist,
I want to export the spectrum as PNG,
So that I can include it in documents.

**Acceptance Criteria:**

**Given** a spectrum is displayed
**When** clicking Export → PNG
**Then** PNG downloads with spectrum, axes, labels, confidence, metadata watermark
**And** export < 1s
**And** toast "Spectrum exported as PNG" (5s)
**And** clean background (solid, not glass)

## Epic 6: Accessibility & Responsive

All users can use the spectrum on any device.

### Story 6.1: Keyboard Navigation

As a keyboard-only user,
I want to navigate and control the spectrum without a mouse,
So that I can use NMR prediction accessibly.

**Acceptance Criteria:**

**Given** NMR panel is open
**When** pressing Tab, focus moves between peaks in ppm order
**And** Enter activates highlighting
**And** +/- zoom, Arrow keys pan, Home resets, Escape closes
**And** focused peak shows 2px focus ring

### Story 6.2: Screen Reader Data Table

As a screen reader user,
I want prediction data as a structured table,
So that I can access NMR data without seeing the canvas.

**Acceptance Criteria:**

**Given** a prediction exists
**When** screen reader encounters NMR panel
**Then** sr-only table with Atom Index, Shift, Confidence, Method columns
**And** aria-live="polite" announces "Prediction complete: N peaks found"

### Story 6.3: Touch Interaction

As a mobile/tablet user,
I want to tap peaks and atoms for highlighting,
So that bidirectional interaction works on touch.

**Acceptance Criteria:**

**Given** spectrum on touch device
**When** tapping a peak
**Then** corresponding atom highlights
**And** touch targets ≥ 44×44px
**And** pinch zooms, swipe pans

### Story 6.4: Responsive Layout

As a chemist on any device,
I want the panel to adapt to my screen,
So that NMR works on tablet and mobile.

**Acceptance Criteria:**

**Given** tablet (768-1023px)
**Then** panel at fixed 40% height, overflow menu for controls
**Given** mobile (<768px)
**Then** full-screen overlay, swipe down to dismiss

## Epic 7: 13C Prediction & DEPT (V1)

### Story 7.1: 13C Additive Tables & Prediction

As a chemist,
I want to predict 13C chemical shifts,
So that I can analyze carbon NMR.

**Acceptance Criteria:**

**Given** a valid molecule
**When** requesting 13C prediction
**Then** carbon shifts returned with confidence
**And** nucleus toggle in panel header switches 1H/13C

### Story 7.2: DEPT Classification

As a chemist,
I want 13C peaks labeled by DEPT type,
So that I can identify carbon environments.

**Acceptance Criteria:**

**Given** 13C prediction
**When** viewing spectrum
**Then** peaks labeled CH3/CH2/CH/C
**And** DEPT in tooltip and data table

## Epic 8: HOSE Code & NMRShiftDB2 (V1)

### Story 8.1: NMRShiftDB2 Data Download CLI

As an administrator,
I want to install the NMRShiftDB2 database via CLI,
So that higher-accuracy predictions are available.

**Acceptance Criteria:**

**Given** backend is installed
**When** running `kendraw nmr-data install`
**Then** SQLite file downloads to KENDRAW_NMR_DATA_PATH
**And** progress shown and success confirmed
**And** CC-BY-SA attribution included

### Story 8.2: HOSE Code Prediction Engine

As a chemist,
I want higher-accuracy HOSE code predictions,
So that results are closer to experimental values.

**Acceptance Criteria:**

**Given** NMRShiftDB2 installed
**When** requesting prediction
**Then** HOSE code used with fallback: long sphere → short sphere → additive
**And** method field shows "hose_5", "hose_3", "additive", or "fallback"
**And** MAE < 0.5 ppm on benchmark set

### Story 8.3: Transparent Method Display

As a chemist,
I want to see which method produced each peak,
So that I understand per-atom reliability.

**Acceptance Criteria:**

**Given** mixed-method prediction
**When** hovering a peak
**Then** tooltip shows specific method (e.g., "HOSE code 5-sphere match")

### Story 8.4: Health Endpoint NMR Status

As an administrator,
I want to check NMR service status,
So that I can verify the system works.

**Acceptance Criteria:**

**Given** backend running
**When** GET /api/v1/health
**Then** response includes nmr status, method, and data version

## Epic 9: Multiplicity & J-Coupling (V1)

### Story 9.1: Multiplicity & Coupling Prediction

As a chemist,
I want 1H peaks with splitting patterns and coupling constants,
So that the spectrum looks realistic.

**Acceptance Criteria:**

**Given** 1H prediction with multiplicity enabled
**When** viewing spectrum
**Then** peaks display as split patterns (s/d/t/q/m) via Karplus rules
**And** J-coupling Hz in tooltips
**And** data included in CSV export

## Epic 10: Advanced Export (V1)

### Story 10.1: SVG & PDF Export

As a chemist,
I want vector-quality export,
So that publications look crisp at any resolution.

**Acceptance Criteria:**

**Given** spectrum displayed
**When** selecting SVG or PDF
**Then** valid file downloads with full spectrum and metadata

### Story 10.2: CSV Data Export

As a chemist,
I want tabular data export,
So that I can process data in spreadsheets.

**Acceptance Criteria:**

**Given** prediction exists
**When** selecting CSV
**Then** RFC 4180 CSV downloads with atom_index, shift_ppm, confidence, method, multiplicity, coupling_hz

## Epic 11: Experimental Overlay (Late V1)

### Story 11.1: JCAMP-DX Import

As a chemist,
I want to import my experimental spectrum,
So that I can compare with predictions.

**Acceptance Criteria:**

**Given** NMR panel open with prediction
**When** importing JCAMP-DX file
**Then** experimental data parsed and stored (JCAMP-DX 5.0 standard)

### Story 11.2: Predicted vs Experimental Overlay

As a chemist,
I want both spectra overlaid,
So that I can visually confirm my structure.

**Acceptance Criteria:**

**Given** predicted and experimental spectra exist
**When** viewing panel
**Then** predicted in blue (--color-primary), experimental in red (--color-error)
**And** shared ppm axis, legend shown, either toggleable
