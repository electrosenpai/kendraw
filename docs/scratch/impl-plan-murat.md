# Plan de test Wave-4 Redraw — Murat, Master Test Architect

> Risk-based, strong opinions weakly held. Pyramide : **unit > integration > E2E**.
> Flakiness = dette critique. Tout test instable est désactivé sous 24 h et fixé
> sous 72 h ou retiré.

---

## 0. Mise en bouche — pourquoi ce document existe

Cette wave refond le cœur interactif de Kendraw (les 1729 lignes de
`Canvas.tsx` deviennent `<400` lignes orchestrées par un tool pattern
Ketcher-like). Un refactor de cette ampleur **casse tout ou ne casse
rien** : il n'y a pas d'intermédiaire. La discipline de test est donc le
seul filet anti-régression. Deux axes structurent la stratégie :

1. **Baseline intangible** — les ~500 tests unitaires front, les ~242
   tests back et les ~25 E2E actuels doivent rester verts en permanence,
   feature flag `newCanvas=false`. Zéro test touché, zéro assertion
   affaiblie. Si la moindre ligne de ces tests bouge, le reviewer pose
   une question publique sur le pourquoi.
2. **Suite parallèle `@canvas-new`** — nouvelle arborescence de tests
   tagguée qui ne s'exécute qu'avec `VITE_ENABLE_NEW_CANVAS=true`. Elle
   grandit story après story et atteint la parité fonctionnelle avant
   que le flag ne bascule par défaut.

On ajoute un troisième axe moins traditionnel mais ici indispensable :

3. **Tests de régression visuelle Playwright** via `toHaveScreenshot`.
   On captures des molécules de référence rendues dans le NOUVEAU canvas
   et on compare au baseline produit par l'ANCIEN canvas (après calibrage
   initial). Tolérance : `maxDiffPixelRatio: 0.01` (1 % des pixels).
   Au-delà, échec bloquant.

---

## 1. Stratégie de test pour le refactor canvas

### 1.1 Principes directeurs

- **Pyramide respectée** : 70 % unit, 20 % integration, 10 % E2E. Le coût
  de maintenance E2E est élevé ; on ne les réserve qu'aux flux
  utilisateur irréductibles.
- **Double exécution** : chaque job CI tourne deux fois les tests
  frontaux — une fois `VITE_ENABLE_NEW_CANVAS=false` (baseline), une
  fois `VITE_ENABLE_NEW_CANVAS=true` (suite `@canvas-new`). Les suites
  back (pytest) ne se dédoublent pas : elles ne dépendent pas du
  canvas.
- **Tags Vitest/Playwright** : `describe('... @canvas-new', ...)` ou
  `test.describe.configure({ tag: '@canvas-new' })`. Le runner filtre
  via `--grep @canvas-new` ou `--grep-invert @canvas-new`.
- **Aucune condition `if (FEATURE_FLAGS.newCanvas)` dans un test existant**.
  Un test legacy qui devient sensible au flag est un signe qu'on a
  couplé l'ancien canvas à la nouvelle logique — à corriger côté
  production, pas côté test.
