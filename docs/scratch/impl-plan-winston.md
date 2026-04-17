# Plan d'implémentation — Wave-4 Redraw Canvas

> Auteur : Winston (Architect, BMAD)
> Date : 2026-04-18
> Statut : Proposition d'arbitrage pour acte 3 (architecture)
> Position : pragmatique, boring tech, coexistence sans casse

Ce document arbitre le package layout, cadre la coexistence ancien/nouveau
canvas via feature flag, documente les impacts transverses (scene, backend,
renderer, NMR, E2E) et formalise les décisions sous forme d'ADRs courts.

Le principe directeur reste celui du product-plan consolidé : **l'ancien
canvas n'est jamais cassé tant que le nouveau n'est pas à parité**. Toute
bifurcation se fait derrière un flag, toute extension du modèle est
additive, et les deux canvas partagent `SceneStore` pour éliminer la
question de la migration de format.

---

## Sommaire

1. Stratégie de coexistence (3 phases)
2. Arbitrage package layout (John vs Sally)
3. Impact sur le modèle de scène
4. Impact backend
5. Impact renderer partagé
6. Migration tests E2E et unitaires
7. Impact panneau NMR
8. Stratégie de commit et branches
9. Risques et mitigations
10. ADRs (6)
11. Check-list de lancement

---

## 1. Stratégie de coexistence

### 1.1 Principes

- Un seul entrypoint React (`App.tsx`) choisit à la montée du composant
  entre `Canvas` (ancien) et `CanvasNew` (nouveau). La décision n'est
  **jamais** prise plus bas dans l'arbre — aucun sous-composant ne doit
  connaître l'existence des deux implémentations.
- Le store (`SceneStore` retourné par `createSceneStore`) est créé
  **une seule fois** au niveau `App.tsx` et passé aux deux canvas via les
  mêmes props. Les actions, l'undo, la persistance `.kdx`, les commandes
  Immer sont donc automatiquement compatibles.
- Le `toolState` (palette gauche, raccourcis, type de flèche, élément
  actif...) reste au même endroit (`workspace-store.ts` côté UI) et est
  consommé à l'identique. Un outil sélectionné dans la palette gauche
  déclenche le bon tool aussi bien côté ancien que côté nouveau.
- Le flag `FEATURE_FLAGS.newCanvas` est **lu une fois** à l'initialisation
  du module (pas de hot-swap à chaud). Basculer le flag demande un refresh
  navigateur — cette contrainte est acceptable car la bascule n'a pas à
  être dynamique en production.

### 1.2 Phase A — Wave-4 (flag à `false` par défaut)

- `CanvasNew` est développé stories par stories derrière le flag.
- L'ancien canvas reste la référence pour la suite E2E principale.
- Un sous-ensemble de tests E2E tagués `@canvas-new` est lancé **en
  parallèle** avec `VITE_ENABLE_NEW_CANVAS=true` sur la CI (matrix build).
- À la fin de la Wave-4, les 8 stories P0 sont vertes, mais le flag
  par défaut reste `false` jusqu'à validation manuelle QA (release gate).

### 1.3 Phase B — Wave-5 (flag à `true` par défaut)

- `.env.example` passe à `VITE_ENABLE_NEW_CANVAS=true`.
- L'ancien canvas devient le **fallback** via `VITE_ENABLE_NEW_CANVAS=false`.
- La suite E2E principale est bascule sur le nouveau canvas ; l'ancien
  reste testé en matrix mais de façon dégradée (smoke tests uniquement).
- Les nouvelles features de Wave-5 (ex. templates, R-groups avancés) ne
  sont implémentées que dans le nouveau canvas.

### 1.4 Phase C — Wave-6+ (suppression de l'ancien)

- Suppression du flag, suppression de `Canvas.tsx`, suppression du sous-arbre
  ancien. Le dossier `canvas-new/` est renommé en `canvas/` (commit
  dédié, pas de logique modifiée, juste un `git mv`).
- Les tests E2E `@canvas-new` perdent leur tag et deviennent la suite par
  défaut.
- La dette du double-canvas est ainsi limitée à **2 waves** (4-5 mois
  calendaires au rythme actuel).

### 1.5 Où vit la bifurcation dans `App.tsx`

