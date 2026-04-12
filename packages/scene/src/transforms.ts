import type { Atom } from './types.js';

export function rotateAtoms(
  atoms: Atom[],
  centerX: number,
  centerY: number,
  angleRad: number,
): Atom[] {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return atoms.map((a) => {
    const dx = a.x - centerX;
    const dy = a.y - centerY;
    return {
      ...a,
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  });
}

export function snapAngle(angleRad: number, snapDeg: number = 15): number {
  const snapRad = (snapDeg * Math.PI) / 180;
  return Math.round(angleRad / snapRad) * snapRad;
}

export function mirrorAtomsH(atoms: Atom[], centerX: number): Atom[] {
  return atoms.map((a) => ({
    ...a,
    x: 2 * centerX - a.x,
  }));
}

export function mirrorAtomsV(atoms: Atom[], centerY: number): Atom[] {
  return atoms.map((a) => ({
    ...a,
    y: 2 * centerY - a.y,
  }));
}

export function computeCenter(atoms: Atom[]): { x: number; y: number } {
  if (atoms.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  for (const a of atoms) {
    sumX += a.x;
    sumY += a.y;
  }
  return { x: sumX / atoms.length, y: sumY / atoms.length };
}
