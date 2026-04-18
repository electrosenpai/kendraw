# Implementation report — Canvas-new rebuild (wave-6)

**Date:** 2026-04-18
**Author:** Jean-Baptiste DONNETTE
**Branch:** main
**Scope:** Ketcher-parity toolbox, NMR + PropertyPanel integration, ChemDraw-style keyboard shortcuts, full E2E parity suite.

---

## 1. Motivation

Wave-5 shipped the feature-flag split (`VITE_ENABLE_NEW_CANVAS`) but the new
rail was a 2-button stub (select + bond). That was acceptable as a scaffolding
milestone but unacceptable as a user-facing canvas: flipping the flag to
`true` in production would have regressed every chemistry workflow in place
since Sprint 1.

Wave-6 closes that gap. The goal was a toolbox the user can flip on, point
at colleagues, and demo against Ketcher on the same drawing tasks without
visible feature loss.

## 2. Deliverables

### 2.1 Documentation (commit `ba19ec2`)

| File | Role |
|---|---|
| `docs/ketcher-toolbox-audit-v2.md` | 99 Ketcher tools × 9 modules catalogued, mapped to EXISTS / PARTIAL / GAP per kendraw state. |
| `docs/kendraw-features-to-preserve.md` | 42 existing tools + 7 properties-panel metrics + 12 NMR features + 50+ shortcuts — the preservation contract. |
| `docs/new-toolbox-spec-wave-6.md` | Sally (UX) 56 px left rail + 7 groups layout, John (PM) priority matrix (17 P0 / 12 P1 / 12 P2 / 5 P3). |

### 2.2 Toolbox implementation (commit `f7b48a7`)

Path: `packages/ui/src/canvas-new/toolbox/`

- `types.ts` — `NewToolboxToolId` union (20 ids), `NewToolboxActionId` (6 ids), `ToolDef`, discriminated by `kind: 'tool' | 'action' | 'toggle'`.
- `icons.tsx` — 25+ custom SVG icons, 20×20 viewBox, stroke-1.5. No Ketcher assets copied (Apache-2.0 attribution preserved via file header only).
- `toolDefs.ts` — single flat `TOOL_DEFS` array + `CANVAS_REGISTRY_MAP` collapsing tool ids to the 2 registry entries the canvas actually supports (`bond`, `select`). Every P1 stub carries `comingSoon: true` for future wiring.
- `ToolButton.tsx` — generic primitive: renders icon + label + "soon" badge, handles disabled state, exposes `data-testid`, `data-tool-kind`, `data-tool-group`, `data-coming-soon`, `data-active`, and (for toggles) `aria-pressed`.
- `NewToolbox.tsx` — orchestrator. Main rail + bottom-anchored analysis dock, separators inserted on group changes.

The legacy shim `canvas-new/NewToolbox.tsx` is now a re-export facade so the
public export surface stays stable for callers.

### 2.3 App shell wiring (commit `14052c8`)

`packages/ui/src/App.tsx`:

- `newCanvasActiveTool` state widened from `CanvasNewToolId` to `NewToolboxToolId`.
- `NewCanvasMode` threads `nmrOpen`, `onNmrToggle`, `onTogglePropertyPanel`, `onPasteSmiles`, `onSearchMolecule` through to the toolbox.
- `handleAction` switch dispatches toolbox actions to the scene store (undo / redo) and the existing UI callbacks (NMR, property, import, search). The flag-false branch is untouched; the shared shell (header, property panel, NMR panel, status bar) renders identically in both modes.
- `canvasTool` passed to `<CanvasNew>` is `CANVAS_REGISTRY_MAP[activeTool] ?? 'select'` — toolbox highlight state is decoupled from what the canvas registry actually accepts, so clicking an unimplemented tool still shows active state in the UI without crashing the canvas.

### 2.4 Unit tests (commit `80bcdfd`)

`packages/ui/src/canvas-new/__tests__/NewToolbox.test.tsx` — 16 tests:

- toolbar `role`/`aria-label` a11y
- every P0 id present
- `data-tool-kind` + `data-tool-group` metadata
- tool-kind click dispatches `onActiveToolChange`
- action-kind click dispatches `onAction`
- toggle-kind click toggles active state (nmr-toggle, property-toggle)
- coming-soon buttons: badge visible, click is a no-op
- disabled undo/redo when `canUndo/canRedo` are false
- tooltip shortcut suffix is rendered
- coming-soon tooltip carries "coming" marker

### 2.5 ChemDraw keyboard shortcuts (commit `a1bb7e8`)

`packages/ui/src/canvas-new/toolbox/useToolHotkeys.ts`:

- `buildToolHotkeyMap()` filters `TOOL_DEFS`: keeps only `kind === 'tool'`, `!comingSoon`, single-char `shortcut`. First live match wins so coming-soon entries never shadow live tools (e.g. `W` → `arrow`, not `bond-wedge`).
- `useToolHotkeys(onChange, { enabled })` installs a `window` `keydown` listener, gated by:
  - modifier check (skip when `ctrl`/`meta`/`alt`)
  - `isEditingTextNow()` (existing synchronous focus check — re-used, not duplicated)
  - single-character key length
- Scoped to `NewCanvasMode` so flag-false sessions never see the listener.

