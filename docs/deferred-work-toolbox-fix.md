# Deferred work — canvas-new toolbox rebuild

This document tracks tools that were part of the wave-6 toolbox spec
(docs/new-toolbox-spec-wave-6.md) but were intentionally **dropped** from
the wave-7 hotfix rebuild to honor the project's "no placeholders" rule:
every button visible in the toolbox must have a real, working handler.

The dropped entries are listed here with the reason and the threshold
that must be met before re-introducing them.

## Drop list (HF-1)

The following tool-kind entries were removed from `TOOL_DEFS`:

| Tool id          | Shortcut | Reason for deferral                                                   | Unblock threshold                                |
| ---------------- | -------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| `lasso`          | L        | No `lassoTool` implementation in `canvas-new/tools/`                  | Register a `lassoTool` (freeform polygon select) |
| `bond-wedge`     | W        | Needs stereo-up bond style wiring via `SetBondStyleCommand`           | Add a `bondTool` variant that sets `stereo: 'up'`     |
| `bond-dash`      | D        | Needs stereo-down bond style wiring                                   | Add a `bondTool` variant that sets `stereo: 'down'`   |
| `bond-aromatic`  | A        | Needs bond-order 1.5 / aromatic flag handling                         | Add a `bondTool` variant that sets `order: 1.5`       |
| `atom-picker`    | —        | Periodic-table popup component not built                              | Build a compact 4×12 popup ≤ 100 LOC             |
| `curly-arrow`    | U        | Mechanism curly-arrow tool not registered in `canvas-new`             | Register a `curlyArrowTool` + drag gesture      |

The dropped icon SVGs (`IconLasso`, `IconBondWedge`, `IconBondDash`,
`IconBondAromatic`, `IconPeriodicTable`, `IconCurlyArrow`) remain
exported from `icons.tsx` so they're trivially re-plugable when each
tool's backing implementation lands — just re-add the corresponding
entry to `TOOL_DEFS` and the `ICONS` map.

## Drop list (session-wide)

The following complex features from the wave-7 hotfix brief were
deferred entirely to a future wave rather than half-built this session:

| Feature         | Reason                                            | When to revisit                            |
| --------------- | ------------------------------------------------- | ------------------------------------------ |
| Settings panel  | > 500 LOC of document-settings UI + persistence   | Dedicated wave once spec is signed off    |
| Template library dialog | Ring data exists (`packages/scene/src/rings.ts`), but a dialog wrapper with search/preview would exceed the 100-LOC threshold | Add 4-5 individual ring buttons first (wave-7 HF-2); full library can come later |

## Tracking

Re-introduction of any dropped tool should come with:

1. A `tools/{name}Tool.ts` implementation or a clear registry adapter.
2. A unit test under `canvas-new/__tests__/`.
3. An E2E spec under `e2e/canvas-new/tools-functional/` demonstrating the
   tool's effect on the scene.
4. The `TOOL_DEFS` entry + `ICONS` map entry + (if tool-kind with a
   canvas dispatch) `CANVAS_REGISTRY_MAP` entry.
