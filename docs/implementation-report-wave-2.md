# Wave-2 Implementation Report

> Autonomous session, 2026-04-17. Source: `docs/backlog-wave-2.md`.
> All commits reference wave-2 and passed the 7-check pre-commit gate
> (eslint, tsc, vitest, ruff check, ruff format, mypy, pytest) on every
> commit. Zero pre-commit-hook bypass. Zero regression on the existing
> 407 frontend + 228 backend + 21 E2E baseline.

## Commits shipped

| Order | SHA | Story | Tier | Scope |
|------:|-----|-------|:----:|-------|
| 1 | `97dcb20` | A1 — compound numbering UI debt | A | Closes wave-1 P1-2: toolbar button, Ctrl+Shift+C, SVG export, E2E |
| 2 | `39d4452` | A2 — cyclononane / cyclodecane / cyclopentadiene templates | A | 3 new `RING_TEMPLATES` entries + 4 unit tests |
| 3 | `fa73bb5` | A3 — NMR cumulative integration trace | A | `showIntegration` renderer option, ∫ toggle in NmrPanel, 4 unit tests, E2E spec |
| 4 | `4ef39d5` | A5 — Ctrl+P print + @media print CSS | A | Canvas.tsx Ctrl+P handler, global.css print block hiding chrome, E2E spec |
| 5 | `f36e068` | B1 — align-atoms command | B | New store command, Alt+Shift+{L,R,T,B,E,V} hotkeys, 9 unit tests |
| 6 | `2b9527e` | B3 / A6 — searchable shortcut cheatsheet | A | `filterShortcuts()` helper, search input, 8 unit tests |
| 7 | `f5419c6` | A7 — Ctrl+= / Ctrl+- keyboard zoom | A | Parity with wheel zoom, 1.1x/0.9x, clamped 0.1–5x |

## Tier score

- **Tier A shipped: 6** (A1, A2, A3, A5, A6, A7)
- **Tier B shipped: 1** (B1)
- **Already shipped, verified live in code: 1** (A4 — wheel zoom, alt/middle-click pan, drag-select zoom, double-click reset at `NmrPanel.tsx:556-639`)
- **Total wave-2 features delivered: 8** (7 new commits + 1 pre-existing verified)
- **Tier C: 0** (C1 deferred — see `deferred-work-wave-2.md`)

## Test-suite delta

| Suite | Wave-1 baseline | Wave-2 end |
|-------|----------------:|-----------:|
| Frontend unit (vitest) | 407 | **483** (+76) |
| Backend unit (pytest)  | 228 | **242** (+14) |
| E2E (playwright specs) | 21  | **24** (+3)  |

Frontend delta covers new tests in `rings.test.ts` (+4), SVG-export
compound-numbering tests (+2), `SpectrumRenderer.test.ts` integration
block (+4), `align-atoms.test.ts` (+9), `shortcut-filter.test.ts` (+8),
plus 49 pre-existing tests for wave-1 that were not counted in the
baseline. Backend delta is pre-existing; no backend changes in wave-2.

## Keyboard surface expansion

The following shortcuts were added or re-wired in wave-2 and are all
discoverable in the search-filtered cheatsheet:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Toggle compound numbering (A1) |
| `Ctrl+P` | Print (A5) |
| `Alt+Shift+L` | Align selection left (B1) |
| `Alt+Shift+R` | Align selection right (B1) |
| `Alt+Shift+T` | Align selection top (B1) |
| `Alt+Shift+B` | Align selection bottom (B1) |
| `Alt+Shift+E` | Align selection center-x (B1) |
| `Alt+Shift+V` | Align selection center-y (B1) |
| `Ctrl+=` | Zoom in (A7) |
| `Ctrl+-` | Zoom out (A7) |

Pre-existing NMR viewport shortcuts re-verified: mouse wheel zoom,
Alt+click / middle-click drag pan, click-drag region zoom, double-click
reset-to-fit (all at `packages/nmr/src/NmrPanel.tsx:556-639`).

## Methodology notes

- Every commit passed the full pre-commit gate (7 checks). No
  `--no-verify` was used.
- Unit tests were written alongside code, not as an afterthought.
  Integration toggle (A3) added 4 tests that exercise the render spy
  (stroke count, label emission, zero-integral short-circuit,
  empty-prediction safety).
- E2E specs were added for A1, A3, A5 in `e2e/p2-features/`.
- Commit messages follow conventional-commits with the wave-2 story ID
  trailer so `git log --grep "wave-2"` yields a clean audit trail.
- Documentation (`docs/keyboard-shortcuts-compliance.md`) was refreshed
  in-line with each shortcut-touching commit to prevent doc drift.

## Deferred

See `docs/deferred-work-wave-2.md` for work that was consciously
punted — most notably B2 (geometric shapes) and C1 (curved mechanism
arrow with atom→bond anchoring).
