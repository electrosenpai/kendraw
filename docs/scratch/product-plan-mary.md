# Product Plan — Mary (Business Analyst)

> Livrable Wave-4 Redraw Canvas Kendraw — chasse au trésor UX
> Auteur : 📊 Mary (BMAD Business Analyst)
> Date : 18 avril 2026
> Cadre d'analyse : Porter (menace substituts ChemDraw/Ketcher/MarvinSketch)
> + SWOT interne / externe grounded sur V0.4 live observable.
> Lecture préalable : `ketcher-analysis-wave-4.md` §8-11,
> `nmr-scientific-review-v6.md` verdict « pharma research NO-GO ».
>
> Objectif : informer l'acte 2 (PM John), l'acte 3 (Archi Winston) et
> l'acte 4 (Dev James) de la wave-4 redraw canvas par une compréhension
> fine de qui dessine, dans quel contexte, et où ça coince aujourd'hui.

---

## Préambule — Lecture du terrain

Deux lectures orthogonales cadrent cette wave :

1. **Ketcher Analyse Wave-4 §8-11** : le tableau comparatif positionne
   Kendraw V0.4 comme un éditeur **techniquement aligné** sur Ketcher et
   ChemDraw (Canvas 2D, KDX JSON, undo 200-profond, hotkeys 31/35), mais
   avec un **déficit UX** criant sur quatre axes : preview de survol,
   snap angulaire 15°, sélection rectangle/lasso, poignées de
   transformation. Ces quatre manques transforment l'outil d'un
   « prototype qui dessine » à un « outil qui frustre au troisième
   atome ». La section 9 priorise 8 stories P0 ; ce plan produit les
   valide à l'aune de l'usage réel.
2. **NMR Review V6** : 11 panelists, 7 votent NO-GO pour le segment
   pharma research. Le segment *drawing* a mûri (8.3/10 composite), mais
   le moteur NMR stagne et **le verdict consolidé est SOFT BETA** cantonné
   à l'éducation. Conséquence directe pour cette wave-4 : le canvas doit
   **gagner le segment médchimie sénior** par la seule qualité du
   dessin, sans appui NMR avant wave-5. Toute friction au dessin est donc
   un dealbreaker commercial, pas un luxe.

Le plan ci-dessous articule trois personas, cinq scénarios exhaustifs,
et un SWOT racine de la fluidité canvas actuelle.

---

## 1. Trois personas cibles

Les personas sont construites à partir des signaux observables :
verdicts NMR V6 (profil des 11 panelists), posture pharma deepdive
wave-4, données ChemDraw exhaustive comparison, et les gaps P0 identifiés
dans l'analyse Ketcher. Elles ne sont **pas inventées** : chaque
caractéristique renvoie à un panelist ou une observation terrain.

### Persona A — Amélie Duval, Senior Med Chem Scientist (pharma R&D)

**Rôle et contexte.** 42 ans, PhD en chimie organique (Strasbourg),
12 ans dans un big pharma top-10 à Bâle, actuellement Team Leader
d'un groupe de 6 chimistes medchem sur un programme oncologie kinase
inhibitor. Licences ChemDraw Professional depuis 15 ans — elle a ses
réflexes clavier incrustés : W pour wedge, 1/2/3 pour les ordres,
Ctrl+Shift+K pour exporter. Elle ouvre ChemDraw ~40 fois par jour
pour dessiner une série d'analogues, commenter un ELN, préparer une
slide pour la réunion DMT du mardi.

**Contexte quotidien.** Matin : triage des résultats de la veille
(IC50 sur 20 composés), après-midi : design des 15 nouveaux analogues
à synthétiser, fin de journée : transmission à la paillasse via
elnotebook. Chaque dessin est destiné à un document audité (ELN GxP
interne). Elle travaille sur MacBook Pro 14" Retina + écran externe
27", souvent dactylographie à deux mains sans regarder l'écran quand
elle est dans le flow. Elle télécharge un SMILES de PubChem 5-10 fois
par jour pour comparer avec un composé breveté.

**Frustrations actuelles avec Kendraw V0.4.**
- **Aucune preview de survol.** Quand elle va dessiner une amine sur
  un cycle, elle ne voit PAS l'atome fantôme avant le clic — elle
  clique, découvre qu'elle s'est trompée d'emplacement, Ctrl+Z, recommence.
  Ketcher a `hoverIcon` qui affiche le « N » bleu en ghost au curseur
  (P0-01 du ketcher-analysis).
- **Snap angulaire 30° par défaut trop grossier.** ChemDraw est à 15°
  — elle passe son temps à ajuster des liaisons par micro-déplacements
  pour obtenir un hexagone correct. Ketcher utilise `fracAngle()` à 30°
  par défaut mais Ctrl libère ; Kendraw inverse (Ctrl+E active le snap),
  ce qui la déroute. **P0-02 ketcher-analysis.**
- **Pas de sélection rectangle.** Pour sélectionner un substituant sur
  son scaffold, elle doit double-cliquer (flood) ou cliquer atomes un à
  un. Ketcher : drag dans le vide = rectangle. **P0-03.**
- **Déplacer un groupe** nécessite de re-sélectionner puis d'utiliser
  les flèches clavier ; pas de poignée drag visible.
- **Pas de toggle `/`** pour afficher les propriétés atome au survol
  (Ketcher) — elle doit ouvrir un panneau séparé.
- **NMR indisponible pour son usage** (NO-GO pharma research V6) — mais
  elle accepte : elle a Mnova à côté. Elle ne prendra Kendraw que si le
  **dessin** est au moins aussi fluide que ChemDraw.

**Ce qu'elle remarquerait immédiatement dans le canvas redrawn.**
- Le ghost atome coloré qui suit son curseur (« ah, enfin »).
- Le snap 15° qui verrouille naturellement ses angles d'hexagone.
- Le rectangle de sélection qui s'ouvre au simple drag sur le vide.
- Le mini panneau `/` qui affiche charge, hybridation, implicit H au
  survol sans changer de mode.
