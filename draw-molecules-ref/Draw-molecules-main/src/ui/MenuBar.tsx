import { EXAMPLE_SMILES } from '../chem/constants';

interface MenuBarProps {
  documentName: string;
  canUndo: boolean;
  canRedo: boolean;
  onNew(): void;
  onOpen(): void;
  onSave(): void;
  onUndo(): void;
  onRedo(): void;
  onImportText(): void;
  onCopySmiles(): void;
  onRefine(): void;
  onCleanUp(): void;
  onOpenDataExport(): void;
  onPreviewReport(): void;
  onExportReport(): void;
  onExportSvg(): void;
  onExportPng(): void;
  onLoadExample(smiles: string, label: string): void;
}

export function MenuBar(props: MenuBarProps) {
  return (
    <header className="menu-bar">
      <div className="brand-block">
        <span className="brand-mark">ChemCanvas</span>
        <div>
          <h1>{props.documentName}</h1>
          <p>ChemDraw-style molecular editor with live chemical intelligence</p>
        </div>
      </div>

      <div className="menu-groups">
        <div className="menu-group">
          <span>File</span>
          <button onClick={props.onNew}>New</button>
          <button onClick={props.onOpen}>Open</button>
          <button onClick={props.onSave}>Save JSON</button>
          <button onClick={props.onImportText}>Import SMILES/MOL</button>
        </div>

        <div className="menu-group">
          <span>Edit</span>
          <button onClick={props.onUndo} disabled={!props.canUndo}>
            Undo
          </button>
          <button onClick={props.onRedo} disabled={!props.canRedo}>
            Redo
          </button>
          <button onClick={props.onCopySmiles}>Copy SMILES</button>
          <button onClick={props.onRefine}>Refine</button>
          <button onClick={props.onCleanUp}>Clean Up</button>
        </div>

        <div className="menu-group">
          <span>Export</span>
          <button onClick={props.onOpenDataExport}>Data Export</button>
          <button onClick={props.onPreviewReport}>Preview Report</button>
          <button onClick={props.onExportReport}>Report HTML</button>
          <button onClick={props.onExportSvg}>SVG</button>
          <button onClick={props.onExportPng}>PNG</button>
          <select
            defaultValue=""
            onChange={(event) => {
              const choice = EXAMPLE_SMILES.find((example) => example.value === event.target.value);
              if (choice) {
                props.onLoadExample(choice.value, choice.label);
              }
              event.target.value = '';
            }}
          >
            <option value="">Examples…</option>
            {EXAMPLE_SMILES.map((example) => (
              <option key={example.label} value={example.value}>
                {example.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
