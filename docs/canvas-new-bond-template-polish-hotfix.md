# Canvas-new wave-8 hotfix — bond + template + (optional) polish

**Date.** 2026-04-18
**Branch.** main
**Commits.** `0f4bc92`, `c7c0cd6`, `c513ae5`, `f0ffe73`

## Bugs targeted

| ID  | Symptom                                                                                          | Root cause                                                                                       | Resolution                                                  |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1   | Ring fusion onto an existing bond produced "chelou" (off / overlapping) layouts.                 | Local fusion in `@kendraw/scene` is topologically correct but lays atoms naively in 2D.          | Backend round-trip through Indigo's `merge` + `layout`.     |
| 2   | Single / double / triple bond toolbar buttons appeared identical after wave-7 HF-A.              | Verification gap — wave-7 only checked `data-active-tool`, not pixels. Renderer was correct.    | Pixel-level E2E (`bond-rendering.spec.ts`) proves stripes 1/2/3. |
| 3   | "Capricieux" drawing UX                                                                          | Open                                                                                             | Phase 4, optional, deferred.                                |

## Architecture additions

```
backend/
  kendraw_chem/
    indigo_service.py            ← new, thread-local Indigo facade
  kendraw_api/
    routers/
      structure.py               ← + POST /structure/fuse-template
  tests/
    test_indigo_service.py       ← 6 tests (wrapper + cohabitation + TLS)
    test_fuse_template_indigo.py ← 12 tests (atom + bond fusion + endpoint)

packages/ui/src/canvas-new/
  templateFusion.ts              ← new, fuseTemplate helper
  __tests__/templateFusion.test.ts
  tools/ringTool.ts              ← refineFusionWithBackend() hook

e2e/canvas-new/
  bond-rendering.spec.ts         ← new (HF-A2)
  template-fusion.spec.ts        ← new (HF-D2)

docs/
  THIRD-PARTY-NOTICES.md         ← + Indigo (EPAM, Apache 2.0)
  indigo-integration-decision.md ← new
```

## Behavior model — ring tool fusion

```
user clicks ring template on existing bond
              │
              ▼
        local generator dispatches the fused ring     (instant feedback, ~0 ms)
              │
              ▼
        fire-and-forget fuseTemplate({...})
              │
        ┌─────┴─────┐
        │ backend   │ backend down / errored
        │ success   │
        ▼           ▼
   replace page    keep local result
   with Indigo     untouched
   layout
```

**Why fire-and-forget.** Local fusion is correct; the backend refinement is purely cosmetic (better layout). Awaiting it would either block the UI thread for ~50-200 ms per click or require optimistic UI plumbing we don't need yet.

**Why the local path stays.** Backend reachability isn't guaranteed in offline / sandboxed deployments. Removing the local path would mean ring tools silently noop offline.

## Test pyramid for HF-D2

| Layer        | Count | What it asserts                                                                                                        |
| ------------ | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| Unit (py)    | 6     | `IndigoService.fuse_template_*` round-trip canonical SMILES (`Cc1ccccc1`, `c1cccc2ccccc21`), index validation, layout. |
| Endpoint (py)| 6     | `POST /structure/fuse-template` happy path (atom + bond), validation 400s, custom anchors.                             |
| Unit (ts)    | 7     | `fuseTemplate` empty / target-missing / network / engine / success / anchors + RING_TEMPLATE_SMILES coverage.          |
| E2E          | 3     | Vite-proxy round-trip (naphthalene, toluene), full UI bond-then-fuse smoke catches the POST.                           |

## Verification snapshot

| Gate                                  | Result      |
| ------------------------------------- | ----------- |
| `pnpm lint`                           | 0 errors    |
| `pnpm typecheck`                      | 0 errors    |
| `pnpm test` (frontend)                | **all pass** (UI: 192) |
| `cd backend && uv run ruff check`     | 0 errors    |
| `cd backend && uv run ruff format -c` | 0 reformats |
| `cd backend && uv run mypy ...`       | 0 errors    |
| `cd backend && uv run pytest`         | **267 pass**|

## Follow-ups

- **Phase 4 (HF-POLISH).** Pointer-event smoothing, tool-switch debouncing, hover/preview latency. Optional, not started.
- **Anchor UI.** The fuse endpoint accepts `template_anchors`; the ring tool always uses defaults today. A subtle right-click menu could expose alternatives (e.g., fuse pyridine via N or via C).
- **Layout cleanup integration.** `/structure/clean(mode='full')` could pick Indigo when available for a quality boost on the dedicated "Refine 2D" button.
