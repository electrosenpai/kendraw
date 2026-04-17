# Pharma Deep-Dive — Wave-4

> Generated 2026-04-17 at the opening of the autonomous wave-4 session.
> Triggered by the V6 review verdict where pharma reviewer Dr. Layla
> AL-RASHID dropped her composite score from **7.0 (V5) → 6.8 (V6)**
> while every other panelist held steady or rose. This is the only
> negative delta in the V6 panel and is treated as a strategic signal,
> not noise.
>
> Panel: 5 reviewers — Dr. Layla **AL-RASHID** (returning, leads),
> plus four newly invited pharma specialists Dr. Fatima **AL-KHATIB**
> (Novartis R&D / med-chem / patents), Dr. Rajesh **KUMAR** (Sandoz
> QC / GMP / impurity profiling), Dr. Lucia **SANTOS** (Sanofi
> analytical / NMR-LIMS pipelines), Dr. James **REID** (ex-FDA
> regulatory / eCTD Module 3).
>
> Each contribution names features that exist in the codebase, names
> features that don't, and proposes a top-5 wave-4 priority list. The
> synthesis at the end consolidates demands across panelists.

---

## Table of contents

1. [Dr. Layla AL-RASHID — pharma R&D NMR (returning, leads)](#1-al-rashid)
2. [Dr. Fatima AL-KHATIB — Novartis R&D, med-chem, patents](#2-al-khatib)
3. [Dr. Rajesh KUMAR — Sandoz QC, GMP, impurity profiling](#3-kumar)
4. [Dr. Lucia SANTOS — Sanofi analytical, NMR-LIMS](#4-santos)
5. [Dr. James REID — ex-FDA regulatory, eCTD Module 3](#5-reid)
6. [Cross-cutting consensus and wave-4 backlog seed](#6-synthesis)

---

<a id="1-al-rashid"></a>

## 1. Dr. Layla AL-RASHID — pharma R&D NMR (returning, leads)

**Affiliation**: senior NMR scientist, mid-cap pharma R&D, Geneva.
**V5 score**: 7.0. **V6 score**: 6.8. **Delta**: −0.2.

### Why my score went down

I want to open this session by being honest about the −0.2 drop,
because the V6 doc itself reads it correctly: it is a strategic
signal, not a quality regression. Nothing in Kendraw became *worse*
between V5 and V6. The drawing editor is more polished, the property
panel is more useful, and wave-3 shipped 9 commits of solid work.
But across two consecutive waves (wave-2 + wave-3), **17 features
landed and zero of them were on the NMR panel I am responsible for
evaluating**. That is 100% of the development effort flowing away from
the dimension where Kendraw is supposed to be a research tool, not a
sketch tool. The score dropped because I am communicating that the
project is drifting away from research credibility — exactly the
warning the V6 narrative captured.

The single NMR-adjacent change in V6 was the integration curve
overlay on the ¹H spectrum. I appreciate it. But the curves are
visual only — there are no numeric integrals printed below or beside
each region, and the integration ratio I need to report (e.g. "the
aromatic region integrates to 5.0 H relative to the methyl singlet
set to 3.0 H") is not exposed. So a reviewer who only sees the
spectrum thinks integration is solved; in practice the *use case*
isn't.

### What works for me today

I tested the public V6 build for two real molecules from my last
quarter (a benzamide intermediate and a 2-aryl-pyrrolidine fragment)
and confirmed:

- ¹H prediction is in the right ballpark for both — aromatic
  multiplets in 7.2–7.6 ppm, the pyrrolidine N-CH₂ around 3.4 ppm
  with the right multiplicity. Within the ±0.2 ppm tolerance I
  expect from an additive method.
- ¹³C prediction lands the carbonyl correctly at ~167 ppm. DEPT
  classification (CH₃ / CH₂ / CH / C) is correct on every atom I
  spot-checked, including the quaternary aromatic carbons.
- Bidirectional atom ↔ peak highlighting is genuinely better than
  ChemDraw, which has nothing equivalent.
- Per-peak confidence (high / medium / low) with hover tooltips is
  the killer feature for me — I can immediately see which peaks I
  should not trust without running a real prediction.
- Multi-solvent support (CDCl₃, DMSO-d₆, CD₃OD, acetone-d₆, C₆D₆,
  D₂O) covers the six solvents I actually use.

### What is blocking pharma R&D adoption

**Blocker 1 — DEPT phasing.** The DEPT classification is in the
data model and the colour swatches are correct, but the spectrum
itself does not render DEPT-135 with the up/down phase convention
(CH and CH₃ up, CH₂ down, quaternary absent). Until that ships, a
medicinal chemist looking at the panel cannot do the visual
"read-the-DEPT" pattern recognition that takes 5 seconds in real
life. This is an S-effort UI polish that would unblock my entire
team. I will keep saying this until it ships.

**Blocker 2 — numeric integrals.** The integration curve in V6 is a
nice cosmetic but the actual integration ratio per multiplet region
is not printed. Add a small badge under each multiplet ("3.0 H",
"2.0 H", "5.0 H") tied to the proton-counting that already happens
in `assignments`. S-effort.

**Blocker 3 — resolved multiplets at 600 MHz.** Right now multiplets
are rendered as a single peak symbol with `m` if it's complex. At
high field a ddd splits cleanly into 8 lines and Kendraw should
render those 8 lines because that is what the user actually sees on
their spectrometer. The `nmr` package already convolves Pascal
intensities for dd / ddd — extend the renderer to draw the full line
list, not the symbol. M-effort.

**Blocker 4 — JCAMP-DX import + overlay.** I have ~3000 archived
spectra in JCAMP-DX format. I cannot upload them into Kendraw to
overlay against a prediction. Until I can do that, Kendraw is not
in my workflow — it sits next to it. Even read-only 1D import
covering the ¹H + ¹³C subset of the format would be enough to start.
M-effort.

**Blocker 5 — HOSE-code prediction.** The additive method is
honest but it is a 1990s technique. A curated HOSE-code database of
~5k assigned shifts (which exists publicly via NMRShiftDB) would
move the prediction RMSE from ~0.2 ppm to ~0.05 ppm on ¹H and from
~3 ppm to ~1 ppm on ¹³C. That is the difference between "directional
estimate" and "publishable in supplementary information". L-effort
because of the database curation, but a *staged* drop is feasible
within wave-4 (HOSE-1 only, ~500 entries).

### Top-5 wave-4 priorities I want to see shipped

1. **DEPT-135 up/down phasing in the spectrum renderer** (S, ~1 day).
2. **Numeric integrals + resolved multiplet line list with J tooltips** (M, ~3 days bundled).
3. **JCAMP-DX 1D import + overlay** (M, ~5 days).
4. **HOSE-code-1 prediction with curated 500-entry seed DB** (L, ~10 days but staged).
5. **Karplus equation for vinyl ³J + ring ³J** (M, ~3 days, would lift me from 6.8 to 7.5+ on its own).

If I see four of these five in V7, my score returns to 7.5+. If I
see all five, I move to 8.0. The path to 9.0 still requires 2D NMR
(COSY/HSQC/HMBC) — that is wave-5 conversation, not wave-4.

### One non-negotiable for the wave

Whatever else ships in wave-4, **at least one NMR feature must
land**. Two consecutive waves of zero NMR work was the trigger for
my −0.2. A third wave of zero NMR work and I will be at 6.0 or
below, regardless of how good the rest of the product gets, because
that is what the score is for — communicating priority drift.

---

<a id="2-al-khatib"></a>

## 2. Dr. Fatima AL-KHATIB — Novartis R&D, med-chem, patents

**Affiliation**: principal scientist, medicinal chemistry, Novartis,
Basel. Patent-portfolio drafting and SAR campaign lead.
**V6 first impression**: 6.5 / 10. Strong drawing core, **zero med-chem**
infrastructure. Cannot be deployed in a SAR group today.

### What works for me today

- Drawing speed is competitive with ChemDraw. The ring templates,
  fused-ring shortcuts, and bond-style hotkeys (`1 2 3 d w y`) are
  fluid. I can sketch a 6-membered ring with a wedge bond in <2 s.
- Stereochemistry ingestion from MOL V2000 is correct (wedge / dash
  preserved), and the SMILES round-trip preserves @/@@ atom-parity
  for the cases I tested.
- Property panel surfaces molecular formula, MW, LogP, tPSA, HBD/HBA,
  and Lipinski Ro5 — exactly the columns I need for a fragment
  prioritisation table.
- The CDXML import means I can pull in a legacy ChemDraw file from a
  collaborator. That alone is worth a lot.

### What blocks med-chem adoption

**Blocker 1 — Markush R-groups.** A medicinal chemist's daily
language is "the core scaffold with R₁ = aryl, R₂ = alkyl" rendered
as a single structure with substitution-position labels. Kendraw has
no R-group atom, no R-group enumeration table, no scaffold
abstraction. I cannot draw a SAR campaign at all. This is the
single biggest med-chem blocker. XL effort but the foundation
(Atom subtype `RGroup`) is small (~1 day); the enumeration UI is the
big lift.

**Blocker 2 — SAR grid layout.** Even without Markush, I need to
see 20 analogues side-by-side with their measured potency. ChemDraw
has the "Analyse SAR" view; Kendraw has a single canvas tab. A grid
mode where each cell holds one structure + a properties row would
turn Kendraw into something my team would fight to use. XL.

**Blocker 3 — automated R/S and E/Z descriptors.** Wedge/dash bonds
are *drawn* but the canonical descriptor (R/S at chiral centres, E/Z
at double bonds) is not computed and not displayed. I have to hand-
assign them in the figure caption, which is error-prone. RDKit will
give us this for free — surface it in the property panel and as an
optional atom label. M.

**Blocker 4 — IUPAC name / structure-to-name.** I need to drop a
structure into a patent draft and get its preferred IUPAC name. The
OPSIN library does name-to-structure (the inverse direction) and is
Java; structure-to-name needs IUPAC nomenclature engine — STOUT-NN
exists open-source. L.

**Blocker 5 — patent-ready export (USPTO Word + EPO TIFF).** A
patent figure has hard requirements: ≥300 dpi TIFF, monochrome,
specific font, specific bond thickness ratio. Kendraw exports SVG
and PNG but not the patent-format TIFF preset. M.

### Top-5 wave-4 priorities I want to see shipped

1. **R-group atom subtype + visual label (R₁, R₂, …)** (M for the atom; XL for full enumeration — ship the atom in wave-4, push the table to wave-5).
2. **R/S + E/Z descriptors auto-displayed** (M).
3. **InChIKey copy-to-clipboard from property panel** (S — InChIKey is already computed, just expose a one-click copy).
4. **Patent-grade TIFF export preset** (M).
5. **IUPAC name display in property panel via STOUT-NN** (L, can be a backend microservice).

A bare-bones med-chem mode after wave-4 puts me at 7.5; full SAR
grid + Markush enumeration is the path to 9+.

---

<a id="3-kumar"></a>

## 3. Dr. Rajesh KUMAR — Sandoz QC, GMP, impurity profiling

**Affiliation**: head of QC chemistry, Sandoz, Holzkirchen. GMP
batch release, impurity qualification, ICH Q3A/Q3B compliance.
**V6 first impression**: 5.5 / 10. The drawing engine is fine; the
**GxP infrastructure does not exist**. Cannot be used in a regulated
QC environment.

### What works for me today

- Structures draw cleanly. Property panel computes MW exact mass with
  monoisotopic precision — useful for MS-based impurity ID.
- Multi-tab workspace lets me hold an API plus its 5 known
  impurities in adjacent tabs without confusion.
- The IndexedDB auto-save means I do not lose work to a browser crash
  — important in a long impurity-table session.
- No telemetry, no outbound calls. This is non-negotiable in QC and
  Kendraw nails it.

### What blocks GMP / 21 CFR Part 11 adoption

**Blocker 1 — audit trail.** Every edit in a GMP-regulated tool must
record *who* did *what* on *which record* at *which timestamp* with
*which reason*. Kendraw has none of this. The scene store undoes via
in-memory history but no append-only log persists to disk. Without
an audit trail, no regulated lab will use Kendraw — period. M effort
for an honest MVP (per-edit log row in IndexedDB + JSON export); the
*compliant* version with cryptographic chaining is L.

**Blocker 2 — record lock + version pinning.** Once a structure is
"signed off" in QC, it must be locked: no further edits, no silent
corrections. Kendraw's `Group.locked` boolean exists in the type
system but is never wired to the UI. Wire it: a "lock record" button
in the toolbar, locked structures render with a padlock badge, all
edit commands are blocked with a toast. M.

**Blocker 3 — electronic signature (e-sig) ceremony.** 21 CFR Part
11 requires a 2-component signature (user identity + intent), printed
on every signed record, stored with the record. Even an MVP with
local-only username + timestamp + reason-string would be a
foundation we can iterate on. L for a proper one; S for the MVP
we'd document as "Beta — foundational e-sig, full compliance pending".

**Blocker 4 — reason-for-change modal.** Every edit *after* a record
is locked must capture a reason ("typo correction", "regulatory
revision", etc.). This is the same modal pattern as the e-sig and
should ship together. S.

**Blocker 5 — impurity metadata + Certificate of Analysis (CoA) PDF/A-3.**
For each impurity I track: ID code, structure, MW, source (API
synthesis / degradation / process), threshold (qualification/
identification/reporting per ICH Q3A). None of this metadata can
attach to a Kendraw structure. Add a "QC metadata" panel + a PDF/A-3
CoA export bundle (PDF + embedded MOL + embedded NMR JSON). L.

### Top-5 wave-4 priorities I want to see shipped

1. **Append-only audit trail per edit** (M, MVP: JSON-lines in IndexedDB; compliant: chained hash later).
2. **Wire `Group.locked` to a lock button + padlock badge + edit-block** (S — the scene field already exists).
3. **E-sig modal with username + timestamp + reason** (S MVP).
4. **Reason-for-change modal on edits to locked records** (S).
5. **Impurity metadata fields (ICH Q3A categories) + CoA PDF/A export** (L).

If wave-4 ships items 1–4 (the GxP foundation), I move from 5.5 to
7.0 even with zero CoA work, because that's the threshold that lets
me run a pilot in a non-regulated R&D group.

### Important framing — honest MVP vs full compliance

I do not expect Kendraw to be 21 CFR Part 11 *certified* this wave.
Certification is a 6-month audit. What I need is the **architectural
hooks** in place — audit trail, lock, e-sig — clearly documented as
"Beta: foundational audit trail, full compliance pending vendor audit".
That's an honest MVP and it's worth more than a slick demo of features
my regulators won't let me use.

---

<a id="4-santos"></a>

## 4. Dr. Lucia SANTOS — Sanofi analytical, NMR-LIMS pipelines

**Affiliation**: principal analytical chemist, Sanofi, Vitry-sur-Seine.
NMR / MS / HPLC method development; LIMS integration; QC release
spectra.
**V6 first impression**: 6.7 / 10. NMR prediction is good for
*assignment confirmation* but the **import/export pipeline is broken**
for analytical chemistry — Kendraw produces spectra it cannot consume.

### What works for me today

- ¹H + ¹³C prediction quality is sufficient for "is this the right
  isomer?" yes/no decisions on synthesis intermediates.
- The CSV export of the signal table is exactly the columns I need
  for a method-validation appendix.
- The PNG/SVG export gives me publication-grade plots without leaving
  the browser. ChemDraw forces a screenshot; Kendraw is strictly
  better here.
- No telemetry. Sanofi compliance loves this.

### What blocks analytical adoption

**Blocker 1 — JCAMP-DX 1D import.** Same as Al-Rashid's #4. I have
20 years of archived ¹H + ¹³C spectra in JCAMP-DX. I cannot get them
into Kendraw to overlay against a synthesis target's prediction.
Without overlay, Kendraw is a teaching tool, not an analytical tool.
L for proper Bruker-style overlay; M for a basic peak-list import.

**Blocker 2 — peak assignment CSV/XLSX (round-trip).** I need to
export the assignment table (atom number → peak ppm → multiplicity →
J-couplings → confidence) as CSV/XLSX, edit it in Excel with my
analyst team's hand-corrections, then re-import the corrected
assignments back into Kendraw. Today the export exists but the
*re-import* path doesn't — corrections are lost. M.

**Blocker 3 — CoA NMR PDF.** When I release a batch, the CoA PDF
includes the ¹H spectrum + assignment table + analyst signature.
Kendraw can produce the spectrum image and the table CSV
*separately* but not as one PDF report. Add a "NMR report PDF"
export button bundling spectrum + table + structure + metadata
header. M.

**Blocker 4 — Bruker Topspin folder import.** Topspin is the
de-facto NMR processing software; spectra live in folder structures
with 1r/1i/acqus/procs files. Direct folder import would pull spectra
straight from the spectrometer without a JCAMP-DX export step. XL —
needs the Bruker raw-data parser.

**Blocker 5 — audit trail + e-sig (analytical context).** Same
demand as Kumar but for analytical workflows: spectrum + assignment
must be signable/lockable for inclusion in a registered method.
Re-using Kumar's GxP infrastructure once it exists. L.

### Top-5 wave-4 priorities I want to see shipped

1. **JCAMP-DX 1D import + overlay** (L, but co-shippable with Al-Rashid's blocker 4).
2. **Peak assignment CSV/XLSX round-trip (export + import)** (M).
3. **CoA NMR PDF bundle (spectrum + table + structure + header)** (M).
4. **Audit trail + e-sig (shared with Kumar's stack)** (L, shared dependency).
5. **Bruker Topspin folder import** (XL — explicit wave-5 push).

Items 1–3 lift my score to 8.0. Item 4 is the gate that lets Kendraw
into the regulated method-validation lifecycle (8.5+).

---

<a id="5-reid"></a>

## 5. Dr. James REID — ex-FDA regulatory, eCTD Module 3

**Affiliation**: regulatory consultant; 15 years FDA/CDER reviewer
(Module 3 chemistry); now consults on eCTD submissions for small/mid
pharma.
**V6 first impression**: 5.8 / 10. The chemistry is correct; the
**submission pipeline does not exist**. A regulatory writer cannot
hand a Kendraw output to a publishing vendor today.

### What works for me today

- Chemistry is accurate. I checked five test molecules' SMILES,
  InChI, InChIKey against PubChem — all match.
- The structure-property panel shows everything I'd want pre-filled
  in Module 3.2.S.1.1 (nomenclature, structure, general properties).
- PNG/SVG export is high-quality. SVG is the right vector format for
  embedding in submission Word docs.

### What blocks regulatory submission adoption

**Blocker 1 — CDXML round-trip (export side).** Reviewers and
publishing vendors expect ChemDraw `.cdx` or `.cdxml` files because
that's the legacy interchange format for chemistry. Kendraw imports
CDXML but does not export it. This means a writer cannot send a
Kendraw structure to a CRO that uses ChemDraw — the structure has
to be redrawn. **Single biggest regulatory blocker.** XL because
CDXML's full schema is large; an MVP exporting just atoms + bonds +
stereo wedges (~80% of submission content) is L.

**Blocker 2 — PDF/A-1b export with XMP metadata.** Submission PDFs
must be PDF/A-1b for archival. Kendraw exports normal PDF (A4
landscape) — needs the /OutputIntent + XMP block to qualify as
PDF/A-1b. Without it, the submission is rejected at the publishing
gate. L.

**Blocker 3 — structured metadata autoblock (CAS / USAN / IUPAC /
InChI / InChIKey).** Module 3.2.S.1.1 starts with a metadata block
that lists every name and identifier for the API. Kendraw computes
InChI / InChIKey already. Add CAS lookup (PubChem CID → CAS), USAN
(if present), IUPAC (via the same OPSIN/STOUT-NN as Al-Khatib's
ask), and render as a copy-paste-ready block. M.

**Blocker 4 — synthesis route scheme tool.** Module 3.2.S.2.2
requires a multi-step synthesis scheme with reaction arrows
connecting numbered intermediates. Kendraw has reaction arrows but
no "scheme layout" mode that auto-numbers intermediates and arranges
them in a publication grid. L.

**Blocker 5 — impurity profile table aligned to ICH Q3A/Q3B.** Same
ask as Kumar's #5 but framed for Module 3.2.S.3.2. The output is a
structured impurity table with thresholds, structures, and
qualification status. Co-deliver with Kumar's CoA work. L.

### Top-5 wave-4 priorities I want to see shipped

1. **CDXML export — atoms + bonds + stereo wedges MVP** (L, the single biggest unblock).
2. **PDF/A-1b export with XMP metadata** (L).
3. **Structured metadata autoblock (CAS / USAN / IUPAC / InChI / InChIKey)** (M — InChIKey is free, others need lookup).
4. **Synthesis route scheme tool with auto-numbered intermediates** (L).
5. **Impurity profile table aligned to ICH Q3A/Q3B** (L, co-shippable with Kumar's CoA).

Items 1–3 lift Kendraw out of the "drawing tool" category into
"submission-adjacent tool" — score moves from 5.8 to 7.5.

### Reality-check note

The regulatory ask is heavy because the regulatory bar is heavy.
None of this is achievable in a single wave at full compliance.
**An honest MVP that ships CDXML export + PDF/A + metadata
autoblock + a documented "Beta: foundational submission support,
not yet vendor-validated" disclaimer is the right call** — same
framing as Kumar's GxP MVP. Don't try to ship a fully compliant
eCTD pipeline this wave; ship the architectural foundation honestly
and iterate.

---

<a id="6-synthesis"></a>

## 6. Cross-cutting consensus and wave-4 backlog seed

### 6.1 Consensus tier table

Each row records the panelists who explicitly demanded the feature
in their top-5. Tier groups by demand intensity.

| # | Feature | Al-Rashid | Al-Khatib | Kumar | Santos | Reid | Demanders | Tier |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **JCAMP-DX 1D import + overlay** | ✓ | | | ✓ | | 2 | T1 |
| 2 | **Audit trail (per-edit log)** | | | ✓ | ✓* | | 2 (+1 indirect) | T1 |
| 3 | **Record lock + e-sig + reason-for-change** | | | ✓ | ✓* | | 2 (+1 indirect) | T1 |
| 4 | **CDXML export (round-trip)** | | ✓* | | | ✓ | 2 (+1 indirect) | T1 |
| 5 | **DEPT-135 up/down phasing in spectrum** | ✓ | | | | | 1 (critical, NMR) | T1 |
| 6 | **Numeric integrals + multiplet line list + J tooltips** | ✓ | | | | | 1 (critical, NMR) | T1 |
| 7 | **R/S + E/Z auto descriptors** | | ✓ | | | | 1 | T2 |
| 8 | **InChIKey copy-to-clipboard** | | ✓ | | | ✓ | 2 | T2 |
| 9 | **HOSE-code prediction (curated DB)** | ✓ | | | | | 1 | T2 |
| 10 | **Karplus ³J vinyl + ring** | ✓ | | | | | 1 | T2 |
| 11 | **R-group atom subtype + Markush enumeration (XL)** | | ✓ | | | | 1 | T2 |
| 12 | **PDF/A-1b export + XMP metadata** | | | | | ✓ | 1 | T2 |
| 13 | **Structured metadata block (CAS/USAN/IUPAC/InChI)** | | ✓ | | | ✓ | 2 | T2 |
| 14 | **Patent-grade TIFF export preset** | | ✓ | | | | 1 | T3 |
| 15 | **IUPAC name display via STOUT-NN** | | ✓ | | | ✓* | 1 (+1 indirect) | T3 |
| 16 | **Peak assignment CSV/XLSX round-trip** | | | | ✓ | | 1 | T3 |
| 17 | **CoA NMR PDF bundle** | | | ✓* | ✓ | | 1 (+1 indirect) | T3 |
| 18 | **Synthesis route scheme tool** | | | | | ✓ | 1 | T3 |
| 19 | **Impurity profile table (ICH Q3A/Q3B)** | | | ✓ | | ✓ | 2 | T3 |
| 20 | **SAR grid layout (XL)** | | ✓ | | | | 1 | T4 |
| 21 | **Bruker Topspin folder import (XL)** | | | | ✓ | | 1 | T4 |

`*` = mentioned in body even if not in the explicit top-5 list.

### 6.2 Tier definitions

- **T1 — must-fix wave-4**: ≥2 demanders OR single demander with
  veto power (Al-Rashid on NMR; Reid on regulatory blockers; Kumar
  on GxP). All T1 items together form the wave-4 P1 backlog.
- **T2 — strongly desired wave-4**: 1–2 demanders, technically
  reasonable for the wave, would lift composite scores by ≥0.3.
- **T3 — wave-4 if capacity allows, else wave-5**: clear demand,
  but L-effort or shareable with already-shipping work.
- **T4 — wave-5+**: explicit XL effort or external dependency.

### 6.3 Pharma-prioritized wave-4 P1 backlog (T1 expansion)

The 6 T1 items, each a standalone deliverable for Act 5:

| ID | Title | Effort | Primary owner agent | Score impact |
|---|---|:---:|---|---|
| **P1-01** | DEPT-135 up/down phasing in NMR spectrum renderer | S | Amelia | Al-Rashid +0.3, Santos +0.2 |
| **P1-02** | Numeric integrals + resolved multiplet line list + J-tooltips | M | Amelia | Al-Rashid +0.4 |
| **P1-03** | JCAMP-DX 1D import + spectrum overlay (read-only) | M | Amelia | Al-Rashid +0.5, Santos +0.5 |
| **P1-04** | Append-only audit trail (JSON-lines in IndexedDB + export) | M | Amelia | Kumar +0.6, Santos +0.3, Reid +0.4 |
| **P1-05** | Record lock + e-sig modal + reason-for-change modal (MVP) | M | Amelia | Kumar +0.5, Reid +0.3 |
| **P1-06** | CDXML export — atoms + bonds + stereo wedges MVP | L | Amelia | Reid +0.7, Al-Khatib +0.3 |

**Total P1 effort estimate**: 1×S + 4×M + 1×L = roughly 12–15
engineering-days for one developer. This is 6 commits, one per item,
each gated by the 7-check pre-commit hook.

### 6.4 Reality check

Six items all qualified as T1 by 5 different specialists is genuine
consensus, not arbitrary selection. The risk is that an L-effort
item (P1-06 CDXML export) eats half the wave's budget. **Mitigation:**
ship P1-06 as a documented MVP — atoms + bonds + wedges only — with
an explicit "Beta: Wave-4 MVP — text annotations, brackets, and
non-rectangular stereo objects deferred to wave-5" footer in the
exporter and the README. Same pattern applies to P1-04 / P1-05:
honest "Beta: foundational audit trail / e-sig, full 21 CFR Part 11
compliance pending vendor audit" disclaimer.

### 6.5 Honest framing for the wave-4 release notes

The release notes for V0.4 should open with one paragraph the panel
agreed on:

> *"Wave-4 is the pharma wave. Six features ship across NMR
> spectroscopy, regulated-environment audit infrastructure, and
> ChemDraw round-trip interoperability. Each is an honest MVP — the
> minimum viable foundation in its category, with the path to full
> compliance documented. We are not certifying Kendraw under 21 CFR
> Part 11 this wave. We are giving regulated labs the architectural
> hooks they need to start a pilot."*

That framing is what unblocks the demand without overpromising.

---

## Appendix — direct quotes for the implementation team

- **Al-Rashid**: *"At least one NMR feature must land this wave. A
  third wave of zero NMR work and I will be at 6.0 or below."*
- **Al-Khatib**: *"InChIKey copy-to-clipboard is a 1-line wire-up
  and would lift my workflow tomorrow."*
- **Kumar**: *"`Group.locked` already exists in the type system. Wire
  it. The hardest part is already done."*
- **Santos**: *"Co-ship JCAMP-DX import with Al-Rashid's spectrum
  overlay — it's the same parser."*
- **Reid**: *"CDXML export, even an 80% MVP, ends the deal-breaker."*

These five quotes are the wave-4 thesis statement. They will reappear
in the release notes for V0.4.
