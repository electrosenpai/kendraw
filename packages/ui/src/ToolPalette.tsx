import { useState, useRef, useEffect, useCallback } from 'react';
import {
  COMMON_ELEMENTS,
  getSymbol,
  getColor,
  RING_TEMPLATES,
  FUSED_RING_TEMPLATES,
} from '@kendraw/scene';
import type { RingTemplate, FusedRingTemplate } from '@kendraw/scene';

// ── Types ───────────────────────────────────────────────────

export type ToolId =
  | 'select'
  | 'lasso'
  | 'add-atom'
  | 'add-bond'
  | 'ring'
  | 'text'
  | 'eraser'
  | 'pan'
  | 'arrow'
  | 'curly-arrow';

export interface ToolState {
  tool: ToolId;
  element: number;
  bondStyle:
    | 'single'
    | 'double'
    | 'triple'
    | 'wedge'
    | 'dash'
    | 'aromatic'
    | 'wavy'
    | 'bold'
    | 'hashed-wedge';
  ringTemplate: string;
  arrowType:
    | 'forward'
    | 'equilibrium'
    | 'reversible'
    | 'resonance'
    | 'retro'
    | 'dipole'
    | 'no-go';
  curlyType: 'pair' | 'radical';
  /** When true, new bonds snap to 30° increments. When false, bonds follow the
   *  cursor freely. Shift inverts whichever mode is active (wave-3 A5). */
  angleSnap: boolean;
}

export const DEFAULT_TOOL_STATE: ToolState = {
  tool: 'add-atom',
  element: 6,
  bondStyle: 'single',
  ringTemplate: 'benzene',
  arrowType: 'forward',
  curlyType: 'pair',
  angleSnap: true,
};

// ── Icons (20x20 SVG, stroke 1.5) ──────────────────────────

