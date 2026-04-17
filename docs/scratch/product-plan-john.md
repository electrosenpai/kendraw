# Product Plan — Wave-4 Redraw Kendraw

**Auteur** : John (Product Manager, BMAD)
**Date** : 2026-04-18
**Source** : `docs/ketcher-analysis-wave-4.md` sections 8, 9, 10
**Statut** : Draft pour review PO / Tech Lead avant démarrage Wave-4 Redraw

---

## Contexte

L'analyse Ketcher (Wave-4 ACTE-1) a livré un diagnostic sans complaisance : Kendraw V0.4 est solide sur le backend (RDKit), propre sur le data-model (Zustand + Immer + snapshots), et mature sur le NMR. En revanche, la **sensation de dessin** reste en retrait par rapport à Ketcher et ChemDraw. Un chimiste qui bascule entre les trois outils sent immédiatement que Kendraw « est un prototype » — pas parce que le moteur est mauvais, mais parce que les micro-interactions (hover preview, snap angle par défaut, sélection rectangle, drag-move, toggle `/`) sont absentes ou contre-intuitives.

La Wave-4 Redraw vise à combler ce delta avec un **clean-room rewrite du canvas**, inspiré de Ketcher, sans jamais copier de code. Le nouveau canvas vit derrière un feature flag `VITE_ENABLE_NEW_CANVAS`, coexiste avec l'ancien, partage le même `SceneStore`, et sera activé par défaut uniquement quand les 8 stories P0 ci-dessous seront terminées et validées E2E.

Ce document cartographie les 8 stories P0 (`W4-R-01` → `W4-R-08`) identifiées section 9.5 de l'analyse. Chaque story est écrite au format BMAD avec AC testables, référence Ketcher, fichiers à toucher, tests requis, risques, effort, features à préserver et priorité.

Les P1+ (fusion cycles in-place, rotate handle, flip, `<kbd>` inline, etc.) sont volontairement parkés dans `docs/deferred-work-wave-4.md` — ils ne rentrent pas dans cette Wave.

---

## Story W4-R-01 — Feature flag et squelette du package canvas-new

**As a** chimiste utilisateur de Kendraw
**I want** que la réécriture du canvas se déploie sans jamais casser mon workflow actuel
**So that** je peux continuer à dessiner, sauvegarder et exporter mes molécules pendant que l'équipe fait la bascule en coulisses

### Acceptance Criteria

