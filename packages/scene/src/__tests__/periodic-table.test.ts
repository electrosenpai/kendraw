import { describe, it, expect } from 'vitest';
import { getElement, getElementBySymbol, getSymbol, getColor, getAllElements } from '../index.js';

describe('Periodic Table', () => {
  it('getElement returns element by atomic number', () => {
    const carbon = getElement(6);
    expect(carbon).toBeDefined();
    expect(carbon?.symbol).toBe('C');
    expect(carbon?.name).toBe('Carbon');
  });

  it('getElement returns undefined for unknown Z', () => {
    expect(getElement(999)).toBeUndefined();
  });

  it('getElementBySymbol returns element by symbol', () => {
    const oxygen = getElementBySymbol('O');
    expect(oxygen).toBeDefined();
    expect(oxygen?.z).toBe(8);
  });

  it('getSymbol returns symbol string', () => {
    expect(getSymbol(7)).toBe('N');
  });

  it('getSymbol returns fallback for unknown Z', () => {
    expect(getSymbol(999)).toBe('#999');
  });

  it('getColor returns CPK color', () => {
    expect(getColor(8)).toBe('#ff0d0d'); // oxygen red
  });

  it('getAllElements returns array of elements', () => {
    const all = getAllElements();
    expect(all.length).toBeGreaterThan(20);
    expect(all[0]?.z).toBe(1);
  });
});
