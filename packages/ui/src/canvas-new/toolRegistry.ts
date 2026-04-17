// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (editor/tool/ + name → ctor table)
// Reimplemented from scratch for Kendraw.

import type { Tool } from './types';

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();
  private activeId: string | null = null;

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  get(id: string): Tool | null {
    return this.tools.get(id) ?? null;
  }

  activate(id: string): Tool | null {
    const next = this.tools.get(id);
    if (!next) return null;
    this.activeId = id;
    return next;
  }

  getActive(): Tool | null {
    return this.activeId ? (this.tools.get(this.activeId) ?? null) : null;
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  list(): readonly Tool[] {
    return [...this.tools.values()];
  }

  size(): number {
    return this.tools.size;
  }
}

// Built-in "select" placeholder: passive tool, no-op. Replaced in W4-R-06.
export const noopSelectTool: Tool = {
  id: 'select',
  label: 'Select (placeholder)',
};
