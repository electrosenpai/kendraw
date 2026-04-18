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
