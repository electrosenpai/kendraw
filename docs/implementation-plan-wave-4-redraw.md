# Wave-4 Redraw — Implementation Plan (Architecture + Dev + Test)

> Plan d'implémentation de la vague 4 « redraw » — réécriture propre du
> moteur de dessin Kendraw inspirée de Ketcher (EPAM, Apache 2.0).
>
> Document collectif assemblé par la party BMAD :
> 🏗️ **Winston** (Architect) — stratégie de coexistence, ADRs, arbitrages
> 💻 **Amelia** (Developer) — ordre d'implémentation, scaffolds, efforts
> 🧪 **Murat** (TEA) — stratégie de test, release gate, flakiness
>
> **Date** : 2026-04-18
> **Input amont** :
> - [`docs/ketcher-analysis-wave-4.md`](./ketcher-analysis-wave-4.md) (2729 lignes)
> - [`docs/product-plan-wave-4-redraw.md`](./product-plan-wave-4-redraw.md) (2905 lignes)

---

## Exec summary

Cette vague livre les **fondations techniques** du nouveau canvas Kendraw
en **clean room** :

| Décision | Arbitre | Choix final |
|---|---|---|
| Sous-dossier vs package | Winston | `packages/ui/src/canvas-new/` (Option B) |
| Rendu SVG vs Canvas 2D | Winston | **Canvas 2D** (continuité) |
| Model changes breaking | Winston | **Additif uniquement** |
| Feature flag | Winston | `VITE_ENABLE_NEW_CANVAS` via `import.meta.env` |
| Tool abstraction | Amelia | Interface TS, pas de classe |
| Commit strategy | Amelia | Séquentiel main, `feat(canvas-new): ... — wave-4 W4-R-XX` |
| Release gate | Murat | 6 critères fermes (voir §4) |
| Effort total | Amelia | ≈60 h dev solo (7 jours) |

Les **8 stories P0** suivent l'ordre de dépendance :

```
W4-R-01 (flag)
    └── W4-R-02 (tool abstraction) ←── goulot d'étranglement
              ├── W4-R-03 (render parity)
              ├── W4-R-04 (hoverIcon)
              │     └── W4-R-08 (quick-edit /)
              ├── W4-R-05 (snap 15°)
              └── W4-R-06 (marquee)
                    └── W4-R-07 (drag-move)
```

**Zéro régression attendue sur** : NMR, PropertyPanel, backend FastAPI,
I/O, persistence, audit trail, e-signature, déploiement Traefik.

---


## 2. Architecture et ADRs (Winston)

> Section rédigée par 🏗️ **Winston**, Architect — 646 lignes.

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

---

## 3. Implementation plan (Amelia)

> Section rédigée par 💻 **Amelia**, Senior Dev — 419 lignes.

# Wave-4 Redraw — Implementation Plan (Amelia, Senior Dev)

**Scope** : 8 stories W4-R-01 → W4-R-08, réécriture canvas-new sous feature flag.
**Principe** : clean-room Ketcher-inspired, zero régression sur ancien `Canvas.tsx`, aucun module Kendraw existant (`scene`, `renderer-canvas`, `nmr`, `io`, `api-client`) modifié hors injection d'outils.
**Cible** : `CanvasNew.tsx` < 400 lignes vs 1729 lignes de `Canvas.tsx` actuel.

---

## 1. Implementation order (sequential, dependency-driven)

Les 8 stories forment un DAG où R-01 et R-02 sont les goulots en amont, R-07 en aval. La séquence recommandée suit strictement la Priority Matrix (§2 plan John).

```
R-01 ── R-02 ─┬─ R-03 ─── R-04 ─┬─ R-05
              │                 │
              └─ R-06 ─── R-07  └─ R-08
```

R-03 et R-06 peuvent démarrer dès que R-02 est mergée. R-04/R-05/R-08 sont tous bloqués par R-03 (besoin de la render loop pour afficher previews/status).

---

### W4-R-01 — Feature flag + squelette canvas-new

**Blocked by** : rien (fondation).

**Files to create** :
  - `packages/ui/src/config/feature-flags.ts` (20 lines — export `FEATURE_FLAGS` lu depuis `import.meta.env.VITE_ENABLE_NEW_CANVAS`)
  - `packages/ui/src/canvas-new/CanvasNew.tsx` (30 lines stub, signature identique à `Canvas.tsx`)
  - `packages/ui/src/canvas-new/index.ts` (3 lines re-export)
  - `packages/ui/src/canvas-new/__tests__/feature-flags.test.ts` (25 lines)

