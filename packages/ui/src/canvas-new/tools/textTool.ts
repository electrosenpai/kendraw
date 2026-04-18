// Wave-7 HF-2 — text annotation tool. One click on empty space prompts
// for label text and drops an Annotation at the click point. A richer
// inline editor + style controls are deferred to a later wave.

import { createAnnotation } from '@kendraw/scene';
import type { RichTextNode } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';

const DRAG_THRESHOLD_PX = 3;

interface DownState {
  readonly sx: number;
  readonly sy: number;
}

export interface TextToolOptions {
  /** Optional prompt() replacement — tests can inject a synchronous
   *  provider instead of relying on window.prompt. */
  promptForText?: (seed: string) => string | null;
}

export function createTextTool(opts: TextToolOptions = {}): Tool {
  let down: DownState | null = null;
  const ask = opts.promptForText ?? defaultPrompt;

  return {
    id: 'text',
    label: 'Text annotation',
    pointerdown(_ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      down = { sx: evt.screen.x, sy: evt.screen.y };
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const start = down;
      down = null;
      if (!start) return;
      const moved = Math.abs(evt.screen.x - start.sx) + Math.abs(evt.screen.y - start.sy);
      if (moved > DRAG_THRESHOLD_PX) return;
      const text = ask('');
      if (text === null) return;
      const trimmed = text.trim();
      if (trimmed.length === 0) return;
      const richText: RichTextNode[] = [{ text: trimmed }];
      const annotation = createAnnotation(evt.world.x, evt.world.y, richText);
      ctx.dispatch?.({ type: 'add-annotation', annotation });
    },
    cancel(): void {
      down = null;
    },
  };
}

function defaultPrompt(seed: string): string | null {
  if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
    return null;
  }
  return window.prompt('Label text', seed);
}
