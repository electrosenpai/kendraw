# Benchmark: Kendraw v0.1.0 vs ChemDraw — Adversarial Review

**Date:** 2026-04-12
**Reviewer:** Adversarial audit (automated)
**Methodology:** Full source code read of every file in `packages/`, cross-referenced against PRD FRs and ChemDraw feature set.

> **Executive verdict:** Kendraw v0.1.0 has solid architecture and well-tested core modules, but the gap between "code exists" and "user can actually do this" is massive. Approximately **60% of the claimed MVP features are library code that is never called from the UI**. The app a user actually sees is an atom stamper with undo — not a molecular editor.

---

## Methodology: What counts as "done"?

For this audit, a feature is:

- **Done** only if a user can trigger it from the UI and see the result
- **Library only** if the code exists, passes tests, but is never wired to the UI
- **Stub** if the interface exists but returns dummy data

---

## 1. Drawing Engine

| Feature                            | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                                                                               |
| ---------------------------------- | -------- | -------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| Interactive canvas (click to draw) | Yes      | Yes            | ✅ Fait     | Canvas renders atoms on click, responsive                                                           |
| Zoom / pan                         | Yes      | No             | ❌ Manquant | Pan tool exists in palette but no zoom/pan logic implemented                                        |
| Snap-to-grid                       | Yes      | No             | ❌ Manquant | Not implemented                                                                                     |
| Atom placement (Carbon)            | Yes      | Yes            | ✅ Fait     | Click canvas → carbon atom appears                                                                  |
| Atom placement (any element)       | Yes      | No             | 🟡 Partiel  | Periodic table data exists (25 elements) but **no UI picker**. Only Carbon can be placed.           |
| Formal charges                     | Yes      | No             | 🟡 Partiel  | Renderer draws charges, `update-atom` command exists, but **no UI to assign charges**               |
| Custom labels (R, R1, Et)          | Yes      | No             | 🟡 Partiel  | Field exists in type system, renderer supports it, but **no UI to enter labels**                    |
| Implicit hydrogens                 | Yes      | No             | ❌ Manquant | Not computed, not displayed                                                                         |
| Bond drawing (any type)            | Yes      | No             | 🟡 Partiel  | Renderer draws all bond types, commands exist, but **no bond tool in UI**. User cannot draw a bond. |
| Bond cycling                       | Yes      | No             | 🟡 Partiel  | `cycle-bond` command exists but **unreachable from UI**                                             |
| Wedge/dash stereo                  | Yes      | No             | 🟡 Partiel  | Renderer handles it, but user can't create bonds at all                                             |
| Ring insertion                     | Yes      | No             | 🟡 Partiel  | 8 templates + `generateRing()` coded and tested but **never called from UI**                        |
| Quick carbon chain                 | Yes      | No             | ❌ Manquant | No implementation at all                                                                            |
| Valence validation                 | Yes      | No             | 🟡 Partiel  | `validateValence()` works, tested, but **never called from UI**                                     |

**Honest score: 2/14 features usable by a real user.**

---

## 2. Reactions & Mechanisms

| Feature                                    | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                                                          |
| ------------------------------------------ | -------- | -------------- | ----------- | ------------------------------------------------------------------------------ |
| Reaction arrows (forward/equil/reversible) | Yes      | No             | 🟡 Partiel  | Commands + types exist, renderer does NOT draw arrows, **no arrow tool in UI** |
| Curly arrows (mechanism)                   | Yes      | No             | 🟡 Partiel  | Bezier math library exists and tested, but **zero UI, zero rendering**         |
| Condition annotations (above/below)        | Yes      | No             | 🟡 Partiel  | Commands exist, type system ready, but **no UI, no rendering**                 |
| Resonance arrows                           | Yes      | No             | ❌ Prévu V1 | Type defined but not in scope                                                  |

**Honest score: 0/4 features usable by a real user.**

---

## 3. Templates & Libraries

| Feature                   | ChemDraw  | Kendraw v0.1.0 | Status      | Notes                                    |
| ------------------------- | --------- | -------------- | ----------- | ---------------------------------------- |
| Ring library (8 rings)    | Yes (50+) | No             | 🟡 Partiel  | Data + generation code tested, **no UI** |
| Amino acid templates      | Yes       | No             | ❌ Prévu V1 | —                                        |
| Common molecule templates | Yes       | No             | ❌ Prévu V1 | —                                        |
| Custom templates          | Yes       | No             | ❌ Prévu V1 | —                                        |

