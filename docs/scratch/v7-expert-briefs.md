# V7 Expert Briefs (factual context, no opinions)

> **Purpose.** Pre-noting reading material for the 8-expert V7 panel
> reassessment of Kendraw. Compiled 2026-04-18 from primary sources
> (commit log, implementation reports, deferred-work docs, V5/V6
> reviews, benchmark, ChemDraw exhaustive comparison, README,
> roadmap). Contains only data — no scoring, no opinions, no
> recommendations.

---

## Section A — Inventory of deliveries since V6

### A.1 Source documents found

| Doc | Status | Lines |
|---|---|---:|
| `docs/nmr-scientific-review-v5.md` | found | 469 |
| `docs/nmr-scientific-review-v6.md` | found | 583 |
| `docs/implementation-report-wave-2.md` | found | 83 |
| `docs/implementation-report-wave-3.md` | found | 101 |
| `docs/implementation-report-wave-4.md` | found | 186 |
| `docs/implementation-report-wave-4-redraw.md` | found | 112 |
| `docs/implementation-report-wave-5.md` | found | 275 |
| `docs/implementation-report-canvas-new-rebuild.md` | found | 174 |
| `docs/canvas-new-shell-fix.md` | found | 157 |
| `docs/canvas-new-button-handlers-fix.md` | found | 98 |
| `docs/deferred-work-wave-2.md` | found | 94 |
| `docs/deferred-work-wave-3.md` | found | 91 |
| `docs/deferred-work-wave-4.md` | found | 207 |
| `docs/deferred-work-toolbox-fix.md` | found | 49 |
| `docs/benchmark-kendraw-vs-chemdraw-v0.2.0.md` | found | 294 |
| `docs/chemdraw-exhaustive-comparison.md` | found | 494 |
| `docs/kendraw-roadmap-to-10.md` | found | 516 |
| `README.md` | found | 215 |

All listed docs exist; none missing.

### A.2 Wave-4 (NMR + pharma compliance batch shipped 2026-04-17/18)

Source: `docs/implementation-report-wave-4.md`. Six P1 stories. All
gated by 7-check pre-commit. Frontend +83 unit tests; backend +0;
E2E +0.

| Story | Commit | Scope |
|---|---|---|
| P1-01 — DEPT-135/DEPT-90 UI | `5010575` | `NmrMode` union (`off | dept-90 | dept-135`); `peakPhaseSign()` truth-tabled; 3-state cycle + `D` hotkey gated to ¹³C; CH₂ inverted; legacy `deptMode: boolean` kept as deprecated alias. |
| P1-02 — Multiplet line list + integration toggle | `1e5caf6` | Per-line ppm + percent table embedded in tooltip for non-singlets; `Shift+I` integration toggle gated to ¹H; ratios verified (triplet 25/50/25 ±5 %, quartet 13/38/38/13, dd ≈100). |
| P1-03 — JCAMP-DX 1D import + spectrum overlay | `542263a` | `parseJcampDx1D` (AFFN, ascending-ppm flip, XUNITS PPM/HZ, YFACTOR scaling, normalized nucleus strings); covers ~95 % of Bruker/JEOL/MestReNova exports; **strict refusals** for ASDF, non-NMR types, missing observe-frequency on Hz axis; orange overlay over blue prediction; toggle button. |
| P1-04 — Append-only audit trail | `0a7472e` | `InMemoryAuditLog` with SHA-256 chain; `verifyAuditChain()` returns one of `hash-mismatch`, `previous-hash-mismatch`, `sequence-gap`, `sequence-restart`. **Beta — tamper-evident, not non-repudiation** (no per-user identity yet). |
| P1-05 — Record lock + e-signature modal | `a2b8c9c` | `lockRecord` / `unlockRecord` / `requireUnlocked`; reason ≥ 3 chars validated at data + UI; `ESigModal` (`role="dialog"`, `aria-modal`); meaning enum approved/reviewed/authored/witnessed. **Beta — no password challenge** (depends on deployment SSO/OIDC). |
| P1-06 — CDXML 1.0 writer MVP | `e3fc0a9` | `writeCdxml(page, opts)` with prolog + DOCTYPE + `<fonttable>` + `<colortable>`; atoms (position, element, charge, isotope, radical, group expansion `<t>`); bonds (order, wedge/hash/hollow-wedge/wavy/dash/bold/dative `Display`); annotations rich-text; arrows mapped to `<arrow>` with ArrowheadHead/Tail/NoGo. **Round-trip tested.** |

Plus the act-1/2/3 docs preceding the stories: `dd8fae3`, `aee0d82`,
`d7a5c73`.

### A.3 Wave-4 redraw (canvas-new scaffolding shipped 2026-04-18)

Source: `docs/implementation-report-wave-4-redraw.md`. 5/8 P0
stories landed behind `VITE_ENABLE_NEW_CANVAS` flag (default
**false**). 3 deferred to wave-5.

| Story | Commit | Scope |
|---|---|---|
| W4-R-01 — Feature flag + shell scaffolding | `0b4bb62` | `feature-flags.ts`; `CanvasNew.tsx` with 4 placeholder grid areas. |
| W4-R-02 — Tool abstraction + pointer dispatcher | `de7a4a2` | Plain-object Tool interface; pointer events bound to active tool. |
| W4-R-03 — `CanvasRenderer` mount + store subscription | `f19b501` | Renders parity, RBush re-used. |
| W4-R-05 — Snap utility 15° default | `5eb3748` | `shift = free`. |
| W4-R-06 — Marquee rectangle selection | `0379972` | Replace/Add/Toggle modifiers. |

Closeout doc: `b18416b` then `3751bee` (THIRD-PARTY-NOTICES + deferred + impl report + README flag note).

### A.4 Wave-5 (canvas-new feature completion shipped 2026-04-18)

Source: `docs/implementation-report-wave-5.md`. 3 critical
wave-4-deferred stories + 4 P1 bonuses. Flag still defaults
**false**. UI: 89 → 113 (+24); scene: 242 → 246 (+4).

| Story | Commit | Scope |
|---|---|---|
| W4-R-11* — `remove-batch` scene command | `25d2f55` | Atomic delete; cascades incident bonds. |
| W4-R-04 — HoverIcon for atom + bond | `b6aba90` | Pure helpers (`bondPreview.ts`); separate SVG overlay (`HoverIconOverlay.tsx`); shared renderer untouched. Covers R-09 / R-10 (atom-by-click, bond-by-drag). |
| W4-R-07 — Drag-move + atomic undo + axis-lock + ctrl-duplicate | `0e69e53` | Threshold 3 px; transient `setDragOffset`; single `move-batch` on pointer-up; Shift = axis-lock; Ctrl = duplicate. |
| W4-R-08 / R-11 / R-12 — Quick-edit + Delete + cursor-zoom | `30dd5f7` | `quickEdit.ts` resolver (C N O S F P B I H, L=Cl, M=Me, 1/2/3 cycle bond order); Delete via `remove-batch`; wheel zoom anchored at cursor, clamped [0.25, 8]. |

