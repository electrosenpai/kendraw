# Kendraw Features to Preserve in Canvas-New — Wave-6 Inventory

**Generated**: 2026-04-18
**Purpose**: Wave-6 canvas-new rebuild — preservation checklist. Every feature here MUST remain accessible when `VITE_ENABLE_NEW_CANVAS=true`.
**Scope**: All user-visible features across panels, NMR, chemistry properties, I/O, draw-specific tools, and global system features.

---

## 1. PANELS

### 1.1 Left Toolbox (ToolPalette)

**Source**: `/home/debian/kendraw/packages/ui/src/ToolPalette.tsx` (358 lines)

#### Tool Groups & Tools (42 tools total)

| Group | Tool | ID | Shortcut | Status |
|-------|------|----|-----------| --------|
| **Selection** | Select | `select` | V | Implemented |
| | Lasso | `lasso` | (none) | Implemented |
| | Pan | `pan` | H | Implemented |
| **Bonds** | Single Bond | `add-bond` (style: single) | B, 1 | Implemented |
| | Chain | `chain` | X | Implemented (wave-3) |
| | Bond Options | (bond-style: single/double/triple/wedge/dash/bold/wavy/hashed-wedge/aromatic) | 1/2/3/W/D/B/Y/h/~ | Implemented |
| **Atoms** | Add Atom | `add-atom` | A | Implemented |
| | Element Hotkeys | (C/N/O/S/F/P/B/L/I/H/M/+/-/Shift+B/Shift+O/Shift+F/Shift+N/Shift+Y) | — | Implemented |
| **Structures** | Ring | `ring` | R | Implemented |
| | Fused Rings | (naphthalene, indole, quinoline, benzofuran, benzothiophene, purine, steroid) | — | Implemented |
| **Annotations** | Text | `text` | (none) | Implemented |
| | Arrow | `arrow` | W | Implemented |
| | Arrow Types | (forward/equilibrium/reversible/resonance/retro/dipole/no-go) | — | Implemented (wave-3: dipole/no-go) |
| | Curly Arrow | `curly-arrow` | U | Implemented |
| | Shape | `shape` | G | Implemented (wave-3 B1) |
| | Shape Subtypes | (rect/ellipse) | — | Implemented |
| | Electron Pair/Radical | (pair/radical) | — | Implemented |
| **Editing** | Eraser | `eraser` | E | Implemented |
| **Analysis** | NMR | `nmr` | (none) | Implemented |
| | Molecules | `molecules` | Ctrl+L | Implemented |
| | Import | `import` | (none) | Implemented |
| **Display** | Compound # | `compound-numbering` | Ctrl+Shift+C | Implemented |
| **Document** | Undo | `undo` | Ctrl+Z | Implemented |
| | Redo | `redo` | Ctrl+Y | Implemented |
| | Fit | `fit` | Ctrl+0 | Implemented |

**Must preserve**: All 42 tools with their exact IDs, icons, shortcuts, and submenus.

---

### 1.2 Right PropertyPanel

**Source**: `/home/debian/kendraw/packages/ui/src/PropertyPanel.tsx` (354 lines)

#### Chemistry Metrics Displayed

| Metric | Source | Backend | Must preserve? |
|--------|--------|---------|-----------------|
| Molecular Formula | @kendraw/chem computeProperties | None (frontend) | YES |
| Molecular Weight (MW) | @kendraw/chem computeProperties | None (frontend) | YES |
| Atom Count | @kendraw/chem computeProperties | None (frontend) | YES |
| Bond Count | @kendraw/chem computeProperties | None (frontend) | YES |
| Valence Warnings | Scene validation | None (frontend) | YES |
| LogP | (NOT YET IMPLEMENTED) | /api/v1/compute/properties | DEFER to wave-7 |
| tPSA | (NOT YET IMPLEMENTED) | /api/v1/compute/properties | DEFER to wave-7 |
| InChI | (NOT YET IMPLEMENTED) | /api/v1/compute/properties | DEFER to wave-7 |
| InChIKey | (NOT YET IMPLEMENTED) | /api/v1/compute/properties | DEFER to wave-7 |
| Canonical SMILES | (NOT YET IMPLEMENTED) | /api/v1/compute/properties | DEFER to wave-7 |
| Lipinski Ro5 | (NOT YET IMPLEMENTED) | /api/v1/compute/properties | DEFER to wave-7 |

#### Export Buttons

| Format | Function | Source | Status |
|--------|----------|--------|--------|
| SVG | exportToSVG() | packages/renderer-svg/src/svg-export.ts | Implemented (missing arrows/annotations in wave-4) |
| PNG | exportPng() | PropertyPanel.tsx L175-190 | Implemented (1200×900px, canvas render) |
| PDF | exportPdf() | PropertyPanel.tsx (jsPDF, A4 landscape, 300 DPI, 40pt margin) | Implemented |
| MOL | exportMol() | packages/io/src/mol-v2000.ts | Implemented (V2000 only; missing arrows/annotations) |

