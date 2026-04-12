import { useState } from 'react';
import { COMMON_ELEMENTS, getSymbol, getColor, RING_TEMPLATES } from '@kendraw/scene';
import type { RingTemplate } from '@kendraw/scene';

export type ToolId =
  | 'select'
  | 'add-atom'
  | 'add-bond'
  | 'ring'
  | 'eraser'
  | 'pan'
  | 'arrow'
  | 'curly-arrow';

export interface ToolState {
  tool: ToolId;
  element: number;
  bondStyle: 'single' | 'double' | 'triple' | 'wedge' | 'dash' | 'aromatic';
  ringTemplate: string;
  arrowType: 'forward' | 'equilibrium' | 'reversible';
  curlyType: 'pair' | 'radical';
}

export const DEFAULT_TOOL_STATE: ToolState = {
  tool: 'add-atom',
  element: 6,
  bondStyle: 'single',
  ringTemplate: 'benzene',
  arrowType: 'forward',
  curlyType: 'pair',
};

interface ToolPaletteProps {
  toolState: ToolState;
  onToolStateChange: (state: Partial<ToolState>) => void;
}

const TOOL_DEFS: { id: ToolId; label: string; shortcut: string; icon: string }[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: '⇱' },
  { id: 'add-atom', label: 'Atom', shortcut: 'A', icon: 'C' },
  { id: 'add-bond', label: 'Bond', shortcut: 'B', icon: '—' },
  { id: 'ring', label: 'Ring', shortcut: 'R', icon: '⬡' },
  { id: 'arrow', label: 'Arrow', shortcut: 'W', icon: '→' },
  { id: 'curly-arrow', label: 'Curly', shortcut: 'U', icon: '↝' },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: '⌫' },
  { id: 'pan', label: 'Pan', shortcut: 'H', icon: '✋' },
];

const BOND_STYLES: { id: ToolState['bondStyle']; label: string }[] = [
  { id: 'single', label: '—' },
  { id: 'double', label: '=' },
  { id: 'triple', label: '≡' },
  { id: 'wedge', label: '▸' },
  { id: 'dash', label: '┄' },
  { id: 'aromatic', label: '◎' },
];

export function ToolPalette({ toolState, onToolStateChange }: ToolPaletteProps) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  return (
    <div
      style={{
        width: 52,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--kd-space-xs)',
        padding: 'var(--kd-space-sm)',
        background: 'var(--kd-color-bg-secondary)',
        borderRight: '1px solid var(--kd-color-border)',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {TOOL_DEFS.map((def) => (
        <div key={def.id} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              onToolStateChange({ tool: def.id });
              if (def.id === 'add-atom') togglePanel('element');
              else if (def.id === 'add-bond') togglePanel('bond');
              else if (def.id === 'ring') togglePanel('ring');
              else setExpandedPanel(null);
            }}
            title={`${def.label} (${def.shortcut})`}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                toolState.tool === def.id ? 'var(--kd-color-accent)' : 'var(--kd-color-surface)',
              color:
                toolState.tool === def.id
                  ? 'var(--kd-color-text-inverse)'
                  : 'var(--kd-color-text-primary)',
              border: '1px solid transparent',
              borderRadius: 'var(--kd-radius-sm)',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'background var(--kd-transition-fast)',
            }}
          >
            {def.icon}
          </button>
        </div>
      ))}

      {/* Element sub-palette */}
      {expandedPanel === 'element' && (
        <SubPalette title="Element">
          {COMMON_ELEMENTS.map((z) => (
            <button
              key={z}
              onClick={() => onToolStateChange({ element: z })}
              style={{
                ...subButtonStyle,
                background: toolState.element === z ? getColor(z) : 'var(--kd-color-surface)',
                color: toolState.element === z ? '#fff' : 'var(--kd-color-text-primary)',
              }}
              title={getSymbol(z)}
            >
              {getSymbol(z)}
            </button>
          ))}
        </SubPalette>
      )}

      {/* Bond style sub-palette */}
      {expandedPanel === 'bond' && (
        <SubPalette title="Bond">
          {BOND_STYLES.map((bs) => (
            <button
              key={bs.id}
              onClick={() => onToolStateChange({ bondStyle: bs.id })}
              style={{
                ...subButtonStyle,
                background:
                  toolState.bondStyle === bs.id
                    ? 'var(--kd-color-accent)'
                    : 'var(--kd-color-surface)',
                color:
                  toolState.bondStyle === bs.id
                    ? 'var(--kd-color-text-inverse)'
                    : 'var(--kd-color-text-primary)',
              }}
            >
              {bs.label}
            </button>
          ))}
        </SubPalette>
      )}

      {/* Ring sub-palette */}
      {expandedPanel === 'ring' && (
        <SubPalette title="Ring">
          {RING_TEMPLATES.map((rt: RingTemplate) => (
            <button
              key={rt.id}
              onClick={() => onToolStateChange({ ringTemplate: rt.id })}
              style={{
                ...subButtonStyle,
                background:
                  toolState.ringTemplate === rt.id
                    ? 'var(--kd-color-accent)'
                    : 'var(--kd-color-surface)',
                color:
                  toolState.ringTemplate === rt.id
                    ? 'var(--kd-color-text-inverse)'
                    : 'var(--kd-color-text-primary)',
                fontSize: 10,
              }}
            >
              {rt.name.slice(0, 4)}
            </button>
          ))}
        </SubPalette>
      )}
    </div>
  );
}

const subButtonStyle: React.CSSProperties = {
  width: 32,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--kd-color-border-subtle)',
  borderRadius: 'var(--kd-radius-sm)',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  transition: 'background var(--kd-transition-fast)',
};

function SubPalette({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        top: 0,
        background: 'var(--kd-glass-bg)',
        backdropFilter: 'var(--kd-glass-blur)',
        border: '1px solid var(--kd-glass-border)',
        borderRadius: 'var(--kd-radius-md)',
        boxShadow: 'var(--kd-shadow-md)',
        padding: 'var(--kd-space-sm)',
        zIndex: 30,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: 'var(--kd-color-text-muted)',
          textTransform: 'uppercase',
          marginBottom: 4,
          paddingLeft: 2,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>{children}</div>
    </div>
  );
}
