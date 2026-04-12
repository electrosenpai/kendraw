import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_CATEGORIES,
  searchTemplates,
  getAllTemplates,
} from '../templates/template-library.js';

describe('Template Library', () => {
  it('has 7 categories', () => {
    expect(TEMPLATE_CATEGORIES).toHaveLength(7);
  });

  it('amino acids has 20 entries', () => {
    const aa = TEMPLATE_CATEGORIES.find((c) => c.id === 'amino-acids');
    expect(aa?.templates).toHaveLength(20);
  });

  it('each template has name and SMILES', () => {
    for (const cat of TEMPLATE_CATEGORIES) {
      for (const t of cat.templates) {
        expect(t.name).toBeTruthy();
        expect(t.smiles).toBeTruthy();
      }
    }
  });

  it('each category has at least 5 entries', () => {
    for (const cat of TEMPLATE_CATEGORIES) {
      expect(cat.templates.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('searchTemplates finds aspirin', () => {
    const results = searchTemplates('aspirin');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('Aspirin');
  });

  it('searchTemplates finds by abbreviation', () => {
    const results = searchTemplates('Gly');
    expect(results.length).toBeGreaterThan(0);
  });

  it('getAllTemplates returns all templates', () => {
    const all = getAllTemplates();
    expect(all.length).toBeGreaterThan(80);
  });

  it('searchTemplates returns empty for nonsense', () => {
    const results = searchTemplates('xyzzy123nonexistent');
    expect(results).toHaveLength(0);
  });
});
