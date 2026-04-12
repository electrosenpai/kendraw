/**
 * Metal coordination geometries and bond lengths — Section 7.3-7.4.
 */

export interface CoordinationGeometry {
  coordination: number;
  name: string;
  angles: number[]; // ideal angles
}

export const COORDINATION_GEOMETRIES: CoordinationGeometry[] = [
  { coordination: 2, name: 'linear', angles: [180] },
  { coordination: 3, name: 'trigonal planar', angles: [120] },
  { coordination: 4, name: 'tetrahedral', angles: [109.47] },
  { coordination: 4, name: 'square planar', angles: [90, 180] },
  { coordination: 5, name: 'trigonal bipyramidal', angles: [90, 120, 180] },
  { coordination: 5, name: 'square pyramidal', angles: [90, 100] },
  { coordination: 6, name: 'octahedral', angles: [90, 180] },
];

export interface MetalLigandLength {
  metal: string;
  ligand: string;
  length: [number, number]; // range (Å)
  context: string;
}

export const METAL_LIGAND_LENGTHS: MetalLigandLength[] = [
  { metal: 'Fe(II)', ligand: 'N', length: [2.0, 2.07], context: 'porphyrin/heme' },
  { metal: 'Fe(III)', ligand: 'O', length: [1.8, 2.1], context: 'oxide/hydroxide' },
  { metal: 'Zn(II)', ligand: 'N', length: [2.0, 2.15], context: 'His enzyme site' },
  { metal: 'Zn(II)', ligand: 'S', length: [2.3, 2.35], context: 'Cys zinc finger' },
  { metal: 'Zn(II)', ligand: 'O', length: [1.95, 2.1], context: 'carboxylate' },
  { metal: 'Mg(II)', ligand: 'O', length: [2.05, 2.15], context: 'hydrated ion' },
  { metal: 'Ca(II)', ligand: 'O', length: [2.3, 2.5], context: 'EF-hand' },
  { metal: 'Cu(II)', ligand: 'N', length: [1.95, 2.05], context: 'blue copper' },
  { metal: 'Cu(I)', ligand: 'S', length: [2.1, 2.25], context: 'cupredoxin' },
  { metal: 'Pt(II)', ligand: 'N', length: [2.0, 2.05], context: 'cisplatin' },
  { metal: 'Pt(II)', ligand: 'Cl', length: [2.3, 2.33], context: 'cisplatin' },
];