**Files to modify** :
  - `packages/ui/src/App.tsx` (+8 lines : `import { FEATURE_FLAGS } from './config/feature-flags'` + switch ternaire `FEATURE_FLAGS.newCanvas ? <CanvasNew .../> : <Canvas .../>`)
  - `packages/ui/src/env.d.ts` (+3 lines : typer `VITE_ENABLE_NEW_CANVAS: string | undefined`)
  - `.env.example` (+2 lines commentées)
  - `packages/ui/vite.config.ts` (vérifier passthrough — pas de modif sauf si manquant)

**Tests to add** :
  - `packages/ui/src/canvas-new/__tests__/feature-flags.test.ts` (unit — default false, `'true'` → true, autres valeurs → false)
  - `tests/e2e/canvas-new-flag.spec.ts` (E2E — lance avec `VITE_ENABLE_NEW_CANVAS=true`, assert stub visible)

**Commit** : `feat(canvas-new): feature flag + squelette — wave-4 W4-R-01`

**Reference pattern** : wave-3 B1 shape tool (commit `542263a` famille : nouveau module sous flag implicite via ToolState). Voir aussi `deferred-work-wave-3.md` §flags section.

**Effort** : 2h (M dev, solo).

---

### W4-R-02 — Tool abstraction `{mousedown, mousemove, mouseup, cancel}`

**Blocked by** : W4-R-01.

**Files to create** :
  - `packages/ui/src/canvas-new/tools/Tool.ts` (interface — 25 lines)
  - `packages/ui/src/canvas-new/tools/ToolContext.ts` (type — 30 lines)
  - `packages/ui/src/canvas-new/tools/AtomTool.ts` (80 lines — factory)
  - `packages/ui/src/canvas-new/tools/BondTool.ts` (90 lines)
  - `packages/ui/src/canvas-new/tools/EraserTool.ts` (60 lines)
  - `packages/ui/src/canvas-new/tools/ToolRouter.ts` (70 lines — binds DOM listeners, dispatches to active tool, calls `cancel()` on switch)
  - `packages/ui/src/canvas-new/tools/index.ts` (barrel)

**Files to modify** :
  - `packages/ui/src/canvas-new/CanvasNew.tsx` (+120 lines : monte ToolRouter dans `useEffect`, attach listeners au `<canvas>`, propage `toolState.selectedTool`)

**Tests to add** :
  - `packages/ui/src/canvas-new/tools/__tests__/AtomTool.test.ts`
  - `packages/ui/src/canvas-new/tools/__tests__/BondTool.test.ts`
  - `packages/ui/src/canvas-new/tools/__tests__/EraserTool.test.ts`
  - `packages/ui/src/canvas-new/tools/__tests__/ToolRouter.test.ts` (bascule, cancel-on-switch)
  - `tests/e2e/canvas-new-tools.spec.ts` (E2E — chaque outil produit la mutation attendue)

**Commit** : `feat(canvas-new): tool abstraction with pointer lifecycle — wave-4 W4-R-02`

**Reference pattern** : Ketcher `ketcher-core/src/application/editor/tools/Base.ts`. Kendraw wave-2 hotkey registry (`group-label-hotkeys.ts`, commit historique `e76*`) pour l'approche factory fonctionnelle plutôt que classe.

**Effort** : 8h.

---

### W4-R-03 — Rendu Canvas 2D partagé

**Blocked by** : W4-R-02 (le ToolRouter doit être câblé pour recevoir un `CanvasRenderingContext2D`).

**Files to create** :
  - `packages/ui/src/canvas-new/render/renderLoop.ts` (60 lines — `requestAnimationFrame` throttlé 60 fps, abonné au `store.subscribe`, cleanup au unmount)
  - `packages/ui/src/canvas-new/render/__tests__/renderLoop.test.ts` (40 lines avec fake rAF)

**Files to modify** :
  - `packages/ui/src/canvas-new/CanvasNew.tsx` (+40 lines : branche renderLoop, configure DPR via `ctx.scale(dpr, dpr)` identique à `Canvas.tsx` L220-L260)

**Tests to add** :
  - unit ci-dessus
  - `tests/e2e/canvas-new-render-parity.spec.ts` (E2E — charge benzène+OH, screenshot ancien vs nouveau, tolérance 1px)

**Commit** : `feat(canvas-new): render loop via renderer-canvas — wave-4 W4-R-03`

