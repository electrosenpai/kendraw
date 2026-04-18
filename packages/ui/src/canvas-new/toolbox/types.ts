// Wave-6 / wave-7 new toolbox — types.
//
// Every visible tool must have a working handler — no placeholders.
// Deferred tools (lasso, wedge/dash/aromatic, periodic picker, curly
// arrow) are tracked in docs/deferred-work-toolbox-fix.md for later
// waves once their backing components land.

export type NewToolboxGroup =
  | 'pointer'
  | 'bond'
  | 'atom'
  | 'ring'
  | 'annotation'
  | 'edit'
  | 'view'
  | 'analysis';

export type NewToolboxToolId =
  // pointer
  | 'select'
  // bond
  | 'bond-single'
  | 'bond-double'
  | 'bond-triple'
  // atom
  | 'atom-c'
  | 'atom-h'
  | 'atom-n'
  | 'atom-o'
  | 'atom-s'
  // ring
  | 'ring-benzene'
  | 'ring-cyclohexane'
  // annotation
  | 'text'
  | 'arrow'
  // edit
  | 'erase';

export type NewToolboxActionId =
  | 'undo'
  | 'redo'
  | 'fit-to-view'
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
}
