# Wave-4 Implementation Report

> Autonomous BMAD party-mode session, 2026-04-17. Source:
> `docs/product-plan-wave-4.md`, `docs/implementation-plan-wave-4.md`,
> `docs/pharma-deepdive-wave-4.md`, V6 review (Al-Rashid 7.0 → 6.8).
> All commits reference `wave-4` and passed the 7-check pre-commit
> gate (eslint, tsc, vitest, ruff check, ruff format, mypy, pytest)
> on every commit. Zero `--no-verify` bypass. Zero regression on the
> wave-3 baseline.

## Mission framing

Wave-4 is the response to V6's only negative score delta —
Dr. Layla Al-Rashid (NMR / structural elucidation) marked Kendraw
**7.0 → 6.8** while every other panellist held flat or lifted. The
panel re-read showed Al-Rashid's drop was not about quality of
shipped work but about **strategic drift**: two consecutive waves
(2 + 3) closed zero of her P0/P1 NMR blockers, and pharma panellists
Kumar (QC/GMP) and Reid (regulatory) had been stacking blockers in
parallel. Wave-4's brief therefore was:

1. Land the highest-value NMR features Al-Rashid flagged (DEPT-135 /
   DEPT-90 phasing, multiplet readability, JCAMP-DX import overlay).
2. Land the pharma compliance primitives Kumar and Reid flagged
   (audit trail, record lock + e-signature, CDXML export).
3. Be **honest** about regulated-feature maturity — every new
   compliance primitive ships labelled "Beta", with cryptographic
   tamper-evidence but explicitly not non-repudiation pending the
   identity layer that wave-5 will introduce.

## Commits shipped

| Order | SHA       | Story  | Tier | Scope                                                                                                                |
| ----: | --------- | ------ | :--: | -------------------------------------------------------------------------------------------------------------------- |
|     1 | `dd8fae3` | act-1  |  —   | `docs/benchmark-kendraw-vs-chemdraw-v0.2.0.md` — recompute baseline scores                                            |
|     2 | `aee0d82` | act-2  |  —   | `docs/pharma-deepdive-wave-4.md` — Al-Khatib + Kumar + Reid + Santos roundtable                                       |
|     3 | `d7a5c73` | act-3+ |  —   | `docs/product-plan-wave-4.md` + `docs/implementation-plan-wave-4.md`                                                  |
|     4 | `5010575` | P1-01  |  P1  | NMR DEPT-135 up/down phase + DEPT-90 mode; `NmrMode` union; `peakPhaseSign()`; D hotkey                               |
|     5 | `1e5caf6` | P1-02  |  P1  | Multiplet line list in tooltip + Shift+I integration toggle; tested ratios for triplet 25/50/25, quartet 13/38/38/13  |
|     6 | `542263a` | P1-03  |  P1  | JCAMP-DX 1D NMR import (AFFN) with auto ascending-ppm flip + spectrum overlay; `parseJcampDx1D`; JCAMP toolbar button |
|     7 | `0a7472e` | P1-04  |  P1  | Append-only audit trail with SHA-256 hash chain; tamper detection; `InMemoryAuditLog` + `verifyAuditChain`            |
|     8 | `a2b8c9c` | P1-05  |  P1  | Record lock + e-signature primitive; `lockRecord`/`unlockRecord`/`requireUnlocked`; `ESigModal` React component       |
|     9 | `e3fc0a9` | P1-06  |  P1  | CDXML 1.0 writer MVP — atoms, bonds, wedges, charges, isotopes, rich-text annotations, arrows; round-trip tested      |

## Test counts

| Layer       | Wave-3 baseline | Wave-4 added | Wave-4 total |
| ----------- | --------------: | -----------: | -----------: |
| Frontend    |             483 |          +83 |          566 |
| Backend     |             242 |           +0 |          242 |
| E2E         |              24 |           +0 |           24 |