- **Les tests unitaires ne touchent jamais le DOM `<canvas>` réel**.
  On injecte un `MockCanvasRenderingContext2D` (jsdom ne fournit qu'un
  stub, on l'étoffe) ou on abstrait le rendu via `renderer-canvas`
  dont les fonctions pures sont déjà testables hors DOM.

### 1.2 Arborescence de tests proposée

```
packages/ui/src/
  __tests__/                     # tests legacy, intouchés
  canvas-new/
    __tests__/
      CanvasNew.test.tsx         # smoke render
      ToolRouter.test.ts         # switch tool, cancel sortant
      tools/
        AtomTool.test.ts         # @canvas-new
        BondTool.test.ts         # @canvas-new
        EraserTool.test.ts       # @canvas-new
        SelectMarqueeTool.test.ts
        DragMoveTool.test.ts
      hover/
        HoverIconAtom.test.ts
        HoverIconBond.test.ts
        HoverHitTest.test.ts
      snap/
        angle-snap.test.ts       # 15° / Shift libre
        angle-snap-hysteresis.test.ts
      quick-edit/
        QuickEditPopover.test.tsx
        slash-hotkey.test.ts
    tools/                        # sous test (code prod)
      Tool.ts
      AtomTool.ts
      ...

e2e/
  regression/                     # legacy, flag=false
  canvas-new/                     # nouveau, flag=true
    flag-boot.spec.ts
    hover-preview.spec.ts
    angle-snap.spec.ts
    marquee-select.spec.ts
    drag-move.spec.ts
    slash-quick-edit.spec.ts
    visual/
      benzene.spec.ts
      cholesterol.spec.ts
      ...
```

### 1.3 Workflow CI

```yaml
jobs:
  unit-legacy:
    - pnpm test --grep-invert @canvas-new   # baseline
  unit-canvas-new:
    - VITE_ENABLE_NEW_CANVAS=true pnpm test --grep @canvas-new
  backend:
    - cd backend && uv run pytest -v
  e2e-legacy:
    - pnpm test:e2e --grep-invert @canvas-new
  e2e-canvas-new:
    - VITE_ENABLE_NEW_CANVAS=true pnpm test:e2e --grep @canvas-new
  visual-regression:
    - VITE_ENABLE_NEW_CANVAS=true pnpm test:e2e:visual
```

Les six jobs sont **tous bloquants** pour un merge sur `main`. Pas
d'exception, pas de `continue-on-error`.

### 1.4 Régression visuelle — méthode

1. **Phase de calibrage (sprint 0 de la wave)** : faire tourner l'ancien
   canvas sur la liste de molécules baseline (§4) et capturer les PNG
   en `e2e/canvas-new/visual/__baseline__/*.png`. Ces captures deviennent
   la source de vérité.
2. **Phase de vérification (toutes les sprints suivantes)** : chaque PR
   qui touche `canvas-new/` exécute la suite visuelle en mode
   `VITE_ENABLE_NEW_CANVAS=true` et compare aux baselines.
3. **Tolérance** : `maxDiffPixelRatio: 0.01`, `threshold: 0.2` (par pixel
   LAB distance). Justification : le ré-écriture peut produire des
   anti-aliasing légèrement différents sans que la molécule change.
4. **Regen des baselines** : uniquement par commit dédié, revue deux
   paires d'yeux, et l'auteur doit justifier en commit body le delta
   pixel par molécule.

---

## 2. Matrice de test par story

Notation : **U** = unit, **I** = integration, **E** = E2E Playwright,
**V** = visual regression, **NMR/Props** = régression checks fonctions
adjacentes.

### W4-R-01 — Feature flag + squelette `canvas-new`

| Type | Couverture | Fichier / emplacement |
|---|---|---|
| U | `FEATURE_FLAGS.newCanvas` lit `VITE_ENABLE_NEW_CANVAS`, défaut `false`, coercion booléenne robuste (`"true"` / `"1"` / `""`). | `packages/ui/src/__tests__/feature-flags.test.ts` |
| U | `CanvasNew` stub render sans crash avec props minimales. | `packages/ui/src/canvas-new/__tests__/CanvasNew.test.tsx` |
| I | `App.tsx` monte `<Canvas>` si flag=false, `<CanvasNew>` si flag=true, sans re-mount inutile si le flag ne change pas. | `packages/ui/src/__tests__/App.integration.test.tsx` |
| E | `flag-boot.spec.ts` : app démarre avec `VITE_ENABLE_NEW_CANVAS=true`, page charge, zéro erreur console, marqueur `data-canvas-variant="new"` présent. | `e2e/canvas-new/flag-boot.spec.ts` |
| V | Non. (Le stub est textuel, pas de visuel.) | — |
| NMR/Props | **Oui** — le panel NMR doit continuer à s'ouvrir et à prédire. Test E2E `nmr-still-works.spec.ts` tagué `@canvas-new`. | `e2e/canvas-new/nmr-still-works.spec.ts` |

### W4-R-02 — Tool abstraction `{mousedown, mousemove, mouseup, cancel}`

| Type | Couverture | Emplacement |
|---|---|---|
| U | Interface `Tool` respectée par les 3 outils de référence (compile-time via TypeScript + runtime duck-typing avec `expect.objectContaining`). | `canvas-new/__tests__/tools/tool-contract.test.ts` |
| U | `ToolRouter` appelle `cancel()` sur l'outil sortant lors d'un switch. Test : spy sur `cancel`, change `toolState.selectedTool`, assert `cancel` called once. | `canvas-new/__tests__/ToolRouter.test.ts` |
| U | Esc global → appelle `cancel()` sur l'outil actif sans modifier le store. | idem |
| U | `AtomTool.mousedown + mouseup` sur zone vide ajoute un atome au store (single history snapshot). Contre-épreuve : `mousemove` seul n'ajoute rien. | `canvas-new/__tests__/tools/AtomTool.test.ts` |
| U | `BondTool.mousedown` sur atome A + `mouseup` sur atome B crée un bond A-B, 1 snapshot. | `canvas-new/__tests__/tools/BondTool.test.ts` |
| U | `EraserTool.mousedown` sur atome → suppression + 1 snapshot ; sur zone vide → no-op. | `canvas-new/__tests__/tools/EraserTool.test.ts` |
| U | `CanvasNew.tsx` fait ≤ 400 lignes (metric test qui échoue si la limite est franchie). | `canvas-new/__tests__/size-budget.test.ts` |
| I | Pas d'integration spécifique ici. | — |
| E | `tool-switch.spec.ts` : sélectionner outil bond, commencer un drag, switcher vers outil atom en appuyant `A`, vérifier que le bond preview disparaît. | `e2e/canvas-new/tool-switch.spec.ts` |
| V | Non. | — |
| NMR/Props | Non applicable directement, couvert par `nmr-still-works`. | — |

### W4-R-03 — Rendu Canvas 2D partagé

| Type | Couverture | Emplacement |
|---|---|---|
| U | `CanvasNew` appelle `render(doc, ctx, camera, options)` exactement comme `Canvas` legacy (spy sur `renderer-canvas`). | `canvas-new/__tests__/render-wiring.test.ts` |
| U | DPR : si `window.devicePixelRatio=2`, le canvas interne a `width = cssWidth * 2`. | `canvas-new/__tests__/dpr.test.ts` |
| U | Throttle 60 fps : 100 `store.notify()` consécutifs provoquent au plus 60 `render` calls/sec (faux timer). | `canvas-new/__tests__/raf-throttle.test.ts` |
| I | **Zéro fichier modifié dans `packages/renderer-canvas/`** — test CI qui fail si `git diff origin/main -- packages/renderer-canvas/` est non vide. | `scripts/check-renderer-untouched.sh` |
| E | `render-parity.spec.ts` : charger benzène + OH dans les deux modes flag=false/true, comparer screenshot → identique à 1 pixel près. | `e2e/canvas-new/render-parity.spec.ts` |
| V | **Oui, tous les baselines molecules** — voir §4. | `e2e/canvas-new/visual/*.spec.ts` |
| NMR/Props | Régression : ouvrir panel NMR puis Properties, aucun ne doit crash. | `e2e/canvas-new/panels-coexist.spec.ts` |

### W4-R-04 — HoverIcon atome + bond

| Type | Couverture | Emplacement |
|---|---|---|
| U | `HoverIconAtom` rend pastille CPK couleur N/O/C selon élément actif. | `canvas-new/__tests__/hover/HoverIconAtom.test.ts` |
| U | Halo sur atome existant quand hit-test retourne cet atome. | `canvas-new/__tests__/hover/HoverHitTest.test.ts` |
| U | Preview bond : `BondTool + mousemove` ne touche pas le store (`store.history.length` inchangé). | `canvas-new/__tests__/hover/no-store-write.test.ts` |
| U | Valence overload : survol C sp3 à 4 bonds avec outil bond → flag `overloadedValence=true` dans le preview state. | `canvas-new/__tests__/hover/valence-overload.test.ts` |
| U | Cleanup : `mouseleave`, `Esc`, `cancel()`, tool switch → `hoverPreview=null`. | `canvas-new/__tests__/hover/cleanup.test.ts` |
| I | HoverIcon + ToolRouter : `mousemove(10,10)` sur atome, puis switch tool → le preview est clear avant que le nouvel outil reçoive un `mousemove`. | `canvas-new/__tests__/hover/integration.test.ts` |
| E | `hover-preview.spec.ts` : déplacer la souris sur le canvas, vérifier que l'élément `[data-testid="hover-icon"]` apparaît en < 16 ms (mesure via `performance.now()`). | `e2e/canvas-new/hover-preview.spec.ts` |
| E | 60 fps sur molécule 100 atomes : mesure Performance API sur 1 s de mousemove continu, assert `fps >= 55`. | `e2e/canvas-new/hover-60fps.spec.ts` |
| V | **Oui** — snapshot hoverIcon sur atome C avec outil N actif. | `e2e/canvas-new/visual/hover-icon.spec.ts` |
| NMR/Props | Pas d'impact. | — |

### W4-R-05 — Angle snap 15° Shift=libre

| Type | Couverture | Emplacement |
|---|---|---|
| U | `snapAngle(rad, step=15°)` retourne le multiple de 15° le plus proche avec hysteresis 2°. | `canvas-new/__tests__/snap/angle-snap.test.ts` |
| U | Valeurs exactes à 0.001 rad : 15°, 30°, 45°, 60°, 90°, 180°. | idem |
| U | Hysteresis : angle 22° snappe à 15°, puis à 23° reste à 15°, à 24° bascule à 30°. | `angle-snap-hysteresis.test.ts` |
| U | `Shift=true` → retourne l'angle brut (no-op). | idem |
| U | Toggle Ctrl+E bascule `angleSnapStep` 15 ↔ 30. | `canvas-new/__tests__/snap/toggle-hotkey.test.ts` |
| I | `BondTool.mousemove` consomme `snapAngle` ; drag curseur à angle 23° produit preview à 15°. | `canvas-new/__tests__/tools/BondTool.snap.test.ts` |
| E | `angle-snap.spec.ts` : drag bond depuis origin vers (100,42) (~23° réel) → bond finalisé à exactement 15° (assert coords sur le store). | `e2e/canvas-new/angle-snap.spec.ts` |
| E | Shift maintenu pendant drag → angle libre. | idem |
| V | **Oui** — snapshot bond à 30° (référence visuelle « angle propre »). | `e2e/canvas-new/visual/bond-30deg.spec.ts` |
| NMR/Props | Pas d'impact. | — |

### W4-R-06 — Sélection rectangle marquee

| Type | Couverture | Emplacement |
|---|---|---|
| U | `SelectMarqueeTool.mousedown` sur zone vide → state `dragging=true`. | `canvas-new/__tests__/tools/SelectMarqueeTool.test.ts` |
| U | Hit-test rectangle : atome dont bbox intersecte le rect est sélectionné. Test avec 5 atomes, 3 dans, 2 dehors. | idem |
| U | Shift+drag ajoute ; Ctrl+drag toggle ; Alt+drag retire. 3 cases séparées. | idem |
| U | Mousedown sur item existant → pas de marquee, click-select simple. | idem |
| U | Esc pendant drag → annule, sélection pré-drag restaurée, **zéro snapshot**. | idem |
| U | Commit : 1 seul snapshot history avec tous les items. | idem |
| I | Marquee + drag-move (R-07) : après marquee, drag déplace tous les sélectionnés. | `canvas-new/__tests__/tools/marquee-then-move.test.ts` |
| E | `marquee-select.spec.ts` : dessiner benzène, drag rectangle englobant 3 atomes, vérifier sélection visuelle + `aria-live` annonce « 3 atomes, 3 liaisons sélectionnés ». | `e2e/canvas-new/marquee-select.spec.ts` |
| V | **Oui** — snapshot marquee en cours de drag + sélection confirmée. | `e2e/canvas-new/visual/marquee.spec.ts` |
| NMR/Props | Pas d'impact. | — |

### W4-R-07 — Drag déplacement + snap live + undo atomique

| Type | Couverture | Emplacement |
|---|---|---|
| U | `DragMoveTool.mousedown` sur item sélectionné → state `dragging=true`, pas de mutation store. | `canvas-new/__tests__/tools/DragMoveTool.test.ts` |
| U | `mousemove` : translation visuelle des atomes sélectionnés, bonds suivent, **store inchangé**. | idem |
| U | `mouseup` : **un seul** `store.dispatch` avec un `MoveAction` unique, 1 snapshot. | idem |
| U | Grid snap appliqué pendant drag (consomme `grid-snap.ts` existant). | `canvas-new/__tests__/tools/DragMoveTool.grid.test.ts` |
| U | Anchor snap : atome draggé à < seuil d'un autre → flag `mergeTarget=atomId`. | `canvas-new/__tests__/tools/DragMoveTool.anchor.test.ts` |
| U | Esc pendant drag → restaure positions départ, 0 snapshot. | idem |
| U | Merge au mouseup : 1 seul snapshot `move+merge` combiné. | idem |
| I | Sélection multi-items + drag + merge sur l'un d'entre eux : cas combiné, 1 snapshot. | `canvas-new/__tests__/tools/drag-merge.integration.test.ts` |
| E | `drag-move.spec.ts` : sélectionner benzène entier (Ctrl+A), drag 50 px droite, vérifier Ctrl+Z rétablit en **un seul** undo. | `e2e/canvas-new/drag-move.spec.ts` |
| E | 60 fps pendant drag sur 50 atomes : Performance API assert. | `e2e/canvas-new/drag-60fps.spec.ts` |
| V | **Oui** — snapshot avant drag / pendant drag / après drag. | `e2e/canvas-new/visual/drag-move.spec.ts` |
| NMR/Props | Régression : drag déplace la molécule, re-predict NMR doit fonctionner. | `e2e/canvas-new/nmr-after-drag.spec.ts` |

### W4-R-08 — Touche `/` quick-edit

| Type | Couverture | Emplacement |
|---|---|---|
| U | `/` pressé avec atome hoveré → popover ouvert, focus sur premier champ (element). | `canvas-new/__tests__/quick-edit/slash-hotkey.test.ts` |
| U | `/` pressé avec bond hoveré → popover champs ordre/stéréo/topologie. | idem |
| U | `/` pressé sans hover → no-op, pas d'erreur. | idem |
| U | `/` pressé avec focus dans un `<input>` (ImportDialog) → NE déclenche pas le popover. | `canvas-new/__tests__/quick-edit/focus-guard.test.ts` |
| U | `QuickEditPopover` : Enter commit + 1 snapshot ; Esc cancel + 0 snapshot ; click-outside = cancel. | `canvas-new/__tests__/quick-edit/QuickEditPopover.test.tsx` |
| U | Positionnement auto : popover jamais sur l'atome (calcul bbox + placement fallback top/bottom/left/right). | `canvas-new/__tests__/quick-edit/positioning.test.ts` |
| I | Navigation clavier : Tab entre champs, flèches sur select. | `canvas-new/__tests__/quick-edit/keyboard-nav.test.ts` |
| E | `slash-quick-edit.spec.ts` : hover atome C, `/`, change charge à +1, Enter, assert store ; Ctrl+Z → charge 0. | `e2e/canvas-new/slash-quick-edit.spec.ts` |
| V | **Oui** — snapshot popover ouvert sur atome + sur bond. | `e2e/canvas-new/visual/quick-edit-popover.spec.ts` |
| NMR/Props | Régression : changer un atome via popover re-trigger NMR prediction. | inclus dans E2E ci-dessus |

---

## 3. Release gate — critères de bascule `newCanvas=true` par défaut

Le flag reste `false` par défaut jusqu'à ce que **les 6 critères ci-dessous
soient simultanément verts sur 5 runs CI consécutifs**. Un seul rouge
réinitialise le compteur.

### Critère 1 — Baseline intangible (régression zéro, toujours)

- Les ~500 tests unitaires front (mesure exacte à instrumenter au début
  du sprint, `pnpm test --grep-invert @canvas-new --run --reporter=json`)
  passent 100 % en mode flag=false.
- Les ~242 tests backend (`cd backend && uv run pytest -v`) passent
  100 %.
- Les ~25 E2E legacy (`pnpm test:e2e --grep-invert @canvas-new`) passent
  100 %.
- **Toute régression isolée bloque le merge**, même si le test en cause
  est « flaky connu » : on le fixe, on ne le skippe pas.

### Critère 2 — Suite `@canvas-new` verte

- 100 % des tests taggués `@canvas-new` passent en mode
  `VITE_ENABLE_NEW_CANVAS=true`.
- Minimum 60 tests unitaires nouveaux répartis sur les 8 stories.
- Minimum 10 tests E2E nouveaux.

### Critère 3 — Couverture ≥ 80 % sur le nouveau code

- `vitest run --coverage` sur `packages/ui/src/canvas-new/**` rapporte
  `statements >= 80 %`, `branches >= 75 %`, `functions >= 80 %`,
  `lines >= 80 %`.
- Aucune baisse de couverture globale sur les fichiers existants
  (seuil fixé au score pré-wave, ci-enforced).
- Config Vitest : `coverage.thresholds.perFile` pour éviter qu'un fichier
  mal couvert passe sous le radar grâce à la moyenne.

### Critère 4 — Régression visuelle < 1 % pixel diff

- Sur les 8-10 molécules baseline (§4), chaque snapshot produit en mode
  flag=true a un diff ≤ 1 % vs le baseline capturé en flag=false.
- Aucun test visuel au-dessus du seuil, pas de « flaky accepté ». Si un
  snapshot dérive, soit c'est un bug rendu (à corriger), soit c'est un
  changement voulu (baseline regenerée avec justification explicite en
  commit body).

### Critère 5 — Validation manuelle panel V6

Trois panelists de la scientific review V6 valident manuellement via une
checklist unique (Marina Volkov, Sophie Duval, Jason Park). La checklist
couvre :

1. Dessiner adenine de mémoire → rendu visuel acceptable (go/no-go).
2. Utiliser hoverIcon + angle snap → ergonomie comparable ou supérieure
   à l'ancien canvas.
3. Sélection marquee + drag de 10 atomes → fluide, undo atomique marche.
4. Quick-edit `/` sur un N → commit et undo fonctionnent.
5. NMR prediction après dessin → toujours fonctionnel.
6. Feedback libre : un seul blocker listé = gate fail.

### Critère 6 — Stabilité CI (anti-flake)

- **5 runs CI consécutifs** sur `main` avec flag=true injecté en pré-release
  (matrice `ci-canvas-new-preview.yml`) sans aucun test flaky détecté.
- Un test qui a échoué puis réussi au re-run **dans la même PR ou sur
  main** est considéré flaky et réinitialise le compteur à 0.
- Monitoring : script `scripts/flake-detector.sh` agrège les statuts des
  5 derniers runs via `gh run list --json` et refuse le gate si une ligne
  comporte un « retry success ».

### Récapitulatif du gate

Tous les six critères sont cumulatifs. Le déclenchement de la bascule
(`VITE_ENABLE_NEW_CANVAS=true` par défaut dans `.env.example` +
suppression de la branche legacy prévue pour wave-5) fait l'objet d'un
**commit unique et revu par deux reviewers** : le PR body liste les 6
preuves (URLs CI, screenshots, sign-off panelists).

---

## 4. Baseline molecules pour régression visuelle

10 molécules choisies pour couvrir l'espace de rendu critique. Chaque
molécule est stockée en SMILES (source canonique) et en fichier
`.ket.json` (snapshot applicatif). Le test d'import produit la molécule
depuis le SMILES, puis la compare au snapshot rendu par l'ANCIEN canvas.

| # | Molécule | SMILES | Couvre |
|---|---|---|---|
| 1 | Hexane | `CCCCCC` | Chaîne linéaire simple, angles zigzag, atomes implicites |
| 2 | Benzène | `c1ccccc1` | Cycle aromatique, cercle intérieur, liaisons délocalisées |
| 3 | Naphthalène | `c1ccc2ccccc2c1` | Cycles fusionnés, atomes partagés |
| 4 | L-Alanine | `C[C@@H](N)C(=O)O` | Stéréocentre wedge/hash, charge implicite, groupes COOH/NH2 |
| 5 | Tétraméthylammonium | `C[N+](C)(C)C` | Charge formelle positive, ammonium quaternaire |
| 6 | Méthanol d4 | `[2H]C([2H])([2H])O[2H]` | Étiquettes isotopiques, superscripts |
| 7 | Boc-glycine | `O=C(OC(C)(C)C)NCC(=O)O` avec abréviation `Boc` | Abréviation S-group, rendu texte |
| 8 | Phénol | `c1ccc(O)cc1` rendu avec abréviation `Ph-OH` | Abréviation Ph, cycle aromatique |
| 9 | Cholestérol | `CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C` | Polycycle complexe, ~27 C, stéréocentres multiples |
| 10 | Réaction annotée | `CCO >> CC=O` + flèche + texte « [O] » | Schéma réactionnel, flèche, annotation textuelle |

**Organisation des fixtures** :

```
e2e/canvas-new/visual/
  __baseline__/           # PNG générés par l'ancien canvas, commités
    01-hexane.png
    ...
    10-reaction.png
  fixtures/
    01-hexane.smi
    ...
    10-reaction.json      # scène complète (molécule + flèche + texte)
  baseline.spec.ts         # 1 test par molécule
```

**Protocole de regen** : un script `scripts/regen-visual-baselines.sh`
exécute la suite avec `VITE_ENABLE_NEW_CANVAS=false` et
`--update-snapshots`. Utilisé uniquement en sprint 0 (calibrage) et
**jamais automatiquement** pendant la wave.

---

## 5. Risques de flakiness (wave-4 spécifiques) et mitigations

### Risque F1 — Coordonnées souris non déterministes

**Symptôme** : un E2E qui drag `page.mouse.move(100, 42)` produit un
angle qui tombe tantôt à 22.9°, tantôt à 23.1° selon le sub-pixel
rendering → snap à 15° ou 30° de façon aléatoire.

**Mitigation** :
- Utiliser des coordonnées **entières et calibrées** pour tomber à
  distance exacte d'un slot de snap (ex. angles 30°, 45°, 60° strictement).
- Ajouter une API test-only `window.__canvasNew.snapToAngle(30)` qui
  place la souris au centre du slot 30° via `page.evaluate` puis
  `page.mouse.move`. Ainsi on ne dépend pas du layout réel.
- Désactiver temporairement `hysteresis` dans les E2E (`?test=1` → `hysteresisPx=0`).

### Risque F2 — Timing canvas / `requestAnimationFrame`

**Symptôme** : un test fait `page.mouse.click(x, y)` puis assert
immédiatement le DOM ; le `render()` n'a pas encore été appelé (rAF
buffering) → l'assertion échoue une fois sur 20.

