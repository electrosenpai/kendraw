declare module 'nmr-predictor' {
  export interface NmrPredictionEntry {
    atomIDs: Array<string | number>;
    diaIDs?: string[];
    nbAtoms?: number;
    delta: number | null;
    atomLabel: string;
    j?: Array<{
      assignment: Array<string | number> | string | number;
      diaID?: string;
      coupling: number;
      multiplicity?: string | number;
      distance?: number;
    }>;
    ncs?: number;
    std?: number;
    min?: number;
    max?: number;
    integral?: number;
    level?: number;
  }

  export interface NmrPredictorModule {
    fetchProton(url?: string, dbName?: string): Promise<unknown>;
    fetchCarbon(url?: string, dbName?: string): Promise<unknown>;
    setDb(db: unknown, type: 'proton' | 'carbon', dbName: string): void;
    proton(
      molecule: string | Record<string, unknown>,
      options?: Record<string, unknown>,
    ): NmrPredictionEntry[];
    carbon(
      molecule: string | Record<string, unknown>,
      options?: Record<string, unknown>,
    ): NmrPredictionEntry[];
    spinus(
      molecule: string | Record<string, unknown>,
      options?: Record<string, unknown>,
    ): Promise<NmrPredictionEntry[]>;
  }

  export function fetchProton(url?: string, dbName?: string): Promise<unknown>;
  export function fetchCarbon(url?: string, dbName?: string): Promise<unknown>;
  export function setDb(db: unknown, type: 'proton' | 'carbon', dbName: string): void;
  export function proton(
    molecule: string | Record<string, unknown>,
    options?: Record<string, unknown>,
  ): NmrPredictionEntry[];
  export function carbon(
    molecule: string | Record<string, unknown>,
    options?: Record<string, unknown>,
  ): NmrPredictionEntry[];
  export function spinus(
    molecule: string | Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<NmrPredictionEntry[]>;

  const predictor: NmrPredictorModule;
  export default predictor;
}

declare module 'nmr-simulation' {
  export interface SpinSystemInstance {
    ensureClusterSize(options: Record<string, unknown>): void;
  }

  export class SpinSystem {
    static fromPrediction(prediction: Array<Record<string, unknown>>): SpinSystemInstance;
  }

  export function simulate1D(
    spinSystem: SpinSystemInstance,
    options: {
      frequency: number;
      from: number;
      to: number;
      lineWidth: number;
      nbPoints: number;
      maxClusterSize: number;
      output: 'xy';
    },
  ): { x: number[]; y: number[] };
}

declare module 'ml-sparse-matrix' {
  export interface SparseMatrixInstance {
    rows: number;
    columns: number;
    isSquare(): boolean;
    isSymmetric(): boolean;
    get(row: number, column: number): number;
    isEmpty?(): boolean;
  }

  export interface SparseMatrixConstructor {
    prototype: SparseMatrixInstance;
  }

  const SparseMatrix: SparseMatrixConstructor;
  export default SparseMatrix;
}
