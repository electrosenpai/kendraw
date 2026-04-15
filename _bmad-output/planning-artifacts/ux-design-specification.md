---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
status: complete
completedAt: '2026-04-13'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/product-brief-kendraw-nmr-distillate.md'
  - 'docs/ux-design-kendraw-2026-04-12.md'
  - 'docs/chemdraw-technical-reference.md'
---

# UX Design Specification — Kendraw NMR Prediction

**Author:** Jean-Baptiste DONNETTE
**Date:** 2026-04-13

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

NMR spectrum prediction integrated into Kendraw's molecular editor — the first free tool offering bidirectional atom-peak highlighting in an open-source chemistry editor. The UX must make a complex scientific workflow (draw → predict → compare → confirm) feel effortless, while being honest about prediction limitations through transparency-first design.

### Target Users

**Persona 1 — Teaching (Marc):** Generates multiple spectra quickly, exports as PNG. Values speed and simplicity.
**Persona 2 — Research (Elise):** Confirms synthesis results with bidirectional click. Values accuracy transparency and confidence indicators.
**Persona 3 — Admin (Thomas):** Deploys and configures. No NMR panel interaction.

### Key Design Challenges

1. **Spectrum panel in limited space** — dedicated bottom panel within dense editor layout
2. **Bidirectional highlighting across two canvas surfaces** — coordinated visual feedback <16ms
3. **Confidence indicators that inform, not alarm** — "honest tool" not "broken tool"
4. **Mobile spectrum interaction** — 44px touch targets on visually small peaks

### Design Opportunities

1. **Transparency as UX differentiator** — per-peak confidence is new in chemistry software
2. **Glasswerk aesthetic on scientific data** — glassmorphism spectrum panel
3. **Keyboard-first spectrum exploration** — most accessible NMR tool

## Core User Experience

### Defining Experience

**Core interaction:** Draw molecule → click "Predict NMR" → see spectrum with highlighted peak-atom relationships. Auto-predict on panel open. No intermediate "configure and submit" step.

**Core loop:** Draw/Edit → Predict → Explore (click peaks/atoms) → Export. Repeat per molecule.

### Platform Strategy

| Platform            | Approach                                                           |
| ------------------- | ------------------------------------------------------------------ |
| Desktop (≥1024px)   | Full spectrum panel, resizable, keyboard shortcuts, mouse+keyboard |
| Tablet (768-1023px) | Bottom panel at fixed 40% height, touch with expanded hit areas    |
| Mobile (<768px)     | Full-screen overlay, tap interactions, swipe to dismiss            |

### Effortless Interactions

- **Opening panel:** Single click "NMR" button or Ctrl+N, 320ms slide-up animation
- **Getting prediction:** Auto-predicts on panel open if molecule is valid
- **Bidirectional highlighting:** <16ms, click peak → atom glows, click atom → peak glows
- **Understanding confidence:** Color + shape at a glance, no hover required
- **Exporting:** One click, format dropdown, default PNG, no modal
- **Closing panel:** Click X, Ctrl+N toggle, or Escape

### Critical Success Moments

1. **First peak highlight** — click peak, atom lights up. The "aha" moment.
2. **First confidence interpretation** — green = trust, red = approximate. Must be intuitive.
3. **First export** — publication-quality output earns professional trust.
4. **First "wrong" prediction** — confidence indicators pre-warned = "honest tool."

### Experience Principles

| #   | Principle                                 | Meaning                                                                        |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| EP1 | **Predict instantly, explain honestly**   | Auto-predict on open. Always show confidence. Never hide uncertainty.          |
| EP2 | **Click to connect**                      | Every element is clickable. Spectrum and structure are one interactive system. |
| EP3 | **Glass aesthetic, scientific precision** | Glasswerk design language on scientific data. Belongs in Kendraw.              |
| EP4 | **Zero-config default, power on demand**  | 400 MHz, 1H, auto-predict. Options available, never in the way.                |

## Desired Emotional Response

### Primary Emotional Goals

| Moment                   | Desired Emotion               | Design Driver                                |
| ------------------------ | ----------------------------- | -------------------------------------------- |
| First prediction         | **"Wow, that was instant"**   | Auto-predict, <500ms total, smooth animation |
| First peak-atom click    | **"This is connected"**       | Instant highlight <16ms, clear visual link   |
| Seeing confidence colors | **"I know what I can trust"** | Immediately readable, not alarming           |
| Exporting a spectrum     | **"This looks professional"** | Publication-quality with metadata            |
| Encountering a red peak  | **"It told me honestly"**     | Confidence pre-set expectations              |

### Emotional Journey

| Stage            | Emotion                  | How                                            |
| ---------------- | ------------------------ | ---------------------------------------------- |
| Discovery        | Curiosity, hope          | Visible "NMR" toolbar button                   |
| First use        | Impressed → engaged      | Fast, beautiful glass panel                    |
| Exploration      | Discovery, understanding | Every click reveals a connection               |
| Routine use      | Efficient, confident     | Keyboard shortcuts, auto-predict               |
| Error/limitation | Informed, not frustrated | Confidence + tooltips explain before confusion |
| Return visit     | Familiarity, reliability | Deterministic predictions                      |