**Mitigation** :
- Remplacer tous les `waitForTimeout(ms)` par
  `page.waitForFunction(() => window.__canvasNew.frameCount > previousFrame)`.
- Exposer `window.__canvasNew.flushFrames()` qui force un rAF synchrone
  en mode test.
- Bannir `setTimeout(..., 0)` des tests : remplacer par `Promise.resolve().then(...)`.

### Risque F3 — Re-render en cascade du HoverIcon

**Symptôme** : HoverIcon re-render à chaque mousemove (60 fps) ; un test
qui capture un snapshot DOM juste après un `mousemove` peut attraper
l'état intermédiaire → assertion instable.

**Mitigation** :
- Snapshot DOM uniquement après `page.waitForFunction(() => !window.__canvasNew.pendingHoverUpdate)`.
- Utiliser `React.memo` sur HoverIcon avec comparaison stricte de props
  pour éviter les re-render fantômes déclenchés par un parent.
- Dans les tests unitaires Vitest, utiliser `act()` autour des
  dispatch souris pour flusher les effets.

### Risque F4 — Device Pixel Ratio variable entre dev et CI

**Symptôme** : un dev tourne le test visuel sur un Retina (DPR=2), la CI
sur DPR=1 → diff pixel 100 %.

**Mitigation** :
- Forcer `device_scale_factor: 1` dans `playwright.config.ts` pour la
  suite visuelle.
