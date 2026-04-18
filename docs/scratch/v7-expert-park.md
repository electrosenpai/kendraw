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
