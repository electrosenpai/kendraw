import type { NmrPredictionResult } from '../chem/types';

interface DataExportDialogProps {
  documentName: string;
  prediction: NmrPredictionResult;
  onClose(): void;
  onExportAnalysisJson(): void;
  onExportProtonCsv(): void;
  onExportCarbonCsv(): void;
}

export function DataExportDialog(props: DataExportDialogProps) {
  const protonSignals = props.prediction.proton?.signals.length ?? 0;
  const carbonSignals = props.prediction.carbon?.signals.length ?? 0;

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <section
        className="data-export-card"
        onClick={(event) => event.stopPropagation()}
        aria-label={`Data export for ${props.documentName}`}
      >
        <div className="data-export-header">
          <div className="data-export-copy">
            <span className="panel-eyebrow">Analytical data export</span>
            <h2>{props.documentName}</h2>
            <p>
              Export machine-readable analysis files from the current structure, including
              structured JSON and RMN assignment tables ready for spreadsheets or external
              processing.
            </p>
          </div>

          <button type="button" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="data-export-grid">
          <article className="data-export-option">
            <span className="data-export-label">Analysis JSON</span>
            <strong>Complete structure + properties + RMN payload</strong>
            <p>
              Full document snapshot, molecular insights, warnings, proton/carbon signals, and
              spectral data arrays in one machine-readable export.
            </p>
            <button type="button" className="primary" onClick={props.onExportAnalysisJson}>
              Export JSON
            </button>
          </article>

          <article className="data-export-option">
            <span className="data-export-label">1H CSV</span>
            <strong>
              {protonSignals > 0
                ? `${protonSignals} predicted proton signals`
                : 'No proton table available yet'}
            </strong>
            <p>
              Assignment table with shift, multiplicity, integral, J couplings, confidence, solvent,
              and method columns.
            </p>
            <button type="button" onClick={props.onExportProtonCsv} disabled={protonSignals === 0}>
              Export 1H CSV
            </button>
          </article>

          <article className="data-export-option">
            <span className="data-export-label">13C CSV</span>
            <strong>
              {carbonSignals > 0
                ? `${carbonSignals} predicted carbon signals`
                : 'No carbon table available yet'}
            </strong>
            <p>
              Carbon assignment table with delta values, multiplicity labels, confidence, solvent,
              and acquisition metadata.
            </p>
            <button type="button" onClick={props.onExportCarbonCsv} disabled={carbonSignals === 0}>
              Export 13C CSV
            </button>
          </article>
        </div>
      </section>
    </div>
  );
}