- Forcer `viewport: { width: 1280, height: 720 }` strict.
- Disable font smoothing (`page.addInitScript(() => document.body.style.webkitFontSmoothing = 'antialiased')`).

### Risque F5 — Ordre non déterministe d'événements pointer

**Symptôme** : Playwright émet `pointermove` et `mousemove` ; notre
`ToolRouter` écoute les deux, on reçoit parfois deux événements au lieu
d'un → preview compté 2x.

**Mitigation** :
- Écouter **uniquement** `pointer*` events côté prod, pas `mouse*`.
- Tests utilisent `page.mouse.*` Playwright qui émet `pointerdown`,
  `pointermove`, `pointerup` (comportement déterministe).
- Tests unitaires simulent `PointerEvent` directement, pas `MouseEvent`.

### Risque F6 — Animations CSS non désactivées dans les E2E

**Symptôme** : le popover quick-edit fade-in 80 ms ; un test qui assert
visibility juste après le press `/` échoue parce que l'élément est en
`opacity: 0.4`.

**Mitigation** :
- `playwright.config.ts` : injection globale
  `page.addStyleTag({ content: '*, *::before, *::after { transition-duration: 0ms !important; animation-duration: 0ms !important; }' })`.
- Respecter `prefers-reduced-motion: reduce` dans le prod → permet de
  passer `--reduced-motion=reduce` à Playwright et d'avoir du prod
  « normal » qui ne fade pas en test.

