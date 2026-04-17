# Backlog wave-2 — kendraw

> Generated 2026-04-17 from product-plan-wave-1, scientific-roundtable-wave-1,
> kendraw-roadmap-to-10, chemdraw-exhaustive-comparison and
> kendraw-vs-chemdraw-feature-gap. Tier classification per the bmad
> autonomous-session prompt: A = S/zero-risk, B = M/manageable, C = L/one max,
> D = XL or needs human input.

## Wave-1 already shipped (no need to revisit)

text tool · hotkey gating · multiplet rendering · DEPT viz · bidirectional
highlighting · CIP R/S E/Z · LogP/tPSA/HBD/HBA/Lipinski · InChI/InChIKey ·
PDF export · fused ring templates · reaction arrows + structured conditions ·
retrosynthesis arrow · session recovery banner · clipboard sniffer (read+write)
· lasso selection · theme system (dark/light) · style presets RSC/Wiley/Nature
· isotope D/T · σ_ppm · D2O exchange · SVG a11y metadata · compound numbering
core (canvas render) · PropertyPanel descriptors + identifiers + copy ·
solvent-residual peak markers (data + render) · molecular-formula/MW/exact-mass
display · rotatable bonds count · backend healthcheck/CORS/disclaimer.

## Tier A — small, high value, zero archi risk

| # | Story | Source | Size | Status |
|---|-------|--------|------|--------|
| A1 | Compound numbering UI wiring (toolbar + Ctrl+Shift+C + SVG export) — **closes wave-1 debt** | product-plan P1-2, gap-analysis | S | core shipped 550c171, UI pending |
| A2 | Cyclononane / cyclodecane / cyclopentadiene templates | exhaustive-comparison rings | S | absent |
| A3 | NMR integration step-curve overlay | roadmap #9, Yamamoto | S/M | data on peak.integration; not rendered |
| A4 | NMR zoom/pan via mouse wheel + drag + double-click reset | roadmap #12 | S | viewport infra exists, no event handlers |
| A5 | Print dialog (Ctrl+P + @media print CSS) | exhaustive-comparison UI | S | absent |
| A6 | Searchable shortcut cheatsheet (filter input) | Volkov roundtable | S | cheatsheet exists, no search |

## Tier B — medium effort, clear value

| # | Story | Source | Size | Status |
|---|-------|--------|------|--------|
| B1 | Alignment tool L/C/R/T/B for selection | Volkov, exhaustive-comparison | M | absent |
| B2 | Geometric shapes (rectangle, circle) annotations | exhaustive-comparison | M | absent |

## Tier C — large, at most one this session

| # | Story | Source | Size | Status |
|---|-------|--------|------|--------|
| C1 | Curved mechanism arrow with atom→bond anchoring | Duval, Marcos, Volkov | L | curly-arrow tool stub exists, no anchoring |

(C1 deferred to next session unless A+B finish early — too risky to bundle.)

## Tier D — deferred (XL or needs human input)

See `docs/deferred-work-wave-2.md` for full list and justification.

Highlights:
- 13C NMR prediction (XL — needs NMRShiftDB calibration)
- 19F / 31P NMR (L each)
- 2D NMR COSY/HSQC/HMBC (XL)
- CDXML binary `.cdx` export (XL — undocumented format)
- BioDraw module (XL)
- OPSIN structure-to-name (XL)
- Conformational templates Newman/Fischer/Haworth/chair (L each)
- 3D conformer generation + ETKDGv3 + MMFF94 (M but archi risk)
- Multi-page document (L — paradigm shift from tabs)
- ChemScript SDK (L)
- Audit trail CFR 21 Part 11 (L — compliance)

## Acceptance for this session

- 6+ A delivered, 2+ B delivered.
- A1 (compound numbering UI debt) is non-negotiable.
- Each feature: unit test(s) + Playwright E2E (p1-critical or p2-features).
- 7 CI checks green before each commit. Pre-commit hook never bypassed.
- Final: `docs/implementation-report-wave-2.md` + README counters refreshed.
