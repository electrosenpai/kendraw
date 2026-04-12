export type ToolId = 'select' | 'add-atom' | 'eraser' | 'pan';

interface ToolDef {
  id: ToolId;
  label: string;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'add-atom', label: 'Atom', shortcut: 'A' },
  { id: 'eraser', label: 'Eraser', shortcut: 'E' },
  { id: 'pan', label: 'Pan', shortcut: 'H' },
];

interface ToolPaletteProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
}

export function ToolPalette({ activeTool, onToolChange }: ToolPaletteProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--kd-space-sm)',
        padding: 'var(--kd-space-md)',
        background: 'var(--kd-glass-bg)',
        backdropFilter: 'var(--kd-glass-blur)',
        border: '1px solid var(--kd-glass-border)',
        borderRadius: 'var(--kd-radius-lg)',
        boxShadow: 'var(--kd-shadow-md)',
        zIndex: 20,
      }}
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              activeTool === tool.id ? 'var(--kd-color-accent)' : 'var(--kd-color-surface)',
            color:
              activeTool === tool.id
                ? 'var(--kd-color-text-inverse)'
                : 'var(--kd-color-text-primary)',
            border: '1px solid transparent',
            borderRadius: 'var(--kd-radius-sm)',
            cursor: 'pointer',
            fontSize: 'var(--kd-font-size-sm)',
            fontWeight: 600,
            transition: 'background var(--kd-transition-fast)',
          }}
        >
          {tool.shortcut}
        </button>
      ))}
    </div>
  );
}