### Risque F7 — State store non-isolé entre tests

**Symptôme** : un test ajoute 10 atomes, le suivant en ajoute 1 → assert
sur `store.atoms.length === 1` échoue avec 11.

**Mitigation** :
- `beforeEach` test : reset du store Zustand (`useStore.setState(initialState, true)`).
- Tests E2E : `page.goto('/?reset=1')` avant chaque test, la query
  param `reset` force un `localStorage.clear()` + reload.
- Ne jamais partager un `page` entre deux tests (`test.describe.configure({ mode: 'serial' })` uniquement si strict nécessaire, jamais par défaut).

### Risque F8 — Visual regression sensible aux fonts système

**Symptôme** : la CI utilise des fonts légèrement différentes du Mac dev
(Inter vs Arial fallback) → diff pixel sur les labels atomiques.

**Mitigation** :
- Embarquer Inter en local (fichier `.woff2` dans le repo), charger en
  `@font-face` forcé, ignorer `system-ui` fallback pour les tests
  visuels.
- `await page.evaluate(() => document.fonts.ready)` avant chaque
  screenshot.

---

## 6. Coverage targets

- **Nouveaux fichiers** (`packages/ui/src/canvas-new/**`) : seuil dur
  ≥ 80 % stmts/funcs/lines, ≥ 75 % branches, enforced par
  `vitest.config.ts` `coverage.thresholds.perFile`.
