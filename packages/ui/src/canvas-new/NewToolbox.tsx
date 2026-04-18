// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
//
// Wave-6 — re-export facade. Real implementation lives in ./toolbox/.
// The facade exists so external callers (App.tsx) don't need to change
// import paths when the internal file layout evolves.

export { NewToolbox } from './toolbox/NewToolbox';
export type { NewToolboxProps } from './toolbox/NewToolbox';
export type {
  NewToolboxToolId,
  NewToolboxActionId,
  NewToolboxButtonId,
  NewToolboxGroup,
  ToolDef,
  ToolKind,
} from './toolbox/types';
export { TOOL_DEFS, CANVAS_REGISTRY_MAP } from './toolbox/toolDefs';
export { useToolHotkeys, buildToolHotkeyMap } from './toolbox/useToolHotkeys';
export type { ToolHotkeyMap, UseToolHotkeysOptions } from './toolbox/useToolHotkeys';
