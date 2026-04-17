import { describe, it, expect } from 'vitest';
import { GROUP_LABEL_HOTKEYS } from '../group-label-hotkeys';

describe('GROUP_LABEL_HOTKEYS', () => {
  it('maps Shift+O to methoxy on oxygen', () => {
    expect(GROUP_LABEL_HOTKEYS.O).toEqual({ element: 8, label: 'OMe' });
  });

  it('maps Shift+F to trifluoromethyl on carbon', () => {
    expect(GROUP_LABEL_HOTKEYS.F).toEqual({ element: 6, label: 'CF3' });
  });

  it('maps Shift+N to nitro on nitrogen', () => {
    expect(GROUP_LABEL_HOTKEYS.N).toEqual({ element: 7, label: 'NO2' });
  });

  it('maps Shift+Y to acetoxy on oxygen', () => {
    expect(GROUP_LABEL_HOTKEYS.Y).toEqual({ element: 8, label: 'OAc' });
  });

  it('does not clobber the bare-element hotkeys (lowercase o/f/n)', () => {
    expect(GROUP_LABEL_HOTKEYS.o).toBeUndefined();
    expect(GROUP_LABEL_HOTKEYS.f).toBeUndefined();
    expect(GROUP_LABEL_HOTKEYS.n).toBeUndefined();
    expect(GROUP_LABEL_HOTKEYS.y).toBeUndefined();
  });

  it('does not shadow existing Shift+B=Boron or Shift+C=Carbon semantics', () => {
    expect(GROUP_LABEL_HOTKEYS.B).toBeUndefined();
    expect(GROUP_LABEL_HOTKEYS.C).toBeUndefined();
  });
});
