import {
  ATOM_CHOICES,
  BOND_CHOICES,
  RING_CHOICES,
  RING_SIZES,
  TOOL_GROUPS,
} from '../chem/constants';
import type { BondType, RingTemplate, ToolId } from '../chem/types';
import { BondPreview, RingPreview, ToolIcon } from './Icons';

interface ToolPaletteProps {
  activeTool: ToolId;
  activeElement: string;
  activeBondType: BondType;
  activeRingTemplate: RingTemplate;
  onToolChange(tool: ToolId): void;
  onElementChange(element: string): void;
  onBondTypeChange(type: BondType): void;
  onRingChange(template: RingTemplate): void;
}

export function ToolPalette(props: ToolPaletteProps) {
  return (
    <aside className="tool-palette">
      <div className="palette-section">
        <span className="palette-label">Tools</span>
        <div className="tool-icon-grid">
          {TOOL_GROUPS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              title={`${tool.label}${tool.hotkey ? ` (${tool.hotkey})` : ''}`}
              aria-label={`${tool.label}${tool.hotkey ? ` (${tool.hotkey})` : ''}`}
              data-tooltip={`${tool.label}${tool.hotkey ? ` (${tool.hotkey})` : ''}`}
              className={
                tool.id === props.activeTool ? 'tool-icon-button active' : 'tool-icon-button'
              }
              onClick={() => props.onToolChange(tool.id)}
            >
              <ToolIcon tool={tool.id} activeElement={props.activeElement} />
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <span className="palette-label">Atoms</span>
        <div className="atom-grid">
          {ATOM_CHOICES.map((element) => (
            <button
              key={element}
              type="button"
              title={element}
              data-tooltip={element}
              className={element === props.activeElement ? 'atom-chip active' : 'atom-chip'}
              onClick={() => {
                props.onToolChange('atom');
                props.onElementChange(element);
              }}
            >
              <span>{element}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <span className="palette-label">Bond flyout</span>
        <div className="chip-grid">
          {BOND_CHOICES.map((choice) => (
            <button
              key={choice.type}
              type="button"
              title={choice.label}
              data-tooltip={choice.label}
              className={choice.type === props.activeBondType ? 'chip active' : 'chip'}
              onClick={() => {
                props.onToolChange('bond');
                props.onBondTypeChange(choice.type);
              }}
            >
              <BondPreview kind={choice.type} />
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <span className="palette-label">Ring flyout</span>
        <div className="chip-grid">
          {RING_CHOICES.map((template) => (
            <button
              key={template}
              type="button"
              title={RING_SIZES[template].label}
              data-tooltip={RING_SIZES[template].label}
              className={template === props.activeRingTemplate ? 'chip active' : 'chip'}
              onClick={() => {
                props.onToolChange('ring');
                props.onRingChange(template);
              }}
            >
              <RingPreview template={template} />
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section palette-note">
        <span className="palette-label">Implemented now</span>
        <p>
          Select, erase, bond, chain, ring, text, arrow, pan, undo/redo, import/export, clean-up,
          and live property analysis.
        </p>
      </div>
    </aside>
  );
}
