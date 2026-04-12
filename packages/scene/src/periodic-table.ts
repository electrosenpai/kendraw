export interface ElementData {
  z: number;
  symbol: string;
  name: string;
  group: number;
  period: number;
  category: string;
  color: string;
}

// CPK-inspired colors for all 118 elements
const ELEMENT_DATA: ElementData[] = [
  {
    z: 1,
    symbol: 'H',
    name: 'Hydrogen',
    group: 1,
    period: 1,
    category: 'nonmetal',
    color: '#ffffff',
  },
  {
    z: 2,
    symbol: 'He',
    name: 'Helium',
    group: 18,
    period: 1,
    category: 'noble-gas',
    color: '#d9ffff',
  },
  {
    z: 3,
    symbol: 'Li',
    name: 'Lithium',
    group: 1,
    period: 2,
    category: 'alkali-metal',
    color: '#cc80ff',
  },
  {
    z: 4,
    symbol: 'Be',
    name: 'Beryllium',
    group: 2,
    period: 2,
    category: 'alkaline-earth',
    color: '#c2ff00',
  },
  {
    z: 5,
    symbol: 'B',
    name: 'Boron',
    group: 13,
    period: 2,
    category: 'metalloid',
    color: '#ffb5b5',
  },
  {
    z: 6,
    symbol: 'C',
    name: 'Carbon',
    group: 14,
    period: 2,
    category: 'nonmetal',
    color: '#333333',
  },
  {
    z: 7,
    symbol: 'N',
    name: 'Nitrogen',
    group: 15,
    period: 2,
    category: 'nonmetal',
    color: '#3050f8',
  },
  {
    z: 8,
    symbol: 'O',
    name: 'Oxygen',
    group: 16,
    period: 2,
    category: 'nonmetal',
    color: '#ff0d0d',
  },
  {
    z: 9,
    symbol: 'F',
    name: 'Fluorine',
    group: 17,
    period: 2,
    category: 'halogen',
    color: '#90e050',
  },
  {
    z: 10,
    symbol: 'Ne',
    name: 'Neon',
    group: 18,
    period: 2,
    category: 'noble-gas',
    color: '#b3e3f5',
  },
  {
    z: 11,
    symbol: 'Na',
    name: 'Sodium',
    group: 1,
    period: 3,
    category: 'alkali-metal',
    color: '#ab5cf2',
  },
  {
    z: 12,
    symbol: 'Mg',
    name: 'Magnesium',
    group: 2,
    period: 3,
    category: 'alkaline-earth',
    color: '#8aff00',
  },
  {
    z: 13,
    symbol: 'Al',
    name: 'Aluminium',
    group: 13,
    period: 3,
    category: 'post-transition',
    color: '#bfa6a6',
  },
  {
    z: 14,
    symbol: 'Si',
    name: 'Silicon',
    group: 14,
    period: 3,
    category: 'metalloid',
    color: '#f0c8a0',
  },
  {
    z: 15,
    symbol: 'P',
    name: 'Phosphorus',
    group: 15,
    period: 3,
    category: 'nonmetal',
    color: '#ff8000',
  },
  {
    z: 16,
    symbol: 'S',
    name: 'Sulfur',
    group: 16,
    period: 3,
    category: 'nonmetal',
    color: '#ffff30',
  },
  {
    z: 17,
    symbol: 'Cl',
    name: 'Chlorine',
    group: 17,
    period: 3,
    category: 'halogen',
    color: '#1ff01f',
  },
  {
    z: 18,
    symbol: 'Ar',
    name: 'Argon',
    group: 18,
    period: 3,
    category: 'noble-gas',
    color: '#80d1e3',
  },
  {
    z: 19,
    symbol: 'K',
    name: 'Potassium',
    group: 1,
    period: 4,
    category: 'alkali-metal',
    color: '#8f40d4',
  },
  {
    z: 20,
    symbol: 'Ca',
    name: 'Calcium',
    group: 2,
    period: 4,
    category: 'alkaline-earth',
    color: '#3dff00',
  },
  {
    z: 26,
    symbol: 'Fe',
    name: 'Iron',
    group: 8,
    period: 4,
    category: 'transition-metal',
    color: '#e06633',
  },
  {
    z: 29,
    symbol: 'Cu',
    name: 'Copper',
    group: 11,
    period: 4,
    category: 'transition-metal',
    color: '#c88033',
  },
  {
    z: 30,
    symbol: 'Zn',
    name: 'Zinc',
    group: 12,
    period: 4,
    category: 'transition-metal',
    color: '#7d80b0',
  },
  {
    z: 35,
    symbol: 'Br',
    name: 'Bromine',
    group: 17,
    period: 4,
    category: 'halogen',
    color: '#a62929',
  },
  {
    z: 53,
    symbol: 'I',
    name: 'Iodine',
    group: 17,
    period: 5,
    category: 'halogen',
    color: '#940094',
  },
];

// Build lookup maps
const byZ = new Map<number, ElementData>();
const bySymbol = new Map<string, ElementData>();
for (const el of ELEMENT_DATA) {
  byZ.set(el.z, el);
  bySymbol.set(el.symbol, el);
}

export function getElement(z: number): ElementData | undefined {
  return byZ.get(z);
}

export function getElementBySymbol(symbol: string): ElementData | undefined {
  return bySymbol.get(symbol);
}

export function getSymbol(z: number): string {
  return byZ.get(z)?.symbol ?? `#${z}`;
}

export function getColor(z: number): string {
  return byZ.get(z)?.color ?? '#808080';
}

export function getAllElements(): ElementData[] {
  return ELEMENT_DATA;
}

// Common organic elements for quick-pick palette
export const COMMON_ELEMENTS = [6, 7, 8, 16, 15, 9, 17, 35, 53, 1] as const;
