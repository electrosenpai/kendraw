# Plan UX Wave-4 Redraw — Sally, UX Designer

> « Chaque pixel raconte l'intention du chimiste. Un éditeur moléculaire est un
> dialogue silencieux entre la main, l'œil et la molécule. Notre rôle : rendre
> ce dialogue évident, prévisible, et beau. »
>
> — Sally, UX Designer

## Philosophie générale

L'utilisateur cible est un chimiste de paillasse qui a passé quinze ans sur
ChemDraw. Il n'ouvre pas Kendraw pour apprendre un nouvel outil : il l'ouvre
pour dessiner vite, sans penser. Chaque décision UX de cette wave-4 suit une
règle simple : **si le chimiste doit réfléchir plus d'une demi-seconde à où
cliquer, l'interface a échoué**.

Trois principes directeurs :

1. **La molécule d'abord.** Le canvas occupe la surface maximale. Les
   chromes (toolbox, panneaux) sont fins, sombres, discrets. Aucun ornement
   inutile ne vient concurrencer le dessin.
2. **Prévisualiser, ne pas valider.** Toute intention (survol d'un atome,
   drag d'un bond, déplacement d'une sélection) doit produire une
   prévisualisation visuelle immédiate avant commit. L'utilisateur voit ce
   qu'il va obtenir avant de relâcher le bouton.
3. **Invariance clavier.** Tout ce qui se fait à la souris doit aussi se
   faire au clavier (raccourcis, nudge par flèches, Escape pour annuler,
   Tab pour cycler les sélections). Un chimiste expérimenté ne lâche pas
   sa main du clavier.

---

## Contexte des 8 stories

Les 8 stories W4-R-01 à W4-R-08 construisent incrémentalement le nouveau
canvas. Les trois premières (feature flag, tool abstraction, rendu partagé)
sont structurelles et n'ont pas d'UX visible côté utilisateur final — mais
elles conditionnent la qualité des cinq suivantes. Les cinq suivantes (hover
icon, angle snap, sélection rectangle, drag de sélection, mini-panneau
slash) sont les stories « visibles », celles qui feront dire au chimiste
« tiens, ça marche comme je pensais ». C'est sur ces cinq-là que
l'exigence UX est maximale.

---

### W4-R-01 UX — Feature flag et bascule canvas

**Position** : Paramètre invisible en production (activé via
`VITE_ENABLE_NEW_CANVAS=true` dans `.env.local`). En développement, un
toggle minuscule discret apparaît en bas à droite du canvas, à côté de
l'indicateur de coordonnées.

**Visual state** :
- `idle` : petit chip gris foncé 24×14 px avec texte « v1 » ou « v2 » selon
  flag actif. Opacité 0.4.
- `hover` : opacité 1.0, curseur pointer, bordure 1 px accent.
- `active` : coche discrète à gauche du label.
- `disabled` : n/a (le toggle est dev-only).
- `during action` : pendant switch, fade-out 150 ms du canvas actuel, puis
  fade-in 200 ms du nouveau canvas. L'utilisateur voit clairement que
  quelque chose a changé, mais sans flash violent.

**Interactions** :
- primary : click → toggle le flag, recharge la page.
- secondary (Shift+click) : toggle sans recharger (pour test à chaud, seul
  en dev).
- cancel (Esc) : n/a, c'est un toggle instantané.

**Keyboard shortcuts** : `Ctrl+Shift+Alt+N` en dev uniquement, rappel dans
tooltip. Non listé dans la palette de raccourcis utilisateur.

**Cursor** : `pointer` au survol.

**Tooltip / helper text** (French copy) : « Canvas expérimental (v2) —
dev-only. Le document sera rechargé. »

**Micro-animations** : fade-out 150 ms, fade-in 200 ms pour la bascule.
Chip elle-même : transition opacité 120 ms à l'entrée souris.

**Accessibility** :
- `role="switch"`, `aria-checked` reflète l'état.
- `aria-label="Basculer vers le canvas expérimental"`.
- Focus ring 2 px accent, décalé de 2 px (offset).
- Le chip est accessible via Tab (ordre dernier dans la zone canvas).

**Edge cases** :
- outside canvas : le chip vit dans le footer, il n'est jamais hors-canvas.
- keyboard-only : Tab jusqu'au chip, Espace ou Entrée active.
- small screen : < 480 px de large, le chip est masqué (inutilisable).
- screen reader : annonce « canvas expérimental, inactif » ou « actif ».

**Bénéfice utilisateur** : le chimiste n'est jamais exposé au flag en
production. Les power-users qui veulent tester le nouveau canvas ont un
point d'entrée clair sans éditer de fichier `.env`. Zéro régression sur
l'expérience par défaut.

---

### W4-R-02 UX — Tool abstraction uniformisée

**Position** : Invisible pour l'utilisateur. Structurelle côté code. L'UX
se manifeste par **la régularité du comportement de tous les outils** : un
chimiste qui apprend un outil apprend tous les autres.

**Visual state** : chaque outil dans la toolbox présente les 5 états
canoniques : `idle`, `hover`, `active`, `disabled`, `during action`.
L'abstraction garantit que le cycle est le même partout.

**Interactions** :
- primary : click active l'outil dans la palette, pointeur change, curseur
  adapté.
- secondary (Shift) : Shift-click active l'outil **et** laisse le focus sur
  l'outil précédent pour retour rapide (pattern ChemDraw).
- cancel (Esc) : pendant toute action en cours (drag, création bond), Esc
  annule et revient à l'état idle de l'outil. Aucune exception.

**Keyboard shortcuts** : chaque outil a une lettre unique (V, L, H, 1, X,
A, R, T, W, U, G, E). Voir tableau des raccourcis global.

**Cursor** : défini par outil, invariant pendant toute la session — jamais
de curseur qui change de manière imprévisible.
- select : `default`
- lasso : crosshair personnalisé (croix fine 16 px)
- pan : `grab` au repos, `grabbing` en drag
- bond, atom, ring, chain : crosshair personnalisé
- text : `text` (I-beam)
- eraser : curseur custom (gomme 20 px, pointe en coin bas-gauche)

