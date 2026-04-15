# CDXML Conformity Report

**Date:** 2026-04-12
**Test files:** `ESI.cdxml` (reaction scheme), `Molecules.cdxml` (molecular catalog)
**Comparison baseline:** ChemDraw 19.0.1.28

---

## Test File Summary

| Feature                 | ESI.cdxml                           | Molecules.cdxml              |
| ----------------------- | ----------------------------------- | ---------------------------- |
| Atoms                   | 320 (C:181, O:129, H:10)            | 932 (C:604, O:328)           |
| Bonds                   | 307 (single:221, double:86)         | 944 (single:640, double:304) |
| Stereo bonds (Display)  | 0                                   | 0                            |
| Reaction arrows         | 4                                   | 0                            |
| Graphic overlays        | 4 (lines)                           | 0                            |
| Annotations (captions)  | 22                                  | 225                          |
| GenericNickname nodes   | 22 (R groups)                       | 0                            |
| Fragments               | 22                                  | 36                           |
| Reaction schemes/steps  | 4 / 4                               | 0 / 0                        |
| Custom colors used      | 0 (palette defined, not referenced) | 0                            |
| BondCircularOrdering    | 0                                   | 192                          |
| DoublePosition explicit | 0                                   | 0                            |

---

## Conformity Status by Feature

### Fully Conformant

| Feature                           | Status | Notes                                                                              |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Atom coordinates                  | OK     | Positions match via SCALE factor from CDXML points                                 |
| Single bond rendering             | OK     | Correct line width from LineWidth setting                                          |
| Double bond rendering             | OK     | Ring-side detection via neighbor analysis                                          |
| Bond shortening near labels       | OK     | MarginWidth + label-proportional gap                                               |
| Atom label display (formula mode) | OK     | Digits auto-subscripted for face=96/97                                             |
| Label justification               | OK     | Left/right based on average bond direction                                         |
| Implicit hydrogen display         | OK     | Respects ShowTerminalCarbonLabels, ShowNonTerminalCarbonLabels                     |
| GenericNickname rendering         | OK     | R-group labels extracted from `<s>` text                                           |
| Reaction arrows (forward)         | OK     | Bezier curve with solid arrowhead                                                  |
| Free text annotations             | OK     | Multi-line text with subscript/superscript                                         |
| Graphic overlays (lines)          | OK     | BoundingBox-based line rendering                                                   |
| Document settings propagation     | OK     | LineWidth, BoldWidth, BondLength, BondSpacing, HashSpacing, MarginWidth, LabelSize |
| Bond Display parsing              | OK     | Both string (`WedgeBegin`) and numeric (`6`) formats                               |
| Wedge bond rendering              | OK     | Filled triangle, narrow tip at Begin atom                                          |
| Hashed wedge rendering            | OK     | Expanding parallel hash lines                                                      |
| Hollow wedge rendering            | OK     | Triangle outline only                                                              |
| Wavy bond rendering               | OK     | Sinusoidal with visible amplitude                                                  |
| Dash bond rendering               | OK     | Evenly dashed line                                                                 |
| Bold bond rendering               | OK     | Thick line at boldWidth                                                            |

> **Note:** Stereo bond rendering (wedge, hashed-wedge, etc.) is fully implemented and tested
> but neither test file contains bonds with a `Display` attribute. A dedicated test fixture
> `stereo-test.cdxml` was created to exercise all stereo bond types. The parser, mapping, and
> renderer pipeline was verified correct through unit tests.

---

### Minor Differences