- **Fichiers existants** : zéro drop. Le baseline est capturé au
  sprint 0 via `vitest run --coverage --reporter=json`, commité dans
  `coverage-baseline.json`. Un script CI compare le rapport courant et
  échoue si un fichier perd plus de 0.5 pt.
- **Fichiers partagés touchés** (ex. `workspace-store.ts` si étendu) :
  couverture ≥ baseline + tous les nouveaux chemins couverts à 100 %.
- **Exemption explicite** : aucune. Les fichiers de type (`*.d.ts`),
  configs et stubs sont ignorés via `coverage.exclude`.

---

## 7. Budget performance tests

La suite unitaire tourne actuellement en ~45 s localement (Vitest).
La suite `@canvas-new` vient s'ajouter, pas remplacer. Budget :

- **Unit canvas-new seul** : ≤ 30 s (60 tests estimés, cible < 500 ms/test).
- **Unit total (baseline + canvas-new)** : ≤ 2 × 45 s = **90 s**. Plafond dur.
- **E2E canvas-new** : ≤ 60 s (10 scénarios, cible < 6 s/test).
- **E2E total** : ≤ 3 min.
- **Visual regression** : ≤ 90 s (10 molécules × ~8 s avec rendu + screenshot).
- **CI total (6 jobs en parallèle)** : ≤ 10 min wall-clock.

