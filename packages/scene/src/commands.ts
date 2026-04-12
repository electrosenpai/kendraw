import type {
  Atom,
  AtomId,
  Bond,
  BondId,
  Arrow,
  ArrowId,
  Annotation,
  AnnotationId,
} from './types.js';

export type AddAtomCommand = { type: 'add-atom'; atom: Atom };
export type RemoveAtomCommand = { type: 'remove-atom'; id: AtomId };
export type MoveAtomCommand = { type: 'move-atom'; id: AtomId; dx: number; dy: number };
export type UpdateAtomCommand = {
  type: 'update-atom';
  id: AtomId;
  changes: Partial<Pick<Atom, 'element' | 'charge' | 'label' | 'radicalCount' | 'lonePairs'>>;
};

export type AddBondCommand = { type: 'add-bond'; bond: Bond };
export type RemoveBondCommand = { type: 'remove-bond'; id: BondId };
export type CycleBondCommand = { type: 'cycle-bond'; id: BondId };

export type AddArrowCommand = { type: 'add-arrow'; arrow: Arrow };
export type RemoveArrowCommand = { type: 'remove-arrow'; id: ArrowId };

export type AddAnnotationCommand = { type: 'add-annotation'; annotation: Annotation };
export type RemoveAnnotationCommand = { type: 'remove-annotation'; id: AnnotationId };

export type Command =
  | AddAtomCommand
  | RemoveAtomCommand
  | MoveAtomCommand
  | UpdateAtomCommand
  | AddBondCommand
  | RemoveBondCommand
  | CycleBondCommand
  | AddArrowCommand
  | RemoveArrowCommand
  | AddAnnotationCommand
  | RemoveAnnotationCommand;

export type SceneDiff =
  | { type: 'atom-added'; id: AtomId }
  | { type: 'atom-removed'; id: AtomId }
  | { type: 'atom-moved'; id: AtomId }
  | { type: 'atom-updated'; id: AtomId }
  | { type: 'bond-added'; id: BondId }
  | { type: 'bond-removed'; id: BondId }
  | { type: 'bond-cycled'; id: BondId }
  | { type: 'arrow-added'; id: ArrowId }
  | { type: 'arrow-removed'; id: ArrowId }
  | { type: 'annotation-added'; id: AnnotationId }
  | { type: 'annotation-removed'; id: AnnotationId }
  | { type: 'state-restored' };
