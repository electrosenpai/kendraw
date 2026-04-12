// Data
export {
  ALL_BOND_LENGTHS,
  CC_BONDS,
  CH_BONDS,
  CO_BONDS,
  CN_BONDS,
  HETERO_BONDS,
  getDefaultBondLength,
  type BondLengthEntry,
} from './data/bond-lengths.js';

export {
  ALL_ANGLES,
  SP3_ANGLES,
  SP2_ANGLES,
  SP_ANGLES,
  HETERO_RING_ANGLES,
  getDefaultAngle,
  type AngleEntry,
} from './data/valence-angles.js';

export { ALL_TORSIONS, type TorsionEntry } from './data/torsion-angles.js';

export { PLANARITY_CONSTRAINTS, type PlanarityEntry } from './data/planarity.js';

export { VDW_RADII, getVdwRadius, getMinNonbondedDist, MIN_NONBONDED } from './data/vdw-radii.js';

export { HBOND_GEOMETRY, NON_COVALENT, type HBondEntry } from './data/hydrogen-bonds.js';

export {
  COORDINATION_GEOMETRIES,
  METAL_LIGAND_LENGTHS,
  type CoordinationGeometry,
  type MetalLigandLength,
} from './data/metal-coordination.js';

// Engine
export { detectHybridization, bondOrderSum, type Hybridization } from './engine/hybridization.js';

export {
  validateGeometry,
  cleanup,
  getIdealBondLengthPx,
  type Violation,
  type CleanupResult,
} from './engine/constraint-engine.js';
