// Wave-6 new toolbox — types.
//
// The toolbox exposes a richer set of tool ids than the canvas-new
// registry currently supports. Unsupported ids degrade to a disabled
// "Coming soon" state, so every planned tool has a visible button from
// day one. Mapping to the registry happens at the NewCanvasMode seam.

export type NewToolboxGroup =
  | 'pointer'
  | 'bond'
  | 'atom'
  | 'ring'
  | 'annotation'
  | 'edit'
  | 'analysis';

export type NewToolboxToolId =
  // pointer
  | 'select'
  | 'lasso'
  // bond
  | 'bond-single'
  | 'bond-double'
  | 'bond-triple'
  | 'bond-wedge'
  | 'bond-dash'
  | 'bond-aromatic'
  // atom
  | 'atom-c'
  | 'atom-h'
  | 'atom-n'
  | 'atom-o'
  | 'atom-s'
  | 'atom-picker'
  // ring
  | 'ring-benzene'
  | 'ring-cyclohexane'
  // annotation
  | 'text'
  | 'arrow'
  | 'curly-arrow'
  // edit
  | 'erase';

export type NewToolboxActionId =
  | 'undo'
  | 'redo'
  | 'nmr-toggle'
  | 'property-toggle'
  | 'paste-smiles'
  | 'search-molecule';

export type NewToolboxButtonId = NewToolboxToolId | NewToolboxActionId;

export type ToolKind = 'tool' | 'action' | 'toggle';

export interface ToolDef {
  id: NewToolboxButtonId;
  kind: ToolKind;
  group: NewToolboxGroup;
  label: string;
  tooltip: string;
  shortcut?: string;
  iconId: string;
  /** When true, button is rendered but non-functional — shows "Coming soon" tooltip. */
  comingSoon?: boolean;
}