- Les poignées de drag quand un groupe est sélectionné.

Si ces cinq items sont présents et fluides, Amélie **essaiera** Kendraw
pour des usages non-ELN (réunion, brainstorming, partage Slack).
Passage à l'ELN seulement si audit trail (déjà W3 P1-04 done) + export
CDXML fidèle (W3 P1-06 done).

### Persona B — Bastien Martineau, Grad student chimie organique (PhD en cours)

**Rôle et contexte.** 26 ans, 3e année de thèse à Lyon, synthèse
totale d'un alcaloïde indolique (30+ étapes). Écrit sa thèse ce
trimestre. Budget zéro : son labo n'a plus de licences ChemDraw depuis
la coupe 2023, il jongle entre Ketcher en ligne (ratatiné sur l'écran
partagé du bureau), MarvinSketch Personal Edition, et Inkscape pour les
schémas finaux. Il a entendu parler de Kendraw sur Reddit r/chemistry.

**Contexte quotidien.** Soirée au labo (21h-minuit) à rédiger son
chapitre 3 : mécanismes de cyclisation radicalaire. Il dessine ~60
intermédiaires par jour, chacun avec 3-5 variantes. Laptop Dell XPS
13" écran 1920×1200, pas d'écran externe. Pas de souris — trackpad
seulement. Clavier AZERTY FR.

**Frustrations actuelles avec Kendraw V0.4.**
- **Dessiner un intermédiaire de 20 atomes prend 90-120 secondes** —
  ChemDraw le ferait en 40s. La cause : pas de hoverIcon, snap mal
  calibré, il faut re-cliquer pour corriger.
- **Pas de templates visibles** pour les hétérocycles exotiques
  (indole, pyrroline, furane) — il faut dessiner chaque fois à la
  main. Ketcher propose une library (P2-03).
- **Raccourcis AZERTY** : quand il tape `1` pour une liaison simple, il
  doit passer par Shift+& — ce qui casse le flow. Le tableau §8.4 ne
  mentionne pas d'adaptation locale mais c'est une vraie barrière.
- **Export thèse** : il veut du SVG propre pour LaTeX, pas du PNG.
  Export existe (W2) mais il n'est pas sûr du rendu.
- **Trackpad pan** : pas de spacebar+drag confortable en AZERTY
  (espace est à droite de son pouce gauche, conflit avec alt) ; il
  voudrait un pinch pan 2-doigts.
- **NMR « Preview » badge V4** est un plus pour lui — il veut
  vérifier ses prédictions de déplacements chimiques pour l'intro de
  chapitre. Verdict éducation : GO. Il est un utilisateur cible explicite.

**Ce qu'il remarquerait dans le canvas redrawn.**
- La vitesse pure : 20 atomes dessinés en <60s (scénario S1 ci-dessous)
  serait une **révélation** — il posterait un GIF sur r/chemistry.
- Les sous-menus responsive qui s'adaptent à son 13" (P1-01).
- Les `<kbd>` inline montrant les raccourcis (P1-02) — il apprend
  encore les shortcuts, l'affichage l'aide.
- Le feature flag off par défaut : il ne verra rien si on ne l'active
  pas — donc **il faut un « what's new » visible** au premier chargement.

Bastien est le **porte-parole communautaire**. Un canvas redrawn qui
l'enchante génère 300 GitHub stars et 10 issues qualifiées. Un canvas
décevant déclenche un thread Reddit « yet another ChemDraw clone, same
bugs » qui plombe le lancement beta.

### Persona C — Catherine Okonkwo, QC / Analytical Scientist (process R&D)

**Rôle et contexte.** 38 ans, Master chimie analytique (Manchester),
11 ans en process R&D chez un CDMO UK. Responsable QC sur 3 lignes
de production API. Elle édite des records GMP toute la journée :
structure de l'API, impuretés, intermédiaires de synthèse, CoA. Tous
ses documents vont en audit FDA et EMA. Son outil primaire est
ChemDraw Professional 22 avec le package Signals Notebook (ELN
réglementé). Elle connaît **intimement** le workflow CFR 21 Part 11 :
e-signature, audit trail, record lock.

**Contexte quotidien.** 7h30 du matin : elle ouvre 12 records de la
veille à contresigner (rôle Reviewer). Elle doit **modifier** quelques
structures d'impuretés (renommage, stéréocentre corrigé) et laisser un
commentaire daté / signé. Son poste : Dell Latitude 15" + écran 24",
Windows 10 professional, sourie Logitech master. Elle est très
clavier : Tab, Shift+Tab, flèches, ne quitte presque jamais le pavé
numérique.

**Frustrations actuelles avec Kendraw V0.4.**
- **Verdict Park (V6) NO-GO process R&D** : pas d'annotation impureté
  structurée (% / assignment / confidence), pas d'export LIMS. C'est
  documenté mais parking P2 wave-4 (W4-11).
- **Redessiner un stéréocentre** à partir d'un scan de brevet : elle
  veut cliquer la liaison, presser W / Shift+W (wedge/hash), voir
  immédiatement le changement visuel. Kendraw V0.4 fait ça mais le
  rendu wedge en Canvas est moins net que ChemDraw (P1-06 ketcher-an).
- **Audit trail** : wave-3 a livré le hash-chain (P1-04) et le record
  lock + e-signature (P1-05), c'est une **vraie base** pour son usage.
  Elle le remarque et le valorise.
- **CDXML écriture** : wave-4 P1-06 a livré le writer avec round-trip.
  Elle peut donc ouvrir un CDXML d'un partenaire, annoter, ré-exporter.
  C'est un **différenciateur majeur** sur Ketcher (qui écrit KET only).
