import { useMemo, useCallback } from 'react';
import type { Document } from '@kendraw/scene';
import { validateValence } from '@kendraw/scene';
import { computeProperties } from '@kendraw/chem';
import { exportToSVG, injectSvgMetadata } from '@kendraw/renderer-svg';
import { writeMolV2000 } from '@kendraw/io';

interface PropertyPanelProps {
  doc: Document;
  visible: boolean;
}

export function PropertyPanel({ doc, visible }: PropertyPanelProps) {
  const page = doc.pages[doc.activePageIndex];

  const properties = useMemo(() => {
    if (!page) return null;
    return computeProperties(page);
  }, [page]);

  const valenceIssueCount = useMemo(() => {
    if (!page) return 0;
    return validateValence(page).length;
  }, [page]);

  const handleExportSVG = useCallback(() => {
    if (!page) return;
    let svg = exportToSVG(page);
    svg = injectSvgMetadata(svg, {
      title: doc.metadata.title,
      author: doc.metadata.authorHint ?? 'Kendraw User',
    });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, `${doc.metadata.title || 'molecule'}.svg`);
  }, [page, doc.metadata]);

  const handleExportMOL = useCallback(() => {
    if (!page) return;
    const atoms = Object.values(page.atoms);
    const bonds = Object.values(page.bonds);
    const mol = writeMolV2000(atoms, bonds);
    const blob = new Blob([mol], { type: 'chemical/x-mdl-molfile' });
    downloadBlob(blob, `${doc.metadata.title || 'molecule'}.mol`);
  }, [page, doc.metadata]);

  const handleExportPNG = useCallback(() => {
    if (!page) return;
    const svg = exportToSVG(page, { width: 1200, height: 900 });
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1200, 900);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${doc.metadata.title || 'molecule'}.png`);
      }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }, [page, doc.metadata]);

  if (!visible || !properties) return null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--kd-color-bg-secondary)',
        borderLeft: '1px solid var(--kd-color-border)',
        padding: 'var(--kd-space-lg)',
        fontSize: 'var(--kd-font-size-sm)',
        overflowY: 'auto',
      }}
    >
      <SectionTitle>Properties</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--kd-space-xs)' }}>
        <PropertyRow label="Formula" value={properties.formula || '—'} copyable />
        <PropertyRow
          label="MW"
          value={properties.molecularWeight > 0 ? `${properties.molecularWeight.toFixed(3)}` : '—'}
        />
        <PropertyRow label="Atoms" value={String(properties.atomCount)} />
        <PropertyRow label="Bonds" value={String(properties.bondCount)} />
        {valenceIssueCount > 0 && (
          <div style={{ color: 'var(--kd-color-warning)', fontSize: 10, marginTop: 2 }}>
            {valenceIssueCount} valence warning{valenceIssueCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <SectionTitle style={{ marginTop: 12 }}>Export</SectionTitle>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <ExportButton label="SVG" onClick={handleExportSVG} />
        <ExportButton label="MOL" onClick={handleExportMOL} />
        <ExportButton label="PNG" onClick={handleExportPNG} />
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <h3
      style={{
        fontSize: 10,
        color: 'var(--kd-color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 'var(--kd-space-sm)',
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

function PropertyRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        lineHeight: 1.6,
      }}
    >
      <span style={{ color: 'var(--kd-color-text-secondary)', fontSize: 11 }}>{label}</span>
      <span
        style={{
          color: 'var(--kd-color-text-primary)',
          fontFamily: 'var(--kd-font-mono)',
          fontSize: 11,
          cursor: copyable ? 'pointer' : 'default',
        }}
        onClick={copyable ? () => void navigator.clipboard.writeText(value) : undefined}
        title={copyable ? 'Click to copy' : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 8px',
        fontSize: 10,
        background: 'var(--kd-color-surface)',
        color: 'var(--kd-color-text-primary)',
        border: '1px solid var(--kd-color-border)',
        borderRadius: 'var(--kd-radius-sm)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'molecule';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeFilename(filename);
  a.click();
  URL.revokeObjectURL(url);
}
