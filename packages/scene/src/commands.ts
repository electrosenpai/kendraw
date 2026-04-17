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
  | SetStylePresetCommand;

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
  | { type: 'state-restored' };
