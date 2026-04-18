# Canvas-new toolbox button handlers — wave-7 HF-6

## Diagnostic

**Symptom.** Under `VITE_ENABLE_NEW_CANVAS=true`, every toolbox button
rendered correctly but no click fired. Keyboard shortcuts (`V`, `1`, `C`,
…) still worked.

**Root cause.** `CanvasNew.tsx` kept three wave-4 shell placeholders:

```tsx
<div style={{ gridArea: 'toolbar' }}    data-testid="canvas-new-toolbar" />
<div style={{ gridArea: 'properties' }} data-testid="canvas-new-properties" />
<div style={{ gridArea: 'status' }}     data-testid="canvas-new-status" />
```

Since the wave-5 hotfix, `App.tsx` (via `NewCanvasMode`) owns the shell
and already mounts the real `NewToolbox`, `PropertyPanel` and `StatusBar`
in those same grid cells. Because CanvasNew renders *after* the real
widgets, its empty placeholders sat on top in the same CSS grid area and
silently intercepted pointer events — Playwright surfaced this as:

```
<div data-testid="canvas-new-toolbar"></div> intercepts pointer events
```

Keyboard kept working because `useToolHotkeys` binds to `window.keydown`,
so it bypasses the DOM hit-test entirely.

**Fix.** Drop the three orphan placeholders. CanvasNew now only owns the
canvas cell. The shell test was flipped to assert their absence so the
regression can't come back.

## Canonical ToolButton pattern

Every entry in `TOOL_DEFS` is a `ToolDef`:

```ts
interface ToolDef {
  id: NewToolboxButtonId;
  kind: 'tool' | 'action' | 'toggle';
  group: NewToolboxGroup;
  label: string;
  tooltip: string;
  shortcut?: string;
  iconId: string;
}
```

`NewToolbox` dispatches per `kind` in a single spot:

```tsx
<ToolButton
  def={def}
  active={active}
  disabled={disabled}
  onClick={() => {
    if (def.kind === 'tool') props.onToolChange(def.id);
    else props.onAction(def.id);
  }}
/>
```

`ToolButton` forwards to the store via `onClick` and carries
`data-testid="new-tool-<id>"`, `aria-label`, `aria-pressed` (toggles
only), and `data-active` for e2e assertions.

## Modal tool vs. action distinction

| Kind     | `onClick` wires to                         | Highlight         |
|----------|--------------------------------------------|-------------------|
| `tool`   | `onToolChange(id)` → `setActiveTool`       | `data-active`     |
| `action` | `onAction(id)` → `handleAction` switch     | one-shot dispatch |
| `toggle` | `onAction(id)` → `handleAction` switch     | `aria-pressed`    |

`handleAction` in `NewCanvasMode` routes actions explicitly —
`undo`/`redo` hit `activeStore`, `fit-to-view` hits the canvas handle,
`structure-clean`/`structure-refine` call `runStructureClean`,
`paste-smiles`/`search-molecule` open their dialogs, the two toggles flip
shell state. This keeps action buttons from polluting `activeTool`.

## Regression lock

`e2e/canvas-new/toolbox-clicks.spec.ts` — 23 tests, one per tool + every
action + every toggle + a document-level hit-test that asserts no stray
element sits on top of a toolbox button's centre:

```ts
const hitId = await page.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y);
  return el?.closest('[data-testid^="new-tool-"]')
    ?.getAttribute('data-testid') ?? null;
}, [cx, cy]);
expect(hitId).toBe(`new-tool-${id}`);
```

Runs under `pnpm test:e2e:new-canvas` — auto-skips the default
chromium project when the flag is off.
