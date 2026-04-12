interface AboutPageProps {
  onClose: () => void;
}

const BIBTEX = `@software{kendraw,
  author = {Donnette, Jean-Baptiste},
  title = {Kendraw: Open-Source Modern Web Successor to ChemDraw},
  year = {2026},
  url = {https://github.com/electrosenpai/kendraw},
  license = {MIT}
}`;

export function AboutPage({ onClose }: AboutPageProps) {
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
          maxWidth: 500,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: 'var(--kd-shadow-lg)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--kd-font-size-lg)',
            fontWeight: 700,
            marginBottom: 'var(--kd-space-md)',
          }}
        >
          Kendraw v0.1.0
        </h2>
        <p
          style={{
            color: 'var(--kd-color-text-secondary)',
            fontSize: 'var(--kd-font-size-sm)',
            marginBottom: 'var(--kd-space-lg)',
          }}
        >
          Open-source modern web successor to ChemDraw.
          <br />
          MIT License. No telemetry. No tracking.
        </p>

        <h3
          style={{
            fontSize: 'var(--kd-font-size-sm)',
            color: 'var(--kd-color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--kd-space-sm)',
          }}
        >
          Cite this work
        </h3>
        <pre
          style={{
            background: 'var(--kd-color-surface)',
            border: '1px solid var(--kd-color-border)',
            borderRadius: 'var(--kd-radius-sm)',
            padding: 'var(--kd-space-md)',
            fontSize: 'var(--kd-font-size-xs)',
            fontFamily: 'var(--kd-font-mono)',
            overflow: 'auto',
            marginBottom: 'var(--kd-space-lg)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {BIBTEX}
        </pre>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--kd-space-md)' }}>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(BIBTEX);
            }}
            style={{
              padding: 'var(--kd-space-sm) var(--kd-space-lg)',
              background: 'var(--kd-color-surface)',
              color: 'var(--kd-color-text-primary)',
              border: '1px solid var(--kd-color-border)',
              borderRadius: 'var(--kd-radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--kd-font-size-sm)',
            }}
          >
            Copy BibTeX
          </button>
          <button
            onClick={onClose}
            style={{
              padding: 'var(--kd-space-sm) var(--kd-space-lg)',
              background: 'var(--kd-color-accent)',
              color: 'var(--kd-color-text-inverse)',
              border: 'none',
              borderRadius: 'var(--kd-radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--kd-font-size-sm)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
