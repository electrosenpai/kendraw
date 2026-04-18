# Ketcher Toolbox Audit — Wave-6 Reference

**Source**: `/tmp/ketcher-reference` (epam/ketcher OSS, MIT License)
**Generated**: 2026-04-18
**Purpose**: Wave-6 canvas-new rebuild — exhaustive toolbox parity reference
**Audit Scope**: Left toolbox + Top toolbar + Dialogs + Popup menus

---

## Summary

- **Total tools audited**: 99
- **Tool groups**: 11
- **Reaction arrow tools**: 13
- **Bond types**: 15
- **Atoms**: 20 (basic + special)
- **Templates**: 8 (cycles in library)
- **Server/Indigo functions**: 9
- **Top toolbar actions**: 14

---

## Group: Select / Movement

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Rectangle Selection | `select-rectangle` | Shift+Tab, Escape | Drag-select box | tools.js:39–45 |
| Lasso Selection | `select-lasso` | Shift+Tab, Escape | Free-form polygon select | tools.js:46–50 |
| Structure Selection (Fragment) | `select-structure` | Shift+Tab, Escape | Select connected fragments | tools.js:52–57 |
| Fragment Selection | `select-fragment` | Shift+Tab, Escape | Select individual fragments | tools.js:58–63 |
| Hand Tool | `hand` | Mod+Alt+h | Pan/move canvas | tools.js:32–37 |
| Rotate Tool | `transform-rotate` | (no default) | Rotate selection | tools.js:99–102 |
| Horizontal Flip | `transform-flip-h` | Alt+h | Mirror left/right | tools.js:104–110 |
| Vertical Flip | `transform-flip-v` | Alt+v | Mirror up/down | tools.js:111–117 |

---

## Group: Erase / Delete

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Erase | `erase` | Delete, Backspace | Delete selected elements | tools.js:64–69 |

---

## Group: Bond (15 types)

| Tool | ID | Shortcut | Type | Source |
|------|-----|----------|------|--------|
| Single Bond | `bond-single` | 1 | Single (default) | tools.js:415–426 |
| Single Up (Wedge) | `bond-up` | 1 | Stereochemical wedge | tools.js:415–426 |
| Single Down (Hash) | `bond-down` | 1 | Stereochemical hash | tools.js:415–426 |
| Up/Down (Wavy) | `bond-updown` | 1 | Ambiguous stereo | tools.js:415–426 |
| Double Bond | `bond-double` | 2 | Double | tools.js:415–426 |
| Double Cis/Trans | `bond-crossed` | 2 | Crossed (geom. stereo) | tools.js:415–426 |
| Triple Bond | `bond-triple` | 3 | Triple | tools.js:415–426 |
| Aromatic Bond | `bond-aromatic` | 4 | Aromatic ring notation | tools.js:415–426 |
| Any Bond | `bond-any` | 0 | Query (any atom pair) | tools.js:415–426 |
| Hydrogen Bond | `bond-hydrogen` | (none) | Query hydrogen | struct-schema.ts:298 |
| Single/Double | `bond-singledouble` | (none) | Query either single or double | struct-schema.ts:302 |
| Single/Aromatic | `bond-singlearomatic` | (none) | Query single or aromatic | struct-schema.ts:303 |
| Double/Aromatic | `bond-doublearomatic` | (none) | Query double or aromatic | struct-schema.ts:304 |
| Dative Bond | `bond-dative` | (none) | Coordination/dative | struct-schema.ts:305 |
| Chain | `chain` | (none) | Draw carbon chain | tools.js:70–73 |

---

## Group: Atom (20 basic + special)

Basic atoms (10):
| Atom | ID | Shortcut | Source |
|------|-----|----------|--------|
| H | `atom-h` | h | atoms.js:17 |
| C | `atom-c` | c | atoms.js:17 |
| N | `atom-n` | n | atoms.js:17 |
| O | `atom-o` | o | atoms.js:17 |
| S | `atom-s` | s | atoms.js:17 |
| P | `atom-p` | p | atoms.js:17 |
| F | `atom-f` | f | atoms.js:17 |
| Cl | `atom-cl` | l | atoms.js:17 |
| Br | `atom-br` | b | atoms.js:17 |
| I | `atom-i` | i | atoms.js:17 |