**Must preserve**: Formula, MW, atom/bond counts, valence warnings, and all 4 export buttons (SVG/PNG/PDF/MOL).

**Note**: LogP, tPSA, InChI/Key, SMILES, Lipinski are NOT currently implemented. These were discovered in Apr-15 audit to require backend API integration.

---

### 1.3 Bottom NMR Panel

**Source**: `/home/debian/kendraw/packages/nmr/src/NmrPanel.tsx` (1580 lines)
**Toggle**: Ctrl+Shift+M (gating: `useIsEditingText` hotkey guard)

#### NMR Features

| Feature | Nucleus | Solvents | Details | Must preserve? |
|---------|---------|----------|---------|-----------------|
| ¹H NMR Prediction | 1H | 6 | Via backend API call with MOL V2000 | YES |
| ¹³C NMR Prediction | 13C | 6 | Via backend API call with MOL V2000 | YES |
| Solvent Selection | — | CDCl3, DMSO-d6, CD3OD, acetone-d6, C6D6, D2O | Dropdown selector; localStorage persistence | YES |
| Frequency Selector | — | (frequencyMhz state with localStorage) | User-adjustable MHz display | YES |
| Peak Rendering | 1H/13C | — | Multiplet display with coupling constants (J) | YES |
| Multiplicity Formatting | 1H/13C | — | formatMultiplicity() renders m/d/t/q/dd/dq/etc. | YES |
| Bidirectional Highlighting | 1H/13C | — | Click atom → highlight peak; click peak → highlight atom | YES |
| Integration Trace (¹H only) | 1H | — | Overlay on spectrum; toggleable via Shift+I | YES |
| Confidence Tooltips | 1H/13C | — | 3-tier confidence display (color, bar, method string) | YES |
| Proton Numbering | 1H | — | Atom numbers shown on spectrum | YES |
| DEPT Mode | 13C | — | Cycle: off → DEPT-135 → DEPT-90 → off via D key | YES (wave-4) |
| Zoom/Pan | 1H/13C | — | Mouse wheel + drag for spectrum navigation | YES |

#### NMR Export Formats

| Format | Function | Resolution | Must preserve? |
|--------|----------|------------|-----------------|
| PNG | exportPng() | 2× DPI (high-res) | YES |
| SVG | exportSvg() | Vector | YES (wave-4 F-2 shortcut) |
| CSV | exportCsv() | Peak table (shift, multiplicity, integration) | YES |

**Must preserve**: ¹H/¹³C prediction, 6 solvents, frequency selector, peak/multiplicity rendering, bidirectional atom highlighting, integration trace, DEPT mode (cycle: off/135/90), confidence tooltips, proton numbering, all 3 export formats.

**Not yet implemented**: IR prediction, mass spec prediction, JCAMP-DX export.

---

### 1.4 Bottom Status Bar

**Source**: `/home/debian/kendraw/packages/ui/src/StatusBar.tsx` (< 50 lines)

#### Status Bar Fields

| Field | Source | Must preserve? |
|-------|--------|-----------------|
| Atom/Bond count under cursor | Scene selection state | YES |
| Zoom level (%) | Canvas zoom state | YES |
| Pan coordinates (x, y) | Canvas pan state | YES |
| Active tool indicator | ToolState | YES |
| Modifier key indicators (Ctrl, Shift, Alt active) | Keyboard state | YES |
| Grid snap indicator (on/off) | ToolState.gridSnap | YES |
| Theme toggle (Light/Dark) | useTheme() | YES |

**Must preserve**: All status bar fields and real-time updates as user interacts.

---

### 1.5 Header (TabBar & Menus)

**Source**: `/home/debian/kendraw/packages/ui/src/TabBar.tsx` + App.tsx

#### Header Features

| Feature | Source | Must preserve? |
|---------|--------|-----------------|
| Kendraw logo | App.tsx | YES |
| Multi-tab document support | TabBar.tsx (tabs array) | YES |
| "+" button to create new tab | TabBar.tsx | YES |
| Tab title editing | TabBar.tsx | YES |
| Tab close (X button) | TabBar.tsx | YES |
| File menu (Open, New, Save) | App.tsx | YES |
| Help menu (Shortcuts, About) | App.tsx | YES |
| Theme toggle (Light/Dark) | Header | YES |

**Must preserve**: All header elements and tab management.

---

## 2. CHEMISTRY PROPERTIES SYSTEM

### 2.1 Implemented Metrics

