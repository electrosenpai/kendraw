import * as OCL from 'openchemlib';
import { ATOMIC_NUMBERS, ELEMENTS } from './constants';
import { addAtom, addBond, createEmptyDocument } from './document';
import type { ChemicalDocument, ChemicalInsights, BondType, BondEdge } from './types';

const ADDUCT_MASSES = [
  { label: '[M+H]+', delta: 1.007276 },
  { label: '[M+Na]+', delta: 22.989218 },
  { label: '[M-H]-', delta: -1.007276 },
];

export function createExampleDocument(smiles: string, name: string) {
  const molecule = OCL.Molecule.fromSmiles(smiles);
  molecule.inventCoordinates();
  return moleculeToDocument(molecule, name);
}

export function moleculeToDocument(
  molecule: OCL.Molecule,
  name = 'Imported Structure',
): ChemicalDocument {
  molecule.ensureHelperArrays(OCL.Molecule.cHelperCIP);
  const document = createEmptyDocument(name);
  const atomIds: string[] = [];

  const bounds = molecule.getBounds();
  const offsetX = 360 - (bounds.x + bounds.width / 2) * 52;
  const offsetY = 280 + (bounds.y + bounds.height / 2) * 52;

  for (let atomIndex = 0; atomIndex < molecule.getAllAtoms(); atomIndex += 1) {
    const symbol = ATOMIC_NUMBERS[molecule.getAtomicNo(atomIndex)] ?? 'C';
    const atom = addAtom(
      document,
      {
        x: molecule.getAtomX(atomIndex) * 52 + offsetX,
        y: -molecule.getAtomY(atomIndex) * 52 + offsetY,
      },
      symbol,
    );

    atom.charge = molecule.getAtomCharge(atomIndex);
    atom.isotope = molecule.getAtomMass(atomIndex) || null;
    atom.alias = molecule.getAtomCustomLabel(atomIndex) || null;
    atom.color = null;
    atomIds.push(atom.id);
  }

  for (let bondIndex = 0; bondIndex < molecule.getAllBonds(); bondIndex += 1) {
    const beginAtom = atomIds[molecule.getBondAtom(0, bondIndex)];
    const endAtom = atomIds[molecule.getBondAtom(1, bondIndex)];
    const bondType = mapBondTypeFromOcl(molecule, bondIndex);
    const bond = addBond(document, [beginAtom, endAtom], bondType);
    bond.order = molecule.getBondOrder(bondIndex);
    bond.display = molecule.isAromaticBond(bondIndex) ? 'aromatic' : 'normal';
  }

  document.name = name;
  return document;
}

export function documentToMolecule(document: ChemicalDocument) {
  const molecule = new OCL.Molecule(
    Math.max(document.page.atoms.length + 4, 16),
    Math.max(document.page.bonds.length + 4, 16),
  );
  const atomMap = new Map<string, number>();

  for (const atom of document.page.atoms) {
    const atomicNumber = ELEMENTS[atom.element]?.atomicNumber ?? 6;
    const oclAtom = molecule.addAtom(atomicNumber);
    molecule.setAtomX(oclAtom, atom.x / 52);
    molecule.setAtomY(oclAtom, -atom.y / 52);
    molecule.setAtomCharge(oclAtom, atom.charge);
    if (atom.isotope) {
      molecule.setAtomMass(oclAtom, atom.isotope);
    }
    if (atom.alias) {
      molecule.setAtomCustomLabel(oclAtom, atom.alias);
    }
    atomMap.set(atom.id, oclAtom);
  }

  for (const bond of document.page.bonds) {
    const atom1 = atomMap.get(bond.atomIds[0]);
    const atom2 = atomMap.get(bond.atomIds[1]);
    if (atom1 === undefined || atom2 === undefined) {
      continue;
    }

    const oclBond = molecule.addBond(atom1, atom2);
    if (bond.type === 'aromatic') {
      const order = normalizeAromaticBondOrder(bond.order);
      if (order !== null) {
        molecule.setBondOrder(oclBond, order);
      } else {
        molecule.setBondType(oclBond, OCL.Molecule.cBondTypeDelocalized);
      }
    } else {
      molecule.setBondType(oclBond, mapBondTypeToOcl(bond));
    }
  }

  molecule.ensureHelperArrays(OCL.Molecule.cHelperCIP);
  return molecule;
}

export function cleanUpDocument(document: ChemicalDocument, name = document.name) {
  const molecule = documentToMolecule(document);
  molecule.inventCoordinates();
  return moleculeToDocument(molecule, name);
}

export function importStructure(text: string, fallbackName = 'Imported Structure') {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  let molecule: OCL.Molecule | null = null;

  try {
    if (trimmed.includes('V2000') || trimmed.includes('V3000') || trimmed.includes('M  END')) {
      molecule = OCL.Molecule.fromMolfile(trimmed);
    } else {
      molecule = OCL.Molecule.fromSmiles(trimmed);
    }
  } catch {
    molecule = null;
  }

  if (!molecule || molecule.getAllAtoms() === 0) {
    return null;
  }

  molecule.inventCoordinates();
  return moleculeToDocument(molecule, fallbackName);
}

export function exportSvg(document: ChemicalDocument) {
  const molecule = documentToMolecule(document);
  molecule.inventCoordinates();
  return molecule.toSVG(720, 520, undefined, {
    autoCrop: true,
    fontWeight: 500,
    strokeWidth: 1.8,
  });
}