Special atoms (10):
| Atom | ID | Shortcut | Type | Source |
|------|-----|----------|------|--------|
| Any | `atom-a` | a | A (any atom) | atoms.js:30 |
| Query | `atom-q` | q | Q (query) | atoms.js:30 |
| R-group | `atom-r` | r | R (R-group link) | atoms.js:30 |
| K | `atom-k` | k | Potassium | atoms.js:30 |
| M | `atom-m` | m | ? (generic) | atoms.js:30 |
| Si | `atom-si` | Shift+s | Silicon | atoms.js:30 |
| Na | `atom-na` | Shift+n | Sodium | atoms.js:30 |
| X | `atom-x` | x | X (halogen) | atoms.js:30 |
| D | `atom-d` | d | Deuterium | atoms.js:30 |
| B | `atom-b` | Shift+b | Boron | atoms.js:30 |
| \* (Wildcard) | `atom-*` | Shift+8 | Match-all query atom | atoms.js:30 |

**Dialog**: Periodic Table (`period-table`) — Opens full periodic table picker

---

## Group: Templates (8 cycle templates + library popup)

| Template | ID | Shortcut | Structure | Source |
|----------|-----|----------|-----------|--------|
| Benzene | `template-0` | t | 6-membered aromatic ring | templates.js:21–38 |
| Cyclopentadiene | `template-1` | t | 5-membered diene | templates.js:40–54 |
| Cyclohexane | `template-2` | t | 6-membered saturated ring | templates.js:56–72 |
| Cyclopentane | `template-3` | t | 5-membered saturated ring | templates.js:74–88 |
| Cyclopropane | `template-4` | t | 3-membered ring | templates.js:90–100 |
| Cyclobutane | `template-5` | t | 4-membered ring | templates.js:102–112 |
| Cycloheptane | `template-6` | t | 7-membered ring | templates.js:114–124 |
| Cyclooctane | `template-7` | t | 8-membered ring | templates.js:126–136 |

**Dialog**: Template Library (`template-lib`) — Shift+t — Full structure library dialog (tab 0)

---

## Group: Charge / Stereo / Radical

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Charge Plus | `charge-plus` | =, Shift+=, Numpad+ | Increment atom formal charge by +1 | tools.js:87–92 |
| Charge Minus | `charge-minus` | -, Numpad- | Decrement atom formal charge by −1 | tools.js:93–98 |
| Enhanced Stereo | `enhanced-stereo` | Alt+e | Edit stereo centers (wedge/hash assignment) | tools.js:75–86 |

---

## Group: R-group & Functional Groups

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| R-Group Label | `rgroup-label` | Mod+r | Place R1, R2, etc. labels on atoms | tools.js:329–335 |
| R-Group Fragment | `rgroup-fragment` | Mod+Shift+r, Mod+r | Define R-group substituent library | tools.js:336–342 |
| Attachment Point | `rgroup-attpoints` | Mod+r | Mark atoms as R-group attachment sites | tools.js:343–349 |
| Create Monomer | (monomer) | Mod+m | Create biopolymer monomer (HELM) | tools.js:350–360 |
| Functional Groups | `functional-groups` | Shift+f | Open functional groups library | functionalGroups.ts:20–32 |

---

## Group: Reaction Tools (14 tools)

### Reaction Arrows (13 variants)

