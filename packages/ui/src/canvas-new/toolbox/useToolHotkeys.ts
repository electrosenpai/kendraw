// Wave-6 tool hotkey wiring. Binds single-key ChemDraw-style shortcuts
// (V, 1/2/3, C/H/N/O/S, T, E, W, R…) to onToolChange, gated by
// isEditingTextNow() so focused text inputs keep their keystrokes.
//
// Designed to run only while the wave-6 toolbox is mounted — the caller
// (NewCanvasMode) hangs this hook behind FEATURE_FLAGS.newCanvas, so
// flag=false mode keeps the legacy Canvas hotkeys untouched.

import { useEffect, useMemo } from 'react';
import { isEditingTextNow } from '../../hooks/useIsEditingText';
import { TOOL_DEFS } from './toolDefs';
import type { NewToolboxActionId, NewToolboxToolId } from './types';

export interface ToolHotkeyMap {
  readonly [normalizedKey: string]: NewToolboxToolId;
}

export interface ActionHotkeyMap {
  readonly [normalizedKey: string]: NewToolboxActionId;
}

/** Build a case-insensitive map of single-key shortcut -> tool id. Skips
 *  multi-modifier shortcuts (Ctrl+*, Shift+*) and non-tool kinds. First
 *  registration wins so earlier TOOL_DEFS entries take precedence on
 *  collisions. */
export function buildToolHotkeyMap(): ToolHotkeyMap {
  const map: Record<string, NewToolboxToolId> = {};
  for (const def of TOOL_DEFS) {
    if (def.kind !== 'tool') continue;
    const raw = def.shortcut;
    if (!raw) continue;
    if (raw.length !== 1) continue;
    const key = raw.toUpperCase();
    if (key in map) continue;
    map[key] = def.id as NewToolboxToolId;
  }
  return map;
}

/** Single-key shortcut -> action id. Only picks up action/toggle kinds
 *  with a single-letter shortcut (e.g. 'F' for fit-to-view). Skips
 *  Ctrl+* / Shift+* combos — those stay bound to the global app
 *  shortcut handler. */
export function buildActionHotkeyMap(): ActionHotkeyMap {
  const map: Record<string, NewToolboxActionId> = {};
  for (const def of TOOL_DEFS) {
    if (def.kind === 'tool') continue;
    const raw = def.shortcut;
    if (!raw) continue;
    if (raw.length !== 1) continue;
    const key = raw.toUpperCase();
    if (key in map) continue;
    map[key] = def.id as NewToolboxActionId;
  }
  return map;
}

export interface UseToolHotkeysOptions {
  /** When false the listener is not installed — lets the caller
   *  short-circuit without conditional hook calls. */
  enabled?: boolean;
  /** Dispatched for action/toggle buttons whose shortcut is a single
   *  letter (e.g. F → 'fit-to-view'). */
  onAction?: (id: NewToolboxActionId) => void;
}

/** Install a window keydown listener that dispatches onToolChange when
 *  the pressed key maps to a tool shortcut. Ignores events while a text
 *  input is focused and while any modifier (Ctrl/Meta/Alt) is held, so
 *  it never shadows the existing Ctrl+* app shortcuts. */
export function useToolHotkeys(
  onToolChange: (id: NewToolboxToolId) => void,
  opts: UseToolHotkeysOptions = {},
): void {
  const { enabled = true, onAction } = opts;
  const toolMap = useMemo(() => buildToolHotkeyMap(), []);
  const actionMap = useMemo(() => buildActionHotkeyMap(), []);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent): void => {
      if (e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditingTextNow()) return;
      if (e.key.length !== 1) return;
      const lookup = e.key.toUpperCase();
      const toolId = toolMap[lookup];
      if (toolId) {
        e.preventDefault();
        onToolChange(toolId);
        return;
      }
      const actionId = actionMap[lookup];
      if (actionId && onAction) {
        e.preventDefault();
        onAction(actionId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, toolMap, actionMap, onToolChange, onAction]);
}