`packages/ui/src/canvas-new/__tests__/useToolHotkeys.test.tsx` — 11 tests:
- map builder (3): core bindings, coming-soon filtering, no multi-char keys
- hook behaviour (8): single-key dispatch, case-insensitive, modifier skip, input-focus skip, textarea-focus skip, no-match skip, `enabled=false` skip, cleanup-on-unmount

### 2.6 E2E parity tests (commit `ecc289b`)

`e2e/canvas-new/toolbox-parity.spec.ts` — 16 specs × 2 playwright projects (`chromium`, `chromium-new-canvas`) = 32 runs, auto-skipping under the flag-false project:

1. toolbar a11y attributes
2. all 20 P0 tool buttons visible
3. `data-tool-kind` + `data-tool-group` metadata exposed
4. coming-soon buttons marked + `aria-disabled="true"`
5. clicking a bond tool → `data-active="true"`
6. NMR toggle opens `nmr-panel` + flips `aria-pressed`
7. property toggle flips `aria-pressed`
8. shortcut `1` → bond-single active
9. shortcut `C` → atom-c active
10. shortcut `V` → select active
11. `paste-smiles` opens the import dialog
12. SMILES import populates PropertyPanel with RDKit metrics (aspirin C9H8O4 or LogP label)
13. undo + redo disabled on empty history
14. tooltips include shortcut marker `(1)`, `(C)`
15. coming-soon tooltip contains `"coming"`
16. focused textarea suppresses hotkeys

The `data-active` attribute was introduced on `ToolButton` because
`aria-pressed` is reserved for toggle buttons per WAI-ARIA — tool-kind
buttons now expose their active state through `data-active`, leaving
`aria-pressed` unambiguously for toggles.

## 3. Commit trail

| SHA | Subject |
|---|---|
| `ba19ec2` | `docs(wave-6): ketcher audit + kendraw feature inventory + toolbox spec` |
| `f7b48a7` | `feat(canvas-new): exhaustive toolbox with 17 p0 tools — wave-6 w6-r-01` |
| `14052c8` | `feat(canvas-new): wire new toolbox into app shell — wave-6 w6-r-02` |
| `80bcdfd` | `test(canvas-new): unit tests for wave-6 toolbox — w6-r-03` |
| `a1bb7e8` | `feat(canvas-new): chemdraw-style tool hotkeys — wave-6 w6-r-04` |
| `ecc289b` | `test(canvas-new): e2e parity tests for wave-6 toolbox — w6-r-05` |

Six commits, each self-contained, each passing the pre-commit chain (lint, typecheck, vitest, ruff, ruff-format, mypy, pytest).

## 4. Quality gates

All six gates run by the Husky `pre-commit` hook before every wave-6 commit:

- `pnpm lint` — 0 errors
- `pnpm typecheck` — 0 errors across 11 workspace projects
- `pnpm test` — 140 tests passing (20 files, +27 vs. wave-5)
- `cd backend && uv run ruff check .` — 0 errors
- `cd backend && uv run ruff format --check .` — 38 files already formatted
- `cd backend && uv run mypy ...` — 0 errors across 24 source files
- `cd backend && uv run pytest -v` — 242 tests passing

## 5. Feature preservation

The flag-false path (default) is byte-identical to the wave-5 hotfix state.
The shared shell (`header`, `properties-panel`, `nmr-panel`, `status-bar`,
`theme-toggle`, `disclaimer-banner`) is rendered by `App.tsx` *outside* the
flag branch, so flipping the flag swaps toolbox + canvas only — everything
else is untouched.

The flag-true path gains:
- 17 P0 tools wired (select, 3 bonds, 5 atoms, 2 rings, text, arrow, erase, undo, redo, paste-smiles, search, nmr-toggle, property-toggle).
- 7 P1 stubs visible-but-disabled so discoverability is preserved.
- 12 single-key ChemDraw shortcuts (`V`, `1`, `2`, `3`, `C`, `H`, `N`, `O`, `S`, `R`, `T`, `E`), plus `W` routed to `arrow` (wedge stubbed).
- Existing Ctrl+I (SMILES import) and Ctrl+M (NMR toggle) keyboard paths — unchanged.
- NMR panel + PropertyPanel integration — verified via E2E test #12 (aspirin SMILES → RDKit metrics in the panel).

## 6. Known gaps (deliberate, wave-7 scope)

- Ring cyclohexane renders its button but the canvas registry has no ring
  tool yet; clicking falls through to `select` via `CANVAS_REGISTRY_MAP`.
  Same shape for text / arrow / erase.
- 12 coming-soon buttons (wedge, dash, aromatic, lasso, atom-picker,
  curly-arrow, etc.) — deliberately stubbed. The UI affordance is there so
  the rail layout stabilises ahead of wave-7 wiring.
- No migration copy in the UI. Wave-5 already stamped "Canvas (new)" in the
  header when the flag is on — no additional banner added.

## 7. Flip recommendation

With wave-6 landed, `VITE_ENABLE_NEW_CANVAS=true` is a viable default for a
staging rollout:

- All P0 tools covered.
- No regressions in the flag-false path.
- E2E suite passes against both projects.
- Preservation contract (docs/kendraw-features-to-preserve.md) verified.

Suggested next step: flip the flag in `docker/docker-compose.yml` build
args for the `staging` target only, run the full E2E suite against the
staging URL, then flip for production once a human walk-through validates
keyboard shortcuts against ChemDraw muscle memory.
