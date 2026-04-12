/**
 * ChemDraw-compatible atom display logic.
 * Handles: label visibility, implicit hydrogen count, hydrogen placement,
 * formula mode (auto-subscript), charges, isotopes, radicals.
 */

import type { Atom, AtomId, Page } from './types.js';
import { getSymbol, getElementBySymbol } from './periodic-table.js';

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

/** Options for controlling carbon label visibility (from CDXML document settings). */
export interface LabelDisplayOptions {
  showTerminalCarbonLabels?: boolean;
  showNonTerminalCarbonLabels?: boolean;
}

/**
 * Determine if an atom label should be shown (ChemDraw rules).
 * - Carbon with 2+ bonds to heavy atoms → vertex invisible (no label)
 * - Heteroatoms → always visible
 * - Carbon with charge, isotope, or radical → visible
 * - Carbon terminal (0-1 bonds) → visible (unless settings override)
 *
 * The optional `opts` parameter allows CDXML document-level settings
 * (ShowTerminalCarbonLabels, ShowNonTerminalCarbonLabels) to override defaults.
 */
export function shouldShowLabel(page: Page, atomId: AtomId, opts?: LabelDisplayOptions): boolean {
  const atom = page.atoms[atomId];
  if (!atom) return false;

  // Heteroatoms always show label
  if (atom.element !== 6) return true;

  // Carbon with charge, isotope, or radical → always show
  if (atom.charge !== 0) return true;
  if (atom.isotope) return true;
  if (atom.radicalCount > 0) return true;

  // Carbon with an explicit label set by the user (e.g. from CDXML <t> child) → show
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

  const isTerminal = heavyBonds < 2;

  if (isTerminal) {
    // Respect ShowTerminalCarbonLabels from CDXML settings (default: true)
    return opts?.showTerminalCarbonLabels ?? true;
  }

  // Non-terminal carbon: respect ShowNonTerminalCarbonLabels (default: false = implicit vertex)
  return opts?.showNonTerminalCarbonLabels ?? false;
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
 * Determine label justification for an atom (ChemDraw Auto mode).
 * Left = normal order (element first, e.g. "OH"), bonds go left.
 * Right = reversed order (H first, e.g. "HO"), bonds go right.
 */
export function getLabelJustification(page: Page, atomId: AtomId): 'left' | 'right' {
  // Same logic as getHydrogenSide but with the semantics inverted:
  // bonds go right → Right justification (reverse the label)
  // bonds go left  → Left justification (normal label)
  const hSide = getHydrogenSide(page, atomId);
  return hSide === 'left' ? 'right' : 'left';
}

/**
 * Reverse a formula label for right-justified display.
 * Tokenizes at uppercase-letter boundaries ([A-Z][a-z]*\d*) and reverses.
 * "OH" → "HO", "NH2" → "H2N", "OCH3" → "H3CO", "OMe" → "MeO"
 *
 * For abbreviation labels where element-group tokens aren't all valid elements
 * (e.g. "OTBS"), falls back to swapping the main element with the rest:
 * "OTBS" → "TBSO".
 */
export function reverseFormulaLabel(label: string, elementZ?: number): string {
  if (label.length <= 1) return label;

  // Tokenize: each token = uppercase + optional lowercase + optional digits
  const tokens = label.match(/[A-Z][a-z]*\d*/g);
  if (!tokens || tokens.length <= 1) return label;

  // Check if all tokens (stripping trailing digits) are recognized element symbols
  const allElements = tokens.every((t) => {
    const sym = t.replace(/\d+$/, '');
    return !!getElementBySymbol(sym);
  });

  if (allElements) {
    // Full element-group reversal: OH→HO, NH2→H2N, OCH3→H3CO
    return tokens.reverse().join('');
  }

  // Abbreviation fallback: split at element symbol boundary
  // e.g. "OTBS" (element=O) → "TBS" + "O" = "TBSO"
  if (elementZ !== undefined) {
    const sym = getSymbol(elementZ);
    if (label.startsWith(sym) && label.length > sym.length) {
      return label.slice(sym.length) + sym;
    }
    if (label.endsWith(sym) && label.length > sym.length) {
      return sym + label.slice(0, label.length - sym.length);
    }
  }

  // Last resort: full token reversal
  return tokens.reverse().join('');
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

  // CDXML explicit labels already include the correct hydrogen count
  // (e.g. "OH", "NH2", "CO2H") — render as formula, skip implicit H.
  // Apply label reversal when bonds come predominantly from the right
  // (Right justification) so "OH" → "HO", keeping element symbol toward the bond.
  if (atom.hasExplicitLabel && atom.label) {
    const justification = getLabelJustification(page, atomId);
    const labelText =
      justification === 'right'
        ? reverseFormulaLabel(atom.label, atom.element)
        : atom.label;
    const segments: LabelSegment[] = [];
    if (atom.isotope) {
      segments.push({ text: String(atom.isotope), style: 'superscript' });
    }
    segments.push(...formulaMode(labelText));
    if (atom.charge !== 0) {
      const mag = Math.abs(atom.charge);
      const sign = atom.charge > 0 ? '+' : '\u2013';
      const chargeStr = mag === 1 ? sign : `${mag}${sign}`;
      segments.push({ text: chargeStr, style: 'superscript' });
    }
    if (atom.radicalCount > 0) {
      segments.push({ text: '\u2022'.repeat(atom.radicalCount), style: 'normal' });
    }
    return segments;
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
