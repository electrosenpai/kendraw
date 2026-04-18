# NMR Scientific Review V7 — Kendraw

**Date** — 2026-04-18
**Author** — 8-expert panel (Duval, Marcos, Yamamoto, Chen, Park, Al-Rashid, Volkov, Weber) + 3-auditor pass (John PM, Sally UX, Murat TEA)
**Predecessor** — `docs/nmr-scientific-review-v6.md` (panel score 8.5 raw / 8.3 weighted, soft-beta verdict, Al-Rashid in régression)
**Sources** — see Section I (factual inventory) for commit-level traceability

---

## Executive summary (1 page)

Between the V6 review and this one, Kendraw shipped six waves of work in ~7 days:

- **Wave-4 NMR + pharma**: DEPT-135/90, multiplet line list with Shift+I integration toggle, JCAMP-DX 1D NMR import + spectrum overlay, append-only audit trail with SHA-256 hash chain, e-signature modal with reason-for-change, CDXML writer with parse round-trip.
- **Wave-4 redraw → Wave-5 → Wave-6**: clean-room Ketcher-inspired canvas behind a feature flag (`VITE_ENABLE_NEW_CANVAS`, default **false**), tool abstraction interface, marquee selection, snap utility, hover icon tool, drag-move with atomic undo, quick-edit + delete, exhaustive 17-tool toolbox, ChemDraw-style hotkeys, parity e2e.
- **Wave-7 hotfixes** (six in 36 h): 2-column grouped toolbox, atom/ring/text/arrow/erase wiring, `/api/structure/clean` endpoint with Refine + Clean buttons (Shift+Ctrl+K / Ctrl+Shift+L), restored fit-to-view, dialog dark-mode pass, and the credibility-saving HF-6 fix that wired the click handlers the toolbox had been missing since wave-6.

The panel reconvenes to answer two questions:

1. Did the work move the needle for the experts who were stuck in V6 — chiefly **Al-Rashid** (pharma frustration at 6.8) and **Chen** (comp-chem stagnation at 8.2)?
2. Is Kendraw ready for a public beta launch in its current state, or does the verdict remain SOFT BETA?

**Headline numbers (full table in §III):**

|              | V5 raw | V6 raw | V7 raw | V6 → V7 | V6 weighted | V7 weighted |
| ------------ | -----: | -----: | -----: | ------: | ----------: | ----------: |
| **Composite** | 8.32   | 8.49   | **8.78** | **+0.29** | 8.26   | **8.61** |

**Verdict — SOFT BETA, with three lanes:**

- **GO** for academic teaching (L3 / M1) and individual chemist sketching — Yamamoto and Volkov endorse.
- **SOFT GO** for academic publication-grade structures (CDXML round-trip, RSC/ACS presets) — Duval and Park endorse with caveats on stereochemistry polish.
- **NO-GO** for FDA-regulated workflows, GxP labs, or any context that needs a verifiable audit-trail viewer + SSO + server-side enforcement — Al-Rashid is more positive than V6 but explicit.

**Top-3 wave-8 P0 (from consensus blockers in §IV):**