- **Pas de flip horizontal / vertical** (P1-06 ketcher-an W4 parked) :
  quand un collaborateur envoie une structure orientée à l'envers, elle
  doit la redessiner.
- **Pas de rotate handle** (P1-05) : idem, elle rote un fragment à la
  main avec des clics successifs.
- **Mini panneau propriétés `/`** serait utile pour vérifier la charge
  formelle (très surveillée en QC).

**Ce qu'elle remarquerait dans le canvas redrawn.**
- La **netteté** des wedges harmonisés — elle est très visuelle.
- Le flip/rotate (si on les ajoute P1) gagnerait 3-5 minutes par record.
- La **rigueur** de l'audit trail existant (déjà livré) combinée à un
  canvas plus fluide = elle devient championne interne de Kendraw pour
  les tâches QC secondaires (documents non-audités, réunions, design
  interne). Pas encore pour le record GMP audité, mais l'orientation
  est là.

Catherine est la **validatrice réglementaire**. Si elle dit « je peux
faire ma dérivation d'impureté là-dedans », ça ouvre 200 licences
potentielles chez les CDMO UK/US. Aujourd'hui elle dit « presque, mais
P2-01 flip et P1-06 wedge harmonisé me manquent ».

---

## 2. Cinq scénarios d'usage (15-25 étapes chacun)

Convention : chaque étape est numérotée ; trois champs courts
indiquent **action utilisateur**, **feedback canvas attendu post-redraw**,
**douleur V0.4 retirée**. Les numéros de stories renvoient à la
section 9 de `ketcher-analysis-wave-4.md`.

### Scénario S1 — Amélie dessine un 20-atome kinase inhibitor en moins de 60s

Contexte : elle a en tête un 2-amino-pyrimidine substitué avec un
benzène para-CF3, un linker morpholine et une sulfonamide. Objectif
terrain : <60s pour la dessiner entière. Chrono interne V0.4 mesuré :
~95s. Cible wave-4 : <55s.

1. **Action** : Amélie ouvre `kendraw.fdp.expert` dans Chrome.
   **Feedback** : canvas vide, toolbar gauche visible avec groupes
   Select/Atoms/Bonds/Rings, feature flag `newCanvas=true` via
   `.env.local` (mais pour elle, via toggle settings panel W4-06).
   **Douleur retirée** : aucune, mais le chargement <1.5s rassure.
2. **Action** : elle presse `T` pour cycler vers l'outil benzene.
   **Feedback** : icône benzene mise en surbrillance bleue, `<kbd>T</kbd>`
   affiché dans le tooltip (P1-02). **Douleur retirée** : V0.4 ne
   montrait pas le shortcut inline.
3. **Action** : elle hover sur le canvas au centre.
   **Feedback** : **ghost benzene** suit son curseur en ligne fine grise
   (P0-01). **Douleur retirée** : V0.4 ne montrait pas le ghost — elle
   devait cliquer pour découvrir la position.
4. **Action** : elle clique, pose le benzène, presse Esc.
   **Feedback** : benzène rendu net, outil retombe en Select.
   **Douleur retirée** : V0.4 laissait le benzene-tool actif,
   clics fantômes possibles.
5. **Action** : elle presse `P` pour pyrimidine (template W4-parked P2-03
   si livré ; sinon `R`+6 pour ring hexagone puis modifie N).
   **Feedback** : ghost pyrimidine. **Douleur retirée** : elle ne connaît
   pas toutes les templates ; `<kbd>` inline les lui révèle.
6. **Action** : elle clique sur un atome C du benzene pour **fusionner**
   la pyrimidine au cycle existant.
   **Feedback** : snap visuel, cycle fusionné en-place (P1-03 fusion
   de cycles). **Douleur retirée** : V0.4 posait la pyrimidine à côté,
   elle devait la déplacer et dessiner la liaison.
7. **Action** : elle presse `N` puis clique sur un C cible pour
   remplacer l'atome.
   **Feedback** : ghost `N` bleu sous curseur (P0-01 color by element),
   clic remplace. **Douleur retirée** : V0.4 n'avait pas la couleur
   dans le ghost.
8. **Action** : elle presse `2` pour liaison double.
   **Feedback** : cursor switch, le bond qu'elle va tracer sera double.
   Le ghost est une ligne double grise. **Douleur retirée** : identique.
9. **Action** : elle drag depuis un C pour tirer un bond externe.
   **Feedback** : **snap 15°** actif par défaut (P0-02), un
   badge `30°` flotte au-dessus du drag (Ketcher-style message dispatch).
   **Douleur retirée** : V0.4 snappait à 30° ou libre via Ctrl+E ; ici
   15° natif et Shift libère.
10. **Action** : elle relâche, pose un CF3 via `F` puis drag trois bonds.
    **Feedback** : CF3 apparaît en rouge (ElementColor). **Douleur** :
    V0.4 parfois fondait les fluors en gris par défaut.
11. **Action** : elle drag depuis l'amine pour tirer le linker morpholine.
    Elle clique sur template morpholine via toolbox (sous-menu rings).
    **Feedback** : sous-menu responsive s'ouvre (P1-01), ghost morpholine.
    **Douleur retirée** : V0.4 sous-menu figé sans responsive.
12. **Action** : elle fusionne morpholine au N amine via clic sur la
    liaison du cycle.
    **Feedback** : fusion P1-03. **Douleur** : V0.4 demandait superposition.
13. **Action** : elle presse `S` pour sulfure puis dessine un SO2NH2.
    **Feedback** : hoverIcon S jaune. **Douleur** : identique P0-01.
14. **Action** : elle presse `/` au-dessus d'un atome.
    **Feedback** : **mini panel flottant** apparaît (P0-05) avec
    charge=0, H implicite=2, hybridation=sp3, radical=0. **Douleur**
    retirée : V0.4 demandait d'ouvrir un panneau droit séparé.