Mesure hebdomadaire commitée dans `docs/retrospectives/test-perf-wN.md`.
Si un job dépasse de 20 %, sprint retro obligatoire pour identifier le
test pathologique.

---

## 8. NFR checks (mesures objectives en test)

### NFR-1 — HoverIcon < 16 ms (60 fps)

- **Test unitaire** : benchmark Vitest `bench('hoverIcon render',
  () => renderHoverIcon(ctx, mockEvent))` avec assertion `<= 16 ms p95`.
- **Test E2E** : Performance API
  ```js
  const samples = await page.evaluate(() => window.__canvasNew.perf.hoverFrames);
  expect(samples.filter(s => s > 16).length / samples.length).toBeLessThan(0.05); // < 5 % dépassements
  ```
- **Seuil dur** : p95 ≤ 16 ms, p99 ≤ 33 ms.

### NFR-2 — Tool switch < 120 ms (motion language Sally)

- **Test E2E** : presser `A` → attendre que le curseur reflète le nouvel
  outil. Mesurer `performance.now()` autour de la séquence.
- **Implémentation** :
  ```js
  const start = await page.evaluate(() => performance.now());
  await page.keyboard.press('A');
  await page.waitForFunction(() => window.__canvasNew.activeTool === 'atom');
  const end = await page.evaluate(() => performance.now());
  expect(end - start).toBeLessThan(120);
  ```
