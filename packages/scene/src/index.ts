export type {
  AtomId,
  BondId,
  ArrowId,
  AnnotationId,
  GroupId,
  Point,
  BezierGeometry,
  ArrowAnchor,
  Atom,
  Bond,
  Arrow,
  RichTextNode,
  Annotation,
  Group,
  Viewport,
  Page,
  DocumentMetadata,
  Document,
} from './types.js';

export type {
  Command,
  AddAtomCommand,
  RemoveAtomCommand,
  MoveAtomCommand,
  SceneDiff,
} from './commands.js';

export type { SceneStore, Unsubscribe, SceneListener } from './store.js';
export { createSceneStore, createEmptyDocument } from './store.js';

export { createAtom } from './helpers.js';

export { NotImplementedError } from './errors.js';

export { SpatialIndex } from './spatial-index.js';

export type { Selection } from './selection.js';
export {
  createSelection,
  addToSelection,
  removeFromSelection,
  toggleInSelection,
  clearSelection,
  isSelected,
} from './selection.js';
