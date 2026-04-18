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
