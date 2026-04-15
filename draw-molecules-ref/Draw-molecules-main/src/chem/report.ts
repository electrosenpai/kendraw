import {
  buildProtonDisplayModel,
  normalizeProtonAtomKey,
  type ProtonDisplayModel,
} from './proton-numbering';
import { exportSvg } from './ocl';
import type {
  ChemicalDocument,
  ChemicalInsights,
  NmrPredictionResult,
  NmrSignal,
  NmrSpectrum,
  NmrSolventId,
} from './types';

interface AnalyticalReportOptions {
  document: ChemicalDocument;
  insights: ChemicalInsights;
  prediction: NmrPredictionResult;
  solvent: NmrSolventId;
  title?: string;
  generatedAt?: Date;
}

export function createAnalyticalReportHtml(options: AnalyticalReportOptions) {
  const generatedAt = options.generatedAt ?? new Date();
  const structureSvg = exportSvg(options.document);
  const protonDisplay = safeBuildProtonDisplayModel(options.document);
  const reportTitle = options.title?.trim() || options.document.name || 'Untitled Structure';
  const warnings = collectWarnings(options.insights, options.prediction);
  const protonSpectrum = options.prediction.proton;
  const carbonSpectrum = options.prediction.carbon;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(reportTitle)} - Analytical Report</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #152033;
        --muted: #5f6c82;
        --line: #d7deea;
        --panel: #ffffff;
        --soft: #f5f7fb;
        --soft-strong: #edf2fa;
        --accent: #102f63;
        --accent-soft: rgba(16, 47, 99, 0.08);
        --warning: #9b4b18;
        --shadow: 0 22px 60px rgba(16, 31, 61, 0.08);
        font-family: "IBM Plex Sans", "Aptos", "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(16, 47, 99, 0.08), transparent 24%),
          linear-gradient(180deg, #eef3fb 0%, #f8f9fc 100%);
        color: var(--ink);
      }

      main {
        width: min(1180px, calc(100vw - 48px));
        margin: 0 auto;
        padding: 32px 0 44px;
      }

      .report-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.95fr);
        gap: 18px;
        margin-bottom: 18px;
      }

      .card {
        background: var(--panel);
        border: 1px solid rgba(21, 32, 51, 0.08);
        border-radius: 24px;
        box-shadow: var(--shadow);
      }

      .hero-copy {
        padding: 28px;
      }

      .eyebrow {
        display: inline-block;
        margin-bottom: 10px;
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--muted);
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(32px, 4vw, 46px);
        line-height: 1.02;
      }

      .hero-subtitle {
        margin-top: 10px;
        max-width: 62ch;
        color: var(--muted);
        line-height: 1.55;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 22px;
      }

      .hero-metric {
        padding: 14px 16px;
        border-radius: 18px;
        background: var(--soft);
        border: 1px solid var(--line);
      }

      .hero-metric span {
        display: block;
        font-size: 12px;
        color: var(--muted);
        margin-bottom: 6px;
      }

      .hero-metric strong {
        font-size: 18px;
      }

      .hero-meta {
        padding: 24px;
        display: grid;
        gap: 14px;
        align-content: start;
      }

      .meta-row {
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
      }

      .meta-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .meta-row span {
        display: block;
        margin-bottom: 5px;
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .meta-row strong,
      .meta-row code {
        font-size: 14px;
        line-height: 1.45;
      }

      code {
        font-family: "IBM Plex Mono", "Consolas", monospace;
        word-break: break-word;
      }

      .summary-layout {
        display: grid;
        grid-template-columns: minmax(320px, 0.95fr) minmax(0, 1.05fr);
        gap: 18px;
        margin-bottom: 18px;
      }

      .structure-card,
      .summary-card {
        padding: 24px;
      }

      .structure-frame {
        min-height: 300px;
        margin-top: 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background:
          radial-gradient(circle at top right, rgba(16, 47, 99, 0.06), transparent 28%),
          linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%);
        display: grid;
        place-items: center;
        padding: 18px;
      }

      .structure-frame svg {
        width: 100%;
        height: auto;
        max-height: 340px;
      }

      .summary-grid {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .summary-metric {
        border: 1px solid var(--line);
        background: var(--soft);
        border-radius: 16px;
        padding: 14px 16px;
      }

      .summary-metric span {
        display: block;
        font-size: 12px;
        color: var(--muted);
        margin-bottom: 6px;
      }

      .summary-metric strong {
        font-size: 17px;
      }

      .inline-report {
        margin-top: 18px;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%);
        line-height: 1.6;
      }

      .report-section {
        margin-top: 18px;
        padding: 24px;
      }

      .section-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 18px;
      }

      .section-copy p {
        margin-top: 8px;
        color: var(--muted);
        line-height: 1.55;
      }

      .badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(16, 47, 99, 0.12);
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 13px;
        font-weight: 600;
      }

      .spectrum-card {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background:
          linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%);
        overflow: hidden;
      }

      .spectrum-card svg {
        width: 100%;
        height: auto;
        display: block;
      }

      .empty-state {
        padding: 22px;
        border-radius: 18px;
        border: 1px dashed var(--line);
        background: var(--soft);
        color: var(--muted);
        line-height: 1.55;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
        font-size: 14px;
      }

      th,
      td {
        padding: 12px 10px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
      }

      th {
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      tbody tr:nth-child(even) {
        background: rgba(237, 242, 250, 0.45);
      }

      .signal-tag {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--soft-strong);
        border: 1px solid var(--line);
        font-weight: 600;
      }

      .warning-list {
        margin: 16px 0 0;
        padding-left: 18px;
        color: var(--warning);
      }

      .warning-list li + li {
        margin-top: 8px;
      }

      .muted {
        color: var(--muted);
      }

      .footer-note {
        margin-top: 18px;
        font-size: 13px;
        color: var(--muted);
        line-height: 1.55;
      }

      @media (max-width: 980px) {
        main {
          width: min(100vw - 24px, 980px);
          padding-top: 16px;
        }

        .report-hero,
        .summary-layout {
          grid-template-columns: 1fr;
        }

        .hero-grid,
        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .hero-grid,
        .summary-grid {
          grid-template-columns: 1fr;
        }

        .hero-copy,
        .hero-meta,
        .structure-card,
        .summary-card,
        .report-section {
          padding: 18px;
        }
      }

      @media print {
        body {
          background: #ffffff;
        }

        main {
          width: 100%;
          padding: 0;
        }

        .card {
          box-shadow: none;
          break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="report-hero">
        <article class="card hero-copy">
          <span class="eyebrow">ChemCanvas analytical report</span>
          <h1>${escapeHtml(reportTitle)}</h1>
          <p class="hero-subtitle">
            Structure intelligence and predicted NMR output compiled from the current drawing. This report is designed
            to be shared, printed, or exported to PDF without re-running the application.
          </p>
          <div class="hero-grid">
            ${renderHeroMetric('Formula', options.insights.formula || '-', false)}
            ${renderHeroMetric('Average MW', formatNumber(options.insights.averageMass, 4), false)}
            ${renderHeroMetric('Exact mass', formatNumber(options.insights.exactMass, 4), false)}
            ${renderHeroMetric('Solvent', options.solvent, false)}
          </div>
        </article>

        <aside class="card hero-meta">
          ${renderMetaRow('Generated', formatDate(generatedAt))}
          ${renderMetaRow('SMILES', options.insights.smiles ? `<code>${escapeHtml(options.insights.smiles)}</code>` : '-')}
          ${renderMetaRow('Lipinski', escapeHtml(options.insights.lipinski))}
          ${renderMetaRow('Prediction status', escapeHtml(resolvePredictionStatus(options.prediction)))}
        </aside>
      </section>

      <section class="summary-layout">
        <article class="card structure-card">
          <span class="eyebrow">Structure snapshot</span>
          <h2>Molecule</h2>
          <div class="structure-frame">${structureSvg}</div>
        </article>

        <article class="card summary-card">
          <span class="eyebrow">Chemical overview</span>
          <h2>Computed properties</h2>
          <div class="summary-grid">
            ${renderSummaryMetric('IHD', options.insights.degreeOfUnsaturation ?? '-')}
            ${renderSummaryMetric('cLogP', options.insights.logP !== null ? options.insights.logP.toFixed(2) : '-')}
            ${renderSummaryMetric('TPSA', options.insights.tpsa !== null ? options.insights.tpsa.toFixed(2) : '-')}
            ${renderSummaryMetric('HBA / HBD', `${options.insights.acceptors} / ${options.insights.donors}`)}
            ${renderSummaryMetric('Rings', `${options.insights.ringCount} (${options.insights.aromaticRingCount} aromatic)`)}
            ${renderSummaryMetric('Stereo', `${options.insights.stereoCenters}`)}
            ${renderSummaryMetric('Rotatable bonds', `${options.insights.rotatableBonds}`)}
            ${renderSummaryMetric('Adducts', options.insights.adducts.length > 0 ? `${options.insights.adducts.length} calculated` : 'None')}
            ${renderSummaryMetric('Warnings', `${warnings.length}`)}
          </div>
          ${renderInlineReport(protonSpectrum, protonDisplay)}
          ${renderInlineReport(carbonSpectrum, protonDisplay)}
        </article>
      </section>

      ${renderSpectrumSection({
        title: 'Predicted 1H NMR',
        description:
          'Environment-based shift and multiplicity table synchronized with the current structure.',
        spectrum: protonSpectrum,
        nucleus: '1H',
        protonDisplay,
      })}

      ${renderSpectrumSection({
        title: 'Predicted 13C NMR',
        description:
          'Predicted carbon environments for the current structure and solvent selection.',
        spectrum: carbonSpectrum,
        nucleus: '13C',
        protonDisplay,
      })}

      <section class="card report-section">
        <div class="section-header">
          <div class="section-copy">
            <span class="eyebrow">Analytical notes</span>
            <h2>Warnings and composition</h2>
            <p>Validation output from the drawing engine and prediction pipeline, plus computed elemental composition.</p>
          </div>
        </div>

        ${
          warnings.length > 0
            ? `<ul class="warning-list">${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>`
            : `<div class="empty-state">No structural or prediction warnings were returned for this structure.</div>`
        }

        ${renderElementalAnalysis(options.insights)}

        <p class="footer-note">
          Predicted NMR values are computational estimates derived from the current 2D structure and solvent selection.
          Experimental acquisition, concentration effects, exchange, conformational averaging, and stereochemical
          uncertainty can shift the final result.
        </p>
      </section>
    </main>
  </body>
</html>`;
}

function renderSpectrumSection(options: {
  title: string;
  description: string;
  spectrum: NmrSpectrum | null;
  nucleus: '1H' | '13C';
  protonDisplay: ProtonDisplayModel | null;
}) {
  if (!options.spectrum) {
    return `<section class="card report-section">
      <div class="section-header">
        <div class="section-copy">
          <span class="eyebrow">NMR block</span>
          <h2>${escapeHtml(options.title)}</h2>
          <p>${escapeHtml(options.description)}</p>
        </div>
      </div>
      <div class="empty-state">No ${escapeHtml(options.nucleus)} prediction is available for the current structure.</div>
    </section>`;
  }

  return `<section class="card report-section">
    <div class="section-header">
      <div class="section-copy">
        <span class="eyebrow">NMR block</span>
        <h2>${escapeHtml(options.title)}</h2>
        <p>${escapeHtml(options.description)}</p>
      </div>
      <div class="badge-row">
        <span class="badge">${escapeHtml(options.spectrum.methodLabel)}</span>
        <span class="badge">${escapeHtml(options.spectrum.frequencyMHz.toFixed(2))} MHz</span>
        <span class="badge">${escapeHtml(options.spectrum.solvent)}</span>
      </div>
    </div>

    <div class="spectrum-card">${renderSpectrumSvg(options.spectrum, options.protonDisplay)}</div>

    ${renderSignalTable(options.spectrum, options.protonDisplay)}
  </section>`;
}

function renderSignalTable(spectrum: NmrSpectrum, protonDisplay: ProtonDisplayModel | null) {
  if (spectrum.signals.length === 0) {
    return `<div class="empty-state">No resolved ${escapeHtml(spectrum.nucleus)} signals were generated.</div>`;
  }

  return `<table>
    <thead>
      <tr>
        <th>Assignment</th>
        <th>Shift</th>
        <th>Multiplicity</th>
        <th>Integral</th>
        <th>J</th>
        <th>Confidence</th>
      </tr>
    </thead>
    <tbody>
      ${spectrum.signals.map((signal) => renderSignalRow(signal, spectrum, protonDisplay)).join('')}
    </tbody>
  </table>`;
}

function renderSignalRow(
  signal: NmrSignal,
  spectrum: NmrSpectrum,
  protonDisplay: ProtonDisplayModel | null,
) {
  const assignment = resolveSignalAssignment(signal, spectrum.nucleus, protonDisplay);
  const shift = `${signal.delta.toFixed(spectrum.nucleus === '1H' ? 3 : 2)} ppm`;
  const integral = spectrum.nucleus === '1H' ? `${signal.integral}H` : '1C';
  const couplingText =
    signal.couplingConstants.length > 0
      ? signal.couplingConstants.map((value) => `${value.toFixed(1)} Hz`).join(', ')
      : '-';

  return `<tr>
    <td><span class="signal-tag">${escapeHtml(assignment)}</span></td>
    <td>${escapeHtml(shift)}</td>
    <td>${escapeHtml(signal.multiplicity)}</td>
    <td>${escapeHtml(integral)}</td>
    <td>${escapeHtml(couplingText)}</td>
    <td>${escapeHtml(signal.confidence !== null ? `${Math.round(signal.confidence * 100)}%` : 'n/a')}</td>
  </tr>`;
}

function renderElementalAnalysis(insights: ChemicalInsights) {
  if (insights.elementalAnalysis.length === 0) {
    return `<div class="empty-state" style="margin-top: 18px;">No elemental composition is available for the current structure.</div>`;
  }

  return `<table>
    <thead>
      <tr>
        <th>Element</th>
        <th>Weight percent</th>
      </tr>
    </thead>
    <tbody>
      ${insights.elementalAnalysis.map((entry) => `<tr><td>${escapeHtml(entry.element)}</td><td>${escapeHtml(entry.percent.toFixed(2))}%</td></tr>`).join('')}
    </tbody>
  </table>`;
}

function renderSpectrumSvg(spectrum: NmrSpectrum, protonDisplay: ProtonDisplayModel | null) {
  const width = 940;
  const height = 280;
  const padding = { top: 48, right: 28, bottom: 34, left: 28 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const baselineY = padding.top + plotHeight;
  const maxIntensity = Math.max(
    1,
    ...spectrum.y.map((value) => (Number.isFinite(value) ? value : 0)),
  );
  const linePath = spectrum.x
    .map((ppm, index) => {
      const x = ppmToX(ppm, spectrum.range.min, spectrum.range.max, padding.left, plotWidth);
      const y = baselineY - ((spectrum.y[index] ?? 0) / maxIntensity) * (plotHeight - 14);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  const areaPath = `${linePath} L ${padding.left + plotWidth} ${baselineY} L ${padding.left} ${baselineY} Z`;
  const ticks = createTicks(spectrum);
  const annotations = createSpectrumAnnotations(
    spectrum,
    protonDisplay,
    padding.left,
    plotWidth,
    baselineY,
    plotHeight,
    width,
  );

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(spectrum.nucleus)} predicted spectrum">
    <defs>
      <linearGradient id="report-fill-${spectrum.nucleus}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#1b2435" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#1b2435" stop-opacity="0.02" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="20" fill="#ffffff" />
    ${ticks
      .map((tick) => {
        const x = ppmToX(tick, spectrum.range.min, spectrum.range.max, padding.left, plotWidth);
        return `<g>
        <line x1="${x.toFixed(2)}" y1="${padding.top}" x2="${x.toFixed(2)}" y2="${baselineY}" stroke="#d7deea" stroke-width="1" />
        <text x="${x.toFixed(2)}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#5f6c82">${tick}</text>
      </g>`;
      })
      .join('')}
    <line x1="${padding.left}" y1="${baselineY}" x2="${padding.left + plotWidth}" y2="${baselineY}" stroke="#1b2435" stroke-width="1.2" />
    <path d="${areaPath}" fill="url(#report-fill-${spectrum.nucleus})" />
    <path d="${linePath}" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    ${annotations.map((annotation) => renderSpectrumAnnotation(annotation)).join('')}
    <text x="${width - 16}" y="${height - 10}" text-anchor="end" font-size="12" fill="#5f6c82">ppm</text>
  </svg>`;
}

function renderSpectrumAnnotation(
  annotation: ReturnType<typeof createSpectrumAnnotations>[number],
) {
  return `<g>
    <line
      x1="${annotation.x.toFixed(2)}"
      y1="${annotation.calloutBottom.toFixed(2)}"
      x2="${annotation.x.toFixed(2)}"
      y2="${(annotation.peakY - 4).toFixed(2)}"
      stroke="#7d8aa3"
      stroke-width="1.1"
    />
    <rect
      x="${annotation.boxX.toFixed(2)}"
      y="${annotation.boxY.toFixed(2)}"
      width="${annotation.boxWidth.toFixed(2)}"
      height="${annotation.boxHeight.toFixed(2)}"
      rx="9"
      fill="#ffffff"
      stroke="#d7deea"
    />
    <text x="${annotation.boxCenterX.toFixed(2)}" y="${(annotation.boxY + 11).toFixed(2)}" text-anchor="middle" font-size="10.5" fill="#102f63" font-weight="700">
      ${escapeHtml(annotation.label)}
    </text>
    <text x="${annotation.boxCenterX.toFixed(2)}" y="${(annotation.boxY + 21).toFixed(2)}" text-anchor="middle" font-size="9.5" fill="#5f6c82">
      ${escapeHtml(annotation.subLabel)}
    </text>
  </g>`;
}

function renderInlineReport(
  spectrum: NmrSpectrum | null,
  protonDisplay: ProtonDisplayModel | null,
) {
  if (!spectrum) {
    return '';
  }

  const entries = spectrum.signals.slice(0, 10).map((signal) => {
    const assignment = resolveSignalAssignment(signal, spectrum.nucleus, protonDisplay);
    const deltaText = spectrum.nucleus === '1H' ? signal.delta.toFixed(3) : signal.delta.toFixed(2);
    const integralText = spectrum.nucleus === '1H' ? `, ${signal.integral}H` : '';
    const couplingText =
      signal.couplingConstants.length > 0
        ? `, J = ${signal.couplingConstants.map((value) => value.toFixed(1)).join(', ')} Hz`
        : '';
    return `${assignment} ${deltaText} (${signal.multiplicity}${couplingText}${integralText})`;
  });

  const label = spectrum.nucleus === '1H' ? '<sup>1</sup>H' : '<sup>13</sup>C';
  return `<p class="inline-report"><strong>${label} NMR</strong> (${escapeHtml(spectrum.frequencyMHz.toFixed(2))} MHz, ${escapeHtml(spectrum.solvent)}) &delta; ${escapeHtml(entries.join('; '))}${spectrum.signals.length > 10 ? '; ...' : ''}</p>`;
}

function createSpectrumAnnotations(
  spectrum: NmrSpectrum,
  protonDisplay: ProtonDisplayModel | null,
  left: number,
  plotWidth: number,
  baselineY: number,
  plotHeight: number,
  width: number,
) {
  const rowAnchorYs = [14, 29, 44];
  const rowSpacing = spectrum.nucleus === '1H' ? 48 : 58;
  const rowRightEdges = rowAnchorYs.map(() => Number.NEGATIVE_INFINITY);
  const maxAnnotations = spectrum.nucleus === '1H' ? 8 : 10;

  return spectrum.signals
    .slice(0, maxAnnotations)
    .map((signal) => {
      const x = ppmToX(signal.delta, spectrum.range.min, spectrum.range.max, left, plotWidth);
      const peakY = baselineY - intensityAtDelta(spectrum, signal.delta) * (plotHeight - 14);
      const assignment = resolveSignalAssignment(signal, spectrum.nucleus, protonDisplay);
      const label = spectrum.nucleus === '1H' ? `${assignment} ${signal.multiplicity}` : assignment;
      const subLabel =
        spectrum.nucleus === '1H'
          ? `${signal.delta.toFixed(2)} ppm`
          : `${signal.delta.toFixed(1)} ppm`;
      const boxWidth = Math.max(48, Math.max(label.length * 6.1 + 18, subLabel.length * 5.2 + 14));

      return {
        signal,
        x,
        peakY,
        label,
        subLabel,
        boxWidth,
        boxHeight: 26,
      };
    })
    .sort((leftAnnotation, rightAnnotation) => leftAnnotation.x - rightAnnotation.x)
    .map((annotation) => {
      let rowIndex = 0;
      while (
        rowIndex < rowRightEdges.length &&
        annotation.x - rowRightEdges[rowIndex] < rowSpacing
      ) {
        rowIndex += 1;
      }
      if (rowIndex >= rowRightEdges.length) {
        rowIndex = rowRightEdges.indexOf(Math.min(...rowRightEdges));
      }

      rowRightEdges[rowIndex] = annotation.x + annotation.boxWidth / 2;
      const boxCenterX = clamp(
        annotation.x,
        12 + annotation.boxWidth / 2,
        width - 12 - annotation.boxWidth / 2,
      );
      const boxY = rowAnchorYs[rowIndex];

      return {
        ...annotation,
        boxCenterX,
        boxX: boxCenterX - annotation.boxWidth / 2,
        boxY,
        calloutBottom: boxY + annotation.boxHeight,
      };
    });
}

function resolveSignalAssignment(
  signal: NmrSignal,
  nucleus: '1H' | '13C',
  protonDisplay: ProtonDisplayModel | null,
) {
  if (nucleus === '13C') {
    return signal.assignment;
  }

  const mapped = protonDisplay?.assignmentByKey.get(normalizeProtonAtomKey(signal.atomIds));
  return mapped?.assignment ?? signal.assignment;
}

function createTicks(spectrum: NmrSpectrum) {
  const span = Math.max(1, spectrum.range.max - spectrum.range.min);
  const roughStep =
    spectrum.nucleus === '1H'
      ? Math.max(0.5, Math.round(span / 8))
      : Math.max(10, Math.round(span / 10 / 10) * 10);
  const ticks: number[] = [];

  for (let value = spectrum.range.max; value >= spectrum.range.min; value -= roughStep) {
    const rounded = spectrum.nucleus === '1H' ? Number(value.toFixed(1)) : Math.round(value);
    if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1] - rounded) > 0.001) {
      ticks.push(rounded);
    }
  }

  const minTick =
    spectrum.nucleus === '1H'
      ? Number(spectrum.range.min.toFixed(1))
      : Math.round(spectrum.range.min);
  if (ticks.length === 0 || ticks[ticks.length - 1] !== minTick) {
    ticks.push(minTick);
  }

  return ticks;
}

