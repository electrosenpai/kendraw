# Ketcher integration plan — wave-8

**Status.** Phase 1 complete · GO on all feasibility gates · Session A implementing Phases 2+3.

**Branch.** `wave-8-ketcher-pivot` (worktree `../kendraw-wave8/`).

**Scope of this document.** Records the Phase 1 research and decisions that
unblock Session A. The POC sandbox at `/tmp/ketcher-integration-test/`
exercised the real ketcher-react + ketcher-standalone packages end-to-end;
the rest of this file consolidates the findings and translates them into
concrete integration steps.

## Why we are pivoting

The wave-4→wave-7 clean-room canvas (`packages/ui/src/canvas-new/`) shipped a
working toolbox + structure editor, but maintaining a drawing engine in
lock-step with Ketcher/ChemDraw conventions is a multi-quarter investment we
do not want to make. Ketcher's Apache 2.0 licence and mature feature set let
Kendraw focus on its differentiators: NMR prediction, property computation,
compound numbering, PubChem + CDXML ingestion. Backend (RDKit + Indigo +
ChemNMR) is untouched.

## Decisions

### Version target

| Package              | Version   | Reason                                       |
| -------------------- | --------- | -------------------------------------------- |
| `ketcher-react`      | `^3.12.0` | Latest stable, published 2026-03-04.         |
| `ketcher-standalone` | `^3.12.0` | Bundled Indigo WASM, no backend dependency.  |

React peer dep is `^18.2.0 || ^19.0.0`; Kendraw runs React 18.3.1. No
negotiation required.

### Mode: standalone

`StandaloneStructServiceProvider` ships the Indigo WebAssembly engine inside
a Web Worker (`indigo-ketcher@1.40.0`, ~34 MB wasm), so chemistry
computations run off the main thread with zero backend changes. The
alternative — `ketcher-core` + `RemoteStructServiceProvider` pointed at our
FastAPI backend — is deferred unless standalone bundle size or feature gaps
force it. Kendraw's backend keeps serving NMR, property, clean, and template
fusion endpoints; Ketcher's copy of Indigo only runs canvas-local chemistry.

### Bidirectional NMR highlight: scenario (a) — GO

The wave-8 pivot is gated on atom-index stability between Ketcher's internal
`Pool` and the MOL file line numbering Kendraw's NMR panel emits. This gate
is cleared:

1. **Pool semantics.** `Pool` (ketcher-core/domain/entities/pool.ts) extends
   `Map` with an auto-incrementing `nextId` starting at `0`. `Pool.add`
   returns the assigned id; Map preserves insertion order; `forEach` walks
   that order.
2. **MOL writer.** `molfile.ts` iterates `molecule.atoms.forEach((atom, id)
   => { this.mapping[id] = i++; })` with `i` starting at `1`. So MOL line
   number `n` corresponds to pool id `n - 1`.
3. **MOL parser.** `v2000.ts` adds atoms in file order to the pool, so pool
   ids match the original line numbers.
4. **Live probe.** Loading `CCO` and printing the pool gives ids `0, 1, 2`
   matching MOL lines `1, 2, 3`. `editor.selection({ atoms: [0, 1, 2] })`
   returns `{ atoms: [0,1,2], enhancedFlags: [0] }`.

**Conversion.** `molLine = poolId + 1`, `poolId = molLine - 1`. No hidden
remap, no translation layer required in Kendraw code.

## Ketcher API surface used by Kendraw

### Ketcher instance — obtained via `onInit`

```tsx
<Editor
  staticResourcesUrl=""
  structServiceProvider={new StandaloneStructServiceProvider()}
  onInit={(ketcher) => { /* stash ketcher in ref/state */ }}
  errorHandler={(msg) => console.error('[Ketcher]', msg)}
/>
```

The `Ketcher` object is only delivered via callback (no `ref` API). Public
methods confirmed available: `getMolfile`, `getSmiles`, `getKet`,
`setMolecule`, `addFragment`, `calculate`, `layout`, `setZoom`, `setMode`,
`exportImage`, plus the `editor` getter that exposes the raw `Editor`.

### Molecule changes — `editor.subscribe('change', cb)`

Wrapped in `customOnChangeHandler`. Callback receives structured
`ChangeEventData[]` (one entry per operation: `ATOM_ADD`, `BOND_DELETE`,
`ATOM_MOVE`, …). Kendraw does not need the structured form; we call
`await ketcher.getMolfile()` from the handler and push the string into the
scene store's `currentMolfile` field.

### Selection — `editor.subscribe('selectionChange', cb)` + `editor.selection({atoms})`

- **Read (canvas → NMR).** `subscribe('selectionChange', cb)`. Gotcha:
  `cb` fires with `undefined` when selection clears — not `null`, not `{}`.
  Handler must use `payload?.atoms ?? []`.
- **Write (NMR → canvas).** `editor.selection({ atoms: [...] })` is both
  getter and setter. Calling the setter **also** dispatches
  `selectionChange`, so the bridge must guard against feedback loops via an
  `isSettingSelection` ref.

### Highlight — `editor.highlights.create({atoms, bonds, color})`

Distinct from selection — used for NMR hover (colored glow, no selection
change). `getAll()` and `clear()` round it out. No `ketcher.setHighlight`
exists on the Ketcher-level API; use `editor.highlights` directly.

## Vite build requirements

The POC surfaced two Vite-level quirks:

1. **`draft-js` requires `global`.** Add `define: { global: 'globalThis' }`
   to `vite.config.ts`. Without this, the Ketcher bundle crashes on first
   import with `ReferenceError: global is not defined`.
2. **No special `optimizeDeps` change required** for Vite 6 + Kendraw's
   pnpm workspace — ketcher-react dist is already pre-bundled ESM. (This
   differs from Ketcher's own example repo, which builds the monorepo
   source and needs `vite-plugin-commonjs`. We consume the npm dist, so
   the defaults work.)

## Kendraw coupling surface

The audit (memory 2091, 2092, 2095) confirms that replacing canvas-new is
narrower than initially feared:

- **App.tsx** is the only non-test file importing canvas-new internals
  (`NewToolbox`, `CANVAS_REGISTRY_MAP`, `CanvasNewHandle`, `CanvasNewProps`,
  `CanvasNewToolId`, `cleanStructure`). Replacing canvas-new is almost
  entirely a routing change in App.tsx.
- **PropertyPanel.tsx** takes `{ doc: Document, visible: boolean }` — pure
  Kendraw scene types. It does not import canvas-new.
- **NmrPanel.tsx** (`@kendraw/nmr`) takes a `SceneStore` plus
  `selectedAtomIds`, `highlightedAtomIds`, `onHighlightAtoms` callbacks.
  Also does not import canvas-new.
- **ImportDialog, ExportDialog, MoleculeSearch (PubChem)** currently push
  into the scene store directly; they will route through the Ketcher
  instance when `USE_KETCHER` is on.

Therefore the panel interface stays stable. The Session A work is: (1)
introduce a `useCurrentMolecule()` hook that returns the molfile from the
active mode's source of truth, (2) rewire Property + NMR panels to use it,
(3) add `USE_KETCHER` branches at the 5 mutation sites.

## Files to create / adapt / remove

### Create (Session A)

- `packages/ui/src/canvas-ketcher/KetcherCanvas.tsx` — React wrapper around
  `Editor`, sets up onInit, change subscription, selection subscription,
  error handler.
- `packages/ui/src/canvas-ketcher/index.ts` — barrel.
- `packages/scene/src/hooks/useCurrentMolecule.ts` — mode-aware molfile
  accessor (already exported via a selector when canvas-new is active).
- `docs/ketcher-pivot-session-a-checkpoint.md` — Session A handoff.

### Adapt (Session A)

- `packages/ui/src/config/feature-flags.ts` — add `USE_KETCHER` (default
  `false`). `newCanvas` flag stays for the fallback path.
- `packages/ui/src/App.tsx` — three-way route: Ketcher → canvas-new →
  old canvas.
- `packages/scene/src/store.ts` — add `ketcher`, `currentMolfile`,
  `ketcherSelection` state plus the three setters; existing scene state is
  untouched.
- `packages/ui/src/PropertyPanel.tsx` — consume `useCurrentMolecule()`.
- `packages/nmr/src/NmrPanel.tsx` — consume `useCurrentMolecule()`;
  `onHighlightAtoms` routes to `ketcher.editor.selection({ atoms })` when
  active.
- `packages/ui/src/ImportDialog.tsx` — branch on `USE_KETCHER` to call
  `ketcher.setMolecule(molfile)`.
- Export path (currently in `App.tsx` / `Canvas.tsx`) — branch on
  `USE_KETCHER` to call `ketcher.getMolfile/getSmiles/generateImage`.
- Auto-save (see `workspace-store.ts` + `RecoveryBanner.tsx`) — add
  `mode: 'ketcher' | 'scene'` discriminator, stay backward-compatible with
  existing backups.
- `docs/THIRD-PARTY-NOTICES.md` — add Ketcher section (Apache 2.0 / EPAM).
- `README.md` — add "Drawing engine: Ketcher (EPAM, Apache 2.0)" line.

### Remove (Session B, wave-9)

- `packages/ui/src/canvas-new/*` — deprecated in Session B, removed in
  wave-9.
- `packages/ui/src/Canvas.tsx` — legacy canvas, removed with canvas-new.
- `newCanvas` feature flag — removed once Ketcher is default.

## Out of scope for Session A (Session B backlog)

- Compound numbering is disabled (toggle grayed with "Coming soon in Ketcher
  mode" tooltip). Reimplementation in wave-9 either as KET custom
  properties or an SVG overlay.
- Theme polish — Ketcher ships its own light theme. Dark-mode parity is a
  wave-9 polish pass; Session A does not block on it.
- Playwright E2E retargeting — the existing canvas-new E2E specs stay green
  on the canvas-new path; Ketcher-mode E2E is Phase 4 in Session B.

## Feasibility gates — all GO

- [x] **Atom index stability.** Verified by source analysis + live probe.
- [x] **Programmatic selection API.** `editor.selection({atoms})` works.
- [x] **Selection change subscription.** Fires on user + programmatic
      selection; feedback loop guard documented.
- [x] **Molecule change subscription.** `subscribe('change', cb)` returns
      structured `ChangeEventData[]`; `getMolfile()` available.
- [x] **Vite compatibility.** Requires `define: { global: 'globalThis' }`;
      otherwise clean install + dev server.
- [x] **React version compatibility.** 18.3.1 satisfies the peer range.
- [x] **Licence compatibility.** Apache 2.0 + MIT, attribution recorded.

Proceeding to Phase 2.
