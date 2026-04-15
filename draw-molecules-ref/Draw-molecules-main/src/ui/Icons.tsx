import type { RingTemplate, ToolId } from '../chem/types';

export function ToolIcon(props: { tool: ToolId; activeElement?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (props.tool) {
    case 'select':
      return (
        <svg {...common}>
          <path d="M4 4l7 16 2.2-6.1L20 11 4 4z" />
        </svg>
      );
    case 'atom':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            fontFamily="IBM Plex Sans, sans-serif"
          >
            {props.activeElement ?? 'C'}
          </text>
        </svg>
      );
    case 'erase':
      return (
        <svg {...common}>
          <path d="M7 16l5-8 7 8" />
          <path d="M4 16h16" />
        </svg>
      );
    case 'bond':
      return (
        <svg {...common}>
          <line x1="5" y1="18" x2="19" y2="6" />
          <circle cx="5" cy="18" r="1.7" fill="currentColor" stroke="none" />
          <circle cx="19" cy="6" r="1.7" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'chain':
      return (
        <svg {...common}>
          <polyline points="3,16 8,8 13,16 18,8 21,12" />
        </svg>
      );
    case 'ring':
      return (
        <svg {...common}>
          <polygon points="12,4 19,8 19,16 12,20 5,16 5,8" />
        </svg>
      );
    case 'text':
      return (
        <svg {...common}>
          <path d="M5 6h14" />
          <path d="M12 6v12" />
          <path d="M8 18h8" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M4 12h14" />
          <path d="M14 8l4 4-4 4" />
        </svg>
      );
    case 'pan':
      return (
        <svg {...common}>
          <path d="M8 10V6a2 2 0 1 1 4 0v4" />
          <path d="M12 10V5a2 2 0 1 1 4 0v9" />
          <path d="M8 10l-1-1a2 2 0 1 0-3 3l4 5h6a4 4 0 0 0 4-4v-3" />
        </svg>
      );
    default:
      return null;
  }
}

export function RingPreview(props: { template: RingTemplate }) {
  const pointsByTemplate: Record<RingTemplate, string> = {
    cyclopropane: '24,40 40,14 56,40',
    cyclobutane: '22,18 54,18 54,50 22,50',
    cyclopentane: '40,12 58,28 51,52 29,52 22,28',
    cyclohexane: '24,20 40,10 56,20 56,42 40,52 24,42',
    benzene: '24,20 40,10 56,20 56,42 40,52 24,42',
  };

  return (
    <svg viewBox="0 0 80 64" className="ring-preview-svg">
      <polygon
        points={pointsByTemplate[props.template]}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {props.template === 'benzene' ? (
        <circle cx="40" cy="31" r="13" fill="none" stroke="currentColor" strokeWidth="2.2" />
      ) : null}
    </svg>
  );
}

export function BondPreview(props: { kind: string }) {
  if (props.kind === 'double') {
    return (
      <svg viewBox="0 0 48 24" className="bond-preview-svg">
        <line x1="6" y1="9" x2="42" y2="9" />
        <line x1="6" y1="15" x2="42" y2="15" />
      </svg>
    );
  }
  if (props.kind === 'triple') {
    return (
      <svg viewBox="0 0 48 24" className="bond-preview-svg">
        <line x1="6" y1="6" x2="42" y2="6" />
        <line x1="6" y1="12" x2="42" y2="12" />
        <line x1="6" y1="18" x2="42" y2="18" />
      </svg>
    );
  }
  if (props.kind === 'wedge') {
    return (
      <svg viewBox="0 0 48 24" className="bond-preview-svg" fill="currentColor">
        <polygon points="8,12 36,4 36,20" />
      </svg>
    );
  }
  if (props.kind === 'dash') {
    return (
      <svg viewBox="0 0 48 24" className="bond-preview-svg">
        <line x1="10" y1="12" x2="14" y2="10" />
        <line x1="16" y1="12" x2="21" y2="9" />
        <line x1="23" y1="12" x2="29" y2="8" />
        <line x1="31" y1="12" x2="38" y2="7" />
      </svg>
    );
  }
  if (props.kind === 'aromatic') {
    return (
      <svg viewBox="0 0 48 24" className="bond-preview-svg">
        <line x1="6" y1="8" x2="42" y2="8" />
        <line x1="6" y1="16" x2="42" y2="16" strokeDasharray="5 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 24" className="bond-preview-svg">
      <line x1="6" y1="12" x2="42" y2="12" />
    </svg>
  );
}