Wave-5 closeout: `a101d25` (impl report). Hotfix `8f5090b` —
`fix(ui): scope feature flag to toolbox+canvas only, preserve shared
shell — wave-5 hotfix` (see canvas-new-shell-fix.md).

### A.5 Wave-6 (canvas-new toolbox rebuild shipped 2026-04-18)

Source: `docs/implementation-report-canvas-new-rebuild.md`. Six
self-contained commits.

| Order | Commit | Subject |
|---|---|---|
| w6-r-00 | `ba19ec2` | docs(wave-6): ketcher audit + kendraw feature inventory + toolbox spec |
| w6-r-01 | `f7b48a7` | feat(canvas-new): exhaustive toolbox with 17 p0 tools |
| w6-r-02 | `14052c8` | feat(canvas-new): wire new toolbox into app shell |
| w6-r-03 | `80bcdfd` | test(canvas-new): unit tests for wave-6 toolbox (16 tests) |
| w6-r-04 | `a1bb7e8` | feat(canvas-new): chemdraw-style tool hotkeys (12 single-key bindings) |
| w6-r-05 | `ecc289b` | test(canvas-new): e2e parity tests for wave-6 toolbox (16 specs × 2 projects = 32 runs) |
| w6-r-06 | `d6ff22c` | docs(wave-6): implementation report + validation checklist |

Plus deploy chore `bd1ea60`.

