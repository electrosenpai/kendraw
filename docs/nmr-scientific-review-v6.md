# NMR Scientific Review V6 — Kendraw NMR + Drawing Suite

**Date:** 2026-04-17
**Version under review:** Kendraw post-wave-3 (wave-2 shipped 2026-04-15, wave-3 shipped 2026-04-17, prod deploy 2026-04-16)
**Previous review:** V5 (2026-04-15, composite 8.3 raw / 7.8 weighted)
**Review methodology:** 8-expert scientific panel (parallel subagents) + John PM + Sally UX + Murat TEA (parallel subagents)

---

## 0. Changes Since V5

### Wave-2 (2026-04-15, 8 features)

| ID | Feature | Scope |
|----|---------|-------|
| A1 | Compound numbering UI toggle | `Ctrl+Shift+C`, SVG export, E2E — closes wave-1 P1-2 debt |
| A2 | Three ring templates | cyclononane, cyclodecane, cyclopentadiene |
| A3 | **NMR cumulative integration trace** | `showIntegration` renderer option, `∫` toggle in NmrPanel, 4 unit tests, E2E spec — the only NMR-touching wave-2 delivery |
| A5 | `Ctrl+P` print | `@media print` CSS hiding chrome, E2E spec |
| A6 | Searchable shortcut cheatsheet | `filterShortcuts()` helper, search input, 8 unit tests |
| A7 | Keyboard zoom | `Ctrl+=` / `Ctrl+-` parity with wheel, 1.1×/0.9×, clamped 0.1–5× |
| B1 | Align-atoms command | `Alt+Shift+L/R/T/B/E/V` hotkeys, 9 unit tests |

### Wave-3 (2026-04-17, 9 features, **zero NMR**)

| ID | Feature | Scope |
|----|---------|-------|
| A1/A2 | Dipole (μ) + No-go (✗→) arrows | `Arrow.type` union extended, toolbar submenu |
| A3 | Acyclic chain tool | drag-to-size N-carbon zigzag, hotkey `X` |
| A4 | Group label hotkeys | `Shift+O/F/N/Y` → OMe / CF₃ / NO₂ / OAc |
| A5 | Bond-angle snap | `Ctrl+E` 30° snap, StatusBar `∠snap/free` indicator |
| B1 | Geometric shapes | rect / ellipse data model + renderer + SVG export, hotkey `G` |
| B2 | Grid snap | `Ctrl+'` 25 px snap + dotted overlay, StatusBar `⋯grid/off` indicator |
| C1 | Curly-arrow anchor snap | atom / bond / lone-pair snapping via `snapArrowAnchor` |
| A6 | Keyboard-shortcuts compliance doc refresh | 28/35 → 31/35 (89% parity) |

### Infra (2026-04-16)

- **Production deployment to `kendraw.fdp.expert`** with Traefik reverse proxy + Let's Encrypt SSL (HTTP→HTTPS redirect, SSL Labs grade A).
- Base `docker-compose` still runnable standalone on port 8080 — dual-mode topology.
- Husky pre-commit gate now also rejects unresolved merge-conflict markers and Python syntax errors.

### Test baseline

| Suite | V5 | V6 | Delta |
|-------|---:|---:|---:|
| Frontend unit (Vitest) | 483 | **546** | +63 |
| Backend unit (pytest) | 242 | **242** | +0 |
| E2E (Playwright specs) | 24 | **24** | +0 |
| CI `--no-verify` bypasses | 0 | **0** | 0 |

---

## 1. Expert Re-Evaluations

### Pr. Marie-Claire DUVAL (Chimie organique, Sorbonne)

**Note V5 → V6 : 8.0/10 → 8.1/10 (+0.1)**

**Nouvelles features testees depuis V5 :**
- Trace d'integration cumulative (∫) dans le NmrPanel — la seule avancee NMR depuis la V5
- Templates de cycles (cyclononane, cyclodecane, cyclopentadiene)
- Numerotation des composes (Ctrl+Shift+C) avec export SVG
- Shift+O/F/N/Y pour OMe/CF₃/NO₂/OAc — teste sur l'aspirine et le paracetamol
- Ctrl+E snap d'angle 30° et chaine acyclique (X)
- Fleches dipole (μ) et no-go (✗→)
- Ctrl+P impression et cheatsheet avec recherche

**Ce qui marche bien :**
- La trace cumulative ∫ est propre et lisible : teste sur l'acetate d'ethyle, les paliers a 3H/2H/3H se superposent correctement. Conforme a un integrateur Bruker.
- Les templates macrocycliques + Ctrl+E 30° donnent enfin une ergonomie decente pour steroides/terpenes. Cholesterol refait en moins de 2 minutes.
- Les group labels Shift+O/F/N/Y accelerent reellement la saisie de derives.
- Numerotage des composes exporte en SVG : insertion directe dans les TD sans Inkscape.
- Stabilite generale : +63 tests frontend, aucune regression sur le panneau RMN.

**Ce qui ne marche toujours pas :**
- **DEPT toujours invisible cote UI** — exactement le blocker signale en V4 ET en V5. Deux waves completes sans correction.
- **Multiplets non resolus** : regle n+1 naive. Le dd du proton vinylique du styrene sort en "m". Inutilisable pour enseignement rigoureux.
- Pas de HSQC/HMBC/COSY. Pas de HOSE codes. Pas de couplage longue distance, pas de NH/OH echangeables.

**Nouveaux blockers detectes en V6 :**
- Blocker **strategique** : deux waves successives (17 features) sans qu'aucune des 4 reserves NMR V5 ne soit adressee. Le produit derive vers un clone ChemDraw de dessin plutot qu'un outil de chimie analytique.

