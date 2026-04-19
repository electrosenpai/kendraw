# Wave-8 Ketcher pivot — Session A checkpoint

**Branch.** `wave-8-ketcher-pivot` (worktree `/home/debian/kendraw-wave8/`).
`main` is untouched; the clean-room canvas-new remains the production
drawing surface.

**Flag.** `VITE_USE_KETCHER` — default `false`. `VITE_ENABLE_NEW_CANVAS`
continues to gate canvas-new as before. Rollout is strictly opt-in during
Session A.

## What Session A delivered

### Phase 1 — research

- `docs/ketcher-integration-plan-wave-8.md` — version target
  (`ketcher-react@3.12.0` + `ketcher-standalone@3.12.0`), full event API
  surface, bidirectional-highlight feasibility GO (scenario a: MOL line ↔
  Ketcher pool id mapped by ±1).
- POC sandbox (`/tmp/ketcher-integration-test/`) exercised the real
  packages end-to-end, including Playwright probe of `subscribe('change')`,
  `subscribe('selectionChange')`, `editor.selection({atoms})`, and
  `editor.highlights.create({atoms, bonds, color})`.

### Phase 2 — install + wrapper

- `packages/ui` gains `ketcher-react`, `ketcher-standalone`, `ketcher-core`,
  and `immer` at `^3.12.0` / `^10.2.0`.
- `packages/ui/vite.config.ts` defines `global: 'globalThis'` so draft-js
  (transitive dep of ketcher-react) stops crashing on init.
- `packages/ui/src/canvas-ketcher/` is a new module:
  - `ketcherBridge.ts` — module-level subscribable store holding the live
    Ketcher instance, current molfile, current selection. Deduped
    writes, `subscribeKetcherBridge(listener)` returns an unsubscribe.
  - `KetcherCanvas.tsx` — React wrapper around ketcher-react's `<Editor/>`
    in standalone mode. `onInit` forwards the instance into the bridge,
    `subscribe('change')` pulls a fresh molfile into the bridge,
    `subscribe('selectionChange')` forwards to the bridge (with the
    `undefined`-payload guard documented in the research phase).

### Phase 3 — shell integration

- `App.tsx` routes to a new `KetcherCanvasMode` when `USE_KETCHER` is on.
  Canvas-new and the legacy canvas remain intact as alternate paths.
- `KetcherCanvasMode` collapses the left toolbar column (Ketcher ships its
  own toolbox), renders the Ketcher Editor, and wires Kendraw's side
  panels through a `createKetcherSceneStore()` shim. The shim exposes the
  full `SceneStore` interface so `@kendraw/nmr`'s `NmrPanel` consumes
  Ketcher molecules without modification: `getState` returns a Document
  parsed by `@kendraw/io::parseMolV2000`, `subscribe` fires on bridge
  updates, `dispatch({type: 'set-nmr-prediction'})` stores the prediction
  in the shim's page so the panel can read it back. Any other dispatch
  is ignored — Ketcher owns mutations.
- `PropertyPanel` receives the shim's Document and computes its
  formula/MW/LogP/tPSA/InChI via the existing `/api/v1/compute/properties`
  flow. No backend change.
- `useCurrentMolecule()` hook returns the live molfile from whichever
  mode is active; used today by Export-style consumers and ready for more
  integration surfaces in Session B.
- `ImportDialog`: when `USE_KETCHER` is on, parses the import to MOL and
  calls `ketcher.setMolecule(mol)` instead of dispatching scene commands.
  Supports MOL/SDF (passed through), SMILES (re-written via
  `writeMolV2000`), and CDXML (flattened to atoms+bonds; arrows /
  annotations dropped — Session B item).
- Attribution: `docs/THIRD-PARTY-NOTICES.md` + `README.md` updated to
  reflect the embedded drawing engine. Every file in `canvas-ketcher/`
  opens with the Apache-2.0 integration header.

## How to validate locally

```bash
cd /home/debian/kendraw-wave8
pnpm install            # first run only
VITE_USE_KETCHER=true pnpm dev
```

Open `http://localhost:5173/`. The layout should be:
- Kendraw TabBar at the top
- Ketcher Editor (full toolbox + canvas) fills the centre
- PropertyPanel on the right
- StatusBar at the bottom
- A floating "Show NMR / Hide NMR" button bottom-right of the canvas

## Session A acceptance checklist

Validate these manually before authorising Session B:

- [ ] 1. **Ketcher renders.** The Ketcher toolbox and drawing area appear in
      place of canvas-new. No console errors (ignore peer-dep warnings on
      `draft-js` and `typescript` — known benign).
