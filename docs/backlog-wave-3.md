# Backlog wave-3 — kendraw

> Generated 2026-04-17 (evening, post wave-2). Sources:
> `docs/deferred-work-wave-2.md`, `docs/kendraw-vs-chemdraw-feature-gap.md`,
> `docs/kendraw-roadmap-to-10.md`, in-tree scan of `packages/scene`,
> `packages/ui`, `packages/renderer-canvas`, `packages/renderer-svg`.
> Tier classification per the bmad autonomous-session prompt:
> A = S/zero-risk, B = M/manageable, C = L/one max, D = XL or needs
> human input.

## Wave-2 shipped (reference only)

A1 compound-numbering UI + SVG export · A2 cyclononane/cyclodecane/
cyclopentadiene · A3 NMR integration trace · A5 Ctrl+P print +
`@media print` · B1 alignment Alt+Shift+{L,R,T,B,E,V} · B3/A6 searchable
cheatsheet with filter · A7 Ctrl+=/Ctrl+- keyboard zoom · A4 NMR
viewport controls (pre-existing, verified live).

## Tier A — small, high value, zero archi risk

| # | Story | Source | Size | Status |
|---|-------|--------|------|--------|
| A1 | Dipole arrow type (straight arrow with centered cross-tick) | exhaustive-comparison C8 | S | absent from `Arrow.type` union |
| A2 | No-go arrow type (straight arrow with X overstrike) | exhaustive-comparison C7 | S | absent |
| A3 | Acyclic chain tool — auto-draw N-carbon zigzag chain on click+drag | exhaustive-comparison A16 | S | absent; no chain auto-draw anywhere |
| A4 | Label group hotkeys Shift+O=OMe, Shift+F=CF₃, Shift+N=NO₂, Shift+C=CN (Sh+Y=OAc) | deferred wave-2, Marcos, Volkov | S | `labelHotkeys` table only covers a/d/e/m/t |
| A5 | Fixed-angle bond snap toggle (Ctrl+E) + status bar indicator | deferred wave-2, exhaustive-comparison | S | no snap code path |
| A6 | Keyboard-shortcuts compliance doc refresh (Shift+B is Boron ✅, `b`→Br ✅, fix stale rows) | wave-2 decision log | S | doc out of sync with code |

## Tier B — medium effort, clear value

| # | Story | Source | Size | Status |
|---|-------|--------|------|--------|
| B1 | Geometric shapes (Rectangle / Ellipse / Line) as scene `Shape` node — tool, renderer (canvas + SVG), commands, undo, persistence | deferred wave-2 B2, exhaustive-comparison D6/D7 | M | brand-new node type; 5 packages touched |
| B2 | Snap-to-grid toggle with dotted grid overlay (25 px default) — view option + `@kendraw/scene` setting | exhaustive-comparison H3, Volkov | M | no grid primitive in renderers |

## Tier C — large, at most one this session

| # | Story | Source | Size | Status |
|---|-------|--------|------|--------|
| C1 | Curved mechanism arrow with atom→bond anchoring — snap endpoints to nearest atom/bond-midpoint during curly-arrow tool drag, auto-compute Bezier control offset, full-head (pair) vs half-head (radical) styling preserved | deferred wave-2 C1, Duval, Marcos | L | `ArrowAnchor` supports `atom`/`bond`/`lone-pair` refs already; UI only emits `free`/`free` |

## Tier D — deferred (XL or needs human input)

Carried forward unchanged from `docs/deferred-work-wave-2.md`:

- 13C NMR prediction (XL — NMRShiftDB calibration)
- 19F / 31P NMR (L each)
- 2D NMR COSY / HSQC / HMBC (XL)
- CDXML binary `.cdx` export (XL — undocumented format)
- BioDraw module (XL)
- OPSIN structure-to-name (XL)
- Conformational templates Newman / Fischer / Haworth / chair (L each)
- 3D conformer generation + ETKDGv3 + MMFF94 (M code but introduces a
  3D rendering axis)
- Polymer brackets `[ ]n` (M — new `Bracket` node + contained-atom
  scoring)
- Multi-page document (L — paradigm shift from one-page-per-tab)
- ChemScript SDK (L)
- Audit trail CFR 21 Part 11 (L — compliance)
- MOL V3000 / RXN / SDF multi-mol I/O (M each; backend already
  supports, UI wiring open)
- Orbitals (s/p/d lobes with +/- phase) (M — new SVG primitive, scope
  unclear for pedagogical vs research use)

## Acceptance criteria for this session

- 6+ Tier A delivered, 2 Tier B delivered, 1 Tier C delivered.
- B1 (shapes) and C1 (curved-arrow anchoring) close wave-2 debt —
  non-negotiable if they compile cleanly.
- Each feature: unit test(s) + Playwright E2E where UI-visible.
- 7 CI checks (eslint, tsc, vitest, ruff check, ruff format, mypy,
  pytest) green before every commit. Pre-commit hook never bypassed.
- Each commit references `wave-3` and follows conventional-commits
  (lowercase subject).
- Zero regression on the 500 frontend + 242 backend + 25 E2E baseline.
- Final: `docs/implementation-report-wave-3.md` +
  `docs/deferred-work-wave-3.md` + README counter refresh.