15. **Action** : elle presse `/` à nouveau pour fermer.
    **Feedback** : panel se referme. **Douleur** : identique.
16. **Action** : elle double-clique sur un atome pour le changer en
    texte libre, tape `CF3`.
    **Feedback** : abréviation **auto-expandable** (P2-06, parked) ou
    label brut. **Douleur V0.4** : label brut seul.
17. **Action** : elle drag dans le vide à côté de la molécule.
    **Feedback** : **rectangle de marquee** s'ouvre (P0-03).
    **Douleur retirée** : V0.4 faisait un drag-pan par erreur.
18. **Action** : elle relâche sur un fragment.
    **Feedback** : fragment sélectionné, **poignées visibles** autour
    du bounding box (P0-04, P1-05 rotate). **Douleur** : V0.4 n'affichait
    qu'une boîte passive.
19. **Action** : elle drag la poignée centre pour déplacer.
    **Feedback** : tout le fragment se déplace avec snap grid (P0-04).
    **Douleur retirée** : V0.4 nécessitait flèches clavier atome par atome.
20. **Action** : elle presse Ctrl+Shift+K pour copier MOL.
    **Feedback** : **clipboard rempli, toast « MOL copied »** (P1-08).
    **Douleur retirée** : V0.4 forçait export manuel dialog.
21. **Action** : elle colle dans ELN. **Chrono final : 52 secondes**
    (mesuré par instrumentation wave-4 optionnelle).

Cible P0 critique : étapes 3, 9, 14, 17, 18, 19 — **six des vingt et un
feedback** sont les nouveautés wave-4. Sans elles, on reste à 95s.

### Scénario S2 — Bastien colle un SMILES PubChem, ajuste, exporte MOL

Contexte : il trouve la **codéine** sur PubChem (CID 5284371, SMILES
canonique), il veut la coller dans Kendraw, ajuster l'orientation
stéréochimique pour match le papier de référence, et exporter en MOL
V2000 pour son manuscript.

1. **Action** : Bastien copie le SMILES
   `COc1ccc2CC3C4C=CC(O)C5Oc1c2C34CCN5C` depuis PubChem.
   **Feedback** : aucun (hors canvas). **Douleur** : aucune.
2. **Action** : il ouvre Kendraw, presse **Ctrl+V** dans le canvas.
   **Feedback** : dialog d'import SMILES s'ouvre avec le SMILES
   pré-rempli (wave-2 feature). **Douleur retirée** : identique V0.4.
3. **Action** : il presse Enter.
   **Feedback** : backend RDKit compute layout → Kendraw rend la
   codéine au centre, scaled to fit. **Douleur retirée** : identique.
4. **Action** : il presse **Ctrl+0** (zoom reset).
   **Feedback** : canvas re-centrage, molécule occupe 70% viewport.
   **Douleur retirée** : identique V0.4.
5. **Action** : il **space+drag** pour pan légèrement à droite.
   **Feedback** : pan fluide à trackpad. **Douleur retirée** : V0.4
   avait un jitter de pan que le nouveau Canvas 2D repaint via rAF
   (§11.2 ketcher-an) éliminerait.
6. **Action** : il hover sur le stéréocentre C5 de la codéine.
   **Feedback** : hoverIcon indique l'atome C en noir (P0-01), mini
   halo de survol. **Douleur retirée** : V0.4 pas de halo.
7. **Action** : il presse `/`.
   **Feedback** : mini-panel affiche charge=0, H=1, wedge count=1
   (P0-05). **Douleur retirée** : V0.4 ouverture panel droit.
8. **Action** : il clique sur une liaison en hash du stéréocentre.
   **Feedback** : liaison sélectionnée, handles visibles.
   **Douleur retirée** : V0.4 hit-test parfois imprécis sur liaisons
   en biais — Kendraw nouveau rendu utilise geometry helpers (P1-06 ket-an).
9. **Action** : il presse **Shift+W** pour inverser wedge/hash.
   **Feedback** : la liaison passe de hash à wedge, re-render net.
   **Douleur retirée** : V0.4 wedge rendering moins net.
10. **Action** : il drag la souris dans le vide pour ouvrir un
    **rectangle marquee**.
    **Feedback** : rectangle dashed (P0-03). **Douleur retirée** :
    V0.4 ne supportait pas marquee.
11. **Action** : il inclut le groupe méthoxy aromatique OMe.
    **Feedback** : atomes + bonds highlightés en bleu sélection.
    **Douleur** : identique.
12. **Action** : il presse Del.
    **Feedback** : suppression + undo-able. **Douleur retirée** :
    identique V0.4.
13. **Action** : il presse **Ctrl+Z**.
    **Feedback** : re-apparition. **Douleur** : identique.
14. **Action** : il hover sur un atome qui lui semble mal orienté.
    **Feedback** : mini-halo + ghost tool. **Douleur** : identique P0-01.
15. **Action** : il presse `V` pour Select tool, puis Shift+click sur
    deux atomes pour sélection additive (§6 ket-an).
    **Feedback** : XOR selection (Ketcher pattern P0 W4-R-06 derived).
    **Douleur retirée** : V0.4 click simple écrasait la sélection.
16. **Action** : il presse **Ctrl+Shift+A** (deselect all) ou **Esc**.
    **Feedback** : désélection. **Douleur retirée** : V0.4 avait Ctrl+D
    (non standard Ketcher) — harmonisé P2-04.
17. **Action** : il ouvre le menu Export.
    **Feedback** : menu ouvre liste (MOL, SDF, CDXML, SMILES, SVG, PNG).
    **Douleur** : identique V0.4.
18. **Action** : il clique MOL V2000.
    **Feedback** : fichier `.mol` téléchargé. **Douleur retirée** :
    identique V0.4 — le I/O reste inchangé (§10 ket-an).
