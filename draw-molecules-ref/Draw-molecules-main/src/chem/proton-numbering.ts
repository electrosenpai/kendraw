import type { ChemicalDocument } from './types';
import { documentToMolecule } from './ocl';
import { getExtendedOcle } from './ocle';

type OclMolecule = ReturnType<typeof documentToMolecule>;

type GroupedDiastereotopicAtomId = {
  atoms: number[];
  oclID: string;
};

type EnhancedMolecule = OclMolecule & {
  getGroupedDiastereotopicAtomIDs(options?: { atomLabel?: string }): GroupedDiastereotopicAtomId[];
};

type PreparedProtonDisplayContext = {
  molecule: OclMolecule;
  protonProbe: EnhancedMolecule;
};

type RawProtonAssignment = {
  key: string;
  protonAtomIndices: number[];
  hostAtomIndices: number[];
  hostLocants: number[];
  minProtonRank: number;
  suffix: string;
};

export interface ProtonOverlayLabel {
  hostAtomId: string;
  label: string;
  protonAtomIds: string[];
  assignment: string;
}

export interface ProtonAssignmentDescriptor {
  key: string;
  assignment: string;
  protonAtomIds: string[];
  hostAtomIds: string[];
  hostLocants: number[];
  overlayLabels: ProtonOverlayLabel[];
}

export interface ProtonDisplayModel {
  assignments: ProtonAssignmentDescriptor[];
  assignmentByKey: Map<string, ProtonAssignmentDescriptor>;
  overlayLabels: ProtonOverlayLabel[];
}

export function buildProtonDisplayModel(
  document: ChemicalDocument,
  prepared?: PreparedProtonDisplayContext,
): ProtonDisplayModel {
  if (document.page.atoms.length === 0) {
    return {
      assignments: [],
      assignmentByKey: new Map(),
      overlayLabels: [],
    };
  }

  const ocle = getExtendedOcle();
  const molecule = prepared?.molecule ?? documentToMolecule(document);
  molecule.ensureHelperArrays(ocle.Molecule.cHelperCIP);
  const protonProbe = prepared?.protonProbe ?? createProtonProbe(molecule, ocle);
  const heavyAtomLocants = buildHeavyAtomLocants(molecule, ocle);
  const protonCanonizer = new ocle.Canonizer(protonProbe, {
    createSymmetryRank: true,
    considerStereoheterotopicity: true,
  });
  const protonRanks = protonCanonizer.getFinalRank();

  const rawAssignments = protonProbe
    .getGroupedDiastereotopicAtomIDs({ atomLabel: 'H' })
    .map((group) => {
      const protonAtomIndices = group.atoms.filter(
        (atomIndex) => protonProbe.getAtomicNo(atomIndex) === 1,
      );
      if (protonAtomIndices.length === 0) {
        return null;
      }

      const hostAtomIndices = [
        ...new Set(
          protonAtomIndices
            .map((atomIndex) => protonProbe.getConnAtom(atomIndex, 0))
            .filter((atomIndex) => atomIndex >= 0 && heavyAtomLocants.has(atomIndex)),
        ),
      ].sort((left, right) =>
        compareNumbers(
          heavyAtomLocants.get(left) ?? Number.MAX_SAFE_INTEGER,
          heavyAtomLocants.get(right) ?? Number.MAX_SAFE_INTEGER,
        ),
      );
      if (hostAtomIndices.length === 0) {
        return null;
      }

      return {
        key: normalizeProtonAtomKey(protonAtomIndices),
        protonAtomIndices: [...protonAtomIndices].sort(compareNumbers),
        hostAtomIndices,
        hostLocants: hostAtomIndices.map((atomIndex) => heavyAtomLocants.get(atomIndex) ?? 0),
        minProtonRank: Math.min(
          ...protonAtomIndices.map(
            (atomIndex) => protonRanks[atomIndex] ?? Number.MAX_SAFE_INTEGER,
          ),
        ),
        suffix: '',
      } satisfies RawProtonAssignment;
    })
    .filter((assignment): assignment is RawProtonAssignment => assignment !== null)
    .sort(
      (left, right) =>
        compareNumbers(
          left.hostLocants[0] ?? Number.MAX_SAFE_INTEGER,
          right.hostLocants[0] ?? Number.MAX_SAFE_INTEGER,
        ) ||
        compareNumbers(left.hostLocants.length, right.hostLocants.length) ||
        compareNumbers(left.minProtonRank, right.minProtonRank) ||
        left.key.localeCompare(right.key),
    );

  const bySingleHostLocant = new Map<number, RawProtonAssignment[]>();
  for (const assignment of rawAssignments) {
    if (assignment.hostLocants.length !== 1) {
      continue;
    }
    const locant = assignment.hostLocants[0];
    const existing = bySingleHostLocant.get(locant);
    if (existing) {
      existing.push(assignment);
    } else {
      bySingleHostLocant.set(locant, [assignment]);
    }
  }

  for (const assignments of bySingleHostLocant.values()) {
    if (assignments.length < 2) {
      continue;
    }

    assignments
      .sort(
        (left, right) =>
          compareNumbers(left.minProtonRank, right.minProtonRank) ||
          compareNumbers(
            left.protonAtomIndices[0] ?? Number.MAX_SAFE_INTEGER,
            right.protonAtomIndices[0] ?? Number.MAX_SAFE_INTEGER,
          ),
      )
      .forEach((assignment, index) => {
        assignment.suffix = toAlphabeticSuffix(index);
      });
  }

  const assignments = rawAssignments.map((assignment) => {
    const locantLabels = assignment.hostLocants.map((locant) => `${locant}${assignment.suffix}`);
    const signalAssignment = locantLabels.map((locant) => `H-${locant}`).join('/');
    const overlayLabels = assignment.hostAtomIndices
      .map((atomIndex, index) => {
        const hostAtomId = document.page.atoms[atomIndex]?.id;
        if (!hostAtomId) {
          return null;
        }

        return {
          hostAtomId,
          label: `${assignment.hostLocants[index] ?? ''}${assignment.suffix}`,
          protonAtomIds: assignment.protonAtomIndices.map((atomIndexValue) => `${atomIndexValue}`),
          assignment: signalAssignment,
        } satisfies ProtonOverlayLabel;
      })
      .filter((label): label is ProtonOverlayLabel => label !== null);

    return {
      key: assignment.key,
      assignment: signalAssignment,
      protonAtomIds: assignment.protonAtomIndices.map((atomIndex) => `${atomIndex}`),
      hostAtomIds: overlayLabels.map((label) => label.hostAtomId),
      hostLocants: [...assignment.hostLocants],
      overlayLabels,
    } satisfies ProtonAssignmentDescriptor;
  });

  return {
    assignments,
    assignmentByKey: new Map(assignments.map((assignment) => [assignment.key, assignment])),
    overlayLabels: assignments.flatMap((assignment) => assignment.overlayLabels),
  };
}