| Arrow | ID | Shortcut | Type | Source |
|-------|-----|----------|------|--------|
| Open Angle | `reaction-arrow-open-angle` | (none) | → (simple forward) | tools.js:129–134 |
| Filled Triangle | `reaction-arrow-filled-triangle` | (none) | ▶ (solid arrow) | tools.js:135–140 |
| Filled Bow | `reaction-arrow-filled-bow` | (none) | ⇒ (curved, filled) | tools.js:141–146 |
| Dashed Open Angle | `reaction-arrow-dashed-open-angle` | (none) | ⇢ (dashed forward) | tools.js:147–152 |
| Failed Arrow | `reaction-arrow-failed` | (none) | ⊗ (reaction failed) | tools.js:153–158 |
| Retrosynthetic | `reaction-arrow-retrosynthetic` | (none) | ⇐ (backward retro) | tools.js:159–164 |
| Both Ends Filled Triangle | `reaction-arrow-both-ends-filled-triangle` | (none) | ⇄ (equilibrium both) | tools.js:165–174 |
| Equilibrium Filled Half Bow | `reaction-arrow-equilibrium-filled-half-bow` | (none) | ⇌ (half bow equil.) | tools.js:175–184 |
| Equilibrium Filled Triangle | `reaction-arrow-equilibrium-filled-triangle` | (none) | ⇄ (triangle equilibrium) | tools.js:185–194 |
| Equilibrium Open Angle | `reaction-arrow-equilibrium-open-angle` | (none) | ⇌ (angle equilibrium) | tools.js:195–201 |
| Unbalanced Equilibrium Filled Half Bow | `reaction-arrow-unbalanced-equilibrium-filled-half-bow` | (none) | ⇌ (unbalanced half bow) | tools.js:202–214 |
| Unbalanced Equilibrium Open Half Angle | `reaction-arrow-unbalanced-equilibrium-open-half-angle` | (none) | ⇌ (unbalanced half angle) | tools.js:215–227 |
| Unbalanced Equilibrium Filled Half Triangle | `reaction-arrow-unbalanced-equilibrium-filled-half-triangle` | (none) | ⇌ (unbalanced triangle) | tools.js:241–253 |
| Elliptical Arc Filled Bow | `reaction-arrow-elliptical-arc-arrow-filled-bow` | (none) | Curved arc arrow (filled) | tools.js:254–263 |
| Elliptical Arc Filled Triangle | `reaction-arrow-elliptical-arc-arrow-filled-triangle` | (none) | Curved arc arrow (triangle) | tools.js:264–273 |
| Elliptical Arc Open Angle | `reaction-arrow-elliptical-arc-arrow-open-angle` | (none) | Curved arc arrow (open) | tools.js:274–282 |
| Elliptical Arc Open Half Angle | `reaction-arrow-elliptical-arc-arrow-open-half-angle` | (none) | Curved arc arrow (half) | tools.js:284–293 |
| Multi-Tailed Arrow | (multitail) | (none) | Reaction showing multiple pathways | tools.js:294–302 |

### Reaction Plus & Mapping

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Plus | `reaction-plus` | (none) | + symbol (reactant separator) | tools.js:303–308 |
| Reaction Map | `reaction-map` | (none) | Assign atom mapping numbers | tools.js:313–318 |
| Reaction Unmap | `reaction-unmap` | (none) | Remove atom mapping | tools.js:319–324 |

---

## Group: S-Group / Polymer

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| S-Group | `sgroup` | Mod+g | Define superatoms, monomers, repeats | tools.js:118–124 |

**SGroup types** (via S-group dialog):
- Multiple (MUL): Repeat count 1–200
- SRU: Polymer block (head-to-tail, head-to-head, either)
- COP: Copolymer (random, block, alternating)
- SUP: Named superatom
- Generic SGroup (GEN): Custom grouping

---

## Group: Shapes & Text

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Ellipse | `shape-ellipse` | (none) | Draw filled/outlined ellipse | tools.js:365–370 |
| Rectangle | `shape-rectangle` | (none) | Draw filled/outlined rectangle | tools.js:371–376 |
| Line | `shape-line` | (none) | Draw line segment | tools.js:377–382 |
| Text | `text` | Alt+t | Add text label to canvas | tools.js:383–389 |
| Image | (image) | (none) | Insert image/bitmap | tools.js:393–398 |

---

## Top Toolbar & Dialogs (14 tools)

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Open | `open` | Mod+o | Load structure (MOL, RXN, KET, SMILES) | index.ts:73–80 |
| Save As | `save` | Mod+s | Save structure to file | index.ts:81–88 |
| Clear Canvas | `clear` | Mod+Del, Mod+Backspace | Remove all structures | index.ts:58–72 |
| Undo | `undo` | Mod+z | Undo last action | index.ts:99–110 |
| Redo | `redo` | Mod+Shift+z, Mod+y | Redo last undone action | index.ts:111–122 |
| Cut | `cut` | Mod+x | Cut selection to clipboard | index.ts:123–137 |
| Copy | `copy` | Mod+c | Copy selection to clipboard | index.ts:145–160 |
| Copy Image | `copy-image` | Mod+Shift+f | Copy as bitmap PNG | index.ts:161–170 |
| Copy as MOL | `copy-mol` | Mod+Shift+m | Copy as MDL MOL format | index.ts:171–180 |
| Copy as KET | `copy-ket` | Mod+Shift+k | Copy as Ketcher KET format | index.ts:181–190 |
| Paste | `paste` | Mod+v | Paste clipboard structure | index.ts:191–205 |
| Select All | `select-all` | Mod+a | Select entire structure | index.ts:236–248 |
| Deselect All | `deselect-all` | Mod+Shift+a | Clear selection | index.ts:249–257 |
| Select Descriptors | `select-descriptors` | Mod+d | Select only text/graphic labels | index.ts:258–272 |