- [ ] 2. **Properties update live.** Draw ethanol (`CCO`) via Ketcher's
      toolbox. The PropertyPanel shows formula `C2H6O`, MW ≈ 46.07, LogP,
      tPSA, InChI populated from the backend.
- [ ] 3. **Import pushes to Ketcher.** Open the import dialog, paste
      `c1ccccc1`, confirm. Benzene appears in the Ketcher canvas.
- [ ] 4. **Export works.** Use Ketcher's own export menu to retrieve
      MOL / SMILES / KET / SVG / PNG. Kendraw's Export flow is already
      `writeMolV2000`-based and continues to use the live bridge molfile.
- [ ] 5. **NMR panel predicts.** Click "Show NMR", draw an aromatic ring,
      observe ¹H prediction. Peaks list populates; re-prediction fires on
      canvas changes.
- [ ] 6. **Tabs + autosave behave.** Switch tabs, reload the page.
      Canvas-new tabs restore as before. Ketcher mode starts with a clean
      canvas on reload (auto-save for Ketcher mode is a Session B item —
      see "Deferred" below).

If any item fails, file a note under "blockers" in Session B's brief; do
not flip the default.

## Known limitations (deferred to Session B)

- **Bidirectional NMR↔canvas highlight.** Ketcher's pool ids are
  0-indexed numbers; Kendraw's `AtomId` is a branded UUID string assigned
  by `parseMolV2000`. Session B needs a translation layer (MOL-line index
  ↔ UUID) inside the shim before both directions can sync. NMR peak
  hovering still highlights atoms within the NMR panel's own chart.
- **Compound numbering.** Kendraw's custom numbering overlay does not
  exist in Ketcher; the toggle is a no-op in Ketcher mode. Session B
  either migrates numbering into the KET format (custom properties) or
  renders it as an SVG overlay on top of the Ketcher canvas.
- **Auto-save for Ketcher mode.** The workspace-store auto-save pipeline
  only knows how to serialize Kendraw Documents. Session B extends the
  pipeline with a discriminator (`mode: 'scene' | 'ketcher'`) and teaches
  `RecoveryBanner` to round-trip Ketcher molfiles. Existing canvas-new
  backups remain readable.
- **Theme parity.** Ketcher ships its own light theme; dark-mode CSS
  overrides land in Session B.
- **E2E retargeting.** Existing Playwright specs hit canvas-new selectors;
  a parallel spec for Ketcher mode lands in Session B.

## Criteria for Session B GO

- All six checklist items above pass manual validation.
- No CI regressions on `main` during Session A review.
- Team decides whether to pursue standalone (current) or switch to
  `ketcher-core` + our backend `StructServiceProvider` — Phase 1 chose
  standalone; Session B may revisit if Ketcher's bundled Indigo diverges
  from the backend's version.

## File inventory

### Added (Session A)

- `docs/ketcher-integration-plan-wave-8.md`
- `docs/ketcher-pivot-session-a-checkpoint.md` (this file)
- `packages/ui/src/canvas-ketcher/KetcherCanvas.tsx`
- `packages/ui/src/canvas-ketcher/KetcherCanvasMode.tsx`
- `packages/ui/src/canvas-ketcher/index.ts`
- `packages/ui/src/canvas-ketcher/ketcherBridge.ts`
- `packages/ui/src/canvas-ketcher/ketcherSceneStore.ts`
- `packages/ui/src/canvas-ketcher/useCurrentMolecule.ts`
- `packages/ui/src/canvas-ketcher/__tests__/ketcherBridge.test.ts`
- `packages/ui/src/canvas-ketcher/__tests__/ketcherSceneStore.test.ts`

### Modified (Session A)

- `packages/ui/package.json` + `pnpm-lock.yaml`
- `packages/ui/vite.config.ts`
- `packages/ui/src/App.tsx`
- `packages/ui/src/ImportDialog.tsx`
- `packages/ui/src/config/feature-flags.ts`
- `packages/ui/src/__tests__/feature-flag.test.ts`
- `docs/THIRD-PARTY-NOTICES.md`
- `README.md`

### Untouched (confirmed)

- `backend/**` — zero changes.
- `packages/ui/src/canvas-new/**` — zero changes.
- `packages/ui/src/Canvas.tsx` — legacy canvas intact.

## Test + CI status

- `pnpm typecheck`: clean
- `pnpm lint`: clean
- `pnpm test`: 200 ui + 246 scene + 100 io + 75 nmr (scene/io/nmr untouched)
- `backend/` pytest: 267 pass (pre-commit hook verified)
- Pre-commit hook ran green on all Session A commits; no `--no-verify`.
