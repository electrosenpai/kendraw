import { getElementBySymbol, getSymbol } from '@kendraw/scene';
import type { Atom, AtomId, Bond, BondId } from '@kendraw/scene';

export interface ParsedMol {
  atoms: Atom[];
  bonds: Bond[];
}

const SCALE = 40; // angstroms to pixels

export function parseMolV2000(molBlock: string): ParsedMol {
  const lines = molBlock.split('\n');
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];

  // Detect V3000 and reject
  if (lines.some((l) => l?.includes('V3000'))) {
    throw new Error('MOL V3000 format is not supported. Please use V2000.');
  }

  // Find counts line (line 4, 0-indexed = 3)
  let countsLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.includes('V2000')) {
      countsLineIdx = i;
      break;
    }
  }
  if (countsLineIdx < 0) return { atoms, bonds };

  const countsLine = lines[countsLineIdx] ?? '';
  const atomCount = parseInt(countsLine.substring(0, 3).trim(), 10) || 0;
  const bondCount = parseInt(countsLine.substring(3, 6).trim(), 10) || 0;

  // Parse atoms
  const atomIds: AtomId[] = [];
  for (let i = 0; i < atomCount; i++) {
    const line = lines[countsLineIdx + 1 + i];
    if (!line) continue;

    const x = parseFloat(line.substring(0, 10).trim()) * SCALE;
    // MOL files use Y-up (chemistry convention); canvas uses Y-down — negate
    const y = -parseFloat(line.substring(10, 20).trim()) * SCALE;
    const symbol = line.substring(31, 34).trim();
    const element = getElementBySymbol(symbol)?.z ?? 6;
    const chargeCode = line.length >= 39 ? parseInt(line.substring(36, 39).trim(), 10) || 0 : 0;
    const charge = chargeCode === 0 ? 0 : 4 - chargeCode;

    const id = crypto.randomUUID() as AtomId;
    atomIds.push(id);
    atoms.push({
      id,
      x,
      y,
      element,
      charge,
      radicalCount: 0,
      lonePairs: 0,
    });
  }

  // Parse bonds
  for (let i = 0; i < bondCount; i++) {
    const line = lines[countsLineIdx + 1 + atomCount + i];
    if (!line) continue;

    const from = parseInt(line.substring(0, 3).trim(), 10) - 1;
    const to = parseInt(line.substring(3, 6).trim(), 10) - 1;
    const orderVal = parseInt(line.substring(6, 9).trim(), 10) || 1;
    const stereo = parseInt(line.substring(9, 12).trim(), 10) || 0;

    const fromId = atomIds[from];
    const toId = atomIds[to];
    if (!fromId || !toId) continue;

    const order = (orderVal <= 3 ? orderVal : 1) as Bond['order'];
    let style: Bond['style'] = 'single';
    if (order === 2) style = 'double';
    else if (order === 3) style = 'triple';
    if (stereo === 1) style = 'wedge';
    else if (stereo === 6) style = 'dash';

    bonds.push({
      id: crypto.randomUUID() as BondId,
      fromAtomId: fromId,
      toAtomId: toId,
      order,
      style,
    });
  }

  return { atoms, bonds };
}

export function writeMolV2000(atoms: Atom[], bonds: Bond[]): string {
  const lines: string[] = [];

  // Header
  lines.push('  Kendraw');
  lines.push('     Kendraw  0.0.0');
  lines.push('');

  // Counts line
  const ac = atoms.length.toString().padStart(3);
  const bc = bonds.length.toString().padStart(3);
  lines.push(`${ac}${bc}  0  0  0  0  0  0  0  0999 V2000`);

  // Build atom index map
  const atomIndex = new Map<AtomId, number>();
  atoms.forEach((a, i) => atomIndex.set(a.id, i));

  // Atom block
  for (const atom of atoms) {
    const x = (atom.x / SCALE).toFixed(4).padStart(10);
    // Negate Y back to MOL convention (Y-up)
    const y = (-atom.y / SCALE).toFixed(4).padStart(10);
    const z = '    0.0000';
    const sym = getSymbol(atom.element).padEnd(3);
    const chg = atom.charge === 0 ? 0 : 4 - atom.charge;
    const chgStr = chg.toString().padStart(3);
    lines.push(`${x}${y}${z} ${sym} 0${chgStr}  0  0  0  0  0  0  0  0  0  0`);
  }

  // Bond block
  for (const bond of bonds) {
    const fromIdx = atomIndex.get(bond.fromAtomId);
    const toIdx = atomIndex.get(bond.toAtomId);
    if (fromIdx === undefined || toIdx === undefined) continue;

    const f = (fromIdx + 1).toString().padStart(3);
    const t = (toIdx + 1).toString().padStart(3);
    const o = Math.round(bond.order).toString().padStart(3);
    let stereo = 0;
    if (bond.style === 'wedge') stereo = 1;
    else if (bond.style === 'dash') stereo = 6;
    const s = stereo.toString().padStart(3);
    lines.push(`${f}${t}${o}${s}  0  0  0`);
  }

  lines.push('M  END');
  return lines.join('\n');
}
