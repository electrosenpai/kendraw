// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (tool abstraction, editor/tool/*.ts)
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-02 — tool abstraction. A Tool is a plain object (not a class)
// that declares optional lifecycle handlers invoked by the canvas dispatcher.
// Tools are swapped by id via the registry, and can call back into the
// ToolContext to read/write the scene store or query hotspots.

import type { AtomId, BondId, Command, Page, Point, SceneStore } from '@kendraw/scene';
import type { HoverPreview } from './bondPreview';

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

export interface SelectionRect {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface ToolContext {
  readonly store: SceneStore;
  worldFromScreen(screenX: number, screenY: number): Point;
  hitTestAtom(world: Point): AtomId | null;
  hitTestBond(world: Point): BondId | null;
  searchAtomsInRect(p1: Point, p2: Point): readonly AtomId[];
  setSelectedAtoms(ids: ReadonlySet<AtomId>): void;
  /** Read back the most recently published selection. Returns an empty set
   *  if nothing is selected. */
  getSelectedAtoms?(): ReadonlySet<AtomId>;
  setSelectionRect(rect: SelectionRect | null): void;
  requestRepaint(): void;
  /** Optional: publish a hover preview to be drawn by the canvas overlay.
   *  Tools that don't use the overlay can ignore it. */
  setHoverPreview?(preview: HoverPreview | null): void;
  /** Convenience accessors used by the interactive tools. Optional so older
   *  tools (W4-R-06 marquee select) compile against the original interface. */
  getActivePage?(): Page | null;
  dispatch?(command: Command): void;
  /** Transient drag overlay for atoms — the canvas paints the listed atoms
   *  (and their incident bonds) at the displaced position without mutating
   *  the store. Used by W4-R-07 drag-move. */
  setDragOffset?(offset: DragOffset | null): void;
  /** Viewport (zoom + pan) accessors used by W4-R-12. */
  getViewport?(): { zoom: number; panX: number; panY: number };
  setViewport?(view: { zoom: number; panX: number; panY: number }): void;
}

export interface DragOffset {
  readonly atomIds: ReadonlySet<AtomId>;
  readonly dx: number;
  readonly dy: number;
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