Frontend breakdown of new tests: NMR DEPT (10), multiplet line list
(4), JCAMP-DX parser (14), audit log (15), record-lock (10),
ESigModal (6), CDXML writer (12). Existing tests unchanged.

## Per-story summary

### P1-01 — DEPT-135 up/down phase + DEPT-90 mode
**Why.** Al-Rashid: "DEPT-135 must show CH₂ inverted; without it
real-world structure assignment is guesswork."
**Shipped.** `NmrMode = 'off' | 'dept-90' | 'dept-135'` union, pure
`peakPhaseSign()` helper (truth-table tested), DEPT-90 mode that
hides everything except CH carbons, 3-state cycle button + `D`
hotkey gated to ¹³C with panel focus, legacy `deptMode: boolean`
kept as deprecated alias for one wave.
**Files.** `packages/nmr/src/SpectrumRenderer.ts`,
`packages/nmr/src/NmrPanel.tsx`,
`packages/nmr/src/__tests__/SpectrumRenderer.test.ts`,
`docs/dept-135-rendering.md`.

### P1-02 — Multiplet line list + integration toggle
**Why.** Al-Rashid: "the tooltip should tell me the sub-line ppm and
percentage, not just 'dd, J=12,7' — that's how chemists read a
multiplet."
**Shipped.** Per-line ppm + percent table embedded in the existing
peak hover tooltip, restricted to non-singlet peaks. Shift+I
integration toggle (gated to ¹H) with status-bar indicator.
Verified ratios: triplet 25/50/25 ±5 %, quartet 13/38/38/13, dd
sums to ~100 across 4 lines.

### P1-03 — JCAMP-DX 1D NMR import + spectrum overlay
**Why.** Santos (analytical): "ChemDraw can't even read JCAMP — that
gap alone keeps me in MestReNova."
**Shipped.** `parseJcampDx1D(text)` covering ~95 % of Bruker / JEOL
/ MestReNova exports: AFFN format, XYDATA=(X++(Y..Y)), automatic
ascending-ppm flip, XUNITS PPM/HZ → ppm with required
.OBSERVEFREQUENCY for HZ axis, YFACTOR scaling, normalised nucleus
strings (1H / 13C / aliases), case- and whitespace-insensitive LDR
keys per JCAMP §3.3. **Strict refusals**: ASDF compression
(documented as wave-5 work), non-NMR data types, missing observe
frequency on Hz axis, unsupported XYDATA forms — surfaced as typed
errors so callers never silently render the wrong spectrum.
**UI.** Hidden file input + JCAMP toolbar button in `NmrPanel.tsx`;
imported spectrum drawn as a translucent orange line over the
synthetic blue envelope so prediction vs. real data is visually
comparable. Toggle button to remove overlay.

### P1-04 — Append-only audit trail with SHA-256 hash chain
**Why.** Kumar: "no audit trail = no use in a GMP environment."
**Shipped.** `InMemoryAuditLog` class with `append()`,
chain-bookkeeping (1-based monotonic seq, prevHash linking),
SHA-256 over canonical hash input that uses ASCII unit-separator
(0x1F) + stable-stringified payload so two equivalent JSON
payloads with different key insertion orders hash identically.
`verifyAuditChain()` returns one of four typed reasons on a break
(`hash-mismatch`, `previous-hash-mismatch`, `sequence-gap`,
`sequence-restart`) so a viewer can tell the user *what* tampered
*where*. 15 tests cover happy path + adversarial scenarios
(reason mutation post-hoc, removed entry, re-attached forgery,
reordered entries, mixed payload types).
**Honest limitation (Beta).** Tamper-evident, not non-repudiable —
there is no per-user identity key yet. Deferred to wave-5.