| Metric | Implementation | Source | Backend | Status |
|--------|----------------|--------|---------|--------|
| Molecular Formula | Hill system | @kendraw/chem computeProperties() | None | ✓ Implemented |
| Molecular Weight | Sum of atomic weights | @kendraw/chem | None | ✓ Implemented |
| Atom Count (C/H/N/O/etc.) | Periodic table lookup | @kendraw/chem | None | ✓ Implemented |
| Bond Count (sigma/pi) | Scene graph traversal | @kendraw/chem | None | ✓ Implemented |
| Valence Warnings | Formal charge + implicit H validation | Scene validator | None | ✓ Implemented |
| Implicit H Count | Formula: valence − ΣbondOrders − \|charge\| | atom-display.ts L45 | None | ✓ Implemented |
| Elemental Composition | Atom count / MW × 100 | @kendraw/chem | None | ✓ Implemented |

### 2.2 Deferred Metrics (Wave-7)

| Metric | Required For | Source | Status |
|--------|-------------|--------|--------|
| LogP (lipophilicity) | ADME screening | RDKit backend API | NOT YET |
| tPSA (topological PSA) | Drug-likeness | RDKit backend API | NOT YET |
| HBA/HBD (H-bond donors/acceptors) | Lipinski Ro5 | RDKit backend API | NOT YET |
| InChI / InChIKey | Chemical identifier | RDKit backend API | NOT YET |
| Canonical SMILES | Uniqueness check | RDKit backend API | NOT YET |
| Exact Mass | High-res MS | RDKit backend API | NOT YET |

**Must preserve**: All 7 currently-implemented metrics. Defer the 6 descriptor metrics to wave-7 (backend API integration).

---

## 3. NMR SUBSYSTEM (Detailed)

### 3.1 ¹H NMR Features

**Backend**: `/home/debian/kendraw/backend/kendraw_api/routers/nmr.py`

| Feature | Implementation | Source | Must preserve? |
|---------|----------------|--------|-----------------|
| Prediction Engine | Additive group shift method | nmr.py | YES |
| Solvents Supported | 6 (CDCl3, DMSO-d6, CD3OD, acetone-d6, C6D6, D2O) | NmrPanel.tsx L20 | YES |
| Peak Rendering | Multiplet display with J couplings | NmrPanel.tsx L1000+ | YES |
| Multiplicity Notation | d/t/q/dd/dq/dt/td/qd/m | formatMultiplicity() L48 | YES |
| Integration Overlay | Area under peak (proportional to H count) | NmrPanel.tsx (Shift+I toggle) | YES |
| Proton Numbering | Atom indices on spectrum | NmrPanel.tsx | YES |
| Confidence Scoring | 3-tier (low/medium/high) + color coding | L100+ confidence display | YES |
| Bidirectional Highlight | Click atom ↔ peak, click peak ↔ atom | L600+ mouse handlers | YES |
| Frequency Selector | User-set MHz (default 400) | L290 frequencyMhz state | YES |
| Frequency Persistence | localStorage key 'kd-nmr-frequency-mhz' | L291 | YES |

### 3.2 ¹³C NMR Features

| Feature | Implementation | Source | Must preserve? |
|---------|----------------|--------|-----------------|
| Prediction Engine | Additive group shift method | nmr.py | YES |
| Solvents Supported | 6 (same as ¹H) | NmrPanel.tsx | YES |
| DEPT Mode | Cycle: off → DEPT-135 → DEPT-90 → off | deptMode state (wave-4) | YES |
| DEPT-135 Coloring | CH₃ (red) / CH₂ (blue) / CH (green) / C (no signal) | nmr.py DEPT logic | YES |
| DEPT-90 Coloring | CH only (no CH₂/CH₃/C signals) | nmr.py DEPT logic | YES |
| Peak Rendering | Singlets (no coupling in ¹³C) | NmrPanel.tsx | YES |
| Confidence Scoring | 3-tier display | same as ¹H | YES |
| Bidirectional Highlight | Click atom ↔ peak, click peak ↔ atom | L600+ | YES |
| Frequency Selector | User-set MHz (default 100) | frequencyMhz state | YES |

### 3.3 NMR Export (3 formats)

| Format | Function | Details | Must preserve? |
|--------|----------|---------|-----------------|
| PNG | exportPng() L94-139 | 2× DPI high-res render to canvas, download as blob | YES |
| SVG | exportSvg() L140-238 | Vector export with axes/labels, F-2 shortcut (wave-4) | YES |
| CSV | exportCsv() L241-257 | Peak table: shift, multiplicity, integration (¹H only), filename: kendraw-nmr-data.csv | YES |

### 3.4 NMR Keyboard Shortcuts