**Tooltip / helper text** (French copy) : chaque outil a un tooltip court
(2-4 mots) + raccourci en `<kbd>` + description longue (1 phrase).
- Select : « Sélectionner (V) — Glisser pour marquer, Shift pour ajouter. »

**Micro-animations** : 120 ms cross-fade entre curseurs lors du changement
d'outil. Bouton palette : 120 ms ease-out sur `background` et
`border-left`.

**Accessibility** :
- `role="toolbar"` sur la palette.
- Chaque bouton : `role="button"`, `aria-pressed` si actif, `aria-keyshortcuts`.
- Navigation clavier : flèches haut/bas cyclent les outils dans la palette.
- Focus ring : 2 px accent, offset 1 px, jamais masqué par le hover.

**Edge cases** :
- outside canvas : si la souris quitte le canvas en plein drag, `mouseleave`
  annule proprement via le contrat de Tool.
- keyboard-only : tous les outils activables par raccourci ; la création
  (atome, bond) via clavier est parkée wave-5 mais documentée.
- small screen : la palette conserve les 8 groupes mais devient scroll
  vertical (voir W4-R-01 panels pour responsive).
- screen reader : annonce « Outil Sélection activé », « Outil Bond activé »
  à chaque changement.

**Bénéfice utilisateur** : cohérence. Le chimiste n'a jamais à se demander
« comment j'annule ? » — c'est toujours Escape. « comment je bascule outil
sans perdre ma sélection ? » — c'est toujours Shift-click. Prévisibilité =
vitesse.

---

### W4-R-03 UX — Rendu Canvas 2D partagé

**Position** : Le canvas occupe la zone centrale, grille + molécule. Aucun
élément UI nouveau introduit par cette story, mais elle conditionne les
états visuels de toutes les suivantes.

**Visual state** :
- `idle` : grille de fond très discrète (points gris 10 % opacité,
  espacement 20 px en coordonnées modèle), molécule au premier plan.
