// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect } from 'vitest';
import { ToolRegistry, noopSelectTool } from '../toolRegistry';
import type { Tool } from '../types';

describe('ToolRegistry (W4-R-02)', () => {
  it('registers tools and exposes them by id', () => {
    const r = new ToolRegistry();
    r.register(noopSelectTool);
    expect(r.size()).toBe(1);
    expect(r.get('select')?.id).toBe('select');
    expect(r.get('nope')).toBeNull();
  });

  it('activate sets the active tool and returns it', () => {
    const r = new ToolRegistry();
    r.register(noopSelectTool);
    expect(r.getActiveId()).toBeNull();
    const t = r.activate('select');
    expect(t?.id).toBe('select');
    expect(r.getActiveId()).toBe('select');
    expect(r.getActive()?.id).toBe('select');
  });

  it('activate returns null when the tool is unknown and does not mutate state', () => {
    const r = new ToolRegistry();
    r.register(noopSelectTool);
    r.activate('select');
    const result = r.activate('ghost');
    expect(result).toBeNull();
    expect(r.getActiveId()).toBe('select');
  });

  it('list returns every registered tool', () => {
    const a: Tool = { id: 'a' };
    const b: Tool = { id: 'b' };
    const r = new ToolRegistry();
    r.register(a);
    r.register(b);
    const ids = r.list().map((t) => t.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('re-registering the same id overwrites the previous entry', () => {
    const r = new ToolRegistry();
    r.register({ id: 'x', label: 'old' });
    r.register({ id: 'x', label: 'new' });
    expect(r.size()).toBe(1);
    expect(r.get('x')?.label).toBe('new');
  });
});
