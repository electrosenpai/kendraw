// Wave-6 / wave-7 new toolbox — orchestrator.
//
// Data-driven 2-column grid. Tools are bucketed by `group`; each group
// renders as its own CSS grid with repeat(2, 1fr) so buttons land
// side-by-side, separator between groups, analysis dock pinned to the
// bottom via flex spacer. Matches the wave-7 hotfix layout spec.

import type { ReactElement } from 'react';
import { ToolButton } from './ToolButton';
import { TOOL_DEFS } from './toolDefs';
import type {
  NewToolboxActionId,
  NewToolboxGroup,
  NewToolboxToolId,
  ToolDef,
} from './types';

const MAIN_GROUP_ORDER: NewToolboxGroup[] = [
  'pointer',
  'bond',
  'atom',
  'ring',
  'annotation',
  'edit',
  'view',
];

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

export function NewToolbox(props: NewToolboxProps): ReactElement {
  const byGroup = bucketByGroup(TOOL_DEFS);
  const analysisDock = byGroup.analysis ?? [];
  const mainGroups = MAIN_GROUP_ORDER
    .map((g) => [g, byGroup[g] ?? []] as const)
    .filter(([, defs]) => defs.length > 0);

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
        boxSizing: 'border-box',
      }}
    >
      {mainGroups.map(([group, defs], idx) => (
        <div key={group} style={{ display: 'contents' }}>
          {idx > 0 && <Separator />}
          {renderGroup(group, defs, props)}
        </div>
      ))}

      <div style={{ flex: 1 }} aria-hidden="true" />

      {analysisDock.length > 0 && (
        <>
          <Separator />
          {renderGroup('analysis', analysisDock, props)}
        </>
      )}
    </div>
  );
}

function renderGroup(
  group: NewToolboxGroup,
  defs: ToolDef[],
  props: NewToolboxProps,
): ReactElement {
  return (
    <div
      data-testid={`new-tool-group-${group}`}
      data-group={group}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 3,
      }}
    >
      {defs.map((def) => {
        let active = false;
        let disabled = false;
        if (def.kind === 'tool') {
          active = def.id === props.activeToolId;
        } else if (def.kind === 'toggle') {
          if (def.id === 'nmr-toggle') active = props.nmrOpen;
          if (def.id === 'property-toggle') active = props.propertyPanelVisible;
        } else if (def.kind === 'action') {
          if (def.id === 'undo') disabled = !props.canUndo;
          if (def.id === 'redo') disabled = !props.canRedo;
        }
        return (
          <ToolButton
            key={def.id}
            def={def}
            active={active}
            disabled={disabled}
            onClick={() => {
              if (def.kind === 'tool') props.onToolChange(def.id as NewToolboxToolId);
              else props.onAction(def.id as NewToolboxActionId);
            }}
          />
        );
      })}
    </div>
  );
}

function bucketByGroup(defs: readonly ToolDef[]): Partial<Record<NewToolboxGroup, ToolDef[]>> {
  const out: Partial<Record<NewToolboxGroup, ToolDef[]>> = {};
  for (const d of defs) {
    const list = out[d.group] ?? (out[d.group] = []);
    list.push(d);
  }
  return out;
}

function Separator(): ReactElement {
  return (
    <div
      aria-hidden="true"
      data-testid="new-tool-separator"
      style={{
        height: 1,
        margin: '4px 2px',
        background: 'var(--kd-color-border)',
        opacity: 0.4,
      }}
    />
  );
}