| Shortcut | Action | Nucleus | Status |
|----------|--------|---------|--------|
| Ctrl+Shift+M | Toggle NMR panel | (any) | ✓ Implemented |
| D | Cycle DEPT | 13C | ✓ Implemented (wave-4) |
| Shift+I | Toggle integration trace | 1H | ✓ Implemented (wave-4) |
| Ctrl+Shift+E | Export PNG | (any) | ✓ Implemented (wave-4 QW-8) |
| F-2 | Export SVG | (any) | ✓ Implemented (wave-4) |
| Arrow keys | Navigate peaks | (any) | ✓ Implemented |

**Must preserve**: All ¹H/¹³C prediction features, 6 solvents, DEPT mode with color coding, bidirectional atom-peak highlighting, frequency selector with persistence, all 3 export formats, all 6 NMR shortcuts.

---

## 4. I/O SUBSYSTEM (Import/Export)

**Source**: `/home/debian/kendraw/packages/io/src/`
**UI Component**: `/home/debian/kendraw/packages/ui/src/ImportDialog.tsx`

### 4.1 Import Formats

| Format | Function | File Type | Status | Notes |
|--------|----------|-----------|--------|-------|
| **SMILES** | parseSMILES() | .smi / clipboard | ✓ Implemented | Smart Paste via Ctrl+V; hotkey gating via useIsEditingText |
| **MOL V2000** | parseMolV2000() | .mol | ✓ Implemented | File dialog + drag-drop; legacy Sketchel format |
| **MOL V3000** | (error: not supported) | .mol | ✗ Rejected | Error msg: "MOL V3000 format is not supported. Please use V2000." |
| **SDF** | parseSDF() | .sdf | ✓ Implemented | Multi-molecule import; reads all `$$$$` records |
| **RXN** | parseRXN() | .rxn | ✓ Implemented | Reaction file format (experimental) |
| **CDXML** | parseCdxml() | .cdxml | ✓ Implemented | ChemDraw XML (parse-only, no export yet) |
| **PubChem** | PubChem API | autocomplete | ✓ Implemented | MoleculeSearch.tsx; debounced search via Ctrl+L |

### 4.2 Export Formats

| Format | Function | File Type | Source | Status | Notes |
|--------|----------|-----------|--------|--------|-------|
| **SVG** | exportToSVG() | .svg | renderer-svg/svg-export.ts | ✓ Implemented | Missing: reaction arrows, text annotations (wave-4 gap) |
| **PNG** | exportPng() | .png | PropertyPanel.tsx L175+ | ✓ Implemented | 1200×900px canvas render; PropertyPanel button |
| **PDF** | exportPdf() | .pdf | PropertyPanel.tsx | ✓ Implemented | jsPDF; A4 landscape; 300 DPI; 40pt margin |
| **MOL V2000** | writeMolV2000() | .mol | mol-v2000.ts | ✓ Implemented | Missing: reaction arrows, text annotations (wave-4 gap) |
| **MOL V3000** | (not available) | .mol | — | ✗ Not supported | Rejected in parser |
| **CDXML** | (no writer exists) | .cdxml | — | ✗ Not implemented | Blocker: Reid Regulatory requires CDXML export for eCTD submissions |
| **JCAMP-DX** | (not available) | .jdx | — | ✗ Not implemented | NMR spectral data format; completely absent |
| **PDF/A-1b** | (not available) | .pdf | — | ✗ Not implemented | Regulatory requirement; blocker per Reid Regulatory |

**Must preserve**: All 7 import formats (SMILES, MOL V2000, SDF, RXN, CDXML, PubChem search) + all 4 export formats (SVG, PNG, PDF, MOL V2000).

**Critical gaps for preservation**: SVG/MOL export are missing reaction arrows and text annotations (wave-4 identified gap). CDXML export, JCAMP-DX, and PDF/A-1b are NOT currently implemented and are deferred to wave-7.

---

## 5. DRAW-SPECIFIC KENDRAW FEATURES

### 5.1 Text Annotations

**Source**: Canvas.tsx + ToolPalette.tsx
**Hotkey gating**: `useIsEditingText` (prevents atom/bond/arrow creation while editing text)

| Feature | Implementation | Must preserve? |
|---------|----------------|-----------------|
| Text tool | ToolPalette tool ID 'text' | YES |
| Multiline text entry | Textarea in text editor overlay | YES |
| Text styling | Rich text: normal/subscript/superscript/greek/bold/italic | YES (no underline/strikethrough) |
| Text placement | Click canvas to create text node at position | YES |
| Text deletion | Delete or backspace when text selected | YES |
| Text hotkey gating | useIsEditingText prevents tool activation while editing | YES |

### 5.2 Reaction Arrows & Conditions

