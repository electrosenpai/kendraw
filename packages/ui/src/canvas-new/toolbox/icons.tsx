// Wave-6 new toolbox — icon set.
//
// Custom SVGs drawn from scratch referencing IUPAC/ACS conventions.
// No Ketcher assets copied. Visual language: 18px viewBox 20, stroke 1.5,
// square caps, rounded joins. Matches Lucide React's default stroke.

import type { ReactElement } from 'react';

type IconProps = { size?: number };

const common = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function svg(size: number, children: ReactElement | ReactElement[]): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...common}>
      {children}
    </svg>
  );
}

export function IconSelect({ size = 18 }: IconProps): ReactElement {
  return svg(size, <path d="M4 2l10 7-4.5 1.2L12 16l-2.5-1-2 5L4 2z" />);
}

export function IconLasso({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <ellipse key="e" cx="10" cy="7" rx="6" ry="4" />,
    <path key="p" d="M6 10 L5 17 L9 15" />,
  ]);
}

export function IconBondSingle({ size = 18 }: IconProps): ReactElement {
  return svg(size, <line x1="4" y1="16" x2="16" y2="4" />);
}

export function IconBondDouble({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <line key="1" x1="3" y1="15" x2="15" y2="3" />,
    <line key="2" x1="6" y1="18" x2="18" y2="6" />,
  ]);
}

export function IconBondTriple({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <line key="1" x1="2" y1="14" x2="14" y2="2" />,
    <line key="2" x1="4" y1="16" x2="16" y2="4" />,
    <line key="3" x1="6" y1="18" x2="18" y2="6" />,
  ]);
}

export function IconBondWedge({ size = 18 }: IconProps): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeLinejoin="round">
      <polygon points="4,16 16,4 14,2 2,14" />
    </svg>
  );
}

export function IconBondDash({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <line key="1" x1="4" y1="16" x2="5.5" y2="14.5" />,
    <line key="2" x1="7" y1="13" x2="8.5" y2="11.5" />,
    <line key="3" x1="10" y1="10" x2="11.5" y2="8.5" />,
    <line key="4" x1="13" y1="7" x2="14.5" y2="5.5" />,
  ]);
}

export function IconBondAromatic({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <line key="1" x1="4" y1="16" x2="16" y2="4" />,
    <path key="2" d="M6 14 Q10 10 14 6" strokeDasharray="1.5 2" />,
  ]);
}

export function IconAtomLabel(letter: string) {
  return function Icon({ size = 18 }: IconProps): ReactElement {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" {...common}>
        <circle cx="10" cy="10" r="7" />
        <text
          x="10"
          y="13.5"
          textAnchor="middle"
          fontFamily="var(--kd-font-family), sans-serif"
          fontSize="9"
          fontWeight="600"
          fill="currentColor"
          stroke="none"
        >
          {letter}
        </text>
      </svg>
    );
  };
}

export function IconPeriodicTable({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <rect key="r" x="2.5" y="3.5" width="15" height="13" />,
    <line key="h" x1="2.5" y1="8" x2="17.5" y2="8" />,
    <line key="v1" x1="7.5" y1="3.5" x2="7.5" y2="16.5" />,
    <line key="v2" x1="12.5" y1="8" x2="12.5" y2="16.5" />,
  ]);
}

export function IconBenzene({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <polygon key="hex" points="10,2 17,6 17,14 10,18 3,14 3,6" />,
    <circle key="ring" cx="10" cy="10" r="4" />,
  ]);
}

export function IconCyclohexane({ size = 18 }: IconProps): ReactElement {
  return svg(size, <polygon points="10,2 17,6 17,14 10,18 3,14 3,6" />);
}

export function IconText({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <line key="1" x1="5" y1="4" x2="15" y2="4" />,
    <line key="2" x1="10" y1="4" x2="10" y2="16" />,
  ]);
}

export function IconArrow({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <line key="shaft" x1="3" y1="10" x2="15" y2="10" />,
    <path key="head" d="M12 6 L16 10 L12 14" />,
  ]);
}

export function IconCurlyArrow({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <path key="curve" d="M3 14 Q6 4 15 8" />,
    <path key="head" d="M12 5 L15 8 L12 11" />,
  ]);
}

export function IconErase({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <path key="rect" d="M3 13 L8 18 L17 9 L12 4 Z" />,
    <line key="corner" x1="8" y1="18" x2="14" y2="18" />,
  ]);
}

export function IconUndo({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <path key="arc" d="M4 9 Q4 3 10 3 T16 9" />,
    <path key="head" d="M4 6 L4 9 L7 9" />,
  ]);
}

export function IconRedo({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <path key="arc" d="M16 9 Q16 3 10 3 T4 9" />,
    <path key="head" d="M16 6 L16 9 L13 9" />,
  ]);
}

export function IconNmr({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <line key="base" x1="2" y1="16" x2="18" y2="16" />,
    <path key="peak1" d="M5 16 L5 9 L6 16" />,
    <path key="peak2" d="M9 16 L9 4 L10 16" />,
    <path key="peak3" d="M13 16 L13 11 L14 16" />,
  ]);
}

export function IconPropertyPanel({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <rect key="rect" x="3" y="3" width="14" height="14" />,
    <line key="1" x1="7" y1="7" x2="14" y2="7" />,
    <line key="2" x1="7" y1="10" x2="14" y2="10" />,
    <line key="3" x1="7" y1="13" x2="14" y2="13" />,
  ]);
}

export function IconPasteSmiles({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <rect key="r" x="4" y="4" width="12" height="14" rx="1" />,
    <path key="clip" d="M7 4 L7 2 L13 2 L13 4" />,
    <text
      key="t"
      x="10"
      y="14"
      textAnchor="middle"
      fontFamily="var(--kd-font-family), sans-serif"
      fontSize="6"
      fontWeight="600"
      fill="currentColor"
      stroke="none"
    >
      SMI
    </text>,
  ]);
}

export function IconSearch({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <circle key="c" cx="8.5" cy="8.5" r="5" />,
    <line key="h" x1="12" y1="12" x2="16" y2="16" />,
  ]);
}

export function IconFitToView({ size = 18 }: IconProps): ReactElement {
  return svg(size, [
    <path key="tl" d="M3 7 L3 3 L7 3" />,
    <path key="tr" d="M13 3 L17 3 L17 7" />,
    <path key="br" d="M17 13 L17 17 L13 17" />,
    <path key="bl" d="M7 17 L3 17 L3 13" />,
    <rect key="c" x="7" y="7" width="6" height="6" />,
  ]);
}

const ICONS: Record<string, (p: IconProps) => ReactElement> = {
  'select': IconSelect,
  'bond-single': IconBondSingle,
  'bond-double': IconBondDouble,
  'bond-triple': IconBondTriple,
  'atom-c': IconAtomLabel('C'),
  'atom-h': IconAtomLabel('H'),
  'atom-n': IconAtomLabel('N'),
  'atom-o': IconAtomLabel('O'),
  'atom-s': IconAtomLabel('S'),
  'ring-benzene': IconBenzene,
  'ring-cyclohexane': IconCyclohexane,
  'text': IconText,
  'arrow': IconArrow,
  'erase': IconErase,
  'undo': IconUndo,
  'redo': IconRedo,
  'nmr-toggle': IconNmr,
  'property-toggle': IconPropertyPanel,
  'paste-smiles': IconPasteSmiles,
  'search-molecule': IconSearch,
  'fit-to-view': IconFitToView,
};

export function getIcon(iconId: string): (p: IconProps) => ReactElement {
  return ICONS[iconId] ?? IconSelect;
}
