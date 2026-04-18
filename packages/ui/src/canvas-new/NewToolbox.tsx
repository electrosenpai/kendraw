// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
//
// Wave-5 hotfix — minimal toolbox UI for the new canvas. Renders a
// vertical button column for the tools currently registered in the
// canvas-new ToolRegistry (`select`, `bond`). Lives in the `toolbar`
// grid area so the rest of the app shell (header, properties, NMR,
// status bar) is shared verbatim with flag=false mode.

import type { CanvasNewToolId } from './CanvasNew';

export interface NewToolboxProps {
  activeToolId: CanvasNewToolId;
  onActiveToolChange: (id: CanvasNewToolId) => void;
}

interface ToolDef {
  id: CanvasNewToolId;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const TOOLS: readonly ToolDef[] = [
  {
    id: 'select',
    label: 'Sel',
    hint: 'Select / drag (S)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2l10 7-4.5 1.2L12 16l-2.5-1-2 5L4 2z" />
      </svg>
    ),
  },
  {
    id: 'bond',
    label: 'Bond',
    hint: 'Single bond (B)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="16" x2="16" y2="4" />
      </svg>
    ),
  },
];

export function NewToolbox({ activeToolId, onActiveToolChange }: NewToolboxProps): JSX.Element {
  return (
    <div
      data-testid="new-toolbox"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 4,
        padding: 6,
        background: 'var(--kd-color-bg-secondary)',
        borderRight: '1px solid var(--kd-color-border)',
        overflow: 'hidden',
      }}
      role="toolbar"
      aria-label="Canvas tools (new)"
    >
      {TOOLS.map((t) => {
        const active = t.id === activeToolId;
        return (
          <button
            key={t.id}
            type="button"
            data-testid={`new-tool-${t.id}`}
            aria-pressed={active}
            title={t.hint}
            onClick={() => onActiveToolChange(t.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 4px',
              background: active ? 'var(--kd-color-accent)' : 'transparent',
              color: active ? '#000' : 'var(--kd-color-text-primary)',
              border: '1px solid',
              borderColor: active ? 'var(--kd-color-accent)' : 'var(--kd-color-border)',
              borderRadius: 'var(--kd-radius-sm)',
              cursor: 'pointer',
              fontSize: 9,
              fontFamily: 'var(--kd-font-family)',
              userSelect: 'none',
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
