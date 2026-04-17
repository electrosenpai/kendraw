# Analyse Ketcher : Canvas et Interactions
*Étude propre (clean room) du codebase Ketcher pour inspiration en architecture de dessin*

## 1. Détection des Hotspots (Atomes, Liaisons, Zones Vides)

### Structure de Hit-Testing
Le mécanisme central de détection est **`closest.item()`** appelé via `editor.findItem()` :

**Fichier clé :** `/tmp/ketcher-reference/packages/ketcher-react/src/script/editor/shared/closest.ts`

- **Concept** : Cherche l'élément le plus proche du curseur parmi un ensemble de "maps" (atomes, liaisons, flèches, textes, etc.)
- **Distance seuil** : 0.4 unités pour les atomes (`SELECTION_DISTANCE_COEFFICIENT`), 0.32 pour les liaisons
- **Pas d'index spatial explicite** : Itère sur tous les éléments visibles (`restruct.visibleAtoms`, `restruct.visibleBonds`)
  - Pour petits graphes, acceptable ; à l'échelle de grosses molécules, pourrait être optimisé avec un quadtree/oct-tree

### Localisation par Géométrie
```typescript
// Exemple simplifié : distance point-vers-point (atome)
const dist = Vec2.dist(pos, atom.a.pp);
if (dist < minDist) {
  closestAtom = aid;
  minDist = dist;
}
```

Pour les **liaisons**, calcul de distance point-vers-segment :
- Point médian de la liaison
- Projection orthogonale si plus proche que les extrémités

Pour les **textes/objets simples**, bounding box + clamping des coordonnées, puis distance euclidienne.

### Sélection Polygonale vs Rectangulaire
**Fichier** : `/tmp/ketcher-reference/packages/ketcher-react/src/script/editor/tool/select/select.ts` + `helper/lasso.ts`

- **Mode lasso** (0) : Construit un polygone point par point, utilise `locate.inPolygon()`
- **Mode marquee/rectangle** (1) : Deux points définissent le rectangle, utilise `locate.inRectangle()`
- Sélection XOR si Shift pressé : `selMerge(selection, addedItems, reversible=true)`

---

## 2. Hover, Curseur et Indicateurs Visuels

### Système de Hover
**Fichier principal** : `/tmp/ketcher-reference/packages/ketcher-react/src/script/editor/Editor.ts`

```typescript
hover(ci: HoverTarget | null, newTool?: any, event?: PointerEvent) {
  // Récupère l'état de hover précédent
  const hoverState = (tool as { ci?: HoverTarget }).ci;

  // Désactive le hover précédent si change de map ou d'ID
  if (hoverState && /* condition */) {
    setHover(hoverState, false, this.render);
    delete (tool as { ci?: HoverTarget }).ci;
  }

  // Active le nouveau hover
  if (ci && setHover(ci, true, this.render)) {
    tool.ci = ci;
  }
}
```

### Changement de Curseur et Icône
**Fichier** : `/tmp/ketcher-reference/packages/ketcher-react/src/script/editor/tool/atom.ts`

```typescript
constructor(editor, atomProps) {
  // ...
  this.editor.hoverIcon.show();
  this.editor.hoverIcon.label = atomProps.label;  // "C", "N", etc.
  this.editor.hoverIcon.fill = ElementColor[atomProps.label];
  this.editor.hoverIcon.updatePosition();  // Suit le curseur
}
```

- **hoverIcon** : élément UI qui affiche l'atome prévisible sous le curseur, mis à jour en temps réel
- Curseur changed via `editor.event.cursor.dispatch({ status: 'move' })` dans la main tool

### Fonction setHover
Définit la surlignance visuelle sur l'élément : structure réactive Raphael qui ajoute/retire des classes de style.

---

## 3. Clicks, Création d'Atomes et Liaisons

### Tool Pattern
Chaque outil implémente l'interface `Tool` avec : `mousedown()`, `mousemove()`, `mouseup()`, `mouseleave()`, `cancel()`

**AtomTool** (`atom.ts`) :
- **mousedown** : Attend un clic simple (pas de drag pour créer un atome)
- Action créée : `fromAtomAddition()` → ajoute un atome aux coordonnées du clic
- Si atomes sélectionnés, modifie leurs propriétés : `fromAtomsAttrs()`

**BondTool** (`bond.ts`) :
- **mousedown** : Sauve position initiale (`dragCtx.xy0`)
- **mousemove** : Calcul d'angle et affichage temps réel (`event.ctrlKey` → pas de snap d'angle)
- **mouseup** : Crée la liaison via `fromBondAddition()`

### Flux Événement
```
DOM click
  ↓
Tool.mousedown()
  ├─ Détecte item via editor.findItem()
  ├─ Sauve state (dragCtx)
  └─ Crée prévisualisation
  ↓
Tool.mousemove() (en drag)
  ├─ Recalcule géométrie (angle, positions)
  └─ Update rendu (prévisualisation temps réel)
  ↓
Tool.mouseup()
  ├─ Crée Action (fromBondAddition, etc.)
  ├─ Appelle editor.update(action)
  └─ Déclenche re-render
  ↓
ReStruct.update()
  └─ Redessine canvas
```

