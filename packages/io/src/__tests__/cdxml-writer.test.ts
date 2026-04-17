import { describe, it, expect } from 'vitest';
import { writeCdxml } from '../cdxml-writer.js';
import { parseCdxml } from '../cdxml-parser.js';
import type { Page, Atom, Bond, AtomId, BondId, Annotation, AnnotationId } from '@kendraw/scene';

/** Build an empty Page; tests fill in atoms/bonds inline. */
function emptyPage(): Page {
  return {
    id: 'p1',
    atoms: {},
    bonds: {},
    arrows: {},
    annotations: {},
    groups: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

function atom(id: string, x: number, y: number, element = 6, extras: Partial<Atom> = {}): Atom {
  return {
    id: id as AtomId,
    x,
    y,
    element,
    charge: 0,
    radicalCount: 0,
    lonePairs: 0,
    ...extras,
  } as Atom;
}

function bond(id: string, from: string, to: string, extras: Partial<Bond> = {}): Bond {
  return {
    id: id as BondId,
    fromAtomId: from as AtomId,
    toAtomId: to as AtomId,
    order: 1,
    style: 'single',
    ...extras,
  } as Bond;
}

describe('writeCdxml — header & boilerplate', () => {
  it('emits the XML prolog and DOCTYPE so ChemDraw will accept the file', () => {
    const xml = writeCdxml(emptyPage());
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    expect(xml).toContain('<!DOCTYPE CDXML');
    expect(xml).toContain('<CDXML CreationProgram="Kendraw"');
    expect(xml).toContain('<fonttable>');
    expect(xml).toContain('<colortable>');
  });

  it('honors a custom creator string and bond length', () => {
    const xml = writeCdxml(emptyPage(), { creator: 'TestRig', bondLengthPt: 24 });
    expect(xml).toContain('CreationProgram="TestRig"');
    expect(xml).toContain('BondLength="24"');
  });
});

describe('writeCdxml — atom serialisation', () => {
  it('omits Element attribute for carbon (CDXML default) and emits non-carbon explicitly', () => {
    const page = emptyPage();
    const c = atom('a1', 100, 100, 6);
    const o = atom('a2', 130, 100, 8);
    page.atoms[c.id] = c;
    page.atoms[o.id] = o;
    const xml = writeCdxml(page);
    // Carbon node is bare except for id+p
    expect(xml).toMatch(/<n id="1" p="[\d. ]+"\/>/);
    // Oxygen node carries Element="8"
    expect(xml).toMatch(/<n id="2" p="[\d. ]+" Element="8"\/>/);
  });

  it('writes Charge, Isotope, Radical attributes only when non-default', () => {
    const page = emptyPage();
    const cation = atom('a1', 0, 0, 7, { charge: 1 });
    const isotopic = atom('a2', 30, 0, 6, { isotope: 13 });
    const radical = atom('a3', 60, 0, 8, { radicalCount: 1 });
    page.atoms[cation.id] = cation;
    page.atoms[isotopic.id] = isotopic;
    page.atoms[radical.id] = radical;
    const xml = writeCdxml(page);
    expect(xml).toContain('Charge="1"');
    expect(xml).toContain('Isotope="13"');
    expect(xml).toContain('Radical="Doublet"');
    // No spurious zero-valued attrs on neutral C
    expect(xml).not.toContain('Charge="0"');
  });

  it('emits a <t> child when the atom carries an explicit label', () => {
    const page = emptyPage();
    const labelled = atom('a1', 0, 0, 8, { hasExplicitLabel: true, label: 'OMe' });
    page.atoms[labelled.id] = labelled;
    const xml = writeCdxml(page);
    expect(xml).toContain('<t><s font="3" size="10">OMe</s></t>');
  });
});

describe('writeCdxml — bond serialisation', () => {
  it('omits Order for single bonds and emits it for double/triple/aromatic', () => {
    const page = emptyPage();
    page.atoms['a1' as AtomId] = atom('a1', 0, 0);
    page.atoms['a2' as AtomId] = atom('a2', 30, 0);
    page.atoms['a3' as AtomId] = atom('a3', 60, 0);
    page.atoms['a4' as AtomId] = atom('a4', 90, 0);
    page.bonds['b1' as BondId] = bond('b1', 'a1', 'a2'); // single → no Order
    page.bonds['b2' as BondId] = bond('b2', 'a2', 'a3', { order: 2, style: 'double' });
    page.bonds['b3' as BondId] = bond('b3', 'a3', 'a4', { order: 1.5, style: 'aromatic' });
    const xml = writeCdxml(page);
    expect(xml).toMatch(/B="1" E="2"\/>/); // single bond — no Order
    expect(xml).toContain('Order="2"');
    expect(xml).toContain('Order="1.5"');
  });

  it('maps wedge/hash styles to ChemDraw Display attribute', () => {
    const page = emptyPage();
    page.atoms['a1' as AtomId] = atom('a1', 0, 0);
    page.atoms['a2' as AtomId] = atom('a2', 30, 0);
    page.bonds['b1' as BondId] = bond('b1', 'a1', 'a2', { style: 'wedge' });
    expect(writeCdxml(page)).toContain('Display="WedgeBegin"');
    page.bonds['b1' as BondId] = bond('b1', 'a1', 'a2', { style: 'hashed-wedge' });
    expect(writeCdxml(page)).toContain('Display="WedgedHashBegin"');
  });

  it('skips bonds whose endpoints are missing from the atom map', () => {
    const page = emptyPage();
    page.atoms['a1' as AtomId] = atom('a1', 0, 0);
    page.bonds['b1' as BondId] = bond('b1', 'a1', 'ghost');
    const xml = writeCdxml(page);
    // No <b ...> element should appear — only the lone <n> and the
    // surrounding fragment scaffolding.
    expect(xml).not.toMatch(/<b id=/);
  });
});

describe('writeCdxml — annotations', () => {
  it('emits text annotations as <t> with multi-run rich text', () => {
    const page = emptyPage();
    const ann: Annotation = {
      id: 'an1' as AnnotationId,
      x: 50,
      y: 60,
      richText: [
        { text: 'CO' },
        { text: '2', style: 'subscript' },
        { text: 'H' },
      ],
      fontSize: 12,
    };
    page.annotations[ann.id] = ann;
    const xml = writeCdxml(page);
    expect(xml).toContain('<t id="');
    expect(xml).toContain('size="12">CO</s>');
    expect(xml).toContain('face="32">2</s>'); // subscript
    expect(xml).toContain('size="12">H</s>');
  });

  it('escapes XML metacharacters in annotation text', () => {
    const page = emptyPage();
    page.annotations['an1' as AnnotationId] = {
      id: 'an1' as AnnotationId,
      x: 0,
      y: 0,
      richText: [{ text: 'A & B < C' }],
    };
    const xml = writeCdxml(page);
    expect(xml).toContain('A &amp; B &lt; C');
  });
});

describe('writeCdxml — round trip via parseCdxml', () => {
  it('preserves a 4-atom 3-bond skeleton with non-carbon, charge, and a wedge', () => {
    const page = emptyPage();
    page.atoms['a1' as AtomId] = atom('a1', 100, 100, 6);
    page.atoms['a2' as AtomId] = atom('a2', 140, 100, 7, { charge: 1 });
    page.atoms['a3' as AtomId] = atom('a3', 180, 100, 8);
    page.atoms['a4' as AtomId] = atom('a4', 220, 100, 6);
    page.bonds['b1' as BondId] = bond('b1', 'a1', 'a2', { style: 'wedge' });
    page.bonds['b2' as BondId] = bond('b2', 'a2', 'a3', { order: 2, style: 'double' });
    page.bonds['b3' as BondId] = bond('b3', 'a3', 'a4');
    const xml = writeCdxml(page);
    const parsed = parseCdxml(xml);
    expect(parsed.atoms).toHaveLength(4);
    expect(parsed.bonds).toHaveLength(3);
    // Element preservation
    const elements = parsed.atoms.map((a) => a.element).sort();
    expect(elements).toEqual([6, 6, 7, 8]);
    // Charge preservation
    expect(parsed.atoms.find((a) => a.element === 7)?.charge).toBe(1);
    // Wedge preservation
    expect(parsed.bonds.some((b) => b.style === 'wedge')).toBe(true);
    // Double bond preservation
    expect(parsed.bonds.some((b) => b.order === 2)).toBe(true);
  });

  it('round-trips an empty page without crashing the parser', () => {
    const xml = writeCdxml(emptyPage());
    const parsed = parseCdxml(xml);
    expect(parsed.atoms).toHaveLength(0);
    expect(parsed.bonds).toHaveLength(0);
  });
});