**Reference pattern** : `Canvas.tsx:L150-L310` (setup DPR + update loop actuel). Réutilise `CanvasRenderer` **sans modifier** `packages/renderer-canvas/`.

**Effort** : 4h.

---

### W4-R-04 — HoverIcon atome et bond

**Blocked by** : W4-R-03 (besoin render loop + preview layer).

**Files to create** :
  - `packages/ui/src/canvas-new/render/previewLayer.ts` (90 lines — passe finale `ctx.globalAlpha=0.4`, CPK colors, halo/ghost bond)
  - `packages/ui/src/canvas-new/interactions/useHoveredItem.ts` (50 lines — hook lisant `store` + position souris via spatialIndex simple O(n))
  - `packages/ui/src/canvas-new/interactions/spatialIndex.ts` (40 lines — fallback O(n) hit-test si existant non exposé)

**Files to modify** :
  - `packages/ui/src/canvas-new/tools/AtomTool.ts` (+25 lines : `mousemove` → `ctx.setPreview({ kind: 'atom', element, pos })`)
  - `packages/ui/src/canvas-new/tools/BondTool.ts` (+30 lines : ghost bond from hoveredAtom to cursor)
  - `packages/ui/src/canvas-new/CanvasNew.tsx` (+15 lines : previewLayer dans render loop après document)

**Tests to add** :
  - `packages/ui/src/canvas-new/render/__tests__/previewLayer.test.ts`
  - `packages/ui/src/canvas-new/tools/__tests__/AtomTool.hover.test.ts` (setPreview avec CPK)
  - `tests/e2e/canvas-new-hover-preview.spec.ts` (screenshot hover)

**Commit** : `feat(canvas-new): hover preview atom/bond — wave-4 W4-R-04`

**Reference pattern** : Ketcher `ketcher-react/src/script/editor/Editor.ts` (hoverItem API). Kendraw wave-2 (`anchor-snap.ts`) pour le pattern de halo visuel.

**Effort** : 6h.

---

### W4-R-05 — Angle snap 15° par défaut, Shift=libre

**Blocked by** : W4-R-03 (visible feedback) ; utilise R-02 BondTool.

**Files to create** :
  - `packages/ui/src/canvas-new/interactions/snapAngle.ts` (40 lines — `fracAngle(a, step)` pur + hysteresis 0.5°)
  - `packages/ui/src/canvas-new/interactions/__tests__/snapAngle.test.ts` (24 angles + frontières hystérésis + Shift=libre + toggle 15/30)

**Files to modify** :
  - `packages/ui/src/canvas-new/tools/BondTool.ts` (+20 lines : consomme `snapAngle` avec `event.shiftKey` inverse gate)
  - `packages/ui/src/StatusBar.tsx` (+15 lines : affiche pas actif + "Shift pour libre")
  - `packages/ui/src/workspace-store.ts` (+10 lines : `angleSnapStep: 15 | 30` persisté, action `toggleAngleSnap()`)
  - `packages/ui/src/Canvas.tsx` (+5 lines : `Ctrl+E` handler bascule 15↔30 via workspace-store, **pas** de toggle on/off)
  - `packages/ui/src/__tests__/angle-snap.test.ts` (étendre avec cas 15°)

**Tests to add** :
  - unit ci-dessus
  - `tests/e2e/canvas-new-bond-snap.spec.ts` (drag bond → assert angle ∈ multiples 15° ; Shift → angle arbitraire)

**Commit** : `feat(canvas-new): angle snap 15° default + shift bypass — wave-4 W4-R-05`

**Reference pattern** : Ketcher `ketcher-core/src/application/editor/shared/utils.ts::fracAngle`. Kendraw wave-2 (grid snap test) pour l'approche pure-function testable.

**Effort** : 4h.

---

### W4-R-06 — Sélection rectangle marquee

**Blocked by** : W4-R-02 (tool contract) + R-03 (overlay rendering).

**Files to create** :
  - `packages/ui/src/canvas-new/tools/SelectMarqueeTool.ts` (140 lines — mousedown zone vide → rect ; item existant → click-select pass-through)
  - `packages/ui/src/canvas-new/interactions/selectionHitTest.ts` (80 lines — bbox intersect pour atoms/bonds/arrows/annotations/shapes ; XOR/add/set modes)
  - `packages/ui/src/canvas-new/render/selectionOverlay.ts` (70 lines — dashed rect + tinted fill + selected item outlines)