### Angle Snap et Contraintes
```typescript
let angle = vectorUtils.calcAngle(dragCtx.xy0, pos);
if (!event.ctrlKey)
  angle = vectorUtils.fracAngle(angle, null);  // Snap à angles discrets
```
- **Ctrl+drag** : Angle libre
- **Drag normal** : Snap à ~15° ou 30° (fracAngle)
- **Alt+drag** : Dupliquer la liaison (détecté en drag)

---

## 4. Drag, Angles Automatiques et Contraintes

### Résolution des Extrémités de Liaison
**Méthode** : `handleBondDrag()` → `resolveAtomDragTarget()` / `resolveCanvasDragTarget()`

```typescript
let endAtom = editor.findItem(event, ['atoms'], dragCtx.item);
// Si pas d'atome cible → crée un nouvel atome
```

### Snap d'Angle (Shift implicite par absence de Ctrl)
- Angles prédéfinis : 0°, 30°, 60°, 90°, 120°, 150°, 180°
- Récupérés via `vectorUtils.fracAngle()` (implémentation côté ketcher-core)
- Message en temps réel : `editor.event.message.dispatch({ info: degrees + 'º' })`

### Duplication et Alt
- **Alt+drag** déclenche un mode "dupliquer la liaison"
- Détecté via `event.altKey` dans les handlers

---

## 5. Sélection : Lasso vs Marquee vs Click+Shift

### Modes dans SelectTool

**Fichier** : `/tmp/ketcher-reference/packages/ketcher-react/src/script/editor/tool/select/select.ts`

```typescript
constructor(editor: Editor, mode: SelectMode) {
  this.#mode = mode;  // 'lasso' | 'select' | 'fragment'
  this.#lassoHelper = new LassoHelper(
    this.#mode === 'lasso' ? 0 : 1,  // 0=lasso polygon, 1=marquee rect
    editor,
    this.#mode === 'fragment'
  );
}
```

### Mécanique de Sélection
- **Click sur item** : Sélectionne si Shift enfoncé → XOR (toggle), sinon remplace
- **Click sur vide + drag** : Lance marquee ou lasso selon mode
- **getNewSelectedItems()** : Inclut aussi les sgroups (super-atoms) parent

### Merge et XOR
```typescript
selMerge(selection, add, reversible: boolean) {
  // reversible=true → XOR (Shift)
  // reversible=false → union classique
}
```

---

## 6. Zoom et Pan

### Pan (Main Tool)
**Fichier** : `/tmp/ketcher-reference/packages/ketcher-react/src/script/editor/tool/hand.ts`

```typescript
mousemove(event) {
  if (this.begPos == null) return;
  const diff = Vec2.diff(this.endPos, this.begPos)
    .scaled(1 / rnd.options.zoom);
  this.begPos = this.endPos;

  rnd.setViewBox((prev) => ({
    ...prev,
    minX: prev.minX - diff.x,
    minY: prev.minY - diff.y,
  }));
}
```
- Drag simple translate la `viewBox` (pan)
- Mise à l'échelle par `1 / zoom` pour que le mouvement soit proportionnel au niveau de zoom

### Zoom
**Fichier** : `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/tools/Zoom.ts`

```typescript
initActions() {
  this.zoom = zoom<SVGSVGElement, void>()
    .scaleExtent([this.MINZOOMSCALE, this.MAXZOOMSCALE])  // [0.2, 4]
    .wheelDelta(this.defaultWheelDelta)
    .filter((e) => {
      e.preventDefault();
      if (e.ctrlKey && e.type === 'wheel') return true;
      return false;
    });
}
```

- **Ctrl + wheel** : Zoom in/out
- Limites : 0.2x (20%) à 4x (400%)
- D3-zoom gère la transformation centrée sur la souris automatiquement

---

## 7. Moteur de Rendu

### Technologie
**Fichier** : `/tmp/ketcher-reference/packages/ketcher-core/src/application/render/raphaelRender.ts`

- **SVG** via **Raphael.js** (wrapper sur SVG)
- Pas de Canvas 2D natif
- Éléments graphiques : `paper.rect()`, `paper.path()`, `paper.text()`, etc.

### Couches et ReStruct
```typescript
export class Render {
  public readonly paper: RaphaelPaper;  // SVG DOM
  public ctab: ReStruct;                // Structure renderable
  public viewBox!: ViewBox;             // Région visible
}
```

**ReStruct** encapsule :
- `visibleAtoms`, `visibleBonds` (Maps indexées)
- `restruct.atoms`, `restruct.bonds` (wrappers Raphael)
- Méthodes de rendu : `update()`, `update(needReverse)`

