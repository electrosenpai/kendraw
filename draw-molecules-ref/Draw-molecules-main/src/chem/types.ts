export type ToolId =
  | 'select'
  | 'atom'
  | 'erase'
  | 'bond'
  | 'chain'
  | 'ring'
  | 'text'
  | 'arrow'
  | 'pan';

export type BondType =
  | 'single'
  | 'double'
  | 'triple'
  | 'quadruple'
  | 'dative'
  | 'wedge'
  | 'dash'
  | 'wavy'
  | 'bold'
  | 'aromatic';

export type RingTemplate =
  | 'cyclopropane'
  | 'cyclobutane'
  | 'cyclopentane'
  | 'cyclohexane'
  | 'benzene';

export interface Point {
  x: number;
  y: number;
}

export interface PageSize {
  width: number;
  height: number;
}

export interface AtomNode {
  id: string;
  element: string;
  x: number;
  y: number;
  charge: number;
  isotope: number | null;
  radical: 'none' | 'singlet' | 'doublet' | 'triplet';
  alias: string | null;
  hydrogens: number | null;
  stereo: 'R' | 'S' | 'none' | 'unspecified';
  mapNumber: number | null;
  color: string | null;
}

export interface BondEdge {
  id: string;
  atomIds: [string, string];
  type: BondType;
  order: number;
  display: 'normal' | 'aromatic' | 'delocalized';
  color: string | null;
}

export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export interface ArrowGraphic {
  id: string;
  from: Point;
  to: Point;
  type: 'reaction';
  color: string;
}

export interface ChemicalPage {
  atoms: AtomNode[];
  bonds: BondEdge[];
  texts: TextAnnotation[];
  arrows: ArrowGraphic[];
  size: PageSize;
  background: string;
}

export interface ChemicalDocument {
  id: string;
  name: string;
  createdAt: string;
  page: ChemicalPage;
}

export interface EditorViewport {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showRulers: boolean;
  showCarbonLabels: boolean;
  snapToGrid: boolean;
}

export interface EditorSettings {
  bondLength: number;
  bondSpacing: number;
  lineWidth: number;
  boldWidth: number;
  fontFamily: string;
  fontSize: number;
  chainAngle: number;
  gridSize: number;
  fixedBondLength: boolean;
  atomColorMode: 'cpk' | 'single';
  singleColor: string;
}

export interface EditorSnapshot {
  document: ChemicalDocument;
  selectionIds: string[];
  activeTool: ToolId;
  activeElement: string;
  activeBondType: BondType;
  activeRingTemplate: RingTemplate;
  statusText: string;
  viewport: EditorViewport;
  settings: EditorSettings;
}

export interface SnapshotCommand {
  label: string;
  apply(): EditorSnapshot;
  revert(): EditorSnapshot;
}

export interface ChemicalInsights {
  formula: string;
  averageMass: number;
  exactMass: number;
  logP: number | null;
  tpsa: number | null;
  donors: number;
  acceptors: number;
  rotatableBonds: number;
  ringCount: number;
  aromaticRingCount: number;
  stereoCenters: number;
  smiles: string;
  molfile: string;
  adducts: Array<{ label: string; mz: number }>;
  elementalAnalysis: Array<{ element: string; percent: number }>;
  degreeOfUnsaturation: number | null;
  lipinski: string;
  warnings: string[];
}

export interface NmrSignal {
  id: string;
  assignment: string;
  delta: number;
  integral: number;
  multiplicity: string;
  couplingConstants: number[];
  atomIds: string[];
  confidence: number | null;
}

export interface NmrSignalFocus {
  id: string;
  nucleus: '1H' | '13C';
  assignment: string;
  atomIds: string[];
}

export type NmrSolventId = 'CDCl3' | 'DMSO-d6' | 'CD3OD' | 'acetone-d6' | 'C6D6' | 'D2O';

export interface NmrSpectrum {
  nucleus: '1H' | '13C';
  source: 'spinus' | 'fragment' | 'heuristic';
  methodLabel: string;
  frequencyMHz: number;
  solvent: string;
  range: {
    min: number;
    max: number;
  };
  x: number[];
  y: number[];
  signals: NmrSignal[];
}

export interface NmrPredictionResult {
  status: 'idle' | 'loading' | 'ready' | 'error';
  proton: NmrSpectrum | null;
  carbon: NmrSpectrum | null;
  warnings: string[];
  error: string | null;
  updatedAt: string | null;
}

export interface HitResult {
  id: string;
  kind: 'atom' | 'bond' | 'text' | 'arrow';
}

export interface SelectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
