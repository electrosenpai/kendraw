# Product Plan — Wave 1

**Date:** 2026-04-17
**Authors (subagents):** Mary (BA), John (PM), Sally (UX), Winston (Architect), Amelia (Dev), Murat (TEA), Paige (Tech Writer)
**Source:** `docs/scientific-roundtable-wave-1.md` (8-expert roundtable)
**Policy applied:** academia-first (per Lisa Park), ship-this-session, no bypass of pre-commit hooks, keep 280+ unit tests and 18+ E2E green.

---

## 1. Deduplicated feature matrix

Columns: # / Feature / Requested-by / Disciplines / Effort / Impact / Priority.

| # | Feature | Requested by | Discipline(s) | Effort | Impact | Priority |
|----|---------|--------------|---------------|--------|--------|----------|
| 1 | Reaction arrow with structured conditions (reagents/solvent/T°C above-below) | Duval, Marcos, Park | Organic, Synth, Product | M | High | **P1** |
| 2 | Curly mechanism arrows with atom/bond/lone-pair anchors + Bézier | Duval, Marcos, Marina | Organic, Synth, Student | L | High | P2 |
| 3 | Retrosynthesis arrow variant (⇒) | Marcos | Synth | S | Med | **P1** |
| 4 | Auto compound numbering (1, 2, 3a, 3b) cross-scheme | Marcos, Park, Marina | Synth, Product, Student | M | High | **P1** |
| 5 | Polymer/repeat brackets `[ ]ₙ` with stoichiometry | Duval, Marcos, Marina | Organic, Synth, Student | M | Med | P2 |
| 6 | IndexedDB autosave + session recovery | Park, Marina | Product, Student | M | High | **P1** |
| 7 | OS clipboard multi-MIME (SMILES + MOL + SVG + PNG) copy/paste | Park, Marina | Product, Student | M | High | **P1** |
| 8 | Isotope rendering (¹³C, D, ¹⁵N) on canvas | Duval, Marcos | Organic, Synth | S | Med | **P1** |
| 9 | Functional-group text shortcuts (Boc/Cbz/Fmoc/Ts/TBS/PMB) | Marina | Student | M | Med | P2 |
| 10 | Lasso selection | Marina | Student | S | High | **P1** |
| 11 | Dark-mode canvas (SVG respects theme) | Marina | Student | M* | Med | **P1** |
| 12 | Persist document-style presets (RSC/Wiley/Nature) | Marina | Student | S | Med | **P1** |
| 13 | Bond-tool hover feedback on atom (snap preview) | Marina | Student | S | Med | P2 |
| 14 | Angular snap (30°/60°/90°) visible during bond drag | Duval | Organic | S | Med | P2 |
| 15 | CORSMiddleware actually wired + security headers | Weber | DevOps | S | High | **P1**-bundle |
| 16 | Docker healthchecks | Weber | DevOps | S | Med | **P1**-bundle |
| 17 | Rate-limiting (slowapi) on compute endpoints | Weber | DevOps | S | Med | P2 |
| 18 | Non-root Dockerfile.backend | Weber | DevOps | S | Med | P2 |
| 19 | `/version` + reproducibility block (engine_version, table_hash, rdkit_version, git_sha) | Chen, Al-Rashid | CompChem, Pharma | S | High | **P1**-bundle |
| 20 | Per-peak `sigma_ppm` + D2O-exchangeable marker on NMR | Chen, Yamamoto | CompChem, Pedagogy | S | Med | **P1** |
| 21 | "Research use only" disclaimer + provenance hash | Al-Rashid | Pharma | S | Med | **P1**-bundle |
| 22 | NMR frequency 60 MHz (benchtop) | Yamamoto | Pedagogy | S | Low | P3 |
| 23 | PAINS/Brenk filter endpoint (FilterCatalog) | Chen, Al-Rashid | CompChem, Pharma | S | Med | P2 |
| 24 | `num_rotatable_bonds`, `num_aromatic_rings`, QED in properties | Chen | CompChem | S | Med | P2 |
| 25 | InChI + InChIKey import/export symmetric | Chen, Al-Rashid | CompChem, Pharma | S | Med | P2 |
| 26 | `/compute/nmr/batch` NDJSON endpoint | Chen | CompChem | M | Med | P2 |
| 27 | ETKDGv3 3D + MMFF94 `/compute/3d` SDF | Chen | CompChem | M | Med | P2 |
| 28 | Gaussian/ORCA/NWChem input export | Chen | CompChem | L | Med | P3 |
| 29 | NMRShiftDB2 MAE/RMSE validation harness | Chen | CompChem | L | Med | P3 |
| 30 | Structure Clean-Up / Tidy (redraw 120°) | Duval | Organic | L | High | P2 |
| 31 | Conformation templates (chair, Newman, Fischer, Haworth) | Duval | Organic | L | Med | P3 |
| 32 | Bridged/cage templates (norbornane, adamantane, decalin) | Marcos | Synth | M | Med | P2 |
| 33 | Export SVG with semantic metadata (`<title>/<desc>/aria-label`) | Yamamoto, Park | Pedagogy, Product | S | Med | **P1** |
| 34 | Cheatsheet `?` dialog with search + categories | Marina | Student | S | Low | P2 |
| 35 | SMILES long-import progress spinner (>80 atoms) | Marina | Student | S | Low | P2 |
| 36 | Multi-page / multi-scheme document | Park | Product | L | High | P3 |
| 37 | Stereo "wavy bond" (undefined stereo) | Marcos | Synth | S | Med | P2 |
| 38 | Composite PDF "spectro fiche" (structure+spectrum+table) | Yamamoto | Pedagogy | M | Med | P2 |
| 39 | Persistent H_a/H_b structure↔peak labels exported | Yamamoto | Pedagogy | M | Med | P2 |
| 40 | Onboarding "First reaction in 60 seconds" | Park | Product | S | High | P2 |
| 41 | Markush / R-groups | Al-Rashid | Pharma | XL | High | P4 |
| 42 | HELM v2 / peptides | Al-Rashid | Pharma | XL | Med | P4 |
| 43 | .cdx / .cdxml import-export | Park, Marina, Al-Rashid | Product, Student, Pharma | XL | High | P4 |
| 44 | 2D NMR (COSY/HSQC/HMBC) | Yamamoto | Pedagogy | XL | High | P4 |
| 45 | SSO SAML/OIDC/LDAP + RBAC | Weber | DevOps | XL | Low (academia) | P4 |
| 46 | IUPAC Structure-to-Name (STOUT) | Duval, Al-Rashid | Organic, Pharma | XL | Med | P4 |
| 47 | Audit trail 21 CFR Part 11 | Al-Rashid, Weber | Pharma, DevOps | L | Low (academia) | P4 |
| 48 | Mechanism animation / playback | Duval, Marcos, Park | Organic, Synth, Product | XL | Low | P4 |

