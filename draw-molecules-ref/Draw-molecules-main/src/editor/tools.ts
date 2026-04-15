import type { BondType, RingTemplate, ToolId } from '../chem/types';

export function nextBondType(current: BondType): BondType {
  const order: BondType[] = ['single', 'double', 'triple', 'wedge', 'dash', 'aromatic'];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length] ?? 'single';
}

export function elementFromKeyBuffer(buffer: string) {
  const normalized = buffer.trim();
  const lookup: Record<string, string> = {
    b: 'B',
    br: 'Br',
    c: 'C',
    cl: 'Cl',
    f: 'F',
    i: 'I',
    n: 'N',
    o: 'O',
    p: 'P',
    s: 'S',
  };
  return lookup[normalized.toLowerCase()] ?? null;
}

export function bondTypeFromShortcut(key: string): BondType | null {
  const mapping: Record<string, BondType> = {
    '1': 'single',
    '2': 'double',
    '3': 'triple',
    '4': 'wedge',
    '5': 'dash',
    '6': 'aromatic',
  };
  return mapping[key] ?? null;
}

export function ringTemplateFromKey(key: string): RingTemplate | null {
  if (key.toLowerCase() === 'r') {
    return 'benzene';
  }
  return null;
}

export function toolFromShortcut(key: string): ToolId | null {
  const lower = key.toLowerCase();
  const mapping: Record<string, ToolId> = {
    ' ': 'select',
    a: 'arrow',
    h: 'pan',
    t: 'text',
    x: 'atom',
  };
  return mapping[lower] ?? null;
}