**Honest score: 0/4 features usable.**

---

## 4. Calculations & Properties

| Feature                       | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                                 |
| ----------------------------- | -------- | -------------- | ----------- | ----------------------------------------------------- |
| Molecular formula (real-time) | Yes      | Yes            | ✅ Fait     | PropertyPanel shows formula computed from scene atoms |
| Molecular weight              | Yes      | Yes            | ✅ Fait     | PropertyPanel shows MW                                |
| Atom/bond count               | Yes      | Yes            | ✅ Fait     | PropertyPanel shows counts                            |
| SMILES display                | Yes      | No             | ❌ Manquant | No SMILES generation from scene                       |
| InChI/InChIKey                | Yes      | No             | 🟡 Partiel  | Backend endpoint exists, **not called from frontend** |
| LogP, TPSA, Lipinski          | Yes      | No             | ❌ Prévu V1 | —                                                     |
| IUPAC naming                  | Yes      | No             | ❌ Prévu V1 | —                                                     |
| Elemental analysis            | Yes      | No             | ❌ Prévu V1 | —                                                     |
| R/S, E/Z stereochemistry      | Yes      | No             | ❌ Prévu V1 | —                                                     |

**Honest score: 3/9 features usable.**

---

## 5. Import / Export

| Feature                  | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                                                                      |
| ------------------------ | -------- | -------------- | ----------- | ------------------------------------------------------------------------------------------ |
| MOL v2000 import         | Yes      | No             | 🟡 Partiel  | Parser works, round-trip tested, **no UI to trigger import**                               |
| MOL v2000 export         | Yes      | No             | 🟡 Partiel  | Writer works, **no UI to trigger export**                                                  |
| SDF import/export        | Yes      | No             | ❌ Manquant | Backend stub only                                                                          |
| SMILES import            | Yes      | No             | ❌ Manquant | No SMILES parser in frontend                                                               |
| CDXML import/export      | Yes      | No             | ❌ Prévu V1 | —                                                                                          |
| SVG export               | Yes      | No             | 🟡 Partiel  | `exportToSVG()` works and tested, **no UI to trigger**                                     |
| PNG export (300 DPI)     | Yes      | No             | ❌ Manquant | Not implemented                                                                            |
| Image copy-paste to Word | Yes      | No             | ❌ Manquant | Not implemented                                                                            |
| Drag-drop file import    | Yes      | No             | ❌ Manquant | Not implemented                                                                            |
| KDX native format        | N/A      | No             | 🟡 Partiel  | `serializeKdx()`/`deserializeKdx()` work, **persistence uses raw JSON via Dexie, not KDX** |
| SVG metadata (citation)  | N/A      | No             | 🟡 Partiel  | `injectSvgMetadata()` works, **never called**                                              |

**Honest score: 0/11 features usable by a real user.**

---

## 6. Editing & Manipulation

| Feature               | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                                                               |
| --------------------- | -------- | -------------- | ----------- | ----------------------------------------------------------------------------------- |
| Single-click select   | Yes      | Yes            | ✅ Fait     | Works via spatial index                                                             |
| Shift-click extend    | Yes      | Yes            | ✅ Fait     | Works                                                                               |
| Rectangle drag select | Yes      | Yes            | ✅ Fait     | Works with visual rectangle overlay                                                 |
| Delete selected       | Yes      | Yes            | ✅ Fait     | Delete/Backspace removes selected atoms                                             |
| Undo/Redo             | Yes      | Yes            | ✅ Fait     | Snapshot-based, unlimited, Ctrl+Z/Y                                                 |
| Copy/Cut/Paste        | Yes      | No             | 🟡 Partiel  | `copySelection()` + `prepareForPaste()` coded and tested, **not wired to Ctrl+C/V** |
| Duplicate             | Yes      | No             | ❌ Manquant | Not implemented                                                                     |
| Free rotation         | Yes      | No             | 🟡 Partiel  | `rotateAtoms()` + `snapAngle()` coded and tested, **no UI handle**                  |
| Mirror H/V            | Yes      | No             | 🟡 Partiel  | `mirrorAtomsH()`/`mirrorAtomsV()` coded and tested, **no UI**                       |
| Lasso selection       | Yes      | No             | ❌ Prévu V1 | —                                                                                   |
| Grouping/locking      | Yes      | No             | ❌ Prévu V1 | —                                                                                   |
| Structure cleanup     | Yes      | No             | ❌ Prévu V1 | —                                                                                   |