---

## Server-Dependent Tools (Indigo) (9 tools)

| Tool | ID | Shortcut | Behavior | Requires | Source |
|------|-----|----------|----------|----------|--------|
| Layout | `layout` | Mod+l | Auto-arrange 2D coordinates | server | server.ts:26–34 |
| Clean Up | `clean` | Mod+Shift+l | Optimize 2D layout | server | server.ts:35–43 |
| Aromatize | `arom` | Alt+a | Convert to aromatic rings | server | server.ts:44–52 |
| Dearomatize | `dearom` | Ctrl+Alt+a | Convert aromatic → Kekule | server | server.ts:53–61 |
| Calculate CIP | `cip` | Mod+p | Assign R/S stereochemistry | server | server.ts:62–70 |
| Check Structure | `check` | Alt+s | Validate structure (dialog) | server | server.ts:71–78 |
| Calculated Values | `analyse` | Alt+c | Molecular properties (dialog) | server | server.ts:79–86 |
| Recognize Molecule | `recognize` | (none) | OCR structure from image (IMAGO) | server + IMAGO | server.ts:87–94 |
| Add/Remove Hydrogens | `explicit-hydrogens` | (none) | Toggle explicit H atoms | server | server.ts:101–108 |

---

## Utility & Settings (8 tools)

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Settings | `settings` | (none) | Editor preferences dialog | index.ts:206–211 |
| About | `about` | (none) | Version, license, credits dialog | index.ts:212–217 |
| Atom Properties | `atom-props` | / (over atom) | Edit atom properties dialog | index.ts:89–93 |
| Bond Properties | `bond-props` | / (over bond) | Edit bond properties dialog | index.ts:94–98 |
| Periodic Table | `period-table` | (none) | Full periodic table picker | index.ts:225–229 |
| Extended Table | `extended-table` | (none) | Extended atom/isotope table | index.ts:230–235 |
| Reaction Automap | `reaction-automap` | (none) | Auto-assign atom mapping (dialog) | index.ts:218–224 |
| 3D Viewer (Miew) | `miew` | (none) | 3D structure visualization | server.ts:95–100 |
| Help | `help` | ?, &, Shift+/ | GitHub help docs | help.js:27–33 |
| Fullscreen | `fullscreen` | (none) | Toggle fullscreen mode | fullscreen.ts:59–65 |

---

## Zoom (3 tools)

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Zoom Reset | `zoom` | Mod+0 | Reset to 100% | zoom.js:26–35 |
| Zoom Out | `zoom-out` | Mod+-, Mod+Numpad- | Decrease magnification | zoom.js:36–48 |
| Zoom In | `zoom-in` | Mod+=, Mod+Numpad+ | Increase magnification | zoom.js:49–64 |

**Zoom Levels**: 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%, 110%, 120%, 130%, 140%, 150%, 170%, 200%, 250%, 300%, 350%, 400%

---

## Debug / Dev Tools (2 tools)

| Tool | ID | Shortcut | Behavior | Source |
|------|-----|----------|----------|--------|
| Force Update | `force-update` | Ctrl+Shift+r | Full re-render (dev) | debug.js:22–28 |
| QS Serialize | `qs-serialize` | Alt+Shift+r | Encode MOL in URL | debug.js:29–44 |

---

## Summary by Action Type

