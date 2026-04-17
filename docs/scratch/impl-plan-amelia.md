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
