/** Module-level store for CDXML graphic overlays and document settings. */

import type { CdxmlDocumentSettings } from '@kendraw/io';
import { ptToPx } from '@kendraw/scene';
import type { RenderSettings } from '@kendraw/renderer-canvas';

export interface GraphicOverlay {
  type: 'rectangle' | 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

let overlays: GraphicOverlay[] = [];
let cdxmlSettings: CdxmlDocumentSettings | null = null;
const listeners = new Set<() => void>();

export function setGraphicOverlays(g: GraphicOverlay[]): void {
  overlays = g;
  for (const l of listeners) l();
}

export function getGraphicOverlays(): GraphicOverlay[] {
  return overlays;
}

export function setCdxmlDocumentSettings(settings: CdxmlDocumentSettings | null): void {
  cdxmlSettings = settings;
  for (const l of listeners) l();
}

export function getCdxmlDocumentSettings(): CdxmlDocumentSettings | null {
  return cdxmlSettings;
}

/** Convert CDXML document settings to renderer RenderSettings. */
export function toRenderSettings(settings: CdxmlDocumentSettings): Partial<RenderSettings> {
  return {
    lineWidth: ptToPx(settings.lineWidthPt),
    boldWidth: ptToPx(settings.boldWidthPt),
    marginWidth: ptToPx(settings.marginWidthPt),
    bondSpacingPx: settings.bondSpacing * ptToPx(settings.bondLengthPt),
    hashSpacing: ptToPx(settings.hashSpacingPt),
    wedgeWide: ptToPx(1.5 * settings.boldWidthPt),
    labelSize: ptToPx(settings.labelSizePt),
    labelDisplayOptions: {
      showTerminalCarbonLabels: settings.showTerminalCarbonLabels,
      showNonTerminalCarbonLabels: settings.showNonTerminalCarbonLabels,
    },
  };
}

export function onGraphicOverlaysChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