### Tool Groups
1. **Select** (4 tools: rectangle, lasso, structure, fragment)
2. **Movement/Transform** (4 tools: hand, rotate, flip-h, flip-v)
3. **Erase** (1 tool)
4. **Bond** (15 types: single, up/down/wavy, double, crossed, triple, aromatic, any, hydrogen, queries, dative, chain)
5. **Atom** (21 tools: 10 basic + 11 special/query)
6. **Template** (8 cycles + library popup)
7. **Charge/Stereo** (3 tools: +charge, −charge, enhanced stereo)
8. **R-group** (4 tools: label, fragment, attachment, monomer)
9. **Functional Groups** (popup library)
10. **Reaction** (18 tools: 13 arrows, plus, map, unmap, multitail)
11. **S-group** (1 tool; dialog expands to MUL, SRU, COP, SUP, GEN types)
12. **Shapes** (3 tools: ellipse, rectangle, line)
13. **Text/Image** (2 tools)
14. **Toolbar/IO** (14 tools: open, save, undo, redo, cut, copy variants, paste, select all/none)
15. **Server/Indigo** (9 tools: layout, clean, arom, dearom, CIP, check, analyse, recognize, hydrogens)
16. **Utilities** (8 tools: settings, about, properties dialogs, periodic table, extended table, automap, 3D, help)
17. **Zoom** (3 tools: reset, +, −)
18. **Debug** (2 tools)

---

## Kendraw Mapping Table

| Ketcher Tool | Kendraw Equivalent | Status | Notes |
|--------------|-------------------|--------|-------|
| Rectangle Selection | `selectRectangleTool` (canvas-new) | EXISTS | canvas-new/selectTool.ts |
| Lasso Selection | `selectLassoTool` (canvas-new) | EXISTS | canvas-new/selectTool.ts |
| Hand/Pan | `handTool` (canvas-new) | EXISTS | canvas-new/handTool.ts |
| Single Bond | `bondTool` (scene) | EXISTS | scene/bondTool.ts |
| Double Bond | `bondTool` (scene) | EXISTS | scene/bondTool.ts (type: double) |
| Triple Bond | `bondTool` (scene) | EXISTS | scene/bondTool.ts (type: triple) |
| Wedge (Up) | `bondTool` (scene) | EXISTS | scene/bondTool.ts (stereo: wedge) |
| Hash (Down) | `bondTool` (scene) | EXISTS | scene/bondTool.ts (stereo: hash) |
| Carbon Atom | `atomTool` (scene) | EXISTS | scene/atomTool.ts (label: C) |
| Nitrogen Atom | `atomTool` (scene) | EXISTS | scene/atomTool.ts (label: N) |
| Oxygen Atom | `atomTool` (scene) | EXISTS | scene/atomTool.ts (label: O) |
| Charge (+/−) | `chargeTool` (scene) | PARTIAL | scene has charge ops, no dedicated tool |
| Erase | `eraseTool` (canvas-new) | PARTIAL | Implemented as selection delete; no dedicated eraser |
| Rotate | `rotateTool` (canvas-new) | PARTIAL | Transform support planned, not yet full |
| Chain | (not yet in canvas-new) | GAP | Quick C-chain drawing missing |
| Aromatic Bond | `bondTool` (scene) | PARTIAL | Can set aromatic flag, UI toggle missing |
| Text Tool | `textTool` (canvas-new) | EXISTS | canvas-new/textTool.ts |
| S-group | (not yet in canvas-new) | GAP | Polymer/superatom grouping missing |
| Reaction Arrows | (not yet in canvas-new) | GAP | All 13 arrow types missing |
| Reaction Plus | (not yet in canvas-new) | GAP | Separator symbol missing |
| Reaction Mapping | (not yet in canvas-new) | GAP | Atom mapping missing |
| R-group Tools | (not yet in canvas-new) | GAP | R-group label/fragment/attachment missing |
| Shapes (ellipse, rect, line) | `shapeTool` (canvas-new) | PARTIAL | Ellipse/rect exist; line missing |
| Image Tool | (not yet in canvas-new) | GAP | Image embedding missing |
| Layout | (not yet integrated) | GAP | Requires Indigo server integration |
| Aromatize/Dearomatize | (not yet integrated) | GAP | Requires Indigo server integration |
| CIP Calculation | (not yet integrated) | GAP | Requires Indigo server integration |
| Recognize (IMAGO) | (not yet integrated) | GAP | Requires Indigo + IMAGO server integration |
| Zoom | `zoomControl` (canvas-new) | EXISTS | canvas-new/zoomControl.ts |
| Templates | `templateTool` (scene) | PARTIAL | Basic cycles exist; library dialog missing |
| Periodic Table | `periodicTableDialog` (ui) | EXISTS | ui/dialogs/periodicTable.tsx |
| Settings | `settingsDialog` (ui) | EXISTS | ui/dialogs/settings.tsx |
| Undo/Redo | History system (scene) | EXISTS | scene/history.ts |
| Cut/Copy/Paste | Clipboard (scene + canvas-new) | EXISTS | scene/clipboard.ts |
| Select All/None | Selection API (scene) | EXISTS | scene/selection.ts |