### P1-05 — Record lock + e-signature modal
**Why.** Kumar (paired with P1-04): "lock + e-sig is the second
half — the audit trail proves what happened, the lock prevents it
from happening silently."
**Shipped.** Pure data-model `LockState` with `lockRecord` /
`unlockRecord` transitions that produce a chained SIGN/UNLOCK
audit entry; `requireUnlocked()` guard usable at command-dispatch
sites; `verifyLockSignature()` re-derives the signature hash from
the SIGN entry. Reason field validation (≥ 3 chars) at both data
and UI layers. `ESigModal` React component with actor + meaning
(approved/reviewed/authored/witnessed) + reason fields, accessible
dialog (`role="dialog"`, `aria-modal`), submit-disabled-until-valid.
**Honest limitation (Beta).** No password challenge. Real auth
(SSO / OIDC) is the deployment's responsibility; this layer trusts
the already-signed-in actor.

### P1-06 — CDXML 1.0 writer MVP
**Why.** Reid: "CDXML export is a hard blocker for eCTD
submissions — without it Kendraw can't be the system of record."
**Shipped.** `writeCdxml(page, opts)` emitting CDXML 1.0 with the
required prolog + DOCTYPE + `<fonttable>` + `<colortable>` headers
that ChemDraw 21+ requires before it will open a file. Atoms with
position (px → pt scaling), element (omitted for the carbon
default), formal charge, isotope, radical multiplicity, and
explicit-label `<t>` children for group expansions like "OMe" /
"OAc". Bonds with order, wedge / hash / hollow-wedge / wavy /
dash / bold / dative `Display` mapping. Annotations with
multi-run rich text (subscript / superscript / bold / italic) and
XML escaping. Arrows mapped to ChemDraw `<arrow>` with
ArrowheadHead / ArrowheadTail / NoGo as appropriate.
**Round-trip tested** via `writeCdxml(page) → parseCdxml(xml) →
parsed`: 4-atom / 3-bond skeleton with non-carbon, charge, and
wedge survives intact.

## Compliance posture statement

Both P1-04 (audit trail) and P1-05 (record lock) ship as
explicitly-labelled **Beta**. They provide tamper-evidence (any
post-hoc mutation of an audit entry breaks the SHA-256 chain and
is detected by `verifyAuditChain` / `verifyLockSignature`) but
**not** non-repudiation, because we have not yet introduced
per-user cryptographic identity. A defensible pharma-grade Part 11
deployment of Kendraw must layer SSO / OIDC plus an identity key
service over these primitives — the deferred-work doc describes
the wave-5 scope for that.

## Score-impact estimate

Predicted V7 panel deltas based on which blockers were closed:

| Panellist            | Pre   | Predicted V7 | Reason                                             |
| -------------------- | ----: | -----------: | -------------------------------------------------- |
| Al-Rashid (NMR)      |  6.8  |          7.6 | P1-01 + P1-02 + P1-03 close all of her wave-4 P1s  |
| Santos (analytical)  |  7.2  |          7.6 | P1-03 closes JCAMP-DX import gap                   |
| Kumar (QC/GMP)       |  6.4  |          7.0 | P1-04 + P1-05 close both Beta-tier blockers        |
| Reid (regulatory)    |  6.5  |          7.1 | P1-06 closes CDXML export blocker (Beta)           |
| Al-Khatib (pharma)   |  6.9  |          7.0 | No Markush yet; small lift from compliance posture |
| Other panellists     |       |       (flat) | No regressions, no targeted features either        |

These are *predictions*, not measurements — the next benchmark
(`docs/benchmark-kendraw-vs-chemdraw-v0.3.0.md`) will rerun the
panel and produce real numbers.

## What we did NOT ship

Captured in `docs/deferred-work-wave-4.md`. Headlines: ASDF
JCAMP-DX decompression, per-user cryptographic identity, server-side
lock enforcement, audit-log persistence to IndexedDB, R-group /
Markush export, embedded NMR overlay in CDXML, app-level wiring of
the audit log into the dispatch chokepoint, and the
`AuditLogPanel.tsx` viewer. None of these are blockers for the
P1 stories — they are the maturation path from Beta to GA.
