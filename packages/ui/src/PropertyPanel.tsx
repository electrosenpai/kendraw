import { useMemo } from 'react';
import type { Document } from '@kendraw/scene';
import { computeProperties } from '@kendraw/chem';

interface PropertyPanelProps {
  doc: Document;
  visible: boolean;
}

export function PropertyPanel({ doc, visible }: PropertyPanelProps) {
  const properties = useMemo(() => {
    const page = doc.pages[doc.activePageIndex];
    if (!page) return null;
    return computeProperties(page);
  }, [doc]);

  if (!visible || !properties) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: 8,
        top: 8,
        width: 'var(--kd-panel-width)',
        background: 'var(--kd-glass-bg)',
        backdropFilter: 'var(--kd-glass-blur)',
        border: '1px solid var(--kd-glass-border)',
        borderRadius: 'var(--kd-radius-lg)',
        boxShadow: 'var(--kd-shadow-md)',
        padding: 'var(--kd-space-lg)',
        zIndex: 20,
        fontSize: 'var(--kd-font-size-sm)',
      }}
    >
      <h3
        style={{
          fontSize: 'var(--kd-font-size-sm)',
          color: 'var(--kd-color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 'var(--kd-space-md)',
        }}
      >
        Properties
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--kd-space-sm)' }}>
        <PropertyRow label="Formula" value={properties.formula || '—'} />
        <PropertyRow
          label="MW"
          value={
            properties.molecularWeight > 0 ? `${properties.molecularWeight.toFixed(3)} g/mol` : '—'
          }
        />
        <PropertyRow label="Atoms" value={String(properties.atomCount)} />
        <PropertyRow label="Bonds" value={String(properties.bondCount)} />
      </div>
    </div>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--kd-color-text-secondary)' }}>{label}</span>
      <span
        style={{
          color: 'var(--kd-color-text-primary)',
          fontFamily: 'var(--kd-font-mono)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
