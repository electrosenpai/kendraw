/**
 * ChemDraw-compatible style presets.
 * Values from docs/chemdraw-technical-reference.md Master default-value table.
 * Source: CDX/CDXML format spec, ACS guidelines, ChemDraw User Guide.
 */

export interface StylePreset {
  name: string;
  bondLengthPt: number; // PostScript points (1pt = 1/72 in)
  lineWidthPt: number; // bond stroke width
  boldWidthPt: number; // bold/stereo bond width
  marginWidthPt: number; // gap between label and bond end
  hashSpacingPt: number; // spacing between hash lines
  bondSpacing: number; // fraction of bondLength for double/triple offset
  chainAngle: number; // degrees (default 120 for sp2 zigzag)
  captionSizePt: number;
  labelFont: string;
  labelSizePt: number;
  labelFace: number; // bitmask: 96 = Formula mode (auto sub/superscript)
}

/** Derived quantities from a preset. */
export function deriveQuantities(p: StylePreset) {
  return {
    doubleBondOffsetPt: p.bondSpacing * p.bondLengthPt,
    wedgeWideEndPt: 1.5 * p.boldWidthPt,
    hashCountPerBond: Math.round(p.bondLengthPt / p.hashSpacingPt),
    hdotDiameterPt: 5 * p.lineWidthPt,
  };
}

/**
 * ACS Document 1996 — the de facto standard for publication work.
 * Source: chemdraw-technical-reference.md line 13-26
 */
export const ACS_1996: StylePreset = {
  name: 'ACS Document 1996',
  bondLengthPt: 14.4, // 0.508 cm
  lineWidthPt: 0.6,
  boldWidthPt: 2.0,
  marginWidthPt: 1.6,
  hashSpacingPt: 2.5,
  bondSpacing: 0.18, // 18%
  chainAngle: 120,
  captionSizePt: 10,
  labelFont: 'Arial',
  labelSizePt: 10,
  labelFace: 96, // Formula mode
};

/**
 * New Document — ChemDraw default for new files.
 * Source: chemdraw-technical-reference.md line 15
 */
export const NEW_DOCUMENT: StylePreset = {
  name: 'New Document',
  bondLengthPt: 30, // 1.058 cm — exact from reference
  lineWidthPt: 1.0,
  boldWidthPt: 2.0,
  marginWidthPt: 2.0,
  hashSpacingPt: 2.7,
  bondSpacing: 0.12, // 12%
  chainAngle: 120,
  captionSizePt: 12,
  labelFont: 'Arial',
  labelSizePt: 10,
  labelFace: 96,
};

/**
 * Slide / Poster — larger for projection.
 * Source: chemdraw-technical-reference.md line 15
 */
export const SLIDE_POSTER: StylePreset = {
  name: 'Slide / Poster',
  bondLengthPt: 30, // same as New Document per reference
  lineWidthPt: 1.6,
  boldWidthPt: 4.0,
  marginWidthPt: 2.0,
  hashSpacingPt: 2.7,
  bondSpacing: 0.15, // 15%
  chainAngle: 120,
  captionSizePt: 16,
  labelFont: 'Arial',
  labelSizePt: 12,
  labelFace: 96,
};

/**
 * RSC (Royal Society of Chemistry) — 1 and 2 column layouts.
 * Source: PDF Section 7a, exact parameters from the style table.
 */
export const RSC: StylePreset = {
  name: 'RSC',
  bondLengthPt: 12.2, // 0.430 cm
  lineWidthPt: 0.5,
  boldWidthPt: 1.6,
  marginWidthPt: 1.3,
  hashSpacingPt: 1.8,
  bondSpacing: 0.2, // 20%
  chainAngle: 120,
  captionSizePt: 7,
  labelFont: 'Arial',
  labelSizePt: 7,
  labelFace: 96,
};

/**
 * Wiley / Angewandte Chemie — dense style for narrow columns.
 * Source: PDF Section 7a, exact parameters from the style table.
 */
export const WILEY: StylePreset = {
  name: 'Wiley / Angewandte',
  bondLengthPt: 11.5, // 0.406 cm
  lineWidthPt: 0.5,
  boldWidthPt: 1.6,
  marginWidthPt: 1.3,
  hashSpacingPt: 2.0,
  bondSpacing: 0.18, // 18%
  chainAngle: 120,
  captionSizePt: 8,
  labelFont: 'Arial',
  labelSizePt: 8,
  labelFace: 96,
};

/**
 * Nature — same metrics as ACS 1996 but with Helvetica.
 * Source: PDF Section 7a, exact parameters from the style table.
 */
export const NATURE: StylePreset = {
  name: 'Nature',
  bondLengthPt: 14.4, // 0.508 cm (same as ACS)
  lineWidthPt: 0.6,
  boldWidthPt: 2.0,
  marginWidthPt: 1.6,
  hashSpacingPt: 2.5,
  bondSpacing: 0.18, // 18%
  chainAngle: 120,
  captionSizePt: 10,
  labelFont: 'Helvetica',
  labelSizePt: 10,
  labelFace: 96,
};

export const ALL_PRESETS: StylePreset[] = [
  ACS_1996,
  RSC,
  WILEY,
  NATURE,
  NEW_DOCUMENT,
  SLIDE_POSTER,
];

/** Convert PostScript points to pixels at 96 DPI screen resolution. */
export function ptToPx(pt: number): number {
  return pt * (96 / 72); // 1 pt = 1.333 px at 96 DPI
}

/** Get bond length in pixels for a given preset. */
export function getBondLengthPx(preset: StylePreset = NEW_DOCUMENT): number {
  return ptToPx(preset.bondLengthPt);
}

/** Get double bond offset in pixels. */
export function getDoubleBondOffsetPx(preset: StylePreset = NEW_DOCUMENT): number {
  return preset.bondSpacing * ptToPx(preset.bondLengthPt);
}

/** Get margin width in pixels. */
export function getMarginWidthPx(preset: StylePreset = NEW_DOCUMENT): number {
  return ptToPx(preset.marginWidthPt);
}

/** Get line width in pixels. */
export function getLineWidthPx(preset: StylePreset = NEW_DOCUMENT): number {
  return ptToPx(preset.lineWidthPt);
}

/** Get bold width in pixels. */
export function getBoldWidthPx(preset: StylePreset = NEW_DOCUMENT): number {
  return ptToPx(preset.boldWidthPt);
}

/** Get wedge wide end in pixels. */
export function getWedgeWidePx(preset: StylePreset = NEW_DOCUMENT): number {
  return ptToPx(1.5 * preset.boldWidthPt);
}

/**
 * Standard ring angles by ring size.
 * Interior angle = 180 × (n-2) / n
 * Source: chemdraw-technical-reference.md line 153-157
 */
export const RING_ANGLES: Record<number, number> = {
  3: 60, // cyclopropane
  4: 90, // cyclobutane
  5: 108, // cyclopentane
  6: 120, // cyclohexane / benzene
  7: 128.57, // cycloheptane
  8: 135, // cyclooctane
};

/**
 * Standard angles by hybridization.
 * Source: chemdraw-technical-reference.md line 148-151
 */
export const HYBRIDIZATION_ANGLES: Record<string, number> = {
  sp2: 120,
  sp3: 109.5,
  sp: 180,
};
