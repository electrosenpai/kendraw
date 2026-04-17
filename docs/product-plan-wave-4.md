# Wave-4 Product Plan — Pharma Wave

> Generated 2026-04-17 as the Act 3 deliverable of the autonomous
> wave-4 BMAD party-mode session. Four-voice contribution: **John**
> (PM) sets personas, P-tier matrix, and scope; **Mary** (BA)
> decomposes the 6 P1 stories into BMAD user stories with full
> Gherkin acceptance criteria, dependency graph, and hidden
> assumptions log; **Sally** (UX) designs the interaction surface
> and keyboard shortcuts; **Paige** (Tech Writer) drafts release
> notes, README deltas, and beta disclaimer copy.
>
> Source demand-side doc: `docs/pharma-deepdive-wave-4.md`.
> Source supply-side doc: `docs/benchmark-kendraw-vs-chemdraw-v0.2.0.md`.
> V6 review anchor: `docs/nmr-scientific-review-v6.md`.

---

## Table of contents

1. [Product Manager perspective (John)](#1-product-manager-perspective-john)
2. [Business Analyst perspective (Mary)](#2-business-analyst-perspective-mary)
3. [UX Designer perspective (Sally)](#3-ux-designer-perspective-sally)
4. [Technical Writer perspective (Paige)](#4-technical-writer-perspective-paige)

---

## 1. Product Manager perspective (John)

📋 **John (Product Manager):**

Wave-3 closed clean — 9 commits, 17 features stacked across wave-2 + wave-3, and the keyboard-parity number (89%) is the kind of engineering-led win that plays well on Hacker News and plays *less* well in a Geneva NMR lab. The V6 review read the signal correctly: Al-Rashid dropped −0.2 not because anything regressed but because 100% of development flowed away from the axis she is scoring (`docs/pharma-deepdive-wave-4.md` §1 "Why my score went down"). Wave-4 corrects course. The pharma deep-dive consolidated five specialists onto **six T1 items** (`pharma-deepdive-wave-4.md` §6.1 consensus table, §6.3 backlog) and that is our P1. The rest of this section makes it actionable.

### 1.1 Personas

Three personas, each tied to a real panelist voice so engineering cannot rationalize scope cuts away from their day job.

| # | Persona | Role & workflow | Blocker today | What wave-4 must give them |
|---|---|---|---|---|
| **A** | **Layla** (Al-Rashid analogue, `pharma-deepdive-wave-4.md` §1) | Senior NMR scientist, mid-cap pharma R&D, Geneva. Draws intermediate → predicts ¹H/¹³C → compares against overnight Bruker acquisition → reports multiplet integrations and J-couplings in a structure-elucidation memo. | Cannot overlay her ~3000 archived JCAMP-DX spectra onto a prediction, so Kendraw "sits next to the workflow, not inside it." DEPT renders colour swatches but not up/down phase. Multiplets collapse to one symbol instead of the 8-line ddd she sees on her 600 MHz. No numeric integrals printed. | At least one NMR feature (her explicit veto line: "a third wave of zero NMR work and I will be at 6.0"). P1-01, P1-02, P1-03 all serve her directly. Target: 6.8 → 7.5+. |
| **B** | **Rajesh** (Kumar analogue, `pharma-deepdive-wave-4.md` §3) | Head of QC chemistry, Sandoz Holzkirchen. GMP batch release, impurity qualification under ICH Q3A/Q3B. Signs off structures, locks them, and must answer the auditor's "who changed what, when, and why" question on every record. | No audit trail of any kind — undo is in-memory only, nothing persists. `Group.locked` exists in the type system (`pharma-deepdive-wave-4.md` §Appendix: "The hardest part is already done") but is never wired to a UI. No e-sig ceremony, no reason-for-change modal. Result: 5.5 / 10, cannot pilot in a regulated group. | The GxP foundation: P1-04 audit trail + P1-05 lock/e-sig/reason modal. Lifts him 5.5 → 7.0 *without* CoA work, enough to start an internal pilot. |
| **C** | **James** (Reid analogue, `pharma-deepdive-wave-4.md` §5) | Ex-FDA / CDER Module 3 reviewer, now regulatory consultant for small/mid pharma. Drafts eCTD Module 3.2.S sections; structures flow downstream to publishing vendors who live in ChemDraw. | CDXML import exists, CDXML *export* doesn't. Every Kendraw structure has to be redrawn by the CRO before submission — his literal words (§Appendix): *"CDXML export, even an 80% MVP, ends the deal-breaker."* | P1-06 CDXML export MVP (atoms + bonds + stereo wedges). Lifts him 5.8 → 7.5, converts Kendraw from "drawing tool" to "submission-adjacent tool." |

### 1.2 P-tier matrix — the wave-4 P1 commitment

Restated from `pharma-deepdive-wave-4.md` §6.3. Six stories, six commits, 7-check pre-commit hook on each (`/home/debian/kendraw/CLAUDE.md`). Score impact is the panel's own estimate.

| Story | Title | Persona | Acceptance criteria (3 bullets) | Done-when measurable test | Effort | Score impact |
|---|---|---|---|---|:---:|---|
| **P1-01** | DEPT-135 up/down phasing in NMR spectrum renderer | Layla | (a) CH and CH₃ peaks render in +y direction; (b) CH₂ peaks render in −y direction; (c) quaternary carbons are suppressed from the DEPT-135 view. | E2E test loads benzamide fixture, toggles to DEPT-135, asserts every CH₂ peak has `y < baseline` and every quaternary C is absent from the rendered path. | S | Al-Rashid +0.3, Santos +0.2 |
| **P1-02** | Numeric integrals + multiplet line list + J-tooltips | Layla | (a) each multiplet region shows a badge with proton count (e.g. "3.0 H"); (b) ddd/ddq expand to the full 8-line Pascal pattern already computed in the `nmr` package; (c) hovering a line tooltips its J (Hz) value. | Unit test: ddd region renders exactly 8 line-geometries; integration badges sum to the molecular H count ±0. | M | Al-Rashid +0.4 |
| **P1-03** | JCAMP-DX 1D import + spectrum overlay (read-only) | Layla + Santos | (a) `.jdx` / `.dx` file drop imports; (b) parsed spectrum overlays Kendraw prediction with a legend swatch; (c) rejects non-1D / non-XYDATA blocks with a clear error. | E2E test imports a fixture JCAMP-DX file, asserts overlay path appears in the SVG, asserts prediction path is still visible. | M | Al-Rashid +0.5, Santos +0.5 |
| **P1-04** | Append-only audit trail (JSON-lines in IndexedDB + export) | Rajesh | (a) every Scene mutation appends one row `{ts, user, action, recordId, before, after}`; (b) log persists across reload; (c) "Export audit log" produces a JSON-lines file. | Unit test: 10 atom edits produce exactly 10 audit rows, export round-trip equals in-memory buffer. Footer reads "Beta: foundational audit trail, full 21 CFR Part 11 compliance pending vendor audit." | M | Kumar +0.6, Santos +0.3, Reid +0.4 |
| **P1-05** | Record lock + e-sig modal + reason-for-change modal (MVP) | Rajesh | (a) "Lock" toolbar button flips `Group.locked` and shows padlock badge; (b) edit attempts on locked record open an e-sig modal (user + timestamp + reason); (c) the reason-string is captured in the audit-trail row from P1-04. | E2E test: lock a group, attempt to delete an atom, assert modal appears and on confirm the audit row contains the reason string. | M | Kumar +0.5, Reid +0.3 |
| **P1-06** | CDXML export — atoms + bonds + stereo wedges MVP | James | (a) exports every atom + bond + wedge/hash in the scene as valid CDXML 1.6; (b) round-trip (export → re-import) preserves atom count, bond count, wedge direction; (c) exporter emits a footer comment "Beta: Wave-4 MVP — text annotations, brackets, non-rectangular stereo objects deferred to wave-5" (`pharma-deepdive-wave-4.md` §6.4 mitigation). | CI test exports → re-imports 10 molecules, asserts atom/bond/wedge equality. ChemDraw 22 round-trip passes on at least 7/10 (manual spot-check logged in PR). | L | Reid +0.7, Al-Khatib +0.3 |

**Budget total** = 1×S + 4×M + 1×L ≈ **12–15 engineering-days for one developer** (`benchmark-kendraw-vs-chemdraw-v0.2.0.md` §5). Sequencing follows §5's engineering rationale: P1-01 → P1-02 (same renderer file, share test surface), P1-04 → P1-05 (lock depends on audit log), P1-03 in parallel, P1-06 last and largest.

### 1.3 P2 stretch — 3 picks if P1 finishes early

From `benchmark-kendraw-vs-chemdraw-v0.2.0.md` §4.2. Rule of selection: cheap + high panelist leverage + already-adjacent to shipping P1 work.

1. **P2-07 — InChIKey copy-to-clipboard button in property panel** (S, Al-Khatib + Reid). Al-Khatib's literal words (§Appendix): *"InChIKey copy-to-clipboard is a 1-line wire-up and would lift my workflow tomorrow."* Smallest possible persona win; must-pick.
2. **P2-13 — Structured metadata autoblock (CAS / USAN / IUPAC / InChI / InChIKey)** (M, Al-Khatib + Reid). Directly feeds James's Module 3.2.S.1.1 workflow and lands naturally on top of P2-07's InChIKey wire-up — same property-panel surface, same test file.
3. **P2-08 — Auto R/S + E/Z descriptors in property panel and atom labels** (M, Al-Khatib). Stereo wedges are already touched in P1-06; descriptors are the natural semantic layer and serve the med-chem persona we under-weighted in the P1 set.

Explicitly **not** picking P2-09 (HOSE-code DB, L) or P2-12 (PDF/A-1b, L) as stretch — both are L-effort, neither fits inside a stretch budget if P1-06 ran over.

### 1.4 Out-of-scope for wave-4 (and why)

1. **SAR grid XL** (gap #21, Al-Khatib top ask) — XL effort, stretches the wave by 50%+; wave-5 candidate.
2. **Bruker Topspin folder import XL** (gap #41, Santos ask) — requires a Bruker raw-data parser (`1r`/`1i`/`acqus`/`procs`); external-dependency-heavy, P4 explicitly.
3. **BioDraw (peptide / glycan / nucleotide)** (gaps #36–#40) — a new product module, not a wave. P4.
4. **Full 21 CFR Part 11 certification** (gap #44) — *external* (6-month vendor audit, not engineering). Kumar's own framing (`pharma-deepdive-wave-4.md` §3 closing note): "I do not expect Kendraw to be 21 CFR Part 11 *certified* this wave." We ship the hooks, not the cert.
5. **2D NMR (COSY / HSQC / HMBC) prediction + renderer** (gap #26) — Al-Rashid herself tags this as a wave-5 conversation (§1 top-5: *"The path to 9.0 still requires 2D NMR — that is wave-5 conversation, not wave-4"*).

### 1.5 V0.4 release-note headline (~80 words)

> **Wave-4 is the pharma wave.** Six features ship across NMR spectroscopy (DEPT-135 phasing, numeric integrals with resolved multiplet lines, JCAMP-DX overlay), regulated-environment audit infrastructure (append-only audit trail, record lock, e-sig and reason-for-change), and ChemDraw round-trip interoperability (CDXML export MVP). Each is an honest MVP — the minimum viable foundation in its category, with the path to full compliance documented. We are not certifying Kendraw under 21 CFR Part 11 this wave. We are giving regulated labs the architectural hooks they need to start a pilot.

**Single non-negotiable for Architecture / Developer / TEA downstream:** P1-01 ships first because it is the smallest story in the backlog and Al-Rashid's veto line needs to be answered in commit #1, not commit #6.

---

## 2. Business Analyst perspective (Mary)

📊 **Mary (Business Analyst):**

John framed the six. I decompose each into BMAD story form with Gherkin acceptance criteria tight enough to paste straight into test names. Where possible I anchor dependencies to file paths already in the structural gap audit (`benchmark-kendraw-vs-chemdraw-v0.2.0.md` §3) so Winston and Amelia don't have to re-discover them.

### 2.1 BMAD user stories — full decomposition

#### Story P1-01: DEPT-135 up/down phasing

**As a** pharma R&D NMR scientist (Layla)
**I want** the ¹³C spectrum panel to render DEPT-135 with the standard up/down phase convention
**So that** I can read the CH / CH₂ / CH₃ / quaternary pattern visually in under 5 seconds, the way I do on my spectrometer

**Acceptance criteria (Gherkin)**
- **Given** a ¹³C prediction is loaded **When** I click the `DEPT-135` mode toggle in `NmrPanel.tsx` **Then** CH and CH₃ peaks render with positive Y amplitude and CH₂ peaks render with negative Y amplitude.
- **Given** DEPT-135 mode is active **When** a carbon is classified as quaternary (no attached H) **Then** it is absent from the rendered path entirely (not rendered at 0 amplitude — absent).
- **Given** DEPT-135 mode is active **When** I toggle back to `¹³C decoupled` **Then** all carbons reappear above the baseline with their original amplitudes.
- **Given** the spectrum has 12 carbons (3 CH₂, 4 CH, 2 CH₃, 3 quaternary) **When** I switch to DEPT-135 **Then** exactly 9 peak paths render (3 CH₂ inverted, 4 CH up, 2 CH₃ up, 3 quaternary absent).

**Out of scope**
- DEPT-90 (CH-only) — wave-4 ships DEPT-135 only. DEPT-90 is a one-line follow-up; explicitly deferred.
- Editable phase angle — DEPT-135 is hard-coded to ±1.0 amplitude scale.

**Dependencies**
- Code: `packages/nmr/src/SpectrumRenderer.ts` (the CH/CH₂/CH₃/C classification already exists as colour codes per `benchmark-kendraw-vs-chemdraw-v0.2.0.md` §3.4 — we extend the render branch).
- UI: `packages/nmr/src/NmrPanel.tsx` (toggle button already exists for 1H / 13C / DEPT — we make DEPT activate the phased render path).
- No backend change.

**Test cases**
- **Unit**: new test in `packages/nmr/src/__tests__/spectrum-renderer.test.ts` — stub a prediction with 3 CH₂ carbons and assert the rendered path Y-coordinates are all negative in DEPT-135 mode.
- **E2E**: extend `e2e/p2-features/nmr-dept.spec.ts` (or create it) — load caffeine fixture, toggle DEPT-135, snapshot assert the SVG has ≥1 `path[d*="L"]` below y=250 (baseline).
- **Regression**: the existing 64 NMR unit tests must still pass (no change to prediction shifts, only to render).

**Effort estimate**: 1–2 engineer-days.

---

#### Story P1-02: Numeric integrals + multiplet line list + J tooltips

**As a** pharma R&D NMR scientist (Layla)
**I want** each multiplet to show a numeric integration badge and its full resolved line list with J-coupling tooltips
**So that** I can read "3.0 H triplet J=7.2 Hz" directly from the Kendraw spectrum without cross-referencing a separate table

**Acceptance criteria (Gherkin)**
- **Given** a prediction with an ethyl CH₃ (3 protons, triplet, J ≈ 7.2 Hz) **When** I view the ¹H spectrum **Then** a badge "3.0 H" renders under the triplet centroid and 3 discrete line-geometries render at the triplet positions (Pascal intensities 1:2:1).
- **Given** a ddd region exists (e.g. aromatic H-3 of benzaldehyde) **When** the spectrum renders **Then** exactly 8 line-geometries are drawn at the correct frequencies (J₁, J₂, J₃ combinations).
- **Given** I hover over any line **When** the tooltip opens **Then** it shows ppm, multiplicity role ("dd", "ddd", "t"), and the J value in Hz with 2 decimal places.
- **Given** the molecule has N total protons **When** I sum all integration badges **Then** the sum equals N ±0 (exact, not approximate).

**Out of scope**
- Editable integrals — integrations are computed from the prediction, read-only in wave-4.
- Second-order effects / higher-order multiplets (AB / ABX) — wave-5.

**Dependencies**
- Code: `packages/nmr/src/multiplet.ts` (Pascal convolution engine already computes dd/ddd line lists — we consume its output instead of the old symbol).
- Code: `packages/nmr/src/SpectrumRenderer.ts` (extend to render line-list geometry when available; fall back to symbol for unconvolved cases).
- UI: tooltip surface — reuse the existing atom-tooltip pattern from `NmrPanel.tsx`.

**Test cases**
- **Unit**: add cases to `packages/nmr/src/__tests__/multiplet.test.ts` checking that `expandMultiplet('ddd', [12, 8, 2])` returns exactly 8 lines with correct relative intensities.
- **Unit**: add a renderer test — given a prediction with integrations [3, 2, 5, 1] for total 11 H, assert 4 badges render with text "3.0 H", "2.0 H", "5.0 H", "1.0 H".
- **E2E**: `e2e/p2-features/nmr-integrals.spec.ts` — load ethyl acetate, assert 3 badges on the spectrum and the sum of their text is "6.0 H" (2+3+3… adjusted to the actual EtOAc).
- **Regression**: NMR 64 tests unchanged.

**Effort estimate**: 2–3 engineer-days.

---

#### Story P1-03: JCAMP-DX 1D import + spectrum overlay

**As a** pharma R&D NMR scientist (Layla) or analytical chemist (Santos)
**I want** to drop a `.jdx` / `.dx` file onto the NMR panel and have the measured spectrum overlay on the prediction
**So that** I can visually compare predicted vs measured chemical shifts without leaving the browser

**Acceptance criteria (Gherkin)**
- **Given** I have a valid JCAMP-DX 1D file (XYDATA format, ¹H or ¹³C) **When** I drop it on the NMR panel **Then** the parsed spectrum path renders on top of the prediction with a distinct color (red, say) and a legend swatch labelled with the file name.
- **Given** I drop a JCAMP-DX 2D file (NTUPLES block, NMR SPECTRUM) **When** the parser inspects the first data-block **Then** a toast error appears: "JCAMP-DX 2D not supported in wave-4 — 1D only".
- **Given** a measured spectrum is overlaid **When** I click "Remove overlay" in the legend **Then** only the prediction remains.
- **Given** the JCAMP-DX file's nucleus (¹H vs ¹³C) does not match the current spectrum mode **When** I drop it **Then** a toast warning appears: "Nucleus mismatch: file is ¹³C, spectrum is ¹H. Switch mode or drop again."

**Out of scope**
- Bruker raw folder import (P4).
- Editing the overlay (peak picking on the measured spectrum) — wave-5.
- Integration of the overlay — predictions integrate; overlays are display-only.

**Dependencies**
- Code: **greenfield** parser at `packages/io/src/jcamp-dx.ts` (per `benchmark-kendraw-vs-chemdraw-v0.2.0.md` §3.6 — no JCAMP-DX symbol exists in the codebase).
- Code: extend `packages/nmr/src/SpectrumRenderer.ts` to accept a second path (the overlay).
- UI: file-drop handler — reuse the one on the main Canvas for MOL/CDXML.

**Test cases**
- **Unit**: `packages/io/src/__tests__/jcamp-dx.test.ts` with fixture files covering (a) valid ¹H XYDATA, (b) valid ¹³C XYDATA, (c) invalid malformed header, (d) 2D NTUPLES rejection.
- **E2E**: `e2e/p2-features/nmr-jcamp-overlay.spec.ts` — drop fixture, assert an SVG overlay path appears with the correct stroke color and the prediction path is still visible.
- **Regression**: existing IO 74 tests + NMR 64 tests all pass.

**Effort estimate**: 3–4 engineer-days.

---

#### Story P1-04: Append-only audit trail

**As a** QC / GMP chemist (Rajesh)
**I want** every scene mutation to append a row to a persistent append-only log and let me export the log as JSON-lines
**So that** I can answer my auditor's "who changed what, when, and why" question for every record

**Acceptance criteria (Gherkin)**
- **Given** a user session with `user = "rajesh.kumar"` **When** I add an atom, change an element, delete a bond **Then** three rows append in order to the `audit_log` IndexedDB object store, each with shape `{ts, user, action, recordId, before, after}`.
- **Given** I close and reopen the browser tab **When** I open the audit-log viewer **Then** all previously recorded rows are still present (persistence).
- **Given** I click "Export audit log" **When** the file writes **Then** it is valid JSON-lines (one JSON object per line, terminating `\n`, no commas between objects).
- **Given** the audit log has 100 rows **When** I delete a row via browser dev-tools (tamper simulation) **Then** the UI shows a red "Audit log integrity broken — contact admin" badge. (Hash-chained variant: P3 wave-5; wave-4 MVP only detects row-count regression against a monotonic counter.)
- **Given** a footer badge shows "Audit trail: 237 entries" **When** I hover it **Then** a tooltip reads "Beta — foundational audit trail, full 21 CFR Part 11 compliance pending vendor audit."

**Out of scope**
- Cryptographic hash-chain integrity (P3 wave-5).
- Cross-device sync of the audit log (P4, conflicts with privacy-first stance).
- Audit-log querying / filtering UI beyond the raw viewer (wave-5).

**Dependencies**
- Code: **greenfield** at `packages/persistence/src/audit-log.ts` (per `benchmark-kendraw-vs-chemdraw-v0.2.0.md` §3.3 — no audit-trail symbol exists).
- Hook: every scene-store mutation must call `auditLog.append(...)`. Winston will want to consider the Immer middleware pattern to avoid per-command wiring.
- UI: side-panel viewer (reuse `packages/ui/src/components/SidePanel.tsx` pattern).

**Test cases**
- **Unit**: `packages/persistence/src/__tests__/audit-log.test.ts` — append 10 rows, close/reopen simulated IndexedDB, assert 10 rows read back in order.
- **Unit**: round-trip test — append 10 rows, export JSONL, parse export, assert object equality.
- **E2E**: `e2e/p2-features/audit-trail.spec.ts` — perform 5 canvas mutations, open the audit panel, assert 5 rows visible.
- **Regression**: existing 10 persistence tests + 242 scene tests must all pass with the new middleware wired in.

**Effort estimate**: 3 engineer-days.

---

#### Story P1-05: Record lock + e-sig modal + reason-for-change modal (MVP)

**As a** QC / GMP chemist (Rajesh)
**I want** to flip a structure group into a locked state (visible padlock badge), and see an e-sig + reason modal every time I attempt to edit a locked record
**So that** I can freeze a structure at sign-off and capture the auditor's reason-for-change on any subsequent edit

**Acceptance criteria (Gherkin)**
- **Given** a group of atoms is selected **When** I click the Lock button in the toolbar (or press `Ctrl+L` — see Sally's shortcut map) **Then** `Group.locked` flips to `true` and a padlock badge renders on the group.
- **Given** a group is locked **When** I attempt any edit command (add atom, delete bond, move atom) on an atom in the group **Then** an e-sig modal opens showing the current user, the current timestamp, and a required reason textarea.
- **Given** the e-sig modal is open **When** I fill the reason and click "Sign & Apply" **Then** the edit goes through AND the audit-trail row for that edit contains the reason string.
- **Given** the e-sig modal is open **When** I click "Cancel" **Then** the edit is rolled back and no audit row is written.
- **Given** a locked group is displayed **When** hovering over the padlock badge **Then** tooltip reads "Locked by {user} at {ts}. Click to unlock (requires e-sig)."

**Out of scope**
- Password / biometric verification — wave-4 MVP uses local-only user identity (set once at first launch). Explicit disclaimer required.
- Hardware security key / FIDO2 — wave-5+.
- Multi-user workflow (separate signer and creator) — wave-5.

**Dependencies**
- Code: `packages/scene/src/types.ts:110` — `Group.locked` field already exists (per `benchmark-kendraw-vs-chemdraw-v0.2.0.md` §3.2). Wire the UI.
- Code: **hard dependency** on P1-04 audit trail for reason-string capture.
- UI: `packages/ui/src/components/ESigModal.tsx` (greenfield). `packages/ui/src/components/LockButton.tsx` (greenfield, mirrors the wave-3 `ShapeButton.tsx` pattern).
- Renderer: `packages/renderer-canvas/src/` — draw the padlock glyph at the group centroid when `locked === true`.

**Test cases**
- **Unit**: `packages/ui/src/__tests__/e-sig-modal.test.tsx` — submit without reason, assert validation error; submit with reason, assert callback fires with `{user, ts, reason}`.
- **E2E**: `e2e/p2-features/lock-record.spec.ts` — lock a benzene, attempt to delete an atom, assert modal appears, fill reason "typo fix", assert the atom is gone and the last audit row's `reason` field equals "typo fix".
- **Regression**: the 242 scene tests must not break — locked-group edits still succeed *after* the modal confirm.

**Effort estimate**: 3 engineer-days.

---

#### Story P1-06: CDXML export MVP

**As a** regulatory writer (James) or med-chem (Al-Khatib)
**I want** to export any Kendraw scene as valid CDXML that round-trips back into Kendraw (and opens in ChemDraw 22)
**So that** I can collaborate with CROs and publishing vendors who live in ChemDraw without redrawing every structure

**Acceptance criteria (Gherkin)**
- **Given** a scene with 10 atoms, 11 bonds, 2 wedge bonds, 1 hashed wedge **When** I click "Export → CDXML" **Then** a `.cdxml` file downloads that validates against ChemDraw CDXML schema 1.6.
- **Given** I re-import the exported CDXML file **When** the scene loads **Then** atom count, bond count, and wedge directions are identical to the original (tolerance: atom coordinates ±0.5 Å per dimension after CDXML coordinate normalization).
- **Given** the scene contains text annotations, reaction arrows, shapes, or curly arrows **When** I export **Then** those elements are omitted with a one-time toast: "CDXML export is wave-4 MVP — text annotations, arrows, and shapes are not yet written."
- **Given** I open the exported file in ChemDraw 22 (manual QA step) **When** the file loads **Then** the structure is visually correct in 7+ out of 10 test molecules (spot-check logged in the PR).
- **Given** the exported file **When** I open it in a text editor **Then** the first comment line reads: "Kendraw CDXML MVP (wave-4). Text annotations, brackets, non-rectangular stereo objects: deferred to wave-5."

**Out of scope**
- Binary `.cdx` export (P4, undocumented format).
- Text annotation export, reaction-arrow export, curly-arrow export, shape export — all wave-5.
- Polymer brackets, SNFG symbols, R-groups, biopolymer residues — all wave-5+.

**Dependencies**
- Code: **greenfield** at `packages/io/src/cdxml-writer.ts` (reader exists at `packages/io/src/cdxml-parser.ts` per `benchmark-kendraw-vs-chemdraw-v0.2.0.md` §3.1 — study its schema and mirror the inverse).
- UI: extend `packages/ui/src/components/ExportMenu.tsx` with a "CDXML (Beta MVP)" row.

**Test cases**
- **Unit**: `packages/io/src/__tests__/cdxml-writer.test.ts` — write 10 reference molecules to CDXML, validate against XML schema, parse the output back through `cdxml-parser.ts`, assert atom/bond equality.
- **Unit**: stereo-preservation tests — a molecule with a wedge bond exports with `<b Display="WedgeBegin">` and round-trips preserving wedge direction.
- **E2E**: `e2e/p2-features/cdxml-export.spec.ts` — draw a simple structure, export CDXML, verify download, re-import, snapshot-compare.
- **Regression**: 74 IO tests must pass; CDXML *import* coverage must not regress.

**Effort estimate**: 5 engineer-days.

---

### 2.2 Dependency graph

```
P1-01 (DEPT phase)
      ↓ shares test surface
P1-02 (integrals + line list)

P1-03 (JCAMP overlay) — independent

P1-04 (audit trail)
      ↓ hard dependency
P1-05 (lock + e-sig + reason) — must ship AFTER P1-04

P1-06 (CDXML export) — independent, largest
```

Reading: P1-01 and P1-02 touch `SpectrumRenderer.ts` together so they share a PR test surface — ship them as consecutive commits. P1-04 is the audit-log foundation and must ship before P1-05 can capture reason strings. P1-03 and P1-06 are independent and can interleave into whatever slot opens. The critical path is `P1-04 → P1-05` (~6 eng-days together) — if the L-effort P1-06 runs over, it's the lock/e-sig pair that becomes stretch, not the NMR pair (which is the whole point of the wave per John §1.2).

### 2.3 Hidden assumptions / risks log

| # | Assumption | Risk if wrong | Mitigation |
|---|---|---|---|
| A1 | CDXML schema 1.6 is the right round-trip target | ChemDraw 22 may default to 1.7+; schema drift breaks round-trip | Write against 1.6 (documented, stable), test against ChemDraw 22 manually in the PR QA step |
| A2 | IndexedDB quota is sufficient for ~10k audit rows (typical 100-day workflow) | Audit log fills quota, writes silently fail | Emit a 5-level-tier warning at 80% quota; ship a "Rotate audit log" action as wave-4 stretch if time permits |
| A3 | JCAMP-DX 1D XYDATA is the only format flavor that matters | Real-world files use NTUPLES or PEAK TABLES, not XYDATA | §2.1 P1-03 AC covers the 2D rejection toast; add the same for PEAK TABLE with "wave-5" deferral message |
| A4 | Pascal convolution in `multiplet.ts` already handles ddd correctly | Some order-higher multiplets fall back to 'm' — line-list render then hides behind the symbol | Acceptance criteria explicitly require the 8-line ddd; unit test guards the regression |
| A5 | DEPT classification in `SpectrumRenderer.ts` is correct for all carbons | Edge case: quaternary *olefinic* carbons may misclassify | Spot-check with 5-molecule fixture including cyclohexenone; add regression test |
| A6 | Local-only user identity (no auth) is acceptable for GMP MVP | Some QC teams may demand directory-backed identity | Beta disclaimer (Paige §4.4) explicitly names local-only user as the limitation |
| A7 | No existing documents contain `locked: true` groups | Migrations / legacy docs could have `locked: true` with no audit history | P1-05 tolerates `locked` with no history rows (shows "locked pre-audit-trail" tooltip) |
| A8 | CDXML export's "skip text/arrows/shapes" is acceptable to James | James may demand arrows for mechanism schemes | Release notes + in-app toast spell this out; wave-5 commit scheduled |
| A9 | Stereo wedges map 1:1 onto CDXML `Display="WedgeBegin"` | Hashed wedges are actually a separate enum | Test both wedge and hashed-wedge in round-trip suite |
| A10 | The scene store's Immer middleware allows a transparent hook for audit-trail append | Immer patches may not expose semantic "action names" cleanly | Winston's architecture section should confirm this; fallback: per-command wrapper |

### 2.4 Beta disclaimer language

Three paragraphs, copy-paste ready. Paige repeats and polishes these in §4.4.

**Audit trail disclaimer (in-app footer + README):**
> *Audit trail — Beta.* Kendraw records every scene mutation as an append-only JSON-lines log in local browser storage. This is a foundational audit trail: it captures who/what/when/why with sufficient detail for internal QC pilots, but does not provide cryptographic chain-of-custody integrity, directory-backed user identity, or cross-device synchronisation. Full 21 CFR Part 11 compliance pending vendor audit. Export the log regularly for off-device archival.

**E-sig MVP disclaimer (e-sig modal subtitle + README):**
> *Electronic signature — Beta MVP.* The signature captured here binds the local-workstation user identity, a timestamp, and your stated reason-for-change to the edit. This provides the architectural hook for a regulated workflow (§21 CFR Part 11 §11.100–§11.300) but is not certified. Institutional deployments must pair this with external identity verification and chain-of-custody infrastructure. Full compliance pending vendor audit.

**CDXML export disclaimer (export toast + README + in-file comment):**
> *CDXML export — Wave-4 MVP.* This exporter writes atoms, bonds, and wedge / hashed-wedge stereo descriptors to CDXML schema 1.6. Text annotations, reaction arrows, curly arrows, shapes, R-groups, and polymer brackets are not written in this release — they will be added in wave-5. Round-trip with Kendraw is test-guaranteed; round-trip with ChemDraw 22 is spot-checked (7+/10 molecules). Report round-trip failures on GitHub.

Handing to Sally.

---

## 3. UX Designer perspective (Sally)

🎨 **Sally (UX Designer):**

Six stories, three very different interaction modes: invisible renderer changes (P1-01, P1-02), passive-but-persistent infra (P1-03 overlay, P1-04 audit trail), active ceremony (P1-05 lock / e-sig), and a button in a menu (P1-06). I designed each around the rule Kendraw already lives by: power users never leave the keyboard, newcomers always see a visible affordance. Wave-3 cemented the "`Ctrl+<letter>` for toggles with status-bar indicator" idiom (`∠snap/free`, `⋯grid/off`) and I extend that here without stepping on any of the 31 existing shortcuts (`docs/keyboard-shortcuts-compliance.md`).

### 3.1 Per-story interaction sketch

#### P1-01 — DEPT-135 phase

- **Trigger**: the existing NMR panel mode selector. Add a `DEPT-135` option alongside `¹H`, `¹³C decoupled`, `DEPT (swatches)`.
- **Affordance**: the mode selector is already discoverable. No new button.
- **Keyboard shortcut**: `D` while the NMR panel is focused cycles `¹H → ¹³C → DEPT-135 → ¹H`. No global collision (lowercase `d` is dashed-bond only when drawing).
- **Visible state**: the mode selector shows the active mode; the spectrum renders with the phase convention. No status-bar noise — this is panel-local.
- **Failure mode**: if the prediction lacks DEPT classification (pre-wave-2 molecule), fall back to DEPT swatches view with a one-line note: "DEPT-135 phase requires re-prediction."

```
 ┌─────────────── NMR Panel ───────────────┐
 │ Nucleus:  [ ¹H ] [ ¹³C ] [ DEPT-135 ]   │
 │                                          │
 │    ▲        ▲          ▲                 │
 │ ───┼────────┼──────────┼──────── (zero) │
 │                ▼    ▼                    │
 │              CH₂   CH₂                   │
 │                                          │
 │   (CH, CH₃ up  — CH₂ down — C absent)   │
 └──────────────────────────────────────────┘
```

#### P1-02 — Integrals + multiplet line list

- **Trigger**: automatic — always on when the NMR panel is visible.
- **Affordance**: badges sit under each multiplet region. Lines replace the peak symbol when the convolution is available.
- **Keyboard shortcut**: `Shift+I` toggles integration badges on/off (handy for publication figures that prefer a cleaner look). No collision (`Shift+I` unused).
- **Visible state**: badges read "3.0 H", "1.0 H", etc. Hover a line: tooltip "7.22 ppm, t, J = 7.2 Hz".
- **Failure mode**: if multiplicity is `m` and convolution returns no line list, render the old symbol + the integration badge — no regression, just no added detail.

#### P1-03 — JCAMP-DX overlay

- **Trigger**: drag-and-drop a `.jdx` or `.dx` file onto the NMR panel. Also accessible via File menu → Import Spectrum.
- **Affordance**: a legend chip appears in the top-right corner of the spectrum showing the file name and a close `×`.
- **Keyboard shortcut**: no dedicated shortcut — file drop is the natural affordance. (`Ctrl+Shift+O` is already "Import" broadly; the import dialog gets a new "Spectrum (JCAMP-DX)" option.)
- **Visible state**: overlay path in red, prediction path in blue, legend swatch matches.
- **Failure mode**: toast errors — "JCAMP-DX 2D not supported", "Nucleus mismatch", "Malformed header".

#### P1-04 — Audit trail

- **Trigger**: every scene mutation (automatic, invisible).
- **Affordance**: footer badge in the status bar: `📜 237 entries`. Clicking opens the audit-log side panel.
- **Keyboard shortcut**: `Ctrl+Shift+A` opens the audit-log viewer. No collision (`Ctrl+A` is select-all, `Shift+A` is already assigned only in atom context).
- **Visible state**: footer badge always visible in regulated-mode; optional in hobby mode (a setting, wave-5). Side panel lists rows with timestamp, user, action, recordId.
- **Failure mode**: footer badge turns red "⚠️ log integrity broken" if row count regresses (tamper signal). Integrity-broken state is sticky — requires a "Acknowledge" action to clear.

```
 ┌─ Status bar ──────────────────────────────────┐
 │ ∠snap/free  ⋯grid/off   📜 237 entries      │
 └────────────────────────────────────────────────┘
```

#### P1-05 — Record lock + e-sig + reason-for-change

- **Trigger**: select a group → click Lock toolbar button (or `Ctrl+Shift+L`). Edit attempt on a locked record opens the e-sig modal.
- **Affordance**: toolbar button with padlock icon. Locked groups render a small padlock glyph at their centroid.
- **Keyboard shortcut**: `Ctrl+Shift+L` toggles lock. Lock is the ceremony, not the edit — `Ctrl+L` stays on "molecule search" per wave-2 decision.
- **Visible state**: padlock badge on the group. Toolbar button shows pressed state when any selected group is locked. E-sig modal is a centered overlay with dimmed background (this is ceremony, modal is the right pattern).
- **Failure mode**: reason-string empty → "Please enter a reason for change" red text under the textarea; Save button disabled. Escape key = Cancel (standard modal behaviour).

```
 ┌─── E-sig modal (centered) ──────────────────┐
 │                                              │
 │  🔒  Edit a locked record                    │
 │                                              │
 │  User:       rajesh.kumar                    │
 │  Timestamp:  2026-04-17 19:23:14 UTC         │
 │                                              │
 │  Reason for change (required):               │
 │  ┌────────────────────────────────────────┐ │
 │  │                                        │ │
 │  │                                        │ │
 │  └────────────────────────────────────────┘ │
 │                                              │
 │  [Cancel]                    [Sign & Apply]  │
 │                                              │
 │  Beta — foundational e-sig, full compliance  │
 │  pending vendor audit.                       │
 └──────────────────────────────────────────────┘
```

#### P1-06 — CDXML export

- **Trigger**: File menu → Export → CDXML. Also in export toolbar icon dropdown.
- **Affordance**: menu item labelled "CDXML (Beta MVP)".
- **Keyboard shortcut**: none new — export is a menu surface. (Existing `Ctrl+Shift+E` could be re-assigned to "Export Menu" but that's scope creep.)
- **Visible state**: on click, file downloads. One-time toast per session: "CDXML export — wave-4 MVP. Text annotations / arrows / shapes not yet written."
- **Failure mode**: if the scene has no atoms, export button is disabled with tooltip "Nothing to export."

### 3.2 New status-bar indicators

Matching the wave-3 `∠snap/free` / `⋯grid/off` idiom:

| Symbol | On / Off labels | Trigger |
|---|---|---|
| 📜 | `📜 <N> entries` when audit trail active; `📜 off` if disabled | Always present when regulated-mode is on |
| 🔒 | `🔒 <N> locked` — count of locked groups in the current page | Updates live when any Group.locked changes |

No status indicator for DEPT phase / integrals / JCAMP overlay — those are panel-local features, not global modes.

### 3.3 Modal vs inline decisions

| Feature | Modal or inline? | Why |
|---|---|---|
| E-sig ceremony (P1-05) | **Modal** | Regulated ceremony is the point — interrupting flow is correct |
| Reason-for-change (P1-05) | **Modal (same as e-sig)** | Same ceremony surface; combining them is one modal |
| Lock toggle (P1-05) | **Inline button + padlock badge** | No ceremony on locking; ceremony is only on editing-locked |
| Audit-trail viewer (P1-04) | **Side panel, not modal** | Read-only reference material; shouldn't block work |
| DEPT phase (P1-01) | **Inline render, no UI ceremony** | The feature IS the visual; no modal, no toast |
| Integrals + line list (P1-02) | **Inline render, optional toggle** | Badges are passive; Shift+I to hide for figures |
| JCAMP-DX overlay (P1-03) | **File drop → legend chip + toast** | Drop is natural; legend chip is the affordance; no modal |
| CDXML export (P1-06) | **Menu item + toast** | Familiar export pattern; toast carries the MVP disclaimer |

### 3.4 Keyboard shortcut additions for `docs/keyboard-shortcuts-compliance.md`

| Key | Action | Wave-4 story |
|---|---|---|
| `D` (in NMR panel focus) | Cycle ¹H → ¹³C → DEPT-135 → ¹H | P1-01 |
| `Shift+I` | Toggle integration badges on/off | P1-02 |
| `Ctrl+Shift+A` | Open audit-log side panel | P1-04 |
| `Ctrl+Shift+L` | Lock / unlock selected group | P1-05 |

All four verified against the 31 existing shortcuts — no collisions:
- `Ctrl+A` (select all) stays; `Ctrl+Shift+A` is new.
- `Ctrl+L` (molecule search) stays; `Ctrl+Shift+L` is new.
- `Shift+I` was unused (Shift+{O,F,N,Y} shipped in wave-3; `I` alone is iodine atom hotkey in selection context).
- `D` was unused globally; `d` alone is dashed-bond. The NMR-panel-focused context distinguishes them.

Post-wave-4 shortcut count: **35/35** (100% of ChemDraw parity + 14 Kendraw-specific). Update the Summary paragraph accordingly.

### 3.5 Accessibility checklist

1. **E-sig modal** — focus moves to the reason textarea on open; Escape dismisses; focus returns to the locked atom on close.
2. **Padlock badge on locked groups** — `aria-label="Locked"` + announced by screen readers when locked-status changes.
3. **Audit-log side panel** — table semantics (`<table>`, `<th scope="col">`), arrow-key row navigation.
4. **DEPT-135 phase** — an a11y-mode toggle in settings should also render up/down as `+` / `−` labels below each peak for colour-blind users (wave-5 polish, note in Paige's release notes).
5. **Integration badges** — readable text, not SVG-only; screen readers must reach them.
6. **CDXML export toast** — `role="status"` + `aria-live="polite"`; auto-dismiss timeout ≥6 seconds (long enough for screen readers).
7. **Legend chip on JCAMP overlay** — close button has `aria-label="Remove overlay"`; file name is announced on overlay load.

Handing to Paige.

---

## 4. Technical Writer perspective (Paige)

✍️ **Paige (Technical Writer):**

Mary and Sally nailed the internals. My job is to make V0.4 land correctly with the three outside audiences: R&D users who read release notes, QC/regulatory leads who read compliance language, and newcomers who read the README. Tone: honest, no marketing fluff, regulated-industry-safe.

### 4.1 Release notes draft for V0.4

> **Kendraw V0.4 — Wave-4 Pharma release**
>
> Wave-4 is the pharma wave. Six features ship across NMR spectroscopy, regulated-environment audit infrastructure, and ChemDraw round-trip interoperability. Each is an honest MVP — the minimum viable foundation in its category, with the path to full compliance documented.
>
> **For R&D users (NMR-focused)**
> - `¹³C / DEPT-135` now renders with standard up/down phase convention (CH, CH₃ up; CH₂ down; quaternary absent). Cycle modes with `D`.
> - Multiplet regions now show numeric proton-count badges ("3.0 H") and expand to their resolved Pascal line list (ddd → 8 lines, J tooltips on hover). Toggle badges with `Shift+I`.
> - Drop a `.jdx` or `.dx` file on the NMR panel to overlay a measured spectrum on the prediction. 1D XYDATA only; 2D and peak-table formats will follow in wave-5.
>
> **For QC / GMP users**
> - Every scene mutation now appends to an **append-only audit log** (JSON-lines in browser local storage). Open the viewer with `Ctrl+Shift+A`. Export the log as JSON-lines from the panel. *Beta — foundational audit trail, full 21 CFR Part 11 compliance pending vendor audit.*
> - Select a group and press `Ctrl+Shift+L` (or the new toolbar Lock button) to **lock a record**. Any subsequent edit opens an **electronic signature modal** (user + timestamp + required reason-for-change). The reason is captured in the audit log. *Beta — foundational e-sig, full compliance pending vendor audit.*
>
> **For regulatory writers**
> - **CDXML export** — File → Export → CDXML (Beta MVP). Writes atoms, bonds, and stereo wedges to CDXML 1.6. Round-trips into Kendraw and into ChemDraw 22 (spot-checked 7/10 molecules). Text annotations, reaction arrows, and shapes will follow in wave-5.
>
> **For drawing power users**
> - Four new keyboard shortcuts: `D` (NMR mode cycle), `Shift+I` (integration badges), `Ctrl+Shift+A` (audit log), `Ctrl+Shift+L` (record lock). Shortcut compliance against ChemDraw is now **35/35**.
>
> **For educators**
> - The DEPT-135 rendering mode is a direct teaching asset — students see the up/down pattern the same way they see it on the 400 MHz instrument.
>
> **Known limitations & honest disclaimers**
> - Audit trail persists in **browser local storage only**. Export regularly for off-device archival. No cross-device sync (privacy-first).
> - E-signature uses **local-workstation user identity**, not directory-backed auth. Full 21 CFR Part 11 certification pending vendor audit.
> - CDXML export is an **MVP**: text, arrows, shapes, R-groups, brackets **not** yet exported.
> - **2D NMR** (COSY / HSQC / HMBC) remains a wave-5 commitment.
> - **SAR grid / Markush / BioDraw** remain out-of-scope for wave-4; see the roadmap for the wave-5 pipeline.

### 4.2 README updates needed

Changes to `/home/debian/kendraw/README.md`, after wave-4 ships:

- **Status paragraph (line 8)**: bump mention from "wave-3" to "wave-4 pharma release". Keep the review/roadmap link structure.
- **ChemDraw feature-parity line (line 26)**: update from "43% across 176 audited features … post-session recalculation ~52%" to "~63% post-wave-4" with the new v0.2.0 benchmark doc link.
- **Chemical drawing bullet list**: add two new bullets at the bottom:
  - "Record lock with electronic signature + reason-for-change modal (Beta — foundational e-sig, full compliance pending vendor audit)"
  - "Append-only audit trail (JSON-lines in browser storage, export anytime) — Beta"
- **NMR prediction bullet list**: add two new bullets:
  - "DEPT-135 up/down phase rendering (CH, CH₃ up; CH₂ down; quaternary absent)"
  - "Numeric integration badges + resolved multiplet line list (ddd expands to 8 lines) + J-coupling tooltips"
  - "JCAMP-DX 1D spectrum overlay (drop a .jdx/.dx file onto the NMR panel)"
- **Import / export bullet list**: change the CDXML line from "CDXML import (ChemDraw round-trip, export currently missing)" to "CDXML import + export MVP (atoms + bonds + wedges; text/arrows/shapes deferred to wave-5)".
- **Keyboard shortcuts section (line 123)**: bump to "35 of 35 ChemDraw shortcuts implemented (100% parity)".
- **Test counts** (line 80): update from "546 frontend unit tests" to the new post-wave-4 count (target ~600 assuming ~10 new tests per P1 story); "24 Playwright E2E specs" to the new count (target 30 with the 6 new wave-4 E2E specs).
- **Scientific validation section**: add a line referencing `docs/nmr-scientific-review-v7.md` when that ships; defer until after V7.

### 4.3 New docs files to create alongside wave-4 code commits

1. **`docs/audit-trail-format.md`** — Documents the JSON-lines schema (fields: `ts`, `user`, `action`, `recordId`, `before`, `after`, `reason?`), the IndexedDB object-store name, rotation-threshold guidance (10k rows), and the "integrity broken" tamper-detection semantics. Used by auditors inspecting exported logs.
2. **`docs/cdxml-export-coverage.md`** — Lists what the wave-4 MVP writes (atom element, charge, radical, position; bond order, stereo wedge/hash) and what it skips (text, arrows, shapes, R-groups, brackets, colour). Includes the `CDXML 1.6` schema reference and the round-trip test molecule list.
3. **`docs/jcamp-dx-import.md`** — Scope statement: 1D XYDATA only, both `##DATATYPE=NMR SPECTRUM` and `##DATATYPE=NMR FID`. Explicit rejection of 2D NTUPLES and peak-table formats. Example fixture files listed.
4. **`docs/e-sig-mvp.md`** — Compliance posture. Explicit paragraph: "This is a foundational MVP, not a 21 CFR Part 11 certification. Certification requires vendor audit against FDA guidance documents, directory-backed identity, tamper-evident chain-of-custody, and institutional deployment validation. Kendraw provides the architectural hooks; institutional deployments must pair with external identity + archival infrastructure."
5. **`docs/dept-135-rendering.md`** — Short note on phase convention (CH/CH₃ positive, CH₂ negative, C absent), colour legend used, and the accessibility a11y-mode plain-text label alternative (wave-5).

### 4.4 Beta disclaimer copy library

Ready-to-paste. Four paragraphs, each 50–80 words.

**Audit trail — in-app footer (when audit panel is open)**
> Kendraw records every scene edit as a local append-only log. This is a **Beta — foundational audit trail**; full 21 CFR Part 11 compliance is pending vendor audit. The log is stored in your browser only (no cloud sync, no telemetry), supports regular JSON-lines export for off-device archival, and includes a monotonic row-count integrity check. Cryptographic chain-of-custody will ship in wave-5.

**E-sig modal — above the reason textarea**
> By signing this change, you bind your current workstation user identity, the timestamp, and your stated reason to this edit. This is a **Beta — foundational e-signature**; institutional deployments should pair with directory-backed authentication and external archival. Full compliance with §21 CFR Part 11 §11.100–§11.300 is pending vendor audit. Your reason text is captured verbatim in the audit log.

**Record lock — toast on first lock**
> This record is now locked. Subsequent edits will require a signed reason-for-change (Ctrl+Shift+L to unlock). **Beta — foundational record lock, full compliance pending vendor audit.** Locked structures still export, print, and copy normally; only mutation is gated. Unlocking is itself an audited action.

**CDXML export — toast on first export, and as in-file comment**
> Kendraw CDXML export writes atoms, bonds, and stereo wedges (schema 1.6, ChemDraw 22 compatible). This is a **Beta — wave-4 MVP**; text annotations, reaction arrows, curly arrows, shapes, R-groups, and polymer brackets are not yet exported — they will land in wave-5. Round-trip with Kendraw is test-guaranteed; round-trip with ChemDraw 22 is spot-checked. Report failures at github.com/electrosenpai/kendraw.

### 4.5 Migration / upgrade notes (V0.3 → V0.4)

> Upgrading from V0.3 to V0.4 is additive — existing scenes load unchanged, no data migration is required.
>
> - **Existing documents**: load identically. No scene-schema change.
> - **Audit trail**: starts empty for all users on first V0.4 launch. The log begins recording from the next edit forward. Pre-V0.4 history is not retroactively captured (V0.3 had no mechanism).
> - **Locked records**: no V0.3 document contains locked groups (`Group.locked` was unwired). The lock UI is net-new in V0.4.
> - **CDXML export**: purely additive. V0.3 exports (MOL V2, SMILES, PNG, SVG, PDF) are unchanged.
> - **Keyboard shortcuts**: four new shortcuts, zero re-assignments. Existing muscle memory is preserved.
> - **Privacy**: no change. Zero telemetry, zero outbound calls outside the explicit PubChem search. The audit log is local-only.
>
> Users running the Docker stack should `docker compose pull && docker compose up -d` to pick up the new frontend image. Backend is unchanged (no wave-4 Python code paths). Traefik/Let's Encrypt stack at `kendraw.fdp.expert` deploys with zero config changes.

---

## Cross-references

- Demand side: [`docs/pharma-deepdive-wave-4.md`](pharma-deepdive-wave-4.md)
- Supply side: [`docs/benchmark-kendraw-vs-chemdraw-v0.2.0.md`](benchmark-kendraw-vs-chemdraw-v0.2.0.md)
- V6 review: [`docs/nmr-scientific-review-v6.md`](nmr-scientific-review-v6.md)
- Wave-3 report: [`docs/implementation-report-wave-3.md`](implementation-report-wave-3.md)
- Keyboard shortcut compliance: [`docs/keyboard-shortcuts-compliance.md`](keyboard-shortcuts-compliance.md)