**Honest score: 5/12 features usable.**

---

## 7. User Interface

| Feature                  | ChemDraw        | Kendraw v0.1.0 | Status      | Notes                                                                                   |
| ------------------------ | --------------- | -------------- | ----------- | --------------------------------------------------------------------------------------- |
| Dark mode                | No (light only) | Yes            | ⭐ Exclusif | CSS tokens implemented, dark is default                                                 |
| Light mode               | Yes             | Yes            | ✅ Fait     | CSS tokens exist, **no toggle button in UI**                                            |
| Glassmorphism panels     | No              | Yes            | ⭐ Exclusif | Consistent across tool palette and property panel                                       |
| Multi-document tabs      | No (MDI)        | Yes            | ✅ Fait     | Create/switch/close tabs, restore on reload                                             |
| Auto-save                | No              | Yes            | ⭐ Exclusif | 3s debounced to IndexedDB, works                                                        |
| Tool palette             | Yes             | Yes            | 🟡 Partiel  | 4 tools only (Select/Atom/Eraser/Pan). No bond tool, no arrow tool, no ring tool        |
| Keyboard shortcuts       | Yes (100+)      | Yes            | 🟡 Partiel  | ~10 shortcuts implemented (V/A/E/H, Ctrl+Z/Y, Del, ?, Ctrl+N, Esc, P). PRD requires 30+ |
| Shortcut cheatsheet      | No              | Yes            | ⭐ Exclusif | ? key opens modal                                                                       |
| Property panel           | Yes             | Yes            | 🟡 Partiel  | Formula + MW + counts. No SMILES, no copy buttons, no collapse                          |
| About/Citation page      | No              | Yes            | ⭐ Exclusif | BibTeX copy, MIT notice                                                                 |
| i18n (EN/FR)             | No              | No             | 🟡 Partiel  | Message catalog defined, `t()` function exists, **never used** — all strings hardcoded  |
| Backend status indicator | No              | No             | 🟡 Partiel  | `useBackendAvailability()` hook exists, **never called**                                |
| Theme toggle             | Yes (prefs)     | No             | ❌ Manquant | Dark/light CSS exists but **no toggle UI**                                              |

**Honest score: 5/13 features fully usable.**

---

## 8. Modern / Exclusive Features

| Feature                 | ChemDraw        | Kendraw v0.1.0 | Status      | Notes                                    |
| ----------------------- | --------------- | -------------- | ----------- | ---------------------------------------- |
| Free & open-source      | $4k/yr          | MIT            | ⭐ Exclusif | Real, irrevocable advantage              |
| Self-hosted (Docker)    | No              | Yes            | ✅ Fait     | docker-compose.yml exists and documented |
| No telemetry            | Unknown         | Yes            | ⭐ Exclusif | Zero tracking, zero analytics            |
| Web-based (no install)  | No (desktop)    | Yes            | ⭐ Exclusif | Runs in browser                          |
| IndexedDB persistence   | No (file-based) | Yes            | ⭐ Exclusif | Works, tested                            |
| Restore on reload       | No              | Yes            | ⭐ Exclusif | Works via Dexie                          |
| Static demo mode        | No              | No             | 🟡 Partiel  | Hook exists, **not integrated**          |
| Release workflow (GHCR) | N/A             | Yes            | ✅ Fait     | GitHub Actions defined                   |
| CI pipeline             | N/A             | Yes            | ✅ Fait     | lint + typecheck + test + build          |

**Honest score: 6/9 features real.**

---

## Global Score

### By the numbers

| Category                  | Usable / Total | %   |
| ------------------------- | -------------- | --- |
| Drawing Engine            | 2/14           | 14% |
| Reactions & Mechanisms    | 0/4            | 0%  |
| Templates & Libraries     | 0/4            | 0%  |
| Calculations & Properties | 3/9            | 33% |
| Import/Export             | 0/11           | 0%  |
| Editing & Manipulation    | 5/12           | 42% |
| User Interface            | 5/13           | 38% |
| Modern Features           | 6/9            | 67% |

### ChemDraw parity score: **~15%**

A user opening Kendraw v0.1.0 can:

1. Click to place carbon atoms
2. Select atoms (click, shift-click, rectangle)
3. Delete atoms
4. Undo/redo
5. See molecular formula and MW
6. Open multiple tabs
7. Have work auto-saved

A user **cannot**:

- Draw a single bond
- Place any element other than Carbon
- Insert a ring
- Draw a reaction arrow
- Import or export any file
- Copy/paste molecules
- Rotate or mirror anything
- Use keyboard shortcuts for elements

---

## Top 5 Missing Features CRITICAL for V1

1. **Bond drawing tool** — Without bonds, this is not a molecular editor. Period. The renderer and commands are ready, but there is no bond tool in the UI. This is the #1 blocker.
2. **Element picker UI** — 25 elements are in the periodic table data. No way to access them. A dropdown, popover, or number-key shortcuts would immediately unlock element diversity.
3. **File import/export UI** — MOL parser, SVG exporter, and KDX serializer all work and are tested. They need menu items and drag-drop wiring. This is pure UI plumbing.
4. **Ring insertion UI** — 8 ring templates are ready. A ring sub-palette or keyboard shortcut would unlock rapid structure drawing.
5. **Clipboard wiring (Ctrl+C/V)** — Copy/paste functions are implemented and tested. They need to be connected to keyboard shortcuts in Canvas.tsx.

---

## Top 5 Features Where Kendraw Already Surpasses ChemDraw

1. **Free and open-source (MIT)** — ChemDraw costs ~$4,000/year. Kendraw is free forever. This alone justifies the project's existence.
2. **Auto-save + restore on reload** — ChemDraw has no auto-save. Kendraw saves every 3 seconds to IndexedDB and restores all tabs on reload. Zero data loss.
3. **Dark mode with glassmorphism** — ChemDraw looks like it was designed in 2003. Kendraw has a modern, beautiful design system with dark/light theme tokens.
4. **Web-based, no installation** — ChemDraw requires a desktop installer, license activation, and annual renewal. Kendraw runs in any browser.
5. **Self-hosted with Docker** — Labs can deploy their own instance. No cloud dependency, no vendor lock-in, no GDPR concerns.

---

## Recommendations for V1 Sprint Planning

### Immediate (next 2 sprints) — Ship a USABLE editor

The highest ROI work is **wiring existing library code to the UI**. Most features are already implemented and tested — they just need buttons and keyboard shortcuts.

1. **Add Bond tool to ToolPalette** — Connect to AddBondCommand. Users click atom A then atom B to create a bond. Click existing bond to cycle.
2. **Add Element picker** — Number keys 1-9 for common elements (C/N/O/S/P/F/Cl/Br/I). Periodic table popover for the rest.
3. **Wire Ctrl+C/V/X/D** — Connect to existing `copySelection()`/`prepareForPaste()`.
4. **Add Export menu** — SVG, MOL, KDX export using existing functions. File > Export dialog.
5. **Add Import (drag-drop + file menu)** — Use existing `parseMolV2000()`. Add file drop handler.
6. **Wire ring templates** — Add ring sub-palette or keyboard shortcuts.
7. **Wire valence validation** — Call `validateValence()` on every dispatch, highlight invalid atoms.

### Medium-term — Close the ChemDraw gap

8. Zoom/pan implementation (mouse wheel + space-drag)
9. Arrow tool (forward/equilibrium) using existing commands
10. Curly arrow tool using existing bezier utilities
11. Theme toggle button (CSS is ready)
12. i18n integration (messages are ready)
13. Implicit hydrogen computation + display
14. SMILES generation from scene model

### What NOT to do

- Don't add more library code without wiring existing code to the UI first
- Don't start V1 features (CDXML, IUPAC, Lipinski) before MVP features are usable
- Don't write more tests for unused functions — wire the functions first

---

## Brutal Summary

Kendraw v0.1.0 is an **architecture demo, not an MVP**. The foundations are excellent: clean monorepo, 150+ passing tests, immutable state with undo/redo, spatial indexing, good rendering. But the user-facing product is a carbon-atom stamper with selection and undo.

The good news: **~70% of the missing features are already coded and tested**. The gap is UI wiring, not implementation. Two focused sprints of pure UI integration could transform this from "architecture demo" to "usable chemistry editor."

The promise "Tout ChemDraw, en mieux, gratuitement" is achievable — but today, Kendraw cannot draw a water molecule. That needs to change before any V1 planning makes sense.