\* P1-11 (dark-mode) ESCALATED from S to M by Winston after auditing 13+ hardcoded color sites in renderer.ts.

---

## 2. Priority rules

- **P1** = dealbreaker adoption OR ≥3 experts requesting AND effort ≤M — **this session**
- **P2** = important, 2 experts, effort ≤L — next session
- **P3** = useful, 1 expert — backlog
- **P4** = XL or explicitly deferred per academia-first — long term

Strategic overrides:
- SSO / Markush / HELM / audit trail pushed to P4 per Park's advice (academia-first, wait until 70% parity).
- `.cdx` import/export pushed to P4 — XL, reverse-engineering effort too large for one session.

---

## 3. P1 list — 12 features

Final set (all S/M), grouped:

**Tier 0 — ready-to-ship, zero deps:**
- **P1-6**: Isotope rendering (S, 1h) — scene model already has field; atom-display emitter already writes superscript
- **P1-9**: Persist document-style presets (S, 1h) — `style-presets.ts` exists; just localStorage hook
- **P1-3**: Retrosynthesis arrow ⇒ (S, 2h) — `'reversible'` already in union, rename + add dedicated renderer

**Tier 1 — infrastructure:**
- **P1-12**: SVG export metadata title/desc/aria-label (S, 2h) — `metadata.ts` already exists
- **P1-11**: NMR sigma_ppm + D2O-exchangeable (S, 2h)
- **P1-10 bundle**: CORS+healthchecks+reproducibility+disclaimer (S, 3h) — CORS + /version already there