- `hover` : quand la souris survole le canvas mais pas un élément, grille
  reste visible. Cadre canvas sans bordure (le canvas s'étend edge-to-edge).
- `active` : pendant un drag de création, la molécule existante + la
  prévisualisation de l'élément en cours de création.
- `disabled` : canvas grisé (overlay 30 % noir) pendant import en cours ou
  loading NMR. Message centré « Import en cours… ».
- `during action` : aperçu temps réel (bond qui se construit, sélection
  rectangle qui se dessine, déplacement d'atomes en cours).

**Interactions** :
- primary : clic gauche dépend de l'outil actif.
- secondary (Shift/Ctrl/Alt) : modifiers passent à l'outil (angle libre
  Ctrl, multi-sélection Shift, dupliquer Alt).
- cancel (Esc) : annule l'action en cours (drag, création), retour état
  idle outil.

**Keyboard shortcuts** : Space+drag pan (ChemDraw-like), Ctrl+wheel zoom,
Ctrl+0 fit, Ctrl+1 zoom 100 %, Ctrl++/Ctrl+- zoom in/out.

**Cursor** : hérité de l'outil actif ; le canvas lui-même ne change pas le
curseur.

**Tooltip / helper text** (French copy) : n/a pour le canvas lui-même. Un
hint statut-bar affiche en bas : « zoom 100 %  ·  curseur (x, y)  ·
sélection : 3 atomes ».

**Micro-animations** :
- Zoom wheel : interpolation 100 ms ease-out vers la cible, évite le saut
  brutal.
- Fit to screen : 250 ms ease-in-out, point focal centré molécule.
- Pan : immédiat, sans interpolation (le drag doit coller à la souris).

**Accessibility** :
- Le canvas est `role="application"` avec `aria-label="Canvas de dessin
  moléculaire"` et `aria-describedby` pointant vers la zone statut.
- Mode « canvas accessible » (wave-5) : un arbre DOM caché décrit la
  molécule pour lecteurs d'écran. Dans cette story, on met juste les hooks.
- Focus visible : un liseré accent 2 px autour du canvas quand on tabule
  dedans.

**Edge cases** :
- outside canvas : la grille s'étend, pas de bordure dure. Pan illimité.
- keyboard-only : navigation entre atomes via Tab (wave-5) ; dans cette
  story, le canvas est focusable et reçoit les raccourcis.
- small screen : canvas reste prioritaire ; toolbox et panels collapsent.
- screen reader : annonce le nombre d'atomes après chaque action
  d'édition.

**Bénéfice utilisateur** : le chimiste a l'impression que le canvas
« respire ». Pas de bordures qui délimitent une zone prison, pas de
chrome qui vole des pixels à la molécule. L'écran entier devient son
cahier de laboratoire.

---

### W4-R-04 UX — HoverIcon atome et bond

C'est LA story emblématique de cette wave. Celle qui transforme la
sensation « prototype » en « produit ». Le hover icon doit être aussi
soigné qu'un curseur de Photoshop.

**Position** : attaché au curseur, décalé de 12 px en diagonale
bas-droite (pour ne pas masquer le point de clic prévu). Suit la souris
en temps réel avec 0 frame de retard perceptible.

**Visual state** :
- `idle` (hors canvas ou outil non concerné) : pas de hoverIcon.
- `hover atome sur canvas vide` : pastille 28×28 px, fond blanc
  translucide 92 %, bordure 1.5 px couleur élément (ex : bleu N, rouge O,
  noir C), label centré, typo Inter Medium 14 px. L'icône indique
  « je vais créer un atome ici ».
- `hover atome sur atome existant` : pastille plus petite (20×20 px),
  halo accent 4 px autour de l'atome existant, label indique la
  mutation possible (ex : survol d'un C avec outil N → la pastille
  montre « N » et l'atome existant se met en surbrillance accent).
- `hover bond sur canvas vide` : segment 32 px de long, épaisseur selon
  ordre (1.5 px simple, 2×1.5 px double, 3×1.5 px triple), incliné 30°
  par défaut (direction zigzag standard).
- `hover bond sur atome existant` : le segment démarre de l'atome, angle
  snappé 30° par défaut, extrémité libre à la position souris.
- `active` (en drag) : le hover icon disparaît, remplacé par la
  prévisualisation de l'élément en construction (voir W4-R-05).
- `disabled` : si la valence serait dépassée (ex : survol d'un C déjà à 4
  liaisons avec outil bond), le hoverIcon passe en rouge avec un petit
  badge « ! » en coin. Le chimiste voit immédiatement que l'action sera
  refusée.

**Interactions** :
- primary : clic → commit l'action prévisualisée.
- secondary (Shift) : sur bond, Shift+clic ouvre directement le mini-panneau
  d'ordre (see W4-R-08). Sur atome, Shift+clic ouvre le sélecteur d'élément.
- cancel (Esc) : n'annule rien (le hoverIcon est passif) ; si on vient de
  cliquer, Ctrl+Z classique.

**Keyboard shortcuts** : taper un symbole d'élément pendant qu'un atome
est survolé mute cet atome (C → N par exemple). Taper 1/2/3 sur un bond
survolé change son ordre.

**Cursor** : le système curseur de l'OS reste visible en dessous du
hoverIcon (pas de masquage). Outil atome → curseur crosshair fin + icône
préview offset 12 px.

**Tooltip / helper text** (French copy) : pas de tooltip sur le hoverIcon
(c'est lui-même un tooltip géométrique). Mais hint status-bar :
« Cliquer pour placer un atome N — Shift pour choisir l'élément. »

**Micro-animations** :
- Apparition hoverIcon : fade-in 80 ms à l'entrée sur canvas.
- Suit souris : position mise à jour à chaque `pointermove`, sans
  interpolation (doit coller).
- Changement de couleur (mutation préview) : 120 ms ease.
- Alerte valence : pulse léger (scale 1.0 → 1.05 → 1.0) sur 300 ms,
  joué une seule fois à l'apparition du badge rouge.

**Accessibility** :
- Le hoverIcon est visuel uniquement ; il est `aria-hidden="true"`.
- Le hint status-bar en bas lit la même info pour les lecteurs d'écran.
- Option dans préférences : « réduire les animations du curseur »
  désactive le fade-in et l'interpolation couleur.
- Tailles contrastées : label hoverIcon atteint 4.5:1 sur fond pastille.

**Edge cases** :
- outside canvas : hoverIcon invisible dès que la souris quitte le canvas.
- keyboard-only : hoverIcon non applicable (pas de curseur) ; les tooltips
  d'info sont accessibles via Tab sur les atomes.
- small screen : hoverIcon conservé mais taille réduite à 20×20 px sous
  600 px de largeur.
- screen reader : la zone status-bar lit « survol : atome C position
  (142, 87) ». Info suffisante sans visuel.

**Bénéfice utilisateur** : c'est ici que se joue le sentiment « Kendraw
comprend ce que je veux faire ». La prévisualisation réduit l'anxiété du
clic : je vois exactement ce qui va se passer avant que ça se passe.
Moins d'undo, plus de vitesse.

---

### W4-R-05 UX — Angle snap 15° par défaut, Shift=libre

**Position** : pendant le drag de création d'un bond, la prévisualisation
du bond suit la souris mais s'aligne sur les multiples de 15°. Un petit
indicateur d'angle s'affiche près du curseur.

**Visual state** :
- `idle` : pas d'indicateur (hors drag).
- `hover` : pas d'indicateur (hors drag).
- `active` (drag en cours, snap ON) : le bond preview est dessiné à
  l'angle snappé. Une étiquette 22×14 px affiche « 30° », « 60° », etc.,
  en typo mono 11 px, fond noir 88 %, texte blanc, placée au milieu du
  bond preview, décalée de 10 px en perpendiculaire. Un cercle guide
  (rayon = longueur bond) s'affiche très discrètement (1 px, 15 %
  opacité, couleur neutre) avec des tics sur chaque multiple de 15°.
- `active` (drag en cours, Shift maintenu, snap OFF) : le bond preview
  suit l'angle libre, l'étiquette affiche la valeur exacte arrondie au
  degré (« 37° »), les tics disparaissent pour signaler « mode libre ».
- `disabled` : n/a (cette micro-interaction est toujours active pendant
  un drag de bond).

**Interactions** :
- primary : drag souris détermine l'angle.
- secondary : Shift (ou Alt selon config ChemDraw) désactive le snap.
  Décision explicite de cette wave : **Shift = libre**, inverse de
  l'actuel Kendraw. Cohérent avec ChemDraw et Illustrator.
- cancel (Esc) : annule la création du bond, retour état idle.

**Keyboard shortcuts** : pendant le drag, tape un chiffre 1/2/3 pour
forcer l'ordre du bond preview. Taper Shift pendant le drag bascule
snap/libre en direct.

**Cursor** : crosshair fin, pas changé par le snap.

**Tooltip / helper text** (French copy) : hint status-bar pendant le
drag : « Glisser pour tracer — Shift : angle libre — Chiffre : ordre ».

**Micro-animations** :
- Snap transitions : 60 ms ease-out quand l'angle passe d'un cran au
  suivant (pas un saut brutal, un tout petit glissement).
- Label angle : fade-in 100 ms à l'apparition, suit ensuite sans
  interpolation.
- Cercle guide : fade-in 150 ms dès que le drag commence, fade-out 100 ms
  quand Shift est pressé.

**Accessibility** :
- L'indicateur d'angle est lu à chaque transition par le screen reader
  (« angle 30 degrés, angle 45 degrés »).
- Contraste label : blanc sur noir 88 %, 19:1.
- Option préférences : « Grille magnétique 15° / 30° / libre par
  défaut ». Par défaut 15°.

**Edge cases** :
- outside canvas : le drag continue, snap reste actif. Pas de confusion.
- keyboard-only : création par clavier parkée wave-5.
- small screen : le cercle guide peut disparaître sous 500 px (trop
  encombrant), seul le label angle reste.
- screen reader : annonce l'angle en continu pendant drag (throttle
  200 ms pour ne pas spammer).

**Bénéfice utilisateur** : le chimiste n'a plus à tenir Ctrl pour obtenir
un angle propre, c'est l'inverse — il tient Shift seulement quand il
veut sortir de la grille. 95 % des bonds sont à des angles standards ;
l'ergonomie suit cette statistique.

---

### W4-R-06 UX — Sélection rectangle marquee

**Position** : apparaît uniquement avec l'outil Select actif (V), sur un
drag depuis une zone vide du canvas. Rectangle se déploie depuis le point
de départ jusqu'au curseur.

**Visual state** :
- `idle` (outil Select actif, pas de drag) : curseur default, zéro
  marquee visible.
- `hover` : sur un atome/bond, le halo de hover (violet discret) indique
  que le clic sélectionnera cet élément. Sur zone vide, curseur reste
  default.
- `active` (drag en cours) : rectangle dessiné fin, bordure 1 px accent
  en pointillés (dashed 4-2), remplissage accent 10 %. Les atomes et
  bonds partiellement ou entièrement dans le rectangle prennent l'état
  « sélection preview » (halo accent 60 %). À mouseup, ils passent en
  « sélection confirmée » (halo accent 100 %).
- `disabled` : si on drag avec un autre outil actif, pas de marquee
  (cet outil a son propre comportement de drag).
- `during action` : voir active.

**Interactions** :
- primary : drag depuis zone vide → marquee qui englobe.
- secondary (Shift+drag) : marquee additive — ajoute les éléments du
  rectangle à la sélection existante.
- secondary (Ctrl+drag) : marquee toggle (XOR) — inverse l'appartenance
  des éléments du rectangle.
- secondary (Alt+drag) : marquee soustractive — retire les éléments du
  rectangle.
- cancel (Esc) : annule le drag en cours, la sélection revient à l'état
  pré-drag.

**Keyboard shortcuts** :
- V : activer outil Select.
- L : activer outil Lasso (polygone libre, même logique mais contour
  free-form).
- Ctrl+A : tout sélectionner.
- Ctrl+Shift+A : tout désélectionner.
- Shift+Tab : cycler entre modes Select/Lasso/Fragment (cf. doc wave-4
  section 9.5 — adopté).

**Cursor** :
- sur zone vide : `crosshair`.
- sur atome/bond : `pointer`.
- pendant drag : `crosshair` conservé.

**Tooltip / helper text** (French copy) : hint status-bar :
« Glisser pour sélectionner — Shift : ajouter — Ctrl : inverser — Alt :
retirer ». Affiché au premier activation de l'outil dans la session
(disparaît après 5 secondes).

**Micro-animations** :
- Apparition marquee : aucun fade, il suit instantanément le drag.
- Bordure pointillée : animation « marching ants » désactivée par défaut
  (ça fatigue l'œil sur long drag). Option préférences pour l'activer.
- Confirmation sélection : fade du halo preview (60 %) vers confirmé
  (100 %) en 120 ms au mouseup.

**Accessibility** :
- Rectangle marquee : `role="region"` avec `aria-live="polite"`
  annonçant « 3 atomes, 2 liaisons sélectionnés » en temps réel
  (throttle 300 ms).
- Contraste bordure marquee : accent 2 px contrastant fond canvas
  (4.7:1).
- Navigation clavier : Tab cycle les atomes, Shift+Tab inverse, Ctrl+A
  tout sélectionner.
- Alternative sans drag : clic sur atome puis Shift+clic sur un autre
  atome sélectionne la plage (en canvas logique : les deux atomes et les
  bonds entre).

**Edge cases** :
- outside canvas : le drag peut sortir du canvas sans problème, le
  rectangle est clamp aux bords visibles mais la sélection logique
  inclut les éléments hors vue.
- keyboard-only : sélection via Tab + Shift+Tab + Ctrl+A. Pas de besoin
  absolu du drag.
- small screen : marquee conserve sa mécanique. Sur mobile/tactile
  (wave-5), un long-press active le mode marquee.
- screen reader : annonce le compte d'éléments sélectionnés après chaque
  modification.

**Bénéfice utilisateur** : le chimiste peut enfin sélectionner des
sous-structures entières en un geste, sans avoir à Shift-clic
cinquante fois. C'est la base de toute manipulation efficace.

---

### W4-R-07 UX — Drag déplacement de sélection

**Position** : déclenché par un drag sur un atome/bond **déjà
sélectionné** (ou sur la bounding box de la sélection). Les éléments
sélectionnés suivent la souris avec un effet de translation en temps
réel.

**Visual state** :
- `idle` (sélection présente, souris hors sélection) : halo accent
  autour des éléments sélectionnés, bounding box pointillée accent 1 px
  autour du groupe (optionnel, toggleable).
- `hover` (souris sur élément sélectionné) : curseur `move` (quatre
  flèches), le halo se renforce légèrement (accent 120 % saturation).
- `active` (drag en cours) : les éléments sélectionnés sont translatés en
  temps réel, les bonds vers des atomes non sélectionnés (bonds « ponts »)
  s'étirent en caoutchouc. Grille magnétique en dessous (espacement
  standard bond 1.5 Å) guide l'alignement. Indicateur delta affiche
  « Δ (2.4, 1.1) Å » près du curseur.
- `active` (Shift maintenu pendant drag) : déplacement contraint à
  l'horizontale ou à la verticale (celui qui est dominant dès le début du
  drag).
