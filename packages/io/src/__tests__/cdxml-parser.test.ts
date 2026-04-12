import { describe, it, expect } from 'vitest';
import { parseCdxml } from '../cdxml-parser.js';

const MINIMAL_CDXML = `<?xml version="1.0" encoding="UTF-8" ?>
<CDXML BondLength="14.4">
  <page>
    <fragment>
      <n id="1" p="100 100" Element="7" NumHydrogens="2"/>
      <n id="2" p="114.4 108.31"/>
      <b B="1" E="2"/>
    </fragment>
  </page>
</CDXML>`;

const BENZENE_CDXML = `<?xml version="1.0" encoding="UTF-8" ?>
<CDXML>
  <page>
    <fragment>
      <n id="1" p="100 90"/>
      <n id="2" p="112.4 97.2"/>
      <n id="3" p="112.4 111.6"/>
      <n id="4" p="100 118.8"/>
      <n id="5" p="87.6 111.6"/>
      <n id="6" p="87.6 97.2"/>
      <b B="1" E="2" Order="1.5"/>
      <b B="2" E="3" Order="1.5"/>
      <b B="3" E="4" Order="1.5"/>
      <b B="4" E="5" Order="1.5"/>
      <b B="5" E="6" Order="1.5"/>
      <b B="6" E="1" Order="1.5"/>
    </fragment>
  </page>
</CDXML>`;

describe('CDXML parser', () => {
  it('parses minimal CDXML with 2 atoms and 1 bond', () => {
    const result = parseCdxml(MINIMAL_CDXML);
    expect(result.atoms).toHaveLength(2);
    expect(result.bonds).toHaveLength(1);
  });

  it('detects nitrogen element', () => {
    const result = parseCdxml(MINIMAL_CDXML);
    expect(result.atoms[0]?.element).toBe(7); // N
  });

  it('defaults to carbon when no Element attribute', () => {
    const result = parseCdxml(MINIMAL_CDXML);
    expect(result.atoms[1]?.element).toBe(6); // C (default)
  });

  it('converts coordinates from pt to px', () => {
    const result = parseCdxml(MINIMAL_CDXML);
    // 100pt × (96/72) = 133.33px
    expect(result.atoms[0]?.x).toBeCloseTo(133.33, 0);
  });

  it('parses benzene with aromatic bonds', () => {
    const result = parseCdxml(BENZENE_CDXML);
    expect(result.atoms).toHaveLength(6);
    expect(result.bonds).toHaveLength(6);
    for (const bond of result.bonds) {
      expect(bond.order).toBe(1.5);
      expect(bond.style).toBe('aromatic');
    }
  });

  it('returns empty for empty/invalid XML', () => {
    const result = parseCdxml('not xml');
    expect(result.atoms).toHaveLength(0);
  });

  it('parses stereo bonds (wedge display)', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100"/>
      <n id="2" p="114 108"/>
      <b B="1" E="2" Display="WedgeBegin"/>
    </fragment></page></CDXML>`;
    const result = parseCdxml(cdxml);
    expect(result.bonds[0]?.style).toBe('wedge');
  });

  it('parses arrows', () => {
    const cdxml = `<CDXML><page>
      <arrow id="100" Head3D="200 90 0" Tail3D="100 90 0" ArrowheadHead="Full"/>
    </page></CDXML>`;
    const result = parseCdxml(cdxml);
    expect(result.arrows).toHaveLength(1);
    expect(result.arrows[0]?.geometry.start.x).toBeGreaterThan(0);
    expect(result.arrows[0]?.geometry.end.x).toBeGreaterThan(
      result.arrows[0]?.geometry.start.x ?? 0,
    );
  });

  it('parses free text annotations', () => {
    const cdxml = `<CDXML><page>
      <t id="50" p="150 95" LineHeight="auto"><s font="3" size="10" color="0">Aniline</s></t>
    </page></CDXML>`;
    const result = parseCdxml(cdxml);
    expect(result.annotations).toHaveLength(1);
    expect(result.annotations[0]?.richText[0]?.text).toBe('Aniline');
  });

  it('does not include node-internal text as free annotations', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100" Element="7"><t p="96 104"><s font="3" size="10" face="96">NH2</s></t></n>
    </fragment></page></CDXML>`;
    const result = parseCdxml(cdxml);
    // NH2 is inside a node, should NOT appear as free annotation
    expect(result.annotations).toHaveLength(0);
  });

  it('parses R-group labels from GenericNickname nodes', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100" NodeType="GenericNickname" GenericNickname="R"><t p="96 104"><s font="3" size="10" face="96">R3</s></t></n>
    </fragment></page></CDXML>`;
    const result = parseCdxml(cdxml);
    expect(result.atoms).toHaveLength(1);
    expect(result.atoms[0]?.label).toBe('R3');
  });

  it('preserves explicit labels and hasExplicitLabel flag from <t> elements', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100" Element="8"><t p="96 104"><s font="3" size="8" face="96">OH</s></t></n>
      <n id="2" p="114 108"/>
      <b B="1" E="2"/>
    </fragment></page></CDXML>`;
    const result = parseCdxml(cdxml);
    expect(result.atoms).toHaveLength(2);
    const oAtom = result.atoms.find(a => a.element === 8);
    expect(oAtom?.label).toBe('OH');
    expect(oAtom?.hasExplicitLabel).toBe(true);
    expect(result.bonds).toHaveLength(1);
  });

  it('parses all bonds when multiple fragments present', () => {
    const cdxml = `<CDXML><page>
      <fragment>
        <n id="1" p="100 100"/><n id="2" p="114 108"/>
        <b B="1" E="2"/>
      </fragment>
      <fragment>
        <n id="3" p="200 100"/><n id="4" p="214 108"/><n id="5" p="228 100"/>
        <b B="3" E="4"/><b B="4" E="5" Order="2"/>
      </fragment>
    </page></CDXML>`;
    const result = parseCdxml(cdxml);
    expect(result.atoms).toHaveLength(5);
    expect(result.bonds).toHaveLength(3);
  });
});
