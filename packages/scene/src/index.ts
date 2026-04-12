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
  UpdateAtomCommand,
  AddBondCommand,
  RemoveBondCommand,
  CycleBondCommand,
  SceneDiff,
} from './commands.js';

export type { SceneStore, Unsubscribe, SceneListener } from './store.js';
export { createSceneStore, createEmptyDocument } from './store.js';

export { createAtom, createBond } from './helpers.js';

export {
  getElement,
  getElementBySymbol,
  getSymbol,
  getColor,
  getAllElements,
  COMMON_ELEMENTS,
  type ElementData,
} from './periodic-table.js';

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

export { RING_TEMPLATES, generateRing, type RingTemplate, type GeneratedRing } from './rings.js';

export { validateValence, type ValenceIssue } from './valence.js';

export { copySelection, prepareForPaste, type ClipboardData } from './clipboard.js';

export { rotateAtoms, snapAngle, mirrorAtomsH, mirrorAtomsV, computeCenter } from './transforms.js';