**Files to modify** :
  - `packages/ui/src/ToolPalette.tsx` (+20 lines : bouton SelectMarquee, icône, tooltip "V")
  - `packages/ui/src/group-label-hotkeys.ts` (+3 lines : `V` → select-marquee, gate sur non-ctrl/meta pour éviter conflit Ctrl+V paste)
  - `packages/ui/src/canvas-new/tools/index.ts` (+1 ligne)

**Tests to add** :
  - `packages/ui/src/canvas-new/interactions/__tests__/selectionHitTest.test.ts` (vide, full cover, partial, shift, ctrl)
  - `packages/ui/src/canvas-new/tools/__tests__/SelectMarqueeTool.test.ts` (Esc cancel, shift add, ctrl toggle)
  - `tests/e2e/canvas-new-marquee.spec.ts`

**Commit** : `feat(canvas-new): marquee selection tool — wave-4 W4-R-06`

**Reference pattern** : Ketcher `SelectBase.ts` lignes 200-350. Kendraw wave-3 fused-rings tool (`RingTemplate` pattern) pour tool factory avec preview.

**Effort** : 8h.

---

### W4-R-07 — Drag déplacement de sélection + snap live + undo atomique

**Blocked by** : W4-R-06 (besoin `selection` dans store) + R-05 (snap).

**Files to create** :
  - `packages/ui/src/canvas-new/interactions/dragMove.ts` (130 lines — calcul dx/dy, snap grid/anchor, merge detection)
  - `packages/ui/src/canvas-new/render/dragPreviewLayer.ts` (60 lines — translate visuel sans toucher store)
  - `packages/ui/src/canvas-new/interactions/__tests__/dragMove.test.ts`

**Files to modify** :
  - `packages/ui/src/canvas-new/tools/SelectMarqueeTool.ts` (+50 lines : mousedown sur item sélectionné → bascule en drag-move mode)
  - `packages/ui/src/workspace-store.ts` (+30 lines : action `translateSelection(dx, dy, mergeInfo?)` + single snapshot push)
  - `packages/ui/src/canvas-new/CanvasNew.tsx` (+10 lines : drag preview layer)
  - réutilise `packages/ui/src/anchor-snap.ts` sans modification

**Tests to add** :
  - unit ci-dessus
  - `tests/e2e/canvas-new-drag-move.spec.ts` (drag 3 atomes, assert translation + 1 seul Ctrl+Z revient état initial ; Esc cancel ; merge anchor)

**Commit** : `feat(canvas-new): drag-move selection with live snap + atomic undo — wave-4 W4-R-07`

**Reference pattern** : Ketcher `SelectBase.ts` mousemove L970-1100 + `Command.ts`. Kendraw wave-2 `anchor-snap.ts` + wave-3 undo/redo FIFO 200 snapshots (section 5 deferred-work-wave-3).

**Effort** : 12h (L — complexité interaction + merge + perf 60 fps sur 50 atomes).

---

### W4-R-08 — Touche `/` mini-panneau quick-edit

**Blocked by** : W4-R-04 (hovered item) ; indépendant de R-06/R-07 (peut paralléliser).

**Files to create** :
  - `packages/ui/src/canvas-new/interactions/quickEditPopover.tsx` (150 lines — popover flottant, champs extraits de PropertyPanel)
  - `packages/ui/src/canvas-new/interactions/useQuickEditHotkey.ts` (50 lines — écoute `/`, gate sur `isEditingTextNow()` + hoveredItem != null)
  - `packages/ui/src/canvas-new/interactions/__tests__/quickEditPopover.test.tsx`
  - `packages/ui/src/canvas-new/interactions/__tests__/useQuickEditHotkey.test.ts`

**Files to modify** :
  - `packages/ui/src/PropertyPanel.tsx` (extraction sous-composants `AtomQuickFields`, `BondQuickFields` — `~60` lignes déplacées, import inversé ; aucun changement visuel)
  - `packages/ui/src/workspace-store.ts` (+15 lines : `updateAtomProps`, `updateBondProps` si absents, single snapshot)
  - `packages/ui/src/canvas-new/CanvasNew.tsx` (+8 lines : monte `useQuickEditHotkey`)

**Tests to add** :
  - unit ci-dessus
  - `tests/e2e/canvas-new-quick-edit.spec.ts` (hover carbone, `/`, charge +1, Enter, Ctrl+Z)

