import { getSymbol } from '@kendraw/scene';
import type { ToolState } from './ToolPalette';

interface StatusBarProps {
  toolState: ToolState;
  zoom: number;
  atomCount: number;
  bondCount: number;
  selectionCount: number;
  valenceWarnings: number;
  cursorPos: { x: number; y: number } | null;
}

const TOOL_HELP: Record<string, (ts: ToolState) => string> = {
  select: () => 'Click to select. Drag for rectangle. Shift+click to extend.',
  pan: () => 'Drag to pan. Scroll to zoom.',
  eraser: () => 'Click atom or bond to delete.',
  'add-atom': (ts) =>
    `Click to place ${getSymbol(ts.element)}. Right-click for elements. Keys 0-9.`,
  'add-bond': (ts) =>
    `Click atom A, then atom B for ${ts.bondStyle} bond. Right-click for types. Angle snap ${ts.angleSnap ? 'on' : 'off'} (Ctrl+E).`,
  chain: () => 'Drag to draw an N-carbon zigzag. Longer drag → more carbons.',
  ring: (ts) => `Click to insert ${ts.ringTemplate}. Right-click for templates.`,
  arrow: () => 'Click start, then click end for reaction arrow.',
  'curly-arrow': () => 'Click start, then click end for mechanism arrow.',
};

const TOOL_NAMES: Record<string, string> = {
  select: 'Select',
  pan: 'Pan',
  eraser: 'Eraser',
  'add-atom': 'Atom',
  'add-bond': 'Bond',
  chain: 'Chain',
  ring: 'Ring',
  arrow: 'Arrow',
  'curly-arrow': 'Curly Arrow',
};

export function StatusBar({
  toolState,
  zoom,
  atomCount,
  bondCount,
  selectionCount,
  valenceWarnings,
  cursorPos,
}: StatusBarProps) {
  const helpFn = TOOL_HELP[toolState.tool];
  const helpText = helpFn ? helpFn(toolState) : '';
  const toolName = TOOL_NAMES[toolState.tool] ?? toolState.tool;

  return (
    <div style={barStyle}>
      {/* Left: tool name + help */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: 'var(--kd-color-text-primary)' }}>{toolName}</span>
        <span style={helpStyle}>{helpText}</span>
      </div>

      {/* Center: cursor coords */}
      {cursorPos && (
        <div style={coordStyle}>
          {Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}
        </div>
      )}

      {/* Right: stats */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {selectionCount > 0 && <span style={statStyle}>{selectionCount} sel</span>}
        {valenceWarnings > 0 && (
          <span style={{ ...statStyle, color: 'var(--kd-color-warning)' }}>
            {valenceWarnings} val
          </span>
        )}
        <span style={statStyle}>
          {atomCount}a {bondCount}b
        </span>
        <span
          style={{
            ...statStyle,
            color: toolState.angleSnap
              ? 'var(--kd-color-text-muted)'
              : 'var(--kd-color-warning)',
          }}
          title="Angle snap (Ctrl+E)"
          data-testid="angle-snap-indicator"
        >
          ∠{toolState.angleSnap ? 'snap' : 'free'}
        </span>
        <span style={statStyle}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

const barStyle: React.CSSProperties = {
  height: 24,
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  gap: 16,
  background: 'rgba(20, 20, 20, 0.9)',
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  fontSize: 10,
  color: 'var(--kd-color-text-muted)',
  fontFamily: 'var(--kd-font-family)',
  userSelect: 'none',
};

const helpStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  opacity: 0.6,
};

const coordStyle: React.CSSProperties = {
  fontFamily: 'var(--kd-font-mono)',
  fontSize: 9,
  minWidth: 70,
  textAlign: 'center',
};

const statStyle: React.CSSProperties = {
  fontFamily: 'var(--kd-font-mono)',
  fontSize: 9,
};
