import { useRef, useCallback, useState } from 'react';
import { parseCdxml, parseMolV2000, parseSmiles } from '@kendraw/io';
import type { SceneStore } from '@kendraw/scene';

interface ImportDialogProps {
  store: SceneStore;
  onClose: () => void;
}

export function ImportDialog({ store, onClose }: ImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');

  const importContent = useCallback(
    (content: string, filename: string) => {
      const ext = filename.toLowerCase().split('.').pop() ?? '';
      let atoms = 0;
      let bonds = 0;

      try {
        if (ext === 'cdxml' || content.includes('<CDXML') || content.includes('<cdxml')) {
          const result = parseCdxml(content);
          for (const a of result.atoms) store.dispatch({ type: 'add-atom', atom: a });
          for (const b of result.bonds) store.dispatch({ type: 'add-bond', bond: b });
          for (const ar of result.arrows) store.dispatch({ type: 'add-arrow', arrow: ar });
          for (const an of result.annotations)
            store.dispatch({ type: 'add-annotation', annotation: an });
          atoms = result.atoms.length;
          bonds = result.bonds.length;
        } else if (ext === 'mol' || ext === 'sdf' || content.includes('V2000')) {
          // SDF can have multiple molecules separated by $$$$
          const blocks = content.split('$$$$').filter((b) => b.trim());
          for (const block of blocks) {
            const result = parseMolV2000(block);
            for (const a of result.atoms) store.dispatch({ type: 'add-atom', atom: a });
            for (const b of result.bonds) store.dispatch({ type: 'add-bond', bond: b });
            atoms += result.atoms.length;
            bonds += result.bonds.length;
          }
        } else if (ext === 'smi' || ext === 'smiles') {
          // One SMILES per line
          const lines = content
            .split('\n')
            .map((l) => l.trim().split(/\s/)[0])
            .filter((l): l is string => !!l && l.length > 0);
          for (const smi of lines) {
            const result = parseSmiles(smi);
            for (const a of result.atoms) store.dispatch({ type: 'add-atom', atom: a });
            for (const b of result.bonds) store.dispatch({ type: 'add-bond', bond: b });
            atoms += result.atoms.length;
            bonds += result.bonds.length;
          }
        } else {
          // Try SMILES as fallback
          const result = parseSmiles(content.trim());
          if (result.atoms.length > 0) {
            for (const a of result.atoms) store.dispatch({ type: 'add-atom', atom: a });
            for (const b of result.bonds) store.dispatch({ type: 'add-bond', bond: b });
            atoms = result.atoms.length;
            bonds = result.bonds.length;
          } else {
            setStatus('Could not parse file. Supported: CDXML, MOL, SDF, SMILES');
            return;
          }
        }

        setStatus(`Imported ${atoms} atoms, ${bonds} bonds`);
        setTimeout(onClose, 800);
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [store, onClose],
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          importContent(reader.result, file.name);
        }
      };
      reader.readAsText(file);
    },
    [importContent],
  );

  const handlePaste = useCallback(() => {
    if (text.trim()) {
      importContent(text.trim(), 'paste.txt');
    }
  }, [text, importContent]);

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={panelStyle}>
        <h3 style={titleStyle}>Import File</h3>

        {/* File picker */}
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => fileRef.current?.click()} style={btnStyle}>
            Choose File...
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".cdxml,.mol,.sdf,.smi,.smiles,.txt"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <span style={{ fontSize: 10, color: 'var(--kd-color-text-muted)', marginLeft: 8 }}>
            CDXML, MOL, SDF, SMILES
          </span>
        </div>

        {/* Or paste content */}
        <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--kd-color-text-muted)' }}>
          Or paste CDXML / MOL / SMILES content:
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste file content or SMILES here..."
          style={textareaStyle}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 11,
              color: status.startsWith('Error')
                ? 'var(--kd-color-danger)'
                : 'var(--kd-color-success)',
            }}
          >
            {status}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onClose}
              style={{ ...btnStyle, background: 'var(--kd-color-surface)' }}
            >
              Cancel
            </button>
            <button onClick={handlePaste} disabled={!text.trim()} style={btnStyle}>
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: 80,
  zIndex: 100,
};

const panelStyle: React.CSSProperties = {
  width: 440,
  background: 'rgba(20,20,20,0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 12,
  color: 'var(--kd-color-text-primary)',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 11,
  fontWeight: 600,
  background: 'var(--kd-color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: 120,
  padding: 8,
  fontSize: 11,
  fontFamily: 'var(--kd-font-mono)',
  background: 'var(--kd-color-surface)',
  color: 'var(--kd-color-text-primary)',
  border: '1px solid var(--kd-color-border)',
  borderRadius: 6,
  resize: 'vertical',
  marginBottom: 10,
  outline: 'none',
};
