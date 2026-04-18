// Wave-6 new toolbox — generic square icon button for the 2-column rail.

import type { ReactElement } from 'react';
import { getIcon } from './icons';
import type { ToolDef } from './types';

interface ToolButtonProps {
  def: ToolDef;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function ToolButton({ def, active, disabled, onClick }: ToolButtonProps): ReactElement {
  const Icon = getIcon(def.iconId);
  const fullTooltip = def.shortcut ? `${def.tooltip} (${def.shortcut})` : def.tooltip;

  return (
    <button
      type="button"
      data-testid={`new-tool-${def.id}`}
      data-tool-kind={def.kind}
      data-tool-group={def.group}
      data-active={active && !disabled ? 'true' : 'false'}
      aria-pressed={def.kind === 'toggle' ? active : undefined}
      aria-disabled={disabled}
      aria-label={def.tooltip}
      title={fullTooltip}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        aspectRatio: '1 / 1',
        minHeight: 30,
        padding: 2,
        background: active && !disabled ? 'var(--kd-color-accent)' : 'transparent',
        color: active && !disabled ? '#000' : 'var(--kd-color-text-primary)',
        border: '1px solid',
        borderColor: active && !disabled ? 'var(--kd-color-accent)' : 'var(--kd-color-border)',
        borderRadius: 'var(--kd-radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        transition: 'background 80ms ease, border-color 80ms ease',
      }}
    >
      <Icon size={18} />
    </button>
  );
}