**Source**: Canvas.tsx renderer + ToolPalette.tsx

| Feature | Implementation | Must preserve? |
|---------|----------------|-----------------|
| Arrow tool | ToolPalette tool ID 'arrow' + 7 arrow types | YES |
| Arrow types | forward (→) / equilibrium (⇌) / reversible (⇄) / resonance (↔) / retro (⇒) / dipole (μ) / no-go (✗→) | YES (dipole/no-go added wave-3) |
| Curly arrow | ToolPalette tool ID 'curly-arrow' | YES |
| Arrow conditions | Render above/below text near arrow midpoint (renderer.ts L1110) | YES |
| Arrow anchoring | Connect to reactant/product bonds/atoms | YES |

### 5.3 Retrosynthesis Arrow

**Source**: ToolPalette.tsx (arrowType: 'retro')

| Feature | Implementation | Must preserve? |
|---------|----------------|-----------------|
| Retro arrow | Arrow type with thick double-head (⇒) | YES |
| Render style | Distinctive visual vs forward arrow | YES |

### 5.4 Compound Numbering

**Source**: `/home/debian/kendraw/packages/scene/src/compound-numbering.ts` + Canvas.tsx

| Feature | Implementation | Must preserve? |
|---------|----------------|-----------------|
| Numbering toggle | Ctrl+Shift+C shortcut | YES |
| Numbering storage | CompoundNumbering type in Document | YES |
| Numbering display | Numbers rendered on structures (1, 2, 3, ...) | YES |
| Numbering persistence | Saved in document state | YES |

### 5.5 Fused Ring Templates

**Source**: `/home/debian/kendraw/packages/ui/src/ToolPalette.tsx` (line ~740)

| Template | Ring System | Must preserve? |
|----------|-------------|-----------------|
| Naphthalene | 2 fused benzene rings | YES |
| Indole | Benzene + pyrrole | YES |
| Quinoline | Benzene + pyridine | YES |
| Isoquinoline | Benzene + pyridine (alt) | YES |
| Benzofuran | Benzene + furan | YES |
| Benzothiophene | Benzene + thiophene | YES |
| Purine | Imidazopyrimidine bicyclic | YES |
| Steroid skeleton | ABCD 4-ring system (perhydrophenanthrene) | YES |

**Must preserve**: All 8 fused ring templates with exact ring topology.

### 5.6 Shape Annotations

**Source**: ToolPalette.tsx + Canvas.tsx

| Shape | ID | Shortcut | Must preserve? |
|-------|----|-----------| --------------|
| Rectangle | rect | G → submenu | YES |
| Ellipse | ellipse | G → submenu | YES |

**Must preserve**: Both shapes with customizable fill/stroke styling.

### 5.7 Electron Pair & Radical Notation

**Source**: ToolPalette.tsx (arrow-head options)

| Feature | Type | Icon | Must preserve? |
|---------|------|------|-----------------|
| Electron pair (full head) | pair | ► (full triangle) | YES |
| Radical (half head) | radical | ▶ (half triangle) | YES |

---

## 6. GLOBAL SYSTEM FEATURES

### 6.1 Hotkey Gating

**Source**: `/home/debian/kendraw/packages/ui/src/useIsEditingText.ts`

| Feature | Gating | Effect | Must preserve? |
|---------|--------|--------|-----------------|
| Text tool active | useIsEditingText=true | Disables all tool hotkeys (atom/bond/arrow) | YES |
| ImportDialog focused | (hasInputFocus) | Prevents Ctrl+C from closing dialog | YES |
| Smart Paste | useIsEditingText=false | SMILES import via Ctrl+V only when NOT editing | YES |

**Must preserve**: Hotkey gating prevents accidental tool activation while user is editing text.

### 6.2 Dark Mode / Theme Toggle

**Source**: App.tsx + useTheme() hook

| Feature | Implementation | Storage | Must preserve? |
|---------|----------------|---------|-----------------|
| Light mode | CSS variables + Canvas theme | localStorage 'theme' | YES |
| Dark mode | CSS variables + Canvas theme | localStorage 'theme' | YES |
| Sync to canvas renderer | setTheme() propagates to CanvasRenderer | renderer instance | YES |
| Status bar toggle | Theme icon in status bar | auto-persist | YES |

**Must preserve**: Both light/dark themes with instant renderer sync.

### 6.3 Auto-Save & Session Recovery

**Source**: Canvas.tsx (store subscription) + App.tsx

| Feature | Implementation | Storage | Must preserve? |
|---------|----------------|---------|-----------------|
| Auto-save on document change | store.subscribe() triggers save | localStorage 'kendraw-doc-{id}' | YES |
| Session recovery | Load last doc on app startup | Recovery banner shown | YES |
| Recovery banner | RecoveryBanner.tsx component | Dismissable | YES |
| Tab persistence | Tab list saved on change | localStorage 'kendraw-tabs' | YES |

