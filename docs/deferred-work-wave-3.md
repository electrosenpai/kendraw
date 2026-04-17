# Wave-3 Deferred Work

> Generated 2026-04-17 at the close of the autonomous wave-3 session.
> Wave-3 closed the wave-2 debt (B1 shapes + C1 curly-arrow anchoring)
> and shipped 9 commits. The items below remain consciously punted.

## Deferred this session

### Shape editing UX (wave-3 B1 follow-up)

- **What shipped**: the Shape tool draws and persists rectangles and
  ellipses; they render in canvas and export in SVG.
- **What's deferred**: selection handles to resize/rotate after the
  fact, and a property panel for stroke color / stroke width /
  fill. The `resize-shape` and `move-shape` commands already exist
  in the scene store — only the interaction layer is missing.
- **Risk of deferring**: low. Users can delete-and-redraw as a
  workaround. Wave-4 should wire a PropertyPanel shape section.

### Curly-arrow anchor UI affordances (wave-3 C1 follow-up)

- **What shipped**: `snapArrowAnchor` finds the nearest atom, bond,
  or lone pair within a hit-test radius when the curly-arrow tool
  drops an endpoint, and the scene persists the anchor kind.
- **What's deferred**: visual snap indicator (highlight the atom
  under the pointer before the second click) and a draggable control
  point for the Bezier curvature after the arrow has been drawn.
- **Risk of deferring**: medium. Without the snap indicator, users
  have to trust the code found the right atom. Wave-4 should add a
  cursor-follow hint.

## Tier-D items carried forward from wave-2

These remain unstarted — all rated XL, L, or blocked on external
input:

- **13C NMR prediction** — requires NMRShiftDB calibration and a new
  `kendraw_chem/nmr_13c.py` backend module. XL.
- **19F / 31P NMR prediction** — L each; low demand; blocked on 13C
  priority.
- **2D NMR (COSY / HSQC / HMBC)** — XL; requires a 2D spectrum
  renderer and backend peak-pair computation.
- **CDXML binary `.cdx` export** — blocked on undocumented binary
  format; reverse-engineering effort is open-ended.
- **BioDraw module** — entire parallel surface for biopolymers; not
  scoped.
- **OPSIN structure-to-name** — XL; Java/WASM port required.
- **Conformational templates (Newman, Fischer, Haworth, chair)** — L
  each; needs 2.5-D primitives the canvas doesn't yet have.
- **3D conformer generation (ETKDGv3 + MMFF94)** — M code, but
  introduces a 3D rendering axis.
- **Polymer brackets `[ ]n`** — M; new `Bracket` node + contained
  atom scoring.
- **Multi-page documents** — L; paradigm shift from
  one-page-per-tab.
- **ChemScript SDK** — L.
- **Audit trail (CFR 21 Part 11)** — L; compliance.
- **MOL V3000 / RXN / SDF multi-mol I/O** — M each; backend already
  supports V3000, UI wiring open.
- **Orbitals (s / p / d lobes with +/- phase)** — M; new SVG
  primitive. Scope unclear between pedagogical and research use.

## Not deferred — pre-existing or verified in wave-3

- **Smart abbreviations (Me, Et, Ph, tBu, Ac)** — already wired in
  Canvas label hotkey table (a/d/e/m/t). Wave-3 A4 extended with
  Shift+{O,F,N,Y}.
- **Lone pairs rendering** and **radical dots** — already drawn by
  the renderer; verified during wave-3 code scan.
- **CPK coloring** — already the default colour source for
  heteroatom labels via `getColor(element)`; no toggle needed.

## Decision log

- **A single commit `a31a970` for A1 + A2** (dipole + no-go arrows):
  both arrow types share the exact same renderer decoration path
  (post-shaft overstrike), so bundling them was zero risk and kept
  the commit atomic.
- **B1 split across two commits** (`c1447b6` data model, `52be026`
  rendering/tool): the data model commit landed before the wave-3
  session opened; wiring was deferred to let the wave-3 session
  review the store shape before committing to a tool mode.
- **Grid snap on mouseup, not mousemove**: snapping only the final
  coordinate keeps drag previews smooth while still placing atoms
  on the lattice. Matches ChemDraw behaviour.
- **GRID_SIZE_PX exported from renderer-canvas**: single source of
  truth shared by the renderer (drawing dots) and Canvas.tsx
  (rounding coordinates).
- **A6 shipped as a docs-only commit**: kept out of wave-3 code
  commits so `git log --grep="wave-3"` has a clear split between
  feature code and documentation.