**Tier 2 — depends on Tier 1:**
- **P1-8 (dark-mode canvas, ESCALATED M, 3h)** — 13 hardcoded colors in renderer
- **P1-7**: Lasso selection (S, 3h) — reuses rectangular selection infra
- **P1-5**: Clipboard paste (M, 5h) — copy already done
- **P1-4**: Autosave recovery banner (M, 3h) — infra already 70% done, just banner + version

**Tier 3 — builds on arrow renderer:**
- **P1-1**: Reaction arrow conditions (M, 5h)
- **P1-3bis = P1-2-in-list: Auto compound numbering (M, 5h)**

Total realistic estimate: **~35h**.

---

## 4. P1 stories (BMAD format)

### P1-6 — Isotope rendering

**As a** NMR / tracer chemist, **I want** to mark an atom with a mass number (¹³C, D, ¹⁵N), **so that** my structures communicate isotopic labeling.

**Acceptance Criteria:**
1. GIVEN an atom with `isotope: 13` on a C, WHEN rendered, THEN "13" appears as left-superscript of "C" at 60-75% font size.
2. GIVEN H with `isotope: 2`, WHEN rendered, THEN "D" appears in place (preset default).
3. GIVEN a SMILES containing `[13C]`, WHEN imported, THEN `atom.isotope = 13`.
4. GIVEN an atom with isotope on canvas, WHEN exported to SVG, THEN the superscript is rendered as `<tspan>` with `baseline-shift="super"` and `font-size` reduced.
5. GIVEN a .kdx with isotope atoms, WHEN saved and reloaded, THEN isotope survives.

**Files touched:**
- `packages/scene/src/atom-display.ts` (verify/extend isotope emitter)
- `packages/renderer-canvas/src/renderer.ts` (verify superscript placement)
- `packages/renderer-svg/src/svg-export.ts` (mirror)
- Tests: `packages/scene/src/__tests__/atom-display.test.ts`

**Tests:** unit ≥2 (¹³C superscript placement, D special case); E2E 1 (import `[13C]C`, assert superscript visible via data-attribute).

**Risks:** D vs ²H convention — default to "D" for H/mass=2.

**Effort:** S (1h).

---

### P1-9 — Persist document-style presets

**As a** user with a house drawing style, **I want** my preset (RSC/Wiley/Nature/ACS) survive reloads, **so that** I don't repick it every session.

**Acceptance Criteria:**
1. GIVEN I pick "Nature" preset, WHEN I reload the app, THEN Nature is still active.
2. GIVEN no preset ever chosen, WHEN app boots, THEN default preset applies.
3. GIVEN a bad value in localStorage, WHEN app boots, THEN default preset applies (no crash).

**Files:** `packages/ui/src/App.tsx` (+ whichever component sets the preset); `packages/scene/src/style-presets.ts` (export applyPreset helper if missing).

**Tests:** unit 2 (localStorage round-trip, fallback on bad value); E2E 1 (pick preset, reload, assert persisted).

**Risks:** localStorage key drift — namespace as `kendraw:v1:docStyle`.

**Effort:** S (1h).

---

### P1-3 — Retrosynthesis arrow ⇒

**As a** synthetic chemist, **I want** to draw a double-line retrosynthesis arrow, **so that** my disconnections are visually distinct from forward reactions.

**Acceptance Criteria:**
1. GIVEN the retro-arrow tool is selected, WHEN I drag A→B, THEN an arrow with `type: 'retro'` is created.
2. GIVEN a retro arrow, WHEN rendered, THEN two parallel strokes + open arrowhead.
3. GIVEN a .kdx round-trip, THEN `type` stays `'retro'`.
4. GIVEN a CDXML file with retrosynthetic marker, WHEN imported, THEN arrow is `'retro'`.