**Commit** : `feat(canvas-new): slash quick-edit popover — wave-4 W4-R-08`

**Reference pattern** : Ketcher `ketcher-react/src/script/ui/action/hotkeys.ts`. Kendraw wave-4 P1 e-signature modal (commit `a2b8c9c`) pour le pattern popover + snapshot commit.

**Effort** : 5h.

---

## 2. Code scaffold sketch (≤30 lines total)

### `packages/ui/src/config/feature-flags.ts`

```ts
const raw = import.meta.env.VITE_ENABLE_NEW_CANVAS;
export const FEATURE_FLAGS = {
  newCanvas: raw === 'true',
} as const;
```

### `packages/ui/src/canvas-new/types.ts` — Tool interface

```ts
import type { SceneStore } from '@kendraw/scene';
import type { Point } from '@kendraw/scene';

export interface ToolContext {
  store: SceneStore;
  camera: { zoom: number; panX: number; panY: number };
  cursorWorld: Point;
  hoveredItem: { kind: 'atom' | 'bond'; id: string } | null;
  setPreview(preview: Preview | null): void;
}

export type Preview =
  | { kind: 'atom-ghost'; element: string; pos: Point }
  | { kind: 'bond-ghost'; from: Point; to: Point; order: 1 | 2 | 3 }
  | { kind: 'marquee'; rect: { x: number; y: number; w: number; h: number } };

export interface Tool {
  mousedown(ctx: ToolContext, e: PointerEvent): void;
  mousemove(ctx: ToolContext, e: PointerEvent): void;
  mouseup(ctx: ToolContext, e: PointerEvent): void;
  cancel(ctx: ToolContext): void;
  keydown?(ctx: ToolContext, e: KeyboardEvent): void;
}
```

### `packages/ui/src/canvas-new/CanvasNew.tsx` — shell

```tsx
export function CanvasNew(props: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doc = useSyncExternalStore(props.store.subscribe, props.store.getState);
  useRenderLoop(canvasRef, doc, props.camera);
  useToolRouter(canvasRef, props.store, props.toolState);
  return <canvas ref={canvasRef} className="canvas-new" />;
}
```

---

## 3. Reuse list (imports sans duplication)

Depuis `@kendraw/scene` (packages/scene/src) :
  - `createSceneStore`, `SceneStore`, `Document`, `Page`
  - `Atom`, `Bond`, `Arrow`, `Annotation`, `Shape`, `Group` (types)
  - `Point`, `AtomId`, `BondId`, etc. (branded IDs)
  - commands via `applyCommand` / store `dispatch`

Depuis `@kendraw/renderer-canvas` (packages/renderer-canvas/src) :
  - `CanvasRenderer`, `GRID_SIZE_PX`
  - types `Renderer`, `RenderSettings`, `GraphicOverlay`
  - **zero modification** — API publique uniquement (AC R-03-AC2)

Depuis `packages/ui/src/` (réutilisation interne) :
  - `workspace-store.ts` → `workspaceStore`, `WorkspaceState`
  - `ToolPalette.tsx` → `DEFAULT_TOOL_STATE`, `ToolState`, `ToolId` (ajout de `select-marquee` R-06)
  - `PropertyPanel.tsx` → extraire `AtomQuickFields`, `BondQuickFields` (R-08, sans régression)
  - `StatusBar.tsx` → affichage snap (R-05)
  - `anchor-snap.ts` → `snapArrowAnchor` (R-07 drag merge)
  - `group-label-hotkeys.ts` → `GROUP_LABEL_HOTKEYS` (R-06 ajout `V`)
  - `hooks/useIsEditingText.ts` → `isEditingTextNow` (R-08 gating `/`)

Depuis `@kendraw/io` :
  - `parseTextClipboard` (pas touché — Ctrl+V reste sur Canvas.tsx)

---

## 4. Estimated effort

| Story | Size | Hours (M dev solo) |
|---|---|---|
| W4-R-01 | S | 2 |
| W4-R-02 | M | 8 |
| W4-R-03 | S | 4 |
| W4-R-04 | M | 6 |
| W4-R-05 | S | 4 |
| W4-R-06 | M | 8 |
| W4-R-07 | L | 12 |
| W4-R-08 | S | 5 |
| **Total** | | **~49h** (≈6 jours pleins) |

Ajouter 20 % de buffer pour CI + fix lint/mypy/ruff/pytest/vitest/E2E : **~60h** réalistes.

---

## 5. Parallelization opportunities (fan-out subagents)

