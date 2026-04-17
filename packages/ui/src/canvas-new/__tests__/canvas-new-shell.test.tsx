// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { CanvasNew } from '../CanvasNew';
import { createSceneStore } from '@kendraw/scene';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('CanvasNew shell (W4-R-01)', () => {
  it('renders the four grid-area mount points', () => {
    const store = createSceneStore();
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    expect(container.querySelector('[data-testid="canvas-new-toolbar"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="canvas-new-root"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="canvas-new-properties"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="canvas-new-status"]')).not.toBeNull();
  });

  it('labels the canvas region as a new-wave-4 shell for a11y', () => {
    const store = createSceneStore();
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-label')).toMatch(/new canvas/i);
    expect(region?.getAttribute('data-testid')).toBe('canvas-new-root');
  });

  it('does not mutate the passed store on mount', () => {
    const store = createSceneStore();
    const before = store.getState();
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    expect(store.getState()).toBe(before);
  });
});
