import { describe, expect, it } from 'vitest';
import { createExampleDocument } from './ocl';
import { buildProtonDisplayModel } from './proton-numbering';

describe('buildProtonDisplayModel', () => {
  it('assigns stable locants for a simple alcohol', () => {
    const document = createExampleDocument('CCO', 'Ethanol');
    const model = buildProtonDisplayModel(document);

    expect(model.assignments.map((entry) => entry.assignment).sort()).toEqual([
      'H-1',
      'H-2',
      'H-3',
    ]);
    expect(model.overlayLabels.map((entry) => entry.label).sort()).toEqual(['1', '2', '3']);
  });

  it('collapses symmetry-related aromatic protons into shared locants', () => {
    const document = createExampleDocument('Cc1ccccc1', 'Toluene');
    const model = buildProtonDisplayModel(document);

    expect(model.assignments.some((entry) => entry.assignment.includes('/'))).toBe(true);
  });

  it('adds a and b suffixes for diastereotopic proton pairs on the same atom', () => {
    const document = createExampleDocument('CC[C@H](F)CO', 'Chiral alcohol');
    const model = buildProtonDisplayModel(document);
    const suffixesByLocant = new Map<string, Set<string>>();

    for (const entry of model.assignments) {
      const locants = entry.assignment.split('/').map((token) => token.replace(/^H-/, ''));
      for (const locant of locants) {
        const match = locant.match(/^(\d+)([a-z]+)$/);
        if (!match) {
          continue;
        }

        const current = suffixesByLocant.get(match[1]);
        if (current) {
          current.add(match[2]);
        } else {
          suffixesByLocant.set(match[1], new Set([match[2]]));
        }
      }
    }

    expect(
      [...suffixesByLocant.values()].some((suffixes) => suffixes.has('a') && suffixes.has('b')),
    ).toBe(true);
  });
});