function I({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICN = {
  select: (
    <I>
      <path d="M4 2l10 7-4.5 1.2L12 16l-2.5-1-2 5L4 2z" />
    </I>
  ),
  lasso: (
    <I>
      <path d="M4 6c0-2 3-3 6-3s6 1 6 3-3 3-6 3-6-1-6-3z" />
      <path d="M6 9v4l-1 3" />
      <circle cx="5" cy="17" r="1.2" />
    </I>
  ),
  pan: (
    <I>
      <path d="M10 2v5M10 13v5M2 10h5M13 10h5" />
      <path d="M10 2l2 2-2-2-2 2M10 18l2-2-2 2-2-2M2 10l2-2-2 2 2 2M18 10l-2-2 2 2-2 2" />
    </I>
  ),
  eraser: (
    <I>
      <path d="M15.5 4.5l-7 7-4-4 7-7 4 4z" />
      <path d="M8.5 11.5l-4 4h6l4-4" />
      <line x1="6" y1="17" x2="17" y2="17" />
    </I>
  ),
  atom: (
    <I>
      <circle cx="10" cy="10" r="4" />
      <ellipse cx="10" cy="10" rx="9" ry="4" transform="rotate(45 10 10)" />
    </I>
  ),
  bond: (
    <I>
      <circle cx="5" cy="15" r="2.5" />
      <circle cx="15" cy="5" r="2.5" />
      <line x1="7" y1="13" x2="13" y2="7" />
    </I>
  ),
  ring: (
    <I>
      <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" />
    </I>
  ),
  molecule: (
    <I>
      <circle cx="6" cy="6" r="3" />
      <circle cx="14" cy="6" r="3" />
      <circle cx="10" cy="14" r="3" />
      <line x1="8.5" y1="7.5" x2="11.5" y2="7.5" />
      <line x1="7.5" y1="8.5" x2="9" y2="12" />
      <line x1="12.5" y1="8.5" x2="11" y2="12" />
    </I>
  ),
  arrow: (
    <I>
      <line x1="3" y1="10" x2="15" y2="10" />
      <polyline points="12,6 16,10 12,14" />
    </I>
  ),
  text: (
    <I>
      <text
        x="10"
        y="15"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="16"
        fontWeight="bold"
        fontFamily="serif"
      >
        T
      </text>
    </I>
  ),
  curly: (
    <I>
      <path d="M3 14 C6 4, 14 4, 17 8" />
      <polyline points="15,5 17,8 14,9" />
    </I>
  ),
  undo: (
    <I>
      <path d="M4 8l4-4M4 8l4 4" />
      <path d="M4 8h8a5 5 0 010 10H9" />
    </I>
  ),
  redo: (
    <I>
      <path d="M16 8l-4-4M16 8l-4 4" />
      <path d="M16 8H8a5 5 0 000 10h3" />
    </I>
  ),
  fit: (
    <I>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 7h14M3 13h14M7 3v14M13 3v14" />
    </I>
  ),
  import: (
    <I>
      <path d="M4 14h12M10 3v9M10 12l-3-3M10 12l3-3" />
    </I>
  ),
  nmr: (
    <I>
      <path d="M2 14h3l2-8 2 12 2-6 2 4 2-10 2 6h3" />
    </I>
  ),
  numbering: (
    <I>
      <text
        x="3"
        y="14"
        textAnchor="start"
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="bold"
      >
        1
      </text>
      <text
        x="9"
        y="14"
        textAnchor="start"
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="bold"
      >
        2
      </text>
      <text
        x="15"
        y="14"
        textAnchor="start"
        fill="currentColor"
        stroke="none"
        fontSize="9"
        fontWeight="bold"
      >
        3
      </text>
    </I>
  ),
};

// ── Tool definitions ────────────────────────────────────────

interface ToolDef {
  id:
    | ToolId
    | 'molecules'
    | 'import'
    | 'undo'
    | 'redo'
    | 'fit'
    | 'nmr'
    | 'compound-numbering'
    | 'print';
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  description: string;
  hasSubmenu?: boolean;
  action?: true;
}

const GROUPS: { label: string; tools: ToolDef[] }[] = [
  // Group 1 — Selection
  {
    label: 'Selection',
    tools: [
      {
        id: 'select',
        icon: ICN.select,
        label: 'Select',
        shortcut: 'V',
        description: 'Select and move atoms',
      },
      {
        id: 'lasso',
        icon: ICN.lasso,
        label: 'Lasso',
        shortcut: 'L',
        description: 'Free-form lasso selection',
      },
      { id: 'pan', icon: ICN.pan, label: 'Pan', shortcut: 'H', description: 'Pan the canvas' },
    ],
  },
  // Group 2 — Bonds
  {
    label: 'Bonds',
    tools: [
      {
        id: 'add-bond',
        icon: ICN.bond,
        label: 'Single Bond',
        shortcut: '1',
        description: 'Draw bonds (right-click for type)',
        hasSubmenu: true,
      },
    ],
  },
  // Group 3 — Atoms
  {
    label: 'Atoms',
    tools: [
      {
        id: 'add-atom',
        icon: ICN.atom,
        label: 'Atom',
        shortcut: 'A',
        description: 'Place atoms (right-click for elements)',
        hasSubmenu: true,
      },
    ],
  },
  // Group 4 — Structures
  {
    label: 'Structures',
    tools: [
      {
        id: 'ring',
        icon: ICN.ring,
        label: 'Ring',
        shortcut: 'R',
        description: 'Insert ring templates',
        hasSubmenu: true,
      },
    ],
  },
  // Group 5 — Annotations
  {
    label: 'Annotations',
    tools: [
      {
        id: 'text',
        icon: ICN.text,
        label: 'Text',
        shortcut: 'T',
        description: 'Add text annotations',
      },
      {
        id: 'arrow',
        icon: ICN.arrow,
        label: 'Arrow',
        shortcut: 'W',
        description: 'Reaction arrows (right-click for type)',
        hasSubmenu: true,
      },
      {
        id: 'curly-arrow',
        icon: ICN.curly,
        label: 'Curly Arrow',
        shortcut: 'U',
        description: 'Curved mechanism arrows (right-click for pair/radical)',
        hasSubmenu: true,
      },
    ],
  },
  // Group 6 — Editing
  {
    label: 'Editing',
    tools: [
      {
        id: 'eraser',
        icon: ICN.eraser,
        label: 'Eraser',
        shortcut: 'E',
        description: 'Delete atoms and bonds',
      },
    ],
  },
  // Group 7 — Analysis
  {
    label: 'Analysis',
    tools: [
      {
        id: 'nmr',
        icon: ICN.nmr,
        label: 'NMR',
        shortcut: 'Ctrl+M',
        description: 'Toggle NMR spectrum prediction panel',
      },
      {
        id: 'molecules',
        icon: ICN.molecule,
        label: 'Molecules',
        shortcut: 'Ctrl+L',
        description: 'Browse molecule library',
      },
      {
        id: 'import',
        icon: ICN.import,
        label: 'Import',
        shortcut: 'Ctrl+I',
        description: 'Import CDXML, MOL, SMILES files',
      },
    ],
  },
  // Group 8 — Display
  {
    label: 'Display',
    tools: [
      {
        id: 'compound-numbering',
        icon: ICN.numbering,
        label: 'Compound #',
        shortcut: 'Ctrl+Shift+C',
        description: 'Toggle compound numbers (1, 2, 3…) under each connected molecule',
      },
    ],
  },
];

const ACTIONS: ToolDef[] = [
  {
    id: 'undo',
    icon: ICN.undo,
    label: 'Undo',
    shortcut: 'Ctrl+Z',
    description: 'Undo last action',
    action: true,
  },
  {
    id: 'redo',
    icon: ICN.redo,
    label: 'Redo',
    shortcut: 'Ctrl+Y',
    description: 'Redo last action',
    action: true,
  },
  {
    id: 'fit',
    icon: ICN.fit,
    label: 'Fit',
    shortcut: 'Ctrl+0',
    description: 'Fit all to screen',
    action: true,
  },
];

const BOND_OPTIONS: { id: ToolState['bondStyle']; label: string; sym: string }[] = [
  { id: 'single', label: 'Single (1)', sym: '—' },
  { id: 'double', label: 'Double (2)', sym: '=' },
  { id: 'triple', label: 'Triple (3)', sym: '≡' },
  { id: 'wedge', label: 'Wedge (W)', sym: '▸' },
  { id: 'dash', label: 'Dashed (D)', sym: '┄' },
  { id: 'bold', label: 'Bold (B)', sym: '━' },
  { id: 'wavy', label: 'Wavy (Y)', sym: '∿' },
  { id: 'hashed-wedge', label: 'Hashed Wedge', sym: '▹' },
  { id: 'aromatic', label: 'Aromatic', sym: '◎' },
];

// ── Main component ──────────────────────────────────────────

interface ToolPaletteProps {
  toolState: ToolState;
  onToolStateChange: (state: Partial<ToolState>) => void;
  onUndo?: (() => void) | undefined;
  onRedo?: (() => void) | undefined;
  onMoleculeSearch?: (() => void) | undefined;
  onImportFile?: (() => void) | undefined;
  onFitToScreen?: (() => void) | undefined;
  onNmrToggle?: (() => void) | undefined;
  onToggleCompoundNumbering?: (() => void) | undefined;
  compoundNumberingEnabled?: boolean;
  nmrOpen?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ToolPalette({
  toolState,
  onToolStateChange,
  onUndo,
  onRedo,
  onImportFile,
  onMoleculeSearch,
  onFitToScreen,
  onNmrToggle,
  onToggleCompoundNumbering,
  compoundNumberingEnabled = false,
  nmrOpen = false,
  canUndo = true,
  canRedo = false,
}: ToolPaletteProps) {
  const [submenu, setSubmenu] = useState<string | null>(null);
  const [submenuTop, setSubmenuTop] = useState(0);
  const submenuRef = useRef<HTMLDivElement>(null);

  // Close submenu on outside click
  useEffect(() => {
    if (!submenu) return;
    const h = (e: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(e.target as Node)) setSubmenu(null);
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [submenu]);

  const handleClick = useCallback(
    (def: ToolDef) => {
      if (def.id === 'molecules') {
        onMoleculeSearch?.();
        return;
      }
      if (def.id === 'import') {
        onImportFile?.();
        return;
      }
      if (def.id === 'undo') {
        onUndo?.();
        return;
      }
      if (def.id === 'redo') {
        onRedo?.();
        return;
      }
      if (def.id === 'fit') {
        onFitToScreen?.();
        return;
      }
      if (def.id === 'nmr') {
        onNmrToggle?.();
        return;
      }
      if (def.id === 'compound-numbering') {
        onToggleCompoundNumbering?.();
        return;
      }
      onToolStateChange({ tool: def.id as ToolId });
      setSubmenu(null);
    },
    [
      onToolStateChange,
      onMoleculeSearch,
      onImportFile,
      onUndo,
      onRedo,
      onFitToScreen,
      onNmrToggle,
      onToggleCompoundNumbering,
    ],
  );

  const handleContext = useCallback(
    (def: ToolDef, el: HTMLButtonElement) => {
      if (!def.hasSubmenu) return;
      const r = el.getBoundingClientRect();
      setSubmenuTop(r.top);
      setSubmenu((p) => (p === def.id ? null : def.id));
      onToolStateChange({ tool: def.id as ToolId });
    },
    [onToolStateChange],
  );

  return (
    <div style={PALETTE}>
      {GROUPS.map((g, gi) => (
        <div key={gi}>
          {gi > 0 && <Sep />}
          {g.tools.map((def) => (
            <Btn
              key={def.id}
              def={def}
              active={
                def.id === 'nmr'
                  ? nmrOpen
                  : def.id === 'compound-numbering'
                    ? compoundNumberingEnabled
                    : toolState.tool === def.id
              }
              badge={def.id === 'add-atom' ? getSymbol(toolState.element) : undefined}
              badgeColor={def.id === 'add-atom' ? getColor(toolState.element) : undefined}
              onClick={() => handleClick(def)}
              onContextMenu={(el) => handleContext(def, el)}
            />
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <Sep />
      {ACTIONS.map((def) => (
        <Btn
          key={def.id}
          def={def}
          active={false}
          disabled={def.id === 'undo' ? !canUndo : def.id === 'redo' ? !canRedo : false}
          onClick={() => handleClick(def)}
        />
      ))}

      {/* ── Submenus ── */}
      {submenu && (
        <div ref={submenuRef} style={{ ...SUBMENU, top: submenuTop }}>
          {submenu === 'add-atom' && (
            <Sub title="Element">
              <div style={GRID}>
                {COMMON_ELEMENTS.map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      onToolStateChange({ element: z, tool: 'add-atom' });
                      setSubmenu(null);
                    }}
                    style={{
                      ...CHIP,
                      background: toolState.element === z ? getColor(z) : 'var(--kd-color-surface)',
                      color: toolState.element === z ? '#fff' : 'var(--kd-color-text-primary)',
                    }}
                    title={getSymbol(z)}
                  >
                    {getSymbol(z)}
                  </button>
                ))}
              </div>
            </Sub>
          )}
          {submenu === 'add-bond' && (
            <Sub title="Bond Type">
              <div style={GRID}>
                {BOND_OPTIONS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onToolStateChange({ bondStyle: b.id, tool: 'add-bond' });
                      setSubmenu(null);
                    }}
                    title={b.label}
                    style={{
                      ...CHIP,
                      background:
                        toolState.bondStyle === b.id
                          ? 'var(--kd-color-accent)'
                          : 'var(--kd-color-surface)',
                      color: toolState.bondStyle === b.id ? '#fff' : 'var(--kd-color-text-primary)',
                      fontSize: 14,
                    }}
                  >
                    {b.sym}
                  </button>
                ))}
              </div>
            </Sub>
          )}
          {submenu === 'ring' && (
            <div>
              <Sub title="Simple Rings">
                {RING_TEMPLATES.map((rt: RingTemplate) => (
                  <button
                    key={rt.id}
                    onClick={() => {
                      onToolStateChange({ ringTemplate: rt.id, tool: 'ring' });
                      setSubmenu(null);
                    }}
                    style={{
                      ...ROW,
                      background:
                        toolState.ringTemplate === rt.id
                          ? 'var(--kd-color-accent-muted)'
                          : 'transparent',
                    }}
                  >
                    {rt.name}
                  </button>
                ))}
              </Sub>
              {(['aromatic', 'heterocyclic', 'biological'] as const).map((cat) => {
                const templates = FUSED_RING_TEMPLATES.filter(
                  (t: FusedRingTemplate) => t.category === cat,
                );
                if (templates.length === 0) return null;
                const label =
                  cat === 'aromatic'
                    ? 'Fused Aromatic'
                    : cat === 'heterocyclic'
                      ? 'Fused Heterocyclic'
                      : 'Biological';
                return (
                  <Sub key={cat} title={label}>
                    {templates.map((ft: FusedRingTemplate) => (
                      <button
                        key={ft.id}
                        onClick={() => {
                          onToolStateChange({ ringTemplate: ft.id, tool: 'ring' });
                          setSubmenu(null);
                        }}
                        style={{
                          ...ROW,
                          background:
                            toolState.ringTemplate === ft.id
                              ? 'var(--kd-color-accent-muted)'
                              : 'transparent',
                        }}
                      >
                        {ft.name}
                      </button>
                    ))}
                  </Sub>
                );
              })}
            </div>
          )}
          {submenu === 'arrow' && (
            <Sub title="Arrow Type">
              {ARROW_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    onToolStateChange({ arrowType: a.id, tool: 'arrow' });
                    setSubmenu(null);
                  }}
                  style={{
                    ...ROW,
                    background:
                      toolState.arrowType === a.id
                        ? 'var(--kd-color-accent-muted)'
                        : 'transparent',
                  }}
                >
                  {a.label}
                </button>
              ))}
            </Sub>
          )}
          {submenu === 'curly-arrow' && (
            <Sub title="Curly Arrow">
              {(
                [
                  { id: 'pair', label: 'Electron pair (full head)' },
                  { id: 'radical', label: 'Radical (half head)' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onToolStateChange({ curlyType: c.id, tool: 'curly-arrow' });
                    setSubmenu(null);
                  }}
                  style={{
                    ...ROW,
                    background:
                      toolState.curlyType === c.id
                        ? 'var(--kd-color-accent-muted)'
                        : 'transparent',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </Sub>
          )}
        </div>
      )}
    </div>
  );
}

const ARROW_OPTIONS: { id: ToolState['arrowType']; label: string }[] = [
  { id: 'forward', label: 'Forward (→)' },
  { id: 'equilibrium', label: 'Equilibrium (⇌)' },
  { id: 'reversible', label: 'Reversible (⇄)' },
  { id: 'resonance', label: 'Resonance (↔)' },
  { id: 'retro', label: 'Retrosynthesis (⇒)' },
  { id: 'dipole', label: 'Dipole (μ)' },
  { id: 'no-go', label: 'No-go (✗→)' },
];

// ── Button ──────────────────────────────────────────────────

function Btn({
  def,
  active,
  disabled,
  badge,
  badgeColor,
  onClick,
  onContextMenu,
}: {
  def: ToolDef;
  active: boolean;
  disabled?: boolean;
  badge?: string | undefined;
  badgeColor?: string | undefined;
  onClick: () => void;
  onContextMenu?: ((el: HTMLButtonElement) => void) | undefined;
}) {
  const [hover, setHover] = useState(false);
  const [tip, setTip] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hover) {
      timer.current = setTimeout(() => setTip(true), 350);
    } else {
      clearTimeout(timer.current);
      setTip(false);
    }
    return () => clearTimeout(timer.current);
  }, [hover]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={ref}
        data-testid={`tool-${def.id}`}
        onClick={onClick}
        onContextMenu={
          onContextMenu
            ? (e) => {
                e.preventDefault();
                const b = ref.current;
                if (b) onContextMenu(b);
              }
            : undefined
        }
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={disabled}
        style={{
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: active
            ? 'var(--kd-color-accent-muted)'
            : hover
              ? 'rgba(255,255,255,0.05)'
              : 'transparent',
          color: active
            ? 'var(--kd-color-accent)'
            : disabled
              ? 'var(--kd-color-text-muted)'
              : 'var(--kd-color-text-primary)',
          border: 'none',
          borderLeft: active ? '2px solid var(--kd-color-accent)' : '2px solid transparent',
          borderRadius: 6,
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 120ms ease',
          opacity: disabled ? 0.35 : 1,
          transform: hover && !disabled ? 'scale(1.04)' : 'none',
        }}
      >
        {def.icon}
        {/* Sub-menu triangle indicator (like Photoshop) */}
        {def.hasSubmenu && (
          <span
            style={{
              position: 'absolute',
              right: 2,
              bottom: 2,
              fontSize: 6,
              opacity: 0.4,
              lineHeight: 1,
            }}
          >
            ▸
          </span>
        )}
        {/* Element badge */}
        {badge && (
          <span
            style={{
              position: 'absolute',
              bottom: 1,
              right: 3,
              fontSize: 7,
              fontWeight: 700,
              color: badgeColor ?? '#888',
              lineHeight: 1,
            }}
          >
            {badge}
          </span>
        )}
      </button>

      {/* Tooltip (Photoshop-style) */}
      {tip && (
        <div style={TIP}>
          <div style={{ fontWeight: 600, fontSize: 11 }}>
            {def.label} <kbd style={KBD}>{def.shortcut}</kbd>
          </div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{def.description}</div>
        </div>
      )}
    </div>
  );
}

