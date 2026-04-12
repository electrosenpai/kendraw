/**
 * ChemDraw-compatible atom display logic.
 * Handles: label visibility, implicit hydrogen count, hydrogen placement,
 * formula mode (auto-subscript), charges, isotopes, radicals.
 */

import type { Atom, AtomId, Page } from './types.js';
import { getSymbol } from './periodic-table.js';

/**
 * Standard valences for common elements.
 * Elements with multiple valid valences listed in order.
 */
const STANDARD_VALENCES: Record<number, number[]> = {
  1: [1], // H
  5: [3], // B
  6: [4], // C
  7: [3, 5], // N
  8: [2], // O
  9: [1], // F
  14: [4], // Si
  15: [3, 5], // P
  16: [2, 4, 6], // S
  17: [1], // Cl
  35: [1], // Br
  53: [1], // I
};

/**
 * Calculate the number of implicit hydrogens for an atom.
 * Formula: implicitH = normalValence - Σ(bondOrders) - |formalCharge|
 */
/** Check if an atom is a generic label (R-group, X, X', etc.) — not a real element. */
export function isGenericLabel(atom: Atom): boolean {
  if (!atom.label) return false;
  // R1, R2, R', X, X', Y, Z followed by optional digits/primes
  return /^[RXYZ]\d*'?$/.test(atom.label) || /^[RXYZ]'/.test(atom.label);
}

export function getImplicitHydrogens(page: Page, atomId: AtomId): number {
  const atom = page.atoms[atomId];
  if (!atom) return 0;

  // Generic labels (R-groups, X, Y, Z) → never add implicit H
  if (isGenericLabel(atom)) return 0;

  const valences = STANDARD_VALENCES[atom.element];
  if (!valences) return 0;

  // Sum bond orders
  let bondSum = 0;
  for (const bond of Object.values(page.bonds)) {
    if (bond.fromAtomId === atomId || bond.toAtomId === atomId) {
      bondSum += bond.order === 1.5 ? 1 : bond.order; // aromatic counted as 1 for H calc
    }
  }

  const chargeAbs = Math.abs(atom.charge);

  // Try each valid valence, pick the one that gives non-negative H count
  for (const v of valences) {
    const h = v - bondSum - chargeAbs;
    if (h >= 0) return h;
  }

  return 0; // oversaturated
}

/**
 * Determine if an atom label should be shown (ChemDraw rules).
 * - Carbon with 2+ bonds to heavy atoms → vertex invisible (no label)
 * - Heteroatoms → always visible
 * - Carbon with charge, isotope, or radical → visible
 * - Carbon terminal (0-1 bonds) → visible
 */
export function shouldShowLabel(page: Page, atomId: AtomId): boolean {
  const atom = page.atoms[atomId];
  if (!atom) return false;

  // Heteroatoms always show label
  if (atom.element !== 6) return true;

  // Carbon with charge, isotope, radical, or custom label
  if (atom.charge !== 0) return true;
  if (atom.isotope) return true;
  if (atom.radicalCount > 0) return true;
  if (atom.label) return true;

  // Count bonds to heavy atoms (not H)
  let heavyBonds = 0;
  for (const bond of Object.values(page.bonds)) {
    if (bond.fromAtomId === atomId) {
      const other = page.atoms[bond.toAtomId];
      if (other && other.element !== 1) heavyBonds++;
    } else if (bond.toAtomId === atomId) {
      const other = page.atoms[bond.fromAtomId];
      if (other && other.element !== 1) heavyBonds++;
    }
  }

  // Terminal carbon or isolated → show
  return heavyBonds < 2;
}

/**
 * Determine hydrogen placement direction.
 * If existing bonds point mostly right → H goes left ("HO", "H₂N")
 * If bonds point mostly left → H goes right ("OH", "NH₂")
 */
export function getHydrogenSide(page: Page, atomId: AtomId): 'left' | 'right' {
  const atom = page.atoms[atomId];
  if (!atom) return 'right';

  let weightedX = 0;
  let count = 0;
  for (const bond of Object.values(page.bonds)) {
    let other: Atom | undefined;
    if (bond.fromAtomId === atomId) other = page.atoms[bond.toAtomId];
    else if (bond.toAtomId === atomId) other = page.atoms[bond.fromAtomId];
    if (other) {
      weightedX += other.x - atom.x;
      count++;
    }
  }

  // If bonds go right on average, put H on the left
  return count > 0 && weightedX > 0 ? 'left' : 'right';
}

/**
 * Build the full display label for an atom including implicit H.
 * Produces structured segments for rendering with subscripts/superscripts.
 */
export interface LabelSegment {
  text: string;
  style: 'normal' | 'subscript' | 'superscript';
}

export function buildAtomLabel(page: Page, atomId: AtomId): LabelSegment[] {
  const atom = page.atoms[atomId];
  if (!atom) return [];

  if (!shouldShowLabel(page, atomId)) return [];

  // Generic labels (R-groups, X, Y, Z) → render with formula mode (digits as subscript)
  if (isGenericLabel(atom) && atom.label) {
    return formulaMode(atom.label);
  }

  const symbol = atom.label ?? getSymbol(atom.element);
  // If atom has a custom multi-char label (CO2H, OMe, etc.), use formula mode
  if (atom.label && atom.label.length > 2) {
    return formulaMode(atom.label);
  }

  const implicitH = getImplicitHydrogens(page, atomId);
  const hSide = getHydrogenSide(page, atomId);
  const segments: LabelSegment[] = [];

  // Isotope (superscript left)
  if (atom.isotope) {
    segments.push({ text: String(atom.isotope), style: 'superscript' });
  }

  // Build H part
  const hPart: LabelSegment[] = [];
  if (implicitH > 0) {
    hPart.push({ text: 'H', style: 'normal' });
    if (implicitH > 1) {
      hPart.push({ text: String(implicitH), style: 'subscript' });
    }
  }

  if (hSide === 'left' && hPart.length > 0) {
    segments.push(...hPart);
  }

  segments.push({ text: symbol, style: 'normal' });

  if (hSide === 'right' && hPart.length > 0) {
    segments.push(...hPart);
  }

  // Charge (superscript right)
  if (atom.charge !== 0) {
    const mag = Math.abs(atom.charge);
    const sign = atom.charge > 0 ? '+' : '\u2013';
    const chargeStr = mag === 1 ? sign : `${mag}${sign}`;
    segments.push({ text: chargeStr, style: 'superscript' });
  }

  // Radical
  if (atom.radicalCount > 0) {
    segments.push({ text: '\u2022'.repeat(atom.radicalCount), style: 'normal' });
  }

  return segments;
}

/**
 * Format a formula string with auto-subscript for numbers.
 * "NH3" → [{text:"N"},{text:"H"},{text:"3",style:"subscript"}]
 */
export function formulaMode(text: string): LabelSegment[] {
  const segments: LabelSegment[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch && ch >= '0' && ch <= '9') {
      let num = '';
      while (i < text.length) {
        const d = text[i];
        if (!d || d < '0' || d > '9') break;
        num += text[i];
        i++;
      }
      segments.push({ text: num, style: 'subscript' });
    } else {
      segments.push({ text: ch ?? '', style: 'normal' });
      i++;
    }
  }
  return segments;
}
