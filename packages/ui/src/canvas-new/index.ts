// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.

export { CanvasNew, default } from './CanvasNew';
export type { CanvasNewProps, CanvasNewToolId } from './CanvasNew';
export {
  NewToolbox,
  TOOL_DEFS,
  CANVAS_REGISTRY_MAP,
  useToolHotkeys,
  buildToolHotkeyMap,
} from './NewToolbox';
export type {
  NewToolboxProps,
  NewToolboxToolId,
  NewToolboxActionId,
  NewToolboxButtonId,
  NewToolboxGroup,
  ToolDef,
  ToolKind,
} from './NewToolbox';
