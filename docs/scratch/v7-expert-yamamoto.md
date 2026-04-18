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