**Pendant l'impl du story principal, un subagent peut** :

1. **R-02** : subagent A écrit `AtomTool.test.ts`/`BondTool.test.ts`/`EraserTool.test.ts` pendant que le main thread écrit les factories.
2. **R-03** : subagent A écrit le test E2E `render-parity.spec.ts` (setup Playwright fixture benzène+OH) pendant que main écrit `renderLoop.ts`.
3. **R-04** : subagent A écrit `previewLayer.test.ts` (CPK colors fixtures) en parallèle ; subagent B prépare les screenshots de référence.
4. **R-06** : subagent A écrit `selectionHitTest.test.ts` (cas unitaires bbox) pendant que main écrit le tool ; subagent B dessine l'icône SelectMarquee pour `ToolPalette.tsx`.
5. **R-07** : subagent A implémente `translateSelection` dans workspace-store + tests pendant que main écrit `dragMove.ts`.
6. **R-08** : subagent A extrait `AtomQuickFields`/`BondQuickFields` de `PropertyPanel.tsx` + ajoute tests de non-régression du panneau droit pendant que main écrit `quickEditPopover.tsx`.

**Bornes hors fan-out** : R-01 trop court pour paralléliser ; R-05 (S) aussi.

---

## 6. What to explicitly NOT do in wave-4

Parqués en P1/P2/P3 (voir `deferred-work-wave-4.md` et §2.3 plan John) :

- **Lasso polygon selection** — R-06 livre marquee rectangulaire seul ; lasso réutilisera `selectionHitTest` en P1.
- **Rotate tool** — SelectBase de Ketcher a un handle de rotation, hors scope wave-4.
- **Command + Operation pattern** — on reste sur snapshots Immer FIFO 200 (section 11.5 analyse). Pas de `Command.ts` ni `Operation.ts`.
- **Pool<Id> générique** — pas réimplémenté, on garde le modèle immutable actuel (§11.5 analyse).
- **Dirty-tracking ReStruct-like** — volontairement rejeté (§R-03 AC) ; on re-peint tout à chaque frame sous 200 atomes.
- **Raphael.js / SVG renderer** — on reste Canvas 2D (§11.1 analyse).
- **Indigo WASM** — pas importé (§11.3).
- **Format KET natif** — pas ajouté, on garde MOL/CDXML/SMILES/KDX/JCAMP (§11.4).
- **Portal overlays custom** — on utilise le DOM React natif (§11.6).
- **Icônes SVG Ketcher** — icônes Kendraw conservées (§11.7).
- **Polymer editor, OCR, R-groups complexes** — hors scope (§11.8).
- **Périodic table modal** — sub-menu existant de ToolPalette suffit pour wave-4.
- **Responsive collapse threshold** — P1 futur wave, pas bloquant.
- **Rotation Escape behaviour** — tant qu'on n'a pas rotate tool, non pertinent.
- **Slash command `/` multi-token** — R-08 ouvre uniquement quick-edit, pas un parseur de commandes façon Notion.
- **Abbreviation lookup automatique** — détecté en hover façon Ketcher, reporté.
- **Migration complète de Canvas.tsx vers canvas-new** — wave-4 livre le flag à `false` par défaut ; la bascule globale est décision wave-5.

---

## 7. Exit criteria — « wave-4 redraw done » concrètement

- [ ] Les 8 stories W4-R-01 → W4-R-08 sont mergées sur `main` via PRs distinctes.
- [ ] `FEATURE_FLAGS.newCanvas = false` par défaut ; l'ancien `Canvas.tsx` reste la route de production et zéro test E2E régresse avec le flag `false`.
- [ ] Avec `VITE_ENABLE_NEW_CANVAS=true` :
  - [ ] Tous les outils R-02 (Atom/Bond/Eraser) créent/suppriment les entités attendues.
  - [ ] Rendu pixel-identique au canvas ancien sur la fixture de référence (benzène+OH), tolérance 1px.
  - [ ] Hover preview visible et non-persisté (aucun snapshot undo créé par mousemove).
  - [ ] Snap 15° actif par défaut, Shift=libre, StatusBar affiche le pas.
  - [ ] Marquee sélectionne bbox-intersect, Shift=add, Ctrl=toggle, Esc=cancel.
  - [ ] Drag-move translate live avec snap grid+anchor, single snapshot à mouseup, Esc cancel.
  - [ ] `/` ouvre quick-edit sur atome/bond survolé, Enter commit, Esc cancel, single snapshot.
