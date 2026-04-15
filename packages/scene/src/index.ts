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
  NmrPeak,
  NmrMetadata,
  NmrPrediction,
} from './types.js';

export type {
  Command,
  AddAtomCommand,
  RemoveAtomCommand,
  MoveAtomCommand,
  MoveBatchCommand,
  UpdateAtomCommand,
  AddBondCommand,
  RemoveBondCommand,
  CycleBondCommand,
  AddArrowCommand,
  RemoveArrowCommand,
  AddAnnotationCommand,
  RemoveAnnotationCommand,
  UpdateAnnotationCommand,
  MoveAnnotationCommand,
  SetNmrPredictionCommand,
  SceneDiff,
} from './commands.js';

export type { SceneStore, Unsubscribe, SceneListener } from './store.js';
export { createSceneStore, createEmptyDocument } from './store.js';

export { createAtom, createBond, createAnnotation } from './helpers.js';

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

export {
  RING_TEMPLATES,
  FUSED_RING_TEMPLATES,
  generateRing,
  generateFusedRing,
  type RingTemplate,
  type FusedRingTemplate,
  type GeneratedRing,
} from './rings.js';

export { validateValence, type ValenceIssue } from './valence.js';

export { copySelection, prepareForPaste, type ClipboardData } from './clipboard.js';

export { rotateAtoms, snapAngle, mirrorAtomsH, mirrorAtomsV, computeCenter } from './transforms.js';

export { evaluateBezier, bezierBoundingBox, bezierLength, defaultCurlyGeometry } from './bezier.js';

export { floodSelectMolecule } from './flood-select.js';

export {
  STANDARD_BOND_LENGTH_PX,
  getExistingBondAngles,
  getIdealBondAngle,
  snapAngleToGrid,
  calculateBondTarget,
  getNextChainPosition,
} from './bond-geometry.js';

export {
  ACS_1996,
  NEW_DOCUMENT,
  SLIDE_POSTER,
  ALL_PRESETS,
  RING_ANGLES,
  HYBRIDIZATION_ANGLES,
  deriveQuantities,
  ptToPx,
  getBondLengthPx,
  getDoubleBondOffsetPx,
  getMarginWidthPx,
  getLineWidthPx,
  getBoldWidthPx,
  getWedgeWidePx,
  type StylePreset,
} from './style-presets.js';

export {
  isGenericLabel,
  getImplicitHydrogens,
  shouldShowLabel,
  getHydrogenSide,
  getLabelJustification,
  reverseFormulaLabel,
  buildAtomLabel,
  formulaMode,
  type LabelSegment,
  type LabelDisplayOptions,
} from './atom-display.js';