### Update et Dirty Tracking
```typescript
this.ctab.update(true);  // true = full update
// ou
this.ctab.update(false); // Minimal update
```
- Ketcher utilise dirty-bit ou full re-render selon le contexte
- Rendu via boucle sur éléments avec mise à jour de propriétés Raphael (stroke, fill, etc.)

---

## 8. Flux Événement : DOM → Tool → Action → Modèle → Re-Render

### Pipeline Complet
```
Window/Canvas mousedown/mousemove/mouseup
  ↓
Editor.subscribeRender() (event listener)
  ├─ Extrait position page → model coords (CoordinateTransformation.pageToModel)
  ├─ Trouve item cible (editor.findItem)
  └─ Appelle tool.{mousedown|mousemove|mouseup}(event)
  ↓
Tool Method
  ├─ Crée dragCtx si drag démarre
  ├─ Appelle editor.hover(ci) pour mise à jour visuelle
  └─ Retourne true (event consommé) ou undefined
  ↓
Si création/modif détectée :
  ├─ Crée Action (Action = classe serializable de modification)
  │  Exemples : fromAtomAddition, fromBondAddition, fromMultipleMove
  └─ Appelle editor.update(action)
  ↓
Editor.update(action)
  ├─ Exécute action.perform(ctab)  // Modifie la structure
  ├─ Appelle render.update()
  └─ Dispatch event.change (pour undo/redo, export, etc.)
  ↓
Render.update()
  └─ ReStruct.update() → Redessine éléments Raphael
```

### Transformation Coordonnées
**Fichier** : `/tmp/ketcher-reference/packages/ketcher-core/src/application/render/coordinateTransformation.ts`

```typescript
static pageToModel(event, render) {
  // Convertit event.clientX/Y → coordonnées du modèle chimique
  // Applique inverse de viewBox, zoom, offset
}
```

---

## Patterns à Réutiliser dans Kendraw

### 1. **Hit-Testing avec Seuil de Distance**
   - Itération sur éléments visibles + distance euclidienne
   - Pour optimisation future : spatial index (quadtree/R-tree)
   - Seuils distincts par type (atomes 0.4, liaisons 0.32)

### 2. **Tool Pattern avec État Drag**
   - Interface `Tool` simple : 5 méthodes clés
   - `dragCtx` sauvegarde l'état entre mousedown/mousemove/mouseup
   - Permet drag interruptible et cancel propre

### 3. **Hover Décuplé de Sélection**
   - Hover = simple surlignance temporaire
   - Sélection = état persistant
   - Deux canaux distincts (`editor.hover()` vs `editor.selection()`)

### 4. **Angle Snap via Lookup Discret**
   - Pas de IK/contrainte complexe
   - Simple arrondi à angles prédéfinis (30°, 60°, 90°, etc.)
   - Ctrl/Alt pour modifier comportement

### 5. **ViewBox et Lazy Re-Render**
   - Pas de canvas full-clear à chaque frame
   - SVG Raphael met à jour attributs incrementalement
   - viewBox + offset gère pan/zoom élégamment

### 6. **Selection XOR Élégante**
   - `selMerge(sel, add, reversible)` centralise logique
   - Shift → toggle, pas de Shift → remplacement
   - Fonctionne pour atomes + liaisons + sgroups

### 7. **Prévisualisation Temps Réel en Drag**
   - Message affichée (ex: "45º") pendant drag
   - Hint géométrique avant finalisation
   - Découple aperçu et commit final

### 8. **Foncteur Action pour Undo/Redo**
   - Classe `Action` sérialisable avec `.perform(ctab)` et `.revert()`
   - Permettrait easy undo sans replay
   - Ketcher structure bien ce pattern

---

## Patterns à Éviter / Overengineered

### 1. **Raphael.js Comme Couche d'Abstraction**
   - Raphael ajoute couche indirection sur SVG
   - Moderne : utiliser SVG/Canvas 2D directement ou THREE.js
   - Kendraw pourrait gagner en perf/simplicité

### 2. **Pas d'Index Spatial Global**
   - Hit-test O(n) sur chaque mousemove
   - Ketcher scalable car molécules petites (~100 atomes)
   - Si Kendraw grossit : quadtree/BVH indispensable

### 3. **ReStruct Mutable Partagée**
   - ReStruct = état mutable global
   - Tricky pour concurrence ou undo
   - Ketcher mitige avec immutable Actions

### 4. **Zoom Min/Max Hardcodé**
   - [0.2, 4] codé, pas configurable
   - Limite pour sketches très petits ou très gros

### 5. **LassoHelper Stateful**
   - `points`, `selection` mutables
   - Pourrait être plus fonctionnel

---

**Conclusion** : Ketcher offre patterns solides pour éditeur chimique. Ses forces : hit-test simple, tool abstraction claire, hover/select découplé. Faiblesses : pas d'index spatial (OK pour petit graphe), Raphael overhead, ReStruct mutable.
