// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (tool abstraction, editor/tool/*.ts)
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-02 — tool abstraction. A Tool is a plain object (not a class)
// that declares optional lifecycle handlers invoked by the canvas dispatcher.
// Tools are swapped by id via the registry, and can call back into the
// ToolContext to read/write the scene store or query hotspots.

import type { AtomId, BondId, Point, SceneStore } from '@kendraw/scene';

export interface ToolModifiers {
  readonly shift: boolean;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
}

export interface ToolEventPayload<E = Event> {
  readonly screen: Point;
  readonly world: Point;
  readonly modifiers: ToolModifiers;
  readonly event: E;
}

export interface ToolContext {
  readonly store: SceneStore;
  worldFromScreen(screenX: number, screenY: number): Point;
  hitTestAtom(world: Point): AtomId | null;
  hitTestBond(world: Point): BondId | null;
  requestRepaint(): void;
}

export interface Tool {
  readonly id: string;
  readonly label?: string;
  pointerdown?(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void;
  pointermove?(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void;
  pointerup?(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void;
  keydown?(ctx: ToolContext, evt: ToolEventPayload<KeyboardEvent>): void;
  cancel?(ctx: ToolContext): void;
  activate?(ctx: ToolContext): void;
  deactivate?(ctx: ToolContext): void;
}

export function makeModifiers(e: PointerEvent | KeyboardEvent | MouseEvent): ToolModifiers {
  return {
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey,
  };
}