function intensityAtDelta(spectrum: NmrSpectrum, delta: number) {
  if (spectrum.x.length === 0 || spectrum.y.length === 0) {
    return 0;
  }

  const step = (spectrum.range.max - spectrum.range.min) / Math.max(1, spectrum.x.length - 1);
  const index = Math.round((delta - spectrum.range.min) / Math.max(0.0001, step));
  const clampedIndex = clamp(index, 0, spectrum.y.length - 1);
  const peak = Math.max(1, ...spectrum.y.map((value) => (Number.isFinite(value) ? value : 0)));
  return (spectrum.y[clampedIndex] ?? 0) / peak;
}

function ppmToX(ppm: number, min: number, max: number, left: number, width: number) {
  return left + ((max - ppm) / Math.max(0.0001, max - min)) * width;
}

function renderHeroMetric(label: string, value: string, allowCode: boolean) {
  return `<div class="hero-metric"><span>${escapeHtml(label)}</span><strong>${allowCode ? value : escapeHtml(value)}</strong></div>`;
}

function renderSummaryMetric(label: string, value: string | number) {
  return `<div class="summary-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function renderMetaRow(label: string, value: string) {
  return `<div class="meta-row"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}

function safeBuildProtonDisplayModel(document: ChemicalDocument) {
  try {
    return buildProtonDisplayModel(document);
  } catch {
    return null;
  }
}

function collectWarnings(insights: ChemicalInsights, prediction: NmrPredictionResult) {
  const items = [...insights.warnings, ...prediction.warnings];
  if (prediction.error) {
    items.push(prediction.error);
  }
  return [...new Set(items.filter(Boolean))];
}

function resolvePredictionStatus(prediction: NmrPredictionResult) {
  if (prediction.error) {
    return `Error: ${prediction.error}`;
  }
  if (prediction.status === 'loading') {
    return 'Prediction in progress';
  }
  if (prediction.status === 'ready') {
    return 'Prediction ready';
  }
  return 'Waiting for structure';
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

function formatNumber(value: number, digits: number) {
  return Number.isFinite(value) && value > 0 ? value.toFixed(digits) : '-';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
