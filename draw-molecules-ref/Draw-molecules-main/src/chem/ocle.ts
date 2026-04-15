import * as BaseOCL from 'openchemlib';

type OclMolecule = InstanceType<typeof BaseOCL.Molecule>;

type GroupedDiastereotopicAtomId = {
  counter: number;
  atoms: number[];
  oclID: string;
  atomLabel: string;
  _highlight: string[];
};

type ConnectivityOptions = {
  pathLength?: boolean;
  atomicNo?: boolean;
  mass?: boolean;
  sdt?: boolean;
};

type PathQuery = {
  fromLabel?: string;
  toLabel?: string;
  minLength?: number;
  maxLength?: number;
};

type PathEntry = {
  fromDiaID: string;
  toDiaID: string;
  fromAtoms: number[];
  toAtoms: number[];
  fromLabel: string;
  toLabel: string;
  pathLength: number;
};

type OclUtility = typeof BaseOCL & {
  Util: {
    getHoseCodesFromDiastereotopicID(
      id: string,
      options: { maxSphereSize: number; type: number },
    ): string[];
  };
};

type ExtendedPrototype = OclMolecule & {
  getGroupedDiastereotopicAtomIDs(options?: { atomLabel?: string }): GroupedDiastereotopicAtomId[];
  getConnectivityMatrix(options?: ConnectivityOptions): number[][];
  getAllPaths(options?: PathQuery): PathEntry[];
};

const OCLE = BaseOCL as OclUtility;

let didExtend = false;

export function getExtendedOcle() {
  if (!didExtend) {
    extendMoleculePrototype();
    didExtend = true;
  }

  return OCLE;
}

function extendMoleculePrototype() {
  const moleculePrototype = OCLE.Molecule.prototype as ExtendedPrototype;

  if (!moleculePrototype.getGroupedDiastereotopicAtomIDs) {
    moleculePrototype.getGroupedDiastereotopicAtomIDs = function getGroupedDiastereotopicAtomIDs(
      options = {},
    ) {
      const label = options.atomLabel;
      const diaIds = this.getDiastereotopicAtomIDs();
      const grouped: Record<string, GroupedDiastereotopicAtomId> = {};

      for (let atomIndex = 0; atomIndex < diaIds.length; atomIndex += 1) {
        if (label && this.getAtomLabel(atomIndex) !== label) {
          continue;
        }

        const diaId = `${diaIds[atomIndex]}`;
        if (!grouped[diaId]) {
          grouped[diaId] = {
            counter: 1,
            atoms: [atomIndex],
            oclID: diaId,
            atomLabel: this.getAtomLabel(atomIndex),
            _highlight: [diaId],
          };
        } else {
          grouped[diaId].counter += 1;
          grouped[diaId].atoms.push(atomIndex);
        }
      }

      return Object.values(grouped);
    };
  }

  if (!moleculePrototype.getConnectivityMatrix) {
    moleculePrototype.getConnectivityMatrix = function getConnectivityMatrix(options = {}) {
      this.ensureHelperArrays(OCLE.Molecule.cHelperNeighbours);
      const atomCount = this.getAllAtoms();
      const matrix = Array.from({ length: atomCount }, () => new Array<number>(atomCount).fill(0));

      if (!options.pathLength) {
        for (let atomIndex = 0; atomIndex < atomCount; atomIndex += 1) {
          if (options.atomicNo) {
            matrix[atomIndex][atomIndex] = this.getAtomicNo(atomIndex);
          } else if (options.mass) {
            matrix[atomIndex][atomIndex] = OCLE.Molecule.cRoundedMass[this.getAtomicNo(atomIndex)];
          } else {
            matrix[atomIndex][atomIndex] = 1;
          }
        }
      }

      for (let atomIndex = 0; atomIndex < atomCount; atomIndex += 1) {
        const neighbourCount = this.getAllConnAtoms(atomIndex);
        for (let neighbourIndex = 0; neighbourIndex < neighbourCount; neighbourIndex += 1) {
          const neighbourAtom = this.getConnAtom(atomIndex, neighbourIndex);
          matrix[atomIndex][neighbourAtom] = options.sdt
            ? this.getConnBondOrder(atomIndex, neighbourIndex)
            : 1;
        }
      }

      return options.pathLength ? toPathLengthMatrix(matrix) : matrix;
    };
  }

  if (!moleculePrototype.getAllPaths) {
    moleculePrototype.getAllPaths = function getAllPaths(options = {}) {
      const fromLabel = options.fromLabel ?? '';
      const toLabel = options.toLabel ?? '';
      const minLength = options.minLength ?? 1;
      const maxLength = options.maxLength ?? 4;
      const diaIds = this.getDiastereotopicAtomIDs().map((entry) => `${entry}`);
      const pathLengths = this.getConnectivityMatrix({ pathLength: true });
      const results: Record<string, PathEntry> = {};

      for (let from = 0; from < this.getAllAtoms(); from += 1) {
        if (fromLabel && this.getAtomLabel(from) !== fromLabel) {
          continue;
        }

        for (let to = 0; to < this.getAllAtoms(); to += 1) {
          if (toLabel && this.getAtomLabel(to) !== toLabel) {
            continue;
          }

          const pathLength = pathLengths[from][to];
          if (pathLength < minLength || pathLength > maxLength) {
            continue;
          }

          const key = `${diaIds[from]}_${diaIds[to]}`;
          if (!results[key]) {
            results[key] = {
              fromDiaID: diaIds[from],
              toDiaID: diaIds[to],
              fromAtoms: [],
              toAtoms: [],
              fromLabel: this.getAtomLabel(from),
              toLabel: this.getAtomLabel(to),
              pathLength,
            };
          }

          if (!results[key].fromAtoms.includes(from)) {
            results[key].fromAtoms.push(from);
          }
          if (!results[key].toAtoms.includes(to)) {
            results[key].toAtoms.push(to);
          }
        }
      }

      return Object.values(results).map((entry) => ({
        ...entry,
        fromAtoms: [...entry.fromAtoms].sort((left, right) => left - right),
        toAtoms: [...entry.toAtoms].sort((left, right) => left - right),
      }));
    };
  }
}

function toPathLengthMatrix(adjacency: number[][]) {
  const vertexCount = adjacency.length;
  const distances = adjacency.map((row, rowIndex) =>
    row.map((value, columnIndex) => {
      if (rowIndex === columnIndex) {
        return 0;
      }
      return value ? value : Number.POSITIVE_INFINITY;
    }),
  );

  for (let via = 0; via < vertexCount; via += 1) {
    for (let from = 0; from < vertexCount; from += 1) {
      for (let to = 0; to < vertexCount; to += 1) {
        const candidate = distances[from][via] + distances[via][to];
        if (candidate < distances[from][to]) {
          distances[from][to] = candidate;
        }
      }
    }
  }

  return distances.map((row) => row.map((value) => (Number.isFinite(value) ? value : -1)));
}