- **Seuil dur** : 120 ms. **Objectif cible** : 60 ms.

### NFR-3 — Drag commit (mouseup) → undo push < 50 ms

- **Test E2E** : drag de 10 atomes, mouseup, mesurer le délai jusqu'à
  `window.__canvasNew.history.length` incrément.
- **Seuil dur** : 50 ms. Implique que la construction de l'Action + push
  est non-bloquante et ne recompute pas le rendu de façon naïve.
- **Test unitaire** : benchmark `moveAction(selection, delta)` sur 100
  atomes, `<= 10 ms p95`.

### NFR-4 — Réactivité clavier (bonus non-exigé explicitement)

- `/` → popover ouvert ≤ 80 ms (cohérent avec animation fade-in 80 ms
  Sally).
- Ctrl+Z → état précédent restauré ≤ 100 ms.

---

## 9. Rituels qualité pendant la wave

- **Daily flake report** : job CI `flake-report.yml` tourne tous les
  matins, poste sur Slack les tests ayant retried success dans les 24 h.
- **Weekly review Murat** : 45 min tous les vendredis, passage en revue
  du dashboard de couverture, des temps d'exécution, et du backlog
  de tests deferred.
- **PR template** : case à cocher obligatoire « Tests @canvas-new
  ajoutés pour cette story » + « Flakiness vérifiée sur 3 runs locaux ».
- **Bug bash pré-release** : 2 h le mercredi avant la bascule du flag,
  tous les rôles V6 (8 panelists + 3 dev + 2 UX) en mode chaos.

---

## 10. Ce qui est explicitement HORS périmètre de test wave-4

Pour éviter le scope creep :

- Tests de perf sur > 500 atomes : wave-5 (optimization pass).
- Tests accessibility screen-reader complets : hors périmètre redraw,
  restent sur backlog général a11y.
- Tests tactile/touch : wave-5 mobile.
- Mutation testing (Stryker) : prometteur mais trop coûteux pour cette
  wave, documenté en `deferred-work-wave-4.md`.
- Fuzz testing sur tools : noté pour wave-6 si budget.

---

## 11. Résumé exécutif (pour Sally, John, Mary)

Trois règles, six critères, un seul flag.

- **Trois règles** : la baseline ne bouge pas, les tests nouveaux ont le
  tag `@canvas-new`, la régression visuelle est pixel-comparée sur 10
  molécules de référence.
- **Six critères de gate** : baseline verte, suite canvas-new verte,
  couverture ≥ 80 %, diff pixel < 1 %, sign-off panel V6, 5 runs CI
  stables.
- **Un seul flag** : `VITE_ENABLE_NEW_CANVAS`. Default `false`
  jusqu'au gate. Flip = commit unique, revu, traçable.

Si un seul de ces critères faiblit, on ne bascule pas. La qualité de
Kendraw après wave-4 se mesurera à la vitesse à laquelle les chimistes
**oublient** le flag — parce que tout marchera comme avant, en mieux.