`App.tsx` importe déjà `Canvas` en ligne 3. La stratégie :

```ts
// packages/ui/src/App.tsx (extrait illustratif, 5 lignes max)
const CanvasImpl = FEATURE_FLAGS.newCanvas
  ? lazy(() => import('./canvas-new'))
  : Canvas;
// ...
<Suspense fallback={null}><CanvasImpl store={store} toolState={...} /></Suspense>
```

- `Canvas` est importé **eagerly** (pas de régression bundle).
- `CanvasNew` est `lazy` : son code ne part dans le bundle que si le flag
  est `true`. En Phase A, le nouveau canvas n'alourdit donc pas le bundle
  prod par défaut.
- Les deux composants reçoivent **exactement le même contrat de props** :
  `{ store, toolState, highlightedAtomIds, onSelectionChange, ... }` (copié
  depuis la signature actuelle de `Canvas`). Ce contrat est figé par une
  interface `CanvasProps` exportée depuis `packages/ui/src/canvas-contract.ts`.
- En Phase B, on inverse : `CanvasNew` en eager, `Canvas` en lazy.
- En Phase C, le `lazy`/`ternary` disparaît complètement.

### 1.6 Résumé : deux canvas, mêmes entrées

Les deux canvas consomment :
- `SceneStore` (snapshot + subscribe) — identique.
- `toolState` (readonly) — identique.
- `document` dérivé via `useSyncExternalStore(store)` — identique.
- `highlightedAtomIds` (set lisible venant du panneau NMR) — identique.

Et publient :
- Événements clavier/souris dans le store via commandes Immer.
- `onSelectionChange` pour relayer vers le panneau NMR.

Aucun signal supplémentaire n'est requis en Phase A. Phase B ajoutera
éventuellement un canal `previewLayer` exposé par le renderer.

---

## 2. Arbitrage package layout — **John vs Sally**

### 2.1 Rappel du désaccord

- **John** (PM) : créer un package `packages/canvas-editor/` (nouveau
  workspace pnpm), isolation maximale, fan-out fort, coupe nette.
- **Sally** (UX) : rester dans `packages/ui/src/canvas-new/` (sous-dossier),
  pas de nouveau package, itération rapide.

### 2.2 Décision : **Option B — sous-dossier `packages/ui/src/canvas-new/`**

### 2.3 Justification (5 arguments)

1. **Précédent monorepo Kendraw.** Les waves 1, 2, 3 ont systématiquement
   ajouté des features UI (NMR panel en sibling, ToolPalette, Annotations,
   Compound Numbering) comme sous-dossiers de `packages/ui/src/`. Aucun
   nouveau package n'a été créé pour un composant UI depuis l'ébauche
   initiale. Rompre ce pattern pour une feature qui reste une partie du
   package UI ajouterait une incohérence visible dans la topologie du repo.

2. **Coût pnpm workspace non nul.** Créer un package `canvas-editor`
   implique un `package.json` dédié, un `tsconfig.json`, une entrée dans
   `pnpm-workspace.yaml`, des scripts de build/test/lint à maintenir, des
   imports inter-packages typés (`@kendraw/canvas-editor`) et un cycle de
   dépendance à surveiller (`ui` → `canvas-editor` → `scene`, `renderer-canvas`).
   Pour 8 stories, ce surcoût est disproportionné.