export function normalizeProtonAtomKey(atomIds: Array<string | number>) {
  return [...new Set(atomIds.map((atomId) => Number(atomId)).filter(Number.isFinite))]
    .sort(compareNumbers)
    .map((atomId) => `${atomId}`)
    .join('_');
}

function buildHeavyAtomLocants(molecule: OclMolecule, ocle: ReturnType<typeof getExtendedOcle>) {
  const canonizer = new ocle.Canonizer(molecule, {
    createSymmetryRank: true,
    considerStereoheterotopicity: true,
  });
  const finalRanks = canonizer.getFinalRank();
  const heavyAtoms = Array.from({ length: molecule.getAllAtoms() }, (_, atomIndex) => atomIndex)
    .filter((atomIndex) => molecule.getAtomicNo(atomIndex) > 1)
    .sort(
      (left, right) =>
        compareNumbers(
          finalRanks[left] ?? Number.MAX_SAFE_INTEGER,
          finalRanks[right] ?? Number.MAX_SAFE_INTEGER,
        ) ||
        compareNumbers(canonizer.getSymmetryRank(left), canonizer.getSymmetryRank(right)) ||
        compareNumbers(left, right),
    );

  return new Map(heavyAtoms.map((atomIndex, index) => [atomIndex, index + 1]));
}

function createProtonProbe(molecule: OclMolecule, ocle: ReturnType<typeof getExtendedOcle>) {
  const protonProbe = ocle.Molecule.fromMolfile(molecule.toMolfile());
  protonProbe.addImplicitHydrogens();
  protonProbe.ensureHelperArrays(ocle.Molecule.cHelperCIP);
  return protonProbe as EnhancedMolecule;
}

function compareNumbers(left: number, right: number) {
  return left - right;
}

function toAlphabeticSuffix(index: number) {
  let current = index;
  let suffix = '';

  do {
    suffix = String.fromCharCode(97 + (current % 26)) + suffix;
    current = Math.floor(current / 26) - 1;
  } while (current >= 0);

  return suffix;
}