**Must preserve**: Auto-save and recovery banner so users never lose work.

### 6.4 Zoom & Pan

**Source**: Canvas.tsx (zoom, pan state)

| Feature | Control | Default | Must preserve? |
|---------|---------|---------|-----------------|
| Zoom in | Ctrl+= | 100% | YES |
| Zoom out | Ctrl+- | (decrement by 10%) | YES |
| Fit to screen | Ctrl+0 | Full document bounds | YES |
| Pan with H key | Pan tool (shortcut H) | Click+drag | YES |
| Mouse wheel zoom | Wheel event | (no modifier) | YES |
| Mouse wheel pan | Wheel + Shift | Up/down pans | YES |

**Must preserve**: All zoom/pan gestures.

### 6.5 Grid Snap

**Source**: Canvas.tsx + ToolPalette.tsx

| Feature | Implementation | Shortcut | Must preserve? |
|---------|----------------|----------|-----------------|
| Grid snap toggle | toolState.gridSnap | Ctrl+' | YES (wave-3 B2) |
| Grid size | 25 px | Fixed | YES |
| Grid visibility | renderer.setGridVisible() | On when snap=true | YES |

**Must preserve**: Grid snap with Ctrl+' shortcut.

### 6.6 Undo / Redo

**Source**: Canvas.tsx (undo/redo stack)

| Feature | Shortcut | Capacity | Must preserve? |
|---------|----------|----------|-----------------|
| Undo | Ctrl+Z | Unlimited | YES |
| Redo | Ctrl+Y or Ctrl+Shift+Z | Unlimited | YES |
| Clear on new doc | (auto) | (n/a) | YES |

**Must preserve**: Full undo/redo with unlimited depth.

### 6.7 Copy / Paste / Cut

**Source**: Canvas.tsx (clipboard API)

| Feature | Shortcut | Format | Must preserve? |
|---------|----------|--------|-----------------|
| Copy | Ctrl+C | Multi-format: MOL V2000 + SVG | YES |
| Paste | Ctrl+V | SMILES or MOL (auto-detect) | YES |
| Cut | Ctrl+X | Copy + delete | YES |
| Select All | Ctrl+A | All atoms/bonds | YES |

**Must preserve**: All clipboard operations with multi-format copy.

### 6.8 Alignment Tools

**Source**: Canvas.tsx (command: align-atoms)

| Alignment | Shortcut | Axis | Must preserve? |
|-----------|----------|------|-----------------|
| Align Left | Alt+Shift+L | Left edge | YES |
| Align Right | Alt+Shift+R | Right edge | YES |
| Align Top | Alt+Shift+T | Top edge | YES |
| Align Bottom | Alt+Shift+B | Bottom edge | YES |
| Align Horiz Center | Alt+Shift+E | Horizontal center | YES |
| Align Vert Center | Alt+Shift+V | Vertical center | YES |

**Must preserve**: All 6 alignment commands.

### 6.9 Structure Cleanup

**Source**: Canvas.tsx (command: cleanup-structure)

| Feature | Implementation | Shortcut | Must preserve? |
|---------|----------------|----------|-----------------|
| Cleanup | ChemDraw-equivalent bond/angle normalization | Ctrl+Shift+K | YES |

**Must preserve**: Structure cleanup command.

### 6.10 Rotation

**Source**: Canvas.tsx (command: rotate-atoms)

| Feature | Implementation | Shortcut | Angle | Must preserve? |
|---------|----------------|----------|-------|-----------------|
| Rotate selection | Rotate around centroid | Ctrl+R | 15° | YES |

**Must preserve**: 15° rotation command.

### 6.11 Mirror / Flip

**Source**: Canvas.tsx (commands: mirror-h, mirror-v)

| Feature | Shortcut | Axis | Must preserve? |
|---------|----------|------|-----------------|
| Mirror horizontal | Ctrl+M | Vertical axis | YES |
| Mirror vertical | Ctrl+Shift+M | Horizontal axis | YES |

**Must preserve**: Both mirror commands.

### 6.12 Bond Angle Snap

**Source**: Canvas.tsx (command: toggle-angle-snap)

| Feature | Shortcut | Angle | Must preserve? |
|---------|----------|-------|-----------------|
| Toggle angle snap | Ctrl+E | 30° snap | YES (wave-3) |

**Must preserve**: 30° angle snap toggle.

### 6.13 Multi-Page Documents

**Source**: Scene types.ts (pages: Page[] + activePageIndex)

