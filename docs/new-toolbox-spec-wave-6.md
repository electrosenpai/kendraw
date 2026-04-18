# New Toolbox Spec — Wave-6

Generated: 2026-04-18
Purpose: Design + priority spec for the canvas-new toolbox refactor. Consumed by Phase 4 implementation.
Sources: `docs/ketcher-toolbox-audit-v2.md` (99 Ketcher tools) + `docs/kendraw-features-to-preserve.md` (42 existing Kendraw tools).
Attribution: Layout inspired by Ketcher (EPAM Systems, Apache 2.0). Icons drawn in-house from IUPAC/ACS conventions. No Ketcher assets copied.

---

## UX Design — Sally

### Layout hierarchy

One column, always. A chemist's hand travels between the canvas and the left rail hundreds of times per session — adding a second tool column would double that travel distance and break the ChemDraw/Ketcher muscle memory we inherit. The rail is **56px wide** (single tool column, 44px touch-target tool + 6px rail padding on each side), with a **flyout tier at 248px** that opens rightward on demand.

Vertical order, top to bottom, follows frequency-of-use and the drawing workflow itself — you *select*, then you *draw*, then you *annotate*, then you *analyze*:

1. **Pointer group** (Select, Lasso, Pan) — always reachable by thumb, anchored at top
2. **Primary divider** (1px, 30% opacity)
3. **Bond group** (Bond tool with 9-bond flyout)
4. **Atom group** (Add-atom + periodic table flyout)
5. **Template group** (Rings + templates library flyout)
6. **Reaction group** (Arrow variants flyout — retro lives here)
7. **Annotation group** (Text, shapes, compound numbering)
8. **Edit group** (Eraser, charge, stereo)
9. **Advanced group** (R-group, S-group, attachment point)
10. **Secondary divider**
11. **Analysis dock** (NMR toggle, Molecules, Import) — pinned to **bottom** of rail

File/history actions (Open, Save, Undo, Redo, Cut, Copy, Paste, Layout, Aromatize, Calc CIP, Check, Calc properties, Recognize, Settings, Help, Fullscreen) stay in the **top header toolbar**.

PropertyPanel stays on the right. NMR panel docks to the bottom, anchored by its toggle at the bottom of the left rail.

### Grouping strategy

Seven visual sections, separated by **1px hairline dividers** at 30% border opacity — visible but not loud. No collapsible sections in the rail itself. Groups are spatial (spacing + divider), not interactive. Collapse happens one layer deeper, inside flyouts. Each section has an implicit label revealed on hover — a 10px uppercase caption slides in after 400ms dwell.

### Handling 40+ tools

**Expandable flyouts triggered by long-press (300ms) or right-click, plus a small corner chevron for discoverability.** Rationale:

1. Ketcher users already know it — Bond tool opens a sub-palette via chevron click. Muscle memory transfers.
2. Long-press is forgiving for new users — tap = last-used variant; hold = menu.
3. Flyouts preserve spatial memory — benzene is always in slot 1 of the Templates flyout.

Flyout is a 3-column grid, 44px cells, opens to the right of the rail. Escape closes it. Clicking a variant **promotes it to the rail slot** (persisted in localStorage).

### Interaction patterns

- **Hover**: ghost preview on canvas at 40% opacity (already working for bonds — extend to rings, templates, arrows). Rail tools show a 2px left accent bar after 120ms.
- **Activation**: single click arms the tool; cursor changes within 50ms. Double-click = sticky mode (persists across strokes).
- **Tooltip**: 400ms dwell reveals a dark pill to the right: `Bond · B`.
- **Active state**: filled background in primary-500 at 12% opacity, 2px left accent bar primary-600, icon stroke shifts 1.5 → 2.
- **Disabled / coming-soon**: 40% opacity, diagonal hash overlay at 8%, tooltip reads `R-group · Coming in wave-7`. Focusable for keyboard users, aria-disabled.

### Icon strategy

**Lucide React as baseline; custom SVG for chemistry-specific tools.** Lucide for ordinary tools (Select, Pan, Eraser, Text, Undo). Chemistry tools (bonds, rings, retro arrow, NMR) get custom SVG matching Lucide's stroke weight, authored in-house, referencing IUPAC/ACS style guides. Zero Ketcher assets.

### Empty state / first-use

First load: centered card "Start drawing" with three actions — Draw a bond (B), Import SMILES (Ctrl+I), Open a template. Bond tool pulses 2-sec breathing glow. Dismissible bottom-sheet: *"Hover an atom and type a letter to change it. Long-press any tool for variants."* Shown once.

### Responsive compact mode

- **1920px**: 56px rail, tooltip pills right, PropertyPanel 320px, NMR panel 280px tall.
- **1280px**: rail stays 56px, PropertyPanel narrows to 260px, NMR collapsible and defaults collapsed.
- **<1100px**: rail enters dense mode — 48px cells, 6px dividers, implicit labels disappear. Flyouts stay 248px.

### User story

Clara, a third-year PhD student, drafts Taxol retrosynthesis. She taps **B**, drags out the taxane skeleton, hovers a carbon, types **O** — atom flips. She long-presses reaction-arrow; a flyout blooms with thirteen arrows. Picks retro. Next time, retro is in the rail slot — Kendraw learned. At 2 a.m., 1280px screen: rail doesn't shrink, NMR panel collapses. Ctrl+M predicts spectrum, quaternary C at 78 ppm glows on canvas. She smiles, saves.

---

## Tool Priority Matrix — John

### Rationale

