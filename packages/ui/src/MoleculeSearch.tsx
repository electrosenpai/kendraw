import { useState, useCallback, useRef, useEffect } from 'react';
import {
  searchTemplates,
  TEMPLATE_CATEGORIES,
  autocomplete,
  searchByName,
  getSDF,
  parseSmiles,
  parseMolV2000,
  type MoleculeTemplate,
  type PubChemCompound,
} from '@kendraw/io';
import type { SceneStore } from '@kendraw/scene';

interface MoleculeSearchProps {
  store: SceneStore;
  onClose: () => void;
}

type SearchMode = 'templates' | 'pubchem';

export function MoleculeSearch({ store, onClose }: MoleculeSearchProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('templates');
  const [localResults, setLocalResults] = useState<MoleculeTemplate[]>([]);
  const [pubchemResults, setPubchemResults] = useState<PubChemCompound[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setLocalResults([]);
      setPubchemResults([]);
      setSuggestions([]);
      return;
    }

    // Instant local search
    setLocalResults(searchTemplates(q));

    // Debounced PubChem autocomplete
    debounceRef.current = setTimeout(async () => {
      const sugs = await autocomplete(q);
      setSuggestions(sugs.slice(0, 5));
    }, 300);
  }, []);

  const searchPubChem = useCallback(async (name: string) => {
    setMode('pubchem');
    setLoading(true);
    try {
      const result = await searchByName(name);
      setPubchemResults(result.compounds.slice(0, 10));
    } catch {
      setPubchemResults([]);
    }
    setLoading(false);
  }, []);

  const insertFromSmiles = useCallback(
    (smiles: string) => {
      const parsed = parseSmiles(smiles);
      if (parsed.atoms.length === 0) return;

      // Find offset to avoid overlap with existing atoms
      const page = store.getState().pages[store.getState().activePageIndex];
      let offsetX = 0;
      const offsetY = 0;
      if (page) {
        const existing = Object.values(page.atoms);
        if (existing.length > 0) {
          let maxX = -Infinity;
          for (const a of existing) {
            if (a.x > maxX) maxX = a.x;
          }
          // Place new molecule to the right of existing content
          let minParsedX = Infinity;
          for (const a of parsed.atoms) {
            if (a.x < minParsedX) minParsedX = a.x;
          }
          offsetX = maxX + 80 - minParsedX;
        }
      }

      for (const a of parsed.atoms) {
        store.dispatch({
          type: 'add-atom',
          atom: { ...a, x: a.x + offsetX, y: a.y + offsetY },
        });
      }
      for (const b of parsed.bonds) store.dispatch({ type: 'add-bond', bond: b });

      onClose();
    },
    [store, onClose],
  );

  const insertFromPubChem = useCallback(
    async (compound: PubChemCompound) => {
      setLoading(true);
      try {
        const sdf = await getSDF(compound.cid);
        // SDF contains one or more MOL blocks separated by $$$$
        const molBlock = sdf.split('$$$$')[0] ?? '';
        const parsed = parseMolV2000(molBlock);

        // Center the molecule on the canvas
        let cx = 0;
        let cy = 0;
        for (const a of parsed.atoms) {
          cx += a.x;
          cy += a.y;
        }
        if (parsed.atoms.length > 0) {
          cx /= parsed.atoms.length;
          cy /= parsed.atoms.length;
        }
        // Find free space to the right of existing atoms
        const page = store.getState().pages[store.getState().activePageIndex];
        let baseX = 400;
        if (page) {
          const existing = Object.values(page.atoms);
          if (existing.length > 0) {
            let maxX = -Infinity;
            for (const ea of existing) {
              if (ea.x > maxX) maxX = ea.x;
            }
            baseX = maxX + 80;
          }
        }
        const offsetX = baseX - cx;
        const offsetY = 300 - cy;

        for (const a of parsed.atoms) {
          store.dispatch({
            type: 'add-atom',
            atom: { ...a, x: a.x + offsetX, y: a.y + offsetY },
          });
        }
        for (const b of parsed.bonds) {
          store.dispatch({ type: 'add-bond', bond: b });
        }
        onClose();
      } catch {
        // Silently fail — user can try another compound
      }
      setLoading(false);
    },
    [store, onClose],
  );

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={panelStyle}>
        {/* Search bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.length >= 2) {
                void searchPubChem(query);
              }
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search molecule name, SMILES, formula..."
            style={inputStyle}
          />
          <button
            onClick={() => void searchPubChem(query)}
            disabled={query.length < 2 || loading}
            style={searchBtnStyle}
          >
            {loading ? '...' : 'PubChem'}
          </button>
        </div>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && mode === 'templates' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  handleSearch(s);
                  void searchPubChem(s);
                }}
                style={chipStyle}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <button
            onClick={() => setMode('templates')}
            style={{
              ...tabStyle,
              background: mode === 'templates' ? 'var(--kd-color-accent-muted)' : 'transparent',
            }}
          >
            Local ({localResults.length})
          </button>
          <button
            onClick={() => setMode('pubchem')}
            style={{
              ...tabStyle,
              background: mode === 'pubchem' ? 'var(--kd-color-accent-muted)' : 'transparent',
            }}
          >
            PubChem ({pubchemResults.length})
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {mode === 'templates' && query.length < 2 && (
            <div>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 4 }}>
                  <button
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    style={categoryBtnStyle}
                  >
                    {activeCategory === cat.id ? '▾' : '▸'} {cat.label} ({cat.templates.length})
                  </button>
                  {activeCategory === cat.id && (
                    <div style={{ paddingLeft: 8 }}>
                      {cat.templates.map((t) => (
                        <TemplateRow
                          key={t.name}
                          name={t.name}
                          extra={t.abbr3}
                          onClick={() => insertFromSmiles(t.smiles)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {mode === 'templates' && query.length >= 2 && (
            <div>
              {localResults.length === 0 && (
                <div style={emptyStyle}>No local match. Try PubChem (Enter).</div>
              )}
              {localResults.map((t) => (
                <TemplateRow
                  key={t.name}
                  name={t.name}
                  extra={t.category}
                  onClick={() => insertFromSmiles(t.smiles)}
                />
              ))}
            </div>
          )}

          {mode === 'pubchem' && (
            <div>
              {loading && <div style={emptyStyle}>Searching PubChem...</div>}
              {!loading && pubchemResults.length === 0 && (
                <div style={emptyStyle}>No PubChem results.</div>
              )}
              {pubchemResults.map((c) => (
                <TemplateRow
                  key={c.cid}
                  name={c.name || `CID ${c.cid}`}
                  extra={c.formula ? `${c.formula} • MW ${c.mw.toFixed(1)}` : undefined}
                  onClick={() => void insertFromPubChem(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateRow({
  name,
  extra,
  onClick,
}: {
  name: string;
  extra?: string | undefined;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={rowStyle}>
      <span style={{ fontSize: 12 }}>{name}</span>
      {extra && <span style={{ fontSize: 10, color: 'var(--kd-color-text-muted)' }}>{extra}</span>}
    </button>
  );
}

// ── Styles ──

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
  maxHeight: '70vh',
  background: 'rgba(20,20,20,0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  fontSize: 13,
  background: 'var(--kd-color-surface)',
  color: 'var(--kd-color-text-primary)',
  border: '1px solid var(--kd-color-border)',
  borderRadius: 6,
  outline: 'none',
  fontFamily: 'inherit',
};

const searchBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  background: 'var(--kd-color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const chipStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 10,
  background: 'var(--kd-color-surface)',
  color: 'var(--kd-color-text-secondary)',
  border: '1px solid var(--kd-color-border-subtle)',
  borderRadius: 12,
  cursor: 'pointer',
};

const tabStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  color: 'var(--kd-color-text-primary)',
  border: '1px solid var(--kd-color-border-subtle)',
  borderRadius: 6,
  cursor: 'pointer',
};

const categoryBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 4px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--kd-color-text-secondary)',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: '6px 8px',
  background: 'transparent',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  color: 'var(--kd-color-text-primary)',
  textAlign: 'left',
  transition: 'background 100ms',
};

const emptyStyle: React.CSSProperties = {
  padding: 16,
  textAlign: 'center',
  fontSize: 12,
  color: 'var(--kd-color-text-muted)',
};