- [ ] AC1 — Un fichier `packages/ui/src/config/feature-flags.ts` expose un objet `FEATURE_FLAGS` avec la propriété booléenne `newCanvas`, lue depuis `import.meta.env.VITE_ENABLE_NEW_CANVAS` et par défaut `false`.
- [ ] AC2 — Un nouveau dossier `packages/ui/src/canvas-new/` est créé avec `CanvasNew.tsx` (composant React stub qui rend un simple `<div>` avec un message « Canvas new WIP » et reçoit les mêmes props que `Canvas.tsx` existant : `store`, `toolState`, callbacks).
- [ ] AC3 — `packages/ui/src/App.tsx` sélectionne au runtime entre `<Canvas>` et `<CanvasNew>` selon `FEATURE_FLAGS.newCanvas`, sans aucune régression visuelle ni fonctionnelle sur l'ancien canvas quand le flag est `false`.
- [ ] AC4 — Le fichier `.env.example` documente la variable `VITE_ENABLE_NEW_CANVAS=false` avec un commentaire explicatif.
- [ ] AC5 — La CI (pnpm lint, typecheck, test, ruff, mypy, pytest) passe à zéro erreur avec le flag `false` comme avec le flag `true`.
- [ ] AC6 — Un test E2E Playwright dédié lance l'application avec `VITE_ENABLE_NEW_CANVAS=true` et vérifie que la page charge sans erreur console et que le message stub est visible.

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-react/src/Editor.tsx` (point d'entrée du canvas Ketcher)
- Pattern observé : point d'entrée unique, injection du store via props, séparation stricte entre composant React hôte et logique d'édition.
- Kendraw adaptation inspirée de ce découpage : point d'entrée `CanvasNew.tsx` minimaliste, toute la logique d'édition vivra dans des modules `canvas-new/tools/`, `canvas-new/interactions/`, `canvas-new/render/` à venir dans les stories suivantes.

### Files to touch

- `packages/ui/src/config/feature-flags.ts` (créé)
- `packages/ui/src/canvas-new/CanvasNew.tsx` (créé, stub)
- `packages/ui/src/canvas-new/index.ts` (créé, re-export)
- `packages/ui/src/App.tsx` (switch runtime entre Canvas et CanvasNew)
- `packages/ui/src/env.d.ts` (typer `VITE_ENABLE_NEW_CANVAS`)
- `.env.example` (variable documentée)
- `packages/ui/vite.config.ts` (vérifier `define` ou passthrough Vite)

### Tests required

- Unit : `feature-flags.test.ts` vérifie que le flag est bien `false` par défaut, `true` quand la variable d'env est `'true'`, et ignore les autres valeurs (sécurité).
- E2E Playwright : `canvas-new-flag.spec.ts` lance avec flag `true` et vérifie le stub, puis avec flag `false` et vérifie que l'ancien canvas est présent (sélecteur existant).
- Regression : la suite E2E actuelle (`tests/e2e/*.spec.ts`) passe intégralement avec flag `false`.

### Risks

- Risque de collision si `App.tsx` gère déjà des rendus conditionnels. Mitigation : isoler le switch en haut du render, commentaire explicite.
- Variables d'env Vite exigent le préfixe `VITE_` — oubli fréquent. Mitigation : test unitaire dédié.

### Effort

S

### Kendraw features to preserve

- `packages/nmr/` entier, `PropertyPanel.tsx`, `api-client`, persistence, audit trail, I/O CDXML/MOL/SMILES/KDX/JCAMP — aucun de ces modules n'est touché.
- L'ancien `Canvas.tsx` reste intact et reste la route par défaut jusqu'à la fin de la Wave.

### Priority + rank

P0 — rank 1/8 (prérequis de toutes les autres stories)

---

## Story W4-R-02 — Tool abstraction uniformisée `{mousedown, mousemove, mouseup, cancel}`

**As a** chimiste qui ajoute fréquemment des outils custom (templates, groupes, annotations)
**I want** que chaque outil du canvas expose un contrat d'événements identique
**So that** dessiner se fait avec un comportement prévisible quel que soit l'outil, et l'ajout de nouveaux outils par l'équipe ne régresse jamais les outils existants

### Acceptance Criteria

- [ ] AC1 — Un fichier `packages/ui/src/canvas-new/tools/Tool.ts` définit une interface TypeScript `Tool` avec les méthodes obligatoires `mousedown(ctx, event)`, `mousemove(ctx, event)`, `mouseup(ctx, event)`, `cancel(ctx)` et la méthode optionnelle `keydown(ctx, event)`.
- [ ] AC2 — Le type `ToolContext` (passé en premier argument) expose au minimum : `store`, `camera`, `spatialIndex`, `currentCursorWorld`, `currentCursorScreen`, `hoveredItem`, `setPreview(preview)`.
- [ ] AC3 — Au moins trois outils de référence (`AtomTool`, `BondTool`, `EraserTool`) sont implémentés via ce contrat dans `packages/ui/src/canvas-new/tools/` et couvrent mousedown/move/up + cancel (Esc).
- [ ] AC4 — Un `ToolRouter` unique dans `CanvasNew.tsx` attache les listeners DOM au `<canvas>` et délègue à l'outil actif ; `CanvasNew.tsx` reste en dessous de 400 lignes (contre 1729 pour l'ancien).
- [ ] AC5 — Le switch d'outil (changement de `toolState.selectedTool`) appelle automatiquement `cancel()` sur l'outil sortant pour éviter des états fantômes.
- [ ] AC6 — Chaque outil de référence a un test unitaire qui instancie l'outil, simule une séquence d'événements, et vérifie les mutations attendues sur le store.

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/tools/Base.ts` et `tool/atom.ts`, `tool/bond.ts`
- Pattern observé : chaque outil implémente une méthode par événement ; le routeur central dispatche selon l'outil actif ; cancel() pour nettoyer preview et drag en cours.
- Kendraw adaptation inspirée : contrat TypeScript immutable sur la forme de l'outil, méthodes pures sauf pour `setPreview` ; pas de classe mutable, on privilégie des factories fonctionnelles qui retournent un `Tool` figé.

### Files to touch

- `packages/ui/src/canvas-new/tools/Tool.ts` (interface)
- `packages/ui/src/canvas-new/tools/ToolContext.ts` (type)
- `packages/ui/src/canvas-new/tools/AtomTool.ts`
- `packages/ui/src/canvas-new/tools/BondTool.ts`
- `packages/ui/src/canvas-new/tools/EraserTool.ts`
- `packages/ui/src/canvas-new/tools/index.ts`
- `packages/ui/src/canvas-new/CanvasNew.tsx` (ajout du ToolRouter)

### Tests required

- Unit : un fichier de test par outil, plus `ToolRouter.test.ts` qui vérifie la bascule et le cancel sur switch.
- E2E Playwright : `canvas-new-tools.spec.ts` active le flag, sélectionne AtomTool, clique, vérifie atome créé ; même chose pour BondTool et EraserTool.
- Regression : bascule flag `false`, la suite existante de tests d'outils sur l'ancien canvas reste verte.

### Risks

- Sur-abstraction : on peut être tenté de rendre l'interface trop générique dès maintenant. Mitigation : se limiter aux signatures effectivement utilisées par les trois outils de référence ; refactor quand un quatrième outil arrive.
- Fuite d'état entre outils via `ToolContext`. Mitigation : `setPreview` accepte `null` pour reset, appelé systématiquement en `cancel()`.

### Effort

M

### Kendraw features to preserve

- Les raccourcis clavier existants (C/N/O/1/2/3/W/etc.) continuent de fonctionner via le même registre `group-label-hotkeys` ; le nouveau canvas consomme ce registre sans le modifier.
- Le `SceneStore` Zustand/Immer n'est pas muté — les outils appellent les mêmes actions store que l'ancien canvas.

### Priority + rank

P0 — rank 2/8 (socle technique de R-04, R-05, R-06, R-07, R-08)

---

## Story W4-R-03 — Rendu Canvas 2D partagé avec l'ancien canvas

**As a** chimiste qui veut pouvoir basculer entre ancien et nouveau canvas sans changement visuel perceptible
**I want** que le rendu pixel-à-pixel de mes molécules soit strictement identique entre les deux canvas
**So that** la confiance dans la bascule reste intacte et je peux évaluer l'ergonomie sans me poser de questions sur la fidélité du rendu

### Acceptance Criteria

- [ ] AC1 — Le nouveau canvas délègue le rendu à `packages/renderer-canvas/` exactement comme l'ancien, via l'export public `render(document, ctx, camera, options)`.
- [ ] AC2 — Aucun fichier de `packages/renderer-canvas/` n'est modifié ; les imports se font uniquement depuis l'API publique.
- [ ] AC3 — Une boucle `requestAnimationFrame` dans `CanvasNew.tsx` repeint quand le store émet une notification de changement, avec throttle à 60 fps maximum.
- [ ] AC4 — Le canvas gère correctement DPR (device pixel ratio) via scale au setup, identique à l'ancien.
- [ ] AC5 — Un test de non-régression visuelle Playwright charge une molécule de référence (benzène + hydroxyle) dans les deux canvas et vérifie que les deux captures d'écran sont identiques à 1 pixel près.
- [ ] AC6 — Le rendu supporte déjà tous les types d'éléments existants (atomes, liaisons, flèches, annotations, formes, groupes) sans perte — rien de chimique n'est régressé.

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-core/src/application/render/restruct/restruct.ts`
- Pattern observé : séparation domaine (Struct) / rendu (ReStruct) avec dirty-tracking.
- Kendraw adaptation inspirée : volontairement **plus simple** — on re-peint tout à chaque frame, c'est suffisant sous 200 atomes et ça évite la complexité du dirty-tracking. Section 11.2 de l'analyse justifie ce choix.

### Files to touch

- `packages/ui/src/canvas-new/render/renderLoop.ts` (créé)
- `packages/ui/src/canvas-new/CanvasNew.tsx` (branchement de la loop)
- `packages/renderer-canvas/` — aucun fichier modifié

### Tests required

- Unit : `renderLoop.test.ts` vérifie que la loop se déclenche sur store change, s'arrête au unmount, et respecte le throttle 60 fps.
- E2E Playwright : `canvas-new-render-parity.spec.ts` charge la molécule de référence dans l'ancien canvas, capture, bascule flag, recharge, capture, compare.
- Regression : la suite NMR (`nmr-prediction.spec.ts`) continue de passer dans le nouveau canvas (affichage chemical shifts sur atomes).

### Risks

- DPR mal géré → flou sur Retina. Mitigation : test visuel sur devicePixelRatio=2.
- Fuite mémoire si la rAF n'est pas annulée au unmount. Mitigation : cleanup explicite dans le useEffect.

### Effort

S

### Kendraw features to preserve

- Tout le module `packages/renderer-canvas/` est considéré comme API externe intouchable.
- Les overlays graphiques (NMR highlights, spectre, selection) continuent de fonctionner via `graphic-overlays.ts`.

### Priority + rank

P0 — rank 3/8 (prérequis visuel pour R-04 hover preview)

---

## Story W4-R-04 — HoverIcon atome et bond

**As a** chimiste qui dessine rapidement une molécule
**I want** un preview sémantique au survol (couleur de l'élément pour atomes, épaisseur reflétant l'ordre pour bonds)
**So that** je sais avant de cliquer ce que mon clic va produire, et le dessin devient fluide comme dans Ketcher ou ChemDraw

### Acceptance Criteria

- [ ] AC1 — Quand l'outil actif est un atome (ex. outil N) et que la souris survole une zone vide, un cercle semi-transparent aux couleurs CPK de l'élément apparaît à la position du curseur.
- [ ] AC2 — Quand l'outil actif est un atome et que la souris survole un atome existant, un halo autour de l'atome indique qu'un clic va remplacer le label ; l'halo utilise la couleur de l'élément cible.
- [ ] AC3 — Quand l'outil actif est un atome et que la souris survole un bond, l'extrémité la plus proche du curseur est mise en évidence pour signifier qu'un clic va ajouter un atome à cette extrémité.
- [ ] AC4 — Quand l'outil actif est un bond (ex. 1/2/3/wedge/hash), le survol d'une zone vide affiche un trait fantôme depuis l'atome hoveré (s'il y en a un) jusqu'au curseur, avec l'épaisseur reflétant l'ordre.
- [ ] AC5 — Le preview est purement visuel, il n'est jamais écrit dans le store — aucun snapshot d'historique ne doit être créé par un simple mouvement de souris.
- [ ] AC6 — Le preview est annulé immédiatement sur `mouseleave`, `cancel()`, switch d'outil ou appui Esc.
- [ ] AC7 — Les performances restent fluides : le survol ne descend pas sous 60 fps sur une molécule de 100 atomes (mesuré via Playwright + Performance API).

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-react/src/script/editor/Editor.ts` (hover API) et `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/tools/atom.ts` (`hoverIcon` preview)
- Pattern observé : l'éditeur maintient un `hoverItem` et l'outil actif publie un preview via une couche spéciale du renderer.
- Kendraw adaptation inspirée : `ToolContext.setPreview(preview | null)` est la seule API ; le renderer consomme le preview dans une passe finale après le document, avec `ctx.globalAlpha` réduit. Aucun écho dans le store.

### Files to touch

- `packages/ui/src/canvas-new/render/previewLayer.ts` (créé — dessine le preview au-dessus du document)
- `packages/ui/src/canvas-new/tools/AtomTool.ts` (publication du preview)
- `packages/ui/src/canvas-new/tools/BondTool.ts` (publication du preview)
- `packages/ui/src/canvas-new/CanvasNew.tsx` (intégration au render loop)
- `packages/ui/src/canvas-new/interactions/useHoveredItem.ts` (créé — hook qui lit le SpatialIndex)

### Tests required

- Unit : `previewLayer.test.ts` vérifie que les paramètres de dessin matchent l'élément CPK attendu ; `AtomTool.test.ts` simule un mousemove et vérifie l'appel `setPreview` avec les bons paramètres.
- E2E Playwright : `canvas-new-hover-preview.spec.ts` active AtomTool N, déplace la souris, attend un repaint, screenshot compare avec fixture.
- Regression : tests existants d'insertion d'atome continuent de passer ; aucun snapshot d'historique ne doit être créé par un simple survol.

### Risks

- Le preview peut masquer visuellement l'élément survolé si mal dosé. Mitigation : `globalAlpha` strictement inférieur à 0.5, halo autour et non par-dessus le label.
- Risque de repeint excessif à chaque mousemove. Mitigation : le mousemove déclenche un `requestAnimationFrame` coalescé, pas un repaint direct.

### Effort

M

### Kendraw features to preserve

- Les CPK colors existantes dans `renderer-canvas` sont la seule source de vérité ; on les réutilise sans les dupliquer.
- Le curseur d'outil existant (emoji + label) reste affiché au niveau du DOM ; le preview s'ajoute par-dessus, il ne remplace pas.

### Priority + rank

P0 — rank 4/8 (signature UX de la Wave-4, sine qua non de la fluidité)

---

## Story W4-R-05 — Angle snap 15° par défaut avec Shift pour libre

**As a** chimiste qui trace des liaisons selon les angles standard de la chimie organique
**I want** un snap d'angle à 15° activé par défaut, avec Shift pour le désactiver ponctuellement
**So that** je trace des chaînes et cycles propres sans effort, et je peux quand même poser des liaisons à angle libre quand la structure l'exige

### Acceptance Criteria

- [ ] AC1 — Le drag d'un bond depuis un atome existant ou depuis un atome implicite snappe automatiquement à l'angle multiple de 15° le plus proche.
- [ ] AC2 — Maintenir Shift pendant le drag désactive le snap et permet un angle libre ; relâcher Shift pendant le drag réactive le snap instantanément.
- [ ] AC3 — Le raccourci clavier existant `Ctrl+E` (toggle de snap 30°) est réaffecté à « toggle snap 15°/30° » ; l'état est mémorisé dans `toolState.angleSnapStep` et visible dans la StatusBar.
- [ ] AC4 — La StatusBar affiche en permanence le pas de snap actif et indique « Shift pour libre ».
- [ ] AC5 — Le snap est visuel pendant le drag (la ligne fantôme se colle aux angles) avant même le mouseup.
- [ ] AC6 — Une tolérance hysteresis évite le flickering quand le curseur est exactement sur la frontière entre deux snap slots.
- [ ] AC7 — Les angles produits côté données sont exacts à 0.001 rad près par rapport à l'angle théorique (ex. 15°, 30°, 45°, 60°, 90°).

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/shared/utils.ts` (`fracAngle`)
- Pattern observé : snap par défaut à 30°, désactivé via Ctrl.
- Kendraw adaptation inspirée : Kendraw privilégie 15° par défaut (plus proche de ChemDraw) et bascule la modifier sur **Shift=libre** (15° couvre déjà 30° par nature). `fracAngle` est ré-implémenté from scratch en utilitaire pur dans `canvas-new/interactions/snapAngle.ts`.

### Files to touch

- `packages/ui/src/canvas-new/interactions/snapAngle.ts` (créé)
- `packages/ui/src/canvas-new/tools/BondTool.ts` (consommation du snap)
- `packages/ui/src/StatusBar.tsx` (affichage du pas actif)
- `packages/ui/src/workspace-store.ts` (persistance du pas dans toolState)
- `packages/ui/src/__tests__/angle-snap.test.ts` (étendre, le fichier existe déjà pour 30°)

### Tests required

- Unit : `snapAngle.test.ts` couvre les 24 angles multiples de 15°, les frontières d'hystérésis, Shift=libre, et le toggle 15°/30°.
- E2E Playwright : `canvas-new-bond-snap.spec.ts` active BondTool, drag depuis un atome, vérifie que la liaison finale est alignée à 60° ; test séparé avec Shift maintenu vérifie qu'un angle arbitraire est conservé.
- Regression : le fichier `angle-snap.test.ts` existant passe toujours dans l'ancien canvas (Ctrl+E toggle 30°).

### Risks

- Changement de comportement par défaut : des utilisateurs habitués à 30° peuvent être surpris. Mitigation : note dans le changelog, StatusBar explicite, toggle clavier.
- Hystérésis mal dosée → micro-sauts inconfortables. Mitigation : marge de 0.5° en entrée/sortie de slot.

### Effort

S

### Kendraw features to preserve

- Le raccourci `Ctrl+E` reste assigné au toggle de snap — on ne change pas la combinaison, seulement les valeurs togglées.
- Les tests d'angle existants restent des référentiels et sont étendus, pas remplacés.

### Priority + rank

P0 — rank 5/8 (gain ergonomique immédiat, effort faible)

---

## Story W4-R-06 — Sélection rectangle marquee

**As a** chimiste qui veut manipuler une portion d'une molécule (ex. un groupe fonctionnel)
**I want** tracer un rectangle de sélection à la souris pour sélectionner atomes, liaisons, flèches, annotations inclus
**So that** je n'ai plus besoin de cliquer un à un ni de passer par un flood-select qui prend tout le fragment

### Acceptance Criteria

- [ ] AC1 — Un nouvel outil SelectMarqueeTool est disponible depuis la toolbox gauche, raccourci clavier `V` (à valider non-conflit dans `group-label-hotkeys`).
- [ ] AC2 — Sur mousedown dans une zone vide, le SelectMarqueeTool démarre un rectangle de sélection ; sur mousemove, le rectangle se redimensionne en suivant le curseur ; sur mouseup, tous les atomes/liaisons/flèches/annotations dont la bounding box intersecte le rectangle passent en sélection.
- [ ] AC3 — Le rectangle est visuellement rendu avec un contour en pointillé et un remplissage très léger (alpha 0.1) dans la couleur primaire Kendraw.
- [ ] AC4 — Shift+drag **ajoute** à la sélection existante sans la vider.
- [ ] AC5 — Ctrl+drag **toggle** chaque item touché par le rectangle (ajoute si absent, retire si présent).
- [ ] AC6 — Un mousedown sur un item existant bascule automatiquement en mode click-select (pas de marquee — on ne sélectionne qu'un item) ; le marquee ne démarre que sur fond vide.
- [ ] AC7 — La sélection est persistée dans le store via `selection: { atoms: Set, bonds: Set, arrows: Set, annotations: Set }` en un seul snapshot d'historique.
- [ ] AC8 — Esc pendant le drag annule le rectangle sans modifier la sélection préalable.

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/tools/select/SelectBase.ts`
- Pattern observé : rectangle + lasso partagent le SelectBase, avec une phase « test pour chaque item si inside » sur mouseup ; shift/ctrl modificateurs en début de phase.
- Kendraw adaptation inspirée : on commence par le marquee seul (lasso parké en P1). `selection-hit-test.ts` fait le test inclusion bounding box ; lasso viendra réutiliser la même API avec un polygone au lieu d'un rectangle.

### Files to touch

- `packages/ui/src/canvas-new/tools/SelectMarqueeTool.ts` (créé)
- `packages/ui/src/canvas-new/interactions/selectionHitTest.ts` (créé)
- `packages/ui/src/canvas-new/render/selectionOverlay.ts` (créé — rendu du rectangle et des items sélectionnés)
- `packages/ui/src/ToolPalette.tsx` (ajout du bouton, icône, tooltip)
- `packages/ui/src/group-label-hotkeys.ts` (raccourci `V`)

### Tests required

- Unit : `selectionHitTest.test.ts` couvre rectangle vide, rectangle couvrant tout, intersection partielle, shift/ctrl.
- E2E Playwright : `canvas-new-marquee.spec.ts` charge une molécule de 6 atomes, trace un rectangle englobant 3 atomes, vérifie `selection.atoms.size === 3` ; test séparé pour Shift+marquee (ajout), Ctrl+marquee (toggle), Esc (cancel).
- Regression : flood-select existant via double-clic continue de fonctionner sur les deux canvas.

### Risks

- Conflit avec l'outil pan (Space+drag) si mal géré. Mitigation : `SelectMarqueeTool` ne démarre jamais si la touche Space est tenue.
- Raccourci `V` peut entrer en conflit avec coller `Ctrl+V`. Mitigation : le listener ignore les events avec `ctrlKey` ou `metaKey`.

### Effort

M

### Kendraw features to preserve

- Flood-select existant (double-clic) reste intouché — ce sont deux gestes complémentaires.
- Le panneau de propriétés affiche correctement les propriétés agrégées d'une multi-sélection (déjà géré côté `PropertyPanel.tsx`).

### Priority + rank

P0 — rank 6/8 (pré-requis de R-07 drag de sélection)

---

## Story W4-R-07 — Drag déplacement de sélection avec snap live et undo atomique

**As a** chimiste qui a sélectionné un fragment et veut le repositionner sans écraser sa topologie
**I want** pouvoir draguer la sélection à la souris, voir un snap grid/anchor pendant le drag, et obtenir un unique snapshot undo à la fin
**So that** je réorganise ma structure proprement, je peux revenir en arrière d'un seul Ctrl+Z, et je ne pollue pas mon historique de pas intermédiaires

### Acceptance Criteria

- [ ] AC1 — Un mousedown sur un item faisant partie de la sélection courante démarre un drag-move de toute la sélection ; un mousedown sur un item hors sélection bascule la sélection vers ce seul item puis démarre le drag.
- [ ] AC2 — Pendant le drag, tous les atomes sélectionnés sont translatés visuellement (preview, pas encore dans le store) ; les liaisons attachées suivent même si seul un de leurs atomes est sélectionné.
- [ ] AC3 — Le snap grid existant (`grid-snap.test.ts`) est appliqué live pendant le drag — le curseur montre la position snappée, pas la position brute.
- [ ] AC4 — Le snap anchor existant (`anchor-snap.test.ts`) continue de fonctionner : quand un atome draggé s'approche d'un autre atome à distance < seuil, il se merge visuellement (halo d'indication).
- [ ] AC5 — Sur mouseup, **une seule** action store est commitée avec un **unique** snapshot d'historique représentant la translation totale.
- [ ] AC6 — Esc pendant le drag annule la translation et restaure la position de départ sans créer de snapshot.
- [ ] AC7 — Si un merge anchor est actif au mouseup, la fusion atomes produit aussi un unique snapshot avec l'opération combinée move+merge.
- [ ] AC8 — Les performances tiennent 60 fps pendant le drag sur une sélection de 50 atomes (mesuré Performance API).

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/tools/select/SelectBase.ts` (phase `mousemove`) et `Command.ts`
- Pattern observé : pendant le drag, Ketcher applique des transformations temporaires visuelles ; à mouseup, une Command réversible est poussée sur l'histoire.
- Kendraw adaptation inspirée : on n'importe pas Command pattern (section 11.5 de l'analyse — on reste sur snapshots Immer FIFO). On isole la translation visuelle dans `dragMovePreview` et on commit une seule mutation `translateSelection(dx, dy)` sur le store à mouseup.

### Files to touch

- `packages/ui/src/canvas-new/tools/SelectMarqueeTool.ts` (étendu — gère aussi le drag-move)
- `packages/ui/src/canvas-new/interactions/dragMove.ts` (créé)
- `packages/ui/src/canvas-new/render/dragPreviewLayer.ts` (créé)
- `packages/ui/src/workspace-store.ts` (action `translateSelection(dx, dy, mergeInfo?)`)
- `packages/ui/src/anchor-snap.ts` (réutilisé tel quel)

### Tests required

- Unit : `dragMove.test.ts` couvre translation pure, translation + merge, cancel Esc, snap grid, snap anchor.
- E2E Playwright : `canvas-new-drag-move.spec.ts` sélectionne 3 atomes via marquee, drague, vérifie translation + une seule entrée dans l'historique ; test séparé pour Esc cancel ; test séparé pour merge.
- Regression : tests anchor-snap et grid-snap existants passent dans le nouveau canvas.

### Risks

- Commit multi-snapshot si on confond preview et store. Mitigation : un seul `store.translateSelection()` en fin de mouseup, preview purement visuel.
- Performance sur grosse sélection. Mitigation : recalcul bounding box incrémental, pas O(n) full à chaque frame.
- Fusion anchor + multi-sélection : cas d'interaction complexe. Mitigation : AC7 dédié avec test E2E explicite.

### Effort

L

### Kendraw features to preserve

- Les modules `anchor-snap.ts` et grid snap existants sont des dépendances intouchées, juste consommées par `dragMove.ts`.
- L'historique FIFO 200 snapshots conserve son budget — on ne stacke pas de snapshots intermédiaires.

### Priority + rank

P0 — rank 7/8 (story la plus lourde, dépend de R-06)

---

## Story W4-R-08 — Touche `/` pour mini-panneau de propriétés au survol

**As a** chimiste qui veut éditer rapidement une charge ou un isotope sans quitter le clavier
**I want** presser `/` pendant que je survole un atome ou un bond pour ouvrir un mini-panneau d'édition rapide
**So that** je garde le flux de dessin sans basculer vers le panneau de propriétés de droite

### Acceptance Criteria

- [ ] AC1 — Presser `/` (sans modifier) alors qu'un atome est survolé ouvre un popover positionné près du curseur avec les champs : élément (autocomplete), charge, isotope, radicaux, hydrogènes explicites.
- [ ] AC2 — Presser `/` alors qu'un bond est survolé ouvre un popover avec les champs : ordre, type stéréo (plain/wedge/hash/double cis/trans), topologie (chain/ring).
- [ ] AC3 — Presser `/` alors que rien n'est survolé n'ouvre rien et n'émet pas d'erreur console.
- [ ] AC4 — Le popover se ferme sur Enter (commit), Esc (cancel), ou clic en dehors ; Enter pousse un unique snapshot d'historique.
- [ ] AC5 — Le popover est navigable au clavier : Tab entre les champs, Enter commit, Esc annule, flèches pour les select.
- [ ] AC6 — Le popover ne masque jamais l'atome ou le bond édité : positionnement automatique au-dessus, en-dessous ou à côté selon la place disponible.
- [ ] AC7 — Le raccourci `/` est désactivé lorsque le focus est dans un champ texte (ImportDialog, annotations) pour ne pas casser la frappe.
- [ ] AC8 — Un test E2E vérifie le cycle complet : survol atome, `/`, changer charge à +1, Enter, vérification store + undo Ctrl+Z rétablit charge 0.

### Ketcher reference

- Fichier étudié : `/tmp/ketcher-reference/packages/ketcher-react/src/script/ui/action/hotkeys.ts` (mapping `/` → dialog hover)
- Pattern observé : raccourci contextuel qui ouvre un dialog sur l'item survolé, commit en un snapshot à la fermeture.
- Kendraw adaptation inspirée : on réutilise les composants d'édition déjà présents dans `PropertyPanel.tsx` (champs charge/isotope/ordre) via des sous-composants extraits. Positionnement via `@floating-ui/react` si la dépendance est déjà présente, sinon calcul manuel.

### Files to touch

- `packages/ui/src/canvas-new/interactions/quickEditPopover.tsx` (créé)
- `packages/ui/src/canvas-new/interactions/useQuickEditHotkey.ts` (créé — écoute `/`)
- `packages/ui/src/PropertyPanel.tsx` (extraction de sous-composants réutilisables, sans régression du panneau droit)
- `packages/ui/src/hooks/useIsEditingText.ts` (réutilisé pour gating clavier)
- `packages/ui/src/workspace-store.ts` (action `updateAtomProps`, `updateBondProps` si absentes)

### Tests required

- Unit : `quickEditPopover.test.tsx` rend le popover, simule input, vérifie commit ; `useQuickEditHotkey.test.ts` vérifie le gating (ignore si text field focus, ignore si rien de survolé).
- E2E Playwright : `canvas-new-quick-edit.spec.ts` charge benzène, survol d'un carbone, `/`, charge à +1, Enter, vérifie store, Ctrl+Z, vérifie rétabli.
- Regression : `shortcut-filter.test.ts` et `hotkey-gating.test.ts` existants passent toujours.

### Risks

- Conflit avec raccourcis navigateur (Firefox : `/` ouvre la recherche rapide). Mitigation : `preventDefault` systématique quand un item est survolé dans le canvas.
- Extraction de sous-composants de PropertyPanel : risque de régression du panneau droit. Mitigation : PropertyPanel importe les sous-composants extraits sans changer son rendu, tests visuels avant/après.

### Effort

S

### Kendraw features to preserve

- Le panneau de propriétés de droite (`PropertyPanel.tsx`) reste le lieu de référence pour l'édition avancée (InChI, SMILES, MW, LogP, tPSA, Lipinski) ; le quick-edit est un raccourci pour les champs essentiels seulement.
- Les raccourcis existants qui utilisent des touches alphanumériques (C/N/O/etc.) ne sont pas impactés.

### Priority + rank

P0 — rank 8/8 (polish final, effort faible, impact fort)

---

## Priority Matrix

| # | Story | Ketcher ref | Effort | Rank | Impact |
|---|---|---|---|---|---|
| 1 | W4-R-01 Feature flag + squelette canvas-new | `packages/ketcher-react/src/Editor.tsx` | S | 1 | Fondation — sans ça rien d'autre ne démarre en sécurité |
| 2 | W4-R-02 Tool abstraction `{mousedown,mousemove,mouseup,cancel}` | `ketcher-core/src/application/editor/tools/Base.ts` | M | 2 | Socle technique qui rend R-04/05/06/07/08 possibles ; réduit `Canvas.tsx` de 1729 à <400 lignes |
| 3 | W4-R-03 Rendu Canvas 2D partagé | `ketcher-core/src/application/render/restruct/restruct.ts` | S | 3 | Parité visuelle garantie, confiance de bascule pour les utilisateurs |
| 4 | W4-R-04 HoverIcon atome + bond | `ketcher-react/src/script/editor/Editor.ts`, `tools/atom.ts` | M | 4 | Signature UX Wave-4 — « ça marche comme Ketcher » |
| 5 | W4-R-05 Snap 15° par défaut Shift=libre | `ketcher-core/src/application/editor/shared/utils.ts` | S | 5 | Gain ergo immédiat, dessin de chaînes/cycles fluide |
| 6 | W4-R-06 Sélection rectangle marquee | `ketcher-core/src/application/editor/tools/select/SelectBase.ts` | M | 6 | Débloque la manipulation de groupes sans flood-select |
| 7 | W4-R-07 Drag sélection + snap live + undo atomique | `ketcher-core/src/application/editor/tools/select/SelectBase.ts` + `Command.ts` | L | 7 | Pièce la plus complexe, requise pour repositionner des fragments proprement |
| 8 | W4-R-08 Touche `/` mini-panneau quick-edit | `ketcher-react/src/script/ui/action/hotkeys.ts` | S | 8 | Polish clavier-first, accélère l'édition des charges/isotopes |

---

## Notes transverses

### Features Kendraw à préserver systématiquement (rappel section 10 de l'analyse)

- `packages/nmr/` entier (DEPT, multiplets, overlay, intégration, solvants, confidence, highlighting).
- `packages/ui/src/PropertyPanel.tsx` (MW, LogP, tPSA, Lipinski, InChI, SMILES).
- `packages/api-client/` (client FastAPI vers `/api/v1/compute/*`).
- `packages/io/` : CDXML parser/writer, MOL V2000, SMILES, KDX, JCAMP-DX.
- `packages/constraints/` (valence et règles chimiques).
- `packages/persistence/` (audit trail hash-chain, record lock, ESig).
- `packages/io/src/pubchem/`, scripts Traefik/Docker, backend Python entier, `scripts/full-check.sh`, CI GitHub Actions.

### Coexistence ancien/nouveau canvas

Les 8 stories s'exécutent **derrière** le feature flag `VITE_ENABLE_NEW_CANVAS` (par défaut `false`). Les deux canvas partagent le **même** `SceneStore` — zéro migration, bascule sans perte. Le flag ne passe à `true` par défaut qu'après validation pleine des 8 AC-sets via la suite E2E.

### Ce qui est hors scope Wave-4 Redraw (rappel)

Parké dans `docs/deferred-work-wave-4.md` pour Wave-5 ou plus tard :

- Lasso de sélection (P0-03 partiel — le marquee suffit pour la Wave).
- Rotate handle et flip H/V sur sélection (P1-05, P1-06).
- Sous-menus responsive collapse (P1-01).
- `<kbd>` inline (P1-02).
- Fusion de cycles in-place (P1-03).
- Groupes expansibles Ph/Me/Boc (P1-04, partiellement amorcé Wave-3).
- Règles hydrogènes implicites Ketcher-like (P1-07).
- Copie MOL/KET/image via Ctrl+Shift+M/K/F (P1-08).
- Toggle aromaticité cercle (P2-01), fragments explicites (P2-02), library picker (P2-03), deselect Ctrl+Shift+A (P2-04), Shift+Tab cycle sélection (remplacé par V/L/F — 11.10 de l'analyse).
- OCR, R-groups complexes, polymer editor, 3D viewer, collaboration temps réel (P3-01→05).

### Rappels cadrage

- **Clean-room** : aucun fichier sous `/tmp/ketcher-reference/` n'est copié ou dérivé textuellement. Les stories mentionnent les fichiers Ketcher uniquement comme **référence conceptuelle** ; l'implémentation Kendraw est rédigée from scratch par l'équipe.
- **Licences** : Ketcher est Apache 2.0 ; même si la copie serait légalement possible, on préserve une identité visuelle et technique Kendraw propre (icônes Lucide + textuelles, Zustand + Immer, Canvas 2D natif — section 11 de l'analyse).
- **CI** : chaque story ajoute ses tests à la suite existante ; les 6 checks (eslint, tsc, vitest, ruff, mypy, pytest) plus Playwright E2E restent obligatoires avant push, par règle `CLAUDE.md`.

### Séquence d'exécution recommandée

La dépendance technique impose la séquence suivante (aucun parallélisme possible sur les 3 premières stories) :

1. R-01 (fondation).
2. R-02 (socle tool abstraction) en parallèle possible avec R-03 (rendu partagé).
3. R-04 dès que R-02 et R-03 sont mergées.
4. R-05 en parallèle de R-04 (dépend seulement de R-02).
5. R-06 après R-02.
6. R-07 strictement après R-06.
7. R-08 après R-04 (dépend du hover pour cibler l'item).

Cette séquence minimise les merges conflictuels et garde `main` stable pendant toute la Wave.

---

## Grille de Definition of Done (DoD) partagée

Chaque story W4-R-XX n'est considérée « done » que si l'intégralité des critères suivants est vérifiée. Rien n'est merged sans cocher la grille entière. L'ordre des vérifications est volontaire : on commence par le code, on finit par la comm.

- [ ] Tous les AC de la story sont implémentés et vérifiables à l'œil nu par le reviewer.
- [ ] `pnpm lint` retourne zéro erreur (et zéro warning nouveau introduit par la story).
- [ ] `pnpm typecheck` retourne zéro erreur.
- [ ] `pnpm test` passe à 100 % sur le sous-ensemble impacté.
- [ ] `cd backend && uv run ruff check .` retourne zéro erreur (si la story touche au backend — peu probable dans cette Wave, mais le check reste obligatoire).
- [ ] `cd backend && uv run ruff format --check .` retourne zéro reformat.
- [ ] `cd backend && uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/` retourne zéro erreur.
- [ ] `cd backend && uv run pytest -v` retourne zéro failure.
- [ ] `pnpm test:e2e` passe, y compris les nouveaux spec Playwright ajoutés par la story.
- [ ] Le feature flag `VITE_ENABLE_NEW_CANVAS=false` laisse l'ancien canvas fonctionner sans régression visible.
- [ ] Le feature flag `VITE_ENABLE_NEW_CANVAS=true` charge le nouveau canvas et les AC de la story sont vérifiables.
- [ ] La story mentionne ses fichiers Ketcher de référence uniquement en commentaire de PR — aucun fichier source sous `/tmp/ketcher-reference/` n'est importé, copié, ou adapté textuellement.
- [ ] Le CHANGELOG interne (ou les notes de release Wave-4) mentionne la story dans une entrée dédiée.
- [ ] La PR GitHub est revue par au moins un deuxième développeur avant merge sur `main`.

## Backlog de risques transverses Wave-4

Les risques spécifiques aux stories sont consignés dans chaque carte. Les risques transverses ci-dessous s'appliquent à l'ensemble de la Wave et appellent une veille continue du Product Manager et du Tech Lead.

### Risque T-01 : divergence de rendu entre ancien et nouveau canvas

Si le nouveau canvas diverge même de quelques pixels, la confiance dans la bascule s'effondre. Mitigation : R-03 impose un test Playwright screenshot-compare pixel à pixel ; toute PR qui casse ce test est bloquée. Escalade : si le test est instable, on freeze les changements Wave-4 jusqu'à stabilisation du diff.

### Risque T-02 : explosion de la taille de `CanvasNew.tsx`

Le vrai piège est de recréer un monolithe de 1729 lignes sous un autre nom. Mitigation : l'AC4 de R-02 fixe une borne dure à 400 lignes pour `CanvasNew.tsx` ; le reviewer refuse le merge si la borne est franchie. Tout dépassement est un signal d'alerte architectural.

### Risque T-03 : régression silencieuse des raccourcis clavier

Kendraw a déjà 30+ raccourcis ; ajouter `V` (marquee) et `/` (quick-edit) peut collisionner silencieusement. Mitigation : les stories R-06 et R-08 ajoutent leurs checks au fichier `group-label-hotkeys.test.ts` existant ; une revue manuelle de la cheatsheet `ShortcutCheatsheet.tsx` est requise avant fin de Wave.

### Risque T-04 : dérive du scope vers les P1

À chaque story P0, la tentation de « pendant qu'on y est, ajoutons le rotate handle » va se présenter. Mitigation : le Product Manager refuse tout PR qui inclut des P1 déguisés ; le fichier `deferred-work-wave-4.md` est la soupape. Aucune exception.

### Risque T-05 : friction CI sur les 6 checks + E2E

Ajouter des E2E par story alourdit le temps de CI. Mitigation : on parallélise les jobs dans `.github/workflows/e2e.yml` ; si le temps total dépasse 15 minutes, on découpe la matrice par canvas (`old` / `new`) pour ne pas doubler inutilement.

### Risque T-06 : coexistence des deux canvas et confusion utilisateur

Un utilisateur qui toggle le flag en plein milieu de son travail peut perdre la sélection courante (elle est dans le store mais rendue différemment). Mitigation : changelog explicite ; la bascule du flag nécessite un reload de l'app ; dans la documentation de la Wave, on précise que le flag est un outil développeur, pas un toggle utilisateur final.

## Métriques de succès Wave-4 Redraw

Au-delà des AC individuels, la Wave est un succès si les métriques ci-dessous sont toutes au vert à la fin des 8 stories. Ces métriques constituent le « gate » d'activation du flag par défaut (passer `VITE_ENABLE_NEW_CANVAS` à `true` dans `.env.example`).

| Métrique | Cible | Méthode de mesure |
|---|---|---|
| Temps moyen pour dessiner benzène (6 atomes + 6 bonds) | Sous les 12 secondes (contre 20 s aujourd'hui) | Session utilisateur enregistrée + chronomètre manuel sur 5 chimistes internes |
| FPS médian pendant drag-move 50 atomes | Au moins 55 fps | Playwright + Performance.now() sur le test de R-07 |
| FPS médian pendant hover preview sur 100 atomes | Au moins 58 fps | Playwright + Performance.now() sur le test de R-04 |
| Taille du fichier `CanvasNew.tsx` | Sous les 400 lignes | `wc -l` en CI |
| Nombre de stories non mergées à la fin de la Wave | 0 sur 8 | GitHub Projects |
| Nombre de tests E2E Playwright ajoutés | Au moins 8 (un par story minimum) | CI `e2e.yml` |
| Couverture unitaire des modules `canvas-new/` | Au moins 85 % | Vitest coverage |
| Diff screenshot ancien vs nouveau canvas sur molécule de référence | 0 pixel | Playwright screenshot-compare |

Si une seule métrique manque à la fin de la Wave, on ne bascule pas le flag ; on ouvre une Wave-4.1 ciblée sur le delta.

## Questions ouvertes pour le sprint planning

Le Product Manager inscrit ici les questions qui devront être tranchées en sprint planning avant démarrage. Chaque question a un owner pressenti pour la réponse.

1. **Owner : Tech Lead.** `@floating-ui/react` est-il déjà dépendance du projet ? Si non, on l'ajoute pour R-08 ou on calcule la position manuellement ? Impact : effort R-08 S → M si ajout.
2. **Owner : UX Designer.** Le halo CPK sur atome survolé (AC2 de R-04) doit-il remplir l'atome ou seulement l'entourer ? Décision visuelle à figer avant R-04.
3. **Owner : Chimiste référent.** Confirme-t-on le pas 15° par défaut (vs 30° actuel) ? Risque d'un retour utilisateur ; un bref sondage auprès des 5 chimistes internes serait utile avant R-05.
4. **Owner : Product Manager.** Le raccourci `V` pour marquee entre-t-il en conflit avec un workflow existant ? Lecture croisée avec `keyboard-shortcuts-compliance.md`.
5. **Owner : QA Lead.** Le baseline screenshot pour le test de parité R-03 vit-il dans le repo ou dans un stockage externe Playwright ? Décision à figer pour éviter un repo gonflé par les PNG.
6. **Owner : Tech Lead.** Le `SceneStore` expose-t-il déjà une action unitaire `translateSelection(dx, dy, mergeInfo)` ou faut-il l'ajouter (sous-scope de R-07) ? Audit rapide du store requis.
7. **Owner : Product Manager.** Communique-t-on le feature flag aux beta-testeurs externes, ou reste-t-il strictement interne pendant la Wave ? Position par défaut : interne uniquement.

Les réponses consignées à l'issue du planning seront ajoutées en annexe de ce document.

---

**Fin du backlog Wave-4 Redraw.** Prêt pour review PO / Tech Lead, découpe en tickets Jira, et lancement du sprint planning.