What shipped:
- 17 P0 tools wired (select, 3 bonds, 5 atoms, 2 rings, text, arrow, erase, undo, redo, paste-smiles, search, nmr-toggle, property-toggle).
- 7 P1 stubs visible-but-disabled (`comingSoon: true`).
- 12 ChemDraw single-key shortcuts: V, 1, 2, 3, C, H, N, O, S, R, T, E (W routed to arrow with wedge stubbed).
- NMR panel + PropertyPanel verified end-to-end (E2E #12: aspirin SMILES → RDKit metrics surface).

### A.6 Wave-7 hotfixes (toolbox refinement shipped 2026-04-18)

Source: commit log + `docs/canvas-new-button-handlers-fix.md` +
`docs/deferred-work-toolbox-fix.md`.

| HF | Commit | Subject |
|---|---|---|
| HF-1 | `2f26598` | feat(canvas-new): 2-column toolbox with grouped tools |
| HF-2 | `0c144fb` | feat(canvas-new): wire atom / ring / text / arrow / erase tools |
| HF-3 | `c89b71a` | feat(canvas-new): clean/refine structure endpoint + buttons |
| HF-4 | `6e40114` | feat(canvas-new): restore fit-to-view button |
| HF-5 | `c56f15b` | feat(theme): complete dark/light mode for dialogs + nmr tooltip |
| HF-6 | `b1a3697` | fix(canvas-new): wire all toolbox button onClick handlers to store |

HF-1 dropped 6 tool-kind entries that lacked backing implementations
(lasso, bond-wedge, bond-dash, bond-aromatic, atom-picker,
curly-arrow) per the "no placeholders" rule — see
`docs/deferred-work-toolbox-fix.md` for unblock thresholds.

HF-6 root cause: three orphan placeholder `<div>`s in
`CanvasNew.tsx` shared the same CSS grid cells as the real toolbox
widgets and silently intercepted pointer events; keyboard kept
working because hotkeys bind to `window.keydown`. Fix: drop the
placeholders + assert their absence.

### A.7 Test counts — V6 vs current

Sources: V6 review §0 + wave-4/5/6 implementation reports.

| Suite | V6 (post wave-3) | After wave-4 | After wave-5 | After wave-6 | Notes |
|---|---:|---:|---:|---:|---|
| Frontend unit (Vitest, total) | 546 | 566 (+20*) | 677 / 113 ui | 140 ui (+27 vs wave-5) | wave-4 doc says +83 FE in P1 stories — discrepancy traced to packaging breakdown; wave-5 reports 677 FE total |
| Scene (vitest) | 242 | 242 | 246 (+4 remove-batch) | 246 | |
| UI (vitest) | 65 baseline pre-redraw | 89 | 113 | 140 | |
| Backend unit (pytest) | 242 | 242 | 242 | 242 | unchanged across all waves since V5 |
| E2E specs | 24 | 24 | 24 | 16 new wave-6 specs (across 2 playwright projects = 32 runs) + the toolbox-clicks regression suite (23 tests, HF-6) | |
| CI bypass events | 0 | 0 | 0 | 0 | no `--no-verify` used |

\* The wave-4 impl report quotes 566 FE total (+83 in the P1 batch
relative to a cited 483 baseline). The 546-vs-566 delta reflects
the wave-4 P1 work landing on a 483-line baseline, while wave-5/6
restate totals against the post-redraw UI subtree.

### A.8 Feature flag state

`packages/ui/src/config/feature-flags.ts`:

```ts
export const FEATURE_FLAGS: Readonly<Record<FeatureFlagName, boolean>> = {
  newCanvas: readBoolEnv(import.meta.env.VITE_ENABLE_NEW_CANVAS),
};
```

`readBoolEnv` returns `true` only for the literal string `"true"`.
**Default value of `VITE_ENABLE_NEW_CANVAS`: unset → `false`**.

The flag swaps `Toolbox + Canvas` only; the shared shell (header,
PropertyPanel, NMR panel, StatusBar, modals) renders identically in
both modes (rule established by wave-5 hotfix `8f5090b` and
`docs/canvas-new-shell-fix.md`). Confirmed in `CLAUDE.md` user
memory: "VITE_ENABLE_NEW_CANVAS swaps toolbox + canvas only; never
the shared shell".

---

## Section B — Per-expert briefs

### B.1 Pr. Marie-Claire DUVAL (chimie organique, Paris-Saclay / Sorbonne)

| | |
|---|---|
| V5 note | 8.0 / 10 |
| V6 note | 8.1 / 10 (+0.1) |

**V6 top-3 demands (verbatim):**
1. "DEPT UI frontend (backend calcule deja, il ne manque qu'un toggle et un rendu)."
2. "Multiplets resolus (dd, dt, ddd, td) avec constantes J en Hz."
3. "Prediction HSQC (au minimum)."

**V6 blockers:**
- DEPT toujours invisible côté UI (carried from V4 + V5).
- Multiplets non résolus (règle n+1 naïve; styrène vinylique sort en "m" au lieu de dd).
- Pas de HSQC/HMBC/COSY, pas de HOSE codes, pas de couplage longue distance, pas de NH/OH échangeables.
- Strategic blocker: deux waves successives (17 features) sans qu'aucune des 4 réserves NMR V5 ne soit adressée.

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| DEPT UI | **Shipped wave-4 P1-01** (`5010575`) — `D` hotkey, 3-state cycle off/dept-90/dept-135, CH₂ inverted | wave-4 impl report §P1-01 |
| Resolved multiplets (dd/dt/ddd/td) | **Partially shipped wave-4 P1-02** (`1e5caf6`) — per-line ppm + percent table in tooltip; ratios verified (triplet 25/50/25, quartet 13/38/38/13, dd~100); resolved-line *render* still on Lorentzian envelope | wave-4 impl report §P1-02 |
| HSQC prediction | **NOT SHIPPED** — listed as P3 in wave-4 deferred (W4-D-02 — JCAMP NTUPLES + 2D NMR planes); roadmap-to-10 ranks 2D NMR XL/wave-6 | deferred-work-wave-4 §W4-D-02; v6 P2 row |

**V6 → V7 features touching organic chemistry workflow:**
- DEPT-135/90 phase rendering (P1-01).
- Multiplet line list + integration toggle Shift+I (P1-02).
- JCAMP-DX 1D import + experimental-vs-predicted overlay (P1-03).
- Wave-6 toolbox: 5-atom palette + 3-bond palette + 2-ring palette + text + arrow + erase, single-key hotkeys C/H/N/O/S/R/1/2/3 (gated to canvas-new flag).
- Wave-5 quick-edit: hover atom + key (`N`, `O`, `L`=Cl, `M`=Me, `1/2/3`=cycle bond order).
- Drag-move with atomic undo (W4-R-07) — addresses her chronic axis-snap irritation flagged in V5.

---

### B.2 Dr. Antoine MARCOS (synthèse totale, MIT)

| | |
|---|---|
| V5 note | 7.8 / 10 |
| V6 note | 8.1 / 10 (+0.3) |

**V6 top-3 demands (verbatim):**
1. "Multiplets resolus (pattern J-couplings reels) — prerequis absolu."
2. "HOSE codes + extension base 13C pour esters alpha-halogenes, enol ethers silyles, carbamates, sulfonates."
3. "DEPT UI exploitable (CH/CH2/CH3 lisible, couleurs/phases distinctes)."

**V6 blockers:**
- 13C additive incapable de prédire esters α-chlorés et énol éthers silylés (TBS, TES) — typiquement 5-8 ppm off.
- Multiplets toujours en enveloppe lorentzienne, pas de vrai pattern résolu.
- DEPT UI inexploitable (V5/V6 carry-over).
- Pas de 2D NMR. Pas de HOSE codes.
- Strategic: 9 wave-3 features, 0 NMR.

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| Multiplets résolus (patterns) | **Partially shipped wave-4 P1-02** — line-list table in tooltip; render-side resolved peaks NOT shipped (still Lorentzian envelope) | impl report; deferred W4-D-03 (roof effect / 2nd-order pattern still deferred to wave-5 behind `roofEffect` flag) |
| HOSE codes + 13C extension | **NOT SHIPPED** — explicit P2 in v6 §5 W4-09; roadmap-to-10 lists as Sarah CHEN top-3 + Marcos top-3 | v6 §5; roadmap-to-10 §1 |
| DEPT UI | **Shipped wave-4 P1-01** with phase coloring | wave-4 impl report §P1-01 |

**V6 → V7 features touching synthesis workflow:**
- DEPT-135/90 (P1-01).
- Multiplet line list (P1-02).
- JCAMP-DX import + overlay (P1-03) — gives him the experimental-vs-predicted comparison he flagged as `Top 3` priority in roadmap-to-10.
- CDXML 1.0 export Beta (P1-06) — round-trip tested; SI/JACS pipeline.
- Wave-6 toolbox: ChemDraw-style hotkeys preserved (C/N/O/S/F/H + 1/2/3 for bonds + V for select + W for arrow).
- Curly-arrow anchor snap (carried from wave-3) for mechanism schemas.

---

### B.3 Pr. Kenji YAMAMOTO (spectroscopie / pédagogie, Kyoto)

| | |
|---|---|
| V5 note | 9.0 / 10 |
| V6 note | 9.1 / 10 (+0.1) |

**V6 top-3 demands (verbatim):**
1. "DEPT-90 / DEPT-135 UI on existing 13C pipeline (low-hanging fruit, deferred twice)."
2. "Resolved first-order multiplet rendering + per-region integral values alongside the new cumulative trace."
3. "JCAMP-DX import with experimental-vs-predicted overlay — moves Kendraw from 'teaching aid' to 'usable in a real lab' and creates the substrate for HOSE-code calibration."

**V6 blockers:**
- DEPT-90 / DEPT-135 UI absent.
- Multiplets rendered as Gaussian/Lorentzian envelopes; no resolved first-order splitting.
- No 2D NMR (COSY/HSQC/HMBC), no JCAMP-DX/Bruker import.
- Process concern: backend tests frozen at 242 across V5/V6.
- Integration curve has no per-region numeric integral readout.

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| DEPT-90 / DEPT-135 UI | **Shipped wave-4 P1-01** (`5010575`) — both modes via `D` hotkey | impl report |
| Resolved multiplet rendering + per-region integrals | **Half shipped wave-4 P1-02** — line-list table in tooltip carries per-line ppm + percent, addresses "per-region integral values"; resolved-line *visual* render NOT shipped | impl report; deferred W4-D-03 |
| JCAMP-DX import + overlay | **Shipped wave-4 P1-03** (`542263a`) — AFFN 1D, ~95 % Bruker/JEOL/MestReNova coverage; overlay as orange line over blue prediction | impl report; ASDF, NTUPLES still deferred (W4-D-01 / W4-D-02) |

**V6 → V7 features touching pedagogy & spectroscopy workflow:**
- DEPT-135 / DEPT-90 phase rendering with hotkey + status indicator (P1-01).
- Multiplet line list (P1-02) + Shift+I integration toggle.
- JCAMP-DX import + spectrum overlay (P1-03).
- Wave-6 toolbox: 12 single-key shortcuts (V/1/2/3/C/H/N/O/S/R/T/E) — preserved/extended ChemDraw muscle memory under the new canvas flag.
- Compound numbering Ctrl+Shift+C (carried from wave-2/3) — already praised in V6 by Volkov for student handouts.
- Note: backend test count remains 242 (no change since V5/V6) — Yamamoto's process concern persists.

---

### B.4 Dr. Sarah CHEN (chimie computationnelle, Stanford / NMRShiftDB2)

| | |
|---|---|
| V5 note | 8.2 / 10 |
| V6 note | 8.2 / 10 (+0.0) |

**V6 top-3 demands (verbatim):**
1. "Solvent-suppression-aware 1H prediction (hide/grey water region, flag exchangeable NHs with confidence badge)."
2. "DEPT-90/135 overlay on 13C panel + heteronuclear prediction (19F minimum; 15N/31P stretch)."
3. "Peptide/biomolecule entry primitives: one-letter sequence-to-structure for short peptides, disulfide shorthand, PEG-n block."

**V6 blockers:**
- Amide NH predictions still show V5 variance (integration curve doesn't change that).
- No solvent-suppression display (no presat / WATERGATE indication, no greyed water region) — predicted trace misleading near 4.7 ppm for H2O/D2O spectra.
- DEPT invisible.
- No biomolecule primitives (residue entry, disulfide, glycan, PEG-n).
- Export to ELN (Benchling) unchanged — PNG drag, not structured MOL/JSON round-trip.
- No heteronuclear (15N, 19F, 31P).
- New blocker: grid / angle-snap defaults shifted bond geometries; affected one Fmoc-residue template on re-open.

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| Solvent suppression / exchangeable-NH badge | **NOT SHIPPED** — deferred as v6 P2-12 (W4-12 in v6 §5) | v6 §5 |
| DEPT UI + heteronuclear (19F minimum) | **Half — DEPT UI shipped (P1-01); heteronuclear NOT** — 19F/31P still in roadmap-to-10 §1 (Duval), v5 P3 | impl report; v6 §5 P3 list |
| Biomolecule primitives (peptide/glycan/PEG-n) | **NOT SHIPPED** — deferred as P3/P4 (chemdraw exhaustive comparison §BioDraw row); v6 §5 lists as P3 deliberately wave-7+ | benchmark §4.4 entries 36-40 |

**V6 → V7 features touching comp-chem workflow:**
- DEPT-90/135 phase rendering (P1-01).
- JCAMP-DX import — substrate for future HOSE-code calibration she demanded; matches her V5 ask "Calibration sur NMRShiftDB2" path.
- Audit trail SHA-256 chain (P1-04) — relevant to reproducibility/provenance angle.
- CDXML export (P1-06) — structured-output direction (still PNG/MOL/SMILES; no MOL+metadata JSON round-trip yet).
- No NMRShiftDB2 calibration loop, no MAE/RMSE/R² validation publishing.
- Backend pytest still 242 (no NMR-engine logic added since V5).

---

### B.5 Dr. Lisa PARK (ex-PM ChemDraw / produit, Pfizer in V6)

| | |
|---|---|
| V5 note | 8.3 / 10 |
| V6 note | 8.6 / 10 (+0.3) |

**V6 top-3 demands (verbatim):**
1. "Impurity peak annotation workflow: click peak, attach (label, %, assignment, confidence), render in on-screen spectrum and `Ctrl+P` printout; export numeric integration table alongside SVG."
2. "DEPT-135 / DEPT-90 rendering on 13C panel with CH/CH₂/CH₃ polarity coloring."
3. "CFR 21 Part 11 MVP audit trail: per-edit timestamp + user, immutable change log exportable as JSON, 'lock compound' state."

**V6 blockers:**
- No CFR 21 Part 11 audit trail. Hard stop for GMP-adjacent use.
- No structured output (MOL+metadata JSON) for LIMS (Empower / LabWare). Integration values not exported as numeric pairs.
- No impurity peak annotation workflow ("most-asked-for feature").
- DEPT-135 / DEPT-90 not rendered.
- No LC-NMR / SFC-NMR coupling, no multi-spectrum overlay view.
- Compound numbering does not propagate into NMR panel title or integration trace export.
- New blockers: Print CSS clips wide integration trace at 1440p; Shift+O group label expansion mismatches Ctrl+E angle; no "lock record" / read-only mode → CFR 21 failure mode.

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| Impurity peak annotation workflow | **NOT SHIPPED** — listed as v6 §5 W4-11 P2 | v6 §5 P2 row 11 |
| DEPT-135/90 rendering with polarity coloring | **Shipped wave-4 P1-01** (`5010575`) | impl report |
| CFR 21 Part 11 MVP audit trail (+ lock-compound state) | **Shipped wave-4 P1-04 + P1-05 (Beta)** (`0a7472e`, `a2b8c9c`) — SHA-256 chain, lockRecord/unlockRecord/requireUnlocked, reason-for-change ≥ 3 chars, ESigModal accessible dialog. **Tamper-evident, NOT non-repudiation** (no per-user identity yet — deferred W4-D-05). Wave-4 deferred work also includes: persistence to IndexedDB (W4-D-06), wiring into dispatch chokepoint (W4-D-07), AuditLogPanel viewer (W4-D-08), server-side enforcement (W4-D-09). | impl report §P1-04/05; deferred-work-wave-4 §W4-D-05 to W4-D-10 |

**V6 → V7 features touching analytical / process-R&D workflow:**
- Audit trail (P1-04) + record lock + e-signature (P1-05) — both **Beta**.
- DEPT-135/90 (P1-01).
- JCAMP-DX import + overlay (P1-03) — multi-spectrum overlay unblocker.
- CDXML 1.0 export (P1-06) — structured exchange with ChemDraw-21+ pipeline; round-trip tested.
- Wave-6 ChemDraw-style toolbox + 12-key shortcut parity — closer to ChemDraw muscle-memory for on-boarding QA reviewers.
- No impurity-peak annotation, no LIMS structured export, no multi-spectrum overlay UI, no print-CSS clip fix.

---

### B.6 Pr. Hassan AL-RASHID (pharma / FDA — V6: 6.8)

| | |
|---|---|
| V5 note | 7.0 / 10 |
| V6 note | 6.8 / 10 (−0.2) — only negative delta of the V6 panel |

**V6 top-3 demands (verbatim):**
1. "Ship DEPT in UI + resolved multiplet annotation — minimum viable bar for 13C to be usable in SAR."
2. "HOSE-code-based shift prediction (curated DB of ~5k shifts) + confidence intervals."
3. "JCAMP-DX import with experimental-vs-predicted overlay — without experimental comparison, predictions are unfalsifiable and scientifically inert."

**V6 blockers (all 5 V5 NMR blockers carried + new):**
- DEPT invisible — 13C STILL useless for hit-to-lead SAR.
- Additive 1H shifts miss by 0.4-0.8 ppm on ortho-disubstituted sulfonamides, N-aryl piperazines, 2-aminopyrimidines.
- No HOSE codes.
- No 2D NMR (COSY/HSQC/HMBC NON-NEGOTIABLE for hit validation).
- No JCAMP-DX overlay.
- No confidence-weighted error bars.
- No resolved multiplet annotation.
- Backend test count FROZEN at 242 — zero new NMR logic.
- New blockers: Strategic priority drift toward pedagogy/drawing while research-grade NMR starved; 9 wave-3 features 100 % non-NMR; no roadmap commitment / stub for 2D NMR in changelog.

V6 verdict: **NO-GO for research-grade beta**. WITH RESERVATIONS for teaching/pedagogy beta.

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| DEPT UI + resolved multiplet annotation | **Half — DEPT UI shipped (P1-01); multiplet line-list shipped in tooltip (P1-02); resolved-line render still Lorentzian envelope (W4-D-03 deferred)** | impl report; deferred-work-wave-4 §W4-D-03 |
| HOSE-code prediction + confidence intervals | **NOT SHIPPED** — listed as v6 §5 W4-09 P2 (4/8 expert demand); roadmap-to-10 §1 Duval/Marcos/Yamamoto/Chen all rank as XL Top-3 | v6 §5 P2 |
| JCAMP-DX import + overlay | **Shipped wave-4 P1-03** (`542263a`) — AFFN 1D ~95 % real-world coverage; orange overlay over blue prediction; toggle button | impl report |

**V6 → V7 features touching pharma / medchem / FDA workflow:**
- DEPT UI (P1-01) — closes his single most-cited V5/V6 NMR P0.
- Multiplet line list (P1-02) — partial close on his "resolved multiplet" demand.
- JCAMP-DX import + experimental overlay (P1-03) — full close on his "predictions are unfalsifiable" demand.
- Audit trail (P1-04) Beta — addresses Kumar/Reid 21 CFR Part 11 lane (V6 wave-4 doc tracks Kumar+Reid+Al-Khatib as parallel pharma reviewers).
- Record lock + e-signature (P1-05) Beta — second half of GMP primitive pair.
- CDXML 1.0 export (P1-06) — addresses Reid eCTD blocker.
- Backend pytest still 242 — Al-Rashid's "backend test count FROZEN" critique persists.
- No HOSE-code DB, no confidence intervals, no 2D NMR, no Markush/R-group data model (CDXML R-group export deferred W4-D-11 — depends on a Markush data model not yet in `packages/scene/src/types.ts`).

Note: V6 review §0 attributes Al-Rashid's score drop to "strategic
drift" not product quality (V6 review acted on this in wave-4
planning — wave-4 explicitly named as "the response to V6's only
negative score delta").

---

### B.7 Marina VOLKOV (étudiante M2, Moscow State — V6: 9.6)

| | |
|---|---|
| V5 note | 9.3 / 10 |
| V6 note | 9.6 / 10 (+0.3) — highest of the panel |

**V6 top-3 demands (verbatim):**
1. "DEPT-135 / DEPT-90 overlay in the NMR panel."
2. "Fischer / Haworth / Newman conformational templates."
3. "Quiz / exercise mode with auto-grading for 'draw the product' / 'push the arrows' problems."

**V6 blockers:**
- DEPT overlay for 13C absent (single largest gap for teaching NMR interpretation).
- Fischer / Haworth / Newman templates missing (carbohydrate + conformational-analysis lectures still rely on hand-drawing).
- No quiz/exercise mode.
- Unicode beyond μ (π, σ, δ⁺/δ⁻) would be welcome.
- Minor: curly-arrow anchor snap should also snap to midpoint of an already-drawn curly arrow (pericyclic reactions).
- Minor: Shapes tool would benefit from dashed-stroke toggle for orbital envelopes.

V6 verdict: **GO** (the only unconditional GO on the panel).

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| DEPT-135 / DEPT-90 overlay | **Shipped wave-4 P1-01** | impl report |
| Fischer / Haworth / Newman conformational templates | **NOT SHIPPED** — explicitly P3 in v6 §5; deferred-work-wave-3 + benchmark v0.2.0 §4.3 entry #31 (L each, needs 2.5-D primitives) | v6 §5; benchmark §4.3 |
| Quiz / exercise mode | **NOT SHIPPED** — explicitly P3 in v6 §5 | v6 §5 P3 list |

**V6 → V7 features touching teaching workflow:**
- DEPT-135/90 (P1-01) closes her single largest gap.
- Multiplet line list (P1-02) — pedagogically richer hover info.
- JCAMP-DX import (P1-03) — lets her show students experimental-vs-predicted in a single panel.
- Wave-6 toolbox: 17 P0 tools wired with single-key shortcuts (preserves V5/V6 muscle memory: V/C/H/N/O/S/R/T/E).
- Wave-5 quick-edit (hover atom + key) — fastest-path scaffold drawing matches her "20 second steroid" V6 anecdote.
- Wave-6 hotfix HF-5 — completed dark/light mode for dialogs + NMR tooltip (V6 mentioned no dark-mode regressions but V7 sessions will hit it cleanly).
- No quiz mode, no Fischer/Haworth/Newman.

---

### B.8 Thomas WEBER (admin IT, Novartis — V6: 9.4)

| | |
|---|---|
| V5 note | 9.2 / 10 |
| V6 note | 9.4 / 10 (+0.2) |

**V6 top-3 demands (verbatim):**
1. "Observability baseline: Sentry FE+BE, Prometheus `/metrics` on FastAPI, Grafana (latency/error-rate/RDKit queue depth), UptimeRobot on `/health`."
2. "Rate limiting + multi-stage Dockerfile: Traefik rate-limit middleware on `/predict` and `/nmr`, split backend Dockerfile into builder + runtime (target <200 MB)."
3. "Pre-commit/pre-push split + image CI: pre-commit fast (<5s), pre-push full battery. CI job builds prod image + curls `/health` before merge. Tag images with git SHA for rollback."

**V6 blockers:**
- No multi-stage Dockerfile. Final image carries build toolchain + dev deps.
- Pre-commit runs full 7-check battery (30-60 s) — belongs on pre-push.
- Zero production observability. No Sentry, no Prometheus scrape, no Grafana, no uptime monitor on `/health`.
- No rate limiting on `/predict`. Single scripted client can saturate RDKit workers.
- No documented CSP / security headers audit.
- Docker image not re-tested in CI post-hook-additions.
- New blockers: No backup strategy documented; no rollback procedure; container logs ephemeral; no dependency scanning (Dependabot, Trivy, pip-audit, pnpm audit).

V6 verdict: **GO WITH RESERVATIONS** (deploy real, reproducible,
HTTPS-terminated; reservation = shipping public URL with zero
observability and no rate limit is operating on faith).

**Status of each V6 demand at V7:**

| Demand | Status | Evidence |
|---|---|---|
| Observability baseline (Sentry / Prometheus / Grafana / UptimeRobot) | **NOT SHIPPED** — explicit v6 §5 P1-04 (W4-04). No `sentry`, `prom`, `grafana` keywords in commit log since V6. | v6 §5; commit log |
| Rate limiting + multi-stage Dockerfile | **NOT SHIPPED** — explicit v6 §5 P1-05 (W4-05). Commit `bd1ea60` "chore(deploy): docker config updates + deploy script" landed but doc trail does not claim multi-stage or rate-limit middleware. | v6 §5; commit `bd1ea60` |
| Pre-commit / pre-push split + image CI | **NOT SHIPPED** — pre-commit hook still runs all 7 checks per `CLAUDE.md`. No commit references a hook restructure. | `CLAUDE.md` Mandatory CI checks; commit log |

**V6 → V7 features touching infra / security / observability:**
- Commit `bd1ea60` (chore(deploy)) — incremental docker-config + deploy-script updates; no architectural change documented.
- Wave-4 P1-04 audit trail SHA-256 chain — gives him a tamper-evident change log primitive (in-memory only; persistence + dispatch wiring deferred W4-D-06/W4-D-07).
- Pre-commit hook held green across wave-4/5/6 (~25+ commits since V6, zero `--no-verify`) per impl reports.
- E2E suite expanded with chromium + chromium-new-canvas projects; hot-fix HF-6 added a 23-test toolbox-clicks regression suite.
- No Sentry, no Prometheus, no Grafana, no rate limit, no multi-stage Dockerfile, no dependency-scan automation, no documented backup/rollback.
- The shared shell preservation rule (wave-5 hotfix doc) protects against the kind of regression Weber would catch in a deploy review.

---

## Section C — Cross-cutting blocker themes

### C.1 Pharma compliance (Al-Rashid main concern)

**21 CFR Part 11 (audit trail, e-signature):**

| Item | Status at V7 | Source |
|---|---|---|
| Append-only audit trail with hash chain | **Shipped Beta — wave-4 P1-04** (`0a7472e`). `InMemoryAuditLog`, SHA-256 over `(prevHash | seq | timestamp | actor | action | target | reason | payload)`. `verifyAuditChain()` returns 4 typed reasons. 15 unit tests (happy + adversarial: post-hoc reason mutation, removed entry, re-attached forgery, reordered entries, mixed payload types). | impl report §P1-04 |
| Record lock + e-signature modal | **Shipped Beta — wave-4 P1-05** (`a2b8c9c`). `lockRecord` / `unlockRecord` / `requireUnlocked`. ESigModal: `role="dialog"`, `aria-modal`, actor + meaning enum (approved/reviewed/authored/witnessed) + reason (≥ 3 chars validated at data + UI). | impl report §P1-05 |
| Per-user cryptographic identity | **NOT shipped** (W4-D-05 deferred to wave-5 with SSO/OIDC scope). Without it: tamper-evident, **not non-repudiation**. | deferred-work-wave-4 §W4-D-05 |
| Audit log persistence to IndexedDB | **NOT shipped** (W4-D-06). | deferred-work-wave-4 §W4-D-06 |
| Audit wiring into command dispatch chokepoint | **NOT shipped** (W4-D-07 — cross-cutting refactor warrants own PR with perf baseline). | deferred-work-wave-4 §W4-D-07 |
| AuditLogPanel.tsx viewer | **NOT shipped** (W4-D-08). Chain currently invisible to end user. | deferred-work-wave-4 §W4-D-08 |
| Server-side lock enforcement | **NOT shipped** (W4-D-09 — backend story). Browser-only lock = client-trusted. | deferred-work-wave-4 §W4-D-09 |
| ESigModal app-level wiring (file menu / shortcut) | **NOT shipped** (W4-D-10 — paired with W4-D-07). | deferred-work-wave-4 §W4-D-10 |
| CDXML export MVP | **Shipped wave-4 P1-06** (`e3fc0a9`). Round-trip tested. | impl report §P1-06 |
| CDXML R-group / Markush attachment points | **NOT shipped** (W4-D-11 — depends on R-group/Markush data model not yet in `packages/scene/src/types.ts`). | deferred-work-wave-4 §W4-D-11 |
| CDXML stereo descriptors beyond wedge/hash | **NOT shipped** (W4-D-12). | deferred-work-wave-4 §W4-D-12 |
| PDF/A-1b export for eCTD | **NOT shipped** (W4-D-13). | deferred-work-wave-4 §W4-D-13 |

Compliance posture statement (impl report §"Compliance posture
statement"): both P1-04 and P1-05 ship as **explicitly labelled
Beta** — tamper-evidence yes, non-repudiation no — pending the
identity layer.

### C.2 Comp-chem (Chen) — NMRShiftDB2 integration, batch tools

| Item | Status at V7 | Source |
|---|---|---|
| NMRShiftDB2 calibration loop | **NOT shipped** | roadmap-to-10 §"Sarah CHEN" item 1 (Effort L, Impact +0.8) |
| Validation cross + MAE/RMSE/R² publishable comparison | **NOT shipped** — no comparable benchmark doc in `docs/` | roadmap-to-10 §Chen item 2 |
| HOSE codes (gold standard since Bremser 1978) | **NOT shipped** — v6 §5 W4-09 P2 (XL); 4/8 experts demand | v6 §5 |
| Quantification d'incertitude (±σ ppm continuous) | **NOT shipped** — current confidence is 3-level ordinal | v6 review §Chen V6; roadmap §Chen item 4 |
| Heteronuclear (19F, 31P, 15N) | **NOT shipped** — explicit P3 in v6 §5 | v6 §5 P3 |
| Batch prediction tooling | **NOT shipped** | roadmap §Yamamoto item 13 |
| Solvent-suppression display + exchangeable-NH badge | **NOT shipped** — v6 §5 W4-12 P2 | v6 §5 P2 row 12 |
| JCAMP-DX import (substrate for HOSE calibration) | **Shipped wave-4 P1-03** | impl report |
| Backend NMR engine test count | **242 — unchanged since V5/V6** | wave-4 impl report (BE +0); wave-5 (BE 242); wave-6 (BE 242) |

### C.3 Toolbox UX (Park) — coverage % vs ChemDraw

Source: `docs/benchmark-kendraw-vs-chemdraw-v0.2.0.md` (computed
post wave-3) + `docs/chemdraw-exhaustive-comparison.md` (176-feature
audit).

| Metric | v0.1.0 | v0.2.0 (post wave-3) | Notes |
|---|---:|---:|---|
| Rubric score (10 categories × /10) | 56/75 | **67/75 = 89 %** | wave-2 closed bond/atom hotkey gap (+5); wave-3 closed canvas-tooling and shape gap (+10) |
| Full-surface coverage (vs 176-feature ChemDraw audit) | ~52 % | **~63 %** | 26-point gap concentrated in regulatory (#10) + format/data interop (#6) |
| Keyboard-shortcut parity | 28/35 | **31/35 = 89 %** | wave-3 added `Ctrl+E` (angle snap), `Ctrl+'` (grid), `X` (chain), `G` (shapes), `Shift+O/F/N/Y` (group labels) |

Wave-4/5/6 deliveries that further close the toolbox UX gap (not
yet re-scored):
- Wave-4 NMR `D` (DEPT cycle), `Shift+I` (integration toggle) → keyboard parity 33/35 per `docs/deferred-work-wave-4.md` §W4-D-15.
- Wave-6 canvas-new toolbox: 17 P0 tools wired with 12 ChemDraw single-key shortcuts (V/1/2/3/C/H/N/O/S/R/T/E + W routed to arrow). Behind `VITE_ENABLE_NEW_CANVAS=true` (default false).
- Wave-7 HF-2/3/4: atom/ring/text/arrow/erase tools wired; structure clean/refine endpoint wired; fit-to-view button restored.
- Wave-7 HF-1: 2-column toolbox with grouped tools.
- Wave-7 HF-5: complete dark/light mode for dialogs + NMR tooltip.
- Wave-7 HF-6: all toolbox button onClick handlers wired (HF-6 `b1a3697` dropped 3 orphan placeholder `<div>`s that intercepted clicks — 23 tests added in toolbox-clicks regression suite).

Where Kendraw is objectively superior to ChemDraw at v0.2.0
(benchmark §1.2, 14 entries):
1. Per-peak NMR confidence markers (high/medium/low + tooltip).
2. Bidirectional atom ↔ peak NMR highlighting.
3. DEPT classification colour-coded in spectrum (display-only at
   V6; with phase shipped wave-4 P1-01).
4. Multi-tab workspace + IndexedDB auto-save.
5. Native PNG/SVG/CSV NMR export (ChemDraw screenshots only).
6. Document style presets (ACS 1996, ACS Nano, RSC, Wiley, Nature).
7. Curly-arrow atom + bond + lone-pair anchor.
8. Privacy-by-default (no telemetry, no outbound calls except PubChem).
9. Browser + Docker dual deployment.
10. MIT licence, free forever, no per-seat fee.
11. Free SVG/PNG/PDF export with high-resolution + arrows preserved.
12. Wave-3 grid-snap with visible 25 px overlay.
13. Wave-3 bond-angle snap with status-bar indicator.
14. Live valence warnings in property panel.

### C.4 Education (Yamamoto, Volkov) — pedagogy features

| Feature | Status | Source |
|---|---|---|
| Cumulative integration trace (∫ toggle) | Shipped wave-2 A3 (`fa73bb5`) | impl report wave-2 |
| Multiplet line list + per-region integral % | Shipped wave-4 P1-02 | impl report wave-4 |
| DEPT-135 / DEPT-90 (`D` hotkey) | Shipped wave-4 P1-01 | impl report wave-4 |
| Compound numbering Ctrl+Shift+C with SVG export | Shipped wave-2 A1 (`97dcb20`) | impl report wave-2 |
| Group labels Shift+O/F/N/Y → OMe/CF₃/NO₂/OAc | Shipped wave-3 A4 (`fe40588`) | impl report wave-3 |
| Bond-angle snap Ctrl+E (30°) | Shipped wave-3 A5 (`f26d894`) | impl report wave-3 |
| Acyclic chain tool `X` (drag-to-size zigzag) | Shipped wave-3 A3 (`060ec6d`) | impl report wave-3 |
| Geometric shapes (rect/ellipse) `G` | Shipped wave-3 B1 (`52be026`) | impl report wave-3 |
| Grid snap Ctrl+' + 25 px overlay | Shipped wave-3 B2 (`7cf06a1`) | impl report wave-3 |
| Curly-arrow atom/bond/lone-pair anchor | Shipped wave-3 C1 (`520f89d`) | impl report wave-3 |
| Dipole μ + No-go ✗→ arrow types | Shipped wave-3 A1/A2 (`a31a970`) | impl report wave-3 |
| JCAMP-DX 1D import + overlay | Shipped wave-4 P1-03 | impl report wave-4 |
| Searchable shortcut cheatsheet | Shipped wave-2 A6/B3 (`2b9527e`) | impl report wave-2 |
| Quiz / exercise mode with auto-grading | **NOT shipped** — v6 §5 P3 (Volkov top-3) | v6 §5 |
| Fischer / Haworth / Newman conformational templates | **NOT shipped** — benchmark §4.3 entry #31 (L each, needs 2.5-D primitives) | benchmark §4.3 |
| Frequency selector (300/400/500/600 MHz) live multiplet update | Shipped pre-V5 (`ae4a35a`) | commit log |
| Solvent dropdown (CDCl₃, DMSO-d₆, CD₃OD, acetone-d₆, C₆D₆, D₂O) | Shipped pre-V5 (`fe20bff`, `52b482e`) | commit log |
| Per-peak confidence tooltips | Shipped pre-V5 (`3e83390`) | commit log |
| Bidirectional atom ↔ peak highlighting | Shipped pre-V5 (`8c5102f`) | commit log |
| Proton numbering (H1/H2/...) synchronized between structure + peak list | Shipped pre-V5 (`a1cf250`) | commit log |
| Dark/light theme + dialog parity | Shipped wave-7 HF-5 (`c56f15b`) | commit log |
| URL share / partage par lien | **NOT shipped** — roadmap §Yamamoto item 14 | roadmap |

### C.5 Admin IT (Weber) — deploy, security, observability

What landed since V6:

| Item | Commit / Source | Notes |
|---|---|---|
| Production deploy at `kendraw.fdp.expert` (Traefik + Let's Encrypt, SSL Labs A) | pre-V6 (`fcce83c`, `04147cc`) | already live at V6 |
| Husky pre-commit gate (7 checks: lint, tsc, vitest, ruff check, ruff format, mypy, pytest) | pre-V6 | extended at V6 (merge-conflict markers + Python syntax pre-check); held across wave-4/5/6 with zero `--no-verify` |
| Docker config + deploy script updates | `bd1ea60` (post wave-6) | no architectural change documented |
| Wave-4 audit trail SHA-256 chain (P1-04) | `0a7472e` | gives a tamper-evident change log primitive in-memory |
| E2E projects expanded (`chromium` + `chromium-new-canvas`) | wave-5 hotfix `8f5090b` + wave-6 `ecc289b` | flag-aware test runs |
| Toolbox-clicks regression spec (HF-6) | `b1a3697` | 23 tests + `elementFromPoint` hit-test sentinel |

What is **NOT shipped** since V6 (Weber's V6 top-3 explicitly):
- Sentry FE+BE — no commit references Sentry.
- Prometheus `/metrics` on FastAPI — no commit references metrics endpoint.
- Grafana dashboard — none.
- UptimeRobot on `/health` — none.
- Traefik rate-limit middleware on `/predict` and `/nmr` — none.
- Multi-stage Dockerfile (target <200 MB) — none documented.
- Pre-commit / pre-push split — pre-commit still runs full 7-check battery per `CLAUDE.md`.
- CI job that builds prod image + curls `/health` before merge — none.
- Image tags with git SHA for rollback — none documented.
- Backup strategy / rollback procedure — none documented.
- Log aggregation (container logs ephemeral) — unchanged.
- Dependency scanning (Dependabot, Trivy, pip-audit, pnpm audit) — none.
- CSP / security headers audit — none documented.

---

## Appendix — Commit log since 2026-04-01 (wave-2 onward)

Source: `git log --oneline --since="2026-04-01"` (truncated to
wave-2-and-after; full log includes earlier sprints).

```
b1a3697 fix(canvas-new): wire all toolbox button onClick handlers to store          [wave-7 HF-6]
c56f15b feat(theme): complete dark/light mode for dialogs + nmr tooltip — wave-7 HF-5
c89b71a feat(canvas-new): clean/refine structure endpoint + buttons — wave-7 HF-3
0c144fb feat(canvas-new): wire atom / ring / text / arrow / erase tools — wave-7 HF-2
6e40114 feat(canvas-new): restore fit-to-view button — wave-7 HF-4
2f26598 feat(canvas-new): 2-column toolbox with grouped tools — wave-7 HF-1
bd1ea60 chore(deploy): docker config updates + deploy script
d6ff22c docs(wave-6): implementation report + validation checklist — w6-r-06
ecc289b test(canvas-new): e2e parity tests for wave-6 toolbox — w6-r-05
a1bb7e8 feat(canvas-new): chemdraw-style tool hotkeys — wave-6 w6-r-04
80bcdfd test(canvas-new): unit tests for wave-6 toolbox — w6-r-03
14052c8 feat(canvas-new): wire new toolbox into app shell — wave-6 w6-r-02
f7b48a7 feat(canvas-new): exhaustive toolbox with 17 p0 tools — wave-6 w6-r-01
ba19ec2 docs(wave-6): ketcher audit + kendraw feature inventory + toolbox spec
8f5090b fix(ui): scope feature flag to toolbox+canvas only, preserve shared shell — wave-5 hotfix
a101d25 docs(wave-5): implementation report — 7/7 stories shipped, wave-6 flip recommendation
30dd5f7 feat(canvas-new): quick-edit + delete + cursor zoom + drag overlay wiring — wave-5 R-08 R-11 R-12
0e69e53 feat(canvas-new): drag-move with atomic undo, axis-lock, ctrl-duplicate — wave-5 W4-R-07
b6aba90 feat(canvas-new): hover icon for atom + bond extensions — wave-5 W4-R-04
25d2f55 feat(scene): remove-batch command for atomic delete — wave-5 W4-R-11 prep
3751bee docs(wave-4): close-out — notices, deferred R-04/07/08, impl report, readme flag
0379972 feat(canvas-new): marquee rectangle selection tool — wave-4 W4-R-06
5eb3748 feat(canvas-new): snap utility — 15° default, shift=free — wave-4 W4-R-05
f19b501 feat(canvas-new): mount CanvasRenderer + store subscription for render parity — wave-4 W4-R-03
de7a4a2 feat(canvas-new): tool abstraction interface + pointer dispatcher — wave-4 W4-R-02
0b4bb62 feat(canvas-new): feature flag + shell scaffolding — wave-4 W4-R-01
8074e0a docs: wave-4 redraw — implementation plan architect/dev/tea (acte 3)
a89f346 docs: wave-4 redraw — product plan pm/ba/ux/tw (acte 2)
2a81b18 docs: wave-4 redraw — ketcher clean-room analysis (acte 1)
b18416b docs: wave-4 implementation report + deferred work + readme + shortcuts
e3fc0a9 feat(io): cdxml writer with parse round-trip — wave-4 P1-06
a2b8c9c feat(persistence): record lock + e-signature modal with reason-for-change — wave-4 P1-05
0a7472e feat(persistence): append-only audit trail with sha-256 hash chain — wave-4 P1-04
542263a feat(io): jcamp-dx 1d nmr import + spectrum overlay — wave-4 P1-03
1e5caf6 feat(nmr): multiplet line list + shift+i integration toggle — wave-4 P1-02
5010575 feat(nmr): dept-135 up/down phase + dept-90 mode — wave-4 P1-01
d7a5c73 docs: wave-4 implementation plan (architect + dev + tea)
aee0d82 docs: wave-4 product plan (pm + ba + ux + tech-writer)
dd8fae3 docs: wave-4 pharma deep-dive and benchmark v0.2.0
f80bffc docs: nmr scientific review v6 — 11-panelist v5-to-v6 evaluation
801d25e docs: wave-3 implementation report, deferred-work doc, README counters
c7d7ac2 docs: refresh keyboard-shortcuts compliance — wave-3 A6
7cf06a1 feat(ui): snap-to-grid toggle with dotted 25 px overlay — wave-3 B2
52be026 feat(ui): shape tool + canvas/SVG shape rendering — wave-3 B1
520f89d feat(ui): curly-arrow atom and bond snapping — wave-3 C1
c1447b6 feat(scene): geometric shape data model — wave-3 B1
060ec6d feat(scene): acyclic chain tool with drag-to-size zigzag — wave-3 A3
f26d894 feat(ui): ctrl+E bond-angle snap toggle with status-bar indicator — wave-3 A5
fe40588 feat(ui): shift+group label hotkeys OMe/CF3/NO2/OAc — wave-3 A4
a31a970 feat(scene): dipole + no-go arrows with arrow-type submenu — wave-3 A1/A2
abe0070 docs: wave-3 backlog — inventory + tier A/B/C/D
4e2542b docs: wave-2 implementation report, deferred-work doc, README counters
f5419c6 feat(ui): ctrl+= / ctrl+- keyboard zoom — wave-2 A7
2b9527e feat(ui): searchable shortcut cheatsheet with wave-2 entries — wave-2 B3
f36e068 feat(scene): align-atoms command with L/R/T/B/center hotkeys — wave-2 B1
4ef39d5 feat(ui): ctrl+P print support with scoped @media print CSS — wave-2 A5
fa73bb5 feat(nmr): cumulative integration trace overlay — wave-2 A3
39d4452 feat(scene): add cyclononane, cyclodecane, cyclopentadiene templates — wave-2 A2
97dcb20 feat(ui): wire compound numbering toggle — close wave-1 P1-2 debt
```

End of briefs.
