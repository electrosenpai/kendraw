# Canvas-new shell fix — wave-5 hotfix

> Diagnostic and architecture record for the `VITE_ENABLE_NEW_CANVAS`
> feature-flag scope bug. Closes the wave-5 hotfix tracked under
> "VITE_ENABLE_NEW_CANVAS Feature Flag Scoping".

## Symptom

When `VITE_ENABLE_NEW_CANVAS=true` was set, the entire app shell
disappeared. Users saw only a blank drawing area:

- left toolbox column was empty
- right properties panel was empty
- bottom status bar was empty
- only the top tabbar and the (still-shared) NMR panel survived

flag=false rendered the app correctly.

## Diagnostic

The legacy `Canvas.tsx` is a 1729-line monolith that owns **four CSS
grid areas**: `toolbar`, `canvas`, `properties`, and `status`. It composes
`<ToolPalette />`, `<PropertyPanel />` and `<StatusBar />` internally and
fills the toolbar/properties/status grid cells itself.

The new `CanvasNew.tsx` (wave-4 R-01) was scaffolded with the same four
grid areas — but three of them (`toolbar`, `properties`, `status`) are
empty placeholder `<div data-testid="canvas-new-…" />` mount points
waiting for their real implementations.

`App.tsx` swapped one for the other based on the flag:

```tsx
return FEATURE_FLAGS.newCanvas ? (
  <Suspense fallback={…}>
    <LazyCanvasNew {…canvasProps} />
  </Suspense>
) : (
  <Canvas {…canvasProps} />
);
```

**Root cause:** the flag was scoped at the wrong granularity. It swapped
the *whole* canvas-and-shell composite, not just the new toolbox + new
canvas. With `CanvasNew` rendering empty placeholders into the toolbar/
properties/status grid cells, those cells went dark.

This was missed in wave-4 because the new canvas was always exercised
through unit tests (which only assert the placeholder mount points
exist) and never through the real app shell.

## Fix

`App.tsx` is now the sole composition point for the four grid areas in
both modes. The flag scope is reduced to two zones:

```tsx
function App() {
  return (
    <LayoutGrid>
      <TabBar data-testid="app-header" />        {/* common */}

      {flag ? (
        <NewCanvasMode>                          {/* zone A + B */}
          <NewToolbox … />                        {/*   toolbar  */}
          <CanvasNew … />                         {/*   canvas   */}
          <PropertyPanel … />                     {/* common     */}
          <StatusBar … />                         {/* common     */}
        </NewCanvasMode>
      ) : (
        <Canvas … />                             {/* monolith   */}
      )}

      <NmrPanel … />                             {/* common */}
      <Modals … />                               {/* common */}
    </LayoutGrid>
  );
}
```

`NewCanvasMode` is a small co-located component in `App.tsx` that:

1. owns the `activeTool` state for the new toolbox (controlled),
2. subscribes to the active scene store via `useSyncExternalStore` so
   `<PropertyPanel />` and `<StatusBar />` re-render on document
   changes — the same data the legacy `Canvas.tsx` already feeds them,
3. wires the new toolbox ↔ canvas through a controlled `activeToolId`
   prop on `<CanvasNew />` (added in this commit; defaults preserved
   for backward-compat with the wave-4 unit tests).

The placeholder `<div data-testid="canvas-new-…">` mount points inside
`CanvasNew.tsx` are kept intact so the existing `canvas-new-shell.test.tsx`
remains green; CSS grid lets multiple children share a grid cell, so the
real `<NewToolbox />` / `<PropertyPanel />` / `<StatusBar />` mount on
top of the inert empty divs.

`<PropertyPanel />` and `<StatusBar />` are reused **verbatim** — no
modification — to satisfy the spec constraint that shared components
must not be touched by the flag.

## Rule for future canvas-new commits

> **The `newCanvas` flag scope is UNIQUELY toolbox + canvas — never
> the surrounding shell.**
>
> Concretely: any component that renders into the `tabbar`, `properties`,
> `status`, or `nmr` grid areas, or that listens for global keyboard
> shortcuts, MUST be reachable in both `flag=true` and `flag=false`
> mode without divergence. If a new canvas-new feature needs a new
> sidebar or panel, add it as a *peer* to the existing shared shell —
> do not subsume the shared component into `CanvasNew`.

## Tests added

`e2e/canvas-new/shell-parity.spec.ts` — six tests that assert, for
every mode:

- header visible
- properties panel renders (after a SMILES import)
- NMR panel opens with `Ctrl+M`
- a toolbox is visible (legacy or new)
- a drawing area is visible (legacy or new)
- SMILES paste via the import dialog works

These run under two Playwright projects:

- `chromium`            (`pnpm test:e2e`)              — flag=false
- `chromium-new-canvas` (`pnpm test:e2e:new-canvas`)   — flag=true

Both must be green for any future canvas-new PR.

Test IDs introduced for the parity suite:

- `app-header` on the tabbar wrapper
- `old-toolbox` on the legacy `Canvas.tsx` toolbar wrapper
- `old-canvas` on the legacy `Canvas.tsx` canvas wrapper
- `new-toolbox` on the new `<NewToolbox />`
- (`canvas-new-root` already existed on the new canvas region)
- (`properties-panel` already existed on `<PropertyPanel />`)
- (`nmr-panel` already existed on the NMR mount in `App.tsx`)

## Files touched

- `packages/ui/src/App.tsx` — flag scope reduced; `NewCanvasMode`
  composition added; `data-testid="app-header"`.
- `packages/ui/src/Canvas.tsx` — added `data-testid="old-toolbox"`
  and `data-testid="old-canvas"`.
- `packages/ui/src/canvas-new/CanvasNew.tsx` — added optional
  controlled `activeToolId` prop; placeholders preserved.
- `packages/ui/src/canvas-new/NewToolbox.tsx` — new minimal toolbox
  (Ketcher-inspired, select + bond).
- `packages/ui/src/canvas-new/index.ts` — exports `NewToolbox` and
  `CanvasNewToolId`.
- `e2e/canvas-new/shell-parity.spec.ts` — new test file.
- `playwright.config.ts` — `chromium-new-canvas` project.
- `package.json` — `test:e2e:new-canvas` script; `test:e2e` now
  pinned to `--project=chromium`.
