/**
 * ChemDraw-style group-label hotkeys (Shift+key).
 *
 * Each entry replaces the selected atom with a single-atom label stub:
 * the atom's element is set to the listed Z (so valence checks remain
 * sensible) and the label text is displayed verbatim. This matches how
 * ChemDraw represents common fragments without expanding the graph.
 */
export const GROUP_LABEL_HOTKEYS: Record<string, { element: number; label: string }> = {
  O: { element: 8, label: 'OMe' },
  F: { element: 6, label: 'CF3' },
  N: { element: 7, label: 'NO2' },
  Y: { element: 8, label: 'OAc' },
};