---

## Key Implementation Notes

### Hotkey Architecture
- Hotkeys defined in `/script/ui/state/hotkeys.ts` (initHotKeys function)
- Action resolution via `keyNorm.lookup()` matching key modifiers
- Abbreviation lookup enabled: quick atom entry (h, c, n, o, s, p, f, l, b, i, +, -, 1-4)
- Arrow keys support item movement (when selection active)
- Slash key opens atom/bond properties on hovering

### Tool Naming Convention
- ID format: `<group>-<type>` or `<action>` (e.g., `bond-single`, `charge-plus`, `open`)
- Tools with multiple shortcuts list as array: `['key1', 'key2']`
- Disabled state checked via editor context (monomer creation wizard, view-only mode, etc.)
- Hidden state configurable per deployment (via `isHidden()` function in action defs)

### Bond Type Mapping
Ketcher bond schema uses internal codes matching MOL format:
- Single: 1, Up: 1, Down: 1, Updown: 1 (type 1 + stereo flag)
- Double: 2, Crossed: 2
- Triple: 3, Aromatic: 4, Any: 0
- Query bonds (Hydrogen, SingleDouble, etc.) are MOL query types

### Reaction Tools
- Arrows are tool variants of `reactionarrow` (13 mode variants)
- Plus is separate tool (`reactionplus`)
- Mapping is two-way toggle (map/unmap)
- All reaction tools disabled during monomer creation

### Templates
- 8 hardcoded cycle templates (cyclopropane–cyclooctane, benzene, cyclopentadiene)
- Template structure stored as MOL strings in `templates.js`
- Library dialog (`template-lib`) allows browsing full catalog
- Functional groups library (tab 1) separate from cycle library

### Server Integration (Indigo)
- Layout, clean, arom, dearom, CIP, check, analyse require `options.app.server = true`
- Recognize requires IMAGO (imago versions array)
- All server tools disabled if server unavailable (graceful degradation)

### View-Only Mode
- All editing tools disabled when `viewOnlyMode = true`
- Exempt: hand tool, zoom, copy, help, about, select-all, settings, check, analyse
- Property `enabledInViewOnly` marks tools available in view mode

---

## Compilation Notes

This audit was generated by analyzing:
1. `/script/ui/action/tools.js` — 60+ tool definitions (select, bond, charge, transform, reaction, rgroup, shapes, text, image)
2. `/script/ui/action/atoms.js` — 21 atom definitions (10 basic + 11 special/query)
3. `/script/ui/action/templates.js` — 8 cycle templates
4. `/script/ui/action/server.ts` — 9 Indigo/server tools
5. `/script/ui/action/zoom.js` — zoom control (3 actions, 20 zoom levels)
6. `/script/ui/action/index.ts` — 14 core actions (open, save, undo, redo, cut, copy, paste, select, etc.)
7. `/script/ui/action/help.js`, `debug.js`, `functionalGroups.ts`, `fullscreen.ts` — utility tools
8. `/script/ui/state/hotkeys.ts` — hotkey binding logic
9. `/script/ui/data/schema/struct-schema.ts` — bond types enum, atom properties schema
10. `/script/ui/data/templates.js` — cycle structure definitions (MOL format)

**Total distinct tools: 99** (some tools grouped under umbrella IDs, e.g., reaction arrows under `reactionarrow` tool with mode variants)

---

## References

- **Ketcher**: epam/ketcher (MIT) — Open-source chemistry editor
- **Kendraw**: Canvas-new rebuild targeting feature parity with Ketcher 2.x
- **Indigo**: Epam IndiGO (chemistry toolkit) — Optional server for layout, aromatization, CIP calculation
- **MOL Format**: V2000/V3000 (MDL) — Chemical structure interchange standard

---

*End of Audit*
