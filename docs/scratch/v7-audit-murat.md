# V7 Test-Coverage-vs-Risk Audit — Murat (TEA)

**Date:** 2026-04-18
**Scope:** test quality posture for public-beta sign-off.
**Method:** brief §A.7 + glob of `e2e/**/*.spec.ts` + assertion grep across 31 spec files (230 `expect(` calls; 101 are pure `toBeVisible/Attached` shape-checks ≈ 44 %).

---

## 1. Current test count (exact, post wave-7 HF-6)

| Suite | Count | Source |
|---|---:|---|
| Frontend Vitest — total | **677** (140 in `ui` workspace) | brief §A.7 |
|  — scene | 246 | brief §A.7 |
|  — io | 100 | README §"618" line predates wave-5 restate |
|  — nmr | 75 | README |
|  — ui | 140 (post wave-6 +27) | brief §A.7 |
|  — constraints | 45; persistence 39; renderer-canvas 30; renderer-svg 23; chem 6 | README |
| Backend pytest | **242 — frozen since V5** | brief §A.7, §B.4, §C.2 |
| Playwright e2e specs (root `/e2e/`) | **28** files = 24 baseline + 16 wave-6 + 23-test toolbox-clicks regression spec; runs across 2 projects (`chromium` + `chromium-new-canvas`) | brief §A.7, glob |
| Extra spec in `packages/ui/e2e/` | 1 (`add-atom.spec.ts`) | glob |
| README claim | "618 FE + 242 BE + 24 e2e" | README L104-106 — **stale by ~7 specs** |

README test counter is out of date with brief.

---

## 2. Panel-critical features with NO e2e coverage

Cross-referenced against §B/§C blocker tables:

- **CDXML round-trip** — only spec file is `import-smiles.spec.ts`; no glob hit for `cdxml`, `cdx`, or "round-trip". Wave-4 P1-06 "round-trip tested" is unit-only.
- **Audit-trail hash chain (P1-04)** — 15 unit tests exist (incl. adversarial), but **no e2e spec touches `verifyAuditChain` or AuditLogPanel** (which is also unbuilt — W4-D-08).
- **E-signature modal (P1-05)** — no `esig`, `e-sign`, or `lockRecord` spec; modal is wired in Beta but app-level chrome wiring (W4-D-10) deferred.
- **JCAMP-DX import + spectrum overlay** — wave-4 P1-03 ships, but no `jcamp` glob hit; overlay rendering and orange-vs-blue parity unverified end-to-end.
- **Clean / Refine structure endpoint** — wave-7 HF-3 wired the buttons; no e2e spec invokes the endpoint and asserts coordinate change.
- **Dark-mode persistence across reload** — wave-7 HF-5 shipped theme, but no spec asserts `localStorage` read on cold start nor dialog contrast.
- **DEPT-90/135 hotkey cycle** — wave-4 P1-01; `multiplicity-display.spec.ts` exists but assertions skew toward shape; no test asserts DEPT phase inversion in canvas pixels.
- **Compound numbering Ctrl+Shift+C** — `compound-numbering.spec.ts` exists but only 2 `toBeVisible` calls.
- **Backend regression on `/predict` and `/nmr` payload shape** — `api-regression.spec.ts` only 51 LoC, 6 expects.

---

## 3. Coverage that LOOKS green but has weak assertions

Quantitative: of 230 `expect(` calls, **101 (44 %)** are `toBeVisible / toBeAttached / toContainText` UI-shape assertions only. Worst offenders:

- `canvas-new/toolbox-parity.spec.ts` — 31 expects, 28 are visibility-only. Asserts buttons render; does not assert active-tool-state in store after click. (HF-6 root cause was orphan `<div>`s eating clicks while buttons stayed visible — exactly the failure mode this style of test is blind to. Toolbox-clicks regression added later because parity spec was green during the bug window.)
- `canvas-new/shell-parity.spec.ts` — 9/9 expects visibility-only; tests that header/PropertyPanel "render in both flag states" without asserting parity of the data they show.
- `p2-features/compound-numbering.spec.ts` — 2 expects, both visibility.
- `p2-features/print.spec.ts` — 1 expect total in 34 LoC; effectively a smoke ping.
- `p3-edge/empty-canvas.spec.ts` and `large-molecule.spec.ts` — 2-3 expects each; "doesn't crash" rather than "produces correct output".
- `p1-critical/draw-molecule.spec.ts` — 9 expects in 71 LoC, draws but does not assert SMILES/InChI of the resulting molecule. Molecule could draw the wrong bond and pass.
- `p1-critical/nmr-prediction.spec.ts` — 13 expects, 3 strict; rest assert panel opens and "has values", not specific ppm tolerance.
- `regression/bug-caffeine-c8h.spec.ts` — 4 expects; well-targeted at the C8H regression but no parametric extension to other purines.

---

## 4. Three highest-risk untested workflows for public beta

1. **Audit-trail + e-signature end-to-end under user load.** P1-04 / P1-05 ship as Beta with explicit "tamper-evident, not non-repudiation" caveat (§C.1). Zero e2e specs, zero IndexedDB persistence (W4-D-06), zero command-dispatch wiring (W4-D-07). A pharma user signing a record today gets a hash chain that lives in RAM and disappears on reload — and no test would catch that regression. **This is the single largest test-vs-claim gap in the codebase.**

2. **Round-trip fidelity of CDXML / SMILES / JCAMP-DX import-export.** The README headlines round-trip; only unit-level coverage exists. A user importing a ChemDraw file, editing, re-exporting, and re-importing has no e2e safety net. Stereo descriptors, R-groups, and Markush are all known-deferred (W4-D-11/12) — silent data loss is plausible.

3. **Backend `/predict` and `/nmr` regression matrix.** Backend pytest count has been **frozen at 242 across V5/V6/V7** despite wave-4 NMR feature work (DEPT, multiplet line list, JCAMP-DX). Frontend e2e API regression is 51 LoC / 6 expects. A backend refactor or RDKit version bump could shift ppm predictions silently and only Chen would notice — in production.

---

## Sign-off verdict

**CONDITIONAL.**

- **Pedagogy / teaching beta:** sign-off OK. Drawing, hotkeys, NMR display, undo/redo, import-SMILES are covered well enough; the canvas-new HF-6 incident proved the regression spec mechanism works once a bug is found.
- **Research-grade beta:** **no.** Backend pytest frozen at 242 + zero e2e on JCAMP overlay = predictions are not regression-locked.
- **Pharma / GMP beta:** **no.** Audit + e-sign ship as labelled Beta with no e2e; shipping under a "21 CFR Part 11" banner without persisted audit + signed e2e is a reputational risk the test suite cannot defend against.

**Pre-launch fixes I would block on:**
1. e2e spec for audit-chain verify + e-sign modal happy-path + tamper-detect path.
2. e2e CDXML round-trip with a 5-molecule fixture set asserting atom/bond/wedge/charge equality post-roundtrip.
3. e2e JCAMP-DX import asserting overlay element exists, has expected color, and toggles.
4. Backend pytest count must move; add ≥10 tests covering the wave-4 NMR endpoints touched.
5. Update README L104-106 test counter to match brief §A.7 — silent count-drift erodes trust in every other number we publish.
6. Convert the worst 5 visibility-only specs (toolbox-parity, shell-parity, compound-numbering, print, draw-molecule) to assert post-state, not render-state.

Confirmed: audit written to `/home/debian/kendraw/docs/scratch/v7-audit-murat.md`, no source files touched.
