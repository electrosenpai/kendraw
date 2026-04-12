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
});
