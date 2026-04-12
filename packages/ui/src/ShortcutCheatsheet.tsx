interface ShortcutCheatsheetProps {
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: 'Tools',
    items: [
      { key: 'V', desc: 'Select tool' },
      { key: 'A', desc: 'Atom tool (Carbon)' },
      { key: 'E', desc: 'Eraser tool' },
      { key: 'H', desc: 'Pan tool' },
    ],
  },
  {
    category: 'Edit',
    items: [
      { key: 'Ctrl+Z', desc: 'Undo' },
      { key: 'Ctrl+Y', desc: 'Redo' },
      { key: 'Ctrl+Shift+Z', desc: 'Redo (alt)' },
      { key: 'Delete', desc: 'Delete selected' },
      { key: 'Backspace', desc: 'Delete selected' },
    ],
  },
  {
    category: 'Selection',
    items: [
      { key: 'Click', desc: 'Select atom' },
      { key: 'Shift+Click', desc: 'Toggle atom in selection' },
      { key: 'Drag', desc: 'Rectangle select' },
      { key: 'Escape', desc: 'Clear selection' },
    ],
  },
  {
    category: 'View',
    items: [
      { key: '?', desc: 'Toggle shortcuts' },
      { key: 'Ctrl+N', desc: 'New tab' },
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
