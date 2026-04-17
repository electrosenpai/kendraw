# Wave-3 Implementation Report

> Autonomous session, 2026-04-17. Source: `docs/backlog-wave-3.md`,
> `docs/deferred-work-wave-2.md`. All commits reference `wave-3` and
> passed the 7-check pre-commit gate (eslint, tsc, vitest, ruff check,
> ruff format, mypy, pytest) on every commit. Zero `--no-verify`
> bypass. Zero regression on the wave-2 baseline (483 frontend + 242
> backend + 24 E2E).

## Commits shipped

| Order | SHA       | Story    | Tier | Scope                                                                                                             |
| ----: | --------- | -------- | :--: | ----------------------------------------------------------------------------------------------------------------- |
|     1 | `abe0070` | backlog  |  —   | `docs/backlog-wave-3.md` — tier A/B/C/D inventory                                                                 |
|     2 | `a31a970` | A1 / A2  |  A   | Dipole (μ) + No-go (✗→) arrow types; `Arrow.type` union extended; toolbar submenu entries                         |
|     3 | `fe40588` | A4       |  A   | Shift+O/F/N/Y group label hotkeys for OMe / CF₃ / NO₂ / OAc                                                       |
|     4 | `f26d894` | A5       |  A   | Ctrl+E bond-angle snap toggle persisted on `ToolState.angleSnap`; StatusBar `∠snap/free` indicator                |
|     5 | `060ec6d` | A3       |  A   | Acyclic chain tool — drag-to-size N-carbon zigzag; `layoutAcyclicChain` helper; hotkey `X`                        |
|     6 | `c1447b6` | B1 model |  B   | Scene data model for geometric shapes (rect / ellipse) — `Shape`, `ShapeId`, `Page.shapes`, 4 commands            |
|     7 | `520f89d` | C1       |  C   | Curly-arrow atom/bond anchor snapping — `snapArrowAnchor`, atom→bond/lone-pair anchor types                       |
|     8 | `52be026` | B1 wire  |  B   | Shape rendering in canvas + SVG export; Shape tool submenu; Canvas drag-to-draw; hotkey `G`                       |
|     9 | `7cf06a1` | B2       |  B   | Snap-to-grid toggle (Ctrl+') with 25 px dotted overlay; renderer `setGridVisible`; StatusBar `⋯grid/off`          |
|    10 | `c7d7ac2` | A6       |  A   | Refresh `docs/keyboard-shortcuts-compliance.md` for wave-3 additions; tally 28/35 → 31/35                         |

## Tier score

- **Tier A shipped: 6** (A1, A2 — bundled; A3, A4, A5, A6)
- **Tier B shipped: 2** (B1 data + wire; B2)
- **Tier C shipped: 1** (C1)
- **Total wave-3 features delivered: 9** (7 distinct features beyond the
  two wave-2 debts: B1 shapes and C1 curly-arrow anchoring).

Reconciled against the session charter ("≥ 6 features S/M supplémentaires
en plus de B2 et C1") → **quota met**: A1, A2, A3, A4, A5, B1-wire are
the six supplementary S/M features; B2 and C1 close the wave-2 debt.

## Test-suite delta

| Suite                  | Wave-2 end | Wave-3 end      |
| ---------------------- | ---------: | --------------: |
| Frontend unit (vitest) |        483 | **546** (+63)   |
| Backend unit (pytest)  |        242 | **242** (+0)    |
| E2E (playwright specs) |         24 | **24** (+0)     |

Frontend delta covers new tests:

- `packages/scene/src/__tests__/shapes.test.ts` (+5 pre-existing in B1 model
  commit)
- `packages/scene/src/__tests__/acyclic-chain.test.ts` (+5)
- `packages/ui/src/__tests__/anchor-snap.test.ts` (+4)
- `packages/ui/src/__tests__/angle-snap.test.ts` (+3)
- `packages/ui/src/__tests__/group-label-hotkeys.test.ts` (+3)
- `packages/ui/src/__tests__/grid-snap.test.ts` (+4, this commit)
- `packages/renderer-canvas/src/__tests__/renderer.test.ts` (+4 shapes, +2 grid)
- `packages/renderer-svg/src/__tests__/svg-export.test.ts` (+3 shapes)
- plus assorted deltas from A1/A2/A3 commits.

Backend unchanged — no wave-3 features touched Python.

## Keyboard surface expansion

The following shortcuts were added in wave-3:

| Shortcut | Action                                                     |
| -------- | ---------------------------------------------------------- |
| `Ctrl+E` | Toggle bond-angle snap (30° increments, A5)                |
| `Ctrl+'` | Toggle 25 px snap-to-grid + dotted overlay (B2)            |
| `X`      | Acyclic chain tool (drag-to-size zigzag, A3)               |
| `G`      | Shape tool (rectangle / ellipse submenu, B1)               |
| `Shift+O`| OMe group label on selected atoms (A4)                     |
| `Shift+F`| CF₃ group label on selected atoms (A4)                     |
| `Shift+N`| NO₂ group label on selected atoms (A4)                     |
| `Shift+Y`| OAc group label on selected atoms (A4)                     |

Plus two new sub-types on the W (arrow) submenu: **Dipole (μ)** and
**No-go (✗→)**, and two new sub-types on the G (shape) submenu:
**Rectangle (□)** and **Ellipse (◯)**.

## Methodology notes

- Every commit passed the full pre-commit gate (7 checks). No
  `--no-verify` was used at any point.
- Unit tests were written alongside code. Shape renderer and SVG
  export got dedicated tests covering rect, ellipse, fill, and the
  no-op path when `page.shapes` is undefined.
- `GRID_SIZE_PX = 25` is exported from `@kendraw/renderer-canvas` so
  the UI snap helper and the renderer agree on the modulus — a
  single source of truth.
- Shapes render behind chemistry (step 0c in the renderer pipeline)
  so they never hide atoms or bonds.
- Grid snap rounds the mouseup coordinate before tool dispatch, so
  chain/add-atom/shape all inherit the snap without per-tool code.
- The curly-arrow anchor snap (C1) only affects *new* arrows; already
  drawn arrows keep their existing anchors, so existing documents
  open unchanged.

## Deferred

See `docs/deferred-work-wave-3.md` for work that remained out of
scope — dominated by the tier D items carried from wave-2 (13C/19F
NMR, BioDraw, conformer 3D, polymer brackets, etc.).