**Files:** `packages/scene/src/types.ts`; `renderer-canvas/renderer.ts`; `renderer-svg/svg-export.ts`; `packages/ui/src/ToolPalette.tsx`.

**Tests:** unit 2 (discriminator, render geometry); E2E 1 (draw retro, export SVG, assert double stroke).

**Risks:** exhaustive match gaps — TS strict compiler catches.

**Effort:** S (2h).

---

### P1-12 — SVG export semantic metadata

**As a** accessibility auditor / downstream tool author, **I want** SVG exports with `<title>`, `<desc>`, and `aria-label`s on atoms, **so that** the SVG is accessible and re-importable.

**Acceptance Criteria:**
1. GIVEN an export with title "My Scheme", WHEN the SVG is generated, THEN `<title>My Scheme</title>` is the first child of `<svg>`.
2. GIVEN an export, WHEN generated, THEN `<desc>` contains a short summary ("3 compounds, 2 arrows" auto-generated).
3. GIVEN an atom in the SVG, WHEN inspected, THEN `aria-label="carbon atom"` or element-specific label.
4. GIVEN an empty scene, WHEN exported, THEN no crash.

**Files:** `packages/renderer-svg/src/metadata.ts`, `svg-export.ts`.

**Tests:** unit 2 (title/desc injection, aria-label on atoms); E2E 1 (export, parse, assert title).

**Risks:** aria-label explosion on 5000-atom scene — add only on labeled atoms (heteroatoms).

**Effort:** S (2h).

---

### P1-11 — NMR sigma_ppm + D2O-exchangeable marker

**As a** NMR user interpreting predicted spectra, **I want** per-peak uncertainty (σ ppm) and a D2O-exchangeable flag, **so that** I know which peaks are confidence-bounded and which disappear in D2O.

**Acceptance Criteria:**
1. GIVEN a prediction, WHEN response returns, THEN each `NmrPeak` has `sigma_ppm: float` (≥0) and `exchangeable: bool`.
2. GIVEN a peak with OH/NH/COOH, WHEN predicted, THEN `exchangeable: true`.
3. GIVEN a peak hover tooltip, WHEN shown, THEN uncertainty `δ ± σ` is displayed.
4. GIVEN a D2O-exchangeable peak, WHEN rendered, THEN a visible marker (e.g. asterisk or D2O badge) appears.
5. GIVEN a legacy client expecting only `shift_ppm`, WHEN response received, THEN old fields still parse (additive change).

**Files:** `backend/kendraw_chem/nmr/models.py`, `additive.py`, `additive_13c.py`; `packages/scene/src/types.ts` (optional field); `packages/nmr/src/` tooltip; `packages/ui/src/panels/NMRPanel*.tsx`.

**Tests:** unit backend (exchangeable detection on ethanol/acetic acid/toluene); unit frontend (tooltip render); E2E (import SMILES with OH, assert marker).

**Risks:** Sigma values are heuristic without calibration — document methodology in metadata.

**Effort:** S (2h).

---

### P1-10 — CORS/security/healthchecks/reproducibility/disclaimer bundle

**As a** production operator, **I want** strict CORS, healthchecks, reproducibility metadata on every API response, and a "research use only" disclaimer in the app, **so that** Kendraw is safe to pilot in a research environment and audit-able.

**Acceptance Criteria:**
1. GIVEN a request from allowed origin, WHEN hitting `/api/*`, THEN `Access-Control-Allow-Origin` echoes exactly that origin (no wildcard).
2. GIVEN I GET `/health` or `/version`, WHEN responding, THEN 200 with correct JSON (already the case — verify).
3. GIVEN docker-compose up, WHEN containers run, THEN each service has a `healthcheck` stanza; `docker compose ps` shows "healthy".
4. GIVEN an NMR or properties prediction, WHEN response returns, THEN metadata block contains `engine_version`, `table_sha256`, `rdkit_version`, `git_sha`.
5. GIVEN the app loads, WHEN rendered, THEN a muted disclaimer footer reads "Research use only — not validated for regulatory submission."

