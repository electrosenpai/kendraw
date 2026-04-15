import { BOND_CHOICES, RING_CHOICES, RING_SIZES } from '../chem/constants';
import type { BondType, EditorSettings, RingTemplate } from '../chem/types';

interface StyleBarProps {
  settings: EditorSettings;
  activeBondType: BondType;
  activeRingTemplate: RingTemplate;
  selectedCount: number;
  onSettingsChange(next: Partial<EditorSettings>): void;
  onBondTypeChange(type: BondType): void;
  onRingTemplateChange(template: RingTemplate): void;
  onApplyColor(): void;
  onRefine(): void;
}

export function StyleBar(props: StyleBarProps) {
  return (
    <section className="style-bar">
      <label>
        Bond type
        <select
          value={props.activeBondType}
          onChange={(event) => props.onBondTypeChange(event.target.value as BondType)}
        >
          {BOND_CHOICES.map((choice) => (
            <option key={choice.type} value={choice.type}>
              {choice.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Ring
        <select
          value={props.activeRingTemplate}
          onChange={(event) => props.onRingTemplateChange(event.target.value as RingTemplate)}
        >
          {RING_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {RING_SIZES[choice].label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Bond length
        <input
          type="range"
          min="28"
          max="64"
          value={props.settings.bondLength}
          onChange={(event) => props.onSettingsChange({ bondLength: Number(event.target.value) })}
        />
        <span>{props.settings.bondLength}px</span>
      </label>

      <label>
        Line width
        <input
          type="range"
          min="1"
          max="4"
          step="0.25"
          value={props.settings.lineWidth}
          onChange={(event) => props.onSettingsChange({ lineWidth: Number(event.target.value) })}
        />
        <span>{props.settings.lineWidth.toFixed(2)}pt</span>
      </label>

      <label>
        Font size
        <input
          type="range"
          min="12"
          max="28"
          value={props.settings.fontSize}
          onChange={(event) => props.onSettingsChange({ fontSize: Number(event.target.value) })}
        />
        <span>{props.settings.fontSize}px</span>
      </label>

      <label className="toggle">
        <input
          type="checkbox"
          checked={props.settings.fixedBondLength}
          onChange={(event) => props.onSettingsChange({ fixedBondLength: event.target.checked })}
        />
        Fixed lengths
      </label>

      <label className="toggle">
        <input
          type="checkbox"
          checked={props.settings.atomColorMode === 'cpk'}
          onChange={(event) =>
            props.onSettingsChange({ atomColorMode: event.target.checked ? 'cpk' : 'single' })
          }
        />
        CPK colors
      </label>

      <label>
        Molecule color
        <div className="color-control">
          <input
            type="color"
            value={props.settings.singleColor}
            onChange={(event) => props.onSettingsChange({ singleColor: event.target.value })}
          />
          <span>{props.settings.singleColor}</span>
        </div>
      </label>

      <div className="style-action-group">
        <button
          type="button"
          className="style-action style-action-accent"
          onClick={props.onRefine}
          title="Refine the current structure with the recorded geometry constraints"
        >
          Refine
        </button>
        <button type="button" className="style-action" onClick={props.onApplyColor}>
          {props.selectedCount > 0 ? 'Apply to selection' : 'Apply to document'}
        </button>
      </div>
    </section>
  );
}
