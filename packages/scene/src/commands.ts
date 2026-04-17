import type {
  Atom,
  AtomId,
  Bond,
  BondId,
  Arrow,
  ArrowId,
  Annotation,
  AnnotationId,
  NmrPrediction,
  Shape,
  ShapeId,
} from './types.js';
import type { StylePreset } from './style-presets.js';

export type AddAtomCommand = { type: 'add-atom'; atom: Atom };
export type RemoveAtomCommand = { type: 'remove-atom'; id: AtomId };
export type MoveAtomCommand = { type: 'move-atom'; id: AtomId; dx: number; dy: number };
export type MoveBatchCommand = { type: 'move-batch'; ids: AtomId[]; dx: number; dy: number };
export type UpdateAtomCommand = {
  type: 'update-atom';
  id: AtomId;
  changes: Partial<Pick<Atom, 'element' | 'charge' | 'label' | 'radicalCount' | 'lonePairs'>>;
};

export type AddBondCommand = { type: 'add-bond'; bond: Bond };
export type RemoveBondCommand = { type: 'remove-bond'; id: BondId };
export type CycleBondCommand = { type: 'cycle-bond'; id: BondId };
export type SetBondStyleCommand = {
  type: 'set-bond-style';
  id: BondId;
  style: Bond['style'];
  order: Bond['order'];
};

export type AddArrowCommand = { type: 'add-arrow'; arrow: Arrow };
export type RemoveArrowCommand = { type: 'remove-arrow'; id: ArrowId };

export type AddAnnotationCommand = { type: 'add-annotation'; annotation: Annotation };
export type RemoveAnnotationCommand = { type: 'remove-annotation'; id: AnnotationId };
export type UpdateAnnotationCommand = {
  type: 'update-annotation';
  id: AnnotationId;
  changes: Partial<Pick<Annotation, 'richText' | 'fontSize' | 'bold' | 'italic' | 'color'>>;
};
export type MoveAnnotationCommand = {
  type: 'move-annotation';
  id: AnnotationId;
  dx: number;
  dy: number;
};

export type SetNmrPredictionCommand = {
  type: 'set-nmr-prediction';
  prediction: NmrPrediction | undefined;
};

export type SetStylePresetCommand = {
  type: 'set-style-preset';
  preset: StylePreset;
};

export type ToggleCompoundNumberingCommand = {
  type: 'toggle-compound-numbering';
};

export type RepackCompoundNumbersCommand = {
  type: 'repack-compound-numbers';
};

export type AddShapeCommand = { type: 'add-shape'; shape: Shape };
export type RemoveShapeCommand = { type: 'remove-shape'; id: ShapeId };

/** Wave-5 W4-R-11: atomic deletion of a selection.
 *
 *  Removes the listed atoms (cascading every bond incident on them) plus any
 *  bonds in `bondIds` not already covered by the cascade. The whole operation
 *  appears as a single entry in the undo stack so a single Ctrl+Z restores
 *  the selection. */
export type RemoveBatchCommand = {
  type: 'remove-batch';
  atomIds: AtomId[];
  bondIds: BondId[];
};
export type MoveShapeCommand = { type: 'move-shape'; id: ShapeId; dx: number; dy: number };
export type ResizeShapeCommand = {
  type: 'resize-shape';
  id: ShapeId;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Wave-2 B1: align selected atoms along one axis.
 *  - left/center-x/right snap x-coordinates to the selection's bbox
 *  - top/center-y/bottom snap y-coordinates to the selection's bbox
 */
export type AlignAtomsCommand = {
  type: 'align-atoms';
  ids: AtomId[];
  axis: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';
};

export type Command =
  | AddAtomCommand
  | RemoveAtomCommand
  | MoveAtomCommand
  | MoveBatchCommand
  | UpdateAtomCommand
  | AddBondCommand
  | RemoveBondCommand
  | CycleBondCommand
  | SetBondStyleCommand
  | AddArrowCommand
  | RemoveArrowCommand
  | AddAnnotationCommand
  | RemoveAnnotationCommand
  | UpdateAnnotationCommand
  | MoveAnnotationCommand
  | SetNmrPredictionCommand
  | SetStylePresetCommand
  | ToggleCompoundNumberingCommand
  | RepackCompoundNumbersCommand
  | AlignAtomsCommand
  | AddShapeCommand
  | RemoveShapeCommand
  | MoveShapeCommand
  | ResizeShapeCommand
  | RemoveBatchCommand;

export type SceneDiff =
  | { type: 'atom-added'; id: AtomId }
  | { type: 'atom-removed'; id: AtomId }
  | { type: 'atom-moved'; id: AtomId }
  | { type: 'batch-moved' }
  | { type: 'atom-updated'; id: AtomId }
  | { type: 'bond-added'; id: BondId }
  | { type: 'bond-removed'; id: BondId }
  | { type: 'bond-cycled'; id: BondId }
  | { type: 'bond-style-set'; id: BondId }
  | { type: 'arrow-added'; id: ArrowId }
  | { type: 'arrow-removed'; id: ArrowId }
  | { type: 'annotation-added'; id: AnnotationId }
  | { type: 'annotation-removed'; id: AnnotationId }
  | { type: 'annotation-updated'; id: AnnotationId }
  | { type: 'annotation-moved'; id: AnnotationId }
  | { type: 'nmr-prediction-set' }
  | { type: 'style-preset-set' }
  | { type: 'compound-numbering-toggled' }
  | { type: 'compound-numbers-repacked' }
  | { type: 'compound-numbers-reconciled' }
  | { type: 'atoms-aligned' }
  | { type: 'shape-added'; id: ShapeId }
  | { type: 'shape-removed'; id: ShapeId }
  | { type: 'shape-moved'; id: ShapeId }
  | { type: 'shape-resized'; id: ShapeId }
  | { type: 'batch-removed' }
  | { type: 'state-restored' };