**Files:** `backend/kendraw_api/main.py` (verify CORS); `backend/kendraw_chem/nmr/nmr_service.py` (reproducibility block); `backend/kendraw_api/routers/compute.py`; `docker/Dockerfile*` + `docker-compose*.yml` (healthchecks); `packages/ui/src/` (footer disclaimer).

**Tests:** unit backend (CORS allowed/disallowed, reproducibility block shape); E2E (disclaimer visible; /health accessible).

**Risks:** schema bump on NmrMetadata — mark new fields optional on TS side to avoid breaking persisted docs.

**Effort:** S/M (3h).

---

### P1-8 — Dark-mode canvas (ESCALATED to M)

**As a** night-working chemist, **I want** the canvas to respect dark theme, **so that** I don't strain my eyes.

**Acceptance Criteria:**
1. GIVEN the user toggles dark mode (or prefers-color-scheme = dark), WHEN canvas re-renders, THEN background is dark and atom/bond strokes are light.
2. GIVEN dark mode, WHEN a stroke is rendered, THEN contrast vs background ≥ 4.5:1 (WCAG AA).
3. GIVEN I export SVG in dark mode, WHEN default, THEN SVG is exported on LIGHT background (publication default). User may opt-in to export-with-theme.
4. GIVEN I toggle theme mid-draw, WHEN toggled, THEN no scene state lost, no flicker.

**Files:** `packages/renderer-canvas/src/renderer.ts` (13 color sites → theme tokens); `packages/ui/src/design-tokens.css`; `packages/ui/src/App.tsx` (theme toggle, prefers-color-scheme listener).

**Tests:** unit (contrast ratios in both themes); E2E (toggle, assert `data-theme` attribute + key computed styles).

**Risks:** Selected/highlight colors must remain legible in both themes. Multi-site change — refactor with care.

**Effort:** M (3h, ESCALATED).

---

### P1-7 — Lasso selection

**As a** user editing a dense scheme, **I want** free-form lasso selection (Alt+drag), **so that** I can grab irregular clusters.

**Acceptance Criteria:**
1. GIVEN Select tool active + Alt held, WHEN I drag, THEN a dashed polygon path follows my cursor.
2. GIVEN I release, WHEN polygon closes, THEN atoms/bonds whose centroid is inside are selected.
3. GIVEN a bond with both endpoints inside, THEN it is selected; with one endpoint → not selected.
4. GIVEN Shift+lasso, THEN union with existing selection. Alt+lasso only (without Shift) → replace selection.
5. GIVEN a tiny lasso (<5px path), THEN treated as click (deselect).

**Files:** `packages/scene/src/selection.ts` (add `pointInPolygon`); `packages/renderer-canvas/src/renderer.ts` (draw polygon); `packages/ui/src/Canvas.tsx` (handler).

**Tests:** unit 2 (pointInPolygon convex/concave/self-intersect; lassoSelect with modifiers); E2E 1 (draw chain, lasso middle 2, assert count).

**Risks:** Performance on 5k atoms — reuse spatial-index pre-filter; jagged polygon — Douglas-Peucker simplification.

**Effort:** S (3h).

---

### P1-5 — OS clipboard multi-MIME copy/paste (paste side)

**As a** user between Kendraw and Word/ChemDraw/PowerPoint, **I want** Ctrl+V to accept external clipboard content (SMILES/MOL/SVG), **so that** I can paste structures from any source.

**Acceptance Criteria:**
1. GIVEN the OS clipboard contains `chemical/x-mdl-molfile`, WHEN I Ctrl+V, THEN the MOL is parsed and atoms/bonds are added to scene.
2. GIVEN the clipboard contains `text/plain` looking like a SMILES, WHEN pasted, THEN SMILES parser is invoked.
3. GIVEN `image/svg+xml` from Kendraw's own export (with KDX metadata), WHEN pasted, THEN KDX is extracted and round-tripped.
4. GIVEN clipboard is denied by permission, WHEN pasted, THEN graceful fallback to `clipboard.readText()` with toast.
5. GIVEN an empty/unsupported clipboard, WHEN pasted, THEN nothing happens (no error).

