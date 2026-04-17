import { describe, it, expect } from 'vitest';
import { createSceneStore } from '../index.js';
import type { Arrow, ArrowId, Annotation, AnnotationId } from '../types.js';

function makeArrow(overrides?: Partial<Arrow>): Arrow {
  return {
    id: (overrides?.id ?? crypto.randomUUID()) as ArrowId,
    type: overrides?.type ?? 'forward',
    geometry: overrides?.geometry ?? {
      start: { x: 0, y: 0 },
      c1: { x: 30, y: -20 },
      c2: { x: 70, y: -20 },
      end: { x: 100, y: 0 },
    },
    startAnchor: { kind: 'free' },
    endAnchor: { kind: 'free' },
  };
}

function makeAnnotation(overrides?: Partial<Annotation>): Annotation {
  return {
    id: (overrides?.id ?? crypto.randomUUID()) as AnnotationId,
    x: overrides?.x ?? 50,
    y: overrides?.y ?? -30,
    richText: overrides?.richText ?? [{ text: 'hv', style: 'normal' }],
  };
}

describe('Arrow commands', () => {
  it('adds an arrow', () => {
    const store = createSceneStore();
    const arrow = makeArrow();
    store.dispatch({ type: 'add-arrow', arrow });
    const page = store.getState().pages[0];
    expect(page?.arrows[arrow.id]).toEqual(arrow);
  });

  it('removes an arrow', () => {
    const store = createSceneStore();
    const arrow = makeArrow();
    store.dispatch({ type: 'add-arrow', arrow });
    store.dispatch({ type: 'remove-arrow', id: arrow.id });
    const page = store.getState().pages[0];
    expect(page?.arrows[arrow.id]).toBeUndefined();
  });

  it('adds an annotation', () => {
    const store = createSceneStore();
    const ann = makeAnnotation();
    store.dispatch({ type: 'add-annotation', annotation: ann });
    const page = store.getState().pages[0];
    expect(page?.annotations[ann.id]).toEqual(ann);
  });

  it('removes an annotation', () => {
    const store = createSceneStore();
    const ann = makeAnnotation();
    store.dispatch({ type: 'add-annotation', annotation: ann });
    store.dispatch({ type: 'remove-annotation', id: ann.id });
    const page = store.getState().pages[0];
    expect(page?.annotations[ann.id]).toBeUndefined();
  });

  it('undo reverses add-arrow', () => {
    const store = createSceneStore();
    const arrow = makeArrow();
    store.dispatch({ type: 'add-arrow', arrow });
    store.undo();
    const page = store.getState().pages[0];
    expect(page?.arrows[arrow.id]).toBeUndefined();
  });

  it('accepts retro arrow type (retrosynthesis)', () => {
    const store = createSceneStore();
    const arrow = makeArrow({ type: 'retro' });
    store.dispatch({ type: 'add-arrow', arrow });
    const page = store.getState().pages[0];
    expect(page?.arrows[arrow.id]?.type).toBe('retro');
  });
});