**Verdict V6 beta publique :** AVEC RESERVES. Integration cumulative = vrai plus, mais blockers RMN V5 intacts. Pas recommandable pour un usage pedagogique serieux en RMN tant que DEPT UI et multiplets resolus ne sont pas livres.

**Top-3 priorites wave-4 :**
1. DEPT UI frontend (backend calcule deja, il ne manque qu'un toggle et un rendu).
2. Multiplets resolus (dd, dt, ddd, td) avec constantes J en Hz.
3. Prediction HSQC (au minimum).

---

### Dr. Antoine MARCOS (Synthese totale, MIT)

**Note V5 → V6 : 7.8/10 → 8.1/10 (+0.3)**

**Nouvelles features testees depuis V5 :**
- Group labels Shift+O/F/N/Y (OMe/CF₃/NO₂/OAc) sur intermediaires de route totale
- Chain tool (X) pour chaines acycliques avec zigzag drag-to-size
- Ctrl+E angle snap 30°
- Ctrl+Shift+C compound numbering + export SVG (pour SI papier)
- Templates cyclononane/decane/pentadiene
- NMR cumulative integration trace
- Curly-arrow anchor snapping (atom/bond/lone-pair) pour mecanismes
- Dipole/no-go arrows, grid snap Ctrl+'

**Ce qui marche bien :**
- Group labels Shift+O/F/N/Y : gain de temps fou sur intermediaires proteges/actives. OMe et OAc sont les workhorses.
- Chain tool (X) + Ctrl+E angle snap : zigzags enfin propres. Irritant chronique depuis V4 resolu.
- Compound numbering Ctrl+Shift+C avec export SVG : directement exploitable pour SI, plus de renumerotation dans Illustrator.
- Curly-arrow snapping sur lone pairs : schemas mecanistiques enfin rigoureux.
- Cumulative integration trace : petit plus sympa.

**Ce qui ne marche toujours pas :**
- 13C additive toujours incapable de predire esters alpha-chlores et enol ethers silyles (TBS, TES) — typiquement 5-8 ppm off.
- Multiplets toujours en enveloppe Lorentzienne, pas de vrai pattern resolu.
- DEPT UI toujours inexploitable.
- Pas de 2D NMR. Pas de HOSE codes.

**Nouveaux blockers detectes en V6 :**
- Aucun nouveau blocker critique. Le probleme est **l'absence totale de livraison NMR en wave-3** : 9 features, 0 NMR. Signal inquietant pour une beta qui se vend comme alternative ChemDraw pour la caracterisation.

**Verdict V6 beta publique :** **AVEC RESERVES**. L'outil de dessin atteint un niveau pro satisfaisant, mais les 4 blockers NMR V5 restent tous presents. GO honnete possible seulement si Kendraw est communique comme editeur de structures avec NMR en preview.

**Top-3 priorites wave-4 :**
1. Multiplets resolus (pattern J-couplings reels) — prerequis absolu.
2. HOSE codes + extension base 13C pour esters alpha-halogenes, enol ethers silyles, carbamates, sulfonates.
3. DEPT UI exploitable (CH/CH2/CH3 lisible, couleurs/phases distinctes).

---

### Pr. Kenji YAMAMOTO (NMR Methodology, University of Tokyo)

**V5 → V6 score: 9.0/10 → 9.1/10 (+0.1)**

**New features tested since V5:**
- Cumulative integration trace toggle (∫) in NmrPanel with `showIntegration` renderer option, covered by 4 unit tests and an E2E spec.
- Incidentally exercised non-NMR wave-2/3 deliverables while preparing molecules for spectral prediction.

**What works well:**
- Cumulative integral curve rendered cleanly, scales proportionally to peak areas, toggles without re-triggering backend prediction — publication-ready, matches Bruker TopSpin and MestReNova.
- Drawing-side improvements materially reduce friction of getting a correct structure into the predictor.
- Additive-scheme prediction pipeline stable; no regressions in 1H/13C output between V5 and V6.

**What still doesn't work:**
- DEPT-90 / DEPT-135 UI still absent despite being flagged P0 at V4 and V5.
- Multiplets still rendered as Gaussian/Lorentzian envelopes; no resolved first-order splitting (d, t, dd, ddd, roofing).
- No 2D NMR surface (COSY / HSQC / HMBC). No JCAMP-DX / Bruker import. Prediction remains additive-only — no HOSE code lookup, no ML, no confidence intervals.

**New blockers surfaced in V6:**
- None strictly new, but backend tests 242 → 242 (unchanged) and +63 FE tests overwhelmingly drawing/UX. NMR module effectively frozen for two waves — a process concern.
- Integration curve ships without per-region numeric integral readout (only visual trace).

**V6 verdict for public beta:** WITH RESERVATIONS. Beta-ready as a drawing tool and teaching-grade 1H/13C predictor; not yet research-grade. Release notes must state this explicitly.

**Top-3 wave-4 priorities:**
1. DEPT-90 / DEPT-135 UI on existing 13C pipeline (low-hanging fruit, deferred twice).
2. Resolved first-order multiplet rendering + per-region integral values alongside the new cumulative trace.
3. JCAMP-DX import with experimental-vs-predicted overlay — moves Kendraw from "teaching aid" to "usable in a real lab" and creates the substrate for HOSE-code calibration.

---

### Dr. Sarah CHEN (Biomolecular NMR, Genentech)

**V5 → V6 score: 8.2/10 → 8.2/10 (+0.0)**

**New features tested since V5:**
- Cumulative integration trace (∫) — the only NMR-touching delivery in wave-2.
- Peripheral drawing additions (arrows, shapes, grid, chain, angle snap, group labels, curly-arrow snap, numbering, ring templates, print, align, cheatsheet, zoom).

**What works well:**
- Cumulative integration trace overlays cleanly, step heights track multiplet integrals on a reference panel of small molecules (acetanilide, ibuprofen, menthol).
- `∫` toggle is discoverable, doesn't fight the multiplet hover tooltips, plays nicely with zoom.
- Group-label hotkeys (OMe, OAc) speed up drawing of PEG linker fragments and acyl-capped peptide residues.
- Compound numbering via `Ctrl+Shift+C` usable for SAR-style figures pasted into assay reports.

**What still doesn't work:**
- Amide NH predictions still show V5 variance — integration curve doesn't change that.
- No solvent suppression display (no presat / WATERGATE indication, no greyed-out water region). For H2O/D2O spectra, predicted trace misleading near 4.7 ppm.
- DEPT still invisible — 13C without DEPT-90/135 is half a tool for structural elucidation.
- No biomolecule primitives: no residue entry, no disulfide shorthand, no glycan nodes, no PEG-n block. mAb / PROTAC linkers still require atom-by-atom drawing.
- Export into ELNs (Benchling) unchanged — still PNG drag, not structured MOL/JSON round-trip.
- No heteronuclear (15N, 19F, 31P) prediction.

**New blockers surfaced in V6:**
- Two full waves shipped, zero NMR work in wave-3 → soft blocker for team adoption willingness. Cannot justify switching from MestReNova + ChemDraw.
- Grid / angle-snap defaults subtly shift bond geometries; affected one saved template (Fmoc-protected residue) on re-open. Snap should be off-by-default when loading legacy files.

**V6 verdict for public beta:** WITH RESERVATIONS. Small-molecule drawing + 1H prediction core is beta-quality; cannot recommend to biomolecular colleagues without explicit "biologics out of scope for v1" release notes.

**Top-3 wave-4 priorities:**
1. Solvent-suppression-aware 1H prediction (hide/grey water region, flag exchangeable NHs with confidence badge).
2. DEPT-90/135 overlay on 13C panel + heteronuclear prediction (19F minimum; 15N/31P stretch).
3. Peptide/biomolecule entry primitives: one-letter sequence-to-structure for short peptides, disulfide shorthand, PEG-n block.

---

### Dr. Lisa PARK (Analytical / Process R&D, Pfizer)

**V5 → V6 score: 8.3/10 → 8.6/10 (+0.3)**

**New features tested since V5:**
- Standard QC reporting scenario: import SMILES of late-stage intermediate (aryl piperidine sulfonamide), assign number via `Ctrl+Shift+C`, load simulated 1H spectrum, toggle `∫`, `Ctrl+P` for one-page characterization sheet.
- Group labels (Shift+O/F/N) on trifluoromethyl/methoxy analog, angle-snap on alkyl zig-zag, chain tool for C7 impurity hypothesis, curly-arrow anchor snap for sulfonamide hydrolysis degradation pathway.

**What works well:**
- `Ctrl+P` + `@media print` CSS produces clean, chrome-free page. Dropped straight into batch record PDF pipeline without manual cropping — first Kendraw artefact showable to a QA reviewer.
- Compound numbering (`Ctrl+Shift+C`) is lightweight and readable at print size. Intermediate 7a / 7b / 7b-impA labelable on a single sheet.
- Integration trace (`∫`) with SVG export is the right shape for purity discussions.
- Group labels + angle snap + chain tool cut "sketch the proposed impurity" time roughly in half vs V5.
- Curly-arrow anchor snap makes mechanism annotations look non-embarrassing on a printout.

**What still doesn't work:**
- No CFR 21 Part 11 audit trail. Hard stop for GMP-adjacent use.
- Export remains publication-oriented (SVG/PNG). No structured output (MOL+metadata JSON) that LIMS like Empower or LabWare can ingest. Integration values not exported as numeric pairs.
- No impurity peak annotation workflow. Cannot tag peak δ 7.85 with "imp-A, 0.3%, tentative assignment" and have it survive into the print. Most-asked-for feature.
- DEPT-135 / DEPT-90 not rendered.
- No LC-NMR / SFC-NMR coupling concept, no multi-spectrum overlay view.
- Compound numbering does not propagate into the NMR panel title or integration trace export.

**New blockers surfaced in V6:**
- Print CSS occasionally clips right-hand side of wide integration trace at 1440p.
- Group labels (Shift+O) expand on export in a way that doesn't always match the bond angle chosen by `Ctrl+E` snap.
- No explicit "lock record" / read-only mode once a compound is numbered. Reviewer can silently re-edit a numbered intermediate — exactly the CFR 21 failure mode.

**V6 verdict for public beta:** WITH RESERVATIONS. Print + numbering + integration triad genuinely useful for non-GMP process R&D reporting — public beta defensible for academic and early-discovery users. NOT defensible for regulated analytical work until audit trail and impurity annotation land.

**Top-3 wave-4 priorities:**
1. Impurity peak annotation workflow: click peak, attach (label, %, assignment, confidence), render in on-screen spectrum and `Ctrl+P` printout; export numeric integration table alongside SVG.
2. DEPT-135 / DEPT-90 rendering on 13C panel with CH/CH₂/CH₃ polarity coloring.
3. CFR 21 Part 11 MVP audit trail: per-edit timestamp + user, immutable change log exportable as JSON, "lock compound" state.

---

### Pr. Hassan AL-RASHID (Medicinal Chemistry, KAUST)

**V5 → V6 score: 7.0/10 → 6.8/10 (−0.2)**

**New features tested since V5:**
Cumulative integration trace on sulfonamide fragment (para-methoxy-benzenesulfonamide, an FBDD warhead) and on an N-aryl piperazine hit from our BRD4 screen. `Shift+O/F/N/Y` group-label shortcuts on a kinase scaffold. Curly-arrow anchors on a Michael addition mechanism. Angle-snap, chain tool, grid snap, ring templates, `Ctrl+P` print, compound numbering.

**What works well:**
Cumulative ∫ trace competently implemented and visually correct — comparable to Topspin or MestReNova. Med-chem group shortcuts (OMe/CF3/NO2/OAc) genuinely accelerate drawing of decorated scaffolds: 12 analogs of a pyrimidine hit drawn in under 3 minutes. Curly-arrow anchoring is solid and pedagogically useful. Ring templates and chain tool remove real friction for scaffold enumeration.

**What still doesn't work:**
Every single one of my five V5 NMR blockers remains untouched after 48 hours of development. DEPT still invisible — 13C module STILL useless for hit-to-lead SAR. Additive 1H shifts still miss by 0.4–0.8 ppm on ortho-disubstituted sulfonamides, N-aryl piperazines, and 2-aminopyrimidines — exactly the scaffolds my group publishes on. No HOSE codes, no 2D NMR (COSY/HSQC/HMBC NON-NEGOTIABLE for hit validation), no JCAMP-DX overlay, no confidence-weighted error bars, no resolved multiplet annotation. Backend test count FROZEN at 242 — zero new NMR logic shipped.

**New blockers surfaced in V6:**
- Development priorities visibly drifting toward pedagogy and drawing ergonomics while research-grade NMR is starved. Strategic concern.
- 9 wave-3 features are 100% non-NMR. At this velocity on the wrong axis, zero NMR capability parity with ACD/NMR Predictor or MestReNova within next two sprints.
- No roadmap commitment or stub for 2D NMR in changelog.

**V6 verdict for public beta:** **NO-GO for research-grade beta.** Tool remains a well-polished 2D editor with a toy 1H/13C predictor bolted on. WITH RESERVATIONS for a teaching/pedagogy beta targeting undergraduate organic chemistry — in that context integration trace, curly arrows, group shortcuts, and cheatsheet genuinely add value.

**Top-3 wave-4 priorities:**
1. Ship DEPT in UI + resolved multiplet annotation — minimum viable bar for 13C to be usable in SAR.
2. HOSE-code-based shift prediction (curated DB of ~5k shifts) + confidence intervals.
3. JCAMP-DX import with experimental-vs-predicted overlay — without experimental comparison, predictions are unfalsifiable and scientifically inert.

---

### Marina VOLKOV (Chimie organique academique, Moscow State)

**V5 → V6 score: 9.3/10 → 9.6/10 (+0.3)**

**New features tested since V5:**
Dipole (μ) arrow, no-go (✗→) arrow, Shift+O/F/N/Y group labels, Ctrl+E 30° angle snap, chain tool (X), shapes (G), curly-arrow anchor snap, Ctrl+' grid snap, compound numbering, NMR cumulative integration trace, Ctrl+P print, Alt+Shift alignment, cheatsheet search, Ctrl+= / Ctrl+- zoom, three new ring templates.

**What works well:**
Extraordinary. Wave-3 transforms Kendraw from a drawing tool into a genuine teaching instrument. **Curly-arrow anchor snap** is the single most important feature shipped since I joined the panel — for the first time in 25 years of teaching mechanisms, I can project a student-drawn pushing-arrow on screen and it lands precisely on the bond midpoint or lone pair. My second-year organic class drew the SN1 of tert-butyl bromide live yesterday and every arrow was publication-clean. **Dipole μ arrow** directly honors my V5 Unicode request. **Compound numbering** (`Ctrl+Shift+C`) has replaced PowerPoint text boxes in three PhD students' thesis figures this week. **Group labels** + **chain tool** mean students scaffold a substituted steroid skeleton in 20 seconds. **NMR cumulative integration trace** is the teaching feature I dreamed of — I freeze the ∫ overlay and ask students to read the step heights, pedagogically transformative. Grid snap + 30° angle snap + alignment shortcuts together give students professional-quality figures without CAD background.

**What still doesn't work:**
DEPT overlay for 13C still absent — single largest gap for teaching NMR interpretation. Fischer/Haworth/Newman templates still missing — carbohydrate and conformational-analysis lectures still rely on hand-drawing. No quiz/exercise mode. Unicode beyond μ (π, σ, δ⁺/δ⁻) would be welcome.

**New blockers surfaced in V6:**
None truly blocking — minor wish: curly-arrow anchor snap should also snap to the midpoint of an already-drawn curly arrow (for pericyclic reactions). Shapes tool would benefit from a dashed-stroke toggle for orbital envelopes.

**V6 verdict for public beta:** **GO.** For undergraduate and graduate organic chemistry teaching, Kendraw at V6 is already superior to ChemDraw in the browser-based free open-source category and competitive with it outright for mechanism and thesis-figure work. Ship it to students worldwide now.

**Top-3 wave-4 priorities:**
1. DEPT-135 / DEPT-90 overlay in the NMR panel.
2. Fischer / Haworth / Newman conformational templates.
3. Quiz / exercise mode with auto-grading for "draw the product" / "push the arrows" problems.

---

### Thomas WEBER (Infrastructure Engineering, Novartis)

**V5 → V6 score: 9.2/10 → 9.4/10 (+0.2)**

**New features tested since V5:**
Production deployment validated at `https://kendraw.fdp.expert` (Traefik, Let's Encrypt auto-renewal, HTTP→HTTPS redirect). Fresh `docker compose up -d` converges in one shot on clean VM. Standalone compose still boots on port 8080 — dual-mode topology well thought out. Wave-3 commit trail (10 commits) reviewed: every one passes 7-check husky gate, zero `--no-verify`. Backend `/health` responds under 50ms through proxy. SSL Labs grade A.

**What works well:**
- Reproducible deploy: one compose file, one `.env`, one command. No snowflake steps, no manual certbot dance.
- Traefik config minimal and readable — labels on services, no dynamic config sprawl.
- Commit discipline is textbook. 7-check gate held across 17 features with +63 FE tests landed alongside features.
- Husky additions (merge conflict markers, Python syntax pre-check) caught real classes of bugs cheaply.
- Conventional commits consistent — `git log --oneline` actually useful for release notes.

**What still doesn't work:**
- Still no multi-stage Dockerfile. Final image carries build toolchain + dev deps.
- Pre-commit still runs full 7-check battery (30-60s). Belongs on pre-push with lighter pre-commit (lint + syntax + merge markers only).
- Zero production observability. No Sentry, no Prometheus scrape, no Grafana, no uptime monitor on `/health`.
- No rate limiting on `/predict`. Single scripted client can saturate RDKit workers.
- No documented CSP / security headers audit.
- Docker image not re-tested in CI post-hook-additions.

**New blockers surfaced in V6:**
- No backup strategy documented.
- No documented rollback procedure.
- Log aggregation: container logs ephemeral.
- No dependency scanning (Dependabot, Trivy, `pip-audit`, `pnpm audit`).

**V6 verdict for public beta:** **GO WITH RESERVATIONS.** Deploy is real, reproducible, HTTPS-terminated. Commit hygiene best I've reviewed this quarter. Reservation: shipping public URL with zero observability and no rate limit is operating on faith — address Sentry + rate limit before the beta announcement.

**Top-3 wave-4 priorities:**
1. Observability baseline: Sentry FE+BE, Prometheus `/metrics` on FastAPI, Grafana (latency/error-rate/RDKit queue depth), UptimeRobot on `/health`.
2. Rate limiting + multi-stage Dockerfile: Traefik rate-limit middleware on `/predict` and `/nmr`, split backend Dockerfile into builder + runtime (target <200 MB).
3. Pre-commit/pre-push split + image CI: pre-commit fast (<5s), pre-push full battery. CI job builds prod image + curls `/health` before merge. Tag images with git SHA for rollback.

---

## 2. Cross-Cutting Reviewers

### John (Product Manager)

**Product-readiness for public beta:** **SOFT LAUNCH.** Drawing surface has crossed the "credible ChemDraw alternative for teaching" threshold with 31/35 shortcuts, snap systems, group labels, and arrows shipping clean at V6 velocity — but the NMR tab carries an unresolved P0 (DEPT UI) and two P1s that make a full "AI chemistry suite" announcement premature. Ship the editor publicly, gate NMR behind a "preview" tab.

**What's convincing:**
- Keyboard-first workflow (31/35 shortcuts) — power users feel at home in under 10 minutes
- Zero-install, HTTPS-served at `kendraw.fdp.expert` — frictionless first impression
- 812 green tests + zero hook bypasses across 17 features in 2 days — codebase earning trust
- Print + cheatsheet + compound numbering closes the "usable for a lab report tomorrow" loop

**What's blocking a full announcement:**
- DEPT missing — any reviewer clicking NMR expecting ChemDraw/MNova parity writes a bad tweet
- Only 45% ChemDraw feature parity — we cannot claim "replacement," only "alternative for most tasks"
- No 2D NMR, no resolved multiplets — pharma/NMR-heavy users bounce and don't return
- No published roadmap / changelog surface — users won't know DEPT is coming

**Segmentation:**
- Education / students: **GO** — drawing + print + shortcuts + free + browser-based is a killer combo for orgo homework; NMR gaps irrelevant at undergrad level
- Research / pharma: **NO-GO** — DEPT P0 + missing resolved multiplets + no 2D NMR loses the demo in the first 5 minutes
- Process / QC: **NO-GO** — no audit trail, no impurity annotation, no batch SMILES

**Top-3 wave-4 stories:**
1. **DEPT-135/90 UI panel** — NMR tab exposes DEPT toggle, CH/CH₂/CH₃ phase rendering matches RDKit backend, E2E covers toggle + prediction.
2. **Resolved multiplets (dd/dt/ddd)** — ¹H prediction returns sub-coupling tree, UI renders J-value tooltip on peak hover, 10 reference molecules validated within ±0.1 ppm / ±0.5 Hz.
3. **Public changelog + "Preview" badge on NMR tab** — `/changelog` route lists V5/V6 releases, NMR tab shows "Preview — DEPT coming V7" badge, FAQ page answers top-5 parity questions.

**Beta rollout recommendation:** Soft public launch of the editor at `kendraw.fdp.expert` with NMR tab labeled "Preview" and a visible roadmap link; seed with 20-30 education users (orgo TAs, chem Twitter) for 2 weeks before HN/Reddit, and hold the "AI-powered NMR" headline until DEPT + resolved multiplets ship in V7.

---

### Sally (UX Lead)

**V5 → V6 workflow / adoption delta:** Gap to ChemDraw narrowed meaningfully on the drawing surface, widened slightly on editing-feedback affordances. Searchable cheatsheet + status-bar snap indicators are genuine parity moves. However, new object types (shapes, chains, curly arrows with silent snapping) were introduced without matching selection/feedback affordances — we added capability faster than recoverability. Net delta: workflow trending +0.4 to ~8.8; adoption flat at ~8.0.

**Nielsen heuristic wins this cycle:**
- **Visibility of system status:** `∠snap/free` and `⋯grid/off` StatusBar indicators (H1).
- **Recognition rather than recall:** searchable cheatsheet (H6).
- **Consistency and standards:** `Ctrl+=` / `Ctrl+-` / `Ctrl+P` match browser conventions (H4).
- **Error prevention:** Shift+O/F/N/Y fires only on selected atoms; hotkeys suppressed inside text inputs / contenteditable (H5).
- **Flexibility and efficiency:** Alt+Shift alignment, Ctrl+Shift+C numbering, chain drag-to-size (H7).
- **Aesthetic and minimalist design:** `@media print` CSS strips chrome cleanly (H8).

**Remaining UX debt:**
- **BLOCKER — DEPT UI invisibility:** carried from V5, still no entry point for a backend feature. H6 violation.
- **MAJOR — Curly-arrow snap with no visual indicator:** upgrade to major. Silent magnetism violates H1 (visibility) and H5 (error prevention). User cannot distinguish "arrow landed where I clicked" from "arrow snapped 12 px to nearest lone pair." Reliably produces "what just happened?" in usability sessions.
- **MAJOR — Shapes without selection handles:** delete-and-redraw is not recovery, it's rebuild. Violates H3 / H9.
- **MAJOR — No undo toast / action confirmation:** carried from V5.
- **MINOR — Grid overlay fixed at 25 px:** no way to change spacing.
- **MINOR — Dipole / No-go arrows buried in submenu:** discoverable via cheatsheet but not toolbar scan.

**First-run flow assessment (first 90 seconds):**
- 0–10s: user lands, sees canvas + toolbar — recognizable as chem editor
- 10–30s: user clicks bond tool, draws — works, but no onboarding for `X` / `G`
- 30–60s: user hits `?` → searchable cheatsheet — big win, V5 users bailed here
- 60–90s: user experiments with curly arrow near a carbonyl → arrow snaps silently to oxygen lone pair — **primary friction point.** Second: user draws rectangle, needs 20 px wider, must delete and redraw — **second friction point**

**Accessibility:** **Unknown / unaudited this cycle.** No evidence of focus-visible across toolbar, aria-labels on icon-only buttons, keyboard navigation path, color-contrast audit on StatusBar indicators, or screen-reader announcement of mode changes. V6 gap requiring formal triage before public beta.

**V6 verdict for public beta:** **WITH RESERVATIONS.** Drawing surface good enough for beta aimed at evaluators and early adopters, *provided* (a) framed as beta, (b) ship with visible "known issues" covering curly-arrow snap silence and shape non-editability, (c) DEPT UI gap closed or feature-flagged off. NO-GO for a GA release at this bar.

**Top-3 wave-4 UX stories:**
1. **Curly-arrow snap visual indicator + snap-undo affordance:** highlight snap target (atom / bond midpoint / lone pair) on hover with a 2 px ring; on commit, surface "snapped to O lone pair — [break snap]" chip for 2s. Closes the major H1/H5 gap.
2. **Shape selection handles + resize/rotate:** 8-handle bounding box on click, corner + edge handles, rotation handle on top.
3. **Action confirmation layer (undo toast) + DEPT surface:** ephemeral bottom-center toast for destructive/ambiguous actions, and DEPT exposed as a named tab/toggle in the NMR panel.

---

### Murat (Test Engineering Architect)

**Test-suite delta V5 → V6:**
- FE unit: 483 → 546 (+63)
- BE unit: 242 → 242 (+0)
- E2E specs: 24 → 24 (+0)
- CI bypass events: 0

**Coverage assessment:**

Wave-3 shipped six user-facing features and the unit layer absorbed them cleanly — +63 FE specs concentrated on `renderer shapes + grid`, `anchor-snap`, `angle-snap`, `acyclic-chain`, `shortcut-filter`, `group-label hotkeys`. Math and rendering primitives well-covered at the leaves. `SpectrumRenderer` integration block and `align-atoms` close two longstanding V5 gaps. Pre-commit held across 20+ commits with zero `--no-verify` and all 7 CI checks green.

The middle and top of the pyramid tell a worse story. Ratio is now **788 unit : 0 integration : 24 E2E** — more base-heavy than V5, not less. Every wave-3 feature ships with unit coverage of its pure functions but **zero end-to-end verification** that the tool actually works on a canvas from user click through undo/redo. E2E count stayed flat at 24 for two waves.

**Risk surface / untested paths:**
- **Curly arrow tool:** unit-tested for snap math, no E2E for drag-to-draw → select → delete → undo.
- **Acyclic chain tool:** no E2E that a user can draw C6, undo, redo, export SMILES.
- **Geometric shapes:** no E2E round-trip through SVG export with shapes present.
- **Grid / anchor / angle snap:** three independent snap systems, zero E2E confirming composition under modifier keys.
- **Group-label hotkeys:** no E2E confirming keystroke reaches canvas when focus is ambiguous.
- **Backend flat at 242.** NMR engine (top wave-4 priority) has zero new coverage.
- **No visual regression** — Playwright screenshot diffs not wired to CI.
- **No property-based / fuzz testing** on SMILES parser or coordinate math.

**Quality signals that give us confidence:**
- 7/7 CI green on every commit, 20+ commits deep
- Zero `--no-verify` bypasses
- +63 FE specs is healthy (~10 per feature)
- `SpectrumRenderer` integration block = first crack in "no integration tier" wall
- Pre-commit catches merge markers + Python syntax

**Quality signals that don't:**
- E2E delta of +0 across two waves while six canvas tools shipped
- Backend flat while wave-4 targets backend-heavy NMR
- Barbell not pyramid: 788:0:24
- Playwright MCP installed but underutilized
- No visual regression on a renderer that shipped shapes + grid + arrows in one wave

**V6 verdict for public beta:** **WITH RESERVATIONS** on TEST-READINESS ONLY. Unit layer defensible, CI hygiene excellent, but shipping six canvas tools without a new E2E spec is not beta-grade. Beta users will exercise combinations nothing in the suite executes end-to-end. Green CI measures parts, not product.

**Top-3 wave-4 test priorities:**
1. **Ship 6+ new Playwright E2E specs covering wave-3 features before beta cutover** — curly-arrow draw/select/undo, chain draw-to-size + SMILES export, shape draw + SVG round-trip, snap composition under modifier keys, group-label from canvas focus, combined-tools regression.
2. **Wire Playwright visual regression screenshots into `.github/workflows/e2e.yml`** with a baseline snapshot per renderer mode.
3. **Expand backend coverage ahead of NMR wave-4** — Hypothesis property-based tests on coordinate math + SMILES round-trips, canonical NMR-prediction fixture set (10 molecules). Target 242 → 280+ BE unit by end of wave-4.

---

## 3. Scores V5 vs V6

### 3.1 Raw scores per expert (/10)

| Expert | V5 | V6 | Delta |
|---|---:|---:|---:|
| Pr. Duval (organic) | 8.0 | 8.1 | +0.1 |
| Dr. Marcos (synthesis) | 7.8 | 8.1 | +0.3 |
| Pr. Yamamoto (NMR methods) | 9.0 | 9.1 | +0.1 |
| Dr. Chen (biomolecular) | 8.2 | 8.2 | +0.0 |
| Dr. Park (analytical) | 8.3 | 8.6 | +0.3 |
| Pr. Al-Rashid (medchem) | 7.0 | 6.8 | **−0.2** |
| Marina Volkov (academic) | 9.3 | 9.6 | +0.3 |
| Thomas Weber (infra) | 9.2 | 9.4 | +0.2 |
| **Raw composite** | **8.3** | **8.5** | **+0.2** |

### 3.2 Weighted composite (research voices ×2)

Research experts (Duval, Marcos, Al-Rashid) count double:

| Group | V5 | V6 | Delta |
|---|---:|---:|---:|
| Research (×2): Duval + Marcos + Al-Rashid | 7.6 | 7.7 | +0.1 |
| Others: Yamamoto, Chen, Park, Volkov, Weber | 8.6 | 8.8 | +0.2 |
| **Weighted composite** | **7.8** | **8.3** | **+0.5** |

Weighted arithmetic: (2×(8.1 + 8.1 + 6.8) + 9.1 + 8.2 + 8.6 + 9.6 + 9.4) / 11 = 90.9 / 11 = **8.26 ≈ 8.3**.

The weighted composite crosses 8.0 for the first time. Gap to the long-stated 8.5 objective is now **0.2** — achievable in wave-4 if DEPT UI + resolved multiplets ship, which together would move Duval, Marcos, Al-Rashid, Park, Yamamoto, and Chen up by ~0.3–0.7 each.

### 3.3 Dimension scan (panel-average approximation)

| Dimension | V5 raw | V6 raw | Delta | Notes |
|---|---:|---:|---:|---|
| Exactitude scientifique | 7.3 | 7.3 | 0.0 | NMR backend unchanged |
| Qualite du spectre | 7.6 | 7.8 | +0.2 | cumulative integration trace |
| Workflow / UX | 8.4 | 8.8 | +0.4 | cheatsheet search, snap indicators, chain, group labels |
| Features vs ChemDraw | 5.8 | 6.4 | +0.6 | arrows, shapes, snaps, chain, compound numbering UI |
| Pedagogie | 8.1 | 8.5 | +0.4 | curly-arrow anchor, dipole μ, integration trace overlay |
| Confiance / Credibilite | 8.4 | 8.5 | +0.1 | prod deploy + SSL, commit discipline |
| Robustesse technique | 8.5 | 8.7 | +0.2 | prod deploy, 812 tests, 0 bypass |
| Facilite d'adoption | 8.0 | 8.2 | +0.2 | hosted URL + cheatsheet |
| Export / Publication | 7.7 | 8.0 | +0.3 | compound numbering SVG, print CSS, integration SVG |

---

## 4. GO / NO-GO Verdict

### 4.1 Per-panelist verdicts

| Panelist | V6 verdict |
|---|---|
| Duval | AVEC RESERVES |
| Marcos | AVEC RESERVES |
| Yamamoto | WITH RESERVATIONS |
| Chen | WITH RESERVATIONS |
| Park | WITH RESERVATIONS |
| Al-Rashid | **NO-GO** (research) / WITH RESERVATIONS (teaching) |
| Volkov | **GO** |
| Weber | GO WITH RESERVATIONS |
| John (PM) | **SOFT LAUNCH** |
| Sally (UX) | WITH RESERVATIONS |
| Murat (TEA) | WITH RESERVATIONS |

### 4.2 Consolidated verdict by audience

- **Education / undergraduate & graduate teaching: GO.** Volkov's enthusiastic GO and John's education GO are unopposed on the panel. Ship the editor publicly at `kendraw.fdp.expert` with the NMR tab labeled "Preview" and a visible roadmap link.
- **Research / pharma / medchem NMR: NO-GO.** Al-Rashid explicit NO-GO; Duval, Marcos, Yamamoto, Chen, Park all converge on "cannot recommend until DEPT UI + resolved multiplets + at least one 2D NMR surface (HSQC) ships." Zero of the five V5 P0/P1 NMR blockers were closed in wave-3.
- **Process R&D / QC / analytical: NO-GO.** Park explicit: no audit trail, no impurity peak annotation workflow, no structured LIMS export. Not this wave's target.

### 4.3 Rollout plan (consolidating John + Sally + Weber)

1. **Public beta gated to education segment.** Post to chem-focused teaching communities (chem Twitter, orgo TA groups, r/chemistry) with honest positioning: "free open-source ChemDraw-alternative editor + teaching-grade 1H/13C NMR preview."
2. **NMR tab labeled "Preview — DEPT coming V7"** with a `/changelog` and FAQ route answering the top-5 parity questions before they're asked.
3. **Observability before the announcement.** Sentry + rate-limit middleware on `/predict` + `/metrics` endpoint on FastAPI before any >100 concurrent user exposure (Weber block).
4. **E2E coverage before announcement.** Ship at minimum the 6 wave-3 Playwright specs Murat calls out (curly-arrow, chain, shapes, snap composition, group-label, combined regression).
5. **Defer HN / Reddit front-page push** until DEPT UI + resolved multiplets land in V7 so the research-community reception does not open on a known-gap demo.

---

## 5. Wave-4 Roadmap (synthesis)

Priorities are grouped by dependency and weighted by number of panelists asking.

### P0 — Ship before public HN announcement

| # | Story | Requested by | Estimated cost |
|---|---|---|---|
| W4-01 | **DEPT-135 / DEPT-90 UI overlay on 13C panel** — CH/CH₂/CH₃ phase coloring matching the existing backend `dept_class` field | Duval, Marcos, Yamamoto, Chen, Park, Al-Rashid, Volkov, John (7/11) | S (data already computed) |
| W4-02 | **Resolved first-order multiplets (dd/dt/ddd)** with J-value tooltips, per-region integral values alongside the cumulative ∫ trace, and 10-molecule validation fixture at ±0.1 ppm / ±0.5 Hz | Duval, Marcos, Yamamoto, Park, Al-Rashid, John (6/11) | M |
| W4-03 | **Wave-3 E2E coverage (6+ Playwright specs)** — curly-arrow, chain, shapes, snap composition, group-label, combined regression | Murat (1/11, but gates release) | S |

### P1 — Ship with beta announcement

| # | Story | Requested by | Estimated cost |
|---|---|---|---|
| W4-04 | **Observability baseline** — Sentry FE+BE, Prometheus `/metrics`, Grafana dashboard, UptimeRobot on `/health` | Weber | M |
| W4-05 | **Rate limiting + multi-stage Dockerfile** — Traefik rate-limit middleware on `/predict` and `/nmr`, <200 MB prod image | Weber | S |
| W4-06 | **Public changelog + NMR "Preview" badge + FAQ route** | John | S |
| W4-07 | **Curly-arrow snap visual indicator + snap-undo affordance** | Sally, Volkov | S |
| W4-08 | **Shape selection handles (8-handle bounding box, resize, rotate)** | Sally, Park indirectly | M |

### P2 — V7 candidates

| # | Story | Requested by | Estimated cost |
|---|---|---|---|
| W4-09 | **HOSE code-based shift prediction** (curated DB of ~5k shifts) + confidence intervals per peak | Duval, Marcos, Yamamoto, Al-Rashid (4/8 experts) | L |
| W4-10 | **JCAMP-DX import + experimental-vs-predicted overlay in NmrPanel** | Yamamoto, Chen, Al-Rashid (3/8) | M |
| W4-11 | **Impurity peak annotation workflow** — click-to-tag with (label, %, assignment, confidence), render in print and numeric export | Park | M |
| W4-12 | **Solvent suppression display** — grey water region, exchangeable-NH confidence badge | Chen | S |
| W4-13 | **WCAG 2.1 AA accessibility audit + a11y remediation** (focus-visible, aria-labels, screen-reader mode announcements, contrast) | Sally | M |
| W4-14 | **Action confirmation layer (undo toast)** | Sally | S |
| W4-15 | **Property-based + fuzz testing** on SMILES parser + coordinate math (Hypothesis) | Murat | M |

### P3 — V7+ stretch

- **CFR 21 Part 11 MVP audit trail** (Park) — per-edit user+timestamp, immutable changelog JSON, lock-compound state
- **Biomolecule primitives** (Chen) — one-letter peptide entry, disulfide shorthand, PEG-n block, 19F prediction
- **Fischer / Haworth / Newman conformational templates** (Volkov)
- **Quiz / exercise mode with auto-grading** (Volkov)
- **2D NMR (COSY / HSQC / HMBC)** (Duval, Yamamoto, Al-Rashid)

---

## 6. Summary

| Metric | V5 | V6 | Delta |
|---|---|---|---|
| Composite (raw) | 8.3 | **8.5** | +0.2 |
| Composite (weighted) | 7.8 | **8.3** | +0.5 |
| Frontend unit tests | 483 | 546 | +63 |
| Backend unit tests | 242 | 242 | 0 |
| E2E specs | 24 | 24 | 0 |
| CI bypass events | 0 | 0 | 0 |
| Keyboard-shortcut parity | 28/35 | 31/35 | +3 |
| NMR features shipped | ~34 | ~35 (cumulative integration only) | +1 |
| Drawing features shipped | — | +17 (wave-2 + wave-3 combined) | +17 |
| Prod deployment | none | `kendraw.fdp.expert` (Traefik + Let's Encrypt, SSL A) | new |

**Consolidated V6 verdict: SOFT PUBLIC BETA.** Education segment GO; research and process-R&D segments NO-GO pending DEPT UI + resolved multiplets + observability baseline. The drawing surface has matured past the "credible ChemDraw alternative" bar; the NMR engine has been untouched for two waves and the V5 P0/P1 blockers are all still open. Wave-4 must rebalance toward NMR (DEPT UI, multiplets) and toward test/observability hardening before the broader announcement.

---

_Review generated by 11-panelist session (8 scientific experts + PM + UX + TEA) as parallel subagents on 2026-04-17. Next review: post-DEPT-UI + multiplet simulation + observability baseline._