- `active` (Ctrl maintenu pendant drag) : ignore la grille magnétique,
  déplacement libre au pixel près.
- `active` (Alt maintenu pendant drag) : duplique la sélection au lieu
  de la déplacer. Un fantôme translucide 50 % suit la souris pendant que
  l'original reste en place.
- `disabled` : pendant loading ou lock de record, drag inactif, curseur
  `not-allowed`, hint « Document verrouillé — déverrouiller pour
  modifier ».

**Interactions** :
- primary : drag → translation.
- secondary (Shift) : contraint axial.
- secondary (Ctrl) : sans snap grille.
- secondary (Alt) : duplication.
- cancel (Esc) pendant drag : annule le déplacement, les éléments
  reviennent à leur position initiale instantanément (pas d'animation,
  la réversion doit être nette pour rassurer).

**Keyboard shortcuts** :
- Flèches : nudge 1 px dans la direction.
- Shift+Flèches : nudge 10 px.
- Alt+Flèches : nudge 0.1 Å (coordonnées modèle).
- Ctrl+D : dupliquer la sélection à l'emplacement courant.
- Delete / Backspace : supprimer la sélection.

**Cursor** :
- `move` (4 flèches) sur éléments sélectionnés.
- `grabbing` pendant drag actif.
- `copy` (flèche + petit +) quand Alt est maintenu.

