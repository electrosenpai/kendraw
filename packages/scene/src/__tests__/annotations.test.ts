import { describe, it, expect } from 'vitest';
import { createAnnotation } from '../helpers.js';
import { formulaMode } from '../atom-display.js';
import { createSceneStore, createEmptyDocument } from '../store.js';

describe('createAnnotation', () => {
  it('creates an annotation with richText', () => {
    const ann = createAnnotation(100, 200, [{ text: 'THF, reflux', style: 'normal' }]);
    expect(ann.id).toBeDefined();
    expect(ann.x).toBe(100);
    expect(ann.y).toBe(200);
    expect(ann.richText).toEqual([{ text: 'THF, reflux', style: 'normal' }]);
  });

  it('creates an annotation with options', () => {
    const ann = createAnnotation(50, 50, [{ text: 'test' }], {
      fontSize: 18,
      bold: true,
      italic: true,
      color: '#ff0000',
    });
    expect(ann.fontSize).toBe(18);
    expect(ann.bold).toBe(true);
    expect(ann.italic).toBe(true);
    expect(ann.color).toBe('#ff0000');
  });
});

describe('formulaMode for text annotations', () => {
  it('converts NH3 to subscripted', () => {
    const segs = formulaMode('NH3');
    expect(segs).toEqual([
      { text: 'N', style: 'normal' },
      { text: 'H', style: 'normal' },
      { text: '3', style: 'subscript' },
    ]);
  });

  it('converts H2O to subscripted', () => {
    const segs = formulaMode('H2O');
    expect(segs).toEqual([
      { text: 'H', style: 'normal' },
      { text: '2', style: 'subscript' },
      { text: 'O', style: 'normal' },
    ]);
  });

  it('converts CO2H to subscripted', () => {
    const segs = formulaMode('CO2H');
    expect(segs).toEqual([
      { text: 'C', style: 'normal' },
      { text: 'O', style: 'normal' },
      { text: '2', style: 'subscript' },
      { text: 'H', style: 'normal' },
    ]);
  });

  it('leaves plain text unchanged', () => {
    const segs = formulaMode('THF');
    expect(segs).toEqual([
      { text: 'T', style: 'normal' },
      { text: 'H', style: 'normal' },
      { text: 'F', style: 'normal' },
    ]);
  });
});

describe('annotation store commands', () => {
  it('add-annotation adds to page', () => {
    const store = createSceneStore(createEmptyDocument());
    const ann = createAnnotation(100, 200, [{ text: 'test' }]);
    store.dispatch({ type: 'add-annotation', annotation: ann });
    const page = store.getState().pages[0];
    expect(page?.annotations[ann.id]).toBeDefined();
    expect(page?.annotations[ann.id]?.richText[0]?.text).toBe('test');
  });

  it('remove-annotation removes from page', () => {
    const store = createSceneStore(createEmptyDocument());
    const ann = createAnnotation(100, 200, [{ text: 'test' }]);
    store.dispatch({ type: 'add-annotation', annotation: ann });
    store.dispatch({ type: 'remove-annotation', id: ann.id });
    const page = store.getState().pages[0];
    expect(page?.annotations[ann.id]).toBeUndefined();
  });

  it('update-annotation updates richText', () => {
    const store = createSceneStore(createEmptyDocument());
    const ann = createAnnotation(100, 200, [{ text: 'old' }]);
    store.dispatch({ type: 'add-annotation', annotation: ann });
    store.dispatch({
      type: 'update-annotation',
      id: ann.id,
      changes: { richText: [{ text: 'new' }] },
    });
    const page = store.getState().pages[0];
    expect(page?.annotations[ann.id]?.richText[0]?.text).toBe('new');
  });

  it('update-annotation updates formatting', () => {
    const store = createSceneStore(createEmptyDocument());
    const ann = createAnnotation(100, 200, [{ text: 'test' }]);
    store.dispatch({ type: 'add-annotation', annotation: ann });
    store.dispatch({
      type: 'update-annotation',
      id: ann.id,
      changes: { bold: true, italic: true, fontSize: 24, color: '#ff0000' },
    });
    const page = store.getState().pages[0];
    const updated = page?.annotations[ann.id];
    expect(updated?.bold).toBe(true);
    expect(updated?.italic).toBe(true);
    expect(updated?.fontSize).toBe(24);
    expect(updated?.color).toBe('#ff0000');
  });

  it('move-annotation moves by dx/dy', () => {
    const store = createSceneStore(createEmptyDocument());
    const ann = createAnnotation(100, 200, [{ text: 'test' }]);
    store.dispatch({ type: 'add-annotation', annotation: ann });
    store.dispatch({ type: 'move-annotation', id: ann.id, dx: 50, dy: -30 });
    const page = store.getState().pages[0];
    expect(page?.annotations[ann.id]?.x).toBe(150);
    expect(page?.annotations[ann.id]?.y).toBe(170);
  });

  it('undo reverts add-annotation', () => {
    const store = createSceneStore(createEmptyDocument());
    const ann = createAnnotation(100, 200, [{ text: 'test' }]);
    store.dispatch({ type: 'add-annotation', annotation: ann });
    store.undo();
    const page = store.getState().pages[0];
    expect(page?.annotations[ann.id]).toBeUndefined();
  });
});
