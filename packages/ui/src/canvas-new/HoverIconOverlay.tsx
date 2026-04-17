// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.
//
// Wave-5 W4-R-04 — Glasswerk-style SVG overlay that draws the bond hover icon
// on top of the canvas. Pointer-events:none so clicks fall through to the
// canvas dispatcher (the bondTool decides what a click means).

import type { HoverPreview } from './bondPreview';
import { HOVER_ICON_RADIUS_PX } from './bondPreview';

export interface HoverIconOverlayProps {
  readonly preview: HoverPreview | null;
  readonly width: number;
  readonly height: number;
  readonly theme: 'dark' | 'light';
}

export function HoverIconOverlay({
  preview,
  width,
  height,
  theme,
}: HoverIconOverlayProps): JSX.Element | null {
  if (!preview) return null;
  const accent = theme === 'dark' ? '#7cd1ff' : '#1f7ad1';
  const ghost = theme === 'dark' ? 'rgba(124, 209, 255, 0.32)' : 'rgba(31, 122, 209, 0.28)';
  const stroke = theme === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(31, 41, 55, 0.85)';
  return (
    <svg
      data-testid="canvas-new-hover-icon"
      data-hover-kind={preview.kind}
      data-hover-source={String(preview.sourceId)}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <line
        x1={preview.anchor.x}
        y1={preview.anchor.y}
        x2={preview.endpoint.x}
        y2={preview.endpoint.y}
        stroke={ghost}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <circle
        cx={preview.iconAt.x}
        cy={preview.iconAt.y}
        r={HOVER_ICON_RADIUS_PX}
        fill={ghost}
        stroke={accent}
        strokeWidth={1.4}
      />
      <line
        x1={preview.iconAt.x - 4}
        y1={preview.iconAt.y}
        x2={preview.iconAt.x + 4}
        y2={preview.iconAt.y}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <line
        x1={preview.iconAt.x}
        y1={preview.iconAt.y - 4}
        x2={preview.iconAt.x}
        y2={preview.iconAt.y + 4}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  );
}