| #   | Feature                  | Severity | Description                                                                                                                                                                                                                                   | Impact                                                                        |
| --- | ------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | **Bold text weight**     | Minor    | CDXML face=97 (bold formula) renders text content correctly with subscript digits but does not apply bold font weight. ESI.cdxml uses this for "+" signs in reactions, Molecules.cdxml for compound numbering labels.                         | Numbering labels appear thinner than in ChemDraw. No functional impact.       |
| 2   | **Annotation font size** | Minor    | Caption/annotation text uses the document `LabelSize` for all annotations. Molecules.cdxml has captions at size 7 (subscript-style numbering) and size 8 (labels); both render at the same size. CDXML `CaptionSize` attribute is not parsed. | Compound numbers may appear slightly larger than in ChemDraw.                 |
| 3   | **Arrow head sizing**    | Minor    | ChemDraw uses `HeadSize`, `ArrowheadCenterSize`, `ArrowheadWidth` attributes for precise arrowhead geometry. Kendraw uses fixed 8px length / 5px half-width arrowheads.                                                                       | Arrow proportions slightly different, especially for large or small drawings. |

---

### Cosmetic Differences

| #   | Feature                      | Severity | Description                                                                                                                                                              | Impact                                                                         |
| --- | ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 4   | **Color scheme**             | Cosmetic | Kendraw uses dark theme (gray bonds `#aaaaaa`, light text `#e0e0e0`, dark background `#0a0a0a`). ChemDraw uses black bonds on white background.                          | Intentional design choice for the Kendraw UI. Not a conformity defect.         |
| 5   | **Font rendering**           | Cosmetic | Both use Arial/sans-serif but browser font rendering differs from ChemDraw's PostScript renderer. Kerning, hinting, and anti-aliasing vary.                              | Subtle differences in label spacing and crispness.                             |
| 6   | **Graphic line styling**     | Cosmetic | CDXML `<graphic>` elements with `LineType` (dashed, dotted) render as solid lines. Both test files use only solid lines.                                                 | No visible impact on test files. Would affect files with dashed brackets.      |
| 7   | **Reaction scheme grouping** | Cosmetic | ESI.cdxml contains 4 `<scheme>`/`<step>` elements defining reaction flow. Kendraw renders all objects positionally but does not interpret scheme/step semantic grouping. | No visible impact since objects are already positioned correctly in the CDXML. |

---

### Not Applicable to Test Files

These features are implemented but not exercised by the test files:

| Feature               | Status          | Notes                               |
| --------------------- | --------------- | ----------------------------------- |
| Triple bonds          | Implemented     | No triple bonds in test files       |
| Aromatic bonds        | Implemented     | No aromatic bonds in test files     |
| Dative bonds          | Implemented     | No dative bonds in test files       |
| Atom charges          | Implemented     | No charged atoms in test files      |
| Isotope labels        | Implemented     | No isotopes in test files           |
| Radical electrons     | Implemented     | No radicals in test files           |
| Atom colors           | Implemented     | No per-atom colors in test files    |
| Bond colors           | Not implemented | No colored bonds in test files      |
| Retrosynthetic arrows | Implemented     | All arrows are forward type         |
| Equilibrium arrows    | Implemented     | No equilibrium arrows in test files |

---

## Stereo Bond Test Fixture

A dedicated `stereo-test.cdxml` file was created at
`tests/fixtures/cdxml-urd-abbaye/stereo-test.cdxml` containing:

- **Molecule 1:** String Display values (`WedgeBegin`, `WedgedHashBegin`)
- **Molecule 2:** Numeric Display values (`6`=wedge, `3`=hashed-wedge, `9`=hollow-wedge, `5`=bold)
- **Molecule 3:** End variants (`WedgeEnd`, `WedgedHashEnd`, `10`=hollow-wedge-end, `8`=wavy)

Import this file to visually verify that stereo bonds render as triangles, not lines.

---

## Recommendations

1. **No critical issues.** Both test files render structurally equivalent to ChemDraw.
2. **Add bold font weight** for face=97 text to improve numbering label fidelity (minor).
3. **Parse CaptionSize** from CDXML document settings and apply to annotations (minor).
4. **Scale arrowhead geometry** from CDXML `HeadSize`/`ArrowheadWidth` attributes (minor).
5. **Acquire CDXML test files with stereo bonds** for visual regression testing.
