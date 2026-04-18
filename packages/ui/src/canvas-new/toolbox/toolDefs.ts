// Wave-6 / wave-7 new toolbox — tool definitions.
//
// Flat list in render order. `group` drives divider placement between
// consecutive different groups; each group renders as a 2-column grid.
// Every entry has a wired handler — no placeholders. See
// docs/deferred-work-toolbox-fix.md for tools dropped pending wave-7+.

import type { ToolDef } from './types';

export const TOOL_DEFS: readonly ToolDef[] = [
  // Pointer group
  { id: 'select', kind: 'tool', group: 'pointer', label: 'Sel', tooltip: 'Select / drag', shortcut: 'V', iconId: 'select' },

  // Bond group
  { id: 'bond-single', kind: 'tool', group: 'bond', label: 'Single', tooltip: 'Single bond', shortcut: '1', iconId: 'bond-single' },
  { id: 'bond-double', kind: 'tool', group: 'bond', label: 'Double', tooltip: 'Double bond', shortcut: '2', iconId: 'bond-double' },
  { id: 'bond-triple', kind: 'tool', group: 'bond', label: 'Triple', tooltip: 'Triple bond', shortcut: '3', iconId: 'bond-triple' },

  // Atom group
  { id: 'atom-c', kind: 'tool', group: 'atom', label: 'C', tooltip: 'Carbon', shortcut: 'C', iconId: 'atom-c' },
  { id: 'atom-h', kind: 'tool', group: 'atom', label: 'H', tooltip: 'Hydrogen', shortcut: 'H', iconId: 'atom-h' },
  { id: 'atom-n', kind: 'tool', group: 'atom', label: 'N', tooltip: 'Nitrogen', shortcut: 'N', iconId: 'atom-n' },
  { id: 'atom-o', kind: 'tool', group: 'atom', label: 'O', tooltip: 'Oxygen', shortcut: 'O', iconId: 'atom-o' },
  { id: 'atom-s', kind: 'tool', group: 'atom', label: 'S', tooltip: 'Sulfur', shortcut: 'S', iconId: 'atom-s' },

  // Ring group
  { id: 'ring-benzene', kind: 'tool', group: 'ring', label: 'Bz', tooltip: 'Benzene ring', shortcut: 'R', iconId: 'ring-benzene' },
  { id: 'ring-cyclohexane', kind: 'tool', group: 'ring', label: 'Cy6', tooltip: 'Cyclohexane', iconId: 'ring-cyclohexane' },

  // Annotation group
  { id: 'text', kind: 'tool', group: 'annotation', label: 'Txt', tooltip: 'Text annotation', shortcut: 'T', iconId: 'text' },
  { id: 'arrow', kind: 'tool', group: 'annotation', label: 'Arw', tooltip: 'Reaction arrow', shortcut: 'W', iconId: 'arrow' },

  // Edit group
  { id: 'erase', kind: 'tool', group: 'edit', label: 'Erase', tooltip: 'Erase', shortcut: 'E', iconId: 'erase' },
  { id: 'undo', kind: 'action', group: 'edit', label: 'Undo', tooltip: 'Undo', shortcut: 'Ctrl+Z', iconId: 'undo' },
  { id: 'redo', kind: 'action', group: 'edit', label: 'Redo', tooltip: 'Redo', shortcut: 'Ctrl+Y', iconId: 'redo' },

  // Analysis dock (pinned at bottom of rail)
  { id: 'paste-smiles', kind: 'action', group: 'analysis', label: 'SMI', tooltip: 'Paste SMILES / import', shortcut: 'Ctrl+I', iconId: 'paste-smiles' },
  { id: 'search-molecule', kind: 'action', group: 'analysis', label: 'Mol', tooltip: 'Search molecules', shortcut: 'Ctrl+L', iconId: 'search-molecule' },
  { id: 'property-toggle', kind: 'toggle', group: 'analysis', label: 'Props', tooltip: 'Toggle property panel', shortcut: 'Ctrl+J', iconId: 'property-toggle' },
  { id: 'nmr-toggle', kind: 'toggle', group: 'analysis', label: 'NMR', tooltip: 'Toggle NMR panel', shortcut: 'Ctrl+M', iconId: 'nmr-toggle' },
];

/** Tool ids the canvas-new ToolRegistry currently supports. Non-mapped
 *  tool ids degrade to 'select' at the registry seam but still drive
 *  the toolbox UI state (active highlight) and hotkey dispatch. */
export const CANVAS_REGISTRY_MAP: Record<string, 'select' | 'bond'> = {
  'select': 'select',
  'bond-single': 'bond',
  'bond-double': 'bond',
  'bond-triple': 'bond',
};
