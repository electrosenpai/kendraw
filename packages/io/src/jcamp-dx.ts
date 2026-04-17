/**
 * JCAMP-DX 1D NMR parser — Wave-4 P1-03.
 *
 * Implements the subset that covers ~95 % of files exported by Bruker, JEOL
 * and MestReNova: a single XYDATA block in AFFN (ASCII Free Format Numeric)
 * with the standard set of header LDRs (Labeled-Data Records).
 *
 * Out of scope for wave-4 (deferred):
 *  - ASDF (ASCII Squeezed Difference Form) compression — most labs export AFFN
 *  - 2D NMR planes and NTUPLES
 *  - link blocks (multiple datasets in a single file)
 *
 * If the parser encounters an unsupported feature it returns a `JCAMP_DX_PARSE_ERROR`
 * rather than guessing, so callers never silently render the wrong spectrum.
 *
 * Reference: IUPAC JCAMP-DX 5.00/6.00 specification (Pure Appl. Chem., 1995).
 */

export const JCAMP_DX_PARSE_ERROR = Symbol('jcamp-dx-parse-error');

/**
 * Normalised representation of a 1D NMR spectrum imported from JCAMP-DX.
 *
 *  - `xPpm[i]` and `y[i]` are paired samples already converted to ppm (high
 *    field on the right when plotted) regardless of the source XUNITS.
 *  - `nucleus` is normalised to `'1H' | '13C' | string` for display.
 *  - `meta` preserves the most useful provenance fields so the importing user
 *    can confirm the file matches the molecule they think they are overlaying.
 */
export interface JcampNmr1D {
  title: string;
  nucleus: string;
  observeFrequencyMhz: number | null;
  solvent: string | null;
  /** ppm axis, sorted ascending (low → high). */
  xPpm: number[];
  /** Y intensities aligned with `xPpm`. */
  y: number[];
  meta: {
    npoints: number;
    firstXOriginal: number;
    lastXOriginal: number;
    xUnits: string;
    yUnits: string;
    dataType: string;
  };
}

