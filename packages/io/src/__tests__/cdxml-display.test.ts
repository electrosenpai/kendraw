import { describe, it, expect } from 'vitest';
import { parseCdxml } from '../cdxml-parser.js';

describe('CDXML bond display parsing', () => {
  it('parses Display="WedgeBegin" as wedge', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100"/><n id="2" p="114 108"/>
      <b B="1" E="2" Display="WedgeBegin"/>
    </fragment></page></CDXML>`;
    const r = parseCdxml(cdxml);
    expect(r.bonds).toHaveLength(1);
    expect(r.bonds[0]?.style).toBe('wedge');
  });

  it('parses Display="WedgedHashBegin" as hashed-wedge', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100"/><n id="2" p="114 108"/>
      <b B="1" E="2" Display="WedgedHashBegin"/>
    </fragment></page></CDXML>`;
    const r = parseCdxml(cdxml);
    expect(r.bonds[0]?.style).toBe('hashed-wedge');
  });

  it('parses Display="Wavy" as wavy', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100"/><n id="2" p="114 108"/>
      <b B="1" E="2" Display="Wavy"/>
    </fragment></page></CDXML>`;
    const r = parseCdxml(cdxml);
    expect(r.bonds[0]?.style).toBe('wavy');
  });

  it('parses Display="Bold" as bold', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100"/><n id="2" p="114 108"/>
      <b B="1" E="2" Display="Bold"/>
    </fragment></page></CDXML>`;
    const r = parseCdxml(cdxml);
    expect(r.bonds[0]?.style).toBe('bold');
  });

  it('bond without Display defaults to single', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100"/><n id="2" p="114 108"/>
      <b B="1" E="2"/>
    </fragment></page></CDXML>`;
    const r = parseCdxml(cdxml);
    expect(r.bonds[0]?.style).toBe('single');
  });

  it('parses the real CDXML wavy bond from user file', () => {
    // This is the exact bond from the user's CDXML file
    const cdxml = `<CDXML><page><fragment>
      <n id="4575" p="782.63 93" Element="8"/>
      <n id="4578" p="795.10 85.80"/>
      <b id="4596" B="4575" E="4578" Display="Wavy" BS="N"/>
    </fragment></page></CDXML>`;
    const r = parseCdxml(cdxml);
    expect(r.bonds).toHaveLength(1);
    expect(r.bonds[0]?.style).toBe('wavy');
  });

  it('parses numeric Display values (CDX binary encoding)', () => {
    const cdxml = `<CDXML><page><fragment>
      <n id="1" p="100 100"/><n id="2" p="114 108"/>
      <n id="3" p="100 122"/><n id="4" p="86 108"/>
      <n id="5" p="114 92"/>
      <b B="1" E="2" Display="6"/>
      <b B="1" E="3" Display="3"/>
      <b B="1" E="4" Display="9"/>
      <b B="1" E="5" Display="5"/>
    </fragment></page></CDXML>`;
    const r = parseCdxml(cdxml);
    expect(r.bonds[0]?.style).toBe('wedge');
    expect(r.bonds[1]?.style).toBe('hashed-wedge');
    expect(r.bonds[2]?.style).toBe('hollow-wedge');
    expect(r.bonds[3]?.style).toBe('bold');
  });

  it('parses all stereo bond types (string + numeric + end variants)', () => {
    const cdxml = `<CDXML><page>
      <fragment>
        <n id="1" p="80 80"/><n id="2" p="80 55"/><n id="3" p="80 105"/>
        <n id="4" p="55 80"/><n id="5" p="105 80"/>
        <b B="1" E="2" Display="WedgeBegin"/>
        <b B="1" E="3" Display="WedgedHashBegin"/>
        <b B="1" E="4"/><b B="1" E="5"/>
      </fragment>
      <fragment>
        <n id="11" p="200 80"/><n id="12" p="200 55"/><n id="13" p="200 105"/>
        <n id="14" p="175 80"/><n id="15" p="225 80"/>
        <b B="11" E="12" Display="6"/>
        <b B="11" E="13" Display="3"/>
        <b B="11" E="14" Display="9"/>
        <b B="11" E="15" Display="5"/>
      </fragment>
      <fragment>
        <n id="21" p="140 160"/><n id="22" p="140 135"/><n id="23" p="140 185"/>
        <n id="24" p="115 160"/><n id="25" p="165 160"/>
        <b B="21" E="22" Display="WedgeEnd"/>
        <b B="21" E="23" Display="WedgedHashEnd"/>
        <b B="21" E="24" Display="10"/>
        <b B="21" E="25" Display="8"/>
      </fragment>
    </page></CDXML>`;
    const r = parseCdxml(cdxml);

    expect(r.bonds).toHaveLength(12);

    const styles = r.bonds.map((b) => b.style);
    // String Display values
    expect(styles).toContain('wedge');
    expect(styles).toContain('hashed-wedge');
    // Numeric Display values
    expect(styles).toContain('hollow-wedge');
    expect(styles).toContain('bold');
    // End variants + wavy
    expect(styles).toContain('wedge-end');
    expect(styles).toContain('hashed-wedge-end');
    expect(styles).toContain('hollow-wedge-end');
    expect(styles).toContain('wavy');
  });
});