**Tooltip / helper text** (French copy) : hint status-bar pendant drag :
« Δ (x, y) Å — Shift : contraint — Ctrl : libre — Alt : dupliquer ».

**Micro-animations** :
- Début du drag : les bonds pont passent en mode « caoutchouc » avec
  transition 80 ms (pas instantané, un tout petit stretch pour indiquer
  la contrainte élastique).
- Grille magnétique : les tics magnétiques pulse 200 ms ease-out quand un
  atome snap sur un point.
- Commit (mouseup) : fade-out grille 150 ms, halo sélection stable.
- Annulation Esc : positions reviennent instantanément (0 ms), flash
  rouge 150 ms sur la sélection pour signaler l'annulation.

**Accessibility** :
- Déplacement 100 % clavier via flèches.
- Chaque nudge annoncé par screen reader : « déplacement 1 pixel droite ».
- Focus ring visible sur la sélection pendant le nudge.
- Indicateur delta lisible par screen reader en direct (throttle 250 ms).
- Undo atomique : Ctrl+Z revient à l'état pré-drag, pas étape par étape.

**Edge cases** :
- outside canvas : drag peut sortir du canvas, le scroll auto-centre vers
  la sélection après 300 ms si elle sort de la zone visible.
- keyboard-only : nudge fonctionne sans la souris, Ctrl+D duplique.
- small screen : le drag fonctionne ; la grille magnétique est plus
  espacée (tics visibles uniquement à zoom ≥ 75 %).
- screen reader : annonce les collisions (« superposition détectée avec
  atome C existant »).

**Bénéfice utilisateur** : le chimiste déplace un fragment entier comme
dans Illustrator, voit clairement le delta, peut contraindre, dupliquer,
et annuler en un geste. C'est le pouvoir d'édition d'un outil pro.

---

### W4-R-08 UX — `/` toggle mini-panneau propriétés au survol

**Position** : mini-panneau flottant qui apparaît à côté de l'atome/bond
survolé (décalé 16 px en haut-droite), invoqué par la touche `/` pendant
le survol. Taille compacte 180×auto px, typiquement 180×90 px.

**Visual state** :
- `idle` : panneau absent.
- `hover` (survol atome/bond, `/` non pressé) : halo hover standard, pas
  de panneau.
- `active` (survol + `/` pressé) : panneau apparaît, fond sombre
  rgba(22,22,22,0.96), bordure 1 px accent 40 %, border-radius 6 px,
  ombre portée 0 4px 12px rgba(0,0,0,0.4). Contenu structuré :
  - ligne 1 : type + position (« Atome N · (142, 87) »)
  - ligne 2 : champ saisie pour l'élément, focus auto au `/`
  - ligne 3 : ligne de raccourcis disponibles (« Entrée valider · Esc
    fermer · Tab suivant »)
- `active` sur bond : contenu adapté (« Bond simple · Δ 1.5 Å · angle
  30° »), champ pour l'ordre (1/2/3/aro/wedge…).
- `disabled` : n/a (le panneau est invoqué sur demande).
- `during action` : pendant saisie, le champ a focus ring accent 2 px.
  Chaque modification applique un preview temps réel sur le canvas
  (l'atome/bond mute visuellement avant validation).

**Interactions** :
- primary : `/` (slash) → ouvre le panneau sur l'élément survolé.
- secondary : Tab dans le panneau pour passer à l'élément suivant
  (dans l'ordre de graphe, atome adjacent).
- secondary : Shift+Tab précédent.
- cancel (Esc) : ferme le panneau **sans appliquer** les modifications
  en cours. Le preview canvas disparaît, retour état pré-ouverture.
- validation : Entrée applique la modification, panneau se ferme.

**Keyboard shortcuts** :
- `/` : toggle open/close (si déjà ouvert sur le même élément, `/`
  ferme).
- Taper un symbole d'élément direct dans le champ (« N », « O »,
  « Cl »).
- Taper 1/2/3 sur bond pour ordre.
- `W` pour wedge, `D` pour dash, `H` pour hashed-wedge.

**Cursor** : dans le panneau, curseur `text` sur les champs.

**Tooltip / helper text** (French copy) : pas de tooltip sur le panneau
lui-même (c'est déjà un panneau d'info). Au premier usage de la session,
un toast discret en bas : « Astuce : `/` édite l'atome/bond survolé. »

**Micro-animations** :
- Apparition panneau : fade-in 120 ms + slide 4 px de la droite vers la
  gauche. Juste assez pour que l'œil repère la source.
- Disparition : fade-out 80 ms, sans slide (plus rapide, moins
  intrusif).
- Preview canvas pendant saisie : transition 120 ms couleur/ordre, le
  changement est lisible sans être abrupt.
- Focus ring champ : 120 ms ease sur l'apparition.

**Accessibility** :
- Le panneau est `role="dialog"` avec `aria-modal="false"` (il ne bloque
  pas le canvas) et `aria-label="Propriétés de l'atome N"`.
- Focus géré : à l'ouverture, focus auto sur le champ principal. À la
  fermeture, focus retourne au canvas.
- Navigation clavier totale : Tab cycle les champs, Shift+Tab inverse,
  Esc ferme, Entrée valide.
- Screen reader : annonce « panneau propriétés ouvert sur atome N »
  puis lit chaque champ à la navigation.

**Edge cases** :
- outside canvas : le panneau se repositionne automatiquement s'il
  déborderait du viewport (flip horizontal ou vertical selon place
  disponible, pattern floating-ui).
- keyboard-only : `/` peut être invoqué sur l'atome focus (pas besoin de
  survol souris), le panneau s'ancre à la position de l'atome.
