import { describe, it, expect } from 'vitest';
import { injectSvgMetadata } from '../metadata.js';

describe('SVG metadata injection', () => {
  it('adds metadata element to SVG', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const result = injectSvgMetadata(svg, { title: 'Test', author: 'JB' });
    expect(result).toContain('<metadata>');
    expect(result).toContain('Test');
    expect(result).toContain('JB');
  });

  it('includes Kendraw generator', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const result = injectSvgMetadata(svg, {});
    expect(result).toContain('Kendraw');
  });

  it('preserves original SVG content', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="0" cy="0" r="5"/></svg>';
    const result = injectSvgMetadata(svg, {});
    expect(result).toContain('<circle');
  });
});
