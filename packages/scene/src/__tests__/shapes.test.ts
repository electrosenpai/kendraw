import { describe, it, expect } from 'vitest';
import { createSceneStore } from '../index.js';
import type { Shape, ShapeId } from '../index.js';

const id = (s: string) => s as ShapeId;

function makeRect(sid = id('s1')): Shape {
  return {
    kind: 'rect',
    id: sid,
    x: 10,
    y: 20,
    w: 100,
    h: 50,
    strokeColor: '#000',
    strokeWidth: 1,
  };
}

function makeEllipse(sid = id('s2')): Shape {
  return {
    kind: 'ellipse',
    id: sid,
    x: 5,
    y: 5,
    w: 80,
    h: 40,
    strokeColor: '#000',
    strokeWidth: 1,
    fillColor: '#eef',
  };
}

describe('shape commands — wave-3 B1', () => {
  it('add-shape inserts a rect into page.shapes', () => {
    const store = createSceneStore();
    const rect = makeRect();
    store.dispatch({ type: 'add-shape', shape: rect });
    const page = store.getState().pages[0];
    expect(page?.shapes?.[rect.id]).toEqual(rect);
  });

  it('add-shape supports ellipses with fill', () => {
    const store = createSceneStore();
    const ellipse = makeEllipse();
    store.dispatch({ type: 'add-shape', shape: ellipse });
    const page = store.getState().pages[0];
    expect(page?.shapes?.[ellipse.id]?.kind).toBe('ellipse');
    expect(page?.shapes?.[ellipse.id]?.fillColor).toBe('#eef');
  });

  it('remove-shape deletes the entry', () => {
    const store = createSceneStore();
    const rect = makeRect();
    store.dispatch({ type: 'add-shape', shape: rect });
    store.dispatch({ type: 'remove-shape', id: rect.id });
    const page = store.getState().pages[0];
    expect(page?.shapes?.[rect.id]).toBeUndefined();
  });

  it('move-shape translates origin by (dx, dy) without resizing', () => {
    const store = createSceneStore();
    const rect = makeRect();
    store.dispatch({ type: 'add-shape', shape: rect });
    store.dispatch({ type: 'move-shape', id: rect.id, dx: 7, dy: -3 });
    const moved = store.getState().pages[0]?.shapes?.[rect.id];
    expect(moved?.x).toBe(17);
    expect(moved?.y).toBe(17);
    expect(moved?.w).toBe(100);
    expect(moved?.h).toBe(50);
  });

  it('resize-shape replaces geometry wholesale', () => {
    const store = createSceneStore();
    const rect = makeRect();
    store.dispatch({ type: 'add-shape', shape: rect });
    store.dispatch({ type: 'resize-shape', id: rect.id, x: 0, y: 0, w: 200, h: 80 });
    const resized = store.getState().pages[0]?.shapes?.[rect.id];
    expect(resized).toMatchObject({ x: 0, y: 0, w: 200, h: 80 });
  });

  it('undo reverts add-shape', () => {
    const store = createSceneStore();
    const rect = makeRect();
    store.dispatch({ type: 'add-shape', shape: rect });
    store.undo();
    const page = store.getState().pages[0];
    expect(page?.shapes?.[rect.id]).toBeUndefined();
  });

  it('undo reverts a move-shape translation', () => {
    const store = createSceneStore();
    const rect = makeRect();
    store.dispatch({ type: 'add-shape', shape: rect });
    store.dispatch({ type: 'move-shape', id: rect.id, dx: 100, dy: 100 });
    store.undo();
    const reverted = store.getState().pages[0]?.shapes?.[rect.id];
    expect(reverted?.x).toBe(10);
    expect(reverted?.y).toBe(20);
  });

  it('redo reapplies a remove-shape after undo', () => {
    const store = createSceneStore();
    const rect = makeRect();
    store.dispatch({ type: 'add-shape', shape: rect });
    store.dispatch({ type: 'remove-shape', id: rect.id });
    store.undo();
    store.redo();
    expect(store.getState().pages[0]?.shapes?.[rect.id]).toBeUndefined();
  });
});
