// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (Editor.ts event pipeline)
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-02 — wires DOM pointer + keyboard events to the active tool's
// lifecycle. Kept intentionally tiny: resolve active tool, build payload,
// dispatch. No business logic here.

import { useEffect, useRef } from 'react';
import type { Tool, ToolContext, ToolEventPayload } from './types';
import { makeModifiers } from './types';
import type { ToolRegistry } from './toolRegistry';

export interface DispatcherDeps {
  readonly target: HTMLElement | null;
  readonly registry: ToolRegistry;
  readonly context: ToolContext;
}

export function useToolDispatcher({ target, registry, context }: DispatcherDeps): void {
  const ctxRef = useRef(context);
  ctxRef.current = context;

  useEffect(() => {
    if (!target) return;

    const buildPayload = <E extends PointerEvent | KeyboardEvent>(
      e: E,
    ): ToolEventPayload<E> => {
      if (e instanceof KeyboardEvent) {
        const last = { x: 0, y: 0 };
        return {
          screen: last,
          world: ctxRef.current.worldFromScreen(last.x, last.y),
          modifiers: makeModifiers(e),
          event: e,
        };
      }
      const pe = e as PointerEvent;
      const rect = (target.getBoundingClientRect === undefined
        ? { left: 0, top: 0 }
        : target.getBoundingClientRect());
      const screenX = pe.clientX - rect.left;
      const screenY = pe.clientY - rect.top;
      return {
        screen: { x: screenX, y: screenY },
        world: ctxRef.current.worldFromScreen(screenX, screenY),
        modifiers: makeModifiers(pe),
        event: e,
      };
    };

    const onPointerDown = (e: PointerEvent): void => {
      const tool = registry.getActive();
      tool?.pointerdown?.(ctxRef.current, buildPayload(e));
    };
    const onPointerMove = (e: PointerEvent): void => {
      const tool = registry.getActive();
      tool?.pointermove?.(ctxRef.current, buildPayload(e));
    };
    const onPointerUp = (e: PointerEvent): void => {
      const tool = registry.getActive();
      tool?.pointerup?.(ctxRef.current, buildPayload(e));
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      const tool = registry.getActive();
      if (e.key === 'Escape') {
        tool?.cancel?.(ctxRef.current);
        return;
      }
      tool?.keydown?.(ctxRef.current, buildPayload(e));
    };

    target.addEventListener('pointerdown', onPointerDown);
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [target, registry]);
}

export function dispatchPointer(
  tool: Tool | null,
  ctx: ToolContext,
  phase: 'pointerdown' | 'pointermove' | 'pointerup',
  payload: ToolEventPayload<PointerEvent>,
): void {
  tool?.[phase]?.(ctx, payload);
}
