// Branded ID types for type safety
export type AtomId = string & { readonly __brand: 'AtomId' };
export type BondId = string & { readonly __brand: 'BondId' };
export type ArrowId = string & { readonly __brand: 'ArrowId' };
export type AnnotationId = string & { readonly __brand: 'AnnotationId' };
export type GroupId = string & { readonly __brand: 'GroupId' };

export type Point = {
  x: number;
  y: number;
};

export type BezierGeometry = {
  start: Point;
  c1: Point;
  c2: Point;
  end: Point;
};

export type ArrowAnchor =
  | { kind: 'free' }
  | { kind: 'atom'; refId: AtomId }
  | { kind: 'bond'; refId: BondId; t?: number }
  | { kind: 'lone-pair'; refId: AtomId; index: number };

export type Atom = {
  id: AtomId;
  x: number;
  y: number;
  element: number; // atomic number Z (1..118)
  label?: string;
  charge: number;
  radicalCount: 0 | 1 | 2;
  lonePairs: number;
  isotope?: number;
  stereoParity?: 'CW' | 'CCW' | 'unspecified';
};

export type Bond = {
  id: BondId;
  fromAtomId: AtomId;
  toAtomId: AtomId;
  order: 1 | 2 | 3 | 1.5;
  style:
    | 'single'
    | 'double'
    | 'triple'
    | 'aromatic'
    | 'wedge'
    | 'dash'
    | 'wavy'
    | 'dative'
    | 'bold';
  stereo?: 'E' | 'Z' | 'unspecified';
};

export type Arrow = {
  id: ArrowId;
  type: 'forward' | 'equilibrium' | 'reversible' | 'resonance' | 'curly-radical' | 'curly-pair';
  geometry: BezierGeometry;
  startAnchor: ArrowAnchor;
  endAnchor: ArrowAnchor;
  annotations?: { above?: AnnotationId; below?: AnnotationId };
};

export type RichTextNode = {
  text: string;
  style?: 'normal' | 'subscript' | 'superscript' | 'greek';
};

export type Annotation = {
  id: AnnotationId;
  x: number;
  y: number;
  richText: RichTextNode[];
  anchorRef?: { kind: 'arrow'; refId: ArrowId; slot: 'above' | 'below' };
};

export type Group = {
  id: GroupId;
  atomIds: AtomId[];
  bondIds: BondId[];
  locked: boolean;
  name?: string;
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type Page = {
  id: string;
  atoms: Record<AtomId, Atom>;
  bonds: Record<BondId, Bond>;
  arrows: Record<ArrowId, Arrow>;
  annotations: Record<AnnotationId, Annotation>;
  groups: Record<GroupId, Group>;
  viewport: Viewport;
};

export type DocumentMetadata = {
  title: string;
  createdAt: string;
  modifiedAt: string;
  authorHint?: string;
  appVersion: string;
};

export type Document = {
  id: string;
  schemaVersion: number;
  metadata: DocumentMetadata;
  pages: Page[];
  activePageIndex: number;
};
