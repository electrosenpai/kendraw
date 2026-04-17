import type { Atom, Bond } from '@kendraw/scene';
import { parseMolV2000 } from './mol-v2000.js';
import { parseSmiles } from './smiles-parser.js';
import { deserializeKdx } from './kdx-serializer.js';

export type ClipboardKind = 'mol' | 'smiles' | 'kdx' | 'unknown';

export interface ClipboardParseResult {
  kind: ClipboardKind;
  atoms: Atom[];
  bonds: Bond[];
}

const MOL_V2000_PATTERN = /\bV2000\b/;
const MOL_END_PATTERN = /\bM {2}END\b/;
const SMILES_PATTERN = /^[A-Za-z0-9@+\-.=#$()[\]/\\%]+$/;

/**
 * Sniff a text payload from the OS clipboard and route it to the appropriate
 * parser. Recognized formats (in priority order): KDX JSON, MOL V2000, SMILES.
 *
 * Returns kind='unknown' with empty atoms/bonds when nothing matches.
 */
export function parseTextClipboard(text: string): ClipboardParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { kind: 'unknown', atoms: [], bonds: [] };

  if (trimmed.startsWith('{') && trimmed.includes('"formatVersion"')) {
    try {
      const doc = deserializeKdx(trimmed);
      const page = doc.pages[0];
      if (page) {
        return {
          kind: 'kdx',
          atoms: Object.values(page.atoms),
          bonds: Object.values(page.bonds),
        };
      }
    } catch {
      // Fall through to other sniffers.
    }
  }

  if (MOL_V2000_PATTERN.test(trimmed) && MOL_END_PATTERN.test(trimmed)) {
    try {
      const { atoms, bonds } = parseMolV2000(trimmed);
      if (atoms.length > 0) return { kind: 'mol', atoms, bonds };
    } catch {
      // Fall through.
    }
  }

  const firstLine = trimmed.split('\n')[0] ?? '';
  if (firstLine.length <= 500 && SMILES_PATTERN.test(firstLine) && /[A-Za-z]/.test(firstLine)) {
    try {
      const { atoms, bonds } = parseSmiles(firstLine);
      if (atoms.length > 0) return { kind: 'smiles', atoms, bonds };
    } catch {
      // Fall through.
    }
  }

  return { kind: 'unknown', atoms: [], bonds: [] };
}