- small screen : sous 600 px, le panneau s'affiche en bottom sheet
  ancrée en bas du viewport (pleine largeur).
- screen reader : le preview canvas pendant saisie est annoncé
  (« atome mute en O »), l'annulation Esc est annoncée (« modification
  annulée »).

**Bénéfice utilisateur** : c'est le pattern emblématique de Ketcher
(« /, touche magique ») adapté. Le chimiste édite une propriété sans
jamais lâcher le clavier, sans ouvrir un modal qui vole le focus, sans
se déplacer visuellement. Pure fluidité.

---

## ASCII layout du nouveau canvas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOP TOOLBAR   [New] [Open] [Save] [Import] [Export]  │  [Undo] [Redo]      │
│                                    │                  │  [Zoom −] 100 % [Zoom +] [Fit] │
├──────┬──────────────────────────────────────────────────────────┬───────────┤
│      │                                                          │           │
│  T   │                                                          │    P R    │
│  O   │                                                          │    R I    │
│  O   │                                                          │    O G    │
│  L   │         ┌─ GRILLE CANVAS ──────────────────┐             │    P H    │
│  B   │         │                                  │             │    R T    │
│  O   │         │           H                      │             │    I      │
│  X   │         │           │                      │             │    É P    │
│      │         │    H ─ C ═ C ─ H                 │             │    T A    │
│  ┌──┐│         │        │    │                    │             │    É N    │
│  │V │◀─ Select│         │    N (hover preview 28×28)            │    S E    │
│  │L │  Lasso │         │                                        │           │
│  │H │  Pan   │         │                                        │  MW 78.11 │
│  │─ │  divider         │                                        │  LogP 2.1 │
│  │1 │  Bond ▸│         │         "37°"  angle hint               │  tPSA 22  │
│  │X │  Chain│          │                                        │  Lipinski │
│  │A │  Atom ▸          │                                        │  ────     │
│  │─ │   divider        │                                        │  SMILES   │
│  │R │  Ring ▸          │                                        │  InChI    │
│  │─ │   divider        │                                        │           │
│  │T │  Text │          │                                        │  [NMR ▼]  │
│  │W │  Arrow ▸         │                                        │  Spectrum │
│  │U │  Curly ▸         │                                        │  overlay  │
│  │G │  Shape ▸         │                                        │           │
│  │─ │   divider        │                                        │           │
│  │E │  Eraser           └─────── canvas edge-to-edge ───────┘   │           │
│  │─ │   divider                                                 │           │
│  │M │  NMR  │                                                   │           │
│  │L │  Lib  │                                                   │           │
│  │I │  Import                                                   │           │
│  │─ │   divider                                                 │           │
│  │# │  Numbers                                                  │           │
│  └──┘│                                                          │           │
│      │                                                          │           │
├──────┴──────────────────────────────────────────────────────────┴───────────┤
│ STATUS BAR   Zoom 100 %  ·  (142, 87)  ·  Select : 3 atomes, 2 bonds  ·  v2│
└─────────────────────────────────────────────────────────────────────────────┘
```

Notes sur le layout :

- **Toolbox gauche** : 56 px de large, fond `rgba(18,18,18,0.88)`,
  groupée avec dividers. Chaque bouton 40×40 px, icône 20 px, raccourci
  `<kbd>` en overlay coin bas-droite 9 px.
- **Top toolbar** : 44 px de haut, divisé en deux zones (fichier à
  gauche, contrôles à droite). Séparateur vertical 1 px au milieu.
- **Canvas** : occupe tout l'espace central. Pas de bordure visible,
  fond légèrement plus clair que les chromes (rgba(24,24,24,1) par ex).
- **Panel droit** : 280 px de large (collapsable à 48 px via bouton
  chevron). Contient Properties (top) + NMR (bottom), séparés par un
  tab ou accordion.
- **Status bar** : 28 px de haut, typo mono 11 px, affiche zoom,
  coordonnées souris, nombre d'éléments sélectionnés, version canvas.

Sur petit écran (< 1024 px de large), le panel droit collapse en chevron,
et l'utilisateur peut l'ouvrir via `Ctrl+Shift+P`. Sur très petit écran
(< 720 px), la toolbox gauche collapse en une seule colonne scrollable.

---

## Design tokens

Les tokens sont déclarés en CSS variables dans `packages/ui/src/styles/
tokens.css` (à créer ou étendre).

### Couleurs

```
--kd-color-bg-canvas         : #181818   /* fond canvas principal */
--kd-color-bg-chrome         : rgba(18,18,18,0.88)   /* toolbox, toolbar */
--kd-color-bg-panel          : rgba(22,22,22,0.94)   /* panels, modals */
--kd-color-bg-submenu        : rgba(8,8,8,0.96)      /* sous-menus flottants */

--kd-color-border-subtle     : rgba(255,255,255,0.07)
--kd-color-border-default    : rgba(255,255,255,0.12)
--kd-color-border-strong     : rgba(255,255,255,0.20)

