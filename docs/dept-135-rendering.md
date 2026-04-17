# DEPT rendering in Kendraw

> **Status:** wave-4 P1-01. Available in the ¹³C NMR panel — toggle via the `DEPT` button or press `D` while the panel is focused.

## What DEPT is

DEPT (Distortionless Enhancement by Polarization Transfer) is a family of pulse sequences used to disambiguate carbon multiplicity in ¹³C NMR. Two flavors are universally taught and routinely run:

- **DEPT-135** — CH and CH₃ point up, CH₂ points down (180° out of phase), quaternary C is absent.
- **DEPT-90** — only CH (methine) carbons are visible, everything else is suppressed.

Combined with a regular ¹³C scan, the two DEPT flavors let a chemist read carbon hydricity directly from the spectrum.

## What Kendraw renders

The Kendraw NMR panel ships a 3-state cycle:

| State | Label | Behavior |
| --- | --- | --- |
| `off`     | `DEPT`     | Standard ¹³C — every peak above baseline. |
| `dept-135`| `DEPT-135` | CH/CH₃ above baseline, CH₂ inverted below baseline, quaternary C hidden. |
| `dept-90` | `DEPT-90`  | Only CH peaks rendered, all other carbons hidden. |

The legend in the upper-left of the spectrum tracks the active mode so you always know what you're looking at.

### Phase-sign rule

Internally the renderer asks one question per peak: *what is the phase sign for this carbon class under this mode?* The helper lives at [`packages/nmr/src/SpectrumRenderer.ts`](../packages/nmr/src/SpectrumRenderer.ts) as `peakPhaseSign(deptClass, mode)`:

| `dept_class` | `off` | `dept-135` | `dept-90` |
| --- | --- | --- | --- |
| `CH`     | +1 | +1 | +1 |
| `CH₃`    | +1 | +1 |  0 |
| `CH₂`    | +1 | −1 |  0 |
| `C`      | +1 |  0 |  0 |
| `null`   | +1 |  0 |  0 |

`+1` renders above baseline, `−1` renders below baseline (inverted), `0` skips the peak entirely. This single function is the source of truth — the rendering loop, hit-testing, the legend, and the unit tests all consult it.

## Keyboard shortcut

`D` cycles the mode when the NMR panel is focused (or no element holds focus). The shortcut is suppressed when a text input or contenteditable is focused so it never collides with annotation editing or the search bar. The shortcut only fires when ¹³C is the active nucleus — pressing `D` in ¹H mode is a no-op.

## What this is not

DEPT in Kendraw is a **rendering recipe applied to the predicted ¹³C spectrum**, not a true pulse-program simulation:

- We do not simulate J-coupling editing — the ratio of CH₃:CH:CH₂ intensities does not encode `sin(θ)cos²(θ)` magnetization transfer at the user's chosen θ. Every visible peak retains its full ¹³C intensity.
- We do not model the small phase distortions or off-resonance attenuation present in real DEPT spectra.
- The `dept_class` annotation comes from RDKit's hydrogen-counting on each carbon — it is exact for predicted structures but does not handle the rare exceptions (e.g. carbons in unusual hybridization states).

For a research-grade DEPT simulation that respects pulse-angle physics, use a dedicated NMR simulator (e.g. `MestreNova`, `nmrglue`). Kendraw's DEPT rendering is intended for teaching, structure-validation, and at-a-glance peak-class disambiguation.

## Tests

- Unit (`packages/nmr/src/__tests__/SpectrumRenderer.test.ts`): exhaustive `peakPhaseSign` truth table, DEPT-135 inversion check, DEPT-90 visibility check, legacy `deptMode: true` mapping check.
- E2E: covered by the regression suite under `e2e/p3-edge/dept-modes.spec.ts` (forthcoming wave-4 P1-02 batch).
