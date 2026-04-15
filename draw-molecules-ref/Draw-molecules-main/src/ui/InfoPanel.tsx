import type {
  ChemicalInsights,
  NmrPredictionResult,
  NmrSignalFocus,
  NmrSolventId,
} from '../chem/types';
import { NmrPanel } from './NmrPanel';

interface InfoPanelProps {
  insights: ChemicalInsights;
  selectionCount: number;
  nmrPrediction: NmrPredictionResult;
  nmrSolvent: NmrSolventId;
  selectedNmrSignal: NmrSignalFocus | null;
  hoveredNmrSignal: NmrSignalFocus | null;
  onNmrSignalHover(signal: NmrSignalFocus | null): void;
  onNmrSignalSelect(signal: NmrSignalFocus | null): void;
  onNmrSolventChange(solvent: NmrSolventId): void;
}

export function InfoPanel(props: InfoPanelProps) {
  return (
    <aside className="info-panel">
      <div className="panel-section">
        <span className="panel-eyebrow">Live analysis</span>
        <h2>Structure intelligence</h2>
        <p>
          {props.selectionCount > 0
            ? `${props.selectionCount} object(s) selected`
            : 'No active selection'}
        </p>
      </div>

      <div className="metric-grid">
        <Metric label="Formula" value={props.insights.formula} />
        <Metric
          label="Average MW"
          value={props.insights.averageMass ? props.insights.averageMass.toFixed(4) : '-'}
        />
        <Metric
          label="Exact mass"
          value={props.insights.exactMass ? props.insights.exactMass.toFixed(4) : '-'}
        />
        <Metric label="IHD" value={props.insights.degreeOfUnsaturation ?? '-'} />
        <Metric label="cLogP" value={props.insights.logP?.toFixed(2) ?? '-'} />
        <Metric label="TPSA" value={props.insights.tpsa?.toFixed(2) ?? '-'} />
        <Metric
          label="HBA / HBD"
          value={`${props.insights.acceptors} / ${props.insights.donors}`}
        />
        <Metric label="Rotatable" value={props.insights.rotatableBonds} />
        <Metric
          label="Rings"
          value={`${props.insights.ringCount} (${props.insights.aromaticRingCount} aromatic)`}
        />
        <Metric label="Stereo" value={props.insights.stereoCenters} />
      </div>

      <NmrPanel
        prediction={props.nmrPrediction}
        solvent={props.nmrSolvent}
        selectedSignal={props.selectedNmrSignal}
        hoveredSignal={props.hoveredNmrSignal}
        onSignalHover={props.onNmrSignalHover}
        onSignalSelect={props.onNmrSignalSelect}
        onSolventChange={props.onNmrSolventChange}
      />

      <div className="panel-section">
        <h3>Lipinski</h3>
        <p>{props.insights.lipinski}</p>
      </div>

      <div className="panel-section">
        <h3>Adduct m/z</h3>
        <ul className="plain-list">
          {props.insights.adducts.length === 0 ? (
            <li>Draw a structure to calculate adducts.</li>
          ) : (
            props.insights.adducts.map((adduct) => (
              <li key={adduct.label}>
                {adduct.label}: {adduct.mz.toFixed(4)}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="panel-section">
        <h3>Elemental analysis</h3>
        <ul className="plain-list">
          {props.insights.elementalAnalysis.length === 0 ? (
            <li>No elemental composition available.</li>
          ) : (
            props.insights.elementalAnalysis.map((entry) => (
              <li key={entry.element}>
                {entry.element}: {entry.percent.toFixed(2)}%
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="panel-section">
        <h3>SMILES</h3>
        <code className="inline-block">{props.insights.smiles || '-'}</code>
      </div>

      <div className="panel-section">
        <h3>Warnings</h3>
        <ul className="plain-list">
          {props.insights.warnings.length === 0 ? (
            <li>No structural warnings from the current validation pass.</li>
          ) : (
            props.insights.warnings.map((warning) => <li key={warning}>{warning}</li>)
          )}
        </ul>
      </div>
    </aside>
  );
}

function Metric(props: { label: string; value: string | number }) {
  return (
    <div className="metric-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}