--kd-color-text-primary      : #e8e8e8
--kd-color-text-secondary    : #b0b0b0
--kd-color-text-muted        : #7a7a7a

--kd-color-accent            : #5aa9ff   /* bleu primaire sélection */
--kd-color-accent-hover      : #7ac0ff
--kd-color-accent-muted      : rgba(90,169,255,0.2)

--kd-color-element-C         : #202020
--kd-color-element-H         : #404040
--kd-color-element-N         : #3060d0
--kd-color-element-O         : #d04040
--kd-color-element-S         : #d0b040
--kd-color-element-P         : #d07030
--kd-color-element-halogen   : #30b060

--kd-color-hover             : rgba(90,169,255,0.6)
--kd-color-selection         : rgba(90,169,255,1.0)
--kd-color-selection-preview : rgba(90,169,255,0.6)
--kd-color-error             : #ff5a5a
--kd-color-warning           : #ffb040
--kd-color-success           : #5adb7a
```

### Espacement

```
--kd-space-0 : 0
--kd-space-1 : 2px
--kd-space-2 : 4px
--kd-space-3 : 6px
--kd-space-4 : 8px
--kd-space-5 : 12px
--kd-space-6 : 16px
--kd-space-7 : 24px
--kd-space-8 : 32px
```

Règles d'utilisation :
- Padding intérieur des boutons : `--kd-space-3` (6 px).
- Gap entre groupes toolbox : `--kd-space-4` (8 px).
- Gap entre panels : `--kd-space-5` (12 px).
- Padding panels : `--kd-space-6` (16 px).

### Typographie

```
--kd-font-sans : 'Inter', system-ui, sans-serif
--kd-font-mono : 'JetBrains Mono', 'SFMono-Regular', monospace

