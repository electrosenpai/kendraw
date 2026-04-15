import type { BondType, EditorSettings, EditorViewport, RingTemplate } from './types';

export interface ElementDefinition {
  atomicNumber: number;
  symbol: string;
  weight: number;
  color: string;
  commonValence: number;
}

export const DEFAULT_PAGE = {
  width: 1188,
  height: 840,
};

export const DEFAULT_VIEWPORT: EditorViewport = {
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: true,
  showRulers: true,
  showCarbonLabels: false,
  snapToGrid: false,
};

export const DEFAULT_SETTINGS: EditorSettings = {
  bondLength: 42,
  bondSpacing: 7.5,
  lineWidth: 2,
  boldWidth: 4,
  fontFamily: '"IBM Plex Sans", "Aptos", "Segoe UI", sans-serif',
  fontSize: 18,
  chainAngle: 120,
  gridSize: 18,
  fixedBondLength: true,
  atomColorMode: 'single',
  singleColor: '#111111',
};

export const ELEMENTS: Record<string, ElementDefinition> = {
  H: { atomicNumber: 1, symbol: 'H', weight: 1.008, color: '#ffffff', commonValence: 1 },
  B: { atomicNumber: 5, symbol: 'B', weight: 10.81, color: '#f5b25f', commonValence: 3 },
  C: { atomicNumber: 6, symbol: 'C', weight: 12.011, color: '#f2f4f8', commonValence: 4 },
  N: { atomicNumber: 7, symbol: 'N', weight: 14.007, color: '#63a8ff', commonValence: 3 },
  O: { atomicNumber: 8, symbol: 'O', weight: 15.999, color: '#ff7276', commonValence: 2 },
  F: { atomicNumber: 9, symbol: 'F', weight: 18.998, color: '#79d487', commonValence: 1 },
  P: { atomicNumber: 15, symbol: 'P', weight: 30.974, color: '#ffb067', commonValence: 3 },
  S: { atomicNumber: 16, symbol: 'S', weight: 32.06, color: '#ffdf5a', commonValence: 2 },
  Cl: { atomicNumber: 17, symbol: 'Cl', weight: 35.45, color: '#49d35d', commonValence: 1 },
  Br: { atomicNumber: 35, symbol: 'Br', weight: 79.904, color: '#b14b4b', commonValence: 1 },
  I: { atomicNumber: 53, symbol: 'I', weight: 126.904, color: '#a874ff', commonValence: 1 },
  Na: { atomicNumber: 11, symbol: 'Na', weight: 22.99, color: '#8fbcff', commonValence: 1 },
  Mg: { atomicNumber: 12, symbol: 'Mg', weight: 24.305, color: '#7abce3', commonValence: 2 },
  Si: { atomicNumber: 14, symbol: 'Si', weight: 28.085, color: '#d9c7b0', commonValence: 4 },
  Fe: { atomicNumber: 26, symbol: 'Fe', weight: 55.845, color: '#cb8c52', commonValence: 2 },
  Cu: { atomicNumber: 29, symbol: 'Cu', weight: 63.546, color: '#d69462', commonValence: 2 },
  Zn: { atomicNumber: 30, symbol: 'Zn', weight: 65.38, color: '#a7bfd4', commonValence: 2 },
  Pd: { atomicNumber: 46, symbol: 'Pd', weight: 106.42, color: '#d4d7e0', commonValence: 2 },
  Pt: { atomicNumber: 78, symbol: 'Pt', weight: 195.084, color: '#d5d9df', commonValence: 2 },
};

export const ATOMIC_NUMBERS = Object.fromEntries(
  Object.values(ELEMENTS).map((element) => [element.atomicNumber, element.symbol]),
);

export const BOND_ORDER_BY_TYPE: Record<BondType, number> = {
  single: 1,
  double: 2,
  triple: 3,
  quadruple: 4,
  dative: 1,
  wedge: 1,
  dash: 1,
  wavy: 1,
  bold: 1,
  aromatic: 1.5,
};

export const RING_SIZES: Record<RingTemplate, { size: number; aromatic: boolean; label: string }> =
  {
    cyclopropane: { size: 3, aromatic: false, label: 'Cyclopropane' },
    cyclobutane: { size: 4, aromatic: false, label: 'Cyclobutane' },
    cyclopentane: { size: 5, aromatic: false, label: 'Cyclopentane' },
    cyclohexane: { size: 6, aromatic: false, label: 'Cyclohexane' },
    benzene: { size: 6, aromatic: true, label: 'Benzene' },
  };

export const TOOL_GROUPS = [
  { id: 'select', label: 'Select', hotkey: 'Space' },
  { id: 'atom', label: 'Atom', hotkey: 'X' },
  { id: 'erase', label: 'Erase', hotkey: 'Delete' },
  { id: 'bond', label: 'Bond', hotkey: '1-6' },
  { id: 'chain', label: 'Chain', hotkey: 'C' },
  { id: 'ring', label: 'Ring', hotkey: 'R' },
  { id: 'text', label: 'Text', hotkey: 'T' },
  { id: 'arrow', label: 'Arrow', hotkey: 'A' },
  { id: 'pan', label: 'Pan', hotkey: 'H' },
] as const;

export const ATOM_CHOICES = ['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'] as const;

export const BOND_CHOICES: Array<{ type: BondType; label: string }> = [
  { type: 'single', label: 'Single' },
  { type: 'double', label: 'Double' },
  { type: 'triple', label: 'Triple' },
  { type: 'wedge', label: 'Wedge' },
  { type: 'dash', label: 'Dash' },
  { type: 'aromatic', label: 'Aromatic' },
];

export const RING_CHOICES: RingTemplate[] = [
  'cyclopropane',
  'cyclobutane',
  'cyclopentane',
  'cyclohexane',
  'benzene',
];

export const EXAMPLE_SMILES = [
  { label: 'Aspirin', value: 'CC(=O)Oc1ccccc1C(=O)O' },
  { label: 'Caffeine', value: 'Cn1c(=O)n(C)c2ncn(C)c2c1=O' },
  { label: 'Ibuprofen', value: 'CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O' },
  { label: 'Alanine', value: 'C[C@H](N)C(=O)O' },
];