3. **Frontière logique suffisante via sous-dossier.** L'isolation demandée
   par John (ne pas casser l'ancien canvas) est obtenue **à 100 %** par un
   sous-dossier `canvas-new/` qui n'est importé que par `App.tsx`. Aucun
   autre fichier du package `ui` n'a besoin de référencer `canvas-new`.
   On peut même ajouter une règle ESLint `no-restricted-imports` qui
   interdit à tout fichier hors `App.tsx` d'importer `canvas-new/**`, ce
   qui reproduit l'isolation d'un package sans ses coûts.

4. **Flexibilité de transition Phase B → Phase C.** En Phase C, la
   suppression de l'ancien canvas se fait par `git mv canvas-new canvas`.
   Si on avait extrait dans `canvas-editor`, il faudrait soit garder ce
   nom (incohérent avec le reste de l'arbo), soit faire un déménagement
   inter-packages lourd (imports, tsconfig paths, CI) qui n'apporte aucune
   valeur fonctionnelle.

5. **Pas de réutilisation externe prévue.** Un package dédié serait
   justifié si on anticipait un consommateur externe (second produit,
   lib publiée sur npm, extension VS Code...). Ce n'est pas le roadmap
   Kendraw. Le canvas est un détail d'implémentation de l'app principale ;
   l'empaqueter est de la spéculation architecturale.

### 2.4 Garde-fous pour compenser la faiblesse d'isolation

- **ESLint boundary.** Dans `packages/ui/.eslintrc.cjs`, ajouter une règle
  `no-restricted-imports` qui interdit tout import depuis `canvas-new/**`
  sauf depuis `App.tsx` et depuis les tests.
- **CODEOWNERS.** `packages/ui/src/canvas-new/` est marqué comme
  co-maintenu par `@jbdonnette` et le futur mainteneur canvas. Aucun PR
  ne peut toucher le dossier sans review dédiée.
- **Budget taille.** Chaque fichier de `canvas-new/` vise < 300 lignes ;
  `CanvasNew.tsx` est plafonné à 400 lignes (AC4 de W4-R-02). La règle
  de taille remplace la séparation physique en package.

### 2.5 Revoir la décision en Phase C

Si, à la suppression de l'ancien canvas, la taille du sous-dossier dépasse
~5 000 lignes, envisager alors — et seulement alors — l'extraction en
package dédié. Cette décision sera prise à froid, sur données réelles.

---

## 3. Impact sur le modèle de scène

### 3.1 État des lieux

- `packages/scene/src/types.ts` (215 lignes) : types branded pour IDs
  (`AtomId`, `BondId`, `ArrowId`...), `Atom`, `Bond`, `Arrow`, `Annotation`,
  `Group`, `Shape`, `Viewport`, `NmrPeak`, `CompoundNumbering`, `Page`,
  `Document`.
- `packages/scene/src/store.ts` (427 lignes) : `createSceneStore`, undo/redo
  par snapshots immuables (cap 200), `subscribe`/`getSnapshot` compatibles
  `useSyncExternalStore`, mutations via Immer + Command pattern.

### 3.2 Le nouveau canvas a-t-il besoin de nouveaux types ou mutations ?

**Pour les 8 stories P0 : non.** Le nouveau canvas :
- Lit `document.pages[page].atoms/bonds/...` exactement comme l'ancien.
- Publie des commandes existantes (`add-atom`, `add-bond`, `move-atoms`,
  `delete-selection`...) déjà couvertes par le store.
- Gère le hovering, le preview, le marquee **en mémoire locale du composant**
  (state React), pas dans le store. C'est cohérent avec le principe Ketcher
  « Struct vs ReStruct » (section 5 de l'analyse) : l'état d'édition
  volatile n'entre pas dans le modèle persistant.

### 3.3 Extensions additives possibles (optionnelles, plutôt Phase B)

Si des stories Wave-5 demandent à persister un état d'édition (ex. angle
snap step utilisateur, type de flèche préféré), l'extension se fera sur
`Document.metadata` ou `Page.meta` via un champ **optionnel** :

```ts
// Exemple illustratif (5 lignes max)
type DocumentMetadata = {
  // ... champs existants
  editorPrefs?: { snapStepDeg?: number; defaultArrowType?: string };
};
```

Règle absolue : **tout champ ajouté est `?` optionnel**. Un `.kdx` ancien
non muni du champ reste valide. Un `.kdx` récent chargé par une version
ancienne ignore les champs inconnus (comportement actuel de `loadDocument`).

### 3.4 Changements interdits (breaking)

- Renommer un champ existant (`position` → `coords`, par exemple).
- Changer le type d'un champ (string → number).
- Supprimer un champ, même peu utilisé.
- Modifier le format de sérialisation `.kdx` sans bump de `schemaVersion`
  et migration explicite testée.

### 3.5 Store : rien à casser, mais possibilité d'ajouter des commandes

Le nouveau canvas peut introduire de **nouvelles commandes** dans
`packages/scene/src/commands.ts` (ex. `add-atoms-batch` pour un drag de
plusieurs atomes en une transaction). Ces ajouts sont **additifs** (union
discriminée étendue), ne cassent pas les consommateurs existants, et sont
aussi utilisables par l'ancien canvas si un jour on en a besoin.

### 3.6 Snapshots et undo

Le pattern snapshot Immer actuel (cap 200) est suffisant pour le nouveau
canvas. Aucun changement requis. Les tools canvas-new publient une
commande **par action utilisateur atomique** (un clic = un snapshot, un
drag complet = un snapshot), comme l'ancien canvas.

---

## 4. Impact backend

### 4.1 Statut : **zéro changement**

Le canvas est **intégralement front-end**. Le backend FastAPI dans
`/home/debian/kendraw/backend/` expose uniquement :
- `kendraw_api/` — routes FastAPI (NMR, propriétés, health).
- `kendraw_chem/` — bindings RDKit et calculs.
- `kendraw_settings/` — config Pydantic.
- `kendraw_observability/` — logs et métriques.

Aucun de ces modules n'a connaissance du rendu client. Le canvas envoie
des payloads SMILES/MOL au backend via `packages/api-client/` ; ce
contrat reste strictement identique.

### 4.2 Vérification

- Inventaire : `backend/{kendraw_api,kendraw_chem,kendraw_settings,
  kendraw_observability,tests,pyproject.toml,uv.lock,README.md}` →
  aucun fichier touché par Wave-4 Redraw.
- Les 6 CI checks backend (`ruff check`, `ruff format --check`, `mypy`,
  `pytest`) ne sont **pas concernés** par la wave et doivent rester au
  vert sans modification.
- Conséquence : toute PR de la Wave-4 Redraw qui touche `/backend/` est
  **suspecte** et doit être revue avec vigilance. Politique : PRs Wave-4
  Redraw = diff strictement limité à `packages/` et `tests/`.

---

## 5. Impact renderer partagé

### 5.1 `packages/renderer-canvas/src/renderer.ts`

Le renderer actuel expose un `render(ctx, document, viewport)` qui dessine
atomes, liaisons, flèches, annotations, shapes. Les deux canvas l'utilisent
déjà (l'ancien via `Canvas.tsx`, le nouveau via `canvas-new/render/renderLoop.ts`).

### 5.2 Changements autorisés (additifs)

Le nouveau canvas va introduire des **couches visuelles** (hoverIcon,
preview atome, marquee overlay, selection halo) qui ne vivent pas dans le
`Document` persistant. Pour les rendre sans copier le renderer, on ajoute
des **exports additifs** dans `packages/renderer-canvas/src/index.ts` :

- `drawHoverIcon(ctx, world, icon, viewport)` — nouveau.
- `drawMarquee(ctx, rectWorld, viewport)` — nouveau.
- `drawPreviewAtom(ctx, world, element, viewport)` — nouveau.
- `drawSelectionHalo(ctx, items, viewport)` — nouveau.

Ces fonctions sont **pures** (prennent un `ctx` et des coordonnées, ne
touchent pas au document). Elles n'ont aucun impact sur la fonction
`render` principale.

### 5.3 Changements interdits (breaking)

- Modifier la signature de `render(ctx, document, viewport)`.
- Changer le type de `Viewport`, `RenderTheme`, ou toute option actuelle.
- Réécrire l'ordre des couches du rendu principal (atomes avant liaisons
  devient liaisons avant atomes).

### 5.4 Tests renderer

La suite `packages/renderer-canvas/src/__tests__/` doit rester **100 %
verte**. Les nouveaux utilitaires de layer ont leur propre suite de tests
unitaires (appels canvas mockés, vérification des paramètres `fillStyle`,
`strokeStyle`, etc.).

---

## 6. Migration des tests E2E et unitaires

### 6.1 Stratégie globale

- **Pas de duplication aveugle.** Les tests existants (`tests/e2e/*.spec.ts`)
  ne sont pas copiés. Ils continuent de tourner contre l'ancien canvas
  tant que le flag par défaut est `false`.
- **Suite parallèle `@canvas-new`.** Nouvelle suite dans
  `tests/e2e/canvas-new/*.spec.ts`, chaque story P0 contribue son fichier
  (cf. `Files to touch` de chaque story W4-R-XX).
- **Matrix CI.** `.github/workflows/e2e.yml` ajoute une deuxième colonne
  `canvas-new` qui lance `VITE_ENABLE_NEW_CANVAS=true pnpm test:e2e --grep
  @canvas-new`.

### 6.2 Commandes pnpm

Dans `package.json` racine :

```json
// Illustratif, 5 lignes max
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:canvas-new": "VITE_ENABLE_NEW_CANVAS=true playwright test --grep @canvas-new"
  }
}
```

### 6.3 Tests unitaires

- Tests de `canvas-new/tools/*` dans `packages/ui/src/canvas-new/tools/__tests__/`.
- Tests de `canvas-new/interactions/*` dans `__tests__` adjacent.
- Objectif couverture : **85 %** des fichiers `canvas-new/` (cf. release gate).
- Les tests unitaires existants (scene, renderer, nmr...) ne changent pas.

### 6.4 Release gate

Le flag passe à `true` par défaut **uniquement** quand :
1. Suite E2E globale verte (ancien et nouveau canvas).
2. Suite E2E `@canvas-new` verte sur les 8 stories P0.
3. Couverture unitaire ≥ 85 % sur `canvas-new/`.
4. Revue manuelle QA (un mainteneur reproduit les flows canoniques).
5. Aucune régression perf (FPS mesurés ≥ 55 sur molécule 50 atomes).

---

## 7. Impact panneau NMR

### 7.1 Statut : **zéro changement**

Le panneau NMR vit dans `packages/nmr/src/NmrPanel.tsx`. Il est un
**sibling** du canvas dans `App.tsx` (cf. memoire : « Canvas and NmrPanel
are siblings, not parent-child »). Le bridge de highlight passe par
`highlightedAtomIds` remonté via props au niveau `App`.

### 7.2 Vérification

- Point d'entrée : `packages/nmr/src/NmrPanel.tsx` et `index.ts`.
- Consommé par : `packages/ui/src/App.tsx` (layout CSS grid, Ctrl+Shift+N).
- Dépendances vers le canvas : **aucune** — le panneau consomme
  `SceneStore` et `highlightedAtomIds`, rien d'autre.
- Conséquence : changer le canvas ne peut pas casser le panneau NMR par
  construction. La seule surface de contact est la prop
  `onSelectionChange` qui reste identique dans `CanvasProps`.

### 7.3 Test de non-régression

Le test `nmr-prediction.spec.ts` tourne aujourd'hui contre l'ancien canvas.
Il sera **dupliqué** (seule exception à la règle de non-duplication) en
version `@canvas-new` pour garantir que le bridge marche à l'identique.

---

## 8. Stratégie de commit et branches

### 8.1 Branches

- **Travail direct sur `main`** (règle projet : pas de force-push, pas de
  `--no-verify`, pas de bypass signing).
- Pas de feature branch longue durée : la série des 8 stories produit 8
  commits indépendants, chacun atomique et CI-vert.
- En cas de PR (si équipe élargie), la branche s'appelle
  `wave-4-redraw-w4-r-01-feature-flag` (nom descriptif + id story).

### 8.2 Format de commit

Chaque commit suit le pattern :

```
feat(canvas-new): <résumé court au présent> — wave-4 W4-R-XX
```

Exemples :
- `feat(canvas-new): add feature flag and CanvasNew stub — wave-4 W4-R-01`
- `feat(canvas-new): unified tool abstraction with pointer lifecycle — wave-4 W4-R-02`
- `feat(canvas-new): shared Canvas 2D renderer pipeline — wave-4 W4-R-03`
- `feat(canvas-new): hover icon for atoms and bonds — wave-4 W4-R-04`
- `feat(canvas-new): 15-degree angle snap with Shift free — wave-4 W4-R-05`
- `feat(canvas-new): marquee rectangle selection — wave-4 W4-R-06`
- `feat(canvas-new): drag-move selection with atomic undo — wave-4 W4-R-07`
- `feat(canvas-new): slash-key quick property popover — wave-4 W4-R-08`

Règles explicites :
- **Pas de `Co-authored-by` ni `Signed-off-by`** (CLAUDE.md règle).
- **Pas de `--amend`** sur un commit déjà poussé.
- **Pas de `--no-verify`** : pre-commit hooks (lint + tsc + vitest) doivent
  passer.

### 8.3 Checks CI avant chaque push

Rituel obligatoire (CLAUDE.md) :

1. `pnpm lint` (zéro erreur)
2. `pnpm typecheck` (zéro erreur)
3. `pnpm test` (zéro échec)
4. `cd backend && uv run ruff check .`
5. `cd backend && uv run ruff format --check .`
6. `cd backend && uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/`
7. `cd backend && uv run pytest -v`
8. `pnpm test:e2e` (suite complète flag=false)
9. `VITE_ENABLE_NEW_CANVAS=true pnpm test:e2e --grep @canvas-new`

Les 4 checks backend doivent rester verts même si la wave ne touche pas
le backend — c'est la garantie de non-régression.

### 8.4 Un commit = un état CI-vert

Chaque commit de la série doit laisser le repo dans un état où les 9
checks ci-dessus passent. Si une story produit trop de code pour tenir
dans un seul commit lisible, la découper en :
- `feat(canvas-new): <scope> scaffolding — wave-4 W4-R-XX (1/2)`
- `feat(canvas-new): <scope> implementation — wave-4 W4-R-XX (2/2)`

Les deux commits doivent rester verts individuellement.

---

## 9. Risques et mitigations

| # | Risque | Proba | Impact | Mitigation |
|---|--------|-------|--------|------------|
| R1 | Divergence de comportement subtile entre les deux canvas (ex. snap, hover) casse l'expérience utilisateur en Phase B. | Moyen | Élevé | Suite E2E `@canvas-new` de parité ; captures de référence pour le rendu ; QA manuelle avant bascule du flag. |
| R2 | Taille du bundle UI augmente significativement à cause du double canvas en Phase B. | Faible | Moyen | `lazy()` sur le canvas inactif ; mesure du bundle via CI (budget ≤ +10 % vs Wave-3). |
| R3 | `SceneStore` reçoit des commandes concurrentes des deux canvas si un dev oublie le flag. | Faible | Élevé | Bifurcation centralisée dans `App.tsx` uniquement ; ESLint `no-restricted-imports` interdisant `canvas-new/**` ailleurs ; test E2E qui monte une seule instance. |
| R4 | Régression du panneau NMR suite à un changement du contrat `CanvasProps`. | Moyen | Moyen | Interface `CanvasProps` figée dans `canvas-contract.ts` ; test de type TS qui vérifie que `Canvas` et `CanvasNew` satisfont la même signature. |
| R5 | Cycle de dépendances `ui` ↔ `scene` si le nouveau canvas met des types dans le mauvais package. | Faible | Moyen | Règle : les types de scène vivent dans `scene`, les types de tools vivent dans `ui/canvas-new/` ; contrôle ESLint `no-cycle` (déjà actif). |
| R6 | Performance du nouveau canvas inférieure à l'ancien (React render loops excessifs). | Moyen | Moyen | Budget 60 fps sur molécule 50 atomes ; profiler Chrome en CI via Playwright ; render loop en `requestAnimationFrame` throttle (cf. W4-R-03 AC). |
| R7 | Feature flag contourné localement par un dev qui met `true` par inadvertance en prod. | Faible | Élevé | Vérif en CI : `grep VITE_ENABLE_NEW_CANVAS=true` dans `.env.example` doit être absent en Phase A ; protection via branche `main` qui refuse un `.env.example` modifié sans review. |
| R8 | Dette du double-canvas s'étend au-delà de 2 waves (timeline glisse). | Moyen | Élevé | Release gate ferme (5 critères § 6.4) ; revue mensuelle de la dette ; plan de suppression Phase C explicitement scopé dans Wave-6. |
| R9 | Incompatibilité silencieuse de `.kdx` après ajout de champ dans le modèle scène. | Faible | Élevé | Tous les ajouts sont `?` optionnels (cf. §3.4) ; test de non-régression `persistence/__tests__/kdx-roundtrip.test.ts` avec fixtures historiques. |
| R10 | Fragmentation de la documentation (anciens docs canvas, nouveaux docs canvas-new) rend l'onboarding confus. | Moyen | Faible | `README.md` principal pointe vers `docs/canvas-new/` en Phase A, redirige vers `docs/canvas/` en Phase C ; doc Phase B explicite la migration. |

---

## 10. ADRs

### ADR-001 — Canvas 2D natif (HTML5) plutôt que SVG

**Contexte.** Ketcher utilise SVG via Raphael.js pour son rendu. L'ancien
Kendraw utilise Canvas 2D natif (cf. `packages/renderer-canvas/`).

**Décision.** Le nouveau canvas **conserve Canvas 2D natif**, en partageant
le renderer existant (`renderer.ts`). Aucune introduction de SVG, de
Konva, de PixiJS ou de WebGL.

**Justification.** (a) Parité de perf avec l'ancien, pas de régression ;
(b) Canvas 2D gère mieux les grosses scènes (> 500 atomes) que le DOM SVG ;
(c) boring tech — Canvas 2D est standard depuis 2010, pas de nouvelle
dépendance ; (d) le renderer existant est déjà testé et couvre tous les
cas de figure du domaine ; (e) rendre en Canvas 2D simplifie les exports
PNG qui sont déjà natifs.

**Conséquences.** Les layers d'overlay (marquee, hover icon) seront
rendus sur le même `<canvas>` via des passes supplémentaires, pas via un
DOM superposé.

### ADR-002 — Sous-dossier `packages/ui/src/canvas-new/` plutôt que nouveau package

**Contexte.** Désaccord John (nouveau package `canvas-editor`) vs Sally
(sous-dossier). Cf. §2.

**Décision.** **Sous-dossier**. Le nouveau canvas vit à
`packages/ui/src/canvas-new/`. Pas de nouveau package pnpm.

**Justification.** Précédent monorepo ; coût pnpm workspace disproportionné
pour 8 stories ; isolation logique déjà garantie par règle ESLint
`no-restricted-imports` ; pas de réutilisation externe prévue ; flexibilité
pour le `git mv canvas-new canvas` de Phase C.

**Conséquences.** Décision révisable en Phase C si le volume de code
dépasse ~5 000 lignes.

### ADR-003 — Extensions du modèle de scène strictement additives

**Contexte.** Le nouveau canvas peut exiger de nouveaux champs dans le
modèle (ex. preferences d'édition).

**Décision.** Tout ajout dans `packages/scene/src/types.ts` est un champ
**optionnel** (`?`) nouveau. Aucune renommage, aucune suppression, aucun
changement de type d'un champ existant.

**Justification.** Les fichiers `.kdx` persistent entre versions de
Kendraw. Un changement non additif invaliderait les documents des
utilisateurs actuels, ce qui est inacceptable. Par ailleurs, le principe
d'additivité est simple à vérifier en code review (diff local dans
`types.ts`).

**Conséquences.** Si un refactor du modèle devient nécessaire
(peu probable), il passera par un bump de `schemaVersion` dans
`DocumentMetadata` et une migration explicite testée sur fixtures.

### ADR-004 — Feature flag via `import.meta.env.VITE_ENABLE_NEW_CANVAS`

**Contexte.** Le nouveau canvas doit coexister sans risque avec l'ancien.

**Décision.** Un unique flag `VITE_ENABLE_NEW_CANVAS` piloté par Vite
(préfixe `VITE_` obligatoire pour l'exposition au client). Valeur par
défaut `false` en Phase A, `true` en Phase B, flag supprimé en Phase C.
Le flag est lu **une fois** au chargement via
`packages/ui/src/config/feature-flags.ts` qui expose un objet figé
`FEATURE_FLAGS`.

**Justification.** Vite supporte nativement les variables d'env, la
convention `VITE_` rend la portée explicite ; un flag booléen suffit
(pas besoin de feature management SaaS) ; lecture unique au chargement
évite les bugs de réactivité au runtime.

**Conséquences.** Changer de canvas exige un reload navigateur ; c'est
acceptable pour un switch d'édition. En CI, la matrix `canvas-new` pilote
le flag via l'env.

### ADR-005 — RDKit côté serveur, pas d'Indigo ni de WASM

**Contexte.** Ketcher utilise Indigo (algorithmes chimiques) via WASM
côté client. Kendraw dispose d'un backend FastAPI avec RDKit (Python).

**Décision.** Aucune introduction d'Indigo, aucune introduction de WASM
chimique côté client. Les appels chimiques (SMILES parse, structure match,
descripteurs) passent par `packages/api-client` → `backend/kendraw_chem/`.

**Justification.** (a) Architecture Kendraw consolidée depuis Sprint 0,
changer de moteur chimique serait un shift majeur hors scope Wave-4 ;
(b) WASM Indigo pèse ~8 Mo, dégrade le bundle et le TTI ; (c) RDKit
côté serveur bénéficie des mises à jour Python standards (uv) ;
(d) cohérence avec les waves précédentes, notamment la pipeline NMR
(Wave-3) qui passe par le backend ; (e) boring tech — RDKit Python est
l'écosystème chimie le plus mature de l'open source.

**Conséquences.** Le canvas reste strictement côté client, sans calcul
chimique local. Les opérations ultra-rapides (vérification de valence en
drag) sont implémentées dans `packages/chem/` (TS) sans dépendance
externe.

### ADR-006 — Abstraction Tool via interface TypeScript, pas via classe

**Contexte.** Ketcher utilise des classes pour ses Tools
(`SelectTool`, `BondTool`...). Kendraw peut suivre ou non.

**Décision.** Les Tools sont **des objets qui implémentent une interface
TypeScript** `Tool`, pas des instances de classe avec héritage.

```ts
// Illustratif, 5 lignes max
interface Tool {
  mousedown(ctx: ToolContext, e: PointerEvent): void;
  mousemove(ctx: ToolContext, e: PointerEvent): void;
  mouseup(ctx: ToolContext, e: PointerEvent): void;
  cancel(ctx: ToolContext): void;
}
```

**Justification.** (a) Kendraw est écrit en TS fonctionnel (React hooks,
pas de classes React), les classes seraient dissonantes ; (b) pas de
hiérarchie d'héritage à maintenir ; (c) testabilité plus simple — un Tool
est un objet pur, pas d'instance à construire ; (d) tree-shaking plus
efficace ; (e) pattern familier pour les contributeurs TS modernes.

**Conséquences.** L'état interne d'un Tool (ex. `dragStart`) vit dans une
closure ou un `ToolContext` partagé, pas dans `this`. Pas d'héritage, la
duplication limitée entre tools est acceptée (composition plutôt
qu'extension).

---

## 11. Check-list de lancement (pour Amelia)

- [ ] Créer `packages/ui/src/config/feature-flags.ts` avec `FEATURE_FLAGS.newCanvas`.
- [ ] Créer `packages/ui/src/canvas-contract.ts` avec `interface CanvasProps`.
- [ ] Modifier `packages/ui/src/env.d.ts` pour typer `VITE_ENABLE_NEW_CANVAS`.
- [ ] Créer `packages/ui/src/canvas-new/CanvasNew.tsx` (stub conforme à `CanvasProps`).
- [ ] Créer `packages/ui/src/canvas-new/index.ts` (re-export).
- [ ] Modifier `packages/ui/src/App.tsx` pour bifurcation `lazy()`.
- [ ] Ajouter règle ESLint `no-restricted-imports` sur `canvas-new/**`.
- [ ] Ajouter script `test:e2e:canvas-new` dans `package.json` racine.
- [ ] Ajouter colonne matrix dans `.github/workflows/e2e.yml`.
- [ ] Documenter le flag dans `.env.example`.
- [ ] Première passe CI : les 9 checks doivent être verts avec flag `false`.
- [ ] Commit : `feat(canvas-new): add feature flag and CanvasNew stub — wave-4 W4-R-01`.

---

## Résumé pour l'acte 3

Le plan est **boring** par choix : feature flag Vite standard, sous-dossier
plutôt que nouveau package, scene model additif uniquement, renderer
partagé, backend intouché, NMR intouché, commits atomiques sur `main`.
Le seul point de friction arbitré est le désaccord John/Sally — tranché
en faveur du sous-dossier (Sally) avec des garde-fous ESLint et CODEOWNERS
pour compenser la moindre isolation.

La Phase A (Wave-4) livre le nouveau canvas derrière flag off ; la Phase B
(Wave-5) bascule par défaut ; la Phase C (Wave-6) supprime l'ancien. La
dette du double-canvas est donc bornée à **2 waves calendaires**, avec
release gate stricte (E2E + couverture + QA + perf).

Aucun champ existant n'est modifié, aucun `.kdx` sauvegardé n'est
invalidé, aucune modification backend n'est planifiée. La surface de
risque est réduite à l'intérieur de `packages/ui/src/canvas-new/`.
