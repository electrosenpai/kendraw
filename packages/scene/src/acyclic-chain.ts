/**
 * Auto-draw an N-carbon acyclic zigzag chain between two screen points.
 *
 * The chain is laid out along the drag vector with 120° internal angles
 * (±30° alternating from the baseline), matching the conventional
 * zigzag depiction of an alkane skeleton.
 *
 * @param start  The anchor where the chain starts (atom 0 sits here).
 * @param end    The cursor endpoint; chain length is inferred from the
 *               projected distance along this vector.
 * @param bondLength  Standard bond length (px). Defaults to 40 px.
 * @returns      Plain-object coordinates for atoms and index pairs for
 *               bonds so the caller can mint ids and dispatch.
 */
import { STANDARD_BOND_LENGTH_PX } from './bond-geometry.js';

export interface ChainLayout {
  atoms: Array<{ x: number; y: number }>;
  bonds: Array<{ from: number; to: number }>;
}

export function layoutAcyclicChain(
  start: { x: number; y: number },
  end: { x: number; y: number },
  bondLength: number = STANDARD_BOND_LENGTH_PX,
): ChainLayout {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < bondLength * 0.6) {
    // Drag too short: two-atom ethane-like fragment so users still get feedback.
    return {
      atoms: [
        { x: start.x, y: start.y },
        { x: start.x + bondLength, y: start.y },
      ],
      bonds: [{ from: 0, to: 1 }],
    };
  }

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  // Along-baseline step per bond = bondLength * cos(30°). Use this to
  // estimate how many bonds fit in the drag distance.
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);
  const stepAlong = bondLength * cos30;
  const numBonds = Math.max(1, Math.round(dist / stepAlong));
  const numAtoms = numBonds + 1;

  const atoms: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < numAtoms; i++) {
    const along = i * stepAlong;
    const perp = i % 2 === 1 ? bondLength * sin30 : 0;
    atoms.push({
      x: start.x + along * ux + perp * nx,
      y: start.y + along * uy + perp * ny,
    });
  }

  const bonds: Array<{ from: number; to: number }> = [];
  for (let i = 0; i < numBonds; i++) {
    bonds.push({ from: i, to: i + 1 });
  }

  return { atoms, bonds };
}
