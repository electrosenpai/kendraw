import { useState } from 'react';
import { NMR_SOLVENT_OPTIONS } from '../chem/nmr-shared';
import type {
  NmrPredictionResult,
  NmrSignal,
  NmrSignalFocus,
  NmrSolventId,
  NmrSpectrum,
} from '../chem/types';

interface NmrPanelProps {
  prediction: NmrPredictionResult;
  solvent: NmrSolventId;
  selectedSignal: NmrSignalFocus | null;
  hoveredSignal: NmrSignalFocus | null;
  onSignalHover(signal: NmrSignalFocus | null): void;
  onSignalSelect(signal: NmrSignalFocus | null): void;
  onSolventChange(solvent: NmrSolventId): void;
}

export function NmrPanel(props: NmrPanelProps) {
  const [activeNucleus, setActiveNucleus] = useState<'1H' | '13C'>('1H');
  const spectrum = activeNucleus === '1H' ? props.prediction.proton : props.prediction.carbon;
  const visibleSelectedSignal =
    props.selectedSignal?.nucleus === activeNucleus ? props.selectedSignal : null;
  const visibleHoveredSignal =
    props.hoveredSignal?.nucleus === activeNucleus ? props.hoveredSignal : null;
  const selectedSignalObject =
    spectrum && visibleSelectedSignal
      ? (spectrum.signals.find((signal) => signal.id === visibleSelectedSignal.id) ?? null)
      : null;
  const hoveredSignalObject =
    spectrum && visibleHoveredSignal
      ? (spectrum.signals.find((signal) => signal.id === visibleHoveredSignal.id) ?? null)
      : null;
  const selectedSignalIndex =
    selectedSignalObject && spectrum
      ? spectrum.signals.findIndex((signal) => signal.id === selectedSignalObject.id)
      : -1;
  const signalCount = spectrum?.signals.length ?? 0;
  const previousSignal =
    spectrum && selectedSignalIndex > 0 ? spectrum.signals[selectedSignalIndex - 1] : null;
  const nextSignal =
    spectrum && selectedSignalIndex >= 0 && selectedSignalIndex < spectrum.signals.length - 1
      ? spectrum.signals[selectedSignalIndex + 1]
      : null;

  return (
    <section className="panel-section">
      <div className="nmr-header">
        <div>
          <span className="panel-eyebrow">Predicted spectra</span>
          <h3>NMR prediction</h3>
        </div>
        <div className="nmr-controls">
          <label className="nmr-solvent-picker">
            <span>Solvent</span>
            <select
              value={props.solvent}
              onChange={(event) => props.onSolventChange(event.target.value as NmrSolventId)}
            >
              {NMR_SOLVENT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="nmr-tabs" role="tablist" aria-label="NMR nucleus">
            <button
              type="button"
              className={activeNucleus === '1H' ? 'chip active' : 'chip'}
              onClick={() => setActiveNucleus('1H')}
            >
              1H
            </button>
            <button
              type="button"
              className={activeNucleus === '13C' ? 'chip active' : 'chip'}
              onClick={() => setActiveNucleus('13C')}
            >
              13C
            </button>
          </div>
        </div>
      </div>

      {props.prediction.status === 'loading' ? (
        <p>
          {props.prediction.updatedAt === null
            ? 'Loading the NMR engine and generating the first prediction from the current structure.'
            : 'Refreshing the predicted spectrum from the current structure.'}
        </p>
      ) : null}
      {props.prediction.error ? <p>{props.prediction.error}</p> : null}

      {spectrum ? (
        <>
          <div className="nmr-meta-row">
            <span className={`nmr-badge ${spectrum.source === 'spinus' ? 'nmr-badge-accent' : ''}`}>
              {spectrum.methodLabel}
            </span>
            <span className="nmr-meta-copy">
              {spectrum.frequencyMHz.toFixed(2)} MHz in {spectrum.solvent}
            </span>
          </div>

          <div className="nmr-assignment-hint">
            <span>
              {visibleSelectedSignal
                ? `Selected assignment: ${visibleSelectedSignal.assignment}`
                : visibleHoveredSignal
                  ? `Hovered assignment: ${visibleHoveredSignal.assignment}`
                  : 'Hover or click a signal to synchronize the spectrum with the molecule.'}
            </span>
            {visibleSelectedSignal ? (
              <button type="button" className="chip" onClick={() => props.onSignalSelect(null)}>
                Clear
              </button>
            ) : null}
          </div>

          <SpectrumPlot
            spectrum={spectrum}
            hoveredSignalId={visibleHoveredSignal?.id ?? null}
            selectedSignalId={visibleSelectedSignal?.id ?? null}
            onSignalSelect={props.onSignalSelect}
          />

          <AssignmentDetailPanel
            spectrum={spectrum}
            selectedSignal={selectedSignalObject}
            hoveredSignal={hoveredSignalObject}
            selectedSignalIndex={selectedSignalIndex}
            signalCount={signalCount}
            previousSignal={previousSignal}
            nextSignal={nextSignal}
            onSignalSelect={props.onSignalSelect}
          />

          {spectrum.nucleus === '1H' && spectrum.signals.length > 0 ? (
            <MultipletGrid
              spectrum={spectrum}
              hoveredSignalId={visibleHoveredSignal?.id ?? null}
              selectedSignalId={visibleSelectedSignal?.id ?? null}
              onSignalHover={props.onSignalHover}
              onSignalSelect={props.onSignalSelect}
            />
          ) : null}

          {spectrum.nucleus === '13C' ? (
            <div className="nmr-signal-grid">
              {spectrum.signals.length === 0 ? (
                <p>No predicted signals were generated for this nucleus.</p>
              ) : (
                spectrum.signals
                  .slice(0, 12)
                  .map((signal) => (
                    <SignalRow
                      key={signal.id}
                      signal={signal}
                      nucleus={spectrum.nucleus}
                      hoveredSignalId={visibleHoveredSignal?.id ?? null}
                      selectedSignalId={visibleSelectedSignal?.id ?? null}
                      onSignalHover={props.onSignalHover}
                      onSignalSelect={props.onSignalSelect}
                    />
                  ))
              )}
            </div>
          ) : null}
        </>
      ) : props.prediction.status !== 'error' ? (
        <p>Draw a molecule to generate its predicted spectrum.</p>
      ) : null}

      {props.prediction.warnings.length > 0 ? (
        <div className="nmr-warning-block">
          {props.prediction.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MultipletGrid(props: {
  spectrum: NmrSpectrum;
  hoveredSignalId: string | null;
  selectedSignalId: string | null;
  onSignalHover(signal: NmrSignalFocus | null): void;
  onSignalSelect(signal: NmrSignalFocus | null): void;
}) {
  // Keep a stable visual order so the RMN panel does not jump while navigating
  // between assignments with Prev / Next.
  const windows = createMultipletWindows(props.spectrum);

  if (windows.length === 0) {
    return null;
  }

  return (
    <div className="nmr-multiplet-section">
      <div className="nmr-multiplet-header">
        <span className="panel-eyebrow">Expanded multiplets</span>
        <span className="nmr-meta-copy">Local zooms to make the splitting visible</span>
      </div>

      <div className="nmr-multiplet-grid">
        {windows.map((window) => (
          <MultipletCard
            key={window.signal.id}
            window={window}
            nucleus={props.spectrum.nucleus}
            hoveredSignalId={props.hoveredSignalId}
            selectedSignalId={props.selectedSignalId}
            onSignalHover={props.onSignalHover}
            onSignalSelect={props.onSignalSelect}
          />
        ))}
      </div>
    </div>
  );
}

function MultipletCard(props: {
  window: {
    signal: NmrSignal;
    x: number[];
    y: number[];
    from: number;
    to: number;
  };
  nucleus: '1H' | '13C';
  hoveredSignalId: string | null;
  selectedSignalId: string | null;
  onSignalHover(signal: NmrSignalFocus | null): void;
  onSignalSelect(signal: NmrSignalFocus | null): void;
}) {
  const width = 144;
  const height = 78;
  const padding = { top: 12, right: 10, bottom: 18, left: 10 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const baselineY = padding.top + plotHeight;
  const isHovered = props.hoveredSignalId === props.window.signal.id;
  const isSelected = props.selectedSignalId === props.window.signal.id;

  const linePath = props.window.x
    .map((ppm, index) => {
      const x = ppmToX(ppm, props.window.from, props.window.to, padding.left, plotWidth);
      const y = intensityToY(props.window.y[index] ?? 0, baselineY, plotHeight);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const centerX = ppmToX(
    props.window.signal.delta,
    props.window.from,
    props.window.to,
    padding.left,
    plotWidth,
  );

  return (
    <button
      type="button"
      className={
        isSelected
          ? 'nmr-multiplet-card is-active'
          : isHovered
            ? 'nmr-multiplet-card is-hovered'
            : 'nmr-multiplet-card'
      }
      onMouseEnter={() =>
        props.onSignalHover(createSignalFocus(props.window.signal, props.nucleus))
      }
      onMouseLeave={() => props.onSignalHover(null)}
      onClick={() => props.onSignalSelect(createSignalFocus(props.window.signal, props.nucleus))}
    >
      <div className="nmr-multiplet-copy">
        <strong>{props.window.signal.assignment}</strong>
        <span>
          {props.window.signal.multiplicity} at {props.window.signal.delta.toFixed(3)} ppm
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="nmr-multiplet-svg"
        role="img"
        aria-label={`Expanded ${props.window.signal.assignment} multiplet`}
      >
        <rect x="0" y="0" width={width} height={height} className="nmr-paper" rx="14" />
        <line
          x1={padding.left}
          y1={baselineY}
          x2={padding.left + plotWidth}
          y2={baselineY}
          className="nmr-baseline"
        />
        <line
          x1={centerX}
          y1={padding.top}
          x2={centerX}
          y2={baselineY}
          className="nmr-multiplet-centerline"
        />
        <path
          d={linePath}
          className={isSelected || isHovered ? 'nmr-trace nmr-trace-accent' : 'nmr-trace'}
        />
        <text x={padding.left} y={height - 6} textAnchor="start" className="nmr-axis-label">
          {props.window.to.toFixed(2)}
        </text>
        <text x={centerX} y={height - 6} textAnchor="middle" className="nmr-axis-label">
          {props.window.signal.delta.toFixed(2)}
        </text>
        <text
          x={padding.left + plotWidth}
          y={height - 6}
          textAnchor="end"
          className="nmr-axis-label"
        >
          {props.window.from.toFixed(2)}
        </text>
      </svg>

      <div className="nmr-multiplet-meta">
        <span className="nmr-multiplicity-pill">Mult. {props.window.signal.multiplicity}</span>
        {props.window.signal.couplingConstants.length > 0 ? (
          <span className="nmr-j-list">
            J {props.window.signal.couplingConstants.join(', ')} Hz
          </span>
        ) : null}
      </div>
    </button>
  );
}

function AssignmentDetailPanel(props: {
  spectrum: NmrSpectrum;
  selectedSignal: NmrSignal | null;
  hoveredSignal: NmrSignal | null;
  selectedSignalIndex: number;
  signalCount: number;
  previousSignal: NmrSignal | null;
  nextSignal: NmrSignal | null;
  onSignalSelect(signal: NmrSignalFocus | null): void;
}) {
  if (!props.selectedSignal) {
    return (
      <section className="nmr-detail-card is-empty">
        <div className="nmr-detail-header">
          <div>
            <span className="panel-eyebrow">Assignment detail</span>
            <h4>Select a signal</h4>
          </div>
        </div>

        <p className="nmr-detail-placeholder">
          {props.hoveredSignal
            ? `Previewing ${props.hoveredSignal.assignment}. Click this signal to lock the assignment and inspect it without disturbing the layout.`
            : 'Click a peak, an expanded multiplet, or a signal row to lock one assignment and inspect its local spectrum, multiplicity, integral, and couplings.'}
        </p>
      </section>
    );
  }

  const focusWindow = createSignalFocusWindow(props.spectrum, props.selectedSignal);

  return (
    <section className="nmr-detail-card is-active">
      <div className="nmr-detail-header">
        <div>
          <span className="panel-eyebrow">Assignment detail</span>
          <h4>{props.selectedSignal.assignment}</h4>
          <p className="nmr-detail-context">
            {props.spectrum.nucleus} signal {props.selectedSignalIndex + 1} / {props.signalCount}
          </p>
        </div>

        <div className="nmr-detail-nav">
          <button
            type="button"
            className="chip"
            disabled={!props.previousSignal}
            onClick={() =>
              props.previousSignal &&
              props.onSignalSelect(createSignalFocus(props.previousSignal, props.spectrum.nucleus))
            }
          >
            Prev
          </button>
          <button
            type="button"
            className="chip"
            disabled={!props.nextSignal}
            onClick={() =>
              props.nextSignal &&
              props.onSignalSelect(createSignalFocus(props.nextSignal, props.spectrum.nucleus))
            }
          >
            Next
          </button>
        </div>
      </div>

      <div className="nmr-detail-metrics">
        <DetailMetric label="Shift" value={`${props.selectedSignal.delta.toFixed(3)} ppm`} />
        <DetailMetric label="Multiplicity" value={props.selectedSignal.multiplicity} />
        <DetailMetric
          label="Integral"
          value={props.spectrum.nucleus === '1H' ? `${props.selectedSignal.integral}H` : '1C'}
        />
        <DetailMetric
          label="Confidence"
          value={
            props.selectedSignal.confidence !== null
              ? `${Math.round(props.selectedSignal.confidence * 100)}%`
              : 'n/a'
          }
        />
      </div>

      <div className="nmr-detail-zoom">
        <div className="nmr-detail-zoom-copy">
          <strong>Local zoom</strong>
          <span>
            {focusWindow.from.toFixed(props.spectrum.nucleus === '1H' ? 3 : 2)} to{' '}
            {focusWindow.to.toFixed(props.spectrum.nucleus === '1H' ? 3 : 2)} ppm
          </span>
        </div>
        <SignalFocusPlot
          spectrum={props.spectrum}
          signal={props.selectedSignal}
          window={focusWindow}
        />
      </div>

      <div className="nmr-detail-footer">
        <span>
          {props.selectedSignal.couplingConstants.length > 0
            ? `J = ${props.selectedSignal.couplingConstants.join(', ')} Hz`
            : props.spectrum.nucleus === '1H'
              ? 'No resolved J coupling listed for this signal.'
              : '13C singlet-style environment summary.'}
        </span>
        <span>{props.selectedSignal.atomIds.length} linked atom id(s)</span>
      </div>
    </section>
  );
}

function SpectrumPlot(props: {
  spectrum: NmrSpectrum;
  hoveredSignalId: string | null;
  selectedSignalId: string | null;
  onSignalSelect(signal: NmrSignalFocus | null): void;
}) {
  const [localHoveredSignalId, setLocalHoveredSignalId] = useState<string | null>(null);
  const width = 320;
  const height = 220;
  const padding = { top: 44, right: 16, bottom: 34, left: 16 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const baselineY = padding.top + plotHeight;
  const ticks = createTicks(props.spectrum);
  const annotations = createSpectrumAnnotations(
    props.spectrum,
    padding.left,
    plotWidth,
    baselineY,
    plotHeight,
    width,
  );
  const interactionTargets = createSpectrumInteractionTargets(
    props.spectrum,
    padding.left,
    plotWidth,
    baselineY,
    plotHeight,
    annotations,
  );

  const linePath = props.spectrum.x
    .map((ppm, index) => {
      const x = ppmToX(
        ppm,
        props.spectrum.range.min,
        props.spectrum.range.max,
        padding.left,
        plotWidth,
      );
      const y = intensityToY(props.spectrum.y[index] ?? 0, baselineY, plotHeight);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const areaPath = `${linePath} L ${padding.left} ${baselineY} L ${padding.left + plotWidth} ${baselineY} Z`;
  const focusedTarget =
    interactionTargets.find((target) => target.signal.id === props.selectedSignalId) ??
    interactionTargets.find((target) => target.signal.id === props.hoveredSignalId) ??
    interactionTargets.find((target) => target.signal.id === localHoveredSignalId) ??
    null;
  const handleSignalSelect = (
    signal: NmrSignal,
    event?: { preventDefault(): void; stopPropagation(): void },
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    setLocalHoveredSignalId(signal.id);
    props.onSignalSelect(createSignalFocus(signal, props.spectrum.nucleus));
  };
  const updateLocalHoveredSignal = (target: SpectrumInteractionTarget | null) => {
    const nextId = target?.signal.id ?? null;
    if (nextId === localHoveredSignalId) {
      return;
    }
    setLocalHoveredSignalId(nextId);
  };

  return (
    <div className="nmr-spectrum-card">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="nmr-spectrum-svg"
        role="img"
        aria-label={`${props.spectrum.nucleus} predicted spectrum`}
        onPointerMove={(event) => {
          const point = getSvgPoint(event, width, height);
          updateLocalHoveredSignal(
            findSpectrumInteractionTarget(
              point,
              interactionTargets,
              padding.top,
              baselineY,
              props.spectrum.nucleus,
            ),
          );
        }}
        onPointerLeave={() => setLocalHoveredSignalId(null)}
        onClick={(event) => {
          const point = getSvgPoint(event, width, height);
          const target = findSpectrumInteractionTarget(
            point,
            interactionTargets,
            padding.top,
            baselineY,
            props.spectrum.nucleus,
          );
          if (target) {
            handleSignalSelect(target.signal, event);
          }
        }}
      >
        <defs>
          <linearGradient id={`nmr-fill-${props.spectrum.nucleus}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#111111" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#111111" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} className="nmr-paper" rx="20" />

        {ticks.map((tick) => {
          const x = ppmToX(
            tick,
            props.spectrum.range.min,
            props.spectrum.range.max,
            padding.left,
            plotWidth,
          );
          return (
            <g key={`${props.spectrum.nucleus}_${tick}`}>
              <line x1={x} y1={padding.top} x2={x} y2={baselineY} className="nmr-grid-line" />
              <text x={x} y={height - 12} textAnchor="middle" className="nmr-axis-label">
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={padding.left}
          y1={baselineY}
          x2={padding.left + plotWidth}
          y2={baselineY}
          className="nmr-baseline"
        />
        <path d={areaPath} fill={`url(#nmr-fill-${props.spectrum.nucleus})`} className="nmr-area" />
        <path d={linePath} className="nmr-trace" />

        {focusedTarget ? (
          <line
            x1={focusedTarget.x}
            y1={padding.top}
            x2={focusedTarget.x}
            y2={baselineY}
            className="nmr-spectrum-focus-line"
          />
        ) : null}

        {annotations.map((annotation) => {
          const isHovered =
            annotation.signal.id === props.hoveredSignalId ||
            annotation.signal.id === localHoveredSignalId;
          const isSelected = annotation.signal.id === props.selectedSignalId;
          return (
            <g
              key={`${props.spectrum.nucleus}_${annotation.signal.id}`}
              className={
                isSelected
                  ? 'nmr-annotation-group is-active'
                  : isHovered
                    ? 'nmr-annotation-group is-hovered'
                    : 'nmr-annotation-group'
              }
            >
              <line
                x1={annotation.x}
                y1={annotation.calloutBottom}
                x2={annotation.x}
                y2={annotation.peakY - 3}
                className="nmr-annotation-line"
              />
              <rect
                x={annotation.boxX}
                y={annotation.boxY}
                width={annotation.boxWidth}
                height={annotation.boxHeight}
                rx="9"
                className="nmr-annotation-box"
              />
              <text
                x={annotation.boxCenterX}
                y={annotation.boxY + 10}
                textAnchor="middle"
                className="nmr-annotation-text"
              >
                {annotation.label}
              </text>
              <text
                x={annotation.boxCenterX}
                y={annotation.boxY + 19}
                textAnchor="middle"
                className="nmr-annotation-subtext"
              >
                {annotation.subLabel}
              </text>
            </g>
          );
        })}

        <text x={width - 16} y={height - 12} textAnchor="end" className="nmr-axis-label">
          ppm
        </text>
      </svg>
    </div>
  );
}

function SignalFocusPlot(props: {
  spectrum: NmrSpectrum;
  signal: NmrSignal;
  window: {
    from: number;
    to: number;
    x: number[];
    y: number[];
  };
}) {
  const width = 320;
  const height = 128;
  const padding = { top: 12, right: 12, bottom: 18, left: 12 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const baselineY = padding.top + plotHeight;
  const linePath = props.window.x
    .map((ppm, index) => {
      const x = ppmToX(ppm, props.window.from, props.window.to, padding.left, plotWidth);
      const y = intensityToY(props.window.y[index] ?? 0, baselineY, plotHeight);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  const focusX = ppmToX(
    props.signal.delta,
    props.window.from,
    props.window.to,
    padding.left,
    plotWidth,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="nmr-detail-svg"
      role="img"
      aria-label={`Zoomed view of ${props.signal.assignment}`}
    >
      <rect x="0" y="0" width={width} height={height} className="nmr-paper" rx="16" />
      <line
        x1={padding.left}
        y1={baselineY}
        x2={padding.left + plotWidth}
        y2={baselineY}
        className="nmr-baseline"
      />
      <line
        x1={focusX}
        y1={padding.top}
        x2={focusX}
        y2={baselineY}
        className="nmr-spectrum-focus-line"
      />
      <path d={linePath} className="nmr-trace nmr-trace-accent" />
      <text x={padding.left} y={height - 6} textAnchor="start" className="nmr-axis-label">
        {props.window.to.toFixed(props.spectrum.nucleus === '1H' ? 2 : 1)}
      </text>
      <text x={focusX} y={height - 6} textAnchor="middle" className="nmr-axis-label">
        {props.signal.delta.toFixed(props.spectrum.nucleus === '1H' ? 2 : 1)}
      </text>
      <text x={padding.left + plotWidth} y={height - 6} textAnchor="end" className="nmr-axis-label">
        {props.window.from.toFixed(props.spectrum.nucleus === '1H' ? 2 : 1)}
      </text>
    </svg>
  );
}

function SignalRow(props: {
  signal: NmrSignal;
  nucleus: '1H' | '13C';
  hoveredSignalId: string | null;
  selectedSignalId: string | null;
  onSignalHover(signal: NmrSignalFocus | null): void;
  onSignalSelect(signal: NmrSignalFocus | null): void;
}) {
  const isHovered = props.hoveredSignalId === props.signal.id;
  const isSelected = props.selectedSignalId === props.signal.id;

  return (
    <button
      type="button"
      className={
        isSelected
          ? 'nmr-signal-row is-active'
          : isHovered
            ? 'nmr-signal-row is-hovered'
            : 'nmr-signal-row'
      }
      onMouseEnter={() => props.onSignalHover(createSignalFocus(props.signal, props.nucleus))}
      onMouseLeave={() => props.onSignalHover(null)}
      onClick={() => props.onSignalSelect(createSignalFocus(props.signal, props.nucleus))}
    >
      <div>
        <strong>{props.signal.assignment}</strong>
        <span className="nmr-signal-copy">
          delta {props.signal.delta.toFixed(3)} ppm
          {props.nucleus === '1H' ? ` - ${props.signal.integral}H` : ''}
        </span>
      </div>
      <div className="nmr-signal-side">
        <span className="nmr-multiplicity-pill">Mult. {props.signal.multiplicity}</span>
        {props.signal.couplingConstants.length > 0 ? (
          <span className="nmr-j-list">J {props.signal.couplingConstants.join(', ')} Hz</span>
        ) : null}
        {props.signal.confidence !== null ? (
          <span className="nmr-confidence">{Math.round(props.signal.confidence * 100)}%</span>
        ) : null}
      </div>
    </button>
  );
}

function createSignalFocus(signal: NmrSignal, nucleus: '1H' | '13C'): NmrSignalFocus {
  return {
    id: signal.id,
    nucleus,
    assignment: signal.assignment,
    atomIds: [...signal.atomIds],
  };
}

function DetailMetric(props: { label: string; value: string }) {
  return (
    <div className="nmr-detail-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function ppmToX(ppm: number, min: number, max: number, left: number, width: number) {
  return left + ((max - ppm) / Math.max(0.0001, max - min)) * width;
}

function intensityToY(intensity: number, baselineY: number, plotHeight: number) {
  return baselineY - intensity * (plotHeight - 10);
}

function createTicks(spectrum: NmrSpectrum) {
  const step = spectrum.nucleus === '1H' ? 2 : 40;
  const ticks: number[] = [];

  for (let value = spectrum.range.max; value >= spectrum.range.min; value -= step) {
    ticks.push(value);
  }

  if (ticks[ticks.length - 1] !== spectrum.range.min) {
    ticks.push(spectrum.range.min);
  }

  return ticks;
}

function createSpectrumAnnotations(
  spectrum: NmrSpectrum,
  left: number,
  plotWidth: number,
  baselineY: number,
  plotHeight: number,
  width: number,
) {
  const maxAnnotations = spectrum.nucleus === '1H' ? 10 : 12;
  const rowAnchorYs = [14, 27, 40];
  const rowSpacing = 40;
  const rowRightEdges = rowAnchorYs.map(() => Number.NEGATIVE_INFINITY);

  return spectrum.signals
    .slice(0, maxAnnotations)
    .map((signal) => {
      const x = ppmToX(signal.delta, spectrum.range.min, spectrum.range.max, left, plotWidth);
      const peakIntensity = intensityAtDelta(spectrum, signal.delta);
      const peakY = intensityToY(peakIntensity, baselineY, plotHeight);
      const label = signal.multiplicity;
      const subLabel =
        spectrum.nucleus === '1H' ? signal.delta.toFixed(2) : signal.delta.toFixed(1);
      const boxWidth = Math.max(26, Math.max(label.length * 7.2 + 12, subLabel.length * 5.6 + 10));
      const boxHeight = 24;

      return {
        signal,
        x,
        peakY,
        label,
        subLabel,
        boxWidth,
        boxHeight,
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
      const boxCenterX = clampValue(
        annotation.x,
        10 + annotation.boxWidth / 2,
        width - 10 - annotation.boxWidth / 2,
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

type SpectrumAnnotation = ReturnType<typeof createSpectrumAnnotations>[number];

interface SpectrumInteractionTarget {
  signal: NmrSignal;
  x: number;
  peakY: number;
  annotation: SpectrumAnnotation | null;
}

function createSpectrumInteractionTargets(
  spectrum: NmrSpectrum,
  left: number,
  plotWidth: number,
  baselineY: number,
  plotHeight: number,
  annotations: SpectrumAnnotation[],
) {
  return spectrum.signals.map((signal) => ({
    signal,
    x: ppmToX(signal.delta, spectrum.range.min, spectrum.range.max, left, plotWidth),
    peakY: intensityToY(intensityAtDelta(spectrum, signal.delta), baselineY, plotHeight),
    annotation: annotations.find((annotation) => annotation.signal.id === signal.id) ?? null,
  }));
}

function getSvgPoint(
  event: { clientX: number; clientY: number; currentTarget: SVGSVGElement },
  width: number,
  height: number,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const scaleX = rect.width > 0 ? width / rect.width : 1;
  const scaleY = rect.height > 0 ? height / rect.height : 1;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function findSpectrumInteractionTarget(
  point: { x: number; y: number },
  targets: SpectrumInteractionTarget[],
  plotTop: number,
  baselineY: number,
  nucleus: '1H' | '13C',
) {
  const columnThreshold = nucleus === '1H' ? 11 : 9;
  let bestMatch: { target: SpectrumInteractionTarget; score: number } | null = null;

  for (const target of targets) {
    const box = target.annotation;
    const isInsideBox = box
      ? point.x >= box.boxX - 6 &&
        point.x <= box.boxX + box.boxWidth + 6 &&
        point.y >= box.boxY - 6 &&
        point.y <= box.boxY + box.boxHeight + 6
      : false;
    const isAlongCallout = box
      ? Math.abs(point.x - target.x) <= 8 &&
        point.y >= box.boxY + box.boxHeight - 4 &&
        point.y <= Math.max(box.calloutBottom, target.peakY) + 8
      : false;
    const isAlongPeakColumn =
      Math.abs(point.x - target.x) <= columnThreshold &&
      point.y >= plotTop - 4 &&
      point.y <= baselineY + 6;

    if (!isInsideBox && !isAlongCallout && !isAlongPeakColumn) {
      continue;
    }

    const regionPenalty = isInsideBox ? 0 : isAlongCallout ? 18 : 42;
    const xPenalty = Math.abs(point.x - target.x);
    const yPenalty =
      isInsideBox && box
        ? Math.abs(point.y - (box.boxY + box.boxHeight / 2)) * 0.2
        : Math.abs(point.y - target.peakY) * 0.04;
    const score = regionPenalty + xPenalty + yPenalty;

    if (!bestMatch || score < bestMatch.score) {
      bestMatch = { target, score };
    }
  }

  return bestMatch?.target ?? null;
}

function intensityAtDelta(spectrum: NmrSpectrum, delta: number) {
  if (spectrum.x.length === 0 || spectrum.y.length === 0) {
    return 0;
  }

  const step = (spectrum.range.max - spectrum.range.min) / Math.max(1, spectrum.x.length - 1);
  const index = Math.round((delta - spectrum.range.min) / Math.max(0.0001, step));
  const clampedIndex = Math.max(0, Math.min(spectrum.y.length - 1, index));
  return spectrum.y[clampedIndex] ?? 0;
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSignalFocusWindow(spectrum: NmrSpectrum, signal: NmrSignal) {
  const halfWindow =
    spectrum.nucleus === '1H'
      ? Math.max(0.08, calculateMultipletHalfWindow(signal, spectrum.frequencyMHz) * 1.45)
      : Math.max(3.5, 12 / Math.max(1, spectrum.frequencyMHz / 100));
  const from = Math.max(spectrum.range.min, signal.delta - halfWindow);
  const to = Math.min(spectrum.range.max, signal.delta + halfWindow);
  const points = spectrum.x
    .map((ppm, index) => ({ ppm, intensity: spectrum.y[index] ?? 0 }))
    .filter((point) => point.ppm >= from && point.ppm <= to);

  if (points.length < 6) {
    return {
      from,
      to,
      x: [from, signal.delta, to],
      y: [0, 1, 0],
    };
  }

  const localMax = Math.max(...points.map((point) => point.intensity), 0);
  const normalized =
    localMax > 0
      ? points.map((point) => ({ ...point, intensity: point.intensity / localMax }))
      : points;

  return {
    from,
    to,
    x: normalized.map((point) => point.ppm),
    y: normalized.map((point) => point.intensity),
  };
}

function createMultipletWindows(spectrum: NmrSpectrum) {
  return spectrum.signals.slice(0, 6).flatMap((signal) => {
    const ppmHalfWindow = calculateMultipletHalfWindow(signal, spectrum.frequencyMHz);
    const from = Math.max(spectrum.range.min, signal.delta - ppmHalfWindow);
    const to = Math.min(spectrum.range.max, signal.delta + ppmHalfWindow);
    const points = spectrum.x
      .map((ppm, index) => ({ ppm, intensity: spectrum.y[index] ?? 0 }))
      .filter((point) => point.ppm >= from && point.ppm <= to);

    if (points.length < 6) {
      return [];
    }

    const localMax = Math.max(...points.map((point) => point.intensity), 0);
    const normalizedPoints =
      localMax > 0
        ? points.map((point) => ({ ...point, intensity: point.intensity / localMax }))
        : points;

    return [
      {
        signal,
        from,
        to,
        x: normalizedPoints.map((point) => point.ppm),
        y: normalizedPoints.map((point) => point.intensity),
      },
    ];
  });
}

function calculateMultipletHalfWindow(signal: NmrSignal, frequencyMHz: number) {
  const maxJ = signal.couplingConstants.length > 0 ? Math.max(...signal.couplingConstants) : 0;
  const ppmFromCoupling =
    (maxJ * Math.max(2, signal.couplingConstants.length + 2)) / Math.max(1, frequencyMHz);
  return Math.max(0.06, ppmFromCoupling * 1.3);
}