| Feature | Implementation | Status | Must preserve? |
|---------|----------------|--------|-----------------|
| Multiple pages | Document.pages array | Data model exists | YES (UI impact TBD) |
| Page switching | (not yet wired in UI) | Stub | DEFER to wave-7 |
| Page naming | (not yet wired in UI) | Stub | DEFER to wave-7 |

**Must preserve**: Multi-page data structure (even if UI is stubbed).

### 6.14 Accessibility & Help

**Source**: `/home/debian/kendraw/packages/ui/src/ShortcutCheatsheet.tsx`

| Feature | Implementation | Shortcut | Must preserve? |
|---------|----------------|----------|-----------------|
| Shortcut cheatsheet modal | ShortcutCheatsheet.tsx | ? | YES |
| About page | AboutPage.tsx | (menu) | YES |
| Browser print | (native Ctrl+P) | Ctrl+P | YES |

**Must preserve**: Help system and keyboard shortcuts.

---

## 7. FEATURE CHECKLIST FOR WAVE-6 PRESERVATION

Below is the canonical checklist Wave-6 must confirm in flag=true mode:

### Panels
- [ ] ToolPalette renders all 42 tools in correct groups with icons/shortcuts
- [ ] PropertyPanel displays Formula, MW, atom/bond counts, valence warnings
- [ ] PropertyPanel export buttons (SVG/PNG/PDF/MOL) all functional
- [ ] NMR panel toggles with Ctrl+Shift+M and renders ¹H/¹³C spectra
- [ ] NMR solvent selector shows all 6 options
- [ ] NMR frequency selector persists to localStorage
- [ ] DEPT mode cycles with D key (off → 135 → 90 → off)
- [ ] NMR export (PNG/SVG/CSV) all functional
- [ ] Status bar shows atom/bond count, zoom %, pan coords, tool, theme toggle
- [ ] TabBar renders tabs, + button, close buttons, title editing

### Chemistry Properties
- [ ] Formula correctly computed (Hill system)
- [ ] MW correctly computed (sum of atomic weights)
- [ ] Atom/bond counts accurate
- [ ] Valence warnings appear on invalid structures

### NMR Features
- [ ] ¹H prediction via backend API
- [ ] ¹³C prediction via backend API
- [ ] Bidirectional atom-peak highlighting works
- [ ] Integration trace renders on ¹H spectrum (toggle: Shift+I)
- [ ] Confidence tooltips show (3-tier: low/medium/high)
- [ ] Proton numbering displays on ¹H spectrum
- [ ] DEPT coloring correct (CH₃=red, CH₂=blue, CH=green, ¹³C only)
- [ ] All 3 NMR export formats work (PNG/SVG/CSV)

### I/O Features
- [ ] SMILES import via Ctrl+V (hotkey gating working)
- [ ] MOL V2000 import (file dialog + drag-drop)
- [ ] SDF multi-molecule import
- [ ] RXN reaction import
- [ ] CDXML import (ChemDraw XML)
- [ ] PubChem search with Ctrl+L
- [ ] SVG export via PropertyPanel button
- [ ] PNG export via PropertyPanel button
- [ ] PDF export via PropertyPanel button
- [ ] MOL V2000 export via PropertyPanel button

### Draw-Specific Features
- [ ] Text tool works with hotkey gating (no tool activation while editing)
- [ ] Arrow tool with all 7 types (forward/equilibrium/reversible/resonance/retro/dipole/no-go)
- [ ] Curly arrow tool
- [ ] Arrow conditions rendering (above/below text)
- [ ] Compound numbering toggles with Ctrl+Shift+C
- [ ] All 8 fused ring templates available
- [ ] Rectangle and ellipse shape tools
- [ ] Electron pair and radical notation arrows

### Global System
- [ ] Hotkey gating prevents tool activation while editing text
- [ ] Dark mode and light mode both functional
- [ ] Auto-save on document change
- [ ] Session recovery banner on startup
- [ ] Undo/Redo with Ctrl+Z / Ctrl+Y
- [ ] Copy/Paste/Cut with Ctrl+C/V/X
- [ ] Select All with Ctrl+A
- [ ] Zoom in/out with Ctrl+=/−
- [ ] Fit to screen with Ctrl+0
- [ ] Pan tool with H shortcut
- [ ] Grid snap toggle with Ctrl+'
- [ ] Bond angle snap toggle with Ctrl+E
- [ ] Mirror horizontal/vertical with Ctrl+M / Ctrl+Shift+M
- [ ] Rotate selection with Ctrl+R (15°)
- [ ] Structure cleanup with Ctrl+Shift+K
- [ ] Alignment commands (Alt+Shift+L/R/T/B/E/V)
- [ ] All element hotkeys (C/N/O/S/F/P/B/L/I/H/M/+/−/Shift+B/Shift+O/Shift+F/Shift+N/Shift+Y)
- [ ] All bond hotkeys (1/2/3/D/W/B/Y/h)
- [ ] Shortcut cheatsheet modal (?)