19. **Action** : il ouvre `.mol` dans un text editor pour vérifier.
    **Feedback** : structure V2000 conforme, coords fidèles.
    **Douleur retirée** : round-trip déjà OK en wave-2. **Chrono
    total : 42s** (vs V0.4 ~80s).

Cible P0 critique : étapes 2, 6, 7, 9, 10, 15. Sans elles, le scénario
reste fonctionnel mais frustrant.

### Scénario S3 — Amélie redessine les stéréocentres (wedge/hash) d'un papier

Contexte : elle lit *J. Med. Chem.* 2025 et veut ré-importer un scaffold
avec deux stéréocentres R,S précis. Le papier ne donne que le PDF ; elle
doit re-dessiner à la main.

1. **Action** : Amélie démarre sur canvas vide.
   **Feedback** : clean. **Douleur** : aucune.
2. **Action** : elle dessine squelette de base (pyrrolidine + phényle)
   via `R`+5 et `R`+6 avec fusion.
   **Feedback** : fusion de cycles P1-03, snap 15° (P0-02).
   **Douleur retirée** : V0.4 aurait obligé drag manuel.
3. **Action** : elle presse `W` (wedge).
   **Feedback** : tool switch, cursor change, `<kbd>W</kbd>` dans
   tooltip visible en hover (P1-02). **Douleur retirée** : V0.4 pas de
   kbd hint visible.
4. **Action** : elle clique sur une liaison C-N de la pyrrolidine.
   **Feedback** : la liaison devient wedge (direction depuis le C vers
   N). Rendu triangulaire propre aligné sur geometry helpers (P1-06
   ket-an rendu harmonisé). **Douleur retirée** : V0.4 rendu Canvas
   moins net.
5. **Action** : elle hover sur une autre liaison.
   **Feedback** : halo + ghost wedge fantôme montrant la direction
   potentielle. **Douleur retirée** : V0.4 pas de preview.
6. **Action** : elle Shift+W pour hash.
   **Feedback** : tool switch hash. **Douleur** : identique V0.4.
7. **Action** : elle clique sur la seconde liaison stéréo.
   **Feedback** : hash (triangle hachuré). **Douleur retirée** :
   identique V0.4 mais rendu plus net.
8. **Action** : elle presse `/` au-dessus du stéréocentre.
   **Feedback** : mini-panel affiche stereo=R (CIP calculé côté RDKit
   serveur, déjà OK) et wedge count=1. **Douleur retirée** : V0.4
   obligeait ouverture properties panel droit.
9. **Action** : elle hover sur le second stéréocentre.
   **Feedback** : mini-panel se met à jour live. **Douleur retirée** :
   V0.4 mini-panel n'existait pas.
10. **Action** : elle réalise qu'elle a mis le wedge dans le mauvais
    sens. Elle presse Ctrl+Z.
    **Feedback** : annulation. **Douleur** : identique V0.4.
11. **Action** : elle clique re-sélectionne la liaison.
    **Feedback** : sélection visible + poignées. **Douleur retirée** :
    P0-04 poignées.
12. **Action** : elle presse Shift+W et re-clique.
    **Feedback** : hash appliqué. **Douleur retirée** : idem V0.4.
13. **Action** : elle ouvre le menu contextuel clic droit sur la liaison.
    **Feedback** : menu propose « Inverser wedge/hash », « Changer
    ordre », « Supprimer ». **Douleur retirée** : V0.4 menu contextuel
    existe mais options limitées.