**Files:** `packages/ui/src/Canvas.tsx` (paste handler); `packages/io/src/index.ts` (sniffer `parseTextClipboard`).

**Tests:** unit (sniffer: V2000, SMILES, JSON-KDX); E2E (mock `navigator.clipboard.read`, assert import).

**Risks:** Safari restrictions — feature-detect and fall back. Coordinates offset — translate to viewport.

**Effort:** M (5h).

---

### P1-4 — IndexedDB autosave + recovery banner

**As a** user drawing a long scheme, **I want** my work auto-saved locally with a recovery prompt on crash, **so that** I don't lose work.

**Acceptance Criteria:**
1. GIVEN changes happen, WHEN 5s idle elapses, THEN state is serialized to IndexedDB.
2. GIVEN I reload after autosave wrote, WHEN the app opens, THEN a "Recover previous session?" banner appears.
3. GIVEN I click Restore, WHEN confirmed, THEN scene matches last autosave (deep equal).
4. GIVEN I click Discard, WHEN confirmed, THEN the snapshot is purged.
5. GIVEN IndexedDB unavailable (private mode), WHEN autosave fires, THEN no crash, toast "autosave unavailable".

**Files:** `packages/persistence/src/db.ts` (schemaVersion field); `packages/persistence/src/auto-save.ts` (already exists); `packages/ui/src/App.tsx` (banner); `packages/ui/src/workspace-store.ts` (hasRecoveredDocs flag).

**Tests:** unit (debounce, quota, schema version check); E2E (draw, reload, assert banner, click Restore, assert scene).

**Risks:** schemaVersion drift — migration table. Multi-tab race — BroadcastChannel/navigator.locks.

**Effort:** M (3h, infra already ~70% done).

---

### P1-1 — Reaction arrow with structured conditions

**As a** synthesis chemist, **I want** reaction arrows carrying structured reagents/solvent/T°C/time labels anchored above/below, **so that** I can draw publication-ready schemes without manually positioning text.

**Acceptance Criteria:**
1. GIVEN the reaction-arrow tool, WHEN I drag A→B, THEN an Arrow is created with empty `conditions.above/below` slots.
2. GIVEN a selected reaction arrow, WHEN I use the inspector, THEN I can edit `reagents` (above) and `solvent / T / time` (below) as rich text.
3. GIVEN arrow with conditions, WHEN arrow is dragged, THEN conditions remain anchored to midpoint (relative offsets preserved).
4. GIVEN .kdx round-trip, THEN conditions survive intact.
5. GIVEN SVG export, THEN conditions appear as `<text>` near midpoint, readable.

**Files:** `packages/scene/src/types.ts` (extend Annotation or add Arrow.conditions); `commands.ts`, `store.ts`; `renderer-canvas/renderer.ts`; `renderer-svg/svg-export.ts`; `packages/ui/src/PropertyPanel.tsx`.

**Tests:** unit 3 (CRUD conditions, anchor math, svg export); E2E 1 (draw arrow, fill condition, export, assert text).

**Risks:** SVG arrow export was historically broken; must fix as prerequisite. Anchor math for rotated arrows (reader-oriented labels).

**Effort:** M (5h).

---

### P1-2 (list idx) — Auto compound numbering

(Renamed in final list; story follows.)

**As a** paper-writing chemist, **I want** compounds on my scheme to auto-number (1, 2, 3…), **so that** I can reference them in text without manual bookkeeping.

**Acceptance Criteria:**
1. GIVEN auto-numbering enabled, WHEN a new disjoint molecule appears, THEN it gets the next unused positive integer (starting at 1).
2. GIVEN 1,2,3 numbered, WHEN I delete 2, THEN 1 and 3 remain (stable gaps) unless "re-pack" action triggered.
3. GIVEN re-pack, THEN numbering is dense 1..N in reading order (L→R, T→B).
4. GIVEN I manually edit "1" to "1a", WHEN added, THEN auto-numbering picks the next integer skipping "1a".
5. GIVEN auto-numbering OFF, WHEN a molecule added, THEN no label generated.
6. GIVEN SVG export, THEN labels present and positioned under each compound bbox.

