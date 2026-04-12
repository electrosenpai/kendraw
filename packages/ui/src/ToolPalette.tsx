import { useState, useRef, useEffect, useCallback } from 'react';
import { COMMON_ELEMENTS, getSymbol, getColor, RING_TEMPLATES } from '@kendraw/scene';
import type { RingTemplate } from '@kendraw/scene';

// ── Tool types ──────────────────────────────────────────────

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

// ── SVG Icons (inline, monochrome, 20x20 viewBox) ──────────

const Icons = {
  select: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2l10 7-4.5 1.2L12 16l-2.5-1-2 5L4 2z" />
    </svg>
  ),
  pan: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2v5M10 13v5M2 10h5M13 10h5" />
      <path d="M10 2l2 2-2-2-2 2M10 18l2-2-2 2-2-2M2 10l2-2-2 2 2 2M18 10l-2-2 2 2-2 2" />
    </svg>
  ),
  eraser: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 4.5l-7 7-4-4 7-7 4 4z" />
      <path d="M8.5 11.5l-4 4h6l4-4" />
      <line x1="6" y1="17" x2="17" y2="17" />
    </svg>
  ),
  atom: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="10" cy="10" r="4" />
      <ellipse cx="10" cy="10" rx="9" ry="4" transform="rotate(45 10 10)" />
    </svg>
  ),
  bond: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="5" cy="15" r="2.5" />
      <circle cx="15" cy="5" r="2.5" />
      <line x1="7" y1="13" x2="13" y2="7" />
    </svg>
  ),
  ring: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" />
    </svg>
  ),
  arrow: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="10" x2="15" y2="10" />
      <polyline points="12,6 16,10 12,14" />
    </svg>
  ),
  curly: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14 C6 4, 14 4, 17 8" />
      <polyline points="15,5 17,8 14,9" />
    </svg>
  ),
  undo: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8l4-4M4 8l4 4" />
      <path d="M4 8h8a5 5 0 010 10H9" />
    </svg>
  ),
  redo: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8l-4-4M16 8l-4 4" />
      <path d="M16 8H8a5 5 0 000 10h3" />
    </svg>
  ),
  zoomFit: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 7h14M3 13h14M7 3v14M13 3v14" />
    </svg>
  ),
};

// ── Bond style options ──────────────────────────────────────

const BOND_STYLES: { id: ToolState['bondStyle']; label: string; icon: React.ReactNode }[] = [
  { id: 'single', label: 'Single', icon: <span style={{ fontSize: 16 }}>—</span> },
  { id: 'double', label: 'Double', icon: <span style={{ fontSize: 16 }}>=</span> },
  { id: 'triple', label: 'Triple', icon: <span style={{ fontSize: 14 }}>≡</span> },
  { id: 'wedge', label: 'Wedge', icon: <span style={{ fontSize: 14 }}>▸</span> },
  { id: 'dash', label: 'Dash', icon: <span style={{ fontSize: 14 }}>┄</span> },
  { id: 'aromatic', label: 'Aromatic', icon: <span style={{ fontSize: 14 }}>◎</span> },
];

// ── Main component ──────────────────────────────────────────