### Emotional Design Principles

1. **Honesty is warmth** — showing limitations is caring, not admitting failure
2. **Speed creates magic** — under 500ms feels like "just knows"
3. **Connection creates understanding** — bidirectional highlight is the emotional core
4. **Beauty earns trust** — Glasswerk on NMR data says "someone cared"

## UX Pattern Analysis & Inspiration

### Inspiring Products

- **ChemDraw ChemNMR:** Bottom panel layout, bidirectional click, ppm axis convention. Improve: no confidence, dated design.
- **nmrdb.org:** Clean spectrum renderer, minimal chrome. Avoid: disconnected editor-spectrum.
- **VS Code bottom panel:** Resizable, keyboard toggle, smooth animation. Adopt: resize handle, Ctrl+N toggle.
- **Kendraw Property Panel:** Glasswerk surface, copy-on-click, live update. Adapt: glass treatment for NMR panel.

### Transferable Patterns

- Bottom resizable panel (VS Code) → NMR panel with drag handle
- Bidirectional highlighting (ChemDraw) → click peak ↔ highlight atom
- Glass surface (Kendraw Glasswerk) → NMR panel same treatment
- Ppm axis right-to-left (chemistry convention) → always high ppm left
- Zoom by drag-select (nmrdb.org) → click-drag to zoom ppm range
- Copy-on-click (Kendraw property panel) → click peak label to copy ppm value

### Anti-Patterns to Avoid

- Opaque predictions without confidence (ChemDraw)
- Modal configuration dialogs before seeing results
- Information overload (MestReNova complexity)
- Error-style red for low confidence (must use shape + label to disambiguate)

## Design System Foundation

### Design System: Glasswerk (existing, extended)

NMR panel extends Glasswerk exactly as existing panels do. No new design system.

**Token Mapping:**

