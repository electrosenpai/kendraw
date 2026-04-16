# NMR Multiplicity Engine

_Last updated: 2026-04-16 — shipped with commits 72b9bf0, 356e606, ae4a35a._

The NMR spectrum now renders **real J-coupled patterns** (triplets, quartets,
doublets-of-doublets, etc.) instead of a single Lorentzian per peak. This doc
explains the architecture, the math, and the extension points.

## Pipeline overview

```
backend → NmrPrediction (peaks with multiplicity + coupling_hz)
              │
              ▼
   @kendraw/nmr/multiplet.expandMultiplet(peak, ν₀)
              │
              ▼
   SubLine[]  (Pascal-weighted, J-spaced lines at the same centroid)
              │
              ▼
   SpectrumRenderer  →  canvas 2D
```

The engine lives in [`packages/nmr/src/multiplet.ts`](../packages/nmr/src/multiplet.ts).
It is a pure function module — no React, no DOM, no timers. Tests sit next to
it in [`packages/nmr/src/__tests__/multiplet.test.ts`](../packages/nmr/src/__tests__/multiplet.test.ts).

## Math

### Line spacing

For a multiplet with coupling constant `J` (in Hz) observed on a spectrometer
operating at frequency `ν₀` (in MHz), adjacent sub-lines are separated by

```
Δppm = J [Hz] / ν₀ [MHz]
```

Chemical shifts (`shift_ppm`) are **invariant** under frequency changes. Only
the *visual spacing between sub-lines* scales with 1 / ν₀. A triplet that
looks wide at 300 MHz tightens to half its spacing at 600 MHz — the classic
reason labs prefer higher-field instruments.

### Intensities

Equivalent coupling to `n` protons produces `n + 1` lines with intensities
given by row `n` of Pascal's triangle, normalised so the sum of sub-line
intensities equals the parent peak's integral (number of equivalent protons
contributing to the signal).

| Multiplicity | n | Lines | Pascal row |
| ------------ | - | ----- | ---------- |
| s            | — | 1     | [1]        |
| d            | 1 | 2     | [1, 1]     |
| t            | 2 | 3     | [1, 2, 1]  |
| q            | 3 | 4     | [1, 3, 3, 1] |
| p / quint    | 4 | 5     | [1, 4, 6, 4, 1] |
| sext         | 5 | 6     | [1, 5, 10, 10, 5, 1] |
| sept         | 6 | 7     | [1, 6, 15, 20, 15, 6, 1] |

### Compound multiplicities (dd, dt, ddd, …)

Compound patterns are computed by **successive convolution**: apply each J
one after another. For a dd with J₁ and J₂:

```
start:  [•]                                      ← parent centroid
split1: [• • ]   at ±J₁/(2·ν₀), intensities 1:1  ← first coupling
split2: [•• ••] at ±J₂/(2·ν₀) from each, 1:1:1:1 ← second coupling
```

4 lines of equal intensity (1:1:1:1). A ddd gives 8 lines; a dt gives 6 lines
(2 outer pairs × triplet). `resolveMultiplicity(mult)` returns the "equivalent
coupling counts" list — for `'dt'` that is `[1, 2]`, consuming two J values
from `coupling_hz` in order.

### Unresolved multiplets (`'m'`, `'br'`, `'brs'`)

These expand to a single line at the parent centroid, but are flagged for the
renderer to widen the Lorentzian half-width by `MULTIPLET_BROADENING_FACTOR`
(currently 3×) — see `isUnresolvedMultiplet(peak)`.

### Intensity conservation (contract tested)

For every peak:

```
sum(subLine.intensity for subLine in expansion) === peak.atom_indices.length
```

This is asserted in `multiplet.test.ts:T1`. It guarantees the integral under
the rendered spectrum matches the proton count regardless of how many
sub-lines the multiplet decomposes into.

## Frequency selector

`NmrPanel` owns a `frequencyMhz` state (300 / 400 / 500 / 600 MHz, default
400) persisted to `localStorage` under `kd-nmr-frequency-mhz`. The value is
threaded to `renderSpectrum({ frequencyMhz })` in the render effect's deps
array, so changing it triggers a re-render with recomputed spacing.

A "400 MHz" badge is drawn at the bottom-left of the canvas so the active
frequency is always visible when the spectrum is exported or screenshotted.

## E2E testing hook

When `renderSpectrum` is called with `exposeDebug: true`, it publishes the
full expansion to `window.__nmrDebugData`:

```ts
interface NmrDebugData {
  frequencyMhz: number;
  peaks: Array<{
    peakIdx: number;
    shiftPpm: number;
    multiplicity: string;
    couplingHz: number[];
    subLines: Array<{ shiftPpm: number; intensity: number }>;
  }>;
  allSubLines: Array<{ peakIdx: number; shiftPpm: number; intensity: number }>;
}
```

Playwright tests use this instead of canvas pixel inspection — see
[`e2e/p1-critical/multiplicity-display.spec.ts`](../e2e/p1-critical/multiplicity-display.spec.ts).

The `NmrPanel.tsx` call site passes `exposeDebug: true` unconditionally: the
data is tiny (≤ a few hundred numbers) and the exposure is transparent.
Call sites that care about bundle size can pass `false` and the renderer
skips the snapshot entirely.

## Files of interest

| File | Purpose |
| ---- | ------- |
| `packages/nmr/src/multiplet.ts` | Pure expansion engine (Pascal + convolution) |
| `packages/nmr/src/__tests__/multiplet.test.ts` | 36 unit tests, Murat's T1–T5 invariants |
| `packages/nmr/src/SpectrumRenderer.ts` | Consumes `expandAllPeaks`, draws sub-line stems |
| `packages/nmr/src/NmrPanel.tsx` | Frequency selector UI + debug data emit |
| `e2e/p1-critical/multiplicity-display.spec.ts` | Regression test at the UI level |

## Non-goals / known limitations

- **Roofing / second-order effects** (AB, ABX, etc.) are NOT modelled. The
  engine assumes first-order patterns. This is acceptable for the ChemDraw
  parity target; a second-order pass would require a full Hamiltonian
  simulation and is tracked separately.
- **Line width dependence on field** is not yet implemented — half-width is
  constant in Hz regardless of `frequencyMhz`. Real spectrometers give
  narrower ppm lines at higher fields but the absolute Hz width is dominated
  by shimming and T₂, not field strength.
- **J-value editing** is not exposed in the UI. Coupling constants come from
  the backend; the user cannot currently override them.