interface ToolPaletteProps {
  toolState: ToolState;
  onToolStateChange: (state: Partial<ToolState>) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ToolPalette({
  toolState,
  onToolStateChange,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = false,
}: ToolPaletteProps) {
  const [flyout, setFlyout] = useState<string | null>(null);
  const [flyoutPos, setFlyoutPos] = useState(0);
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Close flyout on outside click
  useEffect(() => {
    if (!flyout) return;
    function handleClick(e: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyout(null);
      }
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [flyout]);

  const openFlyout = useCallback((id: string, buttonEl: HTMLButtonElement) => {
    const rect = buttonEl.getBoundingClientRect();
    setFlyoutPos(rect.top);
    setFlyout((prev) => (prev === id ? null : id));
  }, []);

  const selectTool = useCallback(
    (tool: ToolId) => {
      onToolStateChange({ tool });
      setFlyout(null);
    },
    [onToolStateChange],
  );

  return (
    <div style={paletteContainer}>
      {/* ── Selection ── */}
      <SectionLabel>Select</SectionLabel>
      <ToolButton
        icon={Icons.select}
        label="Select"
        shortcut="V"
        active={toolState.tool === 'select'}
        onClick={() => selectTool('select')}
      />
      <ToolButton
        icon={Icons.pan}
        label="Pan"
        shortcut="H"
        active={toolState.tool === 'pan'}
        onClick={() => selectTool('pan')}
      />
      <ToolButton
        icon={Icons.eraser}
        label="Eraser"
        shortcut="E"
        active={toolState.tool === 'eraser'}
        onClick={() => selectTool('eraser')}
      />

      <Separator />

      {/* ── Draw ── */}
      <SectionLabel>Draw</SectionLabel>
      <ToolButton
        icon={Icons.atom}
        label={`Atom (${getSymbol(toolState.element)})`}
        shortcut="A"
        active={toolState.tool === 'add-atom'}
        badge={getSymbol(toolState.element)}
        badgeColor={getColor(toolState.element)}
        onClick={() => selectTool('add-atom')}
        onContextMenu={(e, btn) => {
          e.preventDefault();
          openFlyout('element', btn);
        }}
      />
      <ToolButton
        icon={Icons.bond}
        label={`Bond (${toolState.bondStyle})`}
        shortcut="B"
        active={toolState.tool === 'add-bond'}
        onClick={() => selectTool('add-bond')}
        onContextMenu={(e, btn) => {
          e.preventDefault();
          openFlyout('bond', btn);
        }}
      />
      <ToolButton
        icon={Icons.ring}
        label="Ring"
        shortcut="R"
        active={toolState.tool === 'ring'}
        onClick={() => selectTool('ring')}
        onContextMenu={(e, btn) => {
          e.preventDefault();
          openFlyout('ring', btn);
        }}
      />

      <Separator />

      {/* ── Annotate ── */}
      <SectionLabel>React</SectionLabel>
      <ToolButton
        icon={Icons.arrow}
        label="Reaction Arrow"
        shortcut="W"
        active={toolState.tool === 'arrow'}
        onClick={() => selectTool('arrow')}
      />
      <ToolButton
        icon={Icons.curly}
        label="Curly Arrow"
        shortcut="U"
        active={toolState.tool === 'curly-arrow'}
        onClick={() => selectTool('curly-arrow')}
      />

      <div style={{ flex: 1 }} />

      {/* ── Actions ── */}
      <Separator />
      <ToolButton
        icon={Icons.undo}
        label="Undo"
        shortcut="Ctrl+Z"
        active={false}
        disabled={!canUndo}
        onClick={onUndo}
      />
      <ToolButton
        icon={Icons.redo}
        label="Redo"
        shortcut="Ctrl+Y"
        active={false}
        disabled={!canRedo}
        onClick={onRedo}
      />
      <ToolButton
        icon={Icons.zoomFit}
        label="Zoom to Fit"
        shortcut="Ctrl+0"
        active={false}
        onClick={() => {
          /* TODO */
        }}
      />

      {/* ── Flyout panels ── */}
      {flyout && (
        <div ref={flyoutRef} style={{ ...flyoutContainer, top: flyoutPos }}>
          {flyout === 'element' && (
            <FlyoutPanel title="Element">
              <div style={flyoutGrid}>
                {COMMON_ELEMENTS.map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      onToolStateChange({ element: z, tool: 'add-atom' });
                      setFlyout(null);
                    }}
                    style={{
                      ...flyoutChip,
                      background: toolState.element === z ? getColor(z) : 'var(--kd-color-surface)',
                      color: toolState.element === z ? '#fff' : 'var(--kd-color-text-primary)',
                    }}
                    title={getSymbol(z)}
                  >
                    {getSymbol(z)}
                  </button>
                ))}
              </div>
            </FlyoutPanel>
          )}

          {flyout === 'bond' && (
            <FlyoutPanel title="Bond Style">
              <div style={flyoutGrid}>
                {BOND_STYLES.map((bs) => (
                  <button
                    key={bs.id}
                    onClick={() => {
                      onToolStateChange({ bondStyle: bs.id, tool: 'add-bond' });
                      setFlyout(null);
                    }}
                    title={bs.label}
                    style={{
                      ...flyoutChip,
                      background:
                        toolState.bondStyle === bs.id
                          ? 'var(--kd-color-accent)'
                          : 'var(--kd-color-surface)',
                      color:
                        toolState.bondStyle === bs.id ? '#fff' : 'var(--kd-color-text-primary)',
                    }}
                  >
                    {bs.icon}
                  </button>
                ))}
              </div>
            </FlyoutPanel>
          )}

          {flyout === 'ring' && (
            <FlyoutPanel title="Ring Template">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {RING_TEMPLATES.map((rt: RingTemplate) => (
                  <button
                    key={rt.id}
                    onClick={() => {
                      onToolStateChange({ ringTemplate: rt.id, tool: 'ring' });
                      setFlyout(null);
                    }}
                    style={{
                      ...flyoutRow,
                      background:
                        toolState.ringTemplate === rt.id
                          ? 'var(--kd-color-accent-muted)'
                          : 'transparent',
                    }}
                  >
                    {rt.name}
                  </button>
                ))}
              </div>
            </FlyoutPanel>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function ToolButton({
  icon,
  label,
  shortcut,
  active,
  disabled,
  badge,
  badgeColor,
  onClick,
  onContextMenu,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  active: boolean;
  disabled?: boolean;
  badge?: string;
  badgeColor?: string;
  onClick?: (() => void) | undefined;
  onContextMenu?: ((e: React.MouseEvent, btn: HTMLButtonElement) => void) | undefined;
}) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hovered) {
      timerRef.current = setTimeout(() => setShowTooltip(true), 400);
    } else {
      clearTimeout(timerRef.current);
      setShowTooltip(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [hovered]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={onClick}
        onContextMenu={
          onContextMenu
            ? (e) => {
                const btn = btnRef.current;
                if (btn) onContextMenu(e, btn);
              }
            : undefined
        }
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={disabled}
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: active
            ? 'var(--kd-color-accent-muted)'
            : hovered
              ? 'rgba(255,255,255,0.06)'
              : 'transparent',
          color: active
            ? 'var(--kd-color-accent)'
            : disabled
              ? 'var(--kd-color-text-muted)'
              : 'var(--kd-color-text-primary)',
          border: 'none',
          borderLeft: active ? '2px solid var(--kd-color-accent)' : '2px solid transparent',
          borderRadius: 'var(--kd-radius-md)',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 150ms ease',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {icon}
        {badge && (
          <span
            style={{
              position: 'absolute',
              bottom: 2,
              right: 4,
              fontSize: 8,
              fontWeight: 700,
              color: badgeColor ?? 'var(--kd-color-text-muted)',
              lineHeight: 1,
            }}
          >
            {badge}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div style={tooltipStyle}>
          <span>{label}</span>
          <kbd style={kbdStyle}>{shortcut}</kbd>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--kd-color-text-muted)',
        opacity: 0.5,
        padding: '8px 0 2px 6px',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}

function Separator() {
  return (
    <div
      style={{
        height: 1,
        margin: '4px 8px',
        background: 'rgba(255,255,255,0.06)',
      }}
    />
  );
}

function FlyoutPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--kd-color-text-muted)',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

const paletteContainer: React.CSSProperties = {
  width: 64,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(20, 20, 20, 0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '4px 6px',
  gap: 1,
  overflowY: 'auto',
  position: 'relative',
  zIndex: 20,
};

const flyoutContainer: React.CSSProperties = {
  position: 'fixed',
  left: 72,
  background: 'rgba(25, 25, 25, 0.92)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 10,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: 10,
  zIndex: 50,
  minWidth: 140,
};

const flyoutGrid: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 3,
};

const flyoutChip: React.CSSProperties = {
  width: 34,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  transition: 'background 100ms ease',
};

const flyoutRow: React.CSSProperties = {
  padding: '5px 8px',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 11,
  color: 'var(--kd-color-text-primary)',
  textAlign: 'left',
  transition: 'background 100ms ease',
};

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  left: 52,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(10, 10, 10, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  padding: '4px 8px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  fontSize: 11,
  color: 'var(--kd-color-text-primary)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  zIndex: 100,
  pointerEvents: 'none',
};

const kbdStyle: React.CSSProperties = {
  fontSize: 9,
  padding: '1px 4px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 3,
  color: 'var(--kd-color-text-muted)',
  fontFamily: 'var(--kd-font-mono)',
};