- [ ] `CanvasNew.tsx` < 400 lignes (vs 1729 pour `Canvas.tsx`).
- [ ] CI 6 checks verts sur chaque PR (pnpm lint, pnpm typecheck, pnpm test, ruff check, ruff format --check, mypy, pytest).
- [ ] E2E Playwright suite : 7 nouveaux specs `canvas-new-*.spec.ts` verts + régression `tests/e2e/*.spec.ts` verte.
- [ ] Aucun fichier modifié dans `packages/scene/`, `packages/renderer-canvas/`, `packages/nmr/`, `packages/io/`, `packages/api-client/`, `backend/` (hors scope wave-4 redraw).
- [ ] Documentation : `deferred-work-wave-4.md` mis à jour avec ce qui reste en P1, et `docs/scratch/` nettoyé.
- [ ] Changelog mentionne « Canvas rewrite behind flag — enable via VITE_ENABLE_NEW_CANVAS=true ».
- [ ] Une persona B (Bastien, grad student) en dogfood bêta a donné son feedback sur au moins R-04 + R-05 + R-06 (engagement Mary, §2.4 plan).

---

## 8. Risques transverses à surveiller

- **T-01 divergence de rendu** : couvert par R-03 E2E screenshot parity.
- **T-02 taille CanvasNew.tsx** : contrainte stricte < 400 lignes, CI fail si dépassé (ajouter `size-limit` ou simple script `wc -l`).
- **T-03 régression raccourcis** : `group-label-hotkeys.ts` inchangé sauf ajout `V` ; test `shortcut-filter.test.ts` reste la barrière.
- **T-04 scope creep P1** : checklist §6 relue avant chaque PR.
- **T-05 friction CI** : Husky pre-commit déjà en place — chaque commit doit passer localement via `./scripts/full-check.sh`.
- **T-06 confusion utilisateur ancien/nouveau** : flag `false` par défaut, bannière visible si flag `true` ("Canvas expérimental wave-4").

---

## Summary (≤150 mots)

**Ordre** : R-01 (flag + shell) → R-02 (tool abstraction) → R-03 (render loop) en parallèle de R-06 (marquee) → R-04 (hover preview) → R-05 (snap 15°) en parallèle de R-08 (quick-edit /) → R-07 (drag-move, le plus lourd, bloqué par R-06).

**Top 3 dépendances critiques** :
1. R-02 Tool abstraction débloque R-04/R-05/R-06/R-07/R-08 — goulot #1.
2. R-06 Marquee selection est préalable à R-07 drag-move (sélection nécessaire avant translation).
3. R-04 HoverIcon préalable à R-08 quick-edit (`/` n'a de sens qu'avec `hoveredItem`).

**Effort total** ≈ 49h dev + 20 % buffer CI = **60h** (≈7 jours solo). Aucun paquet existant (`scene`, `renderer-canvas`, `nmr`, `io`, `api-client`) n'est modifié hors `ui`. `CanvasNew.tsx` ≤ 400 lignes, garanti par contrainte CI.

---

## 4. Test strategy et release gate (Murat)

> Section rédigée par 🧪 **Murat**, Master Test Architect — 613 lignes.

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

---

## 5. Convergence et handoff vers l'acte 4

Winston, Amelia et Murat s'alignent sur les constats suivants :

- **W4-R-01 est le pivot absolu** : sans le flag + le squelette, rien ne suit. Amelia estime 1 h, Murat 2 tests unit + 1 E2E flag=false, Winston confirme ADR-004.
- **W4-R-02 est le goulot d'étranglement technique** : l'interface Tool typée débloque 5 des 7 stories suivantes. Amelia priorise ; Murat exige ≥ 8 tests unit + 1 E2E ; Winston ADR-006.
- **W4-R-07 (drag-déplacement) est la plus lourde** (L) : elle est la dernière à livrer et conditionne la release gate critère 4 (régression visuelle).
- **La dette du double-canvas doit se refermer en 2 waves** : si Wave-5 ne valide pas la gate, une décision de retour en arrière doit être possible (feature flag → revert facile).

### Risques transverses retenus