/** Parse one JCAMP-DX file. Returns the dataset or throws a descriptive Error. */
export function parseJcampDx1D(text: string): JcampNmr1D {
  const lines = text.split(/\r?\n/);
  // Phase 1 — collect LDRs into a map. JCAMP joins continuation lines under
  // their owning LDR until the next `##KEY=` header is seen.
  const ldrs = new Map<string, string>();
  let currentKey: string | null = null;
  let currentValue: string[] = [];
  const flush = () => {
    if (currentKey !== null) {
      ldrs.set(currentKey, currentValue.join('\n').trim());
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('$$')) continue; // pure comment
    const ldrMatch = /^##([^=]+)=(.*)$/.exec(line);
    if (ldrMatch) {
      flush();
      currentKey = normaliseLdrKey(ldrMatch[1] ?? '');
      currentValue = [(ldrMatch[2] ?? '').trim()];
    } else if (currentKey !== null) {
      currentValue.push(line);
    }
  }
  flush();

  if (!ldrs.has('JCAMPDX')) {
    throw makeError('Missing ##JCAMP-DX header — file is not a JCAMP-DX dataset');
  }
  const dataType = (ldrs.get('DATATYPE') ?? '').toUpperCase();
  if (!dataType.includes('NMR')) {
    throw makeError(`Unsupported DATA TYPE: "${dataType || '(missing)'}" — only NMR SPECTRUM is implemented`);
  }
  const xydataHeader = ldrs.get('XYDATA');
  if (!xydataHeader) {
    throw makeError('Missing ##XYDATA= LDR — only single-block AFFN spectra are supported');
  }

  // Header sanity. We accept the common forms (X++(Y..Y)) and (X,Y..XY)
  // but only decode the AFFN body for the X++(Y..Y) form.
  const header = xydataHeader.split('\n')[0]?.trim() ?? '';
  if (!/^\(\s*X\+\+\(\s*Y\.\.Y\s*\)\s*\)$/i.test(header)) {
    throw makeError(
      `XYDATA format "${header}" is not (X++(Y..Y)) AFFN — wave-4 only supports the canonical NMR form`,
    );
  }

  const npoints = parseFloatLdr(ldrs, 'NPOINTS');
  const firstX = parseFloatLdr(ldrs, 'FIRSTX');
  const lastX = parseFloatLdr(ldrs, 'LASTX');
  const xUnits = (ldrs.get('XUNITS') ?? 'PPM').toUpperCase();
  const yUnits = (ldrs.get('YUNITS') ?? 'ARBITRARY').toUpperCase();
  const xFactor = parseOptionalFloatLdr(ldrs, 'XFACTOR') ?? 1;
  const yFactor = parseOptionalFloatLdr(ldrs, 'YFACTOR') ?? 1;
  const observeFrequencyMhz = parseOptionalFloatLdr(ldrs, '.OBSERVEFREQUENCY');
  const observeNucleus = ldrs.get('.OBSERVENUCLEUS') ?? ldrs.get('OBSERVENUCLEUS') ?? null;
  const solvent = ldrs.get('.SOLVENTNAME') ?? ldrs.get('SOLVENT') ?? null;
  const title = ldrs.get('TITLE') ?? '';

  // Decode the body. The first numeric on each data line is the X anchor
  // (already in XUNITS / XFACTOR, so multiply by xFactor); the rest are Y
  // samples. Successive Y values walk the X axis by deltaX = (lastX-firstX)/
  // (npoints-1). The X anchor is informational — we use the global axis
  // because file-emitted X anchors are rounded.
  const ys: number[] = [];
  const body = xydataHeader.split('\n').slice(1);
  for (const raw of body) {
    const line = raw.trim();
    if (!line || line.startsWith('$$')) continue;
    const tokens = line.split(/[\s,]+/).filter((t) => t.length > 0);
    if (tokens.length === 0) continue;
    // Skip the X anchor (first token) — see comment above.
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === undefined) continue;
      const v = Number(tok);
      if (!Number.isFinite(v)) {
        throw makeError(`Non-numeric Y sample "${tok}" in XYDATA body — wave-4 does not decode ASDF compression`);
      }
      ys.push(v * yFactor);
    }
  }

  if (ys.length === 0) {
    throw makeError('XYDATA body contained no Y samples');
  }
  if (ys.length !== npoints) {
    // Many real-world files round npoints; tolerate a 0.1% mismatch but
    // surface anything larger so the caller knows the file is inconsistent.
    const drift = Math.abs(ys.length - npoints) / Math.max(npoints, 1);
    if (drift > 0.001) {
      throw makeError(
        `XYDATA point count (${ys.length}) disagrees with ##NPOINTS (${npoints}) by ${(drift * 100).toFixed(2)}%`,
      );
    }
  }

  const xs = new Array<number>(ys.length);
  const stepX = (lastX - firstX) / Math.max(ys.length - 1, 1);
  for (let i = 0; i < ys.length; i++) {
    xs[i] = (firstX + stepX * i) * xFactor;
  }

  // Convert to ppm regardless of source units. We need observeFrequencyMhz to
  // convert from Hz; if the file omits it we refuse rather than guess (NMR
  // ppm/Hz mixups are a classic chemist trap).
  let xPpm: number[];
  if (xUnits === 'PPM') {
    xPpm = xs;
  } else if (xUnits === 'HZ') {
    if (observeFrequencyMhz === null || observeFrequencyMhz <= 0) {
      throw makeError('XUNITS=HZ requires a positive ##.OBSERVEFREQUENCY to convert to ppm');
    }
    xPpm = xs.map((hz) => hz / observeFrequencyMhz);
  } else {
    throw makeError(`Unsupported XUNITS "${xUnits}" — only PPM and HZ are implemented`);
  }

  // Sort low → high ppm for predictable downstream consumers. NMR files
  // typically arrive high → low (chemical-shift convention) — flip if needed.
  if (xPpm.length >= 2) {
    const head = xPpm[0] ?? 0;
    const tail = xPpm[xPpm.length - 1] ?? 0;
    if (head > tail) {
      xPpm = xPpm.slice().reverse();
      ys.reverse();
    }
  }

  return {
    title,
    nucleus: normaliseNucleus(observeNucleus),
    observeFrequencyMhz,
    solvent,
    xPpm,
    y: ys,
    meta: {
      npoints: ys.length,
      firstXOriginal: firstX,
      lastXOriginal: lastX,
      xUnits,
      yUnits,
      dataType,
    },
  };
}

function normaliseLdrKey(raw: string): string {
  // Per JCAMP-DX 5.00 §3.3: keys are case-insensitive and ignore spaces,
  // hyphens and slashes. So "DATA TYPE", "Data-Type" and "DATATYPE" map to
  // the same record.
  return raw.replace(/[\s\-/]/g, '').toUpperCase();
}

function parseFloatLdr(ldrs: Map<string, string>, key: string): number {
  const v = parseOptionalFloatLdr(ldrs, key);
  if (v === null) throw makeError(`Missing required ##${key}= LDR`);
  return v;
}

function parseOptionalFloatLdr(ldrs: Map<string, string>, key: string): number | null {
  const raw = ldrs.get(key);
  if (raw === undefined || raw.trim() === '') return null;
  const v = Number(raw.trim());
  if (!Number.isFinite(v)) {
    throw makeError(`##${key}= "${raw}" is not a number`);
  }
  return v;
}

function normaliseNucleus(raw: string | null): string {
  if (raw === null) return '';
  const s = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (s === '1H' || s === 'H1' || s === 'H') return '1H';
  if (s === '13C' || s === 'C13' || s === 'C') return '13C';
  return raw.trim();
}

function makeError(message: string): Error {
  const err = new Error(`JCAMP-DX parse error: ${message}`);
  (err as { kind?: symbol }).kind = JCAMP_DX_PARSE_ERROR;
  return err;
}