export function calculateChemicalInsights(document: ChemicalDocument): ChemicalInsights {
  if (document.page.atoms.length === 0) {
    return {
      formula: '—',
      averageMass: 0,
      exactMass: 0,
      logP: null,
      tpsa: null,
      donors: 0,
      acceptors: 0,
      rotatableBonds: 0,
      ringCount: 0,
      aromaticRingCount: 0,
      stereoCenters: 0,
      smiles: '',
      molfile: '',
      adducts: [],
      elementalAnalysis: [],
      degreeOfUnsaturation: null,
      lipinski: 'No structure drawn',
      warnings: [],
    };
  }

  const molecule = documentToMolecule(document);
  const formula = molecule.getMolecularFormula();
  const properties = new OCL.MoleculeProperties(molecule);
  const ringSet = molecule.getRingSet();
  const warnings: string[] = [];

  try {
    molecule.validate();
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
  }

  const stereoCenters = Array.from({ length: molecule.getAllAtoms() }, (_, atom) => atom).filter(
    (atom) => {
      return molecule.isAtomStereoCenter(atom);
    },
  ).length;

  const elementalAnalysis = calculateElementalAnalysis(formula.formula, formula.relativeWeight);
  const degreeOfUnsaturation = calculateDegreeOfUnsaturation(formula.formula);
  const lipinski = evaluateLipinski(
    formula.relativeWeight,
    properties.logP,
    properties.donorCount,
    properties.acceptorCount,
  );

  return {
    formula: formula.formula,
    averageMass: formula.relativeWeight,
    exactMass: formula.absoluteWeight,
    logP: Number.isFinite(properties.logP) ? properties.logP : null,
    tpsa: Number.isFinite(properties.polarSurfaceArea) ? properties.polarSurfaceArea : null,
    donors: properties.donorCount,
    acceptors: properties.acceptorCount,
    rotatableBonds: molecule.getRotatableBondCount(),
    ringCount: ringSet.getSize(),
    aromaticRingCount: Array.from({ length: ringSet.getSize() }, (_, index) => index).filter(
      (index) => {
        return ringSet.isAromatic(index);
      },
    ).length,
    stereoCenters,
    smiles: molecule.toIsomericSmiles(),
    molfile: molecule.toMolfile(),
    adducts: ADDUCT_MASSES.map((adduct) => ({
      label: adduct.label,
      mz: Number((formula.absoluteWeight + adduct.delta).toFixed(4)),
    })),
    elementalAnalysis,
    degreeOfUnsaturation,
    lipinski,
    warnings,
  };
}

function evaluateLipinski(weight: number, logP: number, donors: number, acceptors: number) {
  const failures = [
    weight > 500 ? 'MW > 500' : null,
    logP > 5 ? 'logP > 5' : null,
    donors > 5 ? 'HBD > 5' : null,
    acceptors > 10 ? 'HBA > 10' : null,
  ].filter(Boolean);

  return failures.length === 0
    ? 'Passes Rule of 5'
    : `Fails ${failures.length}: ${failures.join(', ')}`;
}

function calculateElementalAnalysis(formula: string, totalMass: number) {
  return parseFormula(formula).map((entry) => {
    const elementMass = (ELEMENTS[entry.element]?.weight ?? 0) * entry.count;
    return {
      element: entry.element,
      percent: totalMass === 0 ? 0 : Number(((elementMass / totalMass) * 100).toFixed(2)),
    };
  });
}

function calculateDegreeOfUnsaturation(formula: string) {
  const counts = Object.fromEntries(
    parseFormula(formula).map((entry) => [entry.element, entry.count]),
  );
  const carbon = counts.C ?? 0;
  const hydrogen = counts.H ?? 0;
  const nitrogen = counts.N ?? 0;
  const phosphorus = counts.P ?? 0;
  const halogens = (counts.F ?? 0) + (counts.Cl ?? 0) + (counts.Br ?? 0) + (counts.I ?? 0);
  const value = (2 * carbon + 2 + nitrogen + phosphorus - hydrogen - halogens) / 2;
  return Number.isFinite(value) ? Number(value.toFixed(1)) : null;
}

function parseFormula(formula: string) {
  return Array.from(formula.matchAll(/([A-Z][a-z]*)(\d*)/g)).map((match) => ({
    element: match[1],
    count: Number(match[2] || 1),
  }));
}

function mapBondTypeFromOcl(molecule: OCL.Molecule, bondIndex: number): BondType {
  if (molecule.isAromaticBond(bondIndex)) {
    return 'aromatic';
  }

  switch (molecule.getBondType(bondIndex)) {
    case OCL.Molecule.cBondTypeDouble:
      return 'double';
    case OCL.Molecule.cBondTypeTriple:
      return 'triple';
    case OCL.Molecule.cBondTypeQuadruple:
      return 'quadruple';
    case OCL.Molecule.cBondTypeUp:
      return 'wedge';
    case OCL.Molecule.cBondTypeDown:
      return 'dash';
    case OCL.Molecule.cBondTypeMetalLigand:
      return 'dative';
    default:
      return 'single';
  }
}

function mapBondTypeToOcl(bond: BondEdge) {
  switch (bond.type) {
    case 'double':
      return OCL.Molecule.cBondTypeDouble;
    case 'triple':
      return OCL.Molecule.cBondTypeTriple;
    case 'quadruple':
      return OCL.Molecule.cBondTypeQuadruple;
    case 'wedge':
      return OCL.Molecule.cBondTypeUp;
    case 'dash':
      return OCL.Molecule.cBondTypeDown;
    case 'aromatic':
      return OCL.Molecule.cBondTypeDelocalized;
    case 'dative':
      return OCL.Molecule.cBondTypeMetalLigand;
    default:
      return OCL.Molecule.cBondTypeSingle;
  }
}

function normalizeAromaticBondOrder(order: number) {
  if (Math.abs(order - 2) <= 0.2) {
    return 2;
  }

  if (Math.abs(order - 1) <= 0.2) {
    return 1;
  }

  return null;
}