Kendraw wins when a chemist opens the app, draws a structure in under 30 seconds, and hits Ctrl+M for NMR — that's our wedge, not tool count. Ketcher's 99 tools are a vanity benchmark; 60%+ are used <1% of sessions. I'm pushing to **17 P0** because omitting Ring Benzene or Undo would make the app feel broken on first-hour use. Everything in P0 must serve the bench chemist's first 60 seconds OR the differentiator loop (NMR, properties, SMILES paste).

### P0 — Minimum Viable Product (17 tools, MUST ship in wave-6)

- **Select (V)** — can't move, edit, or delete anything without it.
- **Erase (Del / E)** — covers "I drew this 10 steps ago and it's wrong."
- **Single bond (1)** — the atom of chemistry UI. First click every chemist makes.
- **Double bond (2)** — every carbonyl, aromatic, alkene.
- **Triple bond (3)** — nitriles and alkynes.
- **Atom C** — default carbon; hover hotkey + explicit button.
- **Atom H** — explicit H is a correctness signal.
- **Atom N / O / S** — CHNOS covers ~95% of organic structures.
- **Periodic table picker** — one button unblocks halogens/P without 10 more icons.
- **Ring: Benzene** — second-most-drawn motif after single bond.
- **Ring: Cyclohexane** — steroids, sugars, most scaffolds.
- **Undo (Ctrl+Z) / Redo (Ctrl+Y)** — counts as one pair. Drawing without undo is user-hostile.
- **Text annotation (T)** — retrosynthesis labels, arrow captions.
- **Reaction arrow (W)** — mechanism and reaction schemes collapse without it. One arrow, not 13.
- **SMILES Smart Paste trigger** — the killer onboarding move.
- **NMR panel toggle (Ctrl+M)** — THE differentiator. Visible button teaches the hotkey.
- **Property panel toggle (Ctrl+J)** — medicinal chemist's entry point to LogP/tPSA/Lipinski.

### P1 — Important, ship if time permits (12 tools)

Wedge bond up/down, Aromatic bond explicit, Charge +/-, Cyclopentane + cyclopropane, Curly arrow (mechanism), Equilibrium arrow, Import dialog, Export SVG/PNG, Copy/Paste structural, Layout/clean-up, Fused ring templates (naphthalene, indole), Eraser bulk mode.

### P2 — Useful, post-wave-6 (12 tools)

Stereo flags (R/S), Calc CIP, Aromatize/Dearomatize, Check, Image attach, Attachment point, Atom alias, Rotate/flip selection, Zoom-to-fit, Fullscreen, arrow variant flyout items, template library browser.

### P3 — Coming soon (disabled stubs in toolbox)

R-group tool, S-group tool, Reaction auto-mapping, 3D view, Recognize (OCR). Shown as greyed stubs with tooltip "Coming in wave-7+".

### Cuts

12 of 13 Ketcher arrows, R/S groups as functional tools, template library full browser, image OCR recognize, Calc CIP/Check/Aromatize in toolbox (move to Tools menu).

### Success metric

Two weeks post-ship: (1) first-time user draws aspirin + fires NMR in <90 seconds without docs; (2) zero tickets asking "where is benzene/undo/NMR?" If either fails, re-cut P0 before wave-7.

---

## Implementation Notes — Amelia

### Data model

A single flat list of `ToolDef` with a `group` tag, rendered in order. Groups inject `<Sep />` between sections.

```ts
interface ToolDef {
  id: string;                    // 'select' | 'bond-single' | 'atom-c' | 'action-undo' | ...
  kind: 'tool' | 'action' | 'toggle';
  group: 'pointer' | 'bond' | 'atom' | 'ring' | 'annotation' | 'edit' | 'analysis';
  label: string;
  shortcut?: string;             // 'V', '1', 'Ctrl+M'
  icon: 'lucide:mouse-pointer' | 'chem:bond-single' | ...;
  disabled?: boolean;            // show "Coming soon"
  disabledReason?: string;
}
```

### Wiring

- **tool** kind → `onActiveToolChange(id)` on the parent; active state = `activeToolId === id`.
- **action** kind → `onAction(id)` single-shot.
- **toggle** kind → `onToggle(id, nextState)` + parent holds state.

Parent (`NewCanvasMode` in `App.tsx`) owns the callbacks and threads them to `NewToolbox`.

### Active tool mapping to `CanvasNewToolId`

The existing `CanvasNewToolId` union is `'select' | 'bond'`. UI buttons whose behavior dispatches bond variants (single/double/triple) all map to `'bond'` in the underlying registry for now — the visual active state tracks the UI button id, but the registry arms the bond tool. Wave-7 will widen the underlying tool registry to support bond styles natively.

### Button file structure

```
packages/ui/src/canvas-new/toolbox/
  NewToolbox.tsx          — orchestrator (single file, data-driven)
  tools.ts                — the TOOL_DEFS array (source of truth)
  ToolButton.tsx          — generic button primitive
  icons.tsx               — custom chem SVGs (bond-single, bond-double, bond-triple, benzene, cyclohexane, retro-arrow)
```

Lucide imports stay tree-shaken — only import specific icons.

### Scope boundary

NewToolbox does NOT replace PropertyPanel, StatusBar, or NMR panel. Those stay mounted by `App.tsx` / `NewCanvasMode` as established in wave-5 hotfix (commit 8f5090b). NewToolbox owns only the left rail.

### Tests

- Unit: one test per tool button — renders, click dispatches correctly, disabled state shows tooltip, active state reflects activeToolId.
- E2E (Phase 4.4): `shell-parity.spec.ts` extended with ≥15 assertions on P0 tool presence in both chromium and chromium-new-canvas projects.
