/**
 * Hydrogen bond and non-covalent interaction geometry — Section 6.
 */

export interface HBondEntry {
  type: string;
  daDist: [number, number]; // donor-acceptor distance range (Å)
  haDist: [number, number]; // H...A distance range (Å)
  angle: [number, number]; // D-H...A angle range (°)
}

export const HBOND_GEOMETRY: HBondEntry[] = [
  { type: 'O-H...O strong', daDist: [2.5, 2.8], haDist: [1.5, 1.9], angle: [160, 180] },
  { type: 'O-H...O moderate', daDist: [2.8, 3.2], haDist: [1.9, 2.3], angle: [140, 180] },
  { type: 'N-H...O amide-carbonyl', daDist: [2.8, 3.1], haDist: [1.8, 2.2], angle: [150, 180] },
  { type: 'N-H...N', daDist: [2.8, 3.1], haDist: [1.8, 2.2], angle: [150, 180] },
  { type: 'O-H...N', daDist: [2.7, 3.0], haDist: [1.7, 2.1], angle: [150, 180] },
  { type: 'C-H...O weak', daDist: [3.0, 3.5], haDist: [2.2, 2.8], angle: [120, 180] },
  { type: 'N-H...S', daDist: [3.3, 3.6], haDist: [2.3, 2.7], angle: [140, 180] },
  { type: 'O-H...F', daDist: [2.5, 2.8], haDist: [1.5, 1.9], angle: [150, 180] },
];

export interface NonCovalentEntry {
  type: string;
  distance: [number, number]; // range (Å)
  angle?: [number, number]; // optional angle constraint
}

export const NON_COVALENT: NonCovalentEntry[] = [
  { type: 'salt bridge COO-...NH3+', distance: [2.7, 3.5] },
  { type: 'pi-pi parallel stacking', distance: [3.3, 4.0] },
  { type: 'pi-pi T-shaped', distance: [4.5, 5.5], angle: [80, 100] },
  { type: 'cation-pi', distance: [3.0, 4.0] },
  { type: 'halogen bond C-X...Y', distance: [2.8, 3.5], angle: [160, 180] },
  { type: 'chalcogen bond C=O...S', distance: [3.0, 3.5] },
  { type: 'CH-pi', distance: [2.5, 3.0] },
  { type: 'anion-pi', distance: [3.0, 3.5] },
];
