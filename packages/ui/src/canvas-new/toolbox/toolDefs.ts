// Wave-6 new toolbox — tool definitions.
//
// Single flat list of buttons in render order. `group` drives divider
// placement (separator inserted between different consecutive groups).
// Rationale and priority sourced from docs/new-toolbox-spec-wave-6.md
// (John's P0 matrix + Sally's layout).

import type { ToolDef } from './types';

/**
 * 17 P0 tools + 7 P1 stubs shown with "Coming soon" state.
 * The UI shows every planned button so discoverability is maximal
 * while actual wiring lands incrementally in wave-7.
 */
export const TOOL_DEFS: readonly ToolDef[] = [
  // Pointer group
  { id: 'select', kind: 'tool', group: 'pointer', label: 'Sel', tooltip: 'Select / drag', shortcut: 'V', iconId: 'select' },
  { id: 'lasso', kind: 'tool', group: 'pointer', label: 'Lasso', tooltip: 'Lasso selection', shortcut: 'L', iconId: 'lasso', comingSoon: true },

  // Bond group
  { id: 'bond-single', kind: 'tool', group: 'bond', label: 'Single', tooltip: 'Single bond', shortcut: '1', iconId: 'bond-single' },
  { id: 'bond-double', kind: 'tool', group: 'bond', label: 'Double', tooltip: 'Double bond', shortcut: '2', iconId: 'bond-double' },
  { id: 'bond-triple', kind: 'tool', group: 'bond', label: 'Triple', tooltip: 'Triple bond', shortcut: '3', iconId: 'bond-triple' },
  { id: 'bond-wedge', kind: 'tool', group: 'bond', label: 'Wedge', tooltip: 'Wedge bond (stereo up)', shortcut: 'W', iconId: 'bond-wedge', comingSoon: true },
  { id: 'bond-dash', kind: 'tool', group: 'bond', label: 'Dash', tooltip: 'Dashed bond (stereo down)', shortcut: 'D', iconId: 'bond-dash', comingSoon: true },
  { id: 'bond-aromatic', kind: 'tool', group: 'bond', label: 'Arom', tooltip: 'Aromatic bond', shortcut: 'A', iconId: 'bond-aromatic', comingSoon: true },

  // Atom group
  { id: 'atom-c', kind: 'tool', group: 'atom', label: 'C', tooltip: 'Carbon', shortcut: 'C', iconId: 'atom-c' },
  { id: 'atom-h', kind: 'tool', group: 'atom', label: 'H', tooltip: 'Hydrogen', shortcut: 'H', iconId: 'atom-h' },
  { id: 'atom-n', kind: 'tool', group: 'atom', label: 'N', tooltip: 'Nitrogen', shortcut: 'N', iconId: 'atom-n' },
  { id: 'atom-o', kind: 'tool', group: 'atom', label: 'O', tooltip: 'Oxygen', shortcut: 'O', iconId: 'atom-o' },
  { id: 'atom-s', kind: 'tool', group: 'atom', label: 'S', tooltip: 'Sulfur', shortcut: 'S', iconId: 'atom-s' },
  { id: 'atom-picker', kind: 'tool', group: 'atom', label: 'Elt', tooltip: 'Periodic table', iconId: 'atom-picker', comingSoon: true },

  // Ring group
  { id: 'ring-benzene', kind: 'tool', group: 'ring', label: 'Bz', tooltip: 'Benzene ring', shortcut: 'R', iconId: 'ring-benzene' },
  { id: 'ring-cyclohexane', kind: 'tool', group: 'ring', label: 'Cy6', tooltip: 'Cyclohexane', iconId: 'ring-cyclohexane' },

  // Annotation group
  { id: 'text', kind: 'tool', group: 'annotation', label: 'Txt', tooltip: 'Text annotation', shortcut: 'T', iconId: 'text' },
  { id: 'arrow', kind: 'tool', group: 'annotation', label: 'Arw', tooltip: 'Reaction arrow', shortcut: 'W', iconId: 'arrow' },
  { id: 'curly-arrow', kind: 'tool', group: 'annotation', label: 'Curly', tooltip: 'Mechanism curly arrow', shortcut: 'U', iconId: 'curly-arrow', comingSoon: true },

  // Edit group
  { id: 'erase', kind: 'tool', group: 'edit', label: 'Erase', tooltip: 'Erase', shortcut: 'E', iconId: 'erase' },
  { id: 'undo', kind: 'action', group: 'edit', label: 'Undo', tooltip: 'Undo', shortcut: 'Ctrl+Z', iconId: 'undo' },
  { id: 'redo', kind: 'action', group: 'edit', label: 'Redo', tooltip: 'Redo', shortcut: 'Ctrl+Y', iconId: 'redo' },

  // Analysis dock (anchored at bottom of rail)
  { id: 'paste-smiles', kind: 'action', group: 'analysis', label: 'SMI', tooltip: 'Paste SMILES / import', shortcut: 'Ctrl+I', iconId: 'paste-smiles' },
  { id: 'search-molecule', kind: 'action', group: 'analysis', label: 'Mol', tooltip: 'Search molecules', shortcut: 'Ctrl+L', iconId: 'search-molecule' },
  { id: 'property-toggle', kind: 'toggle', group: 'analysis', label: 'Props', tooltip: 'Toggle property panel', shortcut: 'Ctrl+J', iconId: 'property-toggle' },
  { id: 'nmr-toggle', kind: 'toggle', group: 'analysis', label: 'NMR', tooltip: 'Toggle NMR panel', shortcut: 'Ctrl+M', iconId: 'nmr-toggle' },
];

/**
 * The subset of tool ids that the canvas-new ToolRegistry actually supports.
 * Any tool-kind button with an id NOT in this map maps to a no-op (select)
 * on the registry and shows its own highlighted state in the UI only.
 */
export const CANVAS_REGISTRY_MAP: Record<string, 'select' | 'bond'> = {
  'select': 'select',
  'lasso': 'select',
  'bond-single': 'bond',
  'bond-double': 'bond',
  'bond-triple': 'bond',
  'bond-wedge': 'bond',
  'bond-dash': 'bond',
  'bond-aromatic': 'bond',
};