| # | Risque | Owner | Mitigation |
|---|---|---|---|
| R1 | Divergence comportement ancien/nouveau canvas | Winston | E2E `@canvas-new` + QA manuelle panelists |
| R2 | Régression perf React render loops | Amelia | Profiler CI, budget 60 fps, `React.memo` sur hoverIcon |
| R3 | Flakiness rAF canvas | Murat | `waitForFunction` + `flushFrames()` test-only |
| R4 | DPR variable dev/CI | Murat | `device_scale_factor: 1` forcé Playwright |
| R5 | Double-canvas debt s'étend | Winston | Release gate ferme, ADR-002 revue en Wave-5 |
| R6 | Breaking change caché sur `.kdx` saved | Winston | ADR-003 additif-only, test de round-trip dans chaque story |
| R7 | Fan-out subagent touchant à des fichiers hors scope | Amelia | Briefing strict ; review avant commit |
| R8 | NMR panel casse avec nouveau canvas actif | Murat | Test régression obligatoire dans chaque story qui touche Canvas |

### Plan d'exécution Acte 4 (ordre Amelia, validé Winston + Murat)

Ordre final retenu :

1. **W4-R-01** — flag + shell `canvas-new/` (S, 1 h)
2. **W4-R-02** — Tool abstraction (M, 6 h) — goulot
3. **W4-R-03** — Render parity Canvas 2D (S, 2 h, parallèle possible)
4. **W4-R-06** — Marquee sélection (M, 6 h, parallèle à R-03)
5. **W4-R-04** — HoverIcon atome + bond (M, 6 h)
6. **W4-R-05** — Snap 15° Shift=libre (S, 3 h, parallèle à R-08)
7. **W4-R-08** — Quick-edit `/` (S, 3 h, dépend R-04)
8. **W4-R-07** — Drag-move + undo atomique (L, 16 h, le plus gros)

### Feature flag — forme finale (validé Winston ADR-004)

```ts
// packages/ui/src/config/feature-flags.ts
// Reimplemented from scratch for Kendraw.
export const FEATURE_FLAGS = {
  newCanvas: import.meta.env.VITE_ENABLE_NEW_CANVAS === 'true',
} as const;
```

Branche unique dans `App.tsx` :

```tsx
// packages/ui/src/App.tsx
const CanvasNew = lazy(() => import('./canvas-new/CanvasNew'));
// ...
{FEATURE_FLAGS.newCanvas ? <Suspense fallback={<Spinner/>}><CanvasNew {...props} /></Suspense> : <Canvas {...props} />}
```

### Release gate — 6 critères (rappel Murat)

Le flag ne flippera à `true` par défaut que si **tous** les critères suivants sont verts :

1. ✅ ~500 tests front + ~242 back + ~25 E2E legacy passent 100 % en flag=false
2. ✅ Suite `@canvas-new` 100 % verte en flag=true (≥ 60 unit + ≥ 10 E2E)
3. ✅ Coverage ≥ 80 % sur `canvas-new/**` (stmts/funcs/lines)
4. ✅ Régression visuelle ≤ 1 % pixel diff sur 10 molécules baseline
5. ✅ Validation manuelle 3 panelists V6 (Marina Volkov, Sophie Duval, Jason Park)
6. ✅ 5 runs CI consécutifs sans aucun flaky detect

**Cette wave-4 livre le P0 code ; la release gate est l'objet d'un commit Wave-5 de flip.**

---

## 6. Passage à l'acte 4

L'orchestrateur principal (main thread) prend le relais pour exécuter les 8 stories P0 selon l'ordre fixé ci-dessus. Chaque story suit le cycle :

1. Relire AC (§2 John) + UX (§4 Sally) + tests (§4 Murat).
2. Implémenter en clean room dans `packages/ui/src/canvas-new/`.
3. Écrire tests unit (Vitest) + E2E Playwright (`@canvas-new`).
4. Lancer 7 checks locaux (lint, typecheck, test front, ruff, ruff format, mypy, pytest).
5. Commit `feat(canvas-new): ... — wave-4 W4-R-XX`.
6. Pre-commit hook strict (jamais bypass).
7. `git push origin main`.

Les livrables finaux attendus en sortie d'acte 4 :

- 8 commits atomiques sur `main`, scopés `canvas-new`, wave-4 W4-R-XX.
- `docs/implementation-report-wave-4-redraw.md` rédigé.
- `docs/deferred-work-wave-4.md` mis à jour avec P1/P2/P3 parkés.
- `docs/THIRD-PARTY-NOTICES.md` créé, section « Design inspiration — Ketcher ».
- `README.md` mis à jour avec flag + chiffres.
- `docs/keyboard-shortcuts-compliance.md` à jour si nouveau raccourci.