---

## 8. SUMMARY STATISTICS

| Category | Count | Source |
|----------|-------|--------|
| Tools in ToolPalette | 42 | ToolPalette.tsx |
| Chemistry metrics (implemented) | 7 | PropertyPanel.tsx + @kendraw/chem |
| Chemistry metrics (deferred) | 6 | (wave-7 backend API) |
| NMR features | 12 | NmrPanel.tsx |
| NMR solvents | 6 | NmrPanel.tsx L20 |
| Arrow types | 7 | ToolPalette.tsx L812-819 |
| Bond styles | 9 | ToolPalette.tsx L466-475 |
| Import formats | 7 | ImportDialog.tsx + packages/io/src |
| Export formats (implemented) | 4 | PropertyPanel.tsx + renderer-svg/svg-export.ts |
| Export formats (deferred) | 3 | (CDXML, JCAMP-DX, PDF/A-1b) |
| Fused ring templates | 8 | ToolPalette.tsx |
| Keyboard shortcuts (global) | 50+ | keyboard-shortcuts-compliance.md |
| Status bar fields | 7 | StatusBar.tsx |
| Alignment commands | 6 | Canvas.tsx |

---

## 9. CRITICAL GAPS FOR WAVE-7 (NOT for Wave-6)

These features are explicitly **NOT** preserved in flag=true mode and must be deferred:

1. **Chemistry Descriptors** (LogP, tPSA, InChI, InChIKey, SMILES, Lipinski)
   - Requires: Backend RDKit API integration
   - Effort: Medium (2–3 days)

2. **SVG/MOL Arrow & Annotation Export**
   - Issue: renderer-svg/svg-export.ts doesn't render arrows, text, shapes
   - Blocker: Identified in wave-4 audit
   - Effort: High (SVG path construction required)

3. **CDXML Export**
   - Issue: parseCdxml() exists but no writeCdxml()
   - Regulatory: Reid Regulatory blocker for eCTD submissions
   - Effort: High (XML schema required)

4. **JCAMP-DX NMR Format**
   - Issue: Completely absent from codebase
   - Regulatory: NMR spectral data interchange standard
   - Effort: Medium (format specification + backend)

5. **PDF/A-1b (Archive Format)**
   - Issue: Not implemented; current PDF export is simple embedded image
   - Regulatory: eCTD regulatory requirement
   - Effort: High (PDF/A-1b profile + metadata)

6. **IR Prediction & Mass Spec Prediction**
   - Issue: NmrPanel only supports ¹H/¹³C
   - Effort: Medium (backend spectral prediction modules)

7. **Multi-Page UI Wiring**
   - Issue: Data model (pages array) exists but no UI controls
   - Effort: Medium (page switcher + navigation UI)

8. **Markush Structure Enumeration**
   - Issue: R-group label rendering exists but no R-group table or combinatorics
   - Effort: High (enumeration algorithm + R-group manager UI)

9. **Group/Lock Commands**
   - Issue: Data model (Group type) exists but no commands in commands.ts
   - Effort: Low (command wrapper + UI button)

---

## 10. WAVE-5 HOTFIX INTEGRATION (Already Done)

The wave-5 hotfix commit 8f5090b re-integrated:
- [ ] PropertyPanel with chemistry metrics display
- [ ] StatusBar with coordinate/zoom display
- [ ] Both wired into flag=true mode

**Still missing** (must be added in wave-6):
- [ ] ToolPalette (left toolbox)
- [ ] NMR panel integration
- [ ] Header/TabBar integration

---

## 11. ACCEPTANCE CRITERIA

Wave-6 is complete when:

1. **All 42 tools** render in left toolbox with icons, labels, shortcuts, and correct grouping
2. **ToolPalette**  accepts input without console errors
3. **PropertyPanel** (already done in wave-5) displays all 7 metrics
4. **NMR panel** (canvas-new) renders spectra and exports in 3 formats
5. **All keyboard shortcuts** (50+) fire without conflicts or misfires
6. **Hotkey gating** prevents tool activation while editing text
7. **All I/O formats** (7 import + 4 export) work identically to flag=false mode
8. **Grid snap, angle snap, zoom, pan, undo/redo** all functional
9. **Dark/light theme toggle** syncs to canvas renderer
10. **Auto-save and recovery banner** work end-to-end
11. **E2E test suite** confirms feature parity with legacy Canvas.tsx

---

**Last updated**: 2026-04-18 10:47 AM GMT+2
**Inventory owner**: Wave-6 Canvas-New Rebuild Task