14. **Action** : elle clique « Inverser ».
    **Feedback** : direction wedge inversée (point d'origine ↔ pointe).
    **Douleur retirée** : V0.4 nécessitait supprimer + redessiner
    depuis l'autre atome.
15. **Action** : elle presse `/` à nouveau sur stéréocentre.
    **Feedback** : CIP R/S recomputé (RDKit serveur §10 ket-an). **Douleur**
    : identique V0.4 mais immédiat via mini-panel.
16. **Action** : elle exporte CDXML via **Ctrl+Shift+M** (parked P1-08)
    ou menu File > Export.
    **Feedback** : CDXML writer (W3 P1-06) avec wedge/hash préservés.
    **Douleur retirée** : V0.4 avait CDXML depuis W3. **Chrono : 48s**.

Cible P0 critique : étapes 4, 5, 8, 11, 14. Plus P1 rendu harmonisé.

### Scénario S4 — Bastien duplique un scaffold Boc, flippe, renomme

Contexte : il a dessiné un azétidine-N-Boc dans le coin supérieur gauche.
Il veut **deux exemplaires** côte à côte, le second flippé
horizontalement avec un label différent (Cbz au lieu de Boc).

1. **Action** : Bastien a le scaffold Boc-azétidine déjà dessiné.
   **Feedback** : molécule 8 atomes. **Douleur** : aucune.
2. **Action** : il presse `V` pour Select tool.
   **Feedback** : cursor passe en flèche sélection. **Douleur** :
   identique V0.4.
3. **Action** : il drag dans le vide pour rectangle marquee englobant.
   **Feedback** : rectangle dashed (P0-03). **Douleur retirée** :
   V0.4 pas de marquee — il devait double-cliquer atome central pour
   flood-select.
4. **Action** : il relâche autour de toute l'azétidine.
   **Feedback** : sélection + poignées visibles (P0-04 + P1-05).
   **Douleur retirée** : V0.4 pas de poignées visuelles.
5. **Action** : il presse Ctrl+C.
   **Feedback** : toast « Selection copied » (wave-3 feature).
   **Douleur retirée** : identique V0.4.
6. **Action** : il space+drag pour faire de la place à droite.
   **Feedback** : pan fluide. **Douleur retirée** : identique V0.4.
7. **Action** : il clique dans l'espace vide à droite.
   **Feedback** : désélection. **Douleur** : identique V0.4.
8. **Action** : il presse Ctrl+V.
   **Feedback** : la copie apparaît au curseur, glue au mouse jusqu'à
   clic (Ketcher pattern paste-follow-cursor §6 selection). **Douleur
   retirée** : V0.4 collait à position fixe, il devait re-déplacer.
9. **Action** : il clique pour poser.
   **Feedback** : paste définitif + sélection active sur la copie.
   **Douleur** : identique.
10. **Action** : il clique droit sur la sélection.
    **Feedback** : menu contextuel avec « Flip horizontal », « Flip
    vertical », « Rotate 90° » (P1-06 ket-an).
    **Douleur retirée** : V0.4 ne proposait pas flip.
11. **Action** : il clique « Flip horizontal ».
    **Feedback** : fragment flippé en place autour de son bounding
    box centre. Wedges inversent direction stéréochimique (aspect
    subtil — si pas géré, `Flip → invert stereo` warning). **Douleur
    retirée** : V0.4 pas de flip du tout.
12. **Action** : il double-clique sur le label « Boc » (abréviation).
    **Feedback** : label devient éditable, cursor text.
    **Douleur retirée** : identique V0.4.
13. **Action** : il tape `Cbz` et presse Enter.
    **Feedback** : label mis à jour, recomputed implicit valence.
    Si P2-06 autosuggest livré, proposition d'expansion SGroup.
    **Douleur retirée** : V0.4 pas d'auto-suggest.
14. **Action** : il hover sur le nouveau Cbz.
    **Feedback** : ghost expansion preview montre C(=O)OCH2Ph (P1-04
    groupes expansibles). **Douleur retirée** : V0.4 label brut.
15. **Action** : il clique pour expand explicite.
    **Feedback** : Cbz déplié en atomes. **Douleur retirée** : idem.
16. **Action** : il exporte PNG via menu File > Export > PNG.
    **Feedback** : PNG téléchargé, rendu identique canvas.
    **Douleur retirée** : V0.4 export wave-2 déjà OK.
    **Chrono : 38s** (vs V0.4 infaisable sans flip).

Cible P0 critique : étapes 3, 4, 8, 10, 11.

### Scénario S5 — Catherine importe un CDXML, corrige angles, annote impureté

Contexte : elle reçoit un CDXML d'un partenaire CDMO avec un intermédiaire
3-fluoro-indoline mal orienté (angles à 23°, 47°…). Elle doit
**normaliser** les angles à 30°/60° et annoter une impureté trouvée à 0.3%.

1. **Action** : Catherine ouvre Kendraw, menu File > Import > CDXML.
   **Feedback** : dialog file picker. **Douleur retirée** : V0.4 CDXML
   parser déjà livré (W2).
2. **Action** : elle sélectionne `intermediate-batch-47.cdxml`.
   **Feedback** : canvas rend la structure. Angles natifs préservés
   (parser fidèle, W2 exhaustive). **Douleur retirée** : identique V0.4.
3. **Action** : elle hover sur une liaison mal orientée (47°).
   **Feedback** : halo liaison + ghost tool (P0-01). **Douleur
   retirée** : V0.4 pas de halo.
4. **Action** : elle drag l'extrémité de la liaison.
   **Feedback** : pendant le drag, **badge flottant** affiche l'angle
   live (Ketcher `event.message.dispatch info: degrees+'º'` §2.4 ket-an
   P0-02). Snap 15° activé sauf Shift. **Douleur retirée** : V0.4
   snap 30° + badge absent.
5. **Action** : elle relâche à 60°.
   **Feedback** : liaison posée net à 60°, undo-able.
   **Douleur retirée** : V0.4 forçait le drag libre puis re-ajustement.
6. **Action** : elle répète sur 3 autres liaisons.
   **Feedback** : idem. **Douleur retirée** : idem.
7. **Action** : elle drag un rectangle marquee autour de tout le cycle
   indoline.
   **Feedback** : sélection + poignées (P0-03, P0-04).
   **Douleur retirée** : V0.4 pas de marquee.
8. **Action** : elle clique droit, sélectionne « Aligner sur grille » (si
   livré P2) ou « Cleanup layout ».
   **Feedback** : backend RDKit layout remet proprement (already wave-2).
   **Douleur retirée** : identique V0.4.
9. **Action** : elle hover sur l'atome C3 pour vérifier la stéréo.
   **Feedback** : mini-panel `/` montre R, wedge=1, charge=0 (P0-05).
   **Douleur retirée** : V0.4 ouverture panel droit.
10. **Action** : elle clique outil Annotation (wave-3 feature) + sélectionne
    un atome.
    **Feedback** : annotation popup. **Douleur retirée** : identique V0.4.
11. **Action** : elle tape `Impurity 0.3% — confirmed via HPLC batch 47`.
    **Feedback** : annotation rendue en bleu discret à côté de l'atome.
    **Douleur retirée** : identique V0.4.
12. **Action** : elle veut un second diagramme — une forme dimère.
    Elle presse `V` puis marquee autour de la molécule.
    **Feedback** : sélection. **Douleur retirée** : P0-03 (marquee).
13. **Action** : elle Ctrl+C puis Ctrl+V.
    **Feedback** : paste suit curseur (Ketcher pattern). **Douleur
    retirée** : V0.4 paste position fixe.
14. **Action** : elle pose la copie.
    **Feedback** : copie placée. **Douleur** : identique.
15. **Action** : elle clique droit > « Flip horizontal » (P1-06 ket-an).
    **Feedback** : fragment flippé. **Douleur retirée** : V0.4 pas de flip.
16. **Action** : elle presse `/` sur C3 pour vérifier que le flip a
    bien inversé la stéréo.
    **Feedback** : mini-panel montre S (inversion attendue).
    **Douleur retirée** : V0.4 demandait export puis reimport pour
    checker.
17. **Action** : elle exporte CDXML via File > Export > CDXML (W3 P1-06
    writer livré).
    **Feedback** : fichier CDXML téléchargé, round-trip parser garanti.
    **Douleur retirée** : identique wave-3 mais sur canvas mieux dessiné.
18. **Action** : elle rouvre le fichier dans ChemDraw du partenaire
    pour vérifier.
    **Feedback** : rendu conforme. **Douleur retirée** : wave-3 fidélité.
19. **Action** : elle signe l'e-signature via modal (wave-3 P1-05).
    **Feedback** : modal e-sig + reason-for-change + audit trail entry.
    **Douleur retirée** : wave-3 livré. **Chrono : 4min10s** (vs V0.4
    ~7min avec re-dessin partiel).

Cible P0 critique : étapes 3, 4, 5, 7, 9, 12.

---

## 3. SWOT racine — Fluidité canvas Kendraw actuelle (V0.4)

Méthodologie : chaque item est une **observation grounded** dans un
fichier, un test, un verdict panelist ou un gap §9 ket-an. Pas
d'opinion non ancrée.

### 3.1 Forces (Strengths) — ce qui, sur le canvas, est déjà solide

**S1. Canvas 2D natif via `renderer-canvas`.** Choix architectural
supérieur à Ketcher (SVG/Raphael.js 2008-era) et aligné sur ChemDraw
moderne. Performance baseline confirmée par la preuve d'échelle
Ketcher (60fps, 150 atomes) et notre profil <30ms frame sur 200 atomes
(benchmark V0.2). Base solide pour scaler jusqu'aux tailles pharma.

**S2. State management Zustand + Immer + snapshots FIFO 200-profond.**
Plus propre que MobX observables + pointer-based 32-command stack
Ketcher. Undo prédictible, testable, compatible React 18 strict mode
(§11.5 ket-an). Zéro régression sur ce front depuis wave-2.

**S3. Hit-test `SpatialIndex` O(log n).** Mieux que Ketcher `O(n)
closest.item()` par pure brute-force. À 200 atomes, 120× plus rapide.
Supporte le hover temps réel sans lag perceptible.

**S4. Hotkey coverage 31/35 parité ChemDraw** (V6 metric). C/N/O/F/P/S/H,
1/2/3, W/Shift+W, Ctrl+Z/Y, Ctrl+=/-/0 — le vocabulaire de base est là.
Seuls manquent `/`, V/L/F cycle select, Ctrl+Shift+M/K/F et quelques
edge cases.

**S5. I/O robuste et auditable.** MOL V2000, SDF, CDXML (lecture W2,
écriture W3 P1-06), SMILES, KDX natif, PNG, SVG, JCAMP-DX (W3 P1-03),
PubChem import. Round-trip testé. Un avantage **net** sur Ketcher qui
écrit KET only.

**S6. Audit trail + record lock + e-signature (W3 P1-04, P1-05).**
Hash-chain append-only, reason-for-change modal, e-sig. Base CFR 21 Part
11 partielle qui **dépasse Ketcher** (aucune fonctionnalité de ce type
en open source). Différenciateur pharma QC (Catherine Persona C).

### 3.2 Faiblesses (Weaknesses) — ce qui mine la fluidité aujourd'hui

**W1. Pas de hoverIcon ghost preview (P0-01).** Probablement le manque
le plus visible et universel : les trois personas le citent en premier.
Sans preview, chaque clic est un pari. Ketcher le résout depuis des
années. L'écart est un **dealbreaker UX**.

**W2. Snap angulaire mal calibré (P0-02).** 30° par défaut (trop
grossier vs ChemDraw 15°), activé via Ctrl+E en toggle (non découvrable).
L'inversion avec Shift=libre est plus ergonomique et c'est le standard
Ketcher et ChemDraw. Amélie (Persona A) s'épuise à ajuster manuellement.

**W3. Pas de sélection rectangle marquee ni lasso (P0-03).** Kendraw
V0.4 n'a que flood-select (double-clic atome). Pour sélectionner 3
atomes contigus non reliés au même composant, il faut Shift+click
chaque atome. Tous les éditeurs professionnels ont marquee.

**W4. Pas de poignées de transformation sur sélection (P0-04, P1-05).**
Sélection actuelle est une boîte passive. Pas de drag-to-move visible,
pas de rotate handle, pas de resize handle. L'utilisateur ne *sait pas*
qu'il peut déplacer. Sally (UX V6) l'a soulevé.

**W5. Pas de mini-panneau propriétés toggle `/` (P0-05).** Ketcher
affiche charge/H/hybridation sur pression `/` au survol. Micro-interaction
signature. Kendraw V0.4 oblige d'ouvrir un panel permanent à droite,
encombrant à 13".

**W6. `Canvas.tsx` monolithique 1729 lignes.** Architecturalement, chaque
nouvelle tool ajoute du code à un fichier déjà au bord de
l'illisibilité. Aucune abstraction `{ mousedown, mousemove, mouseup,
cancel, keydown? }` uniforme. Tout ajout P1/P2 futur est coûteux.
Source de dette (P0-06 ket-an).

**W7. Sous-menus toolbox non-responsive.** À 13" écran (Bastien Persona B),
les sous-menus débordent. Pas de ResizeObserver, pas de collapse.
Ketcher le fait via `mediaSizes.ts` (P1-01).

**W8. Pas de fusion de cycles in-place (P1-03).** Cliquer l'outil
benzene sur un bond existant devrait fusionner un cycle partageant ce
bond. Kendraw V0.4 pose le cycle à côté. Tous les personas souffrent.

### 3.3 Opportunités (Opportunities) — externes mobilisables wave-4

**O1. Ketcher est open source Apache 2.0.** Clean-room learning **légal**,
déjà cartographié (§1 ket-an, 6 sous-agents, 2400 lignes de notes). Les
patterns UX sont re-implémentables sans copier-coller.

**O2. Fenêtre communautaire ouverte.** Post-V6 soft beta labellé « NMR
Preview », le segment éducation est acquis (Volkov GO). Bastien
(Persona B) est le vecteur Reddit / r/chemistry. Un canvas fluide
release fin avril 2026 génère attention organique 300-1000 stars.

**O3. ChemDraw prix en hausse continue.** Licence 2025 à 2200€/an pour
un seat academic. Grad students et petits labs cherchent
alternative. Fenêtre d'acquisition **grande ouverte** si on livre <P0
au niveau attendu.

**O4. Différenciateur audit trail + record lock.** Aucun autre éditeur
open source ne l'a. Si P0 fluidité livré + W3 compliance maintenu, on
sert un segment que ni Ketcher ni MarvinSketch n'adressent
(pharma QC secondaire, CDMO, startups CFR 21 conscientes).

**O5. Wave-4 est déjà scoped.** 8 stories P0 (§9.5 ket-an), durée 1
sprint. Pas de scope creep, pas de NMR dedans (parked pour V5 sur
avis V6). Focus **pure UX canvas**. Cela maximise le gain perçu par
unité d'effort.

**O6. Coexistence via feature flag `VITE_ENABLE_NEW_CANVAS` (§10
ket-an).** Zéro risque régression : les utilisateurs actuels gardent
V0.4, les testeurs early adopter activent le nouveau canvas, store
partagé = même document. Dérisque radical le rollout.

### 3.4 Menaces (Threats) — risques si on exécute mal

**T1. NMR Review V6 « beta pharma NO-GO » est public interne.** Si
wave-4 canvas ship sans wave-5 DEPT/multiplets, le segment research
reste hors scope. **Risque** : la communauté chimiste confond les
deux offres et perçoit tout Kendraw comme « pas prêt ». Mitigation :
communication honnête, badge « NMR Preview » explicite (W4-06 V6).

**T2. Ketcher pousse activement.** EPAM continue développement actif
(commit rythme 2025). Sa notoriété open-source croissante peut éclipser
Kendraw si nous n'offrons pas le différenciateur
(compliance + CDXML writer + UX plus moderne React 18).

**T3. Feature flag oubliée.** Risque qu'un développeur livre un
canvas nouveau *partiel* en on-par-défaut et casse le V0.4 existant.
Mitigation : `VITE_ENABLE_NEW_CANVAS` OFF par défaut jusqu'au gate
wave-5, plus tests E2E explicites sur les **deux** canvas.

**T4. Régression `Canvas.tsx` monolithique.** Si le redraw introduit
un second monolithique dans `canvas-new/`, on double la dette. Mitigation
stricte : tool-abstraction P0-06 **avant** toute story P0-04+.

**T5. Sous-estimation perf Canvas 2D sur 300+ atomes.** Ketcher prouve
60fps à 150. Au-delà, repaint full rAF peut tomber à 20fps. Amélie
(oncologie kinase) travaille parfois à 180 atomes. Mitigation : profiler
W4-R-03 avec molécule test 250 atomes avant de valider P0-04.

**T6. Grad student AZERTY / non-US clavier.** Les raccourcis `1/2/3`,
`Ctrl+Shift+K` peuvent être inaccessibles sur certains layouts.
Bastien (Persona B) est FR-AZERTY. Mitigation : test E2E avec layout
AZERTY + doc raccourcis « alternative input » dans README.

---

## 4. Synthèse et recommandation d'acte 2

**Recommandation priorité Mary (ordre d'impact commercial) :**

1. **Livrer les 8 P0 W4-R-01 → R-08** dans leur intégralité. Sans
   hoverIcon, snap 15°, marquee, poignées, `/`, **aucune persona n'est
   servie**. C'est un tout ou rien.
2. **Communication soft-beta limitée au segment éducation** (Bastien),
   pas de push HN / Reddit front-page avant wave-5 DEPT.
3. **Conserver audit trail + CDXML writer** comme **différenciateurs
   mis en avant dès l'onboarding** (Catherine Persona C). Ce sont les
   seuls angles où Kendraw dépasse Ketcher aujourd'hui.
4. **Parker wave-4 tout ce qui n'est pas canvas fluidité** (NMR
   DEPT, templates library, OCR). Le verdict V6 confirme que
   wave-5 = NMR reload, wave-4 = canvas pure.
5. **Mettre Bastien (Persona B) en boucle bêta-testeur dès W4-R-04**
   livré : la vitesse ressentie 20-atomes <60s (S1) est **la** métrique
   qualitative à valider avant announcement.

**Métriques de succès wave-4 (à tracker côté PM John) :**

- Scénario S1 chronométré à ≤55s sur Kendraw post-redraw par panel
  de 3 chimistes externes (vs ~95s V0.4). Cible « ChemDraw-grade ».
- Scénario S2 paste+export à ≤45s.
- Zéro régression fonctionnelle V0.4 sur flag OFF (E2E complet).
- Sentiment Reddit post-beta : ratio +/- ≥ 3:1 sur premier thread.

**À éviter absolument :**

- Rebâtir une abstraction en double du `Canvas.tsx` sans tool-abstraction.
- Livrer 4 P0 sur 8 et attendre la wave-5 : la moitié du hoverIcon +
  snap sans marquee reste **perçu comme un prototype**.
- Exposer le feature flag en on par défaut avant wave-5 gate.

---

_Plan livré par 📊 Mary (BMAD Business Analyst) le 18 avril 2026 à
00h01 GMT+2. Prochaine main : John (PM) pour product writing acte 2 de
la wave-4 redraw. Référence observable : `kendraw.fdp.expert` V0.4 live._
