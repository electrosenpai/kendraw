interface ShortcutCheatsheetProps {
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: 'Tools',
    items: [
      { key: 'V', desc: 'Select' },
      { key: 'H', desc: 'Pan' },
      { key: 'A', desc: 'Atom' },
      { key: 'E', desc: 'Eraser' },
      { key: 'R', desc: 'Ring' },
      { key: 'W', desc: 'Arrow' },
      { key: 'U', desc: 'Curly arrow' },
    ],
  },
  {
    category: 'Bonds (with selection)',
    items: [
      { key: '1', desc: 'Single bond' },
      { key: '2', desc: 'Double bond' },
      { key: '3', desc: 'Triple bond' },
      { key: 'W', desc: 'Wedge' },
      { key: 'D', desc: 'Dashed' },
      { key: 'B', desc: 'Bold' },
      { key: 'Y', desc: 'Wavy' },
    ],
  },
  {
    category: 'Atoms (with selection)',
    items: [
      { key: 'C', desc: 'Carbon' },
      { key: 'N', desc: 'Nitrogen' },
      { key: 'O', desc: 'Oxygen' },
      { key: 'S', desc: 'Sulfur' },
      { key: 'F', desc: 'Fluorine' },
      { key: 'L', desc: 'Chlorine' },
      { key: 'I', desc: 'Iodine' },
      { key: 'P', desc: 'Phosphorus' },
      { key: 'M', desc: 'Methyl (Me)' },
      { key: '+/-', desc: 'Charge' },
    ],
  },
  {
    category: 'Rings (ring tool active)',
    items: [{ key: '3-8', desc: 'Cycle size' }],
  },
  {
    category: 'Edit',
    items: [
      { key: 'Ctrl+Z', desc: 'Undo' },
      { key: 'Ctrl+Y', desc: 'Redo' },
      { key: 'Ctrl+C', desc: 'Copy' },
      { key: 'Ctrl+X', desc: 'Cut' },
      { key: 'Ctrl+V', desc: 'Paste' },
      { key: 'Ctrl+A', desc: 'Select all' },
      { key: 'Ctrl+D', desc: 'Duplicate' },
      { key: 'Ctrl+R', desc: 'Rotate 15\u00b0' },
      { key: 'Delete', desc: 'Delete selected' },
      { key: 'Ctrl+Shift+K', desc: 'Clean up structure' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { key: 'Scroll', desc: 'Zoom' },
      { key: 'Space+Drag', desc: 'Pan' },
      { key: 'Middle drag', desc: 'Pan' },
      { key: 'Ctrl+0', desc: 'Fit to screen' },
    ],
  },
  {
    category: 'Panels',
    items: [
      { key: 'Ctrl+M', desc: 'Toggle NMR panel' },
      { key: 'Ctrl+L', desc: 'Molecule search' },
      { key: 'Ctrl+I', desc: 'Import file' },
      { key: 'Ctrl+N', desc: 'New tab' },
      { key: '?', desc: 'This cheatsheet' },
    ],
  },
];

export function ShortcutCheatsheet({ onClose }: ShortcutCheatsheetProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--kd-color-bg-elevated)',
          border: '1px solid var(--kd-color-border)',
          borderRadius: 'var(--kd-radius-xl)',
          padding: 'var(--kd-space-2xl)',
          maxWidth: 480,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: 'var(--kd-shadow-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 'var(--kd-font-size-lg)', fontWeight: 600, margin: 0 }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--kd-color-text-muted)',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            x
          </button>
        </div>
        {SHORTCUTS.map((section) => (
          <div key={section.category} style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: 'var(--kd-font-size-sm)',
                color: 'var(--kd-color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              {section.category}
            </h3>
            {section.items.map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  fontSize: 'var(--kd-font-size-sm)',
                }}
              >
                <span style={{ color: 'var(--kd-color-text-secondary)' }}>{item.desc}</span>
                <kbd
                  style={{
                    padding: '2px 6px',
                    background: 'var(--kd-color-surface)',
                    border: '1px solid var(--kd-color-border)',
                    borderRadius: 'var(--kd-radius-sm)',
                    fontSize: 'var(--kd-font-size-xs)',
                    fontFamily: 'var(--kd-font-mono)',
                    color: 'var(--kd-color-text-primary)',
                  }}
                >
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