1. **Flip `VITE_ENABLE_NEW_CANVAS=true` by default** once the wedge / curly-arrow gap is closed — every expert flagged the "headline shipped, hidden by flag" mismatch (Volkov −0.2, Park P0, Marcos blocker).
2. **AuditLogPanel UI + on-disk persistence + dispatcher integration** — without these, the audit trail in wave-4 P1-04 is a primitive, not a feature (Al-Rashid P0, Park P0, Murat P0).
3. **Production observability stack** — Sentry + UptimeRobot + rate-limit on `/predict` (Weber's V6 top-1 unaddressed, John's launch-day risk #1, Murat audit gate).

Full breakdown follows.

---

## Section I — Factual inventory of deliveries since V6

The full per-expert factual brief lives at [`docs/scratch/v7-expert-briefs.md`](scratch/v7-expert-briefs.md) (705 lines, generated 2026-04-18 18:06 UTC by a scout subagent that read all 18 source documents). The condensed inventory follows; deltas to V6 are explicit.

### I.1 Wave-4 (NMR + pharma compliance, shipped 2026-04-17/18)

- `5010575` — DEPT-135 up/down phase + DEPT-90 mode (P1-01)
- `1e5caf6` — multiplet line list + Shift+I integration toggle (P1-02)
- `542263a` — JCAMP-DX 1D NMR import + spectrum overlay (P1-03)
- `0a7472e` — append-only audit trail with SHA-256 hash chain (P1-04)
- `a2b8c9c` — record-lock + e-signature modal with reason-for-change (P1-05)
- `e3fc0a9` — CDXML writer with parse round-trip (P1-06)

### I.2 Wave-4 redraw → Wave-5 (canvas-new scaffolding & feature completion)

Tool abstraction (`de7a4a2`), CanvasRenderer + store subscription (`f19b501`), snap utility (`5eb3748`), marquee selection (`0379972`), hover icon for atom/bond extensions (`b6aba90`), drag-move with atomic undo (`0e69e53`), quick-edit + delete + cursor zoom (`30dd5f7`), remove-batch command for atomic delete (`25d2f55`).

### I.3 Wave-6 (canvas-new toolbox rebuild)

- `f7b48a7` — exhaustive toolbox with 17 P0 tools
- `14052c8` — wire new toolbox into app shell
- `80bcdfd` — unit tests for wave-6 toolbox
- `a1bb7e8` — ChemDraw-style tool hotkeys
- `ecc289b` — e2e parity tests for wave-6 toolbox
- `8f5090b` — wave-5 hotfix scoping the feature flag to toolbox+canvas only, preserving the shared shell

### I.4 Wave-7 hotfixes

- `2f26598` — HF-1: 2-column toolbox with grouped tools
- `0c144fb` — HF-2: wire atom/ring/text/arrow/erase tools
- `c89b71a` — HF-3: clean/refine structure endpoint + buttons (Shift+Ctrl+K / Ctrl+Shift+L)
- `6e40114` — HF-4: restore fit-to-view button
- `c56f15b` — HF-5: dark/light mode for dialogs + NMR tooltip
- `b1a3697` — HF-6: wire all toolbox button onClick handlers to store (the credibility-saving fix)

### I.5 Test counts — V6 vs current

| Suite              | V6 baseline | V7 current | Delta |
| ------------------ | ----------: | ---------: | ----: |
| Frontend Vitest    | 618         | **677**    | +59   |
| Backend pytest     | 242         | **249**    | +7    |
| E2E Playwright spec files | 24   | **28** + 1 in `packages/ui/e2e` | +4 / +1 |

Backend test count moved by **+7 — entirely from wave-7 HF-3 `test_structure.py` covering the `/api/structure/clean` endpoint**. The NMR engine logic itself (`kendraw_chem/nmr_*`) added zero tests despite four wave-4 NMR deliveries (DEPT, multiplet, JCAMP-DX, audit). Murat flags this as a P0 gap (§Auditor track, Murat). Several panelists below cite "242 frozen" — substantively correct for the NMR engine layer they care about; the +7 belongs to a different subsystem.

### I.6 Feature flag state

`VITE_ENABLE_NEW_CANVAS` defaults to **false**. Public-facing build at https://kendraw.fdp.expert serves the legacy canvas. Every wave-5/6/7 deliverable above is invisible to the public unless a user passes the env var or the code reviewer enables it explicitly. This is a deliberate decision (panel-validated, see Marcos and Park below) but every expert in this V7 review flags it as the largest single gap between "what shipped" and "what users see."

---

## Section II — Per-expert reassessments

Order of contribution: **Al-Rashid first** (lowest V6 note, panel thermometer), **Volkov last** (highest V6 note, positive contrepoint).

### Pr. Hassan AL-RASHID — Pharma / FDA regulatory

Ma note V5 : 7.0
Ma note V6 : 6.8
Ma note V7 : 7.6
Delta V6→V7 : +0.8

#### Brief factuel (pré-rempli)
- Features livrées entre V6 et V7 qui me concernent :
  - DEPT-135 / DEPT-90 UI avec hotkey `D` et CH₂ inversé — wave-4 P1-01 (`5010575`).
  - Liste de raies multiplet + toggle intégration `Shift+I` — wave-4 P1-02 (`1e5caf6`).
  - Import JCAMP-DX 1D + overlay expérimental orange / prédit bleu — wave-4 P1-03 (`542263a`).
  - Audit trail append-only à chaîne SHA-256 + `verifyAuditChain()` 4 motifs typés — wave-4 P1-04 (`0a7472e`), labellisé **Beta**.
  - Verrou d'enregistrement + e-signature (rôle/raison ≥3 caractères, modal accessible) — wave-4 P1-05 (`a2b8c9c`), labellisé **Beta**.
  - Export CDXML 1.0 round-trip testé — wave-4 P1-06 (`e3fc0a9`).
- Mes blockers V6 encore présents :
  - HOSE codes + base 13C élargie : toujours absents (P2 wave-4, déféré).
  - 2D NMR (COSY/HSQC/HMBC) : toujours absent — non-négociable pour validation hit-to-lead.
  - Confidence intervals continus (±σ ppm) : toujours absent ; encore en ordinal 3-niveaux.
  - Backend pytest gelé à 242 depuis V5 — aucun test nouveau côté moteur NMR depuis trois waves.
  - Identité cryptographique par utilisateur : non livrée (W4-D-05) — sans elle l'audit est *tamper-evident* mais pas *non-repudiation*.
  - Persistence IndexedDB de l'audit log : non livrée (W4-D-06).
  - Câblage de l'audit dans le command-dispatch chokepoint : non livré (W4-D-07) — donc beaucoup d'éditions ne sont pas tracées.
  - AuditLogPanel.tsx : non livré (W4-D-08) — la chaîne est invisible à l'utilisateur final.
  - Enforcement serveur du record-lock : non livré (W4-D-09) — verrou client-trusted.
- Mes blockers V6 résolus :
  - DEPT invisible côté UI — résolu (P1-01).
  - Annotation multiplet absente — partiellement résolu : table de raies + intégration ; rendu encore enveloppe lorentzienne.
  - Pas de comparaison expérimentale → prédictions infalsifiables — résolu (P1-03).
  - Pas de roadmap / stub commit pour audit-trail / e-sig — résolu : code livré, pas seulement promis.
- Mon top 3 V6 — statut :
  1. DEPT UI + annotation multiplet résolue → **partiellement livré** (DEPT oui, multiplet en table tooltip mais render envelope encore Lorentzien — W4-D-03 déféré).
  2. HOSE-code prediction + intervalles de confiance → **différé** (P2 wave-4, XL effort, pas planifié wave-5/6/7).
  3. JCAMP-DX import + overlay → **livré** (P1-03, ~95 % couverture Bruker/JEOL/MestReNova).

#### Ce qui s'est amélioré pour moi depuis V6
- Wave-4 a ENFIN été la wave pharma. Six P1 livrés, dont les deux primitives de conformité 21 CFR Part 11 que je réclamais depuis V4. C'est un changement de cap visible et mesurable.
- L'audit trail SHA-256 chaîné n'est pas un placeholder cosmétique : 15 tests unitaires, dont *adversariaux* (mutation post-hoc de raison, retrait d'entrée, forgerie ré-attachée, réordonnancement, payloads mixtes). Le `verifyAuditChain()` qui retourne `hash-mismatch | previous-hash-mismatch | sequence-gap | sequence-restart` est exactement la granularité dont un auditeur FDA a besoin pour qualifier un défaut.
- L'ESigModal respecte `role="dialog"` + `aria-modal` + enum de signification (approved/reviewed/authored/witnessed) + raison validée à la donnée ET à l'UI. C'est cohérent avec §11.50 et §11.200(a).
- Le DEPT 3-états (off / dept-90 / dept-135) avec CH₂ inversé rend enfin le 13C utilisable pour discriminer CH/CH₂/CH₃ en SAR — j'avais cessé d'ouvrir l'onglet 13C en V6.
- L'import JCAMP-DX avec refus stricts (ASDF non supporté, observe-frequency obligatoire si axe Hz, types non-NMR rejetés) est conforme à l'esprit "fail loud" qu'on attend dans un environnement régulé.
- L'export CDXML 1.0 round-trip testé débloque la chaîne SI/eCTD pour les soumissions où l'agence demande encore du CDX.
- Zéro `--no-verify` sur ~25 commits depuis V6 : la discipline de release tient.

#### Ce qui reste problématique ou s'est dégradé
- L'audit trail est **in-memory uniquement**. À reload du navigateur, la chaîne disparaît. Pour un auditeur FDA, c'est inacceptable en l'état — la persistence IndexedDB (W4-D-06) doit être livrée AVANT toute prétention à la conformité réelle.
- Pas de wiring dans le dispatcher de commandes (W4-D-07) : l'audit log existe comme primitive mais la majorité des éditions de structure ne l'alimentent pas. C'est l'écart entre "mécanisme correct" et "couverture exhaustive".
- Pas d'AuditLogPanel (W4-D-08) : l'utilisateur ne peut PAS visualiser sa propre chaîne. Sans viewer, pas de revue interne possible, donc pas de QA.
- Pas d'identité par utilisateur (W4-D-05) : sans ça, la signature est juste une chaîne "actor" en texte libre. Cela disqualifie le système pour §11.200(a)(1)(i)(ii) (deux composants distincts d'identification).
- Lock côté serveur absent (W4-D-09) : un utilisateur motivé peut court-circuiter via DevTools. Je dois être explicite — c'est un *defense-in-depth gap*.
- Backend pytest **toujours à 242**. Aucun test nouveau côté moteur NMR depuis V5. Mon critique structurelle de V6 ("backend test count FROZEN") est encore vraie.
- Stratégique : trois waves consécutives (5, 6, 7) consacrées à un canvas-new derrière feature flag (default false). Pour moi, ce travail est invisible, et il a consommé le budget qui aurait pu finaliser W4-D-05 à W4-D-10.
- Aucune dérivation HOSE, aucun 2D NMR, aucun intervalle de confiance continu. La validation scientifique du moteur NMR n'a pas avancé d'un mètre.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît
- Le scope rule du feature flag (`VITE_ENABLE_NEW_CANVAS` ne touche que toolbox+canvas, jamais le shell) fixé en wave-5 hotfix : c'est exactement la discipline de séparation qu'on attend dans un système GAMP-5 cat 4.
- Les tests adversariaux sur la chaîne d'audit (forgerie ré-attachée, réordonnancement) : un développeur qui pense déjà comme un auditeur, c'est rare et précieux.
- Le THIRD-PARTY-NOTICES livré en clôture wave-4 — bon réflexe pour la due diligence open-source.

#### Bugs ou rough edges découverts à l'usage
- Modal e-signature : la raison est validée ≥3 caractères mais aucune liste contrôlée (CSV de motifs métier). En pratique on aura "fix", "ok", "test" — données inutilisables pour un audit.
- Pas de timestamp serveur autoritaire : `Date.now()` côté navigateur est trivialement falsifiable. La chaîne hashée n'a pas de valeur juridique sans un horodatage de confiance (RFC 3161 ou équivalent).
- DEPT 3-états : pas de legend visible quand on n'est pas dans le mode (`D` cycle silencieux) — un nouveau venu rate la fonctionnalité.
- JCAMP-DX : ~5 % d'échantillons (ASDF, NTUPLES) refusés sans suggestion de conversion ; un message "convertissez via X" aiderait.
- HF-6 (orphan `<div>` interceptant les clics) : symptôme inquiétant d'un défaut de tests d'intégration sur le toolbox — heureusement détecté et bloqué par 23 tests de régression, mais cela signale qu'un test de hit-test systématique manque encore au pipeline.

#### Mes blockers restants (avec priorité)
- P0 :
  - Persistence IndexedDB de l'audit log (W4-D-06) — sans elle, P1-04 n'est pas opérationnel.
  - Wiring de l'audit dans le command dispatcher (W4-D-07) — sinon couverture < 50 % des éditions.
  - AuditLogPanel viewer (W4-D-08) — pas d'auto-revue possible.
  - Identité par utilisateur SSO/OIDC (W4-D-05) — passage de tamper-evident à non-repudiation.
- P1 :
  - 2D NMR (COSY au minimum, HSQC idéal) — non-négociable pour validation structurale en hit-to-lead.
  - HOSE-code prediction + DB curatée ~5k shifts.
  - Intervalles de confiance ±σ continus (vs ordinal 3-niveaux).
  - Server-side enforcement du record-lock (W4-D-09).
  - Validation package : IQ/OQ/PQ scripts, SOPs, GAMP-5 catégorisation, traceability matrix, risk assessment ICH Q9.
- P2 :
  - Export controls + écran OFAC denied parties pour usage international.
  - PDF/A-1b export pour eCTD (W4-D-13).
  - CDXML R-group / Markush (W4-D-11) — bloque les soumissions de séries chimiques.
  - Horodatage RFC 3161 pour la chaîne d'audit.
  - Liste contrôlée de motifs e-signature.

#### Ma recommandation sur la beta publique
**SOFT BETA** — pour usage *recherche académique* et *pédagogie pharmaceutique* uniquement, avec mention explicite "NOT VALIDATED FOR REGULATED USE — 21 CFR Part 11 features in Beta, not production-ready". **NO-GO** pour tout déploiement dans un labo régulé (GMP, GLP, eCTD). L'écart entre "primitives livrées" et "système qualifiable" reste large : sans persistence + dispatcher wiring + viewer + identité utilisateur + enforcement serveur + validation package, je ne peux pas signer une recommandation à un client pharma. Le delta +0.8 reflète un vrai changement de cap (P1-04/05 sont du travail sérieux, pas un placeholder), mais pas une qualification réglementaire — celle-ci nécessite encore au moins une wave dédiée pharma de bout en bout.

#### Mon top 3 pour la wave suivante
1. Finaliser le bloc 21 CFR Part 11 : W4-D-05 (identité SSO/OIDC) + W4-D-06 (persistence IndexedDB) + W4-D-07 (wiring dispatcher) + W4-D-08 (AuditLogPanel viewer) + W4-D-09 (lock serveur) + W4-D-10 (modal app-level wiring). C'est un seul lot cohérent, pas six tickets séparés.
2. Démarrer la validation package : GAMP-5 catégorisation, document IQ/OQ/PQ, traceability matrix demandes-utilisateur ↔ tests, risk assessment ICH Q9. Sans ce paquet, le code livré reste non-soumis-able.
3. HOSE codes + base 13C curatée + intervalles de confiance ±σ continus. Trois waves sans bouger le moteur scientifique NMR, ça suffit — la prédiction reste infalsifiable au sens réglementaire tant qu'on ne publie pas MAE/RMSE/R² sur un dataset de référence (NMRShiftDB2).

### Marina VOLKOV — Étudiante M2 chimie

Ma note V5 : 9.3
Ma note V6 : 9.6
Ma note V7 : 9.4
Delta V6→V7 : -0.2

#### Brief factuel (pré-rempli)
- Features livrées entre V6 et V7 qui me concernent :
  - DEPT-135 / DEPT-90 + hotkey `D` (wave-4 P1-01, `5010575`) — **mon top-1 V6**.
  - Multiplet line list + Shift+I integration toggle (wave-4 P1-02, `1e5caf6`).
  - JCAMP-DX 1D import + overlay expérimental vs prédit (wave-4 P1-03, `542263a`).
  - Wave-6 toolbox canvas-new : 17 outils P0 + 12 hotkeys ChemDraw (V/1/2/3/C/H/N/O/S/R/T/E) — **derrière feature-flag `VITE_ENABLE_NEW_CANVAS` qui par défaut vaut `false`**.
  - Wave-5 quick-edit (hover + N/O/L/M, 1/2/3 cycle ordre) — même flag.
  - Wave-7 HF-1 toolbox 2-colonnes groupé (`2f26598`).
  - Wave-7 HF-2 wiring atom/ring/text/arrow/erase (`0c144fb`).
  - Wave-7 HF-3 clean/refine endpoint + boutons (`c89b71a`).
  - Wave-7 HF-4 fit-to-view restauré (`6e40114`).
  - Wave-7 HF-5 dark/light mode complet pour dialogues + tooltip NMR (`c56f15b`).
  - Wave-7 HF-6 wiring tous les onClick handlers du toolbox (`b1a3697`).
- Mes blockers V6 encore présents :
  - Templates Fischer / Haworth / Newman → toujours absents (P3 v6 §5).
  - Mode quiz / exercice avec auto-grading → toujours absent (P3 v6 §5).
  - Unicode étendu (π, σ, δ⁺/δ⁻) → pas de commit dédié.
  - Curly-arrow snap au midpoint d'une autre flèche → pas adressé.
  - Shapes tool dashed-stroke pour orbitales → pas adressé.
- Mes blockers V6 résolus :
  - DEPT-135 / DEPT-90 overlay → **livré P1-01**, `D` cycle 3 états.
- Mon top 3 V6 — statut :
  1. DEPT-135/DEPT-90 overlay → **SHIPPED** (P1-01).
  2. Templates Fischer/Haworth/Newman → **NOT SHIPPED**.
  3. Mode quiz/exercice → **NOT SHIPPED**.

#### Ce qui s'est amélioré pour moi depuis V6
- DEPT en un seul tap clavier — `D` cycle off → DEPT-90 → DEPT-135, et les CH₂ s'inversent visuellement. Pour expliquer la phase à un binôme de TP, c'est exactement ce qu'il fallait. P1-01 ferme mon plus gros gap V6.
- Le tooltip multiplet montre maintenant chaque raie avec son ppm + son intégration relative. Quand un prof demande "pourquoi ce dd a une raie à 13 % et pas à 25 %", je peux pointer la valeur sans recalculer à la main.
- Shift+I qui montre/cache l'intégration sur ¹H seulement — c'est gated correctement, pas de faux positif quand on est en ¹³C.
- L'import JCAMP-DX me permet, pour la première fois, de superposer mon vrai spectre Bruker du TP avec la prédiction. C'est *énorme* pour le rapport de TP, et c'est exactement la mécanique pédagogique "experimental vs predicted" qui manquait.
- HF-5 : le dark mode est enfin propre sur les dialogues et le tooltip NMR. Avant, ouvrir l'import dialog en dark mode flashait blanc une demi-seconde.
- Les 7 checks pre-commit toujours verts sur ~25 commits depuis V6, zéro `--no-verify`. Ça inspire confiance quand on installe la dernière version sur le poste du labo le matin d'un TP.

#### Ce qui reste problématique ou s'est dégradé
- **Le truc qui me coupe les jambes :** la grosse refonte toolbox wave-6/wave-7 (17 outils, 12 hotkeys ChemDraw, fit-to-view, clean/refine, dark mode dialogues) **est derrière `VITE_ENABLE_NEW_CANVAS` qui par défaut est `false`**. Sur la build publique, je vois l'ancienne toolbox. Tout ce que je lis dans les implementation reports — je le lis, je ne le *touche* pas. Pour une étudiante qui a noté 9.6 sur "fast, web-based, native to my generation", c'est frustrant : la version qui arrive dans mon navigateur n'est pas celle qu'on me décrit.
- Si je force le flag en local, je vois que HF-6 a fixé les `<div>` orphelins qui interceptaient les clics — donc avant HF-6 *même avec le flag à true* la toolbox n'était littéralement pas cliquable. C'est rassurant que ce soit fixé, mais ça veut dire que la fenêtre où le canvas-new était utilisable côté UI est très récente (≤ 24 h).
- Pas de templates Fischer/Haworth/Newman. Pour mon cours de stéréochimie des sucres, je continue à griffonner sur papier puis à scanner. C'est la 3e wave où ce blocker est P3 et glisse.
- Pas de quiz mode. Pour mes binômes de prépa-agreg c'était l'argument "et si on l'utilisait pour réviser entre nous ?" — toujours pas là.
- Curly-arrow midpoint snap pour péricycliques : pas adressé. Quand je dessine un Diels-Alder, la 2e flèche ne s'accroche toujours pas à la 1ère.
- Backend pytest gelé à 242 depuis V5. Yamamoto et Al-Rashid l'ont signalé, mais ça me concerne aussi : aucune nouvelle logique côté moteur NMR. Le rendu DEPT est *display*, pas un nouveau modèle physique.
- Le multiplet "résolu" est en fait une *table* dans un tooltip — le rendu visuel reste une enveloppe lorentzienne (W4-D-03 deferred). Pédagogiquement, montrer un dd sous forme de table ne remplace pas le voir résolu sur le tracé.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît
- HF-3 "clean/refine structure" : je ne savais pas que je voulais un bouton qui remet ma structure d'équerre, mais maintenant je le veux partout.
- HF-1 toolbox 2-colonnes groupée : visuellement plus dense, plus proche d'une palette ChemDraw — moins de scroll vertical sur mon écran 13".
- Wave-5 quick-edit : `N`/`O`/`L`=Cl/`M`=Me en hover, c'est plus rapide qu'ouvrir une palette atom. Une fois qu'on a le réflexe, dessiner un scaffold de 6 hétéroatomes prend 5 secondes.
- Audit trail SHA-256 (P1-04) — pas pour moi directement, mais c'est rassurant pour mon stage chez Servier l'an prochain.
- 23 tests dans la regression suite "toolbox-clicks" après HF-6 — c'est exactement le genre de filet qui évite que ce bug se reproduise.

#### Bugs ou rough edges découverts à l'usage
- Le flag par défaut à `false` n'est documenté que dans le README + `CLAUDE.md` user memory. Un étudiant qui clone et fait `pnpm dev` ne sait pas qu'il rate la moitié des nouveautés. Il faudrait au minimum un toast "Nouveau canvas disponible — activez VITE_ENABLE_NEW_CANVAS=true" en bas de page.
- HF-6 root cause (3 `<div>` qui interceptaient les pointer events) : ça m'inquiète sur la rigueur du QA visuel pre-merge. Les hotkeys marchaient, donc les tests E2E qui tapent au clavier passaient — mais un humain qui clique aurait vu le bug en 5 secondes. Il manque un test "clique chaque bouton et vérifie un side-effect" en CI (apparemment maintenant ajouté, tant mieux).
- Le multiplet line list est en tooltip — pas accessible au clavier, pas copiable. Pour un rapport de TP je voudrais "copier la table" en un clic.
- JCAMP-DX refuse les ASDF strictement. C'est correct techniquement mais le message d'erreur pourrait dire "votre fichier est compressé ASDF, exportez en AFFN depuis MestReNova" plutôt qu'un refus sec.

#### Mes blockers restants (avec priorité)
- P0 : **Flipper `VITE_ENABLE_NEW_CANVAS=true` par défaut** (ou au moins prod). Toute la valeur wave-6/7 est invisible sinon. Le hotfix wave-5 a déjà scoped le flag à toolbox+canvas — le shared shell est protégé, donc le risque de régression est borné.
- P0 : Templates Fischer / Haworth / Newman (carbohydrates + conformations Newman pour stéréochimie). Mon top-2 V6, toujours absent.
- P1 : Mode quiz / exercice avec auto-grading "draw the product" / "push the arrows". Mon top-3 V6.
- P1 : Rendu visuel des multiplets résolus (pas juste la table tooltip).
- P2 : Curly-arrow snap au midpoint d'une autre flèche (péricycliques).
- P2 : Unicode étendu (π, σ, δ⁺/δ⁻).
- P2 : Shapes tool dashed-stroke pour envelopes orbitalaires.
- P2 : Bouton "copier la table multiplet" depuis le tooltip.

#### Ma recommandation sur la beta publique
**SOFT BETA**. Pour mes binômes de M2, je peux la conseiller dès aujourd'hui pour : NMR ¹H/¹³C avec DEPT, JCAMP overlay pour les rapports de TP, dessin avec l'ancienne toolbox (qui marche depuis V5). Mais je ne peux PAS encore leur dire "c'est mieux que ChemDraw" parce que la nouvelle toolbox — l'argument-massue — n'est pas dans la build qu'ils téléchargent. Tant que le flag n'est pas flippé, mon discours commercial reste "outil pédagogique excellent" et pas "remplaçant ChemDraw". C'est ce qui explique mon -0.2 : la version *que les utilisateurs voient* n'a pas autant progressé que la version *que l'équipe a livrée*. Le delta est invisible à mon labo.

Sur le contenu strictement scientifique livré (DEPT + multiplet table + JCAMP overlay), je serais à 9.8. Mais une note d'expert UX qui ne peut pas utiliser la feature phare doit refléter l'écart.

#### Mon top 3 pour la wave suivante
1. **Flipper le flag canvas-new par défaut** (ou exposer un toggle visible dans Settings — pas une variable d'env). Sans ça, wave-6/7 est invisible aux utilisateurs réels.
2. **Templates Fischer / Haworth / Newman** — 3e wave que j'attends, P3 qui dérive depuis V5. Sans ça, je continue à dessiner sur papier pour mes cours de stéréochimie des sucres.
3. **Mode quiz auto-gradé** ("draw the product", "push the arrows") — la feature qui transformerait Kendraw d'éditeur en plateforme pédagogique, et qui n'a aucun équivalent gratuit web.

### Pr. Marie-Claire DUVAL — Chimie organique, Paris-Saclay

Ma note V5 : 8.0 / 10
Ma note V6 : 8.1 / 10
Ma note V7 : 8.6 / 10
Delta V6→V7 : +0.5

#### Brief factuel (pré-rempli)

- Features livrées entre V6 et V7 qui me concernent :
  - DEPT-135/90 UI avec hotkey `D` et CH₂ inversé (P1-01, `5010575`).
  - Multiplets : line list ppm + intégration % en tooltip, toggle `Shift+I` (P1-02, `1e5caf6`).
  - Import JCAMP-DX 1D + overlay expérimental/prédit (P1-03, `542263a`).
  - Writer CDXML 1.0 round-trip testé (P1-06, `e3fc0a9`) — utile pour soumissions ACS/Wiley.
  - Toolbox canvas-new : palette 5 atomes / 3 liaisons / 2 cycles + texte + flèche + gomme, hotkeys ChemDraw C/H/N/O/S/R/1/2/3/V/W/T/E (waves 6/7, derrière `VITE_ENABLE_NEW_CANVAS`, défaut **false**).
  - Quick-edit hover-atom (`N`, `O`, `L`=Cl, `M`=Me, 1/2/3 cycle d'ordre — wave-5).
  - Drag-move avec undo atomique + axis-lock Shift + duplication Ctrl (W4-R-07, `0e69e53`).
  - Snap angle 15° par défaut, Shift = libre (W4-R-05, `5eb3748`).

- Mes blockers V6 encore présents :
  - Multiplets résolus côté **rendu** : la table ppm/% existe dans le tooltip, mais le tracé reste sur enveloppe lorentzienne. Un dd reste visuellement un "m" élargi sur le spectre.
  - HSQC/HMBC/COSY non livrés (deferred W4-D-02, classé XL roadmap wave-6).
  - HOSE codes absents — toujours la même règle additive 13C, donc esters α-halogénés et énol éthers silylés restent off de 5-8 ppm.
  - Pas de NH/OH échangeables badge.
  - Wedge/hash stéréochimie : encore stubbed dans canvas-new (HF-1 a explicitement *retiré* `bond-wedge` et `bond-dash` du toolbox faute d'implémentation backing — voir `docs/deferred-work-toolbox-fix.md`).

- Mes blockers V6 résolus :
  - DEPT UI : enfin visible et exploitable côté frontend (le calcul backend dormait depuis V4).
  - Liste de multiplets lisible avec ratios vérifiés (triplet 25/50/25 ±5 %, quartet 13/38/38/13, dd ≈100).
  - Comparaison expérimental vs prédit possible nativement via JCAMP-DX (overlay orange / prédit bleu).

- Mon top 3 V6 — statut :
  1. DEPT UI → **livré** wave-4 P1-01.
  2. Multiplets résolus avec J en Hz → **partiellement** livré (tooltip OK, rendu courbe pas encore).
  3. Prédiction HSQC → **non livré**, deferred wave-6+.

#### Ce qui s'est amélioré pour moi depuis V6

Le DEPT, c'est un vrai soulagement : la touche `D` cycle off / DEPT-90 / DEPT-135 et les CH₂ s'inversent proprement. Les couleurs/phases sont distinctes et lisibles en cours. Pour mes étudiants L3/M1, je peux enfin illustrer un DEPT en live sans projeter une capture ChemDraw.

L'overlay JCAMP-DX change concrètement ma routine : je tire l'export Bruker brut, je le pose sur la prédiction, et je discute les écarts en TD. C'est une feature que je n'osais plus demander.

Le drag-move à seuil 3 px avec undo atomique a éliminé l'irritation chronique signalée en V5 — déplacer un substituant ne casse plus la liaison et ne pollue plus l'historique avec dix commandes intermédiaires. Le axis-lock Shift est exactement ce qu'on attend d'un éditeur sérieux. Bien joué.

Le quick-edit hover (`N` pour transformer un C en N sur l'atome survolé, `1/2/3` pour cycler l'ordre de liaison) accélère vraiment la mise au propre d'un mécanisme. C'est du Ketcher-grade.

Le writer CDXML round-trip-testé débloque la chaîne de soumission JACS/Org. Lett. : je peux générer mon SI directement, sans repasser par ChemDraw juste pour l'export. Important.

#### Ce qui reste problématique ou s'est dégradé

Le rendu des multiplets résolus n'est pas là. Avoir la table ppm/% en tooltip, c'est bien pour la grille de correction d'un TD, mais pour une figure d'article il me faut le **tracé** d'un dd avec deux J distincts visibles. Là on me sert toujours une enveloppe, c'est frustrant après deux waves.

La stéréochimie reste l'angle mort majeur : pas de wedge/dash dans canvas-new (retirés volontairement par HF-1, ce qui est honnête mais ça pique), pas de descripteurs R/S ni E/Z annotables, et CDXML ne sort que wedge/hash basiques (W4-D-12 deferred). Pour un cours de stéréochimie ou une publi en synthèse asymétrique, c'est bloquant. Comparé à ChemDraw qui gère wedge épais / wedge fin / wavy / hash en un clic, on est encore loin.

La curly-arrow de wave-3 a maintenant l'ancrage atome/liaison/lone-pair, mais sur des liaisons courtes (typ. <40 px à zoom 1×) la double-tête perd son équilibre visuel et la flèche déborde de la liaison. Pour un mécanisme dense type SN2 avec contre-ion, je dois zoomer à 200 % pour que ça soit présentable.

Le toolbox canvas-new est derrière un flag défaut **false**. En l'état, l'utilisateur "normal" ne le voit pas. Je comprends la prudence (HF-6 vient de corriger trois `<div>` orphelins qui interceptaient les clics — bug bête mais révélateur), mais cela veut dire que le travail wave-6/7 ne profite à personne hors équipe tant que le flag ne bascule pas.

Le toolbox 2-colonnes (HF-1) est plus dense et regroupé, mais dans la configuration actuelle, les groupes de cycles (benzène, cyclohexane) ne sont que 2 — il manque cyclopropane / cyclobutane / cyclopentane / cycloheptane qui sont mes templates quotidiens. Pour comparer, ChemDraw expose 8 cycles directement.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît

- Le `Shift+I` qui toggle l'affichage des intégrales sur ¹H : geste fluide, je l'utilise sans y penser.
- L'audit trail SHA-256 (P1-04) — pas mon problème direct, mais quand je collabore avec une thèse CIFRE pharma, c'est rassurant que la traçabilité existe en mode Beta.
- Le mode sombre étendu aux dialogues + tooltip NMR (HF-5) : utile en amphi avec projecteur faible luminosité.
- Le snap d'angle 15° par défaut avec Shift = libre — exactement la convention ChemDraw, je n'ai rien à réapprendre.
- La duplication Ctrl pendant le drag : je l'ai découverte par accident et adoptée immédiatement pour faire des séries d'analogues.

#### Bugs ou rough edges découverts à l'usage

- Curly-arrow double-tête : géométrie qui dégrade sur liaisons courtes (mentionné supra).
- Quand je passe `D` pour cycler DEPT alors que mon spectre actif est ¹H, le hotkey est correctement gated (no-op), mais aucun feedback visuel ne le signale — un toast "DEPT n'est défini que pour ¹³C" éviterait la perplexité.
- Le toggle `Shift+I` n'a pas non plus de feedback quand on tente de l'invoquer depuis ¹³C.
- Sur canvas-new (flag activé), le snap d'angle interagit mal avec l'acyclic chain `X` : la chaîne zigzag continue parfois au-delà du relâchement de pointeur si je relâche pendant que le snap "verrouille".
- Le compound-numbering `Ctrl+Shift+C` (wave-2) fonctionne mais le SVG exporté n'embarque pas toujours la numérotation si j'ai fait `Reset view` entre temps — à vérifier.

#### Mes blockers restants (avec priorité)

- **P0 — Stéréochimie wedge/hash native + R/S/E/Z annotables**, et descripteurs CDXML correspondants. Sans ça, Kendraw ne peut pas servir en synthèse asymétrique ni en cours de stéréochimie. C'est *le* dossier pour wave-8.
- **P0 — Rendu multiplets résolus** (vrai pattern dd/dt/ddd/td sur le tracé, pas seulement tooltip). Promis depuis V5.
- **P1 — HSQC au minimum** (HMBC/COSY suivront). Sans 2D, Kendraw reste un outil ¹H/¹³C 1D, ce qui n'est plus le standard publication.
- **P1 — Catalogue de cycles élargi** (cyclopropane → cycloheptane + indénone/naphtalène). Petit effort, gros gain ergonomique.
- **P1 — Curly-arrow double-tête robuste sur liaisons courtes** + ancrage lone-pair plus permissif (heteroatomes implicites).
- **P2 — Bascule du flag `VITE_ENABLE_NEW_CANVAS` à `true`** une fois wedge/hash et lasso revenus (cf. HF-1 deferred).
- **P2 — Templates Fischer / Haworth / Newman** (bench §4.3 #31). Pédagogiquement précieux.

#### Ma recommandation sur la beta publique

**SOFT GO.** Le produit est clairement utilisable pour un chimiste organicien sur ¹H/¹³C 1D + structure de base + export CDXML, avec un net pas en avant depuis V6 sur DEPT, multiplets-tooltip, JCAMP-DX et drag-move. Mais je ne mettrais pas Kendraw entre les mains d'un étudiant de stéréochimie ou d'un thésard en synthèse asymétrique avant que wedge/hash + R/S soient natifs et que le rendu des multiplets résolus passe du tooltip au tracé. Communication beta : "outil pédagogique 1D + structure 2D + export publi", pas "remplacement ChemDraw complet".

#### Mon top 3 pour la wave suivante

1. **Stéréochimie complète** : wedge plein / wedge hash / wedge wavy + descripteurs R/S/E/Z annotables + roundtrip CDXML stéréo (W4-D-12).
2. **Rendu multiplets résolus** sur le spectre (vrais patterns dd/dt/ddd avec J distincts visibles), avec roof effect activable (deferred W4-D-03).
3. **HSQC prédit** (au minimum) — ouvrir la voie 2D, débloque la roadmap wave-6 et nous met enfin au standard 2026 d'un éditeur NMR.

### Dr. Antoine MARCOS — Synthèse totale, MIT

Ma note V5 / V6 / V7 : 7.8 / 8.1 / **8.5** (+0.4)
Delta V6→V7 : trois de mes blockers historiques bougent enfin (DEPT exploitable, multiplets table, JCAMP-DX import). Le canvas reste le canvas — pas de saut de productivité sur les schémas multi-étapes. CDXML 1.0 round-trip est un signal fort pour le pipeline SI/JACS, mais pas encore validé sur mes molécules cibles. Je lève la note de 0.4 et pas plus parce que la partie « 30-step scheme » de mon métier n'a quasiment pas progressé.

#### Brief factuel (pré-rempli)
- Wave-4 P1-01 (`5010575`) — DEPT-135/90 UI : `D` hotkey gated ¹³C, CH₂ inversé, phase coloring. Ferme ma demande #3 V6.
- Wave-4 P1-02 (`1e5caf6`) — multiplet line list dans le tooltip + `Shift+I` integration toggle gated ¹H. Ferme **partiellement** ma demande #1 (table oui, render résolu non — toujours enveloppe lorentzienne, roof effect deferred W4-D-03).
- Wave-4 P1-03 (`542263a`) — JCAMP-DX 1D import (AFFN, ~95 % Bruker/JEOL/MestReNova), overlay orange sur prédiction bleue. Refus stricts ASDF, NTUPLES, types non-NMR. C'est mon outil de vérification expérimental-vs-prédit.
- Wave-4 P1-06 (`e3fc0a9`) — CDXML 1.0 writer MVP, round-trip testé. R-group / Markush et stéréo au-delà wedge/hash deferred (W4-D-11, W4-D-12).
- Wave-4 P1-04 (`0a7472e`) + P1-05 (`a2b8c9c`) — audit trail SHA-256 + e-signature modal, **labellisés Beta** : tamper-evident, pas non-repudiation (identité utilisateur déférée W4-D-05).
- HOSE codes (ma demande #2 V6) : **NOT SHIPPED**. Toujours XL effort sur le roadmap-to-10 §1.
- Wave-3 acyclic chain `X` (`060ec6d`) — confirmé en place pour mes chaînes longues.
- Wave-6/7 toolbox canvas-new derrière `VITE_ENABLE_NEW_CANVAS=false` par défaut — n'affecte pas mon workflow tant que je ne l'active pas, mais préserve les hotkeys ChemDraw (V/1/2/3/C/H/N/O/S/R/T/E + W).
- Backend pytest **242 — inchangé depuis V5**. Aucun ajout de logique d'engine NMR côté Python.

#### Ce qui s'est amélioré pour moi depuis V6

**Vérification spectrale (gros saut).** Le triptyque P1-01 + P1-02 + P1-03 me donne enfin une boucle utilisable : je dessine ma cible, je passe en ¹³C, je tape `D` pour DEPT-135, je vois CH₂ inversé phase-coloré, je drag-drop le JCAMP-DX du Bruker du labo, et l'overlay orange me dit immédiatement où ma prédiction décroche. Pour un intermédiaire de synthèse classique (esters, cycliques saturés, aromatiques substitués) c'est exploitable en routine. La couverture ~95 % Bruker/JEOL/MestReNova suffit pour 9 spectres sur 10 qui sortent de mon labo. Sur les ASDF compressés et NTUPLES qui restent deferred (W4-D-01 / W4-D-02), je continue de passer par MestReNova pour exporter en AFFN — c'est un workaround acceptable pour la beta.

**Multiplet line list (Shift+I).** Le tableau ppm + percent dans le tooltip ferme l'écart pour la lecture de pattern simple — quand je veux confirmer un triplet 25/50/25 ou un dd ≈100, je l'ai chiffré. C'est la moitié de ma demande #1 V6.

**CDXML 1.0 export round-trip testé.** Pour le pipeline SI/JACS c'est le signal qui change ma posture de « prototype académique » vers « usable en publication ». Bonds wedge/hash/hollow-wedge/wavy/dash, arrows mappés, annotations rich-text. Je n'ai pas encore éprouvé sur mes Markush — et ils savent que ça ne marche pas (W4-D-11 explicite).

#### Ce qui reste problématique ou s'est dégradé

**Le multi-step scheme — toujours pas d'outil scalable.** Soyons honnêtes : pour mes synthèses de polycycles 25-30 étapes, Kendraw n'a **pas** de notion de document multi-page, pas de gestion d'étapes numérotées avec catalyst+conditions au-dessus de chaque flèche, pas de layout auto pour scheme. Le wave-3 a livré dipole/no-go arrows, le wave-4 a livré curly-arrow anchor, mais le workflow « arrow + annotation conditions/catalyst/temps/rendement » qui scale à 30 étapes **n'existe pas**. Pour un scheme JACS je continue d'utiliser ChemDraw. C'est mon blocker #1 résiduel pour V8.

Concrètement : quand je dessine un scheme de 12 étapes pour une retro-synthèse, je veux pouvoir (a) numéroter automatiquement les intermédiaires 1, 2, 3..., (b) attacher au-dessus de chaque flèche un bloc « réactifs / solvant / température / temps / rendement », (c) faire un saut de page au bout du papier sans perdre la connectivité visuelle de la route, (d) exporter le tout en SVG ou CDXML avec les pages préservées. Aujourd'hui je dois faire tout ça en hors-Kendraw.

**HOSE codes — toujours absents.** Ma demande #2 V6, demande #1 de Chen, demandé par 4/8 experts. Sans HOSE, mes esters α-chlorés et énol éthers silylés (TBS, TES) restent à 5-8 ppm off et la boucle de vérification au-dessus reste fragile sur les substrats fonctionnalisés. C'est XL effort, je le comprends, mais c'est le levier de précision le plus important.

**Render multiplet résolu — half-shipped.** La table chiffrée est là, mais le rendu visuel reste enveloppe lorentzienne. Pour pédagogie c'est passable, pour publication ce n'est pas suffisant. W4-D-03 reste deferred.

**Pas de 2D NMR (COSY/HSQC/HMBC).** Pour confirmer la connectivité d'un polycycle complexe c'est l'outil quotidien — Kendraw reste 1D-only.

**Backend NMR engine figé à 242 tests depuis V5.** Yamamoto et moi remontons cette préoccupation depuis trois revues. Toute l'amélioration NMR depuis V6 est UI ; le moteur de prédiction n'a pas évolué. Donc DEPT/JCAMP-DX overlay n'aident pas si la prédiction sous-jacente est encore fausse sur mes substrats.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît

- **Audit trail SHA-256 chain (P1-04).** Pharma feature à l'origine, mais pour un labo académique c'est de la **traçabilité de cahier de manip**. Je peux théoriquement reconstruire l'historique d'édition d'un schéma — utile pour thèse, pour publication, pour réponse aux reviewers. Limité tant que pas wired dans command dispatch (W4-D-07) ni AuditLogPanel visible (W4-D-08), mais le primitive est là.
- **Refus stricts JCAMP-DX (ASDF, missing observe-frequency).** Je préfère un import qui refuse explicitement plutôt qu'un import qui silently mange un fichier mal formé et me sort une overlay trompeuse. Bonne hygiène ingénierie.
- **HF-5 dark mode complet sur dialogs + NMR tooltip.** Je travaille tard la nuit sur les schémas, ça compte.
- **Refine/clean structure endpoint (HF-3).** Je ne savais pas que c'était possible — pour aplatir un dessin manuel hâtif c'est un gain de temps inattendu.
- **CDXML round-trip testé.** Je m'attendais à un export one-way « best effort » ; le fait que ça soit round-trip testé signifie qu'un reviewer JACS qui me renvoie ses annotations dans un .cdx peut être ré-importé sans perte. C'est un chemin que je n'avais pas demandé mais qui ferme une vraie boucle éditeur-auteur.
- **Refus stricts sur JCAMP-DX hors-spec** — l'overlay refuse plutôt que d'inventer ; pour un labo qui fait tourner des spectres de provenance hétérogène (Bruker, JEOL, MestReNova, parfois un .dx exotique d'un collègue), c'est exactement la bonne posture.

#### Bugs ou rough edges découverts à l'usage

- **Curly-arrow anchor snap** (wave-3 carry-over) : excellent sur petite molécule, mais sur polycycle dense les hit zones se chevauchent. J'ai eu trois fois la flèche qui s'ancre au mauvais atome quand deux atomes sont à <12 px à l'écran. Pas un blocker, mais frustrant pour les mécanismes complexes.
- **JCAMP-DX overlay scaling** : sur un spectre étroit (par ex. 0-3 ppm pour un aliphatique) l'overlay orange et la prédiction bleue ont parfois des amplitudes très différentes ; pas de auto-rescale visible. Question pour Yamamoto/Chen aussi.
- **Pas de batch import** : si je veux comparer 8 intermédiaires d'une route synthétique, je dois drag-drop un par un et changer de tab. Pour une session de validation de SI complète sur un papier de 12 intermédiaires, c'est ~30 min de manipulation pure.
- **Audit trail pas wired dans command dispatch** (W4-D-07) : donc les changements de structure que je fais dans un cahier de manip ne sont **pas** capturés par la chaîne SHA-256. Le primitive est là mais c'est encore un dispositif inerte côté workflow réel. Je ne peux pas encore m'en servir comme journal de thèse.
- **Canvas-new flag** : je l'ai testé `=true`, le toolbox 2-col HF-1 est plus lisible, mais quelques tools restent stubbed (lasso, bond-wedge, bond-dash, bond-aromatic, atom-picker, curly-arrow ont été **droppés** en HF-1 pour respecter la règle « no placeholders »). Donc en flag-on je perds curly-arrow — outil critique pour mécanismes. **Je reste sur flag-off pour le moment.**

#### Mes blockers restants (P0/P1/P2)

- **P0** — Multi-page document support + scheme step numbering with conditions block above arrow (catalyst / solvent / temp / yield). Sans ça, je ne peux pas utiliser Kendraw pour un scheme JACS publication-ready.
- **P0** — HOSE codes + extension base ¹³C (esters α-halogénés, énol éthers silylés, carbamates, sulfonates). Sans ça la boucle de vérification expérimental-vs-prédit échoue sur mes substrats fonctionnalisés.
- **P0** — Validation publishable MAE/RMSE/R² vs NMRShiftDB2 sur un sous-ensemble Marcos-relevant (esters, lactones, énol éthers, carbamates, sulfonates). Tant que le moteur n'est pas chiffré, je ne peux pas le citer dans une publi.
- **P1** — Render multiplet résolu (sortir de l'enveloppe lorentzienne), roof effect / 2nd-order pattern derrière `roofEffect` flag (W4-D-03).
- **P1** — Backend NMR engine : ajouter des tests d'unité (cible : passer de 242 → 300+) et publier MAE/RMSE/R² vs NMRShiftDB2.
- **P1** — CDXML R-group / Markush attachment points (W4-D-11) pour mes intermédiaires SI.
- **P2** — 2D NMR (COSY/HSQC/HMBC) — gros chantier, peut attendre wave-9+.
- **P2** — Curly-arrow disambiguation when atoms < 12 px apart.
- **P2** — Audit log wiring complet (W4-D-07/08/10) pour rendre la traçabilité visible et utile au quotidien.

#### Ma recommandation sur la beta publique

**Go pour beta publique restreinte aux usages NMR-prediction + 1D verification + small-molecule drawing.** Avec un avertissement explicite sur la page d'entrée : « Pas conçu pour multi-step schemes >10 étapes ; utilisez ChemDraw ou Reaxys pour les routes synthétiques de publication. » Pour la chimie organique enseignée et la vérification de spectres en M2/PhD c'est largement prêt. Pour ma communauté synthèse totale, Kendraw reste un outil de **support** (vérification ponctuelle d'un intermédiaire, dessin propre d'une molécule pour une slide) et pas un outil de **production** (le scheme complet d'une publication).

Maintenir le canvas-new derrière flag par défaut false jusqu'à ce que curly-arrow + bond-wedge soient de retour est la bonne décision. Ne pas cacher cette restriction aux betatesteurs.

Sur la posture compliance : labeller P1-04/P1-05 comme « Beta — tamper-evident, pas non-repudiation » sur la page d'entrée beta est non négociable. Un PI académique honnête peut s'en servir comme cahier de manip électronique en mode best-effort ; un labo pharma régulé doit attendre l'identité utilisateur (W4-D-05). Cette distinction doit être explicite dans la doc beta — pas enterrée dans un changelog.

#### Mon top 3 pour la wave suivante

1. **Multi-page document model + scheme arrow with annotation block** (catalyst/solvent/temp/yield). C'est la condition sine qua non pour qu'un total-synthesis chemist passe en production sur Kendraw.
2. **HOSE codes** (mes esters α-Cl, énol éthers TBS/TES, carbamates, sulfonates) — débloque la boucle de vérification que vous venez de me donner avec JCAMP-DX.
3. **Render multiplet résolu** (sortir de Lorentzien) + activer le `roofEffect` flag W4-D-03. Une fois ça fait, ma demande #1 V6 est intégralement fermée et je peux remonter à 9.0+.

### Pr. Kenji YAMAMOTO — Spectroscopie / Pédagogie, Kyoto

Ma note V5 / V6 / V7 : 9.0 / 9.1 / **9.5**
Delta V6→V7 : **+0.4**

J'avais mis trois demandes sur la table en V6. Wave-4 m'en a livré
deux pleines (DEPT, JCAMP-DX) et une demie (multiplets : la table
de raies est là, le rendu visuel résolu ne l'est pas encore). Pour
un outil que j'utilise en TD de M1 et en TP-spectro de L3, ça
bascule la balance : je peux préparer un poly entier sans sortir de
Kendraw, et je peux superposer le spectre Bruker du flacon réel au
prédit pour faire toucher du doigt aux étudiants ce que veut dire
"prédiction".

#### Brief factuel (pré-rempli)
- DEPT-90 / DEPT-135 livrés wave-4 P1-01 (`5010575`) — `NmrMode`
  union, hotkey `D` 3-state cycle gaté ¹³C, CH₂ inversé,
  `peakPhaseSign()` truth-tablé. Demande V6 #1 close.
- Multiplet line list + intégration (P1-02, `1e5caf6`) — table
  ppm + % par raie en tooltip non-singlets, `Shift+I` gaté ¹H,
  ratios vérifiés (triplet 25/50/25 ±5 %, dd ≈100). Demande V6
  #2 close à 50 % (rendu visuel résolu déféré W4-D-03).
- JCAMP-DX 1D import + overlay (P1-03, `542263a`) — AFFN, flip
  ascending-ppm, XUNITS PPM/HZ, YFACTOR scaling, ~95 % couverture
  Bruker/JEOL/MestReNova. Refus stricts ASDF / non-NMR /
  fréquence absente. Overlay orange sur prédiction bleue.
  Demande V6 #3 close.
- Cheatsheet searchable (`2b9527e`), sélecteur fréquence
  300/400/500/600 MHz (`ae4a35a`), solvants 6 (pre-V5), tooltips
  confiance + highlight bidirectionnel + numérotation H
  synchronisée — fondation pédagogique pré-V5 préservée.
- A11y SVG metadata (`b2f9c50`) — `<title>` + `<desc>` lisibles
  lecteur d'écran. Signal d'intention plus que conformité WCAG.
- Dark mode wave-7 HF-5 (`c56f15b`) — dialogs et tooltip NMR
  cohérents en sombre. Critique pour amphi/vidéoprojecteur.
- Backend pytest figé à 242 depuis V5 — moteur NMR non modifié
  wave-4 (travail concentré rendu + parsing).

#### Ce qui s'est amélioré pour moi depuis V6
- **DEPT-135 enseignable.** En L3 je passe 20 minutes à expliquer
  pourquoi un CH₂ "descend". Avoir le toggle 3-état avec hotkey
  `D` me permet de basculer en direct devant les étudiants,
  off → DEPT-90 → DEPT-135. Le geste est exactement celui d'un
  spectro de paillasse qui change d'expérience. Pédagogiquement
  c'est précieux.
- **JCAMP-DX qui marche vraiment.** J'ai testé sur 11 spectres
  Bruker exportés depuis TopSpin (1H et 13C), 3 MestReNova, 2 JEOL
  (Delta). Les 16 ont overlay-é correctement. L'orange sur le
  bleu prédit est la bonne palette : daltonien-friendly et
  contrasté projeté.
- **Les refus sont propres.** Quand je nourris un ASDF compressé
  ou un fichier sans `.OBSERVE FREQUENCY` en axe Hz, le message
  d'erreur explique précisément ce qui manque. Pour un TP où 28
  étudiants me ramènent 28 fichiers mal exportés, c'est de l'or.
- **Dark mode complet.** J'enseigne en amphi avec lumière éteinte
  pour le projecteur ; en V6 les dialogs blancs me cramaient
  encore la rétine de la première rangée. HF-5 a fini le travail.
- **Cheatsheet searchable.** Mes étudiants l'ouvrent au TP, tapent
  "intégration", trouvent `Shift+I`. Ça enlève la moitié de mes
  questions individuelles.

#### Ce qui reste problématique ou s'est dégradé
- **Multiplets visuellement non résolus.** La table de raies dans
  le tooltip est un excellent compromis et je m'en sers pour
  pointer "regarde, le triplet c'est 25/50/25", mais le rendu
  graphique reste une enveloppe. Un étudiant qui regarde le pic
  voit toujours une "bosse" ; l'objet didactique pour expliquer
  un AB ou un ABX manque encore. Idéalement je veux voir les
  raies espacées de J Hz directement à l'écran.
- **Trace d'intégration encore maladroite.** L'intégrale
  cumulative monte par paliers, c'est correct, mais le numérique
  (la valeur au-dessus du palier) est *à côté* du palier, pas
  *sur* le palier comme dans MestReNova ou TopSpin. Sur 6
  protons proches en ppm, les chiffres se chevauchent. Pas
  bloquant mais peu lisible projeté.
- **Pas de 2D NMR.** COSY/HSQC/HMBC absent, et c'est la moitié de
  mon cours de M1. Je continue de prédire avec un autre outil
  pour ces TD-là.
- **Pas d'hétéronoyaux.** Pas de ¹⁹F, pas de ³¹P, pas de ¹⁵N.
  Pour la chimie organique de base ce n'est pas critique ; pour
  la spectro avancée ça l'est.
- **Backend tests gelés à 242.** Le moteur de prédiction NMR
  n'a pas reçu un seul test supplémentaire depuis V5. Je ne dis
  pas que les prédictions sont fausses — je dis qu'on n'a pas la
  preuve métrologique chiffrée (MAE/RMSE/R² publiés) qu'elles ne
  régressent pas.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît
- **A11y SVG metadata (`b2f9c50`).** Je n'avais pas formulé la
  demande. J'ai un étudiant malvoyant cette année qui utilise
  NVDA ; le fait que le SVG exporté porte un `<title>` + `<desc>`
  rend le poly partiellement utilisable au lecteur d'écran. C'est
  une attention humaine que je note.
- **Refus JCAMP-DX explicites.** Encore une fois, l'absence de
  prédiction silencieusement fausse vaut mieux que dix prédictions
  vaguement plausibles. C'est une posture scientifiquement
  responsable.
- **Dark mode tooltip NMR.** Détail : le tooltip de pic en mode
  sombre est lisible. En V6 c'était blanc-sur-blanc dans certains
  thèmes. Petit fix mais qui touche au quotidien.

#### Bugs ou rough edges découverts à l'usage
- Sur un ¹³C avec JCAMP-DX overlay, le toggle DEPT répond
  toujours au `D` → DEPT prédit + overlay expérimental coexistent
  visuellement, 3ème couleur à l'écran, sémantiquement ambigu.
- Le sélecteur 300/400/500/600 MHz ne propage pas à l'overlay
  (logique : c'est l'expé qui dicte). Mais pas de note visuelle
  "overlay = X MHz, prédiction recalibrée à X" — un étudiant
  croit voir deux spectres à la même fréquence sans confirmation.
- Pas de quiz / mode exercice (vœu Volkov + moi) — non shippé.

#### Mes blockers restants (P0/P1/P2)
- **P1** — Rendu visuel des raies résolues du multiplet (pas
  juste la table tooltip). C'est ma demande V6 #2 fermée à 50 %.
- **P1** — Numérotation par-palier de l'intégration *sur* le
  palier, pas à côté. Lisibilité projeteur.
- **P2** — Indicateur visuel "overlay = X MHz" sur le panneau NMR
  quand un JCAMP-DX est chargé.
- **P2** — Suite de tests backend NMR qui publie MAE/RMSE/R²
  contre NMRShiftDB2 pour donner un chiffre de confiance
  reproductible.
- **P2** — Quiz mode (Volkov + moi).
- **P3** — 2D NMR (COSY au minimum). Reconnaître que c'est un
  gros morceau, pas un blocker beta.
- **P3** — Hétéronoyaux (¹⁹F/³¹P d'abord).

#### Ma recommandation sur la beta publique
**GO pour la beta publique côté pédagogie.** Kendraw V7 est
prêt à être utilisé en L3 et M1 chimie organique pour
l'enseignement RMN 1D ¹H/¹³C/DEPT. Les prédictions sont
suffisamment réalistes pour enseigner — pas "video game",
plutôt "prédiction respectable avec marges d'erreur explicites".
Le multiplet rendu en enveloppe reste mon réserve principale,
mais la table de raies en tooltip rattrape pédagogiquement. Le
mode sombre + dialog parity + a11y rendent l'outil utilisable
en amphi et inclusif. Pour la M2 spectro avancée et la
recherche, on attendra 2D + hétéronoyaux.

#### Mon top 3 pour la wave suivante
1. **Rendu visuel des raies résolues** (J-coupling visible en
   abscisse Hz, pas seulement table tooltip). Ferme ma demande
   V6 #2 à 100 %.
2. **2D NMR COSY** au minimum (HSQC en stretch). Le seul
   manque qui m'empêche d'utiliser Kendraw pour mon cours M1
   complet.
3. **Suite de tests backend NMR avec MAE/RMSE/R² publiés**
   contre NMRShiftDB2. Sortir de "242 tests figés depuis V5" et
   donner un chiffre de confiance reproductible — pour les
   référés, pour les étudiants, pour moi.

### Dr. Sarah CHEN — Chimie computationnelle, Stanford / NMRShiftDB2

Ma note V5 / V6 / V7 : **8.2 / 8.2 / 8.4**
Delta V6→V7 : **+0.2** — modeste déblocage, mais la stagnation structurelle V5→V6 n'est pas vraiment cassée. On grignote.

#### Brief factuel (pré-rempli)

- V5→V6 : delta zéro. J'attendais une boucle de calibration NMRShiftDB2, un harnais MAE/RMSE/R² publiable, des codes HOSE, σ continu en ppm, et de l'hétéronucléaire (¹⁹F/³¹P/¹⁵N). **Aucun de ces items n'a bougé entre V6 et V7.**
- Wave-1 (rappel, déjà acquis V6) : `sigma_ppm` continu (e6c9a19) + flag `d2o_exchangeable` (e6c9a19) + bandeau reproductibilité/disclaimer (ef8d2bd). C'est le socle minimal honnête sur lequel je peux désormais construire.
- Wave-2/3 : rien de matériel pour le comp-chem.
- Wave-4 P1-01 (`5010575`) : DEPT-135/DEPT-90 phase rendue (CH₂ inversé), 3-state cycle + hotkey `D` gated ¹³C. Cosmétique mais utile en démo.
- Wave-4 P1-02 (`1e5caf6`) : multiplet line list (ppm + % par raie) embarqué dans le tooltip. **C'est exploitable pour de la vérification batch** si je peux scraper le DOM ou si quelqu'un sort un dump JSON.
- Wave-4 P1-03 (`542263a`) : `parseJcampDx1D` (AFFN, XUNITS PPM/HZ, YFACTOR, ascending-ppm flip, refus stricts pour ASDF / non-NMR / freq manquante). **Substrat parfait pour une calibration HOSE sur NMRShiftDB2** — encore faut-il que quelqu'un branche la boucle.
- Wave-4 P1-06 (`e3fc0a9`) : CDXML 1.0 writer, round-trip testé. Bon pour l'interop Cambridge ; reste muet sur MOL+metadata JSON.
- Wave-7 HF-3 (`c89b71a`) : nouveau endpoint `POST /structure/clean` (`backend/kendraw_api/routers/structure.py`) appuyé sur `StructureService.clean()` (`backend/kendraw_chem/structure.py`). **Vérifié : c'est bien RDKit-based** — `mode="quick"` = `Cleanup` + `SanitizeMol` (préserve le layout), `mode="full"` = `AllChem.Compute2DCoords` (recalcule). Fallback no-op si RDKit absent. C'est exactement ce qu'il faut pour normaliser un batch MOL avant prédiction.
- Tests backend pytest : **242 → 242 → 242 → 242**. Inchangé depuis V5. Aucune nouvelle logique NMR engine. C'est le chiffre qui fait mal.

#### Ce qui s'est amélioré pour moi depuis V6

- **DEPT phase visible** (P1-01) : enfin la polarité CH/CH₂/CH₃ est rendue, pas seulement classifiée. Le truth-table de `peakPhaseSign()` est testé. Permet une lecture rapide d'un ¹³C en démo.
- **JCAMP-DX import strict** (P1-03) : couvre Bruker/JEOL/MestReNova ~95 %, refus propres sur ASDF et freq manquante. Je peux maintenant comparer prédiction vs. trace expérimentale sans pré-traitement externe. C'est le seul item « calibration-ready » de la wave et c'est précisément ce que je demandais en V5 sous la rubrique « substrat HOSE ».
- **Multiplet line list** (P1-02) : ratios vérifiés (triplet 25/50/25 ±5 %, quartet 13/38/38/13, dd ≈100). C'est une primitive de vérification numérique correcte ; reste à l'exposer en API/CSV pour qu'elle soit utilisable hors UI.
- **CDXML round-trip** (P1-06) : un format structuré de plus pour l'export inter-laboratoire. Pas un game-changer comp-chem mais ça compte pour l'écosystème Cambridge.
- **`/api/structure/clean` RDKit** (HF-3) : petite mais vraie surface programmatique. C'est le premier endpoint backend depuis V5 qui touche à de la géométrie 2D côté serveur. Le code est propre (`StructureService` probe RDKit à l'init façon `ComputeService`, fallback no-op). Si on continue dans cette direction (un endpoint `/predict` standalone, un `/descriptors`), je tiens enfin un client Python utilisable de bout en bout.
- **Audit trail SHA-256** (P1-04, V4) : pertinent pour l'angle reproductibilité/provenance que je défends depuis V5. Pas mon top-3 mais ça aide la défense en peer-review (« voici la chaîne de hash de mes 47 corrections de structure entre soumission et révision »).
- **Disclaimer reproductibilité Wave-1** (`ef8d2bd`) toujours en place et bien visible : c'est le minimum éthique et il n'a pas été retiré sous pression marketing.

#### Ce qui reste problématique ou s'est dégradé

- **Aucun client Python officiel.** Je dois toujours scripter contre l'API REST FastAPI à la main, sans schémas pydantic exportés, sans SDK, sans pagination batch. Pour 10 000 molécules je suis encore obligé de boucler en async manuel.
- **Aucun harnais d'évaluation NMRShiftDB2-grade.** Pas de jeu de test public, pas de MAE/RMSE/R² publiés, pas de comparaison vs. nmrshiftdb2/MestReNova/ACD. La promesse « prédiction NMR » ne peut toujours pas être citée dans un papier sans excuses.
- **Pas de codes HOSE.** L'algorithme reste additive-table + RDKit. Roadmap Effort XL, Impact +0.8 — toujours pas planifié.
- **Pas d'hétéronucléaire** (¹⁹F / ³¹P / ¹⁵N). Bloqueur dur pour la chimie médicinale fluorée (la moitié des candidats pharma actuels).
- **Pas de prédiction 2D (HSQC/COSY/HMBC).** Demandé par Duval aussi.
- **Backend test count plat à 242** — confirme qu'aucune nouvelle logique chimie n'a été ajoutée. Toute la wave-4/5/6/7 est frontend + IO + canvas-new behind flag. Le moteur scientifique n'a pas bougé.
- **Pas de batch endpoint** pour SMILES/MOL → prédiction. Toujours du one-shot via UI.
- **`d2o_exchangeable` reste un flag binaire** sans logique de masquage de la zone H₂O/D₂O ni indication presat/WATERGATE — V6 demande P2 toujours ouverte.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît

- **`/api/structure/clean` avec mode `quick` vs `full`.** L'idée de séparer « préserve mon layout » et « recompute from scratch » est exactement la bonne abstraction pour un pipeline batch : `quick` avant validation visuelle, `full` avant export inter-format. Je n'avais pas demandé, je le prends.
- **Multiplet line list machine-lisible** (même si encore dans tooltip) : la table per-line est une vraie primitive numérique. Avec une route `/api/nmr/multiplets` je l'utiliserais demain.
- **JCAMP-DX strict-refusal** : le refus explicite sur ASDF / freq manquante est plus précieux qu'un parser permissif qui hallucine. Bonne hygiène.
- **CDXML writer** : pas dans mon top-3 mais ça réduit la friction quand un collaborateur Cambridge envoie un fichier.

#### Bugs ou rough edges découverts à l'usage

- `/api/structure/clean` : le contrat de retour mélange `cleaned` (str), `changed` (bool) et un éventuel `error` (str). Le docstring mentionne `error="RDKit not available"` mais le `CleanResult` n'est pas une discriminated union dans le schéma OpenAPI — un client typé qui consomme la spec va devoir gérer `error: str | None` à la main. À durcir avant qu'un script de batch s'y casse les dents en silence.
- Pas de garantie que `parseJcampDx1D` survive aux JCAMP avec multi-pages (NTUPLES) ou aux 2D — non testé hors 1D. Le scope est explicite, donc plus une « rough edge documentée » qu'un bug. À mentionner dans le README import.
- Le multiplet line list est rendu dans le tooltip DOM ; pas d'API stable pour le récupérer côté programmatique. Si le markup change (et il va changer avec canvas-new), les scripts de scraping cassent.
- L'audit trail (P1-04) est marqué **« beta — tamper-evident, not non-repudiation »** : pas d'identité utilisateur. Pour mes besoins reproductibilité c'est OK ; pour la pharma compliance c'est un trou (cf. Al-Rashid).
- Le mode `full` de `/structure/clean` (`Compute2DCoords`) écrase la disposition utilisateur sans warning ni preview — un utilisateur qui clique « Clean » s'attendant à `quick` peut perdre son layout. Confirmation modale recommandée.
- Aucune métrique observabilité côté `StructureService` (pas de compteur de clean appelés, pas de timing) : difficile de profiler un batch.

#### Mes blockers restants (P0/P1/P2)

- **P0** — SDK Python officiel `kendraw-client` (typed, pydantic-export, async batch, retries). Sans ça je ne peux pas vendre Kendraw au labo comme outil reproductible.
- **P0** — Harnais d'évaluation publié : un repo `kendraw-bench` avec NMRShiftDB2 subset + MAE/RMSE/R² par nucléus + comparison table vs. ACD/MNova. Sans ça, score scientifique plafonne à 8.5.
- **P1** — Codes HOSE (Bremser 1978) comme prédicteur de premier rang, fallback ML/additive ensuite. Effort XL mais c'est le gold standard et 4/8 panélistes le demandent.
- **P1** — Hétéronucléaire ¹⁹F au minimum (³¹P et ¹⁵N idéalement).
- **P1** — Endpoint batch `POST /api/nmr/predict-batch` acceptant SMILES/MOL list, retournant CSV ou JSON-Lines.
- **P2** — Solvent-suppression display (greyed water region 4.5–4.9 ppm + presat/WATERGATE indicator) et badge confiance NH échangeable visible dans le panneau.
- **P2** — `/api/structure/clean` exposé dans l'OpenAPI avec discriminated union sur `error`, et un mode `"strict"` qui échoue dur si RDKit absent (utile pour les scripts CI).
- **P2** — Endpoint `/api/descriptors` (LogP, tPSA, HBD/HBA, MW, Lipinski/Veber/Egan/Ghose) en POST batch. Tout le code RDKit existe déjà côté `compute.py`, il faut juste l'exposer en REST avec un schéma stable.
- **P2** — Export MOL+metadata JSON unifié (atom map IDs + assignments NMR + integration values + audit chain hash) pour le round-trip avec ELN/LIMS. Le format CDXML ne couvre pas mes besoins JSON-natifs.

#### Ma recommandation sur la beta publique

**Beta publique GO conditionnel**, mais en cadrant strictement le périmètre marketing : « éditeur 2D + prédiction NMR ¹H/¹³C indicative + IO JCAMP-DX/CDXML/MOL ». **NO-GO** sur tout claim « NMR prediction quality » tant que le harnais MAE/RMSE/R² n'est pas publié. Ne JAMAIS écrire « NMRShiftDB2-comparable » dans le README ou la landing page sans benchmark à l'appui — ce serait une faute scientifique qui rebondira en peer-review et entachera la crédibilité du projet pour 2 ans. Le `disclaimer` Wave-1 (`ef8d2bd`) est correct, le garder bien visible et l'épingler aussi sur la doc OpenAPI du `/api/nmr/predict`.

Conditions précises : (a) page « Limitations » dans la doc qui liste explicitement « pas de HOSE, pas d'hétéronucléaire, pas de benchmark publié » ; (b) version semver `0.x` maintenue (pas de `1.0` avant le harnais) ; (c) tag `[BETA]` sur l'endpoint `/api/structure/clean` dans OpenAPI tant que le contrat de retour n'est pas durci.

#### Mon top 3 pour la wave suivante

1. **`kendraw-client` Python (PyPI)** + `POST /api/nmr/predict-batch` — déblocage programmatique réel.
2. **`kendraw-bench` repo public** : NMRShiftDB2 subset (1000 molécules ¹H + 1000 ¹³C), pipeline `predict → MAE/RMSE/R² par nucléus`, table comparative honnête. C'est un weekend de travail et ça change la crédibilité scientifique d'un facteur 2.
3. **¹⁹F prediction (HOSE-lite ou additive table dédiée)** — entre dans le moteur backend, fait monter le pytest count au-dessus de 242 enfin (un signal lisible que la chimie scientifique avance, pas seulement le canvas), et débloque la chimie médicinale fluorée qui représente ~50 % des candidats actifs.

---

**Verdict synthétique :** la stagnation V5→V6 n'est pas vraiment cassée — c'est un déblocage modeste, pas un vrai shift. Le `+0.2` traduit trois choses concrètes : (1) l'arrivée d'IO scientifique propre (JCAMP-DX strict + CDXML round-trip), (2) un premier endpoint backend post-V5 (`/structure/clean` RDKit-based), et (3) une primitive numérique de vérification (multiplet line list). Mais le moteur NMR lui-même n'a pas bougé d'une ligne (242 tests pytest inchangés), aucun client Python n'existe, et aucun benchmark publiable n'a été produit. La wave suivante doit absolument adresser au moins l'un des trois axes (SDK / bench / hétéronucléaire) sous peine de revoir la note à 8.0 en V8.

### Dr. Lisa PARK — Ex-PM ChemDraw, Produit

Ma note V5 / V6 / V7 : 8.3 / 8.6 / **8.9** (+0.3)
Delta V6→V7 : +0.3. La toolbox 2-colonnes + 12 raccourcis ChemDraw + CDXML round-trip + audit/e-sig Beta = un vrai bond produit. Plafond limité par (a) flag canvas-new toujours `false` par défaut donc invisible aux utilisateurs publics, (b) absence d'une galerie de templates / reactions library, (c) zéro biopolymer mode. Sans le HF-6 j'aurais sanctionné à 8.0 — livrer une toolbox visuellement complète mais inerte aurait été un désastre de crédibilité en beta.

#### Brief factuel (pré-rempli)
- Wave-4 P1-06 — CDXML 1.0 writer, round-trip testé (`e3fc0a9`) : prolog + DOCTYPE + fonttable/colortable, atoms (charge/isotope/radical), bonds (wedge/hash/hollow-wedge/wavy/dash/bold/dative), arrows mappés ArrowheadHead/Tail/NoGo.
- Wave-4 P1-04 audit trail SHA-256 + P1-05 record lock + ESigModal (`0a7472e`, `a2b8c9c`) — explicitement Beta : tamper-evident, **pas** non-repudiation.
- Wave-6 (`f7b48a7` → `d6ff22c`) : 17 outils P0 câblés + 12 single-key shortcuts ChemDraw (V/1/2/3/C/H/N/O/S/R/T/E) + 16 unit + 16×2 E2E.
- Wave-7 HF-1 (`2f26598`) : toolbox 2-colonnes groupée — la disposition que les reviewers QA reconnaissent immédiatement.
- Wave-7 HF-2 (`0c144fb`) : atom/ring/text/arrow/erase câblés.
- Wave-7 HF-3 (`c89b71a`) : Clean Structure (Shift+Ctrl+K) + Refine (Ctrl+Shift+L) — **parité ChemDraw directe**.
- Wave-7 HF-4 (`6e40114`) : fit-to-view bouton restauré.
- Wave-7 HF-5 (`c56f15b`) : dark/light mode complet sur dialogs + tooltip NMR.
- Wave-7 HF-6 (`b1a3697`) : 3 placeholder `<div>` interceptaient les clicks → tous les boutons inertes en mode souris (le clavier marchait, ce qui a masqué le bug). Fix + 23 tests régression toolbox-clicks.
- Coverage post-wave-3 : rubric 67/75 = 89 %, full-surface 63 %, keyboard parity 31/35. Wave-4 ajoute 2 raccourcis NMR (33/35). Wave-6/7 non re-scorés mais ajoutent 12 hotkeys outils.
- Flag `VITE_ENABLE_NEW_CANVAS` = **false par défaut** (`feature-flags.ts`). Swap toolbox+canvas only, shell partagé préservé (`8f5090b`, mémoire CLAUDE).

#### Ce qui s'est amélioré pour moi depuis V6
- **CDXML writer (9/10 PM win).** Le seul format qui débloque vraiment la migration depuis ChemDraw. Round-trip testé, wedge/hash/dative supportés, arrows mappés correctement. C'est le morceau qui fait basculer un labo PerkinElmer-captif. Si je vendais Kendraw demain, c'est mon hero feature de la slide 2.
- **Audit + e-sig Beta.** P1-04/P1-05 ferment la béance V6 sur 21 CFR Part 11. Le wording "Beta — tamper-evident, not non-repudiation" est honnête, c'est exactement comme ça qu'il faut le marketer. La modal ESigModal est `role="dialog"` + `aria-modal` — elle passera l'audit accessibilité.
- **Toolbox 2-colonnes + groupée (HF-1).** Esthétiquement c'est enfin "pro". L'œil retrouve les groupes ChemDraw : sélection/dessin/atomes/cycles/annotations/I-O. Onboarding QA reviewer = 5 min au lieu de 30.
- **Clean / Refine structure (HF-3).** C'est le bouton que tout chimiste cherche en premier. Shift+Ctrl+K = parité ChemDraw exacte. Bien joué.
- **Dark mode complet (HF-5).** Les dialogs et le tooltip NMR étaient les deux dernières taches. C'est fini, c'est polish.
- **DEPT UI + JCAMP-DX overlay** (P1-01/P1-03) — pas mon top 3 V6, mais ça calme Al-Rashid et ça donne une story "experimental vs predicted" vendable en démo.
- **HF-6 = sauvetage de crédibilité.** Sans ce fix, n'importe quel reviewer ouvrant la beta aurait conclu "c'est cassé" en 30 secondes. La toolbox visible mais inerte est le pire des mondes : pire qu'absente. Le fait qu'on ait attrapé ça avant la flip publique + 23 tests régression + sentinel `elementFromPoint` = qualité de processus PM.

#### Ce qui reste problématique ou s'est dégradé
- **Le flag est toujours `false` par défaut.** C'est mon problème PM #1. Toute la valeur wave-6/7 est invisible sur kendraw.fdp.expert sans `VITE_ENABLE_NEW_CANVAS=true`. Soit on flippe, soit on assume que la beta publique tourne sur l'ancien canvas — auquel cas pourquoi avoir investi 6 hotfixes dans le nouveau ? Choisir.
- **Workflow d'annotation de pics d'impureté toujours absent** (mon V6 demand #1). Listé W4-11 P2 v6 §5. C'est la feature que les analystes process-R&D demandent en premier ; sans elle, Kendraw reste "drawing tool with NMR sidebar" plutôt que "NMR-first product".
- **Pas d'export numérique d'intégration vers LIMS** (Empower / LabWare). MOL+metadata JSON round-trip absent. CDXML aide pour ChemDraw mais pas pour les pipelines analytiques.
- **Audit trail pas encore wiré au dispatch.** P1-04 existe mais W4-D-07 (wiring chokepoint) + W4-D-06 (persistence IndexedDB) + W4-D-08 (AuditLogPanel viewer) tous non livrés. La chaîne de hash est invisible à l'utilisateur final = audit qui n'audite rien en pratique.
- **Print CSS clip à 1440p toujours là** (mon V6 blocker mineur). Pas mentionné dans aucun commit wave-4/5/6/7.
- **Compound numbering ne propage toujours pas** dans NMR panel title ou export integration trace.
- **Pas de pricing model.** "MIT free forever" est une force narrative mais sans tier Pro/Enterprise il n'y a pas de réponse à "pourquoi un labo régulé migrerait d'un produit supporté commercialement". Question viabilité posée par tout VP R&D.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît
- **HF-3 Clean/Refine.** Pas dans mon V6 top-3 mais c'est de la parité ChemDraw pure. Tout démo à un user PerkinElmer commence par "tiens, dessine ce truc moche" → bouton Clean → "ah ouais, OK". Vente faite.
- **Hotkey W routé sur arrow** (wave-6) — petit détail mais c'est la muscle memory ChemDraw.
- **Shared shell preservation rule** (`8f5090b` + canvas-new-shell-fix.md). Côté process PM c'est exactement la bonne discipline : on prototype le canvas sans casser le NMR panel, le PropertyPanel, le StatusBar. Quand on flippera, le user verra la nouvelle toolbox sans perdre ses repères périphériques.
- **23 tests régression HF-6 + sentinel hit-test.** C'est le genre de défense en profondeur qu'un PM produit sérieux exige après un near-miss.

#### Bugs ou rough edges découverts à l'usage
- Flag par défaut false → nouveau toolbox invisible en prod publique : pas un bug mais une décision PM à expliciter.
- Audit chain non visible à l'utilisateur (W4-D-08 viewer absent) : un end-user ne peut pas vérifier que sa propre activité est tracée → faux sentiment de conformité.
- E-sig modal pas wirée au menu Fichier ni à un raccourci global (W4-D-10) : feature livrée mais inatteignable sans intent test.
- 6 tool-kinds droppés en HF-1 (lasso, bond-wedge, bond-dash, bond-aromatic, atom-picker, curly-arrow) — bonne décision "no placeholders" mais documenter publiquement les unblock thresholds avant que les users les redemandent.
- Arrow tool inclut wedge stub (V6 toolbox) — clarifier : est-ce un raccourci wedge ou un vrai arrow ?

#### Mes blockers restants (P0/P1/P2)
**P0 (bloquent la beta publique sur new canvas) :**
1. Flipper `VITE_ENABLE_NEW_CANVAS=true` ou afficher un toggle utilisateur in-app — décision binaire, plus possible de différer.
2. Wirer audit trail au dispatch + persister IndexedDB + livrer AuditLogPanel viewer (W4-D-06/07/08). Sans ça, le claim 21 CFR Part 11 Beta est trompeur.

**P1 (dégradent la promesse produit) :**
3. Impurity peak annotation workflow (mon V6 #1, toujours absent).
4. Per-user identity layer (W4-D-05) pour passer de tamper-evident à non-repudiation — sinon le label Beta restera Beta indéfiniment.
5. CDXML R-group / Markush (W4-D-11) + stereo descriptors (W4-D-12) + PDF/A-1b eCTD (W4-D-13). Les pharma reviewers demanderont les 3.
6. Re-scorer la rubric et le 176-feature audit post wave-6/7 — on annonce "+12 hotkeys" mais aucune ligne du benchmark n'est mise à jour.

**P2 (limitent l'expansion mais pas la beta) :**
7. Structure gallery / templates galerie (Fischer / Haworth / Newman / steroids / sucres) — feature parité ChemDraw "Templates".
8. Reactions library (Named reactions, conditions, mécanismes prêts).
9. Biopolymer / BioDraw mode (peptides, oligos, glycans, PEG-n) — Chen le demande, c'est aussi un must-have ChemDraw Pro.
10. Print CSS clip 1440p.
11. Pricing model : tier Free / Pro / Enterprise avec les hooks (audit log persistant + SSO + support SLA en Enterprise).

#### Ma recommandation sur la beta publique
**GO conditionnel** sur deux gestes simultanés :

1. **Flipper le flag** (`VITE_ENABLE_NEW_CANVAS=true` en prod) ou ajouter un toggle in-app "Try the new canvas (beta)". Sans l'un des deux, la beta publique ne montre pas le travail des waves 4-7. C'est un gâchis PM.
2. **Marketer l'audit/CDXML/e-sig comme Beta explicit** — pas comme "compliant". Le wording de l'impl report §"Compliance posture statement" est exactement le bon. Reprendre tel quel dans le UI, le README, et la home.

Sans flip + sans wording compliance honnête → **NO-GO** : on vend du vent qu'on a pas activé.

Avec les deux → **GO Beta** avec disclaimer "tamper-evident, not non-repudiation; per-user identity coming wave-8".

#### Mon top 3 pour la wave suivante
1. **Flipper le flag + AuditLogPanel viewer + audit dispatch wiring** (W4-D-06/07/08). C'est la trinité qui transforme wave-4-à-7 d'un investissement invisible en valeur livrée.
2. **Impurity peak annotation workflow** (mon demand V6 #1 toujours en suspens). Click peak → label/%/assignment/confidence → render in-screen + Ctrl+P + numeric integration table export. C'est le diff Kendraw-vs-ChemDraw sur le terrain analytique.
3. **Structure gallery (P0 templates : steroids, sugars, amino acids, common pharmacophores) + Clean Structure visual feedback.** Zero-friction onboarding pour les users qui ouvrent Kendraw pour la première fois et veulent dessiner du sucralose en 10 secondes. Marie le storytelling "ChemDraw-parity" avec une démo virale.

### Thomas WEBER — Admin IT université

Ma note V5 / V6 : 9.2 / 9.4
Ma note V7 : 9.3
Delta V6→V7 : -0.1

#### Brief factuel (pré-rempli)
- Production live à `kendraw.fdp.expert` depuis wave-4 (Traefik + Let's Encrypt, SSL Labs A) — pré-V6, déjà acquis (`fcce83c`, `04147cc`).
- Hook Husky pre-commit toujours vert : 7 checks (lint, tsc, vitest, ruff check, ruff format, mypy, pytest) tenus sur ~25 commits depuis V6, **zéro `--no-verify`** (impl reports wave-4/5/6).
- `bd1ea60 chore(deploy): docker config updates + deploy script` post wave-6 — incrémental, pas de changement d'architecture documenté (ni multi-stage, ni rate-limit middleware).
- E2E : projets Playwright étendus à `chromium` + `chromium-new-canvas` (`8f5090b`, `ecc289b`) ; HF-6 (`b1a3697`) ajoute une suite de 23 specs toolbox-clicks avec sentinel `elementFromPoint`.
- Audit trail SHA-256 wave-4 P1-04 (`0a7472e`) — `verifyAuditChain()` typé sur 4 modes d'échec, 15 unit tests adversariaux. Beta : in-memory, pas d'identité par utilisateur, pas encore wiré au dispatcher (W4-D-06/07/08/09/10).
- Modal e-signature P1-05 (`a2b8c9c`) — `role="dialog"`, `aria-modal`, raison ≥ 3 chars validée data + UI.
- Wave-7 = 6 hotfixes UI sur le canvas-new ; aucun touche infra/observabilité/sécurité.
- **Toujours pas livré depuis V6** : Sentry, Prometheus `/metrics`, Grafana, UptimeRobot, rate-limit Traefik sur `/predict` et `/nmr`, multi-stage Dockerfile, split pre-commit/pre-push, image CI + curl `/health` pre-merge, tags d'image au git SHA, backup/rollback documenté, agrégation de logs, dependency scanning (Dependabot/Trivy/pip-audit/pnpm audit), audit CSP/security headers.

#### Ce qui s'est amélioré pour moi depuis V6
- **Discipline CI tenue sur la durée.** ~25 commits depuis V6, hook 7-check qui passe à chaque fois, zéro bypass. C'est exactement le signal que je veux voir avant d'autoriser un déploiement multi-utilisateurs sur l'infra de la fac. Beaucoup de projets dégradent la CI au premier sprint sous pression — Kendraw non.
- **Audit trail SHA-256 + e-sign modal** : ce sont des primitives que **je** réutiliserai pour mon dossier conformité côté DSI, pas seulement les pharmas. Les 4 modes d'échec typés (`hash-mismatch`, `previous-hash-mismatch`, `sequence-gap`, `sequence-restart`) sont exactement ce que je veux exposer dans un endpoint de vérification. La rigueur des 15 tests adversariaux (mutation post-hoc, entrée retirée, contrefaçon réattachée) est rare.
- **Suite E2E doublée par flag** (`chromium` + `chromium-new-canvas`) : la rampe canvas-new ne casse pas la prod, je peux activer/désactiver `VITE_ENABLE_NEW_CANVAS` côté reverse proxy ou env file sans dérouler de migration.
- **HF-6 toolbox-clicks regression spec** (`b1a3697`) : 23 tests + sentinel `elementFromPoint` sur des `<div>` orphelins qui interceptaient les pointer events. C'est précisément le genre de régression silencieuse que les tests fonctionnels classiques ratent. Ajouté au catalogue de patterns que je recommande.
- **Doc `canvas-new-shell-fix.md` + règle "le flag swap toolbox + canvas only, jamais le shell"** : règle écrite, ancrée en mémoire user (`CLAUDE.md`), et désormais protégée par tests. Côté audit code, c'est un invariant clair que je peux vérifier.

#### Ce qui reste problématique ou s'est dégradé
- **Zéro avancement sur mon top-3 V6.** Aucun commit depuis V6 ne mentionne Sentry, Prometheus, Grafana, UptimeRobot, rate-limit, multi-stage Dockerfile, ou split pre-commit/pre-push. `bd1ea60` est cosmétique. Six waves de canvas-UX en deux jours, zéro ligne d'observabilité.
- **`/predict` et `/nmr` toujours sans rate-limit.** Un script naïf (étudiant, bot, fuzz) peut saturer les workers RDKit. Pour un déploiement public sur `kendraw.fdp.expert`, c'est un risque opérationnel concret — pas théorique.
- **Image Docker non re-testée en CI post hooks-additions.** Aucun job qui build l'image prod et curl `/health` avant merge. Je ne sais pas si l'image actuelle démarre proprement avant qu'elle arrive en prod.
- **Pas de tag d'image git-SHA documenté.** Rollback = "redéployer la branche d'avant et prier". Inacceptable pour un service avec utilisateurs réels.
- **Pas de stratégie backup.** Les données utilisateur (audits in-memory pour l'instant — mais quand IndexedDB W4-D-06 atterrira ?) n'ont pas de chemin de restauration.
- **Pas de scan de dépendances.** Dependabot, Trivy, pip-audit, pnpm audit — rien. Les `.jar` côté Cobbleverse sont hors scope mais Kendraw a un `package-lock.json` et un `uv.lock` qu'il faudrait surveiller automatiquement.
- **Pre-commit toujours full 7-check** (~30-60 s). Sur un repo qui commit beaucoup, c'est de la friction qui finira par produire un `--no-verify`. Le split pre-commit (rapide) / pre-push (full) est un correctif d'1h.
- **Pas d'audit CSP / security headers** documenté. SSL Labs A c'est bien ; HSTS, CSP, X-Content-Type-Options, Referrer-Policy à vérifier explicitement avant beta publique.
- **Logs containers éphémères.** Pas d'agrégation. En cas d'incident production je n'ai que `docker logs` et la mémoire courte du container.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît
- **Le `CLAUDE.md` "Mandatory CI checks before push"** explicitement documenté avec les 7 commandes en ordre. C'est le genre de runbook que j'imprime et colle au mur du bureau. Tout nouveau dev qui rejoint le projet sait en 30 secondes ce qu'il doit lancer.
- **Le sentinel `elementFromPoint` de HF-6** comme pattern réutilisable pour les régressions de hit-test. Je le recommande déjà à deux autres projets internes de la fac.
- **La règle "no placeholders" appliquée à HF-1** (suppression de 6 entrées tool-kind sans implémentation) — discipline de code rare. Préfère retirer un bouton non-fonctionnel plutôt que livrer un stub. Côté ops, ça réduit drastiquement les tickets "X ne marche pas" qui finissent dans ma file.
- **Audit trail réutilisable hors pharma** : pour une DSI universitaire avec exigences RGPD sur les modifications de données scientifiques, le hash chain typé est précisément ce qu'il me faut. Bonus : la modal e-sign + meaning enum s'aligne quasi naturellement avec un workflow de validation de protocole de TP.
- **Le script `scripts/full-check.sh`** mentionné dans `CLAUDE.md` (full local CI + E2E en une commande) — pour mes vérifs avant de tirer une release sur l'infra.
- **Husky check des marqueurs de conflit + syntaxe Python** ajouté pré-V6 et tenu : élimine la classe entière de "merge moisi commité par erreur" qui m'a déjà coûté des heures sur d'autres projets.
- **Le `MEMORY.md` user persistant** ("Canvas-new Flag Scope", "CI Before Push") montre une discipline de mémoire institutionnelle inhabituelle. Côté admin, ça veut dire que les invariants critiques ne se perdent pas entre deux sprints.
- **Aucun `--no-verify` sur 25 commits**. Stat brute, mais c'est probablement la métrique la plus rassurante du dossier V7. La règle "fix le hook plutôt que le bypass" tient.

#### Bugs ou rough edges découverts à l'usage
- HF-6 lui-même est révélateur : trois `<div>` orphelins qui interceptent silencieusement les events pendant on-ne-sait-combien-de-jours et que **les hotkeys masquaient** (clavier OK, souris cassée). Ça suggère qu'il manque un test "tous les boutons visibles déclenchent une action" généralisé, pas juste 23 spécifiques au toolbox actuel. Un test à la Storybook smoke-test conviendrait.
- Pas vu de healthcheck Docker explicite documenté (`HEALTHCHECK` directive dans le Dockerfile) — à confirmer mais aucun commit ne le mentionne. Sans `HEALTHCHECK`, Traefik ne peut pas retirer automatiquement une instance malade du round-robin.
- Pas vu de timeout sur `/predict` côté backend ; une molécule pathologique RDKit peut bloquer un worker indéfiniment et faire tomber l'instance.
- `VITE_ENABLE_NEW_CANVAS=false` par défaut → en prod actuelle on tourne sur l'**ancien** canvas. Il faut clarifier publiquement quel canvas est servi à `kendraw.fdp.expert` ce soir, et si on flip, prévoir une fenêtre de rollback < 5 min.
- Pas de `.env.example` clair pour les variables sensibles (DSN Sentry futur, secrets API si NMRShiftDB2 atterrit, etc.) — à anticiper avant qu'un dev commite un secret par accident.
- Pas de policy explicite sur la rétention des audits in-memory : que se passe-t-il si le navigateur d'un utilisateur crashe en plein workflow signé ? La chain est perdue. W4-D-06 (IndexedDB) urgent.

#### Mes blockers restants (P0/P1/P2)
**P0 (bloquant beta publique multi-utilisateurs):**
1. Rate-limit Traefik middleware sur `/predict` et `/nmr` (1 fichier middleware + 2 routes).
2. CI job qui build l'image prod + curl `/health` + tag image git-SHA. Sinon zéro chemin de rollback.
3. Multi-stage Dockerfile ; image actuelle traîne build toolchain en prod = surface d'attaque + poids.

**P1 (avant communication large):**
4. Sentry FE+BE (DSN env vars, exclusions PII, source maps upload).
5. Prometheus `/metrics` FastAPI + scrape interval + 3 dashboards Grafana minimum (latency p50/p95, error rate par endpoint, RDKit queue depth).
6. UptimeRobot (ou équivalent self-hosted) sur `/health` à 1 min.
7. Split pre-commit (lint+typecheck) / pre-push (full) ; correctif d'1h.
8. Dependabot + Trivy + pip-audit + pnpm audit en CI hebdo.
9. Audit CSP/security headers documenté + test E2E qui assert les headers.

**P2 (avant 1.0):**
10. Backup/restore strategy documentée (audit log persisté côté serveur, pas juste IndexedDB W4-D-06).
11. Log aggregation (Loki ou équivalent).
12. Multi-tenant isolation + RBAC + SSO/SAML — pour usage facultaire.
13. OpenTelemetry traces (FE→BE→RDKit) pour debug perf cross-stack.

#### Ma recommandation sur la beta publique
**GO WITH STRONG RESERVATIONS.** Le code livré est propre, la CI est tenue, l'audit trail et l'e-sign modal renforcent même mon dossier RGPD. Mais shipper une beta publique sans rate-limit, sans observabilité, sans rollback documenté, sans scan de dépendances, c'est exploiter par foi — pas par méthode. Mon top-3 V6 a été **complètement ignoré** au profit de six waves de polish UI. Je comprends la priorisation produit (la wave canvas-new était critique pour Park / Duval / Yamamoto), mais à V8 je veux du concret côté ops sinon ma note baissera vraiment, pas juste de 0.1.

Si demain on a 50 utilisateurs simultanés et un script étudiant qui fuzz `/predict`, l'incident sera invisible (pas de Sentry), non-mesuré (pas de Prometheus), et non-récupérable proprement (pas de rollback tagué). C'est sur ce scénario que je note. Pour pousser à 9.7+ il me faut **observabilité + rate-limit + rollback** — c'est environ 2-3 jours de travail bien scopé, pas une refonte. Pour descendre vers 9.0 ou moins il suffirait d'un incident prod non-monitoré, ou d'un `--no-verify` qui casse la chaîne de confiance CI.

#### Mon top 3 pour la wave suivante
1. **Observabilité minimale viable** : Sentry FE+BE (DSN env vars, source maps upload, exclusion PII) + Prometheus `/metrics` FastAPI + 1 dashboard Grafana (latency p50/p95, error rate, RDKit queue depth) + UptimeRobot sur `/health` à 1 min. Pas négociable avant beta publique.
2. **Rate-limit Traefik middleware sur `/predict` + `/nmr`** + **multi-stage Dockerfile** (target < 200 MB, builder/runtime split) + **CI image-build job** qui curl `/health` et tag image `kendraw:<git-sha>` avant merge. Stack ops complète d'1 sprint, rend rollback trivial (`docker pull kendraw:<previous-sha> && docker compose up -d`).
3. **Pre-commit split** (lint+typecheck rapide < 5s) **/ pre-push full battery** + **Dependabot + Trivy + pip-audit + pnpm audit** en CI hebdo + **audit CSP/security headers** documenté avec test E2E qui assert HSTS/CSP/X-Content-Type-Options/Referrer-Policy. Hygiène sécurité automatisée — sinon un CVE silencieux finira en prod et c'est moi qui prends l'appel à 3h du matin.


---

## Section III — Composite synthesis

### III.1 V5 → V6 → V7 evolution table

| Expert       | Discipline                | V5  | V6  | V7  | Δ V6→V7 | Recommendation public beta            |
| ------------ | ------------------------- | :-: | :-: | :-: | :-----: | ------------------------------------- |
| Al-Rashid    | Pharma / FDA              | 7.0 | 6.8 | **7.6** | **+0.8** | SOFT BETA academic ; NO-GO regulated |
| Marcos       | Synthèse totale, MIT      | 7.8 | 8.1 | **8.5** | **+0.4** | SOFT BETA — academic publication       |
| Duval        | Chimie organique, Saclay  | 8.0 | 8.1 | **8.6** | **+0.5** | SOFT GO conditional on stereo polish  |
| Chen         | Comp-chem, Stanford       | 8.2 | 8.2 | **8.4** | **+0.2** | SOFT BETA — modeste déblocage        |
| Park         | Ex-PM ChemDraw            | 8.3 | 8.6 | **8.9** | **+0.3** | GO conditional (flip flag + audit UI) |
| Weber        | Admin IT, Novartis        | 9.2 | 9.4 | **9.3** | **−0.1** | GO with strong reservations            |
| Volkov       | M2 student, Moscow State  | 9.3 | 9.6 | **9.4** | **−0.2** | SOFT BETA (flag default off penalty)   |
| Yamamoto     | Spectro / pédagogie, Kyoto | 9.0 | 9.1 | **9.5** | **+0.4** | GO for L3/M1 pedagogy                  |

### III.2 Composite scores

**Arithmetic mean (8 panelists, equal weight)**

V7 = (8.6 + 8.5 + 9.5 + 8.4 + 8.9 + 7.6 + 9.4 + 9.3) / 8 = 70.2 / 8 = **8.775**

V6 baseline (recomputed from individual notes) = 67.9 / 8 = **8.4875**

**Δ V6 → V7 = +0.29**

**Weighted research (Duval, Marcos, Chen, Al-Rashid ×2 ; Yamamoto, Park, Volkov, Weber ×1 ; divisor = 12)**

V7 = (2·8.6 + 2·8.5 + 2·8.4 + 2·7.6 + 9.5 + 8.9 + 9.4 + 9.3) / 12 = 103.3 / 12 = **8.608**

V6 = (2·8.1 + 2·8.1 + 2·8.2 + 2·6.8 + 9.1 + 8.6 + 9.6 + 9.4) / 12 = 99.1 / 12 = **8.258**

**Δ V6 → V7 = +0.35** (research-weighted, the metric the user asked us to track)

The research-weighted score moves more than the arithmetic because the four research-side experts (Duval/Marcos/Chen/Al-Rashid) all moved up while two of the three positive-bias experts (Volkov, Weber) ticked down by small amounts. **Wave-4 was a research-side wave**, and the math validates it.

### III.3 Read of the four critical signals (from the prompt's "think carefully" list)

**Al-Rashid +0.8 — wave-4 paid off.** P1-04 (audit trail with SHA-256 hash chain) and P1-05 (e-signature modal with reason-for-change) are the two pharma-specific deliveries that moved his note. He explicitly notes the deliveries are "Beta primitives" — in-memory only, no SSO identity, no dispatcher wiring, no viewer, no server enforcement, no validation package. So the +0.8 is "I see the plumbing, not the product." For a +1.5 in V8 he wants the wiring and a viewer. **Verdict on the V6→V7 thermometer: pharma frustration is meaningfully apaisée but not resolved.**

**Volkov −0.2 — UX regression detected (flag-off penalty).** Her V6 9.6 was the panel ceiling. Drop to 9.4 is small but it's the only direction-of-travel signal we have on the student / power-user front, and it points at the right symptom: a headline canvas refactor that ships behind a default-false flag is a UX disappointment for users who came expecting it. The fix is not more features — it's flipping the flag (which requires resolving Marcos's missing wedge / curly-arrow tools first).

**Chen +0.2 — stagnation modestly broken, not resolved.** Wave-1 sigma_ppm + d2o_exchangeable, wave-4 JCAMP-DX import, HF-3 RDKit-based `/api/structure/clean` are the deliveries that touch comp-chem. None of them are her V6 top-1 (NMRShiftDB2 evaluation harness on a public test set + Python API client). +0.2 = "I see you trying" but not the structural shift she wants. Backend pytest moved 242 → 249, but the +7 are wave-7 HF-3 structure-clean tests; the NMR engine itself has added zero tests since V5 — the smoking gun stands.

**Yamamoto +0.4 — pedagogy GO is the safest single use case.** DEPT-135 phase, multiplet rendering, JCAMP overlay, dark-mode polish, searchable shortcut cheatsheet — every one of his V6 demands moved or shipped. His +0.4 takes him to **9.5**, the highest delta-adjusted note in the panel. Pedagogy is the cleanest "ship it" lane.

### III.4 Consensus blockers (≥ 2 experts)

| Blocker                                                                 | Cited by                              | Priority | Effort estimate |
| ----------------------------------------------------------------------- | ------------------------------------- | :------: | :-------------: |
| Flip `VITE_ENABLE_NEW_CANVAS=true` after closing wedge/curly-arrow gap | Volkov, Park, Marcos, Duval (4)       |   P0     | 1-2 weeks       |
| AuditLogPanel UI + on-disk persistence + dispatcher wiring             | Al-Rashid, Park, Murat (3)            |   P0     | 1 week          |
| Observability stack (Sentry + UptimeRobot + rate-limit on `/predict`) | Weber, John, Murat (3)                |   P0     | 3 days          |
| CDXML round-trip e2e + JCAMP overlay e2e                                | Murat, Marcos (2)                     |   P0     | 3 days          |
| Multi-page document support for >12-step schemes                       | Marcos, Duval (2)                     |   P1     | 3+ weeks        |
| Resolved multiplet rendering (line spectra, not lorentzian envelope)  | Marcos, Yamamoto (2)                  |   P1     | 1 week          |
| Stereochemistry polish (wedge/dash micro-geometry, R/S labels)         | Duval, Marcos, Park (3)               |   P1     | 1 week          |
| README honesty pass (drop "successor to ChemDraw", relabel compliance) | John, Al-Rashid (2)                   |   P0     | 1 day           |

### III.5 New demands consensual in V7 (didn't exist in V6 or were not articulated)

| Demand                                                                            | Cited by                | Priority |
| --------------------------------------------------------------------------------- | ----------------------- | :------: |
| AuditLogPanel viewer (read-only) on the audit-chain primitive                    | Al-Rashid, Park         | P0       |
| Server-side enforcement of audit append (currently client-trusted)               | Al-Rashid, Murat        | P0       |
| Rate limit on `/predict` (single chokepoint visible from public deploy)            | Weber, John, Murat      | P0       |
| Dropdown / overflow strategy for tools that didn't make 17-P0 cut (wedge etc.)  | Park, Sally             | P1       |
| `:focus-visible` rings on ToolButton (a11y violation flagged by Sally)           | Sally                   | P1       |
| One unified tooltip system (replace native `title` on ToolButton with theme-aware) | Sally, Yamamoto        | P1       |


---

## Section IV — Cross-cutting auditor track (John, Sally, Murat)

Three product-quality audits run in parallel with the panel reassessment, scoped to verify whether a public-beta launch in the current state is sound or whether it is held back by issues the panelists glimpse but don't see in full.

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

# V7 Audit — Sally, Senior UX Designer

Scope: 3 visible UX novelties from waves 5-7. Read the wave-6 spec, the
HF-6 handler-fix doc, and the shipped source under
`packages/ui/src/canvas-new/toolbox/*`, `ImportDialog.tsx`,
`packages/nmr/src/NmrPanel.tsx`, `design-tokens.css`, and the HF-3
keydown wiring in `App.tsx`.

---

## 1. 2-column grouped toolbox (HF-1 + HF-2)

- **Spec drift, deliberate but unowned.** Spec promises one column at
  56 px with long-press flyouts. Ship is two columns at 80 px min, no
  flyouts, no chevrons. Decision may be defensible (denser) but no doc
  amends the spec — next reviewer reads "one column" and finds two.
  Write an ADR or update the spec. ChemDraw refugees will notice.
- **Dead labels.** Every `ToolDef` carries a 3-letter `label` ("Bz",
  "Cy6", "Txt", "Arw", "SMI", "Mol") that the renderer never shows —
  buttons are icon-only. Either expose them as captions at ≤1280 px
  (the spec's "implicit label" promise) or delete the field.
- **No hover, no `:focus-visible`.** Inline styles transition only on
  the `data-active` flip; there is no hover, no keyboard focus ring.
  Tab through the rail and you cannot tell where you are. Hard fail on
  any a11y audit. Easy fix — move to CSS module + add states.
- **Active fill hardcodes `color: '#000'`** while the dialog HF-5
  introduced `--kd-color-text-inverse` for exactly this. One token,
  not two conventions.
- **Dropped tools have zero affordance.** HF-1 removed lasso, three
  bond variants, atom-picker, curly-arrow without leaving greyed
  "coming soon" stubs (which the spec explicitly designed). A ChemDraw
  refugee finds nothing where lasso should be and no signal it's
  planned — discoverability regression on top of a feature regression.

## 2. Dark / light mode for dialogs + NMR tooltip (HF-5)

- **Native `title` attribute everywhere in the toolbox.** OS-chrome
  tooltip ignores the entire HF-5 work; the peak-tooltip in NmrPanel
  got themed styling, the rail did not. Two tooltip systems.
- **Scrim ratios feel inverted.** Dark scrim `rgba(0,0,0,0.5)`, light
  scrim `rgba(0,0,0,0.25)`. Light themes typically need a *stronger*
  scrim to separate modal from a bright canvas, not weaker. Bump light
  to 0.35-0.4.
- **Token coverage is partial.** Fixed: ImportDialog, MoleculeSearch,
  NMR tooltip. Not audited: ESigModal (P1-05), planned AuditLogPanel,
  PropertyPanel headers, cheatsheet overlay. Calling it "complete
  dark/light mode for dialogs" overstates — it's complete for two.
- **Mixed token + literal-fallback pattern.** Most NmrPanel lines now
  read `var(--kd-color-text-secondary, #a0a0a0)`; border-left stays
  raw `conf.color` (intentional per commit). Fine, but invites future
  contributors to copy whichever pattern they hit first. Document.

## 3. Clean / Refine button + hotkeys (HF-3)

- **Two buttons, one mental model.** Clean (Ctrl+Shift+K, sanitize
  preserving layout) and Refine (Ctrl+Shift+L, recompute 2D coords)
  are sibling icons in the View group with no copy difference at the
  button level — only the title. ChemDraw collapses both into one
  command. Combine with a long-press variant (matches the spec's own
  flyout pattern) or label unambiguously ("Sanitize" / "Re-layout").
- **Silent failure.** `cleanStructure` "leaves the scene untouched on
  empty / network / RDKit / parse failure." No toast, no status flash.
  A user clicks Refine on a complex structure, sees nothing happen,
  and cannot tell whether layout was already optimal or whether the
  backend timed out. Bare minimum: StatusBar message.
- **No disabled state on empty canvas.** Button stays clickable with
  zero atoms; the helper no-ops. Disable button + hotkey when
  `atoms.length === 0`.
- **Wrong group.** Both sit in `view` next to fit-to-view. Fit is a
  viewport op; clean/refine are structural transformations — belong
  with edit (next to undo), so Ctrl+Z immediately rescues a Refine the
  user didn't want, and spatially that's where ChemDraw users hunt.
- **Cheatsheet gap.** Ctrl+Shift+K/L are not in the wave-2
  searchable-shortcut panel — discoverability gap.

---

## Verdict

These are not cosmetic. Three categories matter for the global panel
score:

- **Affordance gaps** (no focus-visible, no hover state, no disabled
  state on Clean/Refine, dropped tools without stubs) — accessibility +
  learnability hit. **−0.2 to −0.3.**
- **Spec / ship drift** (1-col → 2-col, "complete dark mode" that
  isn't, dead `label` field, two tooltip systems) — credibility hit
  for any reviewer who reads the spec then runs the app. **−0.1 to
  −0.2.**
- **Silent failure on Clean/Refine** is the single sharpest edge — a
  pharma reviewer will fail it on first click. **−0.1 alone.**

Net: I'd dock the global UX-flavored score by **−0.3 to −0.5** on a
10-point scale relative to a clean review. Volkov (V6 9.6) probably
still gives a 9.4-9.5 because the wins outweigh; Park (V6 8.6)
plausibly drops to 8.3-8.4 on the silent-failure + ESigModal-still-dark
combo; Yamamoto unchanged because his pedagogical features all
landed. The cumulative panel impact is **roughly −0.1 to −0.2 on the
average**, which sits inside noise but is the easiest 0.2 to recover
before V8: ship focus rings, a single tooltip system, a status-bar
message on Clean/Refine, and update the spec or the ship to match.

— Sally

Confirmation: I made no code edits — this is an audit-only report
saved to `docs/scratch/v7-audit-sally.md`.

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


---

## Section V — Verdict on public beta

### V.1 Three-lane verdict

The panel does not have a single binary GO/NO-GO. The verdict splits along use-case lines:

| Lane                               | Verdict       | Endorsed by                            | Conditions                                                                                                            |
| ---------------------------------- | :-----------: | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Academic teaching (L3 / M1)**    | **GO**        | Yamamoto 9.5, Volkov 9.4, Duval 8.6   | None blocking; fix the cheatsheet to include Ctrl+Shift+K/L (Sally HF-3 finding)                                      |
| **Academic publication / sketching** | **SOFT GO**   | Duval 8.6, Marcos 8.5, Park 8.9       | Stereochemistry polish (wedge/dash micro-geometry); CDXML round-trip e2e                                              |
| **Computational / batch NMR**       | **SOFT BETA** | Chen 8.4                               | Python API client; NMRShiftDB2 evaluation harness on a public test set; backend pytest count must move from 242       |
| **Pharma / FDA-regulated / GxP**   | **NO-GO**     | Al-Rashid 7.6 (positive but explicit) | AuditLogPanel viewer + on-disk persistence + dispatcher wiring + server-side enforcement + SSO identity + IQ/OQ/PQ doc |
| **IT-managed self-host**            | **GO with reservations** | Weber 9.3                  | Sentry + UptimeRobot + rate-limit on `/predict` (V6 top-1 carried unchanged)                                         |

### V.2 Aggregate launch posture

The aggregate verdict for a **publicly announced beta** is **CONDITIONAL GO**, gated on four pre-launch items that were unanimous between John (PM), Sally (UX), Murat (TEA), and the consensus-blocker table:

1. **README honesty pass** — relabel pharma-compliance section as "Experimental, validation in progress" ; drop "successor to ChemDraw" wording ; refresh test counters which currently claim 618 + 242 + 24 vs actual 677 + 249 + 28+1. (Effort: 1 day. Owner: tech-writer.)
2. **Production observability** — Sentry SDK on frontend + Sentry-FastAPI on backend, UptimeRobot on `/api/health`, rate-limit middleware (slowapi) capping `/predict` at 60 req/min/IP. (Effort: 3 days. Owner: backend + ops.)
3. **AuditLogPanel viewer** — read-only React panel that reads the in-memory chain, displays entries with hash + reason + timestamp + actor placeholder. Persistence to SQLite-WAL or JSONL on shutdown / interval. Dispatcher wiring so that mutating commands write to chain. (Effort: 1 week. Owner: full-stack.)
4. **Feedback channel** — public link to GitHub Discussions or a `/feedback` endpoint that POSTs to a dedicated repo issue tracker, in the footer of the public build. (Effort: 0.5 day.)

If the four items above ship in the next 1–2 weeks, the panel collectively endorses a **public beta announcement** with the messaging proposed by John (§Auditor track).

If any of the four slips, the recommendation defaults to **continued SOFT BETA** — keep the URL public, keep the feature flag off, do not announce on chemistry-academic mailing lists or hacker-news, do not issue a press release, do not invite Twitter mentions.


---

## Section VI — Wave-8 plan (next two weeks)

### VI.1 Focus

**Single theme: "ship the headline."** Wave-7 closed the toolbox bug (HF-6) but did not flip the feature flag. Wave-8 closes the gap between what shipped in waves 4–7 and what a public-beta visitor actually sees and trusts.

### VI.2 P0 stories (BMAD-formatted)

#### W8-S-01 — Flip canvas-new flag to default true

**As a** chemistry student visiting kendraw.fdp.expert
**I want** the new toolbox + ChemDraw hotkeys + clean/refine to be active by default
**So that** what I see matches what the docs and review describe

**AC**:
- `frontend/packages/ui/src/featureFlags.ts` `newCanvas` defaults `true`
- E2E `chromium` and `chromium-new-canvas` projects both pass
- All 28+ e2e specs pass with the new canvas
- Wedge / curly-arrow gap closed (W8-S-04 dependency) before the flip

**Effort**: 4 days (gated on W8-S-04)

#### W8-S-02 — AuditLogPanel viewer + persistence

**As a** lab admin or QA reviewer
**I want** to see the audit chain entries in a read-only panel and have them survive a backend restart
**So that** the audit primitive becomes a feature

**AC**:
- React `AuditLogPanel` component listing entries (hash, parent, reason, actor, ts)
- Persistence: append entries to JSONL `~/.kendraw/audit-{date}.jsonl` on commit + verify chain on app boot
- `kendraw_audit/dispatcher.py` middleware that wraps mutating store commands and pushes to chain
- E2E test: open audit panel after edit, see entry, restart backend, see entry persists
- Backend pytest +5 cases on chain integrity

**Effort**: 1 week

#### W8-S-03 — Production observability

**As an** ops admin
**I want** Sentry capturing JS + Python errors, UptimeRobot pinging `/api/health`, and `/predict` rate-limited
**So that** the public beta survives the first surge of traffic

**AC**:
- `@sentry/react` initialised with DSN env var, breadcrumb on tool activation
- `sentry-sdk[fastapi]` initialised in `backend/kendraw_api/main.py`
- `slowapi` rate-limit on `/predict`: 60 req/min/IP
- UptimeRobot URL added to README + `docs/deployment.md`
- Backend pytest: 1 case verifying 429 on burst

**Effort**: 3 days

#### W8-S-04 — Bond-wedge + curly-arrow tools restored in canvas-new

**As an** organic chemist
**I want** the wedge (single + double + dashed) and curly-arrow tools to work in the new canvas
**So that** flipping the flag does not regress publication-grade structure drawing

**AC**:
- `BondWedgeTool` parity with legacy
- `CurlyArrowTool` parity with legacy with bond/atom snap (wave-3 520f89d behaviour)
- Toolbox group "stereo" populated with wedge variants
- Unit tests + 2 e2e specs

**Effort**: 4 days

#### W8-S-05 — README honesty pass + test-counter refresh

**As a** prospective user
**I want** the README to reflect what actually shipped, not aspirational claims
**So that** I don't feel misled when I try the tool

**AC**:
- "Successor to ChemDraw" wording dropped, replaced with positioning consistent with Park's V7 take
- Pharma-compliance section relabelled "Experimental — validation in progress"
- Test counters refreshed: 677 FE / 249 BE / 28+1 e2e
- Beta caveats listed (no audit viewer yet, no SSO, etc.) in a single visible section

**Effort**: 1 day

#### W8-S-06 — CDXML round-trip e2e + JCAMP overlay e2e

**As a** TEA / release engineer
**I want** the two highest-trust I/O paths covered by e2e
**So that** the panel-cited claims survive a refactor

**AC**:
- `frontend/e2e/cdxml-roundtrip.spec.ts` exercising export → re-import → assert atom + bond identity
- `frontend/e2e/jcamp-overlay.spec.ts` exercising drag-drop + spectrum render
- Both pass on `chromium` and `chromium-new-canvas` projects

**Effort**: 2 days

### VI.3 Total wave-8 effort (P0 only)

≈ **3 weeks of single-developer work** (with overlap on independent stories: W8-S-03, W8-S-05, W8-S-06 can run parallel to W8-S-02 and W8-S-04).

### VI.4 Deferred to wave-9

- Multi-page document support (Marcos blocker, large)
- Resolved multiplet rendering (Marcos + Yamamoto P1)
- Python API client for batch use (Chen P0)
- NMRShiftDB2 evaluation harness (Chen P0 — also wave-9 because it requires acquiring/labelling a public test set)
- Stereochemistry micro-geometry polish (Duval P1, can piggy-back on W8-S-04 if scope allows)
- Backup / restore strategy + multi-tenant isolation (Weber P1)
- Dropdown / overflow strategy for tools that didn't make P0 cut (Park P1, Sally P1)
- Replace native `title` tooltips with theme-aware system (Sally P1)

### VI.5 Critère de succès for V8

Composite arithmetic mean ≥ **9.0**, weighted research mean ≥ **8.85**, with no panelist below **8.0** and Al-Rashid specifically ≥ **8.2**. If those numbers hit, beta status promotes from CONDITIONAL to UNCONDITIONAL.

---

## Section VII — Closing notes

The panel notes that wave-4 and the wave-7 hotfix series are the most concentrated quality lift Kendraw has had since wave-1. Six waves in seven days produced one credibility-saving fix (HF-6), one product polish pass (HF-1 through HF-5), and a working pharma-compliance primitive that did not exist in V6.

The panel also notes that **none of this work is visible to a public-beta visitor today**. The feature flag is the largest single product gap. Closing it is the central job of wave-8.

The next review (V8) is scheduled for after wave-8 ships, expected in ~2 weeks (2026-05-02).

— End of V7 review.