- Panel: `--surface-glass`, `--blur-glass-md`, `0` radius (full-width)
- Text: `--t-tiny` (peak labels), `--t-small` (axis), `--t-mono` (shift values), `--t-h3` (headers)
- Spacing: `--s-4` horizontal, `--s-3` vertical
- Confidence: `--color-success` (green), `--color-warning` (yellow), `--color-error` (red)
- Highlight: `--color-primary` (#7AB8FF)
- Resize handle: `--neutral-700` default, `--color-primary` on hover

**New NMR tokens:** `--nmr-panel-min-height: 200px`, `--nmr-panel-default-height: 33vh`, `--nmr-panel-max-height: 60vh`, `--nmr-peak-width: 2px`, `--nmr-axis-color: var(--neutral-500)`, `--nmr-grid-color: var(--neutral-700)`, `--nmr-predicted-color: var(--color-primary)`, `--nmr-experimental-color: var(--color-error)`

## Defining Core Experience

### Defining Experience

Core experience is **bidirectional exploration** — structure and spectrum as one interactive system. The 3-second test: drawn molecule → panel open → click peak → atom highlights. Auto-predict on open, no config dialogs.

### User Mental Model

Chemists see NMR as a structural fingerprint — each peak IS an atom in a chemical environment. The spectrum is an alternate view of the same molecule, not a separate output. Highlighting reinforces this: click peak, atom glows — same object, two perspectives.

### Novel UX Patterns

1. **Confidence-as-texture:** Peak visual rendering encodes confidence (solid/vivid = high, hollow/muted = low)
2. **Hover-to-learn, click-to-link:** Hover = tooltip (shift, method, confidence). Click = bidirectional highlight.
3. **Auto-predict-on-open:** Panel open IS the prediction trigger. No "Run" button.

### Experience Mechanics

- **Panel open:** 320ms slide-up → auto-predict → loading pulse → spectrum renders
- **Molecule edit while open:** re-predict (debounced 500ms), highlights clear
- **Panel close:** 320ms slide-down, canvas reclaims space, NMR state preserved
- **Click peak:** peak border `--color-primary`, atom glow ring (24px, 50% opacity), equivalent atoms ALL highlight
- **Click atom:** atom glow, corresponding peak highlighted, spectrum auto-scrolls if needed
- **Click empty:** all highlights clear

## Visual Design Foundation

### Color System

NMR-specific: peaks `--color-primary`, confidence via `--color-success`/`--color-warning`/`--color-error`, highlight glow `--color-primary` at 50% opacity, axes `--neutral-500`, grid `--neutral-700`, peak labels `--neutral-100`, experimental overlay (V1) `--color-error`.

### Typography

Panel header `--t-h3` (18px/600), axis labels `--t-small` (13px), ppm ticks `--t-tiny` (11px/uppercase), peak shift values `--t-mono` (JetBrains Mono 13px), tooltips `--t-tiny`.

### Layout

NMR panel spans full width below canvas area. 33vh default, 200px min, 60vh max. 8px resize handle. Panel header 40px with nucleus label, frequency selector, export button, close button. Spectrum canvas fills remaining height with 16px horizontal / 12px vertical padding.

## Design Direction: Glasswerk Scientific

Glasswerk Extended — apply existing Kendraw design language to NMR data. Dark glass surface + bright blue peaks = optimal contrast. Confidence colors are the only semantic color use. No alternative directions — visual consistency is non-negotiable.

## User Journey Flows

### Predict & Explore (Research)

Canvas only → Click NMR/Ctrl+N → Panel slides up (320ms) → Auto-predict → Loading pulse → Spectrum renders (<500ms) → Click peaks to explore (bidirectional highlight <16ms) → Export PNG.

### Quick Multi-Molecule (Teaching)

Panel stays open. Draw molecule → auto-predict → export → draw next molecule → re-predict (debounced 500ms). No close/reopen needed.

### Low-Confidence Handling

Complex molecule → mixed green/yellow/red peaks → hover red peak → tooltip: "Additive fallback — limited data." Honest, not alarming.

### Journey Patterns

- Panel persists across edits, never auto-closes
- Re-predict on edit (debounced 500ms)
- State preserved on close/reopen
- Errors shown inline in panel, never modals
- Keyboard fast path: Ctrl+N → Tab → Enter → Ctrl+E → Escape

## Component Strategy

### Existing Components Reused

Glass Panel (C4), Button Primary (C1), Tool Button (C2), Dropdown (C6), Tooltip (C8), Toast (C7) — all from Glasswerk.

### Custom NMR Components

- **NMR-C1 Spectrum Canvas:** Pure Canvas 2D. Lorentzian peaks, ppm axis (right-to-left), grid, labels. Zoom by drag-select, pan by click-drag, double-click reset.
- **NMR-C2 Peak Indicator:** 2px line + Lorentzian curve, confidence color + shape (filled/half/hollow circle 8px). 44px invisible hit area.
- **NMR-C3 Peak Tooltip:** Glass surface, shows δ ppm (copyable), atom type, confidence shape+label, method. 400ms hover delay, immediate on focus.
- **NMR-C4 Panel Header:** 40px glass bar. `[1H NMR] [400 MHz ▾] [spacer] [Export ▾] [✕]`
- **NMR-C5 Resize Handle:** 8px tall, 2px center line, `row-resize` cursor. `--color-primary` on hover. Double-click resets height.
- **NMR-C6 Atom Highlight Glow:** 24px radius glow ring on canvas atom, `--color-primary` 50% opacity, 120ms fade-in.
- **NMR-C7 Data Table:** Visually hidden `sr-only` table for screen readers. Columns: atom index, shift, confidence, method.

## UX Consistency Patterns

### Button Hierarchy

Primary (Export) = `--color-primary` fill. Secondary (frequency, nucleus) = ghost button. Icon-only (close, copy) = 32×32px transparent.

### Feedback

- Prediction loading: subtle pulse on header text
- Prediction complete: spectrum fades in (120ms)
- Export complete: toast "Spectrum exported as PNG" (5s)
- Error: inline message in spectrum area, `--color-error` icon
- Backend unreachable: NMR button disabled + tooltip
- Copy value: brief flash + "Copied" (1.5s)

### Navigation Matrix

| Action           | Mouse              | Keyboard      | Touch              |
| ---------------- | ------------------ | ------------- | ------------------ |
| Open/close panel | Click NMR button   | Ctrl+N        | Tap NMR button     |
| Navigate peaks   | Click              | Tab/Shift+Tab | Tap (44px target)  |
| Highlight        | Click peak/atom    | Enter         | Tap peak/atom      |
| Zoom             | Drag-select X axis | +/-           | Pinch              |
| Pan              | Click-drag         | Arrow keys    | Swipe              |
| Reset zoom       | Double-click       | Home          | Double-tap         |
| Export           | Click Export ▾     | Ctrl+E        | Tap Export ▾       |
| Close            | Click ✕            | Escape        | Tap ✕ / swipe down |

## Responsive Design & Accessibility

### Responsive Breakpoints

- **Desktop ≥1024px:** Full panel, resizable, all controls visible, keyboard shortcuts
- **Tablet 768–1023px:** Fixed 40% height, no resize, frequency/export in overflow menu (⋯), property panel auto-collapses
- **Mobile <768px:** Full-screen overlay, swipe down to dismiss, simplified header, deferred bidirectional highlight

### Accessibility (WCAG AA)

- Keyboard: Tab peaks, Enter highlight, Arrow pan, +/- zoom, Escape close
- Screen reader: `sr-only` data table, `aria-live="polite"` for state changes
- Color independence: confidence = color AND shape (filled/half/hollow circle)
- Contrast: 4.5:1 text, 3:1 graphical, tested dark + light mode
- Touch targets: ≥44px on all interactive elements
- Reduced motion: `prefers-reduced-motion` disables all animations
- Reduced transparency: glass becomes solid `--bg-elevated`
- Focus management: panel open → focus first peak, panel close → focus NMR button
