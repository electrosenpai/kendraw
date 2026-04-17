interface RecoveryBannerProps {
  count: number;
  onKeep: () => void;
  onDiscard: () => void;
}

export function RecoveryBanner({ count, onKeep, onDiscard }: RecoveryBannerProps) {
  const label =
    count === 1
      ? 'Recovered 1 previous session from local storage.'
      : `Recovered ${count} previous sessions from local storage.`;
  return (
    <div data-testid="recovery-banner" role="status" style={bannerStyle}>
      <span style={{ flex: 1 }}>{label}</span>
      <button onClick={onKeep} style={primaryBtnStyle} data-testid="recovery-keep">
        Keep
      </button>
      <button onClick={onDiscard} style={secondaryBtnStyle} data-testid="recovery-discard">
        Discard all
      </button>
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 'var(--kd-space-lg, 12px)',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--kd-space-md, 8px)',
  padding: '8px 12px',
  background: 'var(--kd-color-bg-tertiary)',
  border: '1px solid var(--kd-color-border)',
  borderRadius: 'var(--kd-radius-md, 6px)',
  color: 'var(--kd-color-text-primary)',
  fontSize: 'var(--kd-font-size-sm)',
  zIndex: 1000,
  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
  minWidth: 360,
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--kd-color-accent)',
  color: 'white',
  border: 'none',
  padding: '4px 10px',
  borderRadius: 'var(--kd-radius-sm, 4px)',
  cursor: 'pointer',
  fontSize: 'var(--kd-font-size-sm)',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--kd-color-text-muted)',
  border: '1px solid var(--kd-color-border)',
  padding: '4px 10px',
  borderRadius: 'var(--kd-radius-sm, 4px)',
  cursor: 'pointer',
  fontSize: 'var(--kd-font-size-sm)',
};
