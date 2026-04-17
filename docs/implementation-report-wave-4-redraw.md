# Wave-4 redraw — implementation report

**Status.** 5 / 8 P0 stories landed behind feature flag. 3 deferred to wave-5.
**Flag.** `VITE_ENABLE_NEW_CANVAS=true` swaps the legacy canvas for the new
one at startup. Default is `false` — no user-visible change.
**Test delta.** UI package: 65 → 89 tests (+24). Full monorepo: all green
(11 packages typecheck, 399 frontend tests, 242 backend tests, 0 lint
warnings).

## Stories shipped

| ID       | Title                                         | Commit    | Size      |
|----------|-----------------------------------------------|-----------|-----------|
| W4-R-01  | Feature flag + shell component                | `0b4bb62` | 4 files   |
| W4-R-02  | Tool abstraction + pointer dispatcher         | `de7a4a2` | 6 files   |
| W4-R-03  | CanvasRenderer mount + store subscription     | `f19b501` | 2 files   |
| W4-R-05  | 15° angle-snap utility (shift = free)         | `5eb3748` | 2 files   |
| W4-R-06  | Rubber-band rectangle selection               | `0379972` | 5 files   |

## Stories deferred

| ID       | Title                                  | Reason                                              |
|----------|----------------------------------------|-----------------------------------------------------|
| W4-R-04  | HoverIcon atom + bond                  | Needs new renderer overlay API — design pass first. |
| W4-R-07  | Drag-move selection + atomic undo      | Touches `scene` command coalescing contract.        |
| W4-R-08  | Quick-edit `/` panel                   | Depends on R-04.                                    |

See `docs/deferred-work-wave-4.md` for full justification and wave-5 targets.

## Architecture outcome

- New code lives in `packages/ui/src/canvas-new/` — a subfolder of the
  existing UI package, **not** a new workspace package. This matches
  Winston's ADR-002: keeps the dependency graph flat, avoids a
  publish-boundary decision until the new canvas is the default canvas.
- Tool abstraction is a **plain-object interface** (not a class). Tools
  register by `id` and implement any subset of
  `pointerdown / pointermove / pointerup / keydown / cancel / activate /
  deactivate`. The dispatcher hook binds DOM events to whichever tool is
  active — no business logic inside the dispatcher.
- The `SpatialIndex` (RBush) from `@kendraw/scene` is reused verbatim —
  hit-testing and `searchRect` are already O(log n) and mature. The new
  canvas rebuilds the index on every store change via
  `store.subscribe()`.
- `CanvasRenderer` is shared with the legacy canvas. `CanvasNew` instantiates
  its own renderer, attaches it to its own host `<div>`, subscribes to the
  store, and detaches on unmount — there is no coupling to the legacy
  canvas's instance.

## Clean-room discipline

- No Ketcher source was copied. Design inspiration is attributed in every
  `canvas-new/**` file via a three-line header comment pointing to the
  upstream repository.
- `docs/THIRD-PARTY-NOTICES.md` (new) credits Ketcher's Apache 2.0 licence
  and explains why design inspiration does not trigger licence obligations.
- The wave-4 analysis doc `docs/ketcher-analysis-wave-4.md` (committed in
  Acte 1) is the audit trail for what we read.

## Release gate

Murat's 6-criterion release gate (see
`docs/implementation-plan-wave-4-redraw.md`) is **not** closed at end of
wave-4 — we deliberately shipped behind the flag so the gate can be
evaluated against the full P0 bundle once R-04/R-07/R-08 land. Current
status:

| Criterion                                  | Status                               |
|--------------------------------------------|--------------------------------------|
| Baseline green (legacy canvas untouched)   | ✅ 399 frontend + 242 backend green  |
| `@canvas-new` tests green                  | ✅ 24 new tests, all green           |
| Coverage ≥ 80 % on `canvas-new/*`          | ⏳ deferred — measured once P0 complete |
| Visual regression < 1 %                    | ⏳ deferred — no visual diff tool yet |
| 3 panelist validations                     | ⏳ deferred — flagged off, no panel   |
| 5 consecutive non-flaky CI runs            | ✅ 5 green commits on main           |

## Files added

```
packages/ui/src/canvas-new/
├── CanvasNew.tsx
├── index.ts
├── snap.ts
├── toolRegistry.ts
├── types.ts
├── useToolDispatcher.ts
├── __tests__/
│   ├── canvas-new-shell.test.tsx
│   ├── marqueeSelectTool.test.ts
│   ├── snap.test.ts
│   ├── toolRegistry.test.ts
│   └── useToolDispatcher.test.tsx
└── tools/
    └── marqueeSelectTool.ts
packages/ui/src/config/
└── feature-flags.ts
packages/ui/src/__tests__/
└── feature-flag.test.ts
docs/
├── THIRD-PARTY-NOTICES.md        (new)
├── deferred-work-wave-4.md       (W4-R-04/07/08 appended)
└── implementation-report-wave-4-redraw.md  (this file)
```

## Next wave entry points

1. Add `renderer.setHoveredAtom()` + `renderer.setHoveredBond()` to
   `@kendraw/renderer-canvas`. Unblocks W4-R-04 and by extension W4-R-08.
2. Design a coalescing `move-atoms` command in `@kendraw/scene`. Unblocks
   W4-R-07.
3. Turn on `VITE_ENABLE_NEW_CANVAS` in an internal build and run the
   10-molecule visual-regression baseline Murat defined in the Acte 3 plan.