function Sep() {
  return <div style={{ height: 1, margin: '3px 6px', background: 'rgba(255,255,255,0.06)' }} />;
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--kd-color-text-muted)',
          marginBottom: 5,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

const PALETTE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(18, 18, 18, 0.88)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRight: '1px solid rgba(255,255,255,0.07)',
  padding: '6px 4px',
  gap: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  position: 'relative',
  zIndex: 20,
};

const SUBMENU: React.CSSProperties = {
  position: 'fixed',
  left: 64,
  background: 'rgba(22, 22, 22, 0.94)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  padding: '8px 10px',
  zIndex: 50,
  minWidth: 130,
  animation: 'fadeSlide 120ms ease',
};

const TIP: React.CSSProperties = {
  position: 'absolute',
  left: 50,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(8,8,8,0.96)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  padding: '5px 9px',
  whiteSpace: 'nowrap',
  color: 'var(--kd-color-text-primary)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  zIndex: 100,
  pointerEvents: 'none',
};

const KBD: React.CSSProperties = {
  fontSize: 9,
  padding: '1px 4px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 3,
  color: 'var(--kd-color-text-muted)',
  fontFamily: 'var(--kd-font-mono)',
  marginLeft: 4,
};

const GRID: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 3 };

const CHIP: React.CSSProperties = {
  width: 32,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 5,
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  transition: 'background 100ms',
};

const ROW: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '4px 8px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  color: 'var(--kd-color-text-primary)',
  textAlign: 'left',
};