--kd-text-11 : 11px / 14px       /* kbd, badges, status bar */
--kd-text-12 : 12px / 16px       /* labels toolbox */
--kd-text-13 : 13px / 18px       /* hint, helper */
--kd-text-14 : 14px / 20px       /* body, tooltip */
--kd-text-16 : 16px / 24px       /* headings panel */
```

### Rayons

```
--kd-radius-sm : 3px   /* kbd, badges */
--kd-radius-md : 5px   /* boutons */
--kd-radius-lg : 6px   /* panels, cards */
--kd-radius-xl : 8px   /* modals, overlays */
```

### Ombres

```
--kd-shadow-subtle : 0 1px 2px rgba(0,0,0,0.25)
--kd-shadow-panel  : 0 4px 12px rgba(0,0,0,0.40)
--kd-shadow-modal  : 0 8px 28px rgba(0,0,0,0.55)
```

### Z-index

```
--kd-z-canvas     : 0
--kd-z-chrome     : 10
--kd-z-submenu    : 100
--kd-z-minipanel  : 150
--kd-z-modal      : 200
--kd-z-toast      : 300
```

---

## Motion language

La cohérence de l'animation est aussi importante que la cohérence des
couleurs. Tous les composants Kendraw utilisent les mêmes durations et
courbes.

### Durations canoniques

- **60 ms** : micro-transitions (snap angle, couleur toggle).
- **80 ms** : apparitions rapides (hoverIcon fade-in, disparition
  mini-panneau).
- **100 ms** : hover states, fade-in submenus.
- **120 ms** : changements d'outil, transitions de boutons, apparition
  mini-panneau. **Durée « par défaut » de Kendraw.**
- **150 ms** : fade-out modals, alertes.
- **200 ms** : transitions panel open/close, grille magnétique pulse.
- **250 ms** : zoom fit to screen, repositionnement caméra.
- **300 ms** : alertes d'erreur (pulse unique).

### Courbes d'easing

- `ease-out` (cubic-bezier(0.0, 0.0, 0.2, 1)) : pour tout ce qui entre
  dans le champ de vision (apparitions, hovers).
- `ease-in` (cubic-bezier(0.4, 0.0, 1, 1)) : pour tout ce qui quitte
  (disparitions, fermetures).
- `ease-in-out` (cubic-bezier(0.4, 0.0, 0.2, 1)) : pour les mouvements
  (zoom, pan animé).
- `linear` : uniquement pour progress bars et indicateurs continus.

### Animations interdites

- **Marching ants** sur bordures pointillées : désactivé par défaut
  (fatigue visuelle).
- **Bounce** (overshoot) : jamais utilisé, sensation peu professionnelle.
- **Parallax** : jamais utilisé.
- **Shimmer/skeleton** : uniquement pour les chargements serveur longs
  (NMR prediction > 800 ms).

### Préférences système

Toutes les animations sont gated par
`@media (prefers-reduced-motion: reduce)` :
- durations divisées par 5 (120 ms → 24 ms, quasi instantané).
- Pas de slide, uniquement fade.
- Option préférences « réduire les animations » overrides la détection
  système.

---

## Empty states

### Canvas vide (zéro molécule)

Lorsque le document est vide, le canvas affiche :

- Au centre géométrique du viewport, une illustration ligne-art discrète
  (benzène stylisé, 120 px, opacité 8 %).
- En dessous, à 24 px, un titre typo 16 px couleur muted :
  « Commencer à dessiner ».
- En dessous, à 8 px, un sous-texte 13 px plus clair :
  « Appuyez sur A pour placer un atome, ou 1 pour un bond. »
- Plus bas, à 32 px, trois CTA en ligne, boutons outline subtile :
  - « Importer un fichier »  (icône import)
  - « Bibliothèque »  (icône library)
  - « Benzène (Ctrl+B) »  (CTA rapide)

Quand l'utilisateur commence à dessiner, l'illustration fade out en
200 ms et tout le bloc disparaît. À la première atome placé, un toast
discret en bas s'affiche une seule fois par session : « Astuce :
appuyez sur `/` pour éditer un atome au survol ».

### Panel Properties vide

Quand aucune molécule n'est dessinée, le panel Properties affiche :

- Icône flacon vide 48 px centré, opacité 20 %.
- Texte muted 13 px : « Les propriétés apparaîtront ici dès qu'une
  molécule sera dessinée. »
- Pas de CTA (le CTA est dans le canvas).

### Panel NMR vide

Message : « Dessinez une molécule et cliquez sur Prédire pour afficher
le spectre 1H/13C. » Bouton primary « Prédire » désactivé avec tooltip
« Aucune molécule à prédire ».

### Sélection vide (outil Select actif, rien de sélectionné)

Status bar affiche : « Select : aucun élément ». Toolbar haute :
boutons Cut/Copy/Delete désactivés avec tooltip explicatif
« Sélectionner d'abord un atome ou un bond ».

### Import en cours

Overlay canvas 30 % noir, spinner accent 32 px au centre, texte
« Import en cours… » (nom de fichier en sous-texte). Bouton « Annuler »
en bas-droite.

### Erreur d'import

Toast erreur en bas-droite, 400 px × auto, fond rouge 15 %, bordure
rouge 60 %, texte blanc. Icône alerte 16 px. Message explicite :
« Impossible d'importer `mol-v3000.mol` — format MOL V3000 non
supporté. Utilisez V2000 ou CDXML. » Bouton « Fermer » + auto-dismiss
après 8 secondes.

---

## Tableau récapitulatif des raccourcis utilisateur

| Catégorie      | Raccourci            | Action                              |
|----------------|----------------------|-------------------------------------|
| Outils         | V                    | Sélection                           |
| Outils         | L                    | Lasso                               |
| Outils         | H                    | Pan (ou Space + drag)               |
| Outils         | 1, 2, 3              | Bond simple/double/triple           |
| Outils         | X                    | Chain                               |
| Outils         | A                    | Atome                               |
| Outils         | R                    | Ring                                |
| Outils         | T                    | Text                                |
| Outils         | W                    | Arrow                               |
| Outils         | U                    | Curly arrow                         |
| Outils         | G                    | Shape                               |
| Outils         | E                    | Eraser                              |
| Édition        | Ctrl+Z / Ctrl+Y      | Undo / Redo                         |
| Édition        | Delete / Backspace   | Supprimer la sélection              |
| Édition        | Ctrl+A               | Tout sélectionner                   |
| Édition        | Ctrl+Shift+A         | Tout désélectionner                 |
| Édition        | Ctrl+D               | Dupliquer                           |
| Édition        | Ctrl+C / Ctrl+V      | Copier / Coller                     |
| Édition        | Flèches              | Nudge 1 px                          |
| Édition        | Shift+Flèches        | Nudge 10 px                         |
| Navigation     | Ctrl+Wheel           | Zoom                                |
| Navigation     | Ctrl+0               | Zoom 100 %                          |
| Navigation     | Ctrl+1               | Fit to screen                       |
| Navigation     | Space + drag         | Pan                                 |
| Mini-panneau   | `/`                  | Ouvrir panneau propriétés           |
| Mini-panneau   | Esc                  | Fermer sans appliquer               |
| Mini-panneau   | Entrée               | Valider                             |
| Sélection      | Shift+Tab            | Cycler modes Select/Lasso/Fragment  |
| Sélection      | Shift+clic           | Ajouter à la sélection              |
| Sélection      | Ctrl+clic            | Toggle (XOR)                        |
| Sélection      | Alt+clic             | Retirer                             |
| Création bond  | Shift (en drag)      | Angle libre (désactive snap)        |
| Création bond  | Ctrl (en drag)       | Duplique le bond                    |
| Panels         | Ctrl+M               | Toggle NMR                          |
| Panels         | Ctrl+Shift+P         | Toggle Properties panel             |
| Panels         | Ctrl+Shift+C         | Toggle compound numbering           |
| Fichier        | Ctrl+I               | Import                              |
| Fichier        | Ctrl+S               | Save                                |
| Fichier        | Ctrl+Shift+S         | Save As                             |
| Fichier        | Ctrl+L               | Library                             |

---

## Checklist UX de complétion par story

Pour chaque story, avant de la marquer « done », vérifier :

- [ ] Les 5 états visuels (`idle`, `hover`, `active`, `disabled`, `during
  action`) sont implémentés et inspectables via storybook ou tests
  visuels.
- [ ] Chaque interaction primary et secondary a été testée avec un
  chimiste pilote (session de 30 min).
- [ ] Les raccourcis clavier fonctionnent sans souris.
- [ ] Les ARIA roles et labels sont en place ; audit axe-core passe
  sans warning.
- [ ] Les animations respectent la motion language (durations, courbes).
- [ ] `prefers-reduced-motion` respecté.
- [ ] Les tokens design sont utilisés (pas de couleur hardcodée).
- [ ] Tooltip français correct et concis (2-4 mots).
- [ ] Hint status-bar disponible pour chaque action en cours.
- [ ] Empty state pertinent si la fonctionnalité n'a rien à afficher.
- [ ] Responsive : testé à 720, 1024, 1440, 2560 px de large.
- [ ] Screen reader : flux annoncé (NVDA ou VoiceOver session
  20 min).

---

## Réflexion finale — Ce qui distingue Kendraw après cette wave

Avant wave-4 : Kendraw est un éditeur fonctionnel, un peu rude, qui fait
le travail. Le chimiste apprécie les fonctionnalités (NMR, properties,
lock) mais subit le dessin.

Après wave-4 : Kendraw est un plaisir à utiliser. Le hoverIcon dit
« je t'ai compris », le snap angle dit « je ne te fais pas perdre une
seconde », la sélection rectangle dit « tu peux manipuler par
sous-structures », le drag dit « tu es aux commandes », le mini-panneau
slash dit « n'enlève pas les mains du clavier ».

Chaque décision UX de cette wave sert une seule promesse : **le chimiste
doit pouvoir dessiner aussi vite qu'il pense**. Et quand il pense, il
n'a pas à regarder l'interface. L'interface disparaît. Il ne reste que
la molécule.
