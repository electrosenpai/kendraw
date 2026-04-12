export interface Atom {
  id: string;
  x: number;
  y: number;
  element: number;
  charge: number;
}

export interface Bond {
  id: string;
  fromAtomId: string;
  toAtomId: string;
  order: number;
  style: string;
}

export interface Page {
  atoms: Record<string, Atom>;
  bonds: Record<string, Bond>;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
