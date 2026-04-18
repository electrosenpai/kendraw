# V7 PM Audit — John, Senior PM (2026-04-18)

Inputs: `v7-expert-briefs.md`, `README.md`, `benchmark-vs-chemdraw-v0.2.0.md`.
Scope: public-beta go/no-go + landing-page positioning.

## 1. Vendable in current state? CONDITIONAL.

**Public Beta — YES. Paid/enterprise — NO.** Greenlight a free, clearly-
labelled beta. Don't monetize, don't pitch regulated lanes, don't announce
until 4 conditions below are met (~1 sprint):

1. **Observability minimum** — Sentry FE+BE, UptimeRobot on `/health`,
   Traefik rate-limit on `/predict` and `/nmr`. Weber V6 P1 still
   unshipped at V7. Without this, first viral spike kills RDKit workers
   silently and we lose the launch.
2. **README honesty pass** — drop "successor to ChemDraw" hero claim;
   replace with "open-source ChemDraw-style editor, ~63% surface
   coverage". Move "Compliance primitives" out of Features into a
   separate "Experimental" block with explicit "tamper-evident, NOT
   non-repudiation; not a 21 CFR Part 11 deployment" caveat.
3. **`VITE_ENABLE_NEW_CANVAS` stays default-OFF.** Wave-7 toolbox just
   shipped 6 hotfixes in 24h. Opt-in only for public beta.
4. **Feedback channel live** — GitHub issue templates + single contact
   email or Discord. Beta means we collect signal.

Why not GA: 0/10 on GxP rubric, 242 backend tests frozen across 3
reviews, Al-Rashid V6 = 6.8 (only negative delta), no observability, no
rate limit, no impurity-peak workflow, no HOSE codes, no 2D NMR.
Surface today is "drawing + 1D NMR teaching/research-lite", not
"ChemDraw replacement".

---

## 2. Beta messaging — 2-line pitch

> **Kendraw — the open-source chemistry sketcher with NMR built in.**
> Draw structures and predict ¹H/¹³C spectra in your browser. MIT,
> private, free forever. Public beta.

Confident on what works (drawing, 1D NMR, privacy, MIT), modest on
scope (beta). Avoids the "ChemDraw killer" framing Al-Rashid would tear
apart on Twitter.

---

## 3. Top 3 landing-page use cases

Ranked by defensibility — demo-able today, expert-validated.

1. **"Free, private chemistry sketcher for university teaching."**
   Volkov 9.6, Yamamoto 9.1. ChemDraw site licenses are
   $1k–3k/seat/year; Kendraw is MIT, runs offline, no account. Proton
   numbering, group labels, reaction arrows, dark mode, 31/35 ChemDraw
   shortcuts. Strongest, least-contested pitch.
2. **"NMR prediction with confidence markers and JCAMP overlay — for
   structure-elucidation training and lab-notebook sketches."** Wave-4
   shipped DEPT-135/90, multiplet line-list tooltip, JCAMP-DX import +
   exp-vs-pred overlay, integration trace. The 14 enumerated
   "objectively superior to ChemDraw" items cluster here. Frame as
   teaching/exploration, not structure-confirmation.
3. **"Self-hostable, telemetry-free chemistry stack for privacy-
   conscious labs and academic IT."** Docker Compose + Traefik, no
   outbound calls except explicit PubChem, MIT. Strong fit for EU labs,
   RGPD-sensitive groups, vendor-lock-burned institutions. Weber V6 =
   9.4 with reservations — solve observability before leaning hard.

---

## 4. Use cases to AVOID promising in beta

1. **"21 CFR Part 11 / FDA submission documentation."** Tamper-evident,
   not non-repudiation. No per-user identity, no IndexedDB persistence,
   no AuditLogPanel, no server-side lock, no PDF/A-1b. Saying "GxP-
   ready" gets us sued by the first pharma that ships a deviation.
2. **"ChemDraw replacement for medicinal chemistry / SAR / patent
   work."** No HOSE codes, no Markush/R-group enumeration, no SAR grid,
   no 2D NMR, no V3000, no patent-grade TIFF, no auto R/S + E/Z.
   Al-Rashid: NO-GO for research-grade beta in pharma. Do not bait.
3. **"Production CDXML round-trip with ChemDraw libraries."** CDXML
   export ships as Beta MVP — atoms+bonds+wedges+arrows+rich text only.
   R-groups, Markush attachment points, full stereo beyond wedge/hash,
   binary CDX — all NOT shipped. Promise "open with ChemDraw 21+", not
   "round-trip your team's existing CDX library".

---

## 5. Top 5 GTM risks (ranked by severity)

1. **Launch-day capacity collapse** (critical). Zero rate limit on
   `/predict`/`/nmr`, no Sentry/UptimeRobot. One HN front-page saturates
   RDKit workers silently. **Fix**: 3 days of Weber V6 P1 pre-announce.
2. **Pharma reputational hit** (high). If anyone reads "Compliance
   primitives" and pitches Kendraw to a QA director, the first audit
   kills the brand permanently in that segment. **Fix**: condition #2 +
   bold "Experimental, not for regulated use" in audit-trail Beta UI.
3. **"Half-finished ChemDraw clone" framing** (high). 63% coverage isn't
   headline-worthy alone. Without crisp positioning around the 14
   superior items (NMR confidence, atom↔peak, MIT, privacy), HN/Reddit
   dismisses us as "Ketcher with extra steps". **Fix**: lead with NMR +
   privacy + free, not parity.
4. **Canvas-new regression on first contact** (medium-high). Wave-7
   just shipped 6 hotfixes. Default-OFF stays — but a curious user
   flipping the flag and hitting a regression outside the 23-test suite
   lands publicly. **Fix**: hide the flag from UI for v0.3; doc-only.
5. **NMR credibility erosion** (medium). Backend pytest frozen at 242
   since V5; Chen 8.2 flat, Al-Rashid −0.2. Shipping NMR UX without
   NMR science. If a comp-chem user runs us against NMRShiftDB2 and
   blogs the MAE, we have nothing to point to. **Fix**: publish a short
   NMR validation page (V5/V6 reviews + MAE on 50-compound set +
   "do not use for structure confirmation" guidance).

---

## TL;DR

Ship public beta behind 4 conditions (observability + README honesty are
load-bearing). Position: free + private + NMR-rich teaching/sketching —
not ChemDraw, not GxP, not medchem/patent. Biggest risk: capacity
collapse day one (fix in 3 days). Biggest opportunity: academic
teaching; ChemDraw site licenses are an open wound.
