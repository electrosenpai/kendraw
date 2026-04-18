// Wave-6 new toolbox — orchestrator.
//
// Data-driven rendering from TOOL_DEFS. Groups are spatial (dividers
// between consecutive different groups). The analysis dock pins to the
// bottom via flex spacer. Matches Sally's wave-6 layout spec:
// docs/new-toolbox-spec-wave-6.md.

import type { ReactElement } from 'react';
import { ToolButton } from './ToolButton';
import { TOOL_DEFS } from './toolDefs';
import type { NewToolboxActionId, NewToolboxToolId } from './types';

export interface NewToolboxProps {
  /** Currently highlighted tool button (UI granularity — can be a bond
   *  variant even though the canvas registry only knows 'bond'). */
  activeToolId: NewToolboxToolId;
  onToolChange: (id: NewToolboxToolId) => void;

  /** Dispatched for action-kind and toggle-kind buttons. */
  onAction: (id: NewToolboxActionId) => void;

  /** Toggle state — drives aria-pressed on toggle buttons. */
  nmrOpen: boolean;
  propertyPanelVisible: boolean;

  /** When false, undo/redo render in disabled state (but remain visible). */
  canUndo: boolean;
  canRedo: boolean;
}

export function NewToolbox({
  activeToolId,
  onToolChange,
  onAction,
  nmrOpen,
  propertyPanelVisible,
  canUndo,
  canRedo,
}: NewToolboxProps): ReactElement {
  const analysisDock = TOOL_DEFS.filter((d) => d.group === 'analysis');
  const mainRail = TOOL_DEFS.filter((d) => d.group !== 'analysis');

  return (
    <div
      data-testid="new-toolbox"
      role="toolbar"
      aria-label="Canvas tools (new)"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 2,
        padding: 6,
        background: 'var(--kd-color-bg-secondary)',
        borderRight: '1px solid var(--kd-color-border)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {renderGroup(mainRail, activeToolId, onToolChange, onAction, {
        nmrOpen,
        propertyPanelVisible,
        canUndo,
        canRedo,
      })}

      <div style={{ flex: 1 }} aria-hidden="true" />

      <Separator />

      {renderGroup(analysisDock, activeToolId, onToolChange, onAction, {
        nmrOpen,
        propertyPanelVisible,
        canUndo,
        canRedo,
      })}
    </div>
  );
}

function renderGroup(
  defs: readonly (typeof TOOL_DEFS)[number][],
  activeToolId: NewToolboxToolId,
  onToolChange: (id: NewToolboxToolId) => void,
  onAction: (id: NewToolboxActionId) => void,
  flags: {
    nmrOpen: boolean;
    propertyPanelVisible: boolean;
    canUndo: boolean;
    canRedo: boolean;
  },
): ReactElement[] {
  const out: ReactElement[] = [];
  let prevGroup: string | null = null;

  for (const def of defs) {
    if (prevGroup !== null && prevGroup !== def.group) {
      out.push(<Separator key={`sep-${def.group}`} />);
    }
    prevGroup = def.group;

    let active = false;
    let disabled = false;

    if (def.kind === 'tool') {
      active = def.id === activeToolId;
    } else if (def.kind === 'toggle') {
      if (def.id === 'nmr-toggle') active = flags.nmrOpen;
      if (def.id === 'property-toggle') active = flags.propertyPanelVisible;
    } else if (def.kind === 'action') {
      if (def.id === 'undo') disabled = !flags.canUndo;
      if (def.id === 'redo') disabled = !flags.canRedo;
    }

    out.push(
      <ToolButton
        key={def.id}
        def={def}
        active={active}
        disabled={disabled}
        onClick={() => {
          if (def.kind === 'tool') onToolChange(def.id as NewToolboxToolId);
          else onAction(def.id as NewToolboxActionId);
        }}
      />,
    );
  }

  return out;
}

function Separator(): ReactElement {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        margin: '4px 2px',
        background: 'var(--kd-color-border)',
        opacity: 0.4,
      }}
    />
  );
}
