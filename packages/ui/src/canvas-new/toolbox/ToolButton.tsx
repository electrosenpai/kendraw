// Wave-6 new toolbox — generic tool button primitive.

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
  const comingSoon = def.comingSoon === true;
  const displayDisabled = disabled || comingSoon;
  const fullTooltip = comingSoon
    ? `${def.tooltip} — Coming in wave-7`
    : def.shortcut
      ? `${def.tooltip} (${def.shortcut})`
      : def.tooltip;

  return (
    <button
      type="button"
      data-testid={`new-tool-${def.id}`}
      data-tool-kind={def.kind}
      data-tool-group={def.group}
      data-coming-soon={comingSoon ? 'true' : undefined}
      data-active={active && !displayDisabled ? 'true' : 'false'}
      aria-pressed={def.kind === 'toggle' ? active : undefined}
      aria-disabled={displayDisabled}
      aria-label={def.tooltip}
      title={fullTooltip}
      disabled={displayDisabled && def.kind !== 'tool'}
      onClick={() => {
        if (displayDisabled) return;
        onClick();
      }}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '6px 4px',
        width: '100%',
        minHeight: 40,
        background: active && !displayDisabled ? 'var(--kd-color-accent)' : 'transparent',
        color: active && !displayDisabled ? '#000' : 'var(--kd-color-text-primary)',
        border: '1px solid',
        borderColor: active && !displayDisabled ? 'var(--kd-color-accent)' : 'var(--kd-color-border)',
        borderRadius: 'var(--kd-radius-sm)',
        cursor: displayDisabled ? 'not-allowed' : 'pointer',
        opacity: displayDisabled ? 0.4 : 1,
        fontSize: 9,
        fontFamily: 'var(--kd-font-family)',
        userSelect: 'none',
        transition: 'background 80ms ease, border-color 80ms ease',
      }}
    >
      <Icon size={18} />
      <span aria-hidden="true">{def.label}</span>
      {comingSoon && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            fontSize: 7,
            padding: '0 2px',
            borderRadius: 2,
            background: 'var(--kd-color-border)',
            color: 'var(--kd-color-text-muted)',
          }}
        >
          soon
        </span>
      )}
    </button>
  );
}