**Files:** `packages/scene/src/types.ts` (Page.compoundNumbers overlay map); connected-component logic in `flood-select.ts`; `commands.ts`, `store.ts`; renderers; `ToolPalette.tsx`.

**Tests:** unit (nextNumber, repack, stable gaps); E2E (import 3 SMILES, assert labels, delete middle, assert sparse, re-pack, assert dense).

**Risks:** Stable identity under churn — track `nextCompoundNumber` counter in Page; don't recompute on undo.

**Effort:** M (5h).

---

## 5. UX design (from Sally)

Consolidated UX decisions per feature:

- **Shift+W cycles arrow variants** (plain → reaction → retro → equilibrium). No dedicated keys per variant.
- **View menu → Compound numbers** (Off / Below / Above / Manual). Ctrl+Shift+# toggles.
- **Autosave**: silent. Footer shows "Saved Xs ago". Recovery modal at boot only if pending snapshot exists.
- **Clipboard**: Ctrl+C/V reuses; context menu "Copy as…" for explicit MIME.
- **Isotope**: press **I** with atom selected → popover with presets + custom mass.
- **Lasso**: V tool + Alt-drag (explicit modifier). `L` toggles between lasso/rect sub-modes.
- **Dark mode**: gear icon → Theme segmented control (System/Light/Dark). Ctrl+Shift+D toggles.
- **Document style preset**: File → Document style → {ACS, RSC, Wiley/Angewandte, Nature, Custom}.
- **Disclaimer**: muted footer in PDF export + About dialog. One line, non-intrusive.
- **NMR tooltip**: hover peak → δ ± σ + exchangeable marker. Droplet icon for exchangeable.
- **SVG metadata**: invisible; "Include semantic metadata (recommended)" checkbox in export dialog.

Hotkey-gating invariant: all new shortcuts honor `isEditingText()` guard.

---

## 6. Architecture risks & honest effort (from Winston+Amelia)

**Escalations:**
- **P1-8 (dark mode)**: S→M (3h). 13+ hardcoded colors in renderer.ts — needs theme tokens refactor.

**Pre-existing capabilities to reuse (do NOT redo):**
- `Arrow.annotations.above/below` slots — ready for P1-1.
- `Atom.isotope` + atom-display superscript emitter — P1-6 largely done.
- `AutoSaveScheduler` + `KendrawDB` (Dexie) — P1-4 ~70% done.
- Clipboard copy with SVG+MOL multi-MIME — P1-5 copy side done.
- `style-presets.ts` constants module — P1-9 ~80% done.
- CORSMiddleware wired, `/version` endpoint exists — P1-10 needs healthchecks + reproducibility + disclaimer only.
- `selectionRect` rect marquee — P1-7 reuses pattern.
- `metadata.ts` RDF/Dublin-Core injector — P1-12 extends.

**Hard dependencies:**
- P1-12 (SVG title/aria) → P1-1 (arrow SVG export) — arrow conditions can't be accessible without title/aria infrastructure.
- P1-10 ↔ P1-11 (both touch NmrMetadata) — batch into one schema bump.
- P1-8 (theme tokens) → all UI work — land first if possible.

**Cross-package impact (max):**
- P1-1 touches 5 packages (scene, commands, store, renderer-canvas, renderer-svg, io, ui).
- P1-3 touches 5 packages (thin delta each).
- P1-8 touches 3 packages (~200 LoC).

---

## 7. Test strategy (from Murat+Paige)

### Consolidated regression set (must stay green)

**Frontend unit (vitest):**
- All `packages/scene/src/__tests__/*.test.ts`
- `packages/chem/src/__tests__/formula.test.ts`
- `packages/io/src/__tests__/*.test.ts` (smiles, mol, cdxml, kdx, template)
- `packages/renderer-svg/src/__tests__/*.test.ts` (svg-export, metadata)
- `packages/nmr/src/__tests__/*.test.ts` (SpectrumRenderer, multiplet, nmr-scope)
- `packages/persistence/src/__tests__/*.test.ts` (auto-save, db)
- `packages/ui/src/__tests__/*.test.ts` (a11y, hotkey-gating)
- `packages/constraints/src/__tests__/*.test.ts`

