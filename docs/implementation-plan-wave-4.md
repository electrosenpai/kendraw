# Wave-4 Implementation Plan

> Generated 2026-04-17 as the Act 4 deliverable of the autonomous
> wave-4 BMAD party-mode session. Three-voice contribution:
> **Winston** (Architect) sets the architecture × risk matrix and
> call-site list, **Amelia** (Developer) sets the implementation
> order and per-story code surface, **Murat** (Test Engineering
> Architect) sets the test strategy + Release Gate.
>
> Source: `docs/product-plan-wave-4.md` (personas, BMAD stories,
> acceptance criteria, disclaimer copy, keyboard shortcuts).

---

## Table of contents

1. [Architect perspective (Winston)](#1-architect-perspective-winston)
2. [Developer perspective (Amelia)](#2-developer-perspective-amelia)
3. [TEA perspective (Murat)](#3-tea-perspective-murat)

---

## 1. Architect perspective (Winston)

🏗️ **Winston (Architect):**

Six P1 stories, three architecture surfaces: NMR renderer (P1-01 + P1-02), persistence/store middleware (P1-04 + P1-05), format I/O (P1-03 JCAMP reader, P1-06 CDXML writer). No backend Python change — every P1 is frontend-only. That's a load-bearing fact: the backend test count stays at 242, and our review surface is exclusively TypeScript packages.

### 1.1 Architecture × risk matrix

| # | Architectural decision | Risk | Mitigation | Fallback |
|---|---|---|---|---|
| **A** | Audit trail as Immer middleware on the scene store (one hook, all mutations captured) | If Immer patches lack semantic action names, every row becomes "mutation" and loses auditor value | Wrap the `dispatch` function instead of hooking into Immer — every command goes through `dispatch`, so the action type is a first-class string there | Per-command wrapper (one call per command; verbose but reliable) |
| **B** | Audit log in IndexedDB object store `audit_log`, indexed on `{ts, recordId}` | IndexedDB quota exhaustion on long-running sessions | Add a quota warning at 80% + a "Rotate audit log" action (wave-4 stretch if time permits) | Toast warning only for wave-4; rotation in wave-5 |
| **C** | `Group.locked` as the single source of truth for record lock; padlock rendered in `renderer-canvas` | Group ownership is scene-wide (one group can contain atoms of unrelated interests) | Enforce "atoms belong to at most one locked group at a time" in the command layer | Validation error on lock command if atom is in two locked groups |
| **D** | CDXML writer as a new package-level module `packages/io/src/cdxml-writer.ts`, mirror of `cdxml-parser.ts` | CDXML schema drift — ChemDraw 22 may default to 1.7+ | Write to 1.6 (documented, stable); add a ChemDraw 22 round-trip check to the PR QA step | Accept 7/10 round-trip success as ship-gate (per Mary's P1-06 AC) |
| **E** | JCAMP-DX reader as `packages/io/src/jcamp-dx.ts` returning a typed `{ x: number[], y: number[], nucleus, solvent }` struct | Variation in JCAMP encoding (AFFN vs ASDF vs PAC vs SQZ) | Ship AFFN + ASDF only (covers >95% of real files); reject PAC/SQZ with a clear toast | Explicit reject; wave-5 adds remaining encodings |
| **F** | DEPT-135 phase as a render-side branch in `SpectrumRenderer.ts` only — no model change | The DEPT classification is a display property; model-side changes would cascade across NMR tests | Keep classification in data, phase in render; no new model field | — |
| **G** | New keyboard shortcuts (`D`, `Shift+I`, `Ctrl+Shift+A`, `Ctrl+Shift+L`) wired through the existing `useHotkeys` pattern in `packages/ui/src/` | Conflict with text-input editing | Existing guard already disables shortcuts in text inputs (pre-existing wave-2 behavior) — verify in E2E | Add a focused assertion to the regression suite |

### 1.2 Call-site map — one-stop reference

| Story | File to create | File to edit | Imports |
|---|---|---|---|
| P1-01 | — | `packages/nmr/src/SpectrumRenderer.ts`, `packages/nmr/src/NmrPanel.tsx` | existing DEPT classification from prediction object |
| P1-02 | — | `packages/nmr/src/SpectrumRenderer.ts`, `packages/nmr/src/multiplet.ts` (consume, not edit), `packages/nmr/src/NmrPanel.tsx` (tooltips) | `expandMultiplet` already public |
| P1-03 | `packages/io/src/jcamp-dx.ts` | `packages/io/src/index.ts` (re-export), `packages/nmr/src/SpectrumRenderer.ts` (overlay path), `packages/ui/src/Canvas.tsx` (file-drop) | — |
| P1-04 | `packages/persistence/src/audit-log.ts`, `packages/ui/src/components/AuditLogPanel.tsx` | `packages/scene/src/store.ts` (dispatch wrapper), `packages/ui/src/components/StatusBar.tsx` (footer badge), `packages/ui/src/App.tsx` (panel toggle) | `idb` wrapper already used |
| P1-05 | `packages/ui/src/components/ESigModal.tsx`, `packages/ui/src/components/LockButton.tsx` | `packages/scene/src/commands.ts` (edit-guard on locked groups), `packages/renderer-canvas/src/` (padlock glyph), `packages/ui/src/components/Toolbar.tsx` (button) | P1-04 audit log append |
| P1-06 | `packages/io/src/cdxml-writer.ts` | `packages/io/src/index.ts` (re-export), `packages/ui/src/components/ExportMenu.tsx` (menu item) | existing Scene types |

### 1.3 Dependency-order constraint

```
P1-04 (audit middleware)
    ├─ must be in place before P1-05 records a reason string
    └─ independent of every other P1

P1-01 (DEPT render)
    └─ shares SpectrumRenderer.ts with P1-02 — ship consecutively

P1-02 (line list)
    └─ depends on P1-01's edits not colliding — ship right after

P1-03 (JCAMP overlay)
    └─ also touches SpectrumRenderer.ts — merge-conflict risk with P1-02
         → mitigation: ship P1-03 after P1-02, not in parallel

P1-06 (CDXML writer)
    └─ independent, largest — ship last to isolate its risk
```

So the commit order is fixed: **P1-01 → P1-02 → P1-03 → P1-04 → P1-05 → P1-06**.

### 1.4 Non-functional constraints respected

- **Zero backend change** — no Python touched, 242 backend tests unchanged.
- **Zero scene-schema change** — `Group.locked` already exists; no V0.3 → V0.4 migration needed.
- **Zero network call added** — audit log local-only (per privacy-first stance); JCAMP parsing local.
- **Bundle size impact** — CDXML writer is ~300 lines TS, JCAMP parser ~200 lines; under 10 KB gzipped combined.
- **IndexedDB quota** — audit log rows are ~300 bytes each; 10k rows = 3 MB, well under browser per-origin quota (50+ MB typical).

---

## 2. Developer perspective (Amelia)

💻 **Amelia (Developer):**

Winston set the call-site map. I take the commit order, write out the per-story implementation steps, and name the test additions I expect to ship. Each story becomes one commit gated by the 7-check pre-commit hook. No `--no-verify`. Estimate column is mine (engineer-hours for one developer).

### 2.1 Per-story implementation steps

#### P1-01 — DEPT-135 phase (~4h)

1. Add `'dept-135'` to the `NmrMode` union in `NmrPanel.tsx`.
2. In `SpectrumRenderer.ts`, add a `phaseSign(peak)` helper: returns `-1` for CH₂, `0` for quaternary C, `+1` otherwise.
3. In the render loop, multiply peak Y by `phaseSign(peak)` when mode === `'dept-135'`. Skip peaks where `phaseSign === 0`.
4. Wire keyboard `D` in the NMR panel focus context to cycle modes.
5. Unit test in `packages/nmr/src/__tests__/spectrum-renderer.test.ts`: assert CH₂ peaks render at `y < 0`, quaternary skipped.
6. Update `docs/dept-135-rendering.md` (per Paige §4.3).

**Commit**: `feat(nmr): dept-135 up/down phase — wave-4 P1-01`

#### P1-02 — Integration badges + multiplet line list + J tooltips (~10h)

1. Consume `expandMultiplet()` from `multiplet.ts` in `SpectrumRenderer.ts`. If line list is available, render N discrete peaks; otherwise fall back to the symbol.
2. Render integration badges from existing prediction `integral` field.
3. Add hover handler on lines: emit a tooltip with ppm + J value.
4. Keyboard `Shift+I` toggles badge visibility (boolean in panel state).
5. Unit tests: (a) ddd expands to 8 lines, (b) integration sum equals molecular H count, (c) hover tooltip payload.
6. E2E test (new): `e2e/p2-features/nmr-integrals.spec.ts`.

**Commit**: `feat(nmr): integration badges and multiplet line list — wave-4 P1-02`

#### P1-03 — JCAMP-DX overlay (~14h)

1. Create `packages/io/src/jcamp-dx.ts` with `parseJcampDx(text): SpectrumData | Error`. Handle AFFN and ASDF encodings. Reject 2D NTUPLES, peak-table formats with named errors.
2. Export from `packages/io/src/index.ts`.
3. Extend `SpectrumRenderer.ts` to accept an optional `overlay: SpectrumData` prop and draw a second path.
4. Add file-drop handler in `Canvas.tsx` that dispatches parsed spectrum to the NMR panel state.
5. Legend chip component with close button in `NmrPanel.tsx`.
6. Unit tests: fixture files in `packages/io/src/__tests__/fixtures/jcamp-dx/` covering valid-1H, valid-13C, malformed, 2D-rejected.
7. E2E test (new): `e2e/p2-features/nmr-jcamp-overlay.spec.ts`.
8. Update `docs/jcamp-dx-import.md` (per Paige §4.3).

**Commit**: `feat(io): jcamp-dx 1d import and spectrum overlay — wave-4 P1-03`

#### P1-04 — Audit trail (~12h)

1. Create `packages/persistence/src/audit-log.ts`:
   - `appendAuditRow(row: AuditRow): Promise<void>` — writes to IndexedDB object store `audit_log`.
   - `readAuditRows(): Promise<AuditRow[]>`.
   - `exportAuditLog(): Blob` — JSON-lines.
   - Internal monotonic counter for integrity check.
2. In `packages/scene/src/store.ts`, wrap the `dispatch` function: every dispatch emits `{ts, user, action: command.type, recordId, before, after}` to the audit log.
3. `AuditLogPanel.tsx` side panel with table view + "Export" button.
4. Footer badge in `StatusBar.tsx`: `📜 <N> entries`. Integrity-broken → red badge.
5. Keyboard `Ctrl+Shift+A` toggles the panel.
6. Unit tests in `packages/persistence/src/__tests__/audit-log.test.ts`: append 10, re-read, export round-trip.
7. Integration test: dispatch 5 commands, assert 5 rows in the store.
8. E2E test (new): `e2e/p2-features/audit-trail.spec.ts`.
9. Write `docs/audit-trail-format.md` (per Paige §4.3).

**Commit**: `feat(persistence): append-only audit trail — wave-4 P1-04`

#### P1-05 — Record lock + e-sig + reason modal (~12h)

1. `LockButton.tsx` in the toolbar — flips `Group.locked` on the selected group.
2. Renderer: draw padlock glyph at group centroid when `locked === true`.
3. `ESigModal.tsx` with user + timestamp + required reason textarea. Include Paige's §4.4 disclaimer copy.
4. Edit-guard in `packages/scene/src/commands.ts`: if any target atom belongs to a locked group and no e-sig context is present, return a `RequiresESig` result that triggers the modal.
5. On modal confirm, attach `{reason, signedBy, signedAt}` to the next dispatched command; the audit-log middleware picks these up and writes them to the row.
6. Keyboard `Ctrl+Shift+L` toggles lock on selected group.
7. Unit tests: modal validation, padlock render, edit-guard triggers modal.
8. E2E test (new): `e2e/p2-features/lock-record.spec.ts`.

**Commit**: `feat(ui): record lock and e-sig mvp with reason modal — wave-4 P1-05`

#### P1-06 — CDXML export MVP (~18h)

1. Create `packages/io/src/cdxml-writer.ts`:
   - `exportCdxml(scene: Scene): string` — returns valid CDXML 1.6 XML.
   - Writes atoms: element, charge, radical, coordinates (scaled from scene to CDXML units).
   - Writes bonds: order, wedge/hash direction.
   - Emits a `<!-- Kendraw CDXML MVP (wave-4) -->` header comment.
2. Export from `packages/io/src/index.ts`.
3. Add "CDXML (Beta MVP)" entry to `ExportMenu.tsx`.
4. Toast on first export with Paige's §4.4 disclaimer copy.
5. Unit tests in `packages/io/src/__tests__/cdxml-writer.test.ts`: 10 reference molecules round-trip through the writer → parser → writer.
6. Manual QA step (recorded in PR body): 10 molecules opened in ChemDraw 22, report 7+/10 success.
7. Write `docs/cdxml-export-coverage.md` (per Paige §4.3).

**Commit**: `feat(io): cdxml export mvp (atoms + bonds + wedges) — wave-4 P1-06`

### 2.2 Budget reconciliation

| Story | Hours | Running total |
|---|---:|---:|
| P1-01 | 4 | 4 |
| P1-02 | 10 | 14 |
| P1-03 | 14 | 28 |
| P1-04 | 12 | 40 |
| P1-05 | 12 | 52 |
| P1-06 | 18 | 70 |

70 hours = ~9 engineer-days (at 8h/day). John's budget was 12–15 days — **I have slack**. If slack materializes, I execute John's §1.3 P2 picks in order: P2-07 (InChIKey copy, 1h), then P2-13 (metadata autoblock, 10h), then P2-08 (R/S + E/Z, 12h).

### 2.3 Safety guardrails

- **Never bypass pre-commit.** Seven checks on every commit: eslint, tsc, vitest, ruff check, ruff format, mypy, pytest.
- **No force push.** All commits land on `main` linearly.
- **No dep install.** Wave-4 ships with the existing dependency set (the `idb` wrapper, React, Immer, etc.). If a story needs a new dep, I escalate rather than silently add it.
- **Commit subject case:** commitlint enforces lowercase — I keep my subjects `feat(scope): title — wave-4 P1-XX`.

---

## 3. TEA perspective (Murat)

🧪 **Murat (Test Engineering Architect):**

Six stories, six test families. Amelia already scoped unit + E2E per story; I add the regression strategy and the **Release Gate** — the exact checklist that says "wave-4 is shippable".

### 3.1 Test strategy summary

| Story | Unit tests added | E2E specs added | Regression surface |
|---|:---:|:---:|---|
| P1-01 | +4 (phase sign helper, render branch, 3 mode-cycle tests) | +1 (`nmr-dept.spec.ts`) | NMR 64 must pass |
| P1-02 | +8 (line-list render, integration sum, tooltip, badge toggle, 4 multiplet cases) | +1 (`nmr-integrals.spec.ts`) | NMR 64 + multiplet 64 must pass |
| P1-03 | +12 (JCAMP parser: 4 valid flavors, 4 rejection cases, 4 overlay render) | +1 (`nmr-jcamp-overlay.spec.ts`) | IO 74 + NMR 64 must pass |
| P1-04 | +10 (append, read, export, import round-trip, integrity detection, panel rendering, 4 middleware cases) | +1 (`audit-trail.spec.ts`) | Persistence 10 + Scene 242 must pass |
| P1-05 | +10 (modal validation, padlock render, edit-guard, lock-unlock, 5 integration cases) | +1 (`lock-record.spec.ts`) | UI 52 + Scene 242 + renderer-canvas 30 must pass |
| P1-06 | +12 (10 round-trip molecules + 2 stereo cases) | +1 (`cdxml-export.spec.ts`) | IO 74 must pass |
| **Total** | **+56** | **+6** | all wave-3 tests unchanged |

**Projected test counts after wave-4:**
- Frontend: **546 → 602** (+56)
- E2E: **24 → 30** (+6)
- Backend: **242 → 242** (+0, no backend change)

### 3.2 Fixture library required

| Fixture | Files | For |
|---|---|---|
| NMR JCAMP-DX valid | `test-fixtures/jcamp-dx/ethanol-1h.jdx`, `benzene-13c.jdx`, `caffeine-1h-dmso.jdx` | P1-03 valid-input tests |
| NMR JCAMP-DX invalid | `test-fixtures/jcamp-dx/malformed-header.jdx`, `cosy-2d.jdx` (for 2D rejection), `peak-table.jdx` (for PEAK TABLE rejection) | P1-03 rejection tests |
| CDXML round-trip seed | `test-fixtures/cdxml/benzene.cdxml`, `aspirin.cdxml`, `cholesterol.cdxml` (already exist from CDXML import tests) | P1-06 round-trip |
| CDXML reference for ChemDraw 22 QA | `test-fixtures/cdxml/chemdraw22-expected/*.cdxml` (10 molecules) | P1-06 manual QA |

Fixture files sit under `test-fixtures/` at repo root; the existing convention in `packages/io/src/__tests__/fixtures/` is extended.

### 3.3 Regression matrix (what must not break)

| Category | Current count | After wave-4 | Must pass |
|---|---:|---:|:---:|
| scene unit | 242 | 242 | ✓ |
| io unit | 74 | 86 (+12) | ✓ |
| nmr unit | 64 | 76 (+12) | ✓ |
| ui unit | 52 | 62 (+10) | ✓ |
| constraints unit | 45 | 45 | ✓ |
| renderer-canvas unit | 30 | 32 (+2 for padlock) | ✓ |
| renderer-svg unit | 23 | 23 | ✓ |
| persistence unit | 10 | 20 (+10) | ✓ |
| chem unit | 6 | 6 | ✓ |
| **Frontend total** | **546** | **602** (**+56**) | ✓ |
| Backend pytest | 242 | 242 | ✓ |
| E2E (playwright) | 24 | 30 (**+6**) | ✓ |

### 3.4 E2E structure

New specs land in `e2e/p2-features/` to match the wave-3 structure. Each spec imports the same test harness (already in place).

Example spec structure for `audit-trail.spec.ts`:
```
test('audit trail records scene mutations', async ({ page }) => {
  await page.goto('/');
  await drawBenzene(page);
  await page.keyboard.press('Control+Shift+A');
  await expect(page.locator('.audit-log-panel tr')).toHaveCount(>= 6);
  await expect(page.locator('text=Beta — foundational audit trail')).toBeVisible();
});
```

### 3.5 Release Gate — ship-gate checklist

Every box must be checked before the wave-4 tag is cut:

- [ ] All 6 P1 commits merged to main.
- [ ] Pre-commit hook passed on every commit (`git log --grep "wave-4" --format=%s` shows 6 commits, `git log --grep "no-verify"` returns empty).
- [ ] Frontend unit count ≥ **602** (`pnpm test` summary line).
- [ ] Backend unit count = **242** (no regression).
- [ ] E2E count = **30** (`pnpm test:e2e` summary).
- [ ] Zero eslint warnings, zero tsc errors.
- [ ] Ruff + mypy clean on backend.
- [ ] ChemDraw 22 round-trip QA: ≥ 7/10 molecules pass (recorded in PR body per P1-06 AC).
- [ ] Disclaimer copy (audit trail, e-sig, CDXML) is present in all three surfaces: in-app toast/modal, README, exported-file comment/footer.
- [ ] New keyboard shortcuts (`D`, `Shift+I`, `Ctrl+Shift+A`, `Ctrl+Shift+L`) added to `docs/keyboard-shortcuts-compliance.md` with updated 35/35 header.
- [ ] All wave-4 docs exist: `audit-trail-format.md`, `cdxml-export-coverage.md`, `jcamp-dx-import.md`, `e-sig-mvp.md`, `dept-135-rendering.md` (per Paige §4.3).
- [ ] `README.md` updated with Paige §4.2 deltas.
- [ ] `docs/implementation-report-wave-4.md` written.
- [ ] `docs/deferred-work-wave-4.md` written.
- [ ] No new runtime dep introduced (diff `package.json` is empty except for scripts).

### 3.6 Risk board — what I will watch most closely

1. **P1-04 audit-log middleware** — if the Immer interaction goes wrong, every scene test fails at once. **I will review the dispatch-wrapper diff line by line before approving the commit.**
2. **P1-06 CDXML round-trip** — the writer may encode scales differently than the parser; risk of silent coordinate drift. **I will run the writer→parser→writer round-trip in a hypothesis-style property test (random molecules from the SMILES corpus).**
3. **P1-05 edit-guard** — if the guard fails open (allows edits on locked groups without the modal), the whole compliance story collapses. **I will add a test that deliberately bypasses the toolbar and dispatches a raw delete command, asserting the modal still triggers.**
4. **Shortcut collisions** — a fresh text-input collision would be embarrassing. **I will add an E2E test for each new shortcut that proves it is a no-op when a text input is focused.**
5. **JCAMP-DX encoding edge cases** — AFFN numbers with exponent notation break naïve parsers. **My fixtures include at least one AFFN file with `1.23E+04` notation.**

### 3.7 Suggested commit order (my review queue)

Same as Winston's dependency order. **I will block any commit that ships out-of-order**: P1-01 → P1-02 → P1-03 → P1-04 → P1-05 → P1-06.

---

## Cross-references

- Product plan (PM/BA/UX/TW): [`docs/product-plan-wave-4.md`](product-plan-wave-4.md)
- Pharma deep-dive: [`docs/pharma-deepdive-wave-4.md`](pharma-deepdive-wave-4.md)
- Benchmark v0.2.0: [`docs/benchmark-kendraw-vs-chemdraw-v0.2.0.md`](benchmark-kendraw-vs-chemdraw-v0.2.0.md)
- V6 review: [`docs/nmr-scientific-review-v6.md`](nmr-scientific-review-v6.md)
- Wave-3 report (reference style): [`docs/implementation-report-wave-3.md`](implementation-report-wave-3.md)