**Backend (pytest):**
- `backend/tests/test_additive.py`, `test_api_endpoints.py`, `test_compute.py`, `test_convert.py`, `test_health.py`, `test_nmr_api.py`, `test_nmr_benchmark.py`, `test_nmr_models.py`, `test_nmr_regression.py`, `test_nmr_service.py`, `test_shift_tables.py`

**E2E (Playwright):**
- `e2e/p0-smoke/*.spec.ts` (app-loads, backend-reachable)
- `e2e/p1-critical/*.spec.ts` (draw-molecule, export, import-smiles, keyboard-shortcuts, multiplicity-display, nmr-prediction, nmr-selection-scope, text-annotation, text-annotation-hotkeys, api-regression)
- `e2e/regression/*.spec.ts` (bug-api-v1-prefix-404, bug-caffeine-c8h, bug-cors-econnrefused, bug-merge-conflict-detection)

### New tests per P1 (min)
- Each P1 ships ≥2 unit tests and ≥1 E2E (skip E2E if truly invisible, e.g. backend-only).

### Anti-flake techniques
- Autosave: fake timers, `page.clock`.
- Clipboard: stub `navigator.clipboard.write/read` and `ClipboardItem`.
- Visual: DOM-attribute assertions over screenshots.

---

## 8. Implementation order (for Acte 3)

Ordered to respect hard deps and keep each commit green:

1. **P1-6** Isotope rendering (1h) — Tier 0, pure additive
2. **P1-9** Preset persistence (1h) — Tier 0, pure additive
3. **P1-3** Retrosynthesis arrow (2h) — Tier 0, new type
4. **P1-12** SVG metadata title/desc/aria (2h) — Tier 1, prerequisite for P1-1
5. **P1-11** NMR sigma + D2O (2h) — Tier 1, NMR panel
6. **P1-10** CORS+healthchecks+reproducibility+disclaimer (3h) — Tier 1, shares NmrMetadata bump with P1-11
7. **P1-8** Dark-mode canvas (3h, ESCALATED) — Tier 2, theme tokens
8. **P1-7** Lasso selection (3h) — Tier 2, reuses rect marquee
9. **P1-5** Clipboard paste (5h) — Tier 2, add paste handler
10. **P1-4** Autosave recovery banner (3h) — Tier 2, banner on existing infra
11. **P1-1** Reaction arrow conditions (5h) — Tier 3, builds on P1-12
12. **P1-2** (list idx) Auto compound numbering (5h) — Tier 3

**Session budget:** ~35h realistic. If time runs short, drop P1-4, P1-1, P1-2 in that order — each is independent and valuable enough to stand alone in wave-2.

**Gate rule:** after each P1, run `pnpm lint && pnpm typecheck && pnpm test && cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy … && uv run pytest`. Pre-commit hook runs these at commit time anyway — no bypass.

---

## 9. Deferred (explicit, with rationale)

| Feature | Why deferred |
|---|---|
| .cdx/.cdxml import-export | XL, Park flagged "wait for next gen" |
| SSO SAML/OIDC + RBAC | XL, academia-first policy |
| Markush / R-groups | XL, pharma pivot |
| HELM peptides | XL |
| 2D NMR (COSY/HSQC/HMBC) | XL, new prediction engine |
| IR / MS module | XL, new backend subsystem |
| IUPAC Structure-to-Name | XL, STOUT integration + licensing |
| Audit trail 21 CFR Part 11 | L, pharma-only |
| Curly mechanism arrows (Bézier) | L, ≥3 experts but doesn't fit session |
| Structure Clean-Up / Tidy | L, single expert |
| Composite PDF fiche spectro | M, single expert, requires layout engine |
| Batch NMR + 3D + QED + PAINS | S/M each but single expert (Chen) — wave-2 |
| Functional-group shortcuts Boc/Cbz | M, single expert — good wave-2 candidate |
| Onboarding "First reaction 60s" | S, high-impact but needs dedicated UX cycle |
