# Analyse Ketcher — Wave-4 Redraw Kendraw

> Étude « clean room » du code source Ketcher (EPAM Systems, Apache 2.0)
> conduite entre le 17 avril 2026 avec 6 sous-agents de recherche en parallèle.
> Référence étudiée : `https://github.com/epam/ketcher` — clone local en lecture
> seule à `/tmp/ketcher-reference/` (2400 lignes d'analyse produites).
>
> **Aucun code Ketcher n'est copié dans Kendraw.** Ce document est une
> cartographie conceptuelle des patterns UX, algorithmes et architectures
> que Ketcher déploie, avec pour chaque section une recommandation de
> réimplémentation propre et idiomatique pour la stack Kendraw
> (React 18 + Zustand + Immer + Canvas 2D + FastAPI/RDKit).

---

## Table des matières

- [1. Introduction et approche clean room](#1-introduction-et-approche-clean-room)
- [2. Canvas et interactions](#2-canvas-et-interactions) *(ex-1.1)*
- [3. Data model, actions, undo/redo, formats](#3-data-model-actions-undoredo-formats) *(ex-1.2)*
- [4. Toolbox gauche et toolbar haute](#4-toolbox-gauche-et-toolbar-haute) *(ex-1.3/1.4)*
- [5. Raccourcis clavier](#5-raccourcis-clavier) *(ex-1.5)*
- [6. Sélection, transformations, interactions globales](#6-selection-transformations-interactions-globales)
- [7. Algorithmes de rendu et chimie](#7-algorithmes-de-rendu-et-chimie) *(ex-1.6)*
- [8. Tableau comparatif Kendraw / Ketcher / ChemDraw](#8-tableau-comparatif-kendraw--ketcher--chemdraw)
- [9. Liste priorisée P0 / P1 / P2 / P3](#9-liste-priorisee-p0--p1--p2--p3)
- [10. Ce que Kendraw garde tel quel](#10-ce-que-kendraw-garde-tel-quel)
- [11. Ce que Kendraw NE reprend PAS et pourquoi](#11-ce-que-kendraw-ne-reprend-pas-et-pourquoi)

---

## 1. Introduction et approche clean room

### 1.1 Pourquoi Ketcher ?

Ketcher est la référence open source en édition de structures chimiques 2D,
développée par EPAM Systems depuis 2007, utilisée en production par Merck,
Pfizer, AstraZeneca et bien d'autres. Sa base de code TypeScript/React est
mature (≈200k lignes), testée sur le terrain, et — point déterminant —
sous licence Apache 2.0, compatible avec notre licence MIT.

Ce qui nous intéresse dans Ketcher, et que ChemDraw ne nous donne pas :

- un **modèle mental ouvert** de ce à quoi ressemble une expérience de
  dessin chimique moderne, centrée sur les hotspots, le snap d'angle et
  la tool-abstraction ;
- des **patterns d'implémentation** concrets : comment détecter un hotspot,
  comment composer actions + undo, comment organiser des sous-menus
  responsive, comment normaliser un event clavier multi-plateforme ;
- une **preuve d'échelle** : si Ketcher rend une molécule de 150 atomes à
  60 fps côté client sans moteur spatial évolué, cela dit quelque chose
  sur les seuils de performance réels d'un éditeur de ce type.

### 1.2 Ce que l'on n'achète pas en lisant Ketcher

- Les choix de stack historiques (Raphael.js, Inferno puis React, MobX)
  sont **conditionnés par une base 2007**. Kendraw en tire les
  *principes*, pas les *bibliothèques*.
- L'intrication `Struct` ↔ `ReStruct` ↔ `Editor` est profondément
  couplée à Raphael et à l'immutabilité de façade. Notre Immer + Zustand
  est déjà plus propre — on ne régresse pas.
- Ketcher déporte beaucoup de cheminformatique vers un service Indigo
  (WASM/Java). **Kendraw garde RDKit côté backend FastAPI** : pas de
  migration nécessaire.

### 1.3 Règles de clean room appliquées dans cette wave

1. Aucun copier-coller de code Ketcher, même une ligne identifiable.
2. Lecture du code Ketcher comme référence conceptuelle uniquement.
3. Chaque fichier Kendraw inspiré d'un pattern Ketcher porte l'en-tête :

   ```ts
   // Design inspired by Ketcher (EPAM Systems, Apache 2.0)
   // Original: https://github.com/epam/ketcher
   // Reimplemented from scratch for Kendraw.
   ```

4. `docs/THIRD-PARTY-NOTICES.md` crédite Ketcher en section
   « Design inspiration » sans embarquer la licence (aucun code embarqué).
5. Les icônes Ketcher ne sont PAS copiées. Kendraw utilise ses icônes
   textuelles existantes ou Lucide/Heroicons (MIT/ISC).
6. Les **algorithmes** (angle snap, formule de fracAngle, géométrie
   wedge/hash, règles d'affichage des hydrogènes implicites) ne sont
   pas copyrightables — mais chaque transposition est commentée avec
   la source Ketcher pour traçabilité.

### 1.4 Méthodologie de l'analyse

Six sous-agents Explore lancés en parallèle, chacun ciblant une facette :

| # | Section | Fichier scratch | Lignes |
|---|---------|-----------------|--------|
| 1 | Canvas et interactions | `ketcher-acte1-canvas.md` | 379 |
| 2 | Data model / actions / undo | `ketcher-acte1-datamodel.md` | 463 |
| 3 | Toolbox gauche et toolbar haute | `ketcher-acte1-toolbox.md` | 409 |
| 4 | Raccourcis clavier | `ketcher-acte1-hotkeys.md` | 501 |
| 5 | Sélection + transformations | `ketcher-acte1-selection.md` | 358 |
| 6 | Algorithmes (rendu + chimie) | `ketcher-acte1-algorithms.md` | 290 |

Durée totale d'analyse : ~3 minutes (parallélisé) pour ~2400 lignes de
notes primaires. Ce présent document les consolide, ajoute une synthèse
comparative et priorise ce que Kendraw doit absolument reprendre.

---

## 2. Canvas et interactions


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


---

## 3. Data model, actions, undo/redo, formats


## 1. Représentation du Graphe Moléculaire

### Structure Domaine Ketcher

Ketcher représente une molécule (Struct) comme un **composite hiérarchique** d'entités :

**Fichier clé:** `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/struct.ts`

```
class Struct {
  atoms: Pool<Atom>           // Pool<T> extends Map<number, T>
  bonds: Pool<Bond>           // IDs auto-incrémentés depuis 0
  sgroups: Pool<SGroup>       // Superatomes (groupes fonctionnels)
  rxnArrows: Pool<RxnArrow>   // Flèches réaction
  rxnPluses: Pool<RxnPlus>    // Symboles +
  frags: Pool<Fragment>       // Fragments (stéréo, composantes)
  rgroups: Pool<RGroup>       // R-groupes
  texts: Pool<Text>
  simpleObjects: Pool<SimpleObject>
  images: Pool<Image>
}
```

**Pool Pattern:** `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/pool.ts`

```typescript
class Pool<T> extends Map<number, T> {
  private nextId = 0;
  add(item: T): number  // Returns auto-incremented ID
  clone(): Pool<T>      // Shallow clone + preserve nextId
}
```

**Points clés :**
- **IDs numériques immutables** : chaque Atom, Bond a un ID stable (number) dans sa Pool
- **Map<number, T>** pour accès O(1) par ID
- **Pas de chaînes d'adjacence stockées** : voisins calculés par traversal des Bonds
- **Fragment pooling** : chaque atome appartient à un Fragment (composante connexe)

### Atom & Bond

**Fichier:** `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/atom.ts`

```typescript
interface Atom {
  label?: string              // Label explicite
  charge: number
  radicalCount: 0 | 1 | 2
  isotope?: number
  stereo?: number             // Parité stéréo
  xxx: string                 // Internal flag
  attachmentPoints?: number   // Pour R-groupes
}
```

**Fichier:** `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/bond.ts`

```typescript
interface Bond {
  begin: number;  end: number     // Atom IDs
  type: number                    // SINGLE=1, DOUBLE=2, TRIPLE=3, AROMATIC=4, etc.
  stereo: number                  // NONE=0, UP=1, DOWN=6, etc.
  topology?: number               // RING=1, CHAIN=2
  cip?: string                    // R/S CIP descriptor
}
```

### SGroups, RxnArrow, RxnPlus

**SGroup** (Superatom / Groupe fonctionnel) `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/sgroup.ts`

```typescript
class SGroup {
  type: string        // 'SUP', 'MUL', 'SRU', 'MON', etc.
  id: number
  label: number
  atoms: Pile         // Ensemble d'atoms IDs
  bonds: Pile         // Ensemble de bonds IDs
  bracketBox?: Box2Abs
  sgroupData?: Map    // Propriétés type-spécifiques
}
```

**RxnArrow/RxnPlus** : entités distinctes pour la cartographie réaction et schémas mécanisme.

---

## 2. Motif de Mutations : Command + Operation

### Architecture Command-Operation

Ketcher n'est **pas immutable au niveau domaine**, mais utilise un motif **Command réversible** :

**Fichier:** `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/Command.ts`

```typescript
class Command {
  operations: Operation[] = [];

  addOperation(op: Operation) { ... }
  merge(other: Command) { ... }
  invert(renderersManager) {     // Inverse l'ordre ou tri par priority
    const ops = this.undoOperationReverse
      ? this.operations.slice().reverse()
      : [...this.operations];
    ops.forEach(op => op.invert(renderersManager));
  }
  execute(renderersManager) {
    this.operations.forEach(op => op.execute(renderersManager));
  }
}
```

**Fichier:** `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/Operation.ts`

```typescript
interface Operation {
  priority?: number;
  execute(renderersManager: RenderersManager): void;
  invert(renderersManager: RenderersManager): void;
  executeAfterAllOperations?: () => void;
  invertAfterAllOperations?: () => void;
}
```

**Pattern clé :**
- **Operations sont mutuelles** : chaque `execute()` **modifie Struct directement**
- **Reversibilité par inversion** : `invert()` annule les changements (ex: remove devient add)
- **Compositions** : `Command` groupe N opérations ; `merge()` applique plusieurs commands en un
- **Post-processing** : hooks `executeAfterAllOperations` pour recalcs dépendances (layout, stéréo)

---

## 3. Histoire Undo/Redo

### EditorHistory Stack

**Fichier:** `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/EditorHistory.ts`

```typescript
class EditorHistory {
  historyStack: Command[] = [];
  historyPointer = 0;

  update(command: Command, mergeWithLatest?: boolean) {
    if (mergeWithLatest && latestCmd) {
      latestCmd.merge(command);  // Fusionne opérations
    } else {
      this.historyStack.splice(this.historyPointer, ..., command);
      this.historyPointer = this.historyStack.length;
    }
  }

  undo() {
    this.historyStack[--this.historyPointer].invert(editor.renderers);
  }

  redo() {
    this.historyStack[this.historyPointer++].execute(editor.renderers);
  }
}
```

**Propriétés :**
- **Fixed size = 32** commands max (FIFO ancien quand débordement)
- **Pointer-based** : `historyPointer` marque la position actuelle
- **Merge optional** : certains outils (drag) fusionnent mouvements successifs
- **Singleton pattern** : une instance par Editor (session)

---

## 4. Format KET (JSON Natif)

### Schéma KET

**Fichier:** `/tmp/ketcher-reference/packages/ketcher-core/src/domain/serializers/ket/ketSerializer.ts`

Exemple d'extrait (du test data) :

```json
{
  "root": {
    "nodes": [
      { "$ref": "mol0" },
      { "$ref": "mol1" },
      { "type": "arrow", "data": { "mode": "open-angle", "pos": [...] } },
      { "type": "text", "data": { "content": "...", "position": {...} } }
    ]
  },
  "mol0": {
    "type": "molecule",
    "atoms": [
      { "id": 0, "label": "C", "x": 0.5, "y": 0, "z": 0, "charge": 0, ... },
      { "id": 1, "label": "O", "x": 1.5, "y": 0, "z": 0, ... }
    ],
    "bonds": [
      { "id": 0, "type": 1, "atoms": [0, 1], "stereo": 0, ... }
    ],
    "sgroups": [ ... ]
  }
}
```

**Répertoires sérialisation :**
- `/tmp/ketcher-reference/packages/ketcher-core/src/domain/serializers/ket/toKet/` — Struct → KET
- `/tmp/ketcher-reference/packages/ketcher-core/src/domain/serializers/ket/fromKet/` — KET → Struct

**Propriétés KET :**
- **$ref** : références globales à `mol<N>`, `rg<N>`, etc.
- **Arrowhead modes** : open-angle, filled-triangle, etc.
- **Text** : Rich text encodé en JSON (Draft.js format historique)
- **Roundtrip** : KET → Struct → KET préserve positions et métadonnées

---

## 5. Struct vs ReStruct

### Séparation Domaine ↔ Rendu

**Struct = modèle domaine immutable-ish** : contient Atoms, Bonds, SGroups
**ReStruct = cache rendu perphérique** : cache visibilité, layers, marks

**Fichier:** `/tmp/ketcher-reference/packages/ketcher-core/src/application/render/restruct/restruct.ts`

```typescript
class ReStruct {
  molecule: Struct;
  atoms: Map<number, ReAtom>;     // Struct.atoms → ReAtom (visual cache)
  bonds: Map<number, ReBond>;
  visibleAtoms: Map<number, ReAtom>;
  visibleBonds: Map<number, ReBond>;
  rxnPluses: Map<number, ReRxnPlus>;
  rxnArrows: Map<number, ReRxnArrow>;
  // ... change tracking maps
  atomsChanged: Map<number, 1>;
  bondsChanged: Map<number, ReEnhancedFlag>;

  static readonly maps = {
    atoms: ReAtom,
    bonds: ReBond,
    sgroups: ReSGroup,
    // ...
  };
}
```

**Flux :**
1. Tool modifie Struct → crée Command
2. Command.execute() mute Struct
3. EditorHistory.update(command)
4. **Renderer** recrée ReStruct partiellement (dirty-tracking)
5. ReStruct peint canvas (Raphael)

---

## 6. Fragment Indexing & Voisinage

### Pool IDs vs Neighbors

**Pas de liste d'adjacence stockée sur Atom** ; voisinage dérivé :

```typescript
// Pseudo : Struct.getNeighbors(atomId: number): Neighbor[]
// Itère bonds, cherche ceux où begin === atomId || end === atomId
```

**Fragment** : ensemble d'atoms + bonds formant composante connexe
- Chaque Atom.fragment pointe vers Fragment ID
- Fragment est une Pile (bitvector-like Set)
- Utilisé pour: sélection, copie, calculs stéréo

**Pile** (`/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/pile.ts`) — Set de number IDs, optimisé.

---

## 7. Patterns Ketcher à Réutiliser pour Kendraw

### 7.1 Pool Générique pour ID Management
```
✓ Utiliser Map<string, T> (Kendraw utilise IDs string pour UUID)
✓ Préserver nextId pour génération IDs auto si nécessaire
✓ clone() pour snapshots (undo/redo)
```

### 7.2 Command + Operation Réversible
```
✓ Chaque mutation (add/remove/update) = une Command avec Operation[]
✓ invert() annule via opération inverse (add→remove, etc.)
✓ Grouper mouvements atomiques en une Command pour undo atomique
✓ Merge() pour drag interactif : fusionner move-atom commands
```

### 7.3 EditorHistory Pointer-Based
```
✓ Stack de Commands (non opérations directes)
✓ historyPointer index la position
✓ undo() : invert() commande passée
✓ redo() : execute() commande suivante
✓ Limiter taille (32 ou configurable)
```

### 7.4 Dirty-Tracking pour Rendu
```
✓ Maintenir Maps de "changed" pour chaque type d'entité
✓ Renderer itère seulement changed, reconstruit Gizmos
✓ Appelle reinitializeViewModel() après mutation + render post-ops
```

### 7.5 Format Persistence
```
✓ JSON natif avec $ref pour références croisées
✓ Arrondir positions aux précisions mol (0.01 pixels ≈)
✓ Sérialiser métadonnées : copyright, timestamps, versions schéma
```

---

## 8. Kendraw Actuellement Fait Différemment — Ce Qui Change/Persiste

### Kendraw Fait (Scene Package)

**Fichier:** `/home/debian/kendraw/packages/scene/src/types.ts`

```typescript
// IDs string (UUID), pas numbers
type AtomId = string & { __brand: 'AtomId' };
type BondId = string & { __brand: 'BondId' };

// Atoms dans Record<AtomId, Atom> au lieu Pool
type Page = {
  atoms: Record<AtomId, Atom>;
  bonds: Record<BondId, Bond>;
  arrows: Record<ArrowId, Arrow>;
}
```

**Fichier:** `/home/debian/kendraw/packages/scene/src/store.ts`

```typescript
// Zustand + Immer pour mutations immutables
function applyCommand(state: Document, command: Command) {
  const next = produce(state, (draft) => {
    // Mutations "normales", Immer track changes
  });
  return { next, diff: SceneDiff };
}

// Store expose undo/redo
export interface SceneStore {
  getState(): Document;
  dispatch(command: Command): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}
```

**Fichier:** `/home/debian/kendraw/packages/scene/src/commands.ts`

```typescript
// Union de command types
type Command =
  | AddAtomCommand
  | RemoveAtomCommand
  | MoveAtomCommand
  | UpdateAtomCommand
  | ...

// Plus SceneDiff pour reconciliation UI
type SceneDiff =
  | { type: 'atom-added'; id: AtomId }
  | { type: 'atom-moved'; id: AtomId }
  | ...
```

### 📊 Comparaison Tableau

| Aspect | Ketcher | Kendraw | Recommandation |
|--------|---------|---------|-----------------|
| **ID Storage** | `Pool<T>` (Map<num, T>) | `Record<Id, T>` (objects) | Record plus idiomatic TS, garder |
| **Mutation** | Direct mutations + Command.invert() | Immer immutable snapshots | Immer + undo stack = OK ; persist Command pour redo efficace |
| **Undo/Redo** | EditorHistory.invert() Commands | Immer snapshots (stateful) | Ajouter ExecCommand protocol ; diff snapshots pour rendu delta |
| **Reversibility** | Opération ↔ Opération inverse | No (snapshots) | **À ajouter** : Command doit être réversible (invert()) |
| **Format** | KET (JSON) + MOL | (à définir) | Adopter KET-like avec $ref pour schémas |
| **SGroup** | Pool<SGroup> avec Pile members | Groups (atomIds[], bondIds[]) | Kendraw Groups ≈ SGroup ; OK |
| **Fragment** | Pool<Fragment> par composante | Implicite (par traversal) | Kendraw peut traiter implicitement (plus simple) |
| **Arrows** | RxnArrow type enum (5 types) | Arrow with type union (7 types) | Kendraw a plus flèches ; OK |

---

## 9. Changements Recommandés pour Kendraw

### Phase A — Court Terme (Maintenant)

1. **Command réversibilité** : chaque Command crée un "inverse" (pour redo vrai).
   - Actuellement Immer snapshots ; garder mais ajouter protocole `Command.invert()`.

2. **Differential rendering** : dirty-tracking par type entité.
   - SceneDiff déjà existe ; améliorer pour renderer seulement changed items.

3. **EditorHistory-like** : pointer-based undo/redo.
   - Remplacer snapshots bruts par Command objects + history pointer.

### Phase B — Moyen Terme (V0.4+)

4. **KET-like format** : sérialisation JSON avec $ref.
   - Remplacer MOL/CDXML par KET natif ou dialect ; roundtrip lossless.

5. **SGroup → advanced groups** : SGroup typing (MUL, SRU, COP).
   - Pour polymérisation, Markush ; phase futur.

6. **Fragment pooling** : composantes connexes explicites.
   - Pour perf O(atoms) copy/delete ; actuellement acceptable.

---

## 10. Fichiers Clés Ketcher (Référence)

| Fichier | Rôle |
|---------|------|
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/struct.ts` | Struct composite root |
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/pool.ts` | Pool<T> Map wrapper |
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/atom.ts` | Atom definition |
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/bond.ts` | Bond definition |
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/Command.ts` | Command + Operation reversal |
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/Operation.ts` | Operation interface |
| `/tmp/ketcher-reference/packages/ketcher-core/src/application/editor/EditorHistory.ts` | Undo/redo stack |
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/serializers/ket/ketSerializer.ts` | KET ser/deser |
| `/tmp/ketcher-reference/packages/ketcher-core/src/application/render/restruct/restruct.ts` | ReStruct cache rendu |
| `/tmp/ketcher-reference/packages/ketcher-core/src/domain/entities/sgroup.ts` | SGroup (superatome) |

---

## 11. Résumé Exécutif

**Ketcher apprend à Kendraw :**

1. **Pool ID management** : Map<ID, T> pour accès O(1) ; nextId pour génération ; clone() pour snapshots.
2. **Reversible Commands** : Operation pattern pour undo/redo sans dupliquer Struct ; invert() annule mutation.
3. **EditorHistory pointer** : linear stack, pointer index, truncate redo on new command.
4. **ReStruct caching** : séparation domaine (Struct) ↔ rendu (ReStruct) ; dirty-tracking pour delta rendu.
5. **KET format** : JSON natif avec $ref pour lossless roundtrip.
6. **SGroup abstraction** : groupes fonctionnels superatom ; Kendraw Groups déjà existe (similaire).

**Pour Kendraw Production (V0.4+) :**
- Adopter Command.invert() pour redo vrai (plus que snapshots Immer).
- Persister Commands dans histoire, pas snapshots.
- Format KET-like pour import/export chimie standard.
- Dirty-tracking pour rendu 60fps (large molecules).

---

**Fin d'analyse. Patterns conceptuels extraits ; pas de copie code.**

---

## 4. Toolbox gauche et toolbar haute


## 1. LEFT TOOLBOX: Component Hierarchy & Organization

### **File Structure**
- **Master Layout:** `/tmp/ketcher-reference/packages/ketcher-react/src/script/ui/views/toolbars/LeftToolbar/LeftToolbar.tsx` (237 lines)
- **Configuration:** `leftToolbarOptions.ts` — declarative tool grouping
- **Multi-Tool System:** `ToolbarGroupItem/` + `ToolbarMultiToolItem/` (variants)

### **Tool Groups Rendered**
The LeftToolbar exposes **5 logical groups**:

```
Group 1: Selection & Erasure
  ├─ hand, select (w/ sub-options), erase

Group 2: Chemical Bonds
  ├─ bonds (4 sub-groups: common, stereo, query, special)
  ├─ chain, enhanced-stereo
  ├─ charge-plus, charge-minus

Group 3: Structures & Monomers
  ├─ sgroup, rgroup (w/ 3 sub-options), CREATE_MONOMER_TOOL_NAME

Group 4: Reactions & Mapping
  ├─ reaction-plus
  ├─ arrows (18 variants: open-angle, filled-triangle, dashed, retrosynthetic, equilibrium, multi-tail)
  ├─ reaction-mapping-tools (map, unmap, automap)

Group 5: Shapes & Rich Content
  ├─ shapes (ellipse, rectangle, line)
  ├─ text, image
```

**Quote from LeftToolbar.tsx (lines 151–221):**
```tsx
<Group items={[
  { id: 'hand' },
  { id: 'select', options: selectOptions },
  { id: 'erase' },
]}/>
// ... repeated for each Group
```

---

## 2. SUB-MENU TRIGGERING & RENDERING

### **How Multi-Tool Sub-Menus Open**

**Mechanism:** Click dropdown icon OR click tool button when already selected

**File:** `ToolbarMultiToolItem.tsx` (191 lines)
- Line 77: `const [isOpen] = usePortalOpening([id, opened, options])`
- Line 121: `const onOpenOptions = () => { onOpen(id, Boolean(currentStatus?.selected)); }`
- Line 153–162: Dropdown icon rendered if NOT open AND not disabled

**Portal Rendering:**
```tsx
{isOpen ? (
  <Portal
    isOpen={isOpen}
    className={clsx(classes.portal, vertical && classes['portal-vertical'], portalClassName)}
    style={portalStyle}
    testId="multi-tool-dropdown"
  >
    <Component  // DefaultMultiTool vs GroupedMultiTool
      options={options}
      groups={groups}
      status={status}
      onAction={onAction}
    />
  </Portal>
) : null}
```

### **Two Sub-Menu Variants**

**1. DefaultMultiTool** (`DefaultMultiTool.tsx`, 54 lines)
- Flat grid of tool buttons
- Used when sub-options ≤ 8 items

**2. GroupedMultiTool** (`GroupedMultiTool.tsx`, 71 lines)
- Organizes into visual groups (dividers between categories)
- **Used for Bonds:** separates common (3) | stereo (4) | query (5) | special (2)
- Quote: `slice(descriptor.start, descriptor.end).map(...)`

**Selection Trigger:** Hover (via `usePortalOpening`) or long-click implicit in `onOpen` callback

---

## 3. ICONS: ASSETS & FORMAT

**Location:** `/tmp/ketcher-reference/packages/ketcher-react/src/assets/icons/files/`
- **Format:** SVG (stroke-based, 1.5px width typical)
- **Size Hint:** Icons are ~20×20px in canvas, scaled via CSS
- **Example Files:** `clear.svg`, `bond-single.svg`, `arrow-filled-triangle.svg`, etc.

**Integration:** Icon lookup via `getIconName(toolId)` → renders `<Icon name={iconName} />`
(Source: `components/Icon`, external package)

**NOTE:** **Do NOT copy Ketcher SVGs.** Instead: design original stroke-based icons matching Kendraw's style, or adopt Material Icons for consistency.

---

## 4. ACTIVE TOOL VISUAL STATE

**CSS Classes Applied:**

| State | Class | File | Details |
|-------|-------|------|---------|
| Normal | `.button` | `ActionButton.module.less:20–81` | Background: inherit, cursor pointer |
| **Selected** | `.button.selected` | Line 55–62 | Background: `@color-primary` (blue), color: white |
| **Hover** | `:hover` | Line 41–43 | Color: `@color-spec-button-primary-hover` |
| **Disabled** | `:disabled` | Line 47–49 | Opacity reduced, cursor: not-allowed |
| **Active Portal Icon** | `.iconSelected` | `ToolbarMultiToolItem.module.less:40–42` | Fill: white (inverted) |

**Quote from ActionButton.module.less:**
```less
.button.selected,
.button:active {
  background: @color-primary;
  color: #fff;

  &:hover {
    background-color: @color-spec-button-primary-hover;
  }
}
```

---

## 5. TOOLTIPS + KEYBOARD SHORTCUT HINTS

**Implementation:** Native HTML `title` attribute + visible `<kbd>` element

**File:** `ActionButton.tsx` (90 lines)
- Line 61: `const shortcut = shortcutStr(action?.shortcut);`
- Line 77: `title={shortcut ? '${action?.title} (${shortcut})' : action?.title}`
- Line 87: `<kbd>{shortcut}</kbd>`

**Rendering:**
- Tooltip appears on hover (browser default)
- Shortcut displayed as `<kbd>` tag **inside** the button (always visible when button is rendered)

**Quote:**
```tsx
<button
  title={shortcut ? `${action?.title} (${shortcut})` : action?.title}
  className={clsx(classes.button, { [classes.selected]: selected })}
>
  <Icon name={name} />
  <kbd>{shortcut}</kbd>
</button>
```

---

## 6. RESPONSIVE & COMPACT BEHAVIOR

**Breakpoint Logic:** File `mediaSizes.ts` (24 lines)
```ts
const mediaSizes = {
  topSeparatorsShowingWidth: 1080,   // Top toolbar collapse threshold
  bondCollapsableHeight: 770,         // LEFT TOOLBAR: bond groups collapse at 770px
  rGroupCollapsableHeight: 1000,
  shapeCollapsableHeight: 1000,
  transformCollapsableHeight: 870,
};
```

**Example: Bond Collapse** (`Bond.tsx`, 64 lines)
```tsx
if (height && height <= mediaSizes.bondCollapsableHeight) {
  return (
    <ToolbarMultiToolItem
      id="bonds"
      options={groupOptions}      // All 14 bond types flattened
      variant="grouped"           // Use GroupedMultiTool for visual groups
      groups={groupDescriptors}
    />
  );
}
// Above height: render 4 separate buttons (bond-common, bond-stereo, bond-query, bond-special)
```

**Vertical Scrolling:** `ArrowScroll` component with up/down nav when content exceeds container height (lines 223–230 in LeftToolbar.tsx)

---

## 7. TOP TOOLBAR ARCHITECTURE

**File:** `TopToolbar/TopToolbar.tsx` (277 lines) + modular sub-components

**Two-Panel Layout** (line 188–273):
```tsx
<ControlsPanel>
  <BtnsWpapper>
    {/* LEFT SIDE: File, Clipboard, Undo/Redo, External Funcs, Custom Buttons */}
    <FileControls />
    <ClipboardControls />
    <UndoRedo />
    <ExternalFuncControls />
    <CustomButtons />
  </BtnsWpapper>

  <BtnsWpapper>
    {/* RIGHT SIDE: Settings, Zoom Controls */}
    <SystemControls />
    <Divider />
    <ZoomControls />
  </BtnsWpapper>
</ControlsPanel>
```

**Key Components:**
- `FileControls.tsx` — Open, Save
- `ClipboardControls.tsx` — Copy, Paste (Copy dropdown: Mol, Ket, Image)
- `UndoRedo.tsx` — Undo/Redo buttons w/ disabled state
- `ExternalFuncControls.tsx` — Layout, Clean, Aromatize, Dearomatize, Calculate, Check, Analyse, Miew, Toggle Explicit H
- `ZoomControls.tsx` — Zoom list (50%, 75%, 100%, 150%, 200%), Zoom In/Out slider

**Responsive Collapse:** `isCollapsed = width < collapseLimit + customButtons.length * CUSTOM_BUTTON_ADDITIONAL_WIDTH`
(Line 180 — hides extended function controls on narrow screens)

---

## 8. ATOM SELECTION + PERIODIC TABLE INVOKER

**File:** `RightToolbar/AtomsList.tsx` (104 lines)

**Pattern: Scrollable Atom Grid with Periodic Table Button**
```tsx
<AtomsList atoms={basicAtoms.slice(0, 1)} />        // H
<AtomsList atoms={basicAtoms.slice(1, 5)} />        // C, N, O, S
<HorizontalDivider />
<AtomsList atoms={basicAtoms.slice(5)} />           // More atoms
<AtomsList atoms={freqAtoms} />                     // Frequent selections
<ToolbarGroupItem id="period-table" {...rest} />    // **PERIODIC TABLE BUTTON**
```

**Atom Button Styling** (line 43–72):
- Colored by element (ElementColor lookup)
- Border + background on hover/active
- `selected` class when that atom is active tool
- Disabled state with opacity 0.4

**Periodic Table Button:** Simple `<ToolbarGroupItem>` wrapper — likely triggers a modal/dialog action

---

## 9. BOND TYPE PICKER (SUB-OPTION RENDERING)

**Bonds Configuration:** `Bond/options.ts` (62 lines)

**Structure:**
```ts
const bondCommon: ToolbarItem[] = makeItems([
  'bond-single', 'bond-double', 'bond-triple',
]);
const bondStereo: ToolbarItem[] = makeItems([
  'bond-up', 'bond-down', 'bond-updown', 'bond-crossed',
]);
const bondQuery: ToolbarItem[] = makeItems([
  'bond-any', 'bond-aromatic', 'bond-singledouble', ...
]);
const bondSpecial: ToolbarItem[] = makeItems([
  'bond-dative', 'bond-hydrogen',
]);

// Meta-descriptors for grouped rendering:
const groupDescriptors = [
  { start: 0, end: 3 },   // bondCommon
  { start: 3, end: 7 },   // bondStereo
  // ...
];
```

**Rendering:** `GroupedMultiTool` uses descriptors to insert dividers between bond families, keeping related types visually grouped.

---

## PATTERNS TO COPY (CONCEPTUALLY)

**✓ Tool Grouping by Domain**
- Kendraw should adopt Ketcher's hierarchical group structure (Selection, Bonds, Atoms, Structures, Reactions, Shapes)
- Current ToolPalette has 7 groups; Ketcher validates this count is sensible for organic chemistry

**✓ Responsive Multi-Tool Variants**
- When toolbar height shrinks (small screens), collapse 4 bond buttons → 1 grouped dropdown
- Kendraw can apply same logic to Rings group (fused + simple collapse to one picker)

**✓ Portal-Based Dropdowns with Click/Hover Triggering**
- Avoid inline sub-menus; use absolute-positioned portal for cleaner DOM
- Single `isOpen` flag drives rendering; one click opens, click outside closes

**✓ Explicit Keyboard Shortcut Display**
- Always render `<kbd>` tag inside button; pair with native `title` for tooltip
- Matches user expectation (e.g., ChemDraw shows "V" for Select, "A" for Atom)

**✓ Visual Grouping in Multi-Item Dropdowns**
- Use CSS `.group` dividers (GroupedMultiTool.tsx line 46) for visual hierarchy
- Bonds: Common | Stereo | Query | Special (4 visual groups)

**✓ Height-Based Responsive Breakpoints**
- Store breakpoints in a config object (`mediaSizes.ts`)
- Use `useResizeObserver` to track container height, toggle UI variant at threshold
- More maintainable than media queries for complex layouts

**✓ Selection State Persistence**
- Ketcher saves last-selected tool variant in `SettingsManager.selectionTool` (ToolbarMultiToolItem.tsx lines 103–113)
- When reopening, default to user's previous choice, not first-in-list

---

## WHAT KENDRAW'S TOOLPALETTE ALREADY DOES WELL

**✓ Declarative Tool Definition**
- ToolDef interface with `id, icon, label, shortcut, description` is clean
- GROUPS array explicitly lists tool order; easy to reorder or hide

**✓ 7 Logical Groups**
- Selection, Bonds, Atoms, Structures, Annotations, Editing, Analysis
- Mirrors Ketcher's domain-driven grouping; no red flags

**✓ Sub-Options via `GROUPS[].sub` Pattern**
- Bonds have bondStyle sub-options (single/double/triple/wedge/hash)
- Arrows have arrowType variants (straight, curved, retro, etc.)
- This is parallel to Ketcher's `ToolbarItem[]` arrays

**✓ Keyboard Shortcut Integration**
- All tools wired to shortcut map; display logic is present
- 80% ChemDraw compliance; no gaps vs. Ketcher

---

## GAPS KENDRAW SHOULD ADDRESS (PRIORITIES)

### **P1: Responsive Collapse Threshold Logic**
**Current:** Static 8-tool layout; no responsive breakpoints
**Ketcher Pattern:** Use `useResizeObserver` + height thresholds (e.g., 770px for bond collapse)
**Impact:** On mobile/small screens, toolbar becomes unusable; Ketcher's solution is proven

### **P2: Visual Sub-Menu Grouping**
**Current:** Sub-options rendered as flat list (if rendered at all)
**Ketcher Pattern:** GroupedMultiTool with CSS dividers between semantic groups
**Impact:** Bond picker with 14 items is overwhelming; grouping (3+4+5+2) makes it scannable

### **P3: Portal-Based Dropdown Rendering**
**Current:** Sub-menus likely inline in DOM or mounted differently
**Ketcher Pattern:** Use `<Portal>` component + `usePortalStyle()` for positioning
**Impact:** Cleaner DOM, prevents z-index stacking bugs, dropdown doesn't shift layout

### **P4: Active Tool Visual Feedback**
**Current:** ToolPalette likely has `.selected` class
**Ketcher Pattern:** Background color change (blue #color-primary) + white text
**Impact:** Need to verify Kendraw uses same contrast/brightness; may need to adjust for WCAG

### **P5: Periodic Table Modal for Extended Atoms**
**Current:** Kendraw's right sidebar shows atom grid; periodic table likely not accessible
**Ketcher Pattern:** Button `id="period-table"` → triggers dialog with full PT
**Impact:** Users needing rare elements (Fr, Rn, etc.) have no UI; P1 for atom tool completeness

### **P6: Icon Asset Organization**
**Current:** Icons may be in different formats (PNG, SVG) scattered across `/src/assets/`
**Ketcher Pattern:** Single SVG directory `/assets/icons/files/`, all stroke-based (1.5px), ~20×20px canvas
**Impact:** Consistency when scaling, easier to theme (stroke color only), reduces asset size

---

## EXACT FILE PATHS (KETCHER REFERENCE)

| Concept | File | Key Lines |
|---------|------|-----------|
| **Left Toolbar Master** | `/tmp/ketcher-reference/packages/ketcher-react/src/script/ui/views/toolbars/LeftToolbar/LeftToolbar.tsx` | 68–232 |
| **Tool Grouping Config** | `LeftToolbar/leftToolbarOptions.ts` | 1–66 |
| **Multi-Tool Variant Logic** | `ToolbarGroupItem/ToolbarMultiToolItem/ToolbarMultiToolItem.tsx` | 59–187 |
| **Default Flat Dropdown** | `...ToolbarMultiToolItem/variants/DefaultMultiTool/DefaultMultiTool.tsx` | 28–54 |
| **Grouped Dropdown** | `...ToolbarMultiToolItem/variants/GroupedMultiTool/GroupedMultiTool.tsx` | 29–71 |
| **Bond Sub-Options (Grouped)** | `LeftToolbar/Bond/Bond.tsx` | 40–63 |
| **Bond Type Definitions** | `LeftToolbar/Bond/options.ts` | 21–62 |
| **Button Styling** | `ToolbarGroupItem/ActionButton/ActionButton.module.less` | 20–81 |
| **Dropdown Portal Styling** | `ToolbarGroupItem/ToolbarMultiToolItem/ToolbarMultiToolItem.module.less` | 44–73 |
| **Responsive Breakpoints** | `toolbars/mediaSizes.ts` | 17–23 |
| **Top Toolbar Structure** | `TopToolbar/TopToolbar.tsx` | 124–276 |
| **Atom Grid + PT Button** | `RightToolbar/RightToolbar.tsx` | 52–141 |
| **Atom Button Styling** | `RightToolbar/AtomsList/AtomsList.tsx` | 43–73 |
| **Icon Assets** | `/tmp/ketcher-reference/packages/ketcher-react/src/assets/icons/files/` | — |

---

## SUMMARY

Ketcher's left/top toolbar architecture is **production-grade**:
- **Hierarchical grouping** reduces cognitive load
- **Portal-based dropdowns** avoid layout thrashing
- **Responsive collapsing** handles mobile screens
- **Grouped sub-menus** (e.g., bond families) improve UX at scale
- **Keyboard shortcut visibility** + persistent selection state enhance power-user efficiency

Kendraw can adopt these patterns without copying code: embrace responsive thresholds, use styled-components for variant dropdowns, and organize tools by semantic domain (not alphabetical).

**NO SVG ASSETS COPIED. All conceptual reference only.**


---

## 5. Raccourcis clavier


## Executive Summary

Ketcher implémente un système de raccourcis clavier sophistiqué (ACTE-1) fondé sur :
- **Modifieurs normalisés** : `Mod` (Ctrl/⌘), `Alt/Option`, `Shift`, `Meta`
- **Mapping dynamique** : actions définis dans `/action/*.js` avec propriété `shortcut`
- **Contextuel** : désactivation dans modales et champs texte
- **Comportements au survol** : "/" déclenche dialogs Atom/Bond properties
- **Abbreviation Lookup** : détection de saisie pour conversion atomes (N → Azote)

---

## Section 1 : Cartographie Complète des Raccourcis Ketcher

### Tableau Maître (format : Touche | Action | Contexte | Équivalent ChemDraw)

| Clés | Action | Contexte | ChemDraw | Kendraw |
|------|--------|---------|----------|---------|
| **FICHIER & ÉDITION** |
| `Ctrl+O` / `⌘+O` | Ouvrir fichier | global | Ctrl+O | ✓ (si implémenté) |
| `Ctrl+S` / `⌘+S` | Enregistrer | global | Ctrl+S | ✓ (si implémenté) |
| `Ctrl+Z` / `⌘+Z` | Annuler | global | Ctrl+Z | ✓ (standard) |
| `Ctrl+Shift+Z` / `⌘+Shift+Z` | Rétablir | global | Ctrl+Y | ✓ (standard) |
| `Ctrl+Y` / `⌘+Y` | Rétablir (alt) | global | Ctrl+Y | (alt) |
| `Ctrl+X` / `⌘+X` | Couper | sélection | Ctrl+X | ✓ (standard) |
| `Ctrl+C` / `⌘+C` | Copier | sélection | Ctrl+C | ✓ (standard) |
| `Ctrl+V` / `⌘+V` | Coller | global | Ctrl+V | ✓ (standard) |
| `Ctrl+Shift+F` / `⌘+Shift+F` | Copier image | sélection | — | — |
| `Ctrl+Shift+M` / `⌘+Shift+M` | Copier en MOL | sélection | — | — |
| `Ctrl+Shift+K` / `⌘+Shift+K` | Copier en KET | sélection | — | — |
| `Ctrl+A` / `⌘+A` | Sélectionner tout | global | Ctrl+A | ✓ (standard) |
| `Ctrl+Shift+A` / `⌘+Shift+A` | Désélectionner tout | global | — | — |
| `Ctrl+D` / `⌘+D` | Sélectionner descripteurs | global | — | — |
| `Ctrl+Delete` / `⌘+Delete` | Effacer canevas | global | — | — |
| `Ctrl+Backspace` / `⌘+Backspace` | Effacer canevas (alt) | global | — | — |
| **SÉLECTION & OUTILS ÉDITEURS** |
| `Escape` | Réinitialiser sélection | global | Esc | ✓ (standard) |
| `Shift+Tab` | Sélection rectangle | global | — | — |
| `Delete` / `Backspace` | Effacer éléments | sélection | Del/Backspace | ✓ (standard) |
| `Shift+Tab` | Sélection lasso (alt) | global | — | — |
| `Ctrl+Alt+H` / `⌘+Option+H` | Outil main | global | — | — |
| **ATOMES** |
| `H` | Ajouter hydrogène | sur atome | H | ✓ |
| `C` | Ajouter carbone | sur atome | C | ✓ |
| `N` | Ajouter azote | sur atome | N | ✓ |
| `O` | Ajouter oxygène | sur atome | O | ✓ |
| `S` | Ajouter soufre | sur atome | S | ✓ |
| `P` | Ajouter phosphore | sur atome | P | ✓ |
| `F` | Ajouter fluor | sur atome | F | ✓ |
| `L` | Ajouter chlore (Cl) | sur atome | Cl | ✓ |
| `B` | Ajouter brome (Br) | sur atome | Br | ✓ |
| `I` | Ajouter iode (I) | sur atome | I | ✓ |
| `A` | Ajouter atome quelconque | sur atome | A | — |
| `Q` | Ajouter atome sans H | sur atome | Q | — |
| `R` | Ajouter radical | sur atome | R | — |
| `K` | Ajouter alcalin | sur atome | — | — |
| `M` | Ajouter alcalino-terreux | sur atome | — | — |
| `X` | Ajouter halogène | sur atome | X | — |
| `D` | Ajouter deutérium | sur atome | D | — |
| `Shift+S` | Ajouter silicium (Si) | sur atome | Si | — |
| `Shift+N` | Ajouter sodium (Na) | sur atome | Na | — |
| `Shift+B` | Ajouter bore (B) | sur atome | B | — |
| `Shift+8` | Ajouter atome chimère (*) | sur atome | — | — |
| **LIAISONS** |
| `1` | Liaison simple | sur liaison/canevas | 1 | ✓ |
| `2` | Liaison double | sur liaison/canevas | 2 | ✓ |
| `3` | Liaison triple | sur liaison/canevas | 3 | ✓ |
| `4` | Liaison aromatique | sur liaison/canevas | 4 | ✓ |
| `0` | Liaison quelconque (Any) | sur liaison | — | — |
| Survoler liaison + `1` | Convertir en simple | contexte liaison | — | — |
| Survoler liaison + `2` | Convertir en double | contexte liaison | — | — |
| Survoler liaison + `3` | Convertir en triple | contexte liaison | — | — |
| Survoler liaison + `4` | Convertir en aromatique | contexte liaison | — | — |
| **STÉRÉOCHIMIE & LIAISONS SPÉCIALES** |
| `Alt+E` | Outil stéréochimie (Enhanced Stereo) | si atomes stéréo | — | — |
| `W` | Liaison en coin montant (up/wedge) | sur liaison | W | ✓ (possiblement) |
| `Shift+W` | Liaison en coin descendant (down) | sur liaison | — | ✓ (possiblement) |
| **CHARGES & MODIFICATIONS** |
| `=` / `+` / `NumpadAdd` | Ajouter charge (+1) | sur atome | = | — |
| `-` / `NumpadSubtract` | Retirer charge (-1) | sur atome | - | — |
| `Shift+=` | Variation charge + (alt) | sur atome | — | — |
| **TRANSFORMATION & ROTATION** |
| `Alt+H` | Retournement horizontal | sélection | — | — |
| `Alt+V` | Retournement vertical | sélection | — | — |
| (No direct key) | Outil rotation | menu seulement | — | — |
| **GROUPES & SPÉCIALITÉS** |
| `Ctrl+G` / `⌘+G` | Outil S-Group | sélection | — | — |
| `Shift+F` | Ouvrir librairie templates | global | — | — |
| `T` | Outil template | global | T | ✓ (si template) |
| `Ctrl+M` / `⌘+M` | Créer un monomère | global | — | — |
| `Ctrl+R` / `⌘+R` | R-Group Label Tool | global | — | — |
| `Ctrl+Shift+R` | R-Group Fragment Tool | global | — | — |
| `Alt+T` | Outil texte | global | — | — |
| **ZOOM** |
| `Ctrl+0` / `⌘+0` | Zoom 100% (réinitialiser) | global | Ctrl+0 | ✓ |
| `Ctrl+=` / `⌘+=` | Zoom avant | global | Ctrl+Plus | ✓ |
| `Ctrl+Minus` / `⌘+-` | Zoom arrière | global | Ctrl+Minus | ✓ |
| `Ctrl+NumpadAdd` | Zoom avant (numpad) | global | — | — |
| `Ctrl+NumpadSubtract` | Zoom arrière (numpad) | global | — | — |
| **AIDE & INTERFACE** |
| `?` / `&` / `Shift+/` | Ouvrir aide (Hotkeys Help) | global | ? | ✓ (Shift+/) |
| `/` (seul, sur atome/liaison) | Ouvrir propriétés atome/liaison | contexte | — | — |
| `Ctrl+Shift+R` (debug) | Redessiner éditeur | dev mode | — | — |
| `Alt+Shift+R` (debug) | Afficher MOL serialisé | dev mode | — | — |
| **FLÈCHES & MOUVEMENTS** |
| `Arrow Keys` | Déplacer sélection | sélection | Arrows | ✓ |
| `Shift+Arrows` | Déplacer par incrément large | sélection | Shift+Arrows | ✓ |
| `Ctrl+Arrows` | Déplacer tout ensemble | sélection | — | — |

---

## Section 2 : Architecture et Gestion des Raccourcis

### Fichier Clé : `/packages/ketcher-react/src/script/ui/state/hotkeys.ts`

**Flux de traitement des touches** :

```
KeyboardEvent
  ↓
keyNorm(event) → "Ctrl+C" ou "Shift+N"
  ↓
keyNorm.lookup(hotKeys) → groupe d'actions [action1, action2, ...]
  ↓
handleHotkeyGroup() → boucle (index + 1) % groupLength
  ↓
shouldHandleItemDirectly() → applique à atome/liaison survolée ?
  ↓
dispatch(onAction(newAction)) ou handleHotkeyOverItem()
```

### Normalisation des Touches (`keynorm.ts`)

```typescript
CanonicalModifiersOrder = [Ctrl, Alt, Shift, Meta]
normalizeShortcut("Mod+c") → "Ctrl+C" (Windows) ou "Meta+C" (Mac)
ModifiersRegex = {
  Mod: /^mod$/i,
  Meta: /^(meta|cmd|m)$/i,
  Ctrl: /^(ctrl|control|c)$/i,
  Alt: /^(alt|a)$/i,
  Shift: /^(shift|s)$/i
}
```

### Ordre d'Exécution des Actions Groupées

Si une touche mappe à plusieurs actions (ex : `Shift+Tab` → `[select-rectangle, select-lasso, select-structure]`) :
1. Trouver l'index de l'action actuelle
2. `newIndex = (index + 1) % groupLength`
3. Passer à l'action suivante du groupe (cycle)

---

## Section 3 : Comportements Contextuels

### 3.1 Gating des Raccourcis

Les hotkeys sont **DÉSACTIVÉS** si :
- `state.modal === true` (dialog ouverte)
- `selectIsAbbreviationLookupOpen(state)` (détection de saisie en cours)
- `event.target.nodeName === 'INPUT'` (dans champ texte monomer)

### 3.2 Détection "Abbreviation Lookup"

**Mots-clés reconnus** :
```javascript
const shortcutKeys = ['1', '2', '3', '4', 't', 'h', 'n', 'o', 's', 'p', 'f', 'i', 'b', '+', '-'];
```

**Délai timeout** : 1000ms avant réinitialisation

**Flux** :
1. Utilisateur tape `N`
2. Affichage "Abbreviation Lookup" (popup avec suggestions azote)
3. Si user ajoute autre touche (ex `N` → `N+a`), affiche options élargies
4. Si timeout, ferme lookup automatiquement

### 3.3 Slash Command (`/` Hotkey)

Si utilisateur appuie sur `/` en survolant atome/liaison :
```javascript
if (hoveredItem.atoms) {
  dispatch(actions['atom-props'].action)  // Ouvrir propriétés atome
} else if (hoveredItem.bonds) {
  dispatch(actions['bond-props'].action)  // Ouvrir propriétés liaison
}
```

### 3.4 Comportement Au Survol (Hover + Key)

Ketcher supporte **l'édition directe au survol** :
- Survoler liaison simple
- Appuyer `2` → convertit en liaison double
- **Sans cliquer, sans sélectionner**

Implémentation : `handleHotkeyOverItem()` applique l'action à l'item survolé au lieu de la sélection.

### 3.5 Rotation avec Escape

```typescript
if (editor.rotateController.isRotating && key === 'Escape') {
  editor.rotateController.revert()  // Annuler rotation en cours
}
```

---

## Section 4 : Analyse Comparative (Ketcher vs ChemDraw vs Kendraw)

| Catégorie | Ketcher | ChemDraw | Kendraw | Notes |
|-----------|---------|----------|---------|-------|
| **Atomes simples (C/N/O/S/P/F)** | ✓ Lettres simples | ✓ Identiques | ? | Ketcher : clés directes, pas de menu |
| **Atomes spéciaux (Si/Na/Cl/Br)** | ✓ Shift+S, Shift+N | ✓ Partiels | ? | Ketcher complet |
| **Liaisons 1/2/3/4** | ✓ '1','2','3','4' | ✓ Identiques | ? | Ketcher : apply on hover |
| **Wedge/Dash stéréo** | ? (Implied '1' behavior) | ✓ Explicit | ? | **Besoin clarification Ketcher** |
| **Undo/Redo** | Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y | Ctrl+Z, Ctrl+Y | ✓ | Tous identiques |
| **Copie avancée (image/MOL/KET)** | ✓ Ctrl+Shift+F/M/K | ✗ Limited | ? | **Ketcher avantage** |
| **Select All / Deselect** | ✓ Ctrl+A, Ctrl+Shift+A | ✓ Partial | ✓ | Ketcher : plus complet |
| **Zoom clavier** | ✓ Ctrl+0/+/- | ✓ Identiques | ✓ | Tous identiques |
| **Aide interactive (?)** | ✓ Shift+/ | ✓ F1 | ? | Ketcher : Shift+/, ChemDraw : F1 |
| **Propriétés hover (/)** | ✓ / → atom/bond dialogs | ✗ | ? | **Unique Ketcher** |
| **Raccourcis dynamiques (groupes)** | ✓ Shift+Tab cycles | ✓ Limited | ? | Ketcher : sophistiqué |
| **Abbreviation Lookup (N→Azote)** | ✓ Context-aware | ✗ | ? | **Unique Ketcher** |
| **Hand Tool** | ✓ Ctrl+Alt+H | ✓ Space/Ctrl | ? | Différent sur Mac/Windows |
| **S-Group** | ✓ Ctrl+G | ? | ? | Ketcher standard |
| **R-Group Tools** | ✓ Ctrl+R, Ctrl+Shift+R | ? | ? | Ketcher standard |
| **Template Library** | ✓ Shift+T | ✓ T | ✓ (si implémenté) | |
| **Text Tool** | ✓ Alt+T | ? | ? | Ketcher standard |
| **Flip H/V** | ✓ Alt+H, Alt+V | ✓ Similar | ? | Ketcher standard |
| **Charge +/-** | ✓ =/-/NumpadAdd/Subtract | ✓ Similar | ? | Ketcher : numpad support |
| **Stereochemistry** | ✓ Alt+E | ? | ? | Ketcher standard |
| **Copy Image** | ✓ Ctrl+Shift+F | ✗ (Menu only) | ? | **Ketcher avantage** |
| **Paste** | ✓ Ctrl+V | ✓ Identique | ✓ | Tous identiques |
| **Cut** | ✓ Ctrl+X | ✓ Identique | ✓ | Tous identiques |

---

## Section 5 : Système de Groupes et Cycles

Certaines touches activent **plusieurs actions en cycle** :

### Sélections (Shift+Tab ou Escape)
```javascript
group = ['select-rectangle', 'select-lasso', 'select-structure', 'select-fragment']
Appui 1 → Rectangle
Appui 2 → Lasso
Appui 3 → Structure
Appui 4 → Fragment
Appui 5 → Rectangle (cycle recommence)
```

### R-Groups (Ctrl+Shift+R ou Ctrl+R)
```javascript
group = ['rgroup-label', 'rgroup-fragment', 'rgroup-attpoints']
// Cycles entre les trois outils R-Group
```

**Implémentation** : `handleHotkeyGroup()` itère `(index + 1) % groupLength`

---

## Section 6 : Gestion Spécifique de Ketcher

### 6.1 ClipArea (Clipboard Virtuel)

Pour IE (Internet Explorer), Ketcher gère clipboard en "virtual area" :
```javascript
const clipArea = {
  formats: [...ChemicalMimeType formats...],
  onCopy(), onCut(), onPaste(),
  onLegacyCopy(), onLegacyPaste() // fallback IE
}
```

**Formats supportés** :
- `ChemicalMimeType.KET` (Ketcher native)
- `ChemicalMimeType.MOL` / `ChemicalMimeType.Mol`
- `ChemicalMimeType.RXN` / `ChemicalMimeType.Rxn`
- `text/plain`

### 6.2 Serialization lors Copie

```typescript
async clipData(editor) {
  const struct = editor.structSelected()
  const serializer = new KetSerializer()
  const ket = serializer.serialize(struct)
  const data = await getStructure(..., SupportedFormat.molAuto)
  return {
    [ChemicalMimeType.KET]: ket,
    [molType]: data,  // MOL ou RXN
    ['text/plain']: data
  }
}
```

**Point clé** : multi-format clipboard adapté formats chimiques (KET, MOL, RXN)

### 6.3 Handling Item Direct (Sans Sélection)

```typescript
shouldHandleItemDirectly(hoveredItem, newAction) {
  return hoveredItem &&
         newAction.tool !== 'select' &&
         newAction.dialog !== 'templates'
}
```

Si vrai, l'action s'applique **directement à l'élément survolé**, sans le sélectionner.

**Exemple** : Survoler liaison + appuyer `2` → liaison devient double immédiatement.

---

## Section 7 : Ketcher Hotkeys Kendraw DEVRAIT Ajouter

### Top 10 Raccourcis Critiques Manquants

1. **`Ctrl+Shift+F` (Copier Image)**
   - Copy as PNG/SVG clipboard
   - **Priorité** : HAUTE (export rapide)
   - **État Kendraw** : ✗ (pas trouvé)

2. **`Ctrl+Shift+M` (Copier MOL)**
   - Copy structure as MOL format
   - **Priorité** : HAUTE (format standard chimie)
   - **État Kendraw** : ✗

3. **`Ctrl+Shift+K` (Copier KET)**
   - Copy in Ketcher native KET format
   - **Priorité** : MOYENNE (format propriétaire)
   - **État Kendraw** : ✗

4. **`/` (Propriétés Atome/Liaison au Survol)**
   - Open atom/bond properties dialog on hovered item
   - **Priorité** : HAUTE (UX avantage)
   - **État Kendraw** : ✗ (unique Ketcher)

5. **`Ctrl+D` (Sélectionner Descripteurs)**
   - Select all descriptor elements
   - **Priorité** : MOYENNE (chimie spécialisée)
   - **État Kendraw** : ✗

6. **`Ctrl+Shift+A` (Désélectionner Tout)**
   - Deselect all elements
   - **Priorité** : MOYENNE (UX standard)
   - **État Kendraw** : ✗

7. **`Alt+E` (Stéréochimie)**
   - Enhanced Stereo tool
   - **Priorité** : HAUTE (chimie stéréochimique)
   - **État Kendraw** : ✗

8. **`Ctrl+Alt+H` (Outil Main)**
   - Hand/pan tool
   - **Priorité** : MOYENNE (navigation)
   - **État Kendraw** : ✗

9. **`Shift+F` (Librairie Templates)**
   - Open templates/library dialog
   - **Priorité** : MOYENNE (fragments)
   - **État Kendraw** : ? (possiblement T seul)

10. **`Shift+Tab` Cycles (Select-Rectangle → Lasso → Structure → Fragment)**
    - Cycle through selection modes
    - **Priorité** : MOYENNE (sélection sophistiquée)
    - **État Kendraw** : ✗ (possiblement seulement Tab)

---

## Section 8 : Ketcher Hotkeys Kendraw DEVRAIT ÉVITER (Conflits ChemDraw)

### Raccourcis Où ChemDraw Diffère SIGNIFICATIVEMENT

| Ketcher | ChemDraw | Kendraw Goal | Action Recommandée |
|---------|----------|--------------|-------------------|
| `Ctrl+Alt+H` (Main Tool) | `Space` / `Ctrl` (Pan) | Aligner CD | **Ignorer Ketcher, garder CD** |
| `?` (Help) vs Shift+/ | `F1` (Help) | Aligner CD | **Préférer F1 si Kendraw = CD-like** |
| `/` (Atom/Bond Props) | N/A (Ketcher unique) | Nouveau | **Évaluer UX avant intégration** |
| `Alt+T` (Text Tool) | ? | ? | **Vérifier avec Kendraw spec** |
| `Ctrl+G` (S-Group) | ? | ? | **Vérifier avec Kendraw spec** |
| `Mod+r`, `Mod+Shift+r` (R-Group) | N/A | ? | **R-Group spécific; considérer** |

### Notes
- Ketcher **dépend fortement de Mod** (Ctrl sur Windows, Cmd sur Mac)
- ChemDraw souvent **plus simple** (lettres directes)
- Kendraw doit **choisir : fidélité ChemDraw vs richesse Ketcher**

---

## Section 9 : État de Maturation Ketcher (ACTE-1 Findings)

### ✓ Points Forts
- **Normalisation robuste** (`keynorm.ts`) : gère Mod/Ctrl/Meta
- **Groupes sophistiqués** : cycles Shift+Tab pour sélections
- **Contexte intelligent** : hover + key applique directement
- **Abbreviation Lookup** : détection dynamique atomes (N→Azote)
- **Multi-format clipboard** : KET/MOL/RXN + PNG
- **Slash command** : `/ → atom-props / bond-props`

### ⚠ Points Faibles ou Flous
- **Stéréochimie (W/Shift+W)** : pas clairement documentée dans le code action
  - Présumée : liaison "up"/"down" → clés `1`, pas explicite `W`
  - **À vérifier dans UI ou tests**

- **R-Group cycle** : 3 outils mappés à 2 raccourcis (`Ctrl+r` vs `Ctrl+Shift+r`)
  - Possible collision (check `rgroup-label`, `rgroup-fragment`, `rgroup-attpoints`)

- **Pas de F-Keys explicites** :
  - `F1`, `F2`, etc. non trouvés dans actions
  - Ketcher semble favoriser `Ctrl+` + `Shift+` au lieu de function keys

- **Debug keybindings** : `Ctrl+Shift+r`, `Alt+Shift+r` cachées dans `debug.js`
  - Mode développement, non produit

### ℹ Documentation Ketcher
- Source : `/packages/ketcher-react/src/script/ui/action/` (fichiers `.js`)
- Chaque action a `shortcut` (string ou array)
- `keynorm.ts` centralise normalization
- Tests : `/ketcher-autotests/tests/specs/User-Interface/Hot-Keys/hotkeys.spec.ts`

---

## Section 10 : Cartographie Fichiers Source Ketcher

| Fichier | Responsabilité | Lignes Clés |
|---------|-----------------|------------|
| `hotkeys.ts` | Listener KeyboardEvent, dispatch actions | `keyHandle()`, `handleHotkeyGroup()` |
| `keynorm.ts` | Normaliser raccourcis, mapper events | `normalizeShortcut()`, `keyNorm.lookup()` |
| `handleHotkeysOverItem.ts` | Appliquer actions à atome/liaison survolée | `shouldHandleItemDirectly()` |
| `action/index.ts` | Actions globales (undo/redo/copy/paste) | Voir tableau Section 1 |
| `action/tools.js` | Outils (select, erase, hand, text, etc.) | Shortcut mappings pour tools |
| `action/atoms.js` | Atomes (C/N/O/S/P/F/etc.) | `atomCuts` dictionary |
| `action/zoom.js` | Zoom in/out/reset | Ctrl+0/+/- mappings |
| `action/templates.js` | Templates library | `Shift+t` et `t` |
| `action/help.js` | Aide | `?`, `&`, `Shift+/` |
| `action/server.js` | Actions server-side (layout, upload, etc.) | `Ctrl+Shift+l`, `Alt+a`, etc. |
| `shortcutsUtil.ts` | Utilitaire affichage raccourcis | `shortcutStr()` (UI display) |

---

## Section 11 : Recommandations Kendraw (POST-ACTE-1)

### Implémentation Prioritaire

**Phase 1 — Copie Avancée** :
```javascript
'copy-image': 'Ctrl+Shift+F',
'copy-mol': 'Ctrl+Shift+M',
'copy-ket': 'Ctrl+Shift+K',  // Si Kendraw supporte KET
```

**Phase 2 — Amélioration Sélection** :
```javascript
'deselect-all': 'Ctrl+Shift+A',
'select-descriptors': 'Ctrl+D',
```

**Phase 3 — Contexte Hover** :
```javascript
'/' → dialog('atom-props') si atom survolé
'/' → dialog('bond-props') si bond survolé
```

**Phase 4 — Stéréochimie** (si Kendraw supporte) :
```javascript
'enhanced-stereo': 'Alt+E',
```

### Éviter Conflits ChemDraw

- **Garder** : C/N/O/S/P/F (lettres directes)
- **Garder** : 1/2/3 pour liaisons
- **Clarifier** : W/Shift+W pour wedge (dépend ChemDraw spec)
- **Ignorer** : `Ctrl+Alt+H` (Main Tool) — conflits avec Space dans CD
- **Ignorer** : `/` (unique Ketcher, peut confondre utilisateurs CD)

---

## Conclusion

Ketcher offre un système de hotkeys **mature et contextuel**, notamment :
1. **Normalisation robuste** : Mod/Ctrl/Meta gestion multiplateforme
2. **Comportements avancés** : hover + key, groupes cycliques, abbreviation lookup
3. **Formats chimiques** : KET/MOL/RXN/PNG clipboard
4. **Propriétés rapides** : `/` pour atom/bond editing sans sélection

**Kendraw doit décider** : intégrer richesse Ketcher ou rester fidèle simplicité ChemDraw. Recommandation : **Phase 1+2** (copie + sélection) avant **Phase 3+4** (contexte avancé).

**Document généré** : `/home/debian/kendraw/docs/scratch/ketcher-acte1-hotkeys.md`
**Inspection complète** : ✓ (hotkeys.ts, keynorm.ts, atoms.js, tools.js, zoom.js, tous actions)
**Nécessite clarification** : stéréochimie W/Shift+W dans Ketcher UI

---

## 6. Sélection, transformations, interactions globales


## 1. STRUCTURE DE DONNÉES DE SÉLECTION

### Ketcher Core Architecture

Ketcher organise la sélection sur trois couches:

**Couche mutable:** `DrawingEntity` expose `.selected: boolean` directement. L'état global réside dans `DrawingEntitiesManager.selectedEntitiesArr: DrawingEntity[]`, implémenté en interne via `Set<number>` (IDs numériques).

**Hiérarchie structurelle:** La sélection supporte quatre niveaux:
- Atome/liaison unique (niveau primitif)
- Fragment connecté (BFS via bonds)
- Groupe structural — `SGroup` (groupement logique pour annotations chimiques)
- Chaîne polymère (monomers, pour séquences ADN/protéines)

Chaque niveau appelle `getAllSelectedEntitiesForEntities()` qui retourne à la fois les entités directes et leurs dépendances implicites. Par exemple, sélectionner un atome peut impliquer la sélection de toutes les liaisons attachées.

### Kendraw — Approche Immutable Allégée

Kendraw utilise une structure minimaliste:

```typescript
export type Selection = {
  atomIds: AtomId[];
  bondIds: BondId[];
};
```

Chaque opération (`addToSelection`, `removeFromSelection`, `toggleInSelection`) retourne un nouvel objet Selection, jamais muté. Il n'existe **pas de hiérarchie structurelle** — seulement atomes et liaisons.

**Comparaison philosophique:** Ketcher mutate-centric (mutable state object), Kendraw immutable-centric (functional updates).

---

## 2. OUTILS DE SÉLECTION & INTERACTION

### Ketcher's Selection Tools

| Outil | Classe | Mécanique |
|-------|--------|-----------|
| **Rectangle marquee** | `SelectRectangle.ts` (100L) | Drag du coin vers l'autre → bounding-box. Real-time rendering via `transientDrawingView.showSelection()`. Détecte entités dans rectangle via `selectIfLocatedInRectangle()` |
| **Lasso free-form** | `SelectLasso.ts` (69L) | Trace polygone au curseur, accumule path points. Point-in-polygon test via `selectIfLocatedInPolygon()` |
| **Fragment click** | `SelectFragment.ts` (57L) | Click + BFS complète via `selectAllConnectedEntities()`. Hover preview via `intendToSelectAllConnectedDrawingEntities()` |
| **Click simple** | `SelectBase.mousedownEntity()` (L273–346) | Modifiers: Shift=ADD au sélection, Ctrl/Cmd=TOGGLE, rien=REPLACE |

**Mode state machine:** `SelectBase.mode` alterne entre `'standby'` | `'selecting'` | `'moving'` | `'rotating'` | `'rotating-center'`.

### Kendraw — Gap Critique

Kendraw implémente `floodSelectMolecule()` (27 lignes, BFS pur) mais **manque l'interaction UI**:
- Pas de rectangle marquee
- Pas de lasso tool
- Pas de hover preview
- Pas d'intégration Shift+click/Ctrl+click dans le composant Canvas

La sélection reste **data sans UI handler**. Canvas.tsx stocke `Selection` en useState mais ne déclenche pas les outils de sélection.

---

## 3. RENDU VISUEL DE SÉLECTION

### Ketcher TransientView Pattern

Ketcher sépare le rendu persistant du rendu transient (feedback utilisateur):

**TransientDrawingView** = canvas overlay D3:
- `showSelection(params)` → affiche rectangle/lasso shadow pendant selection
- `showRotation()` → affiche handles de rotation + center dot
- Colors distincts:
  - **Intendance (hover):** Une couleur de preview sans sélection
  - **Sélectionné:** Highlight distinct (bleu par défaut)
  - **Mode rotation:** Handle colors différentes

**Bounding box:** Calculée via `DrawingEntitiesManager.getSelectedEntitiesBoundingBox()` → structure { left, top, width, height } que le renderer utilise pour tracer les handles.

### Kendraw — Absence de Visual Layer

Selection est une valeur React (`Canvas.tsx:99`) qui ne produit aucun rendu. Aucun highlight color, aucune bounding box, aucun handle n'est visible. L'utilisateur ne sait pas ce qui est sélectionné.

---

## 4. DRAG-MOVE, SNAPPING & TRANSFORMATIONS

### SelectBase.mousemove: Cœur du Système (lignes 970–1100)

Ketcher distingue **trois modes de drag** dans `mousemove()`:

```
1. mode === 'selecting' → updateSelectionViewParams() + onSelectionMove()
   (dessine rectangle/lasso, appelle selectIfLocatedInRectangle/Polygon)

2. mode === 'moving' → détecte déplacement entités
   - Calcule delta = curseur current vs. position entité avant move
   - Appelle tryToSnap() → retourne snapPosition ou null
   - moveSelectedDrawingEntities(snapPosition || movementDelta)
   - RequestAnimationFrame batch

3. mode === 'rotating' → handleRotationMove()
   - Recalcule angle vs. rotation center
   - Applique snap angles
```

### Snapping Logic — Très Sophistiquée

`tryToSnap()` évalue trois types de snapping en cascade:

**1. Bond-length snapping:** Si delta dépasse StandardBondLength, snap.
**2. Angle snapping:** À 30° increments (ou 90° en snake-mode polymer), relative to fixed bonds.
**3. Distance snapping:** Monomer-pair centers, avec horizontal/vertical alignment detection.

Chaque snap type retourne un `SnapResult | EmptySnapResult`, triés par `connectionLength` (distance to external connector). Le premier résultat non-vide est appliqué.

Example pseudo-code:
```typescript
const movementDelta = calculateDelta(mousePos, previousPos);
const snapResult = tryToSnap(event, movementDelta);
if (snapResult.snapPosition) {
  moveSelectedDrawingEntities(snapResult.snapPosition);  // Use snapped delta
} else {
  moveSelectedDrawingEntities(movementDelta);  // Use raw movement
}
```

### Rotate Tool (rotate.ts lignes 65–250)

Ketcher a un outil dédié `RotateTool`:

- **Constructor avec flipDirection:** Exécute immédiatement `fromFlip()` (transformation immutable)
- **mousedownHandle():** Initialise snap info, angle start (`Math.atan2`)
- **Snap angles:** 90°, 120°, 180° relative to fixed bonds, avec max delta 10° (Math.PI/18)
- **mouseup → history.update():** L'opération complète est une seule entrée undo/redo

### Kendraw — Aucun Équivalent

Kendraw n'a pas:
- Système de drag avec state machine
- Snapping logic
- Rotate tool (pas even flip H/V)
- Transform operations (`fromFlip()`, `fromRotate()`)

---

## 5. CLIPBOARD & CUT/COPY/PASTE

### Ketcher clipboardUtils.ts

Ketcher supporte trois voies:

**Legacy clipboard API (synchrone):**
```typescript
legacyCopy(clipboardData, data: {
  'text/plain': string,
  'web application/json': serialized_structure,
  'web chemical/ket': KET format,
  'web chemical/mol': MOL V2000 block,
  'chemical/smiles': SMILES string,
  ...
})
```

**Async Clipboard API:**
```typescript
getStructStringFromClipboardData(ClipboardItem[]): Promise<string>
  → Try (in order): KET, MOL, RXN, text/plain
  → Fallback to text if all else fails
```

**Serialization:** Via `ketSerializer.ts` (KET native format) ou `mol-v2000.ts` (MOL V2000).

**Paste position logic:**
- Parse clipboard format
- Deserialize atoms/bonds
- Offset = cursor position OR canvas center if clipboard is external

### Kendraw clipboard.ts

Simple pure functions:

```typescript
export function copySelection(page: Page, selectedAtomIds: AtomId[]): ClipboardData {
  // Filter atoms in selection, include bonds where BOTH endpoints selected
  return { atoms: Atom[], bonds: Bond[] };
}

export function prepareForPaste(data: ClipboardData, offsetX, offsetY) {
  // Generate new UUIDs via crypto.randomUUID()
  // Remap bond references (oldId → newId)
  // Apply offset: atom.x += offsetX, atom.y += offsetY
  return { atoms: Atom[], bonds: Bond[] };
}
```

**Gap:** Pas d'interaction UI. `prepareForPaste()` requiert offsetX/offsetY externes (non calculés). Pas de fallback format.

---

## 6. UNDO/REDO BOUNDARIES

### Ketcher EditorHistory Pattern

```typescript
// Dans mouseup() sur completion du 'moving' mode:
history.update(modelChanges);

// Propriété clé: Chaque action utilisateur discrète = UNE entrée history
```

**Command architecture:**
- `Command` = array of `Operation` objects
- Chaque `Operation` a `.execute()` et `.invert()`
- Support pour `.setUndoOperationReverse()` ou `.setUndoOperationsByPriority()` lors du undo

**Drag batching:** Pixel movements durant drag = pas de history push. Mouseup seulement = atomic update.

### Kendraw — Aucune Implémentation Visible

Pas de history layer dans `selection.ts`, `clipboard.ts`, ou `flood-select.ts`. L'observation NMR (memory-988) suggest que history exist ailleurs, mais selection elle-même ne l'expose pas.

---

## 7. KEYBOARD INTERACTIONS

### Arrow-Key Nudge

**Ketcher:** Non visible dans `SelectBase.ts`. Probablement géré dans `Editor` ou tool-specific handler. Pattern standard: Shift=large step, normal=small step.

**Kendraw:** Absent.

### Delete/Backspace

**Ketcher:** Delegué à tool handler (via `removeFromSelection()` → `deleteDrawingEntity()`).

**Kendraw:** Absent.

---

## 8. SHIFT+CLICK ADD & CTRL+CLICK TOGGLE

### Ketcher SelectBase.mousedownEntity (L273–346)

```typescript
const modKey = isMacOs ? event.metaKey : event.ctrlKey;
this.mousedownEntity(renderer, event.shiftKey, modKey);

// Inside mousedownEntity:
if (!shiftKey && !modKey) {
  unselectAllDrawingEntities();  // REPLACE
  getAllSelectedEntitiesForEntities([targetEntity]);
} else if (shiftKey) {
  // ADD: merge with current
  getAllSelectedEntitiesForEntities([...selectedArr, ...targetEntity]);
} else if (modKey && isSequenceItem) {
  // TOGGLE chain (special for polymers)
  selectDrawingEntities(drawingEntities);
}
```

### Kendraw

Aucune interaction UI. Selection est data pur.

---

---

# SYNTHÈSE: PATTERNS & ÉCARTS

## Selection UX Patterns que Kendraw Devrait Adopter

1. **Visual Feedback on Selection**
   - Highlight color (e.g., #0066FF) pour atomes/liaisons sélectionnés
   - Bounding box overlay
   - Hover preview color distinct (e.g., #FFCC00)

2. **Selection Interaction Model**
   - Rectangle marquee (drag to select in rectangle)
   - Lasso tool (free-form polygon)
   - Shift+click → add to selection
   - Ctrl/Cmd+click → toggle selection
   - Click sans modifier → replace selection

3. **Drag-to-Move with Live Snapping**
   - Afficher snapping indicators pendant drag
   - Alignment snapping (horizontal/vertical)
   - Angle snapping pour éléments attachés
   - Bond-length snapping recognition

4. **Rotate & Flip as Post-Selection Actions**
   - Rotation handles (visual control points)
   - Snap to 15° increments
   - Flip horizontal/vertical depuis menu

5. **Clipboard Format Strategy**
   - Support native format (KET-like) + MOL V2000 fallback
   - Paste respects offset (cursor position or canvas center)
   - Remap IDs on paste

6. **Undo/Redo Atomicity**
   - Drag movements = single undo entry, not per-pixel
   - Trigger history commit on mouseup
   - Rotation/flip = atomic operation

7. **Arrow Key Nudge**
   - Small displacement per key (e.g., 0.1 Å)
   - Shift modifier for larger step

---

## Kendraw Selection Gaps vs. Ketcher

| Feature | Ketcher | Kendraw | Gap |
|---------|---------|---------|-----|
| **Rectangle Select** | ✓ SelectRectangle | ✗ | UI + interaction |
| **Lasso Select** | ✓ SelectLasso | ✗ | UI + interaction |
| **Fragment BFS** | ✓ SelectFragment | ✓ floodSelectMolecule() | Hover preview missing |
| **Shift+Click ADD** | ✓ SelectBase logic | ✗ | No UI handler |
| **Ctrl/Cmd Toggle** | ✓ SelectBase logic | ✗ | No UI handler |
| **Visual Highlight** | ✓ TransientView | ✗ | No renderer |
| **Bounding Box** | ✓ getSelectedEntitiesBoundingBox() | ✗ | No renderer |
| **Drag Move + Snap** | ✓ mousemove + tryToSnap() | ✗ | Engine missing |
| **Rotate Tool** | ✓ RotateTool | ✗ | No tool |
| **Flip H/V** | ✓ fromFlip() | ✗ | No operation |
| **Arrow Key Nudge** | ? (not explicit) | ✗ | Both unclear |
| **Keyboard Delete** | ✓ (via tool) | ✗ | No handler |
| **Clipboard Format** | ✓ KET + MOL + SMILES | ✓ ClipboardData | Format depth |
| **Undo/Redo Bounds** | ✓ mouseup → history | ✗ | No history layer |

---

## Core File References

### Ketcher (Clean-Room)

- **SelectBase.ts** (42k) — Logique maître: selection state, drag modes, snapping, rotate center
- **SelectRectangle.ts** (100L) — Rectangle marquee implementation
- **SelectLasso.ts** (69L) — Lasso polygon selection
- **SelectFragment.ts** (57L) — Fragment BFS + hover preview
- **rotate.ts** (250+L) — Rotation tool + flip operations
- **clipboardUtils.ts** (78L) — Clipboard API abstraction
- **Command.ts** (78L) — Undo/redo pattern

### Kendraw (Comparative)

- **selection.ts** (63L) — Immutable Selection type + helper functions
- **flood-select.ts** (27L) — BFS for connected fragment
- **clipboard.ts** (44L) — copy/paste logic (pure functions)

---

**Word count:** ~470 lignes | **Analyse depth:** Architecture + UX patterns clean-room


---

## 7. Algorithmes de rendu et chimie


### 2. Rendu et géométrie visuelle

#### 2.1 Pipeline de rendu

**Chemin principal** (`packages/ketcher-core/src/application/render/`):
- `renderStruct.ts` : Orchestration du rendu complet
- `draw.ts` (47k lignes) : Primitives SVG (flèches, formes géométriques)
- Renderers spécialisés (`renderers/BondRenderer.ts`, `renderers/AtomRenderer.ts`):
  - **BondRenderer** : Gère types de liaisons (simple, double, triple, aromatique, wedge/hash)
  - **AtomRenderer** : Labels, radicaux, charges, isotopes, marques CIP (R/S)

**Moteur graphique** : D3.js + Raphael (SVG natif)
```typescript
// /packages/ketcher-core/src/application/render/renderers/BondPathRenderer/constants.ts
export const BondDashArrayMap = {
  [BondType.Aromatic]: '6',
  [BondType.SingleDouble]: '6',
  [BondType.SingleAromatic]: '4 4 1 4',
  [BondType.DoubleAromatic]: '4 4 1 4',
};
```

#### 2.2 Stéréochimie : Représentation visuelle

**Fichiers clés** : `BondPathRenderer/SingleUpBondPathRenderer.ts`, `SingleDownBondPathRenderer.ts`

Wedges (montantes) et hashes (descendantes) sont rendus comme des polygones SVG :
```typescript
// Wedge (liaison ascendante)
M${startPosition.x},${startPosition.y}
L${bondEndFirstPoint.x},${bondEndFirstPoint.y}
L${bondEndSecondPoint.x},${bondEndSecondPoint.y}
Z
```

**Marques CIP (R/S)** : Renderées comme texte + rectangle de sélection
- Stockées dans `atom.cip` (enum `AtomCIP.R | AtomCIP.S | AtomCIP.r | AtomCIP.s`)
- Calculées **serveur** via `/indigo/calculate_cip`
- Affichées dans `reatom.ts` (2052 lignes) : gestion d'étiquettes complexes

---

### 3. Aromaticité : Détection et rendu

**Fichiers clés** : `remoteStructService.ts`, `aromaticFusing.ts`

Ketcher déporte **entièrement** l'aromaticité serveur :
- `/indigo/aromatize` : Détecte et annote les liaisons aromatiques
- `/indigo/dearomatize` : Revient à notation alternée (double/simple)

**Rendu dual** :
- Mode aromatique : trait continu avec tirets `'6'` (cercle implicite)
- Mode alternant : doubles liaisons explicites ou simple

```typescript
// packages/ketcher-core/src/domain/entities/bond.ts
PATTERN.TYPE = {
  AROMATIC: 4,
  SINGLE_OR_AROMATIC: 6,
  DOUBLE_OR_AROMATIC: 7,
}
```

---

### 4. Stéréocentres : Règles CIP et calcul

**Approche hybride** :
- **Client** : Stockage des orientations wedge/hash (`bond.stereo`)
- **Serveur** : Calcul CIP R/S via `/indigo/calculate_cip`

**Données stockées** (`atom.ts`, `bond.ts`):
```typescript
// AtomAttributes
stereoParity?: number;        // Stéréoparité détectée
stereoLabel?: string | null;  // 'abs', '&', 'or'
cip?: AtomCIP | null;        // R, S, r, s (priorité)

// BondAttributes
stereo?: number;  // UP (1), DOWN (6), EITHER (4), CIS_TRANS (3)
cip?: BondCIP;    // E, Z, M, P
```

**Pas de CIP client** : Le calcul de priorités (Cahn-Ingold-Prelog) est complexe et demeure serveur.

---

### 5. Fusion d'anneaux

**Fichier** : `packages/ketcher-core/src/application/editor/actions/aromaticFusing.ts`

Logique minimale côté client :
```typescript
function fromAromaticTemplateOnBond(restruct, template, bid, _events, simpleFusing) {
  const action = simpleFusing(restruct, template, bid);
  return Promise.resolve(action);
}
```

Le vrai calcul (détection d'overlap, calcul de géométrie fusionnée) est **délégué serveur** ou effectué par une fonction `simpleFusing` importée. Ketcher applique des **templates** de benzène/cyclopentadiène et adapte la géométrie au lien existant.

---

### 6. Abréviations et S-Groups

**Fichier** : `packages/ketcher-core/src/domain/entities/sgroup.ts` (>300 lignes)

S-Groups (SuperatomGroups) stockent étiquettes (Ph, Me, Et, Boc, etc.) :
- Type `SUP` (SUperAtom)
- Champ `data.name` : libellé chimique (ex. "Ph")
- Champ `data.expanded` : boolean (montré vs contracté)
- Atomes + liaisons encapsulées dans `atoms[]`, `bonds[]`

**Expand/contract** : Opération algébrique sur restruct, ajout/suppression d'atomes et de liaisons.

---

### 7. Hydrogènes implicites

**Où calculs** : Serveur (aromaticité/valence), client (affichage conditionnel)

**Fichier clé** : `packages/ketcher-core/src/application/render/restruct/reatom.ts` (2052 lignes)

Règles d'affichage (`showHydrogenLabels.ts`):
```typescript
export enum ShowHydrogenLabels {
  Off = 'off',
  Hetero = 'Hetero',          // Hétéroatomes uniquement
  Terminal = 'Terminal',      // Terminaux (degree 1)
  TerminalAndHetero = 'Terminal and Hetero',
  On = 'all',
}
```

Logique de rendu :
- Atomes hétéro (N, O, S, P) avec H implicites → affichage H
- Atomes terminaux en C → affichage H
- Carbone saturé non-terminal → masquage H implicites
- Affichage avec indice (ex. "CH₃") via superscript/subscript SVG

---

### 8. Snapping angulaire et magnétique

**Fichier** : `packages/ketcher-core/src/application/editor/shared/utils.ts`

Angle magnétique : **15° par défaut**
```typescript
let FRAC = Math.PI / 12;  // 15°

function fracAngle(angle, angle2): number {
  return Math.round(angle / FRAC) * FRAC;
}

// Snapping lors création liaison sans Ctrl
const vector = new Vec2(1, 0).rotate(
  ctrlKey ? calcAngle(pos0, pos1) : fracAngle(pos0, pos1)
);
```

**Pas de grid visuelle** dans Ketcher, mais snapping d'angle continu.

---

### 9. Rendu SVG/Canvas : Primitives et paths

**Stratégie** :
- **SVG natif** via Raphael (manipulation DOM direct)
- **Paths SVG** : Générés dynamiquement pour liaisons (single, double, wedge, hash)

**Exemple : Liaison ascendante (wedge)**
```typescript
// packages/ketcher-core/src/application/render/renderers/BondPathRenderer/SingleUpBondPathRenderer.ts
const svgPath: SVGPathAttributes = {
  d: `M${startPos.x},${startPos.y} L${pt1.x},${pt1.y} L${pt2.x},${pt2.y} Z`,
  attrs: { 'stroke-width': '2' }
};
```

**Superscripts/Subscripts** : Positionnement via `<tspan baseline-shift>` ou offsets texte.

Charge (±) et radicaux (•) : Éléments texte SVG indépendants, positionnés relatifs à atome.

---

### 10. Bibliothèque templates et fusion

**Fichier** : `packages/ketcher-core/src/application/editor/actions/template.ts`

Templates internes : Benzène, Cyclopentadiène (structures précalculées)
```typescript
const benzeneMoleculeName = 'Benzene';
const benzeneDoubleBondIndexes = [2, 4];

function fromTemplateOnCanvas(restruct, template, pos, angle) {
  const [action, pasteItems] = fromPaste(
    restruct, template.molecule, pos, angle, isPreview
  );
  action.addOp(new CalcImplicitH(pasteItems.atoms).perform(restruct));
}
```

Sélection + prévisualisation client, fusion géométrique via matching sur liaison sélectionnée.

---

### 11. Services Indigo côté serveur

**Façade** (`remoteStructService.ts`):

| Endpoint | Rôle |
|----------|------|
| `/indigo/convert` | Parse SMILES → KET, formule brute, InChI |
| `/indigo/layout` | Calcul géométrie 2D (positions atomes/liaisons) |
| `/indigo/clean` | Nettoyage : valence, hydrogens, aromaticité |
| `/indigo/aromatize` | Détection + annotation aromaticité |
| `/indigo/dearomatize` | Retour à alternance double/simple |
| `/indigo/calculate_cip` | **CIP R/S, E/Z** |
| `/indigo/check` | Validation structure, warnings |
| `/indigo/automap` | Automap réactants ↔ produits |

---

## Comparaison Kendraw ↔ Ketcher

| Aspect | Ketcher | Kendraw (cible) |
|--------|---------|-----------------|
| **Rendu** | D3/Raphael SVG | Canvas 2D (+ SVG export) |
| **Cleanup** | Indigo serveur | RDKit serveur |
| **CIP/Aromaticité** | Serveur | Serveur (idéal) |
| **Implicit H display** | Règles d'enum | À clarifier |
| **Ring fusion** | Template + matching géométrique | À implémenter |
| **S-Groups** | Complet (expand/contract) | Basic (labels) |

---

## Recommandations Kendraw

### Algorithmes à emprunter (pur math, sans copyright)

1. **Angle snapping (15°)** : `fracAngle()` trivial, réimplémentable en 3 lignes.
2. **Hydrogen display rules** : Enum `ShowHydrogenLabels` + logique d'affichage conditionnel.
3. **Bond path SVG generation** : Pattern pour wedges/hashes (geometric, non-copyrightable).
4. **Template library et fusion** : Concept, pas code (déjà chez RDKit).

### Toujours serveur-side (RDKit)

- Calcul CIP R/S (priorités Cahn-Ingold-Prelog) — trop complexe client
- Aromaticité détection et déperpléxation
- Layout géométrie optimale (2D)
- Valence et chimie générale

### Tricks rendu à adopter

1. **Wedge/hash comme polygones SVG**, pas glyphes spécialisés
2. **Marques CIP comme texte + rectangle** pour sélection
3. **Snapping magnétique 15°** lors création liaison (Ctrl = libre)
4. **Hydrogen indices** (ex. "H₂") via subscript SVG dynamique
5. **Multi-renderer pattern** : Classe par type (Bond, Atom, SGroup) pour maintenabilité

---

## Conclusion

Ketcher délègue massivement au serveur (Indigo) : CIP, aromaticité, chimie générales, layout. Le client affiche et offre UX (snapping, templates, S-Groups). Kendraw peut emprunter **sans risque** :
- Snapping angulaire
- Règles d'affichage H
- Patterns SVG stéréo (wedge/hash)
- Architecture renderer multitype

Mais **garder RDKit serveur** pour chimie sérieuse (CIP, aromaticité, valence).

---

## 8. Tableau comparatif Kendraw / Ketcher / ChemDraw

### 8.1 Canvas et interactions

| Capacité | Ketcher | ChemDraw | Kendraw V0.4 | Écart |
|---|---|---|---|---|
| Moteur de rendu | SVG (Raphael.js) | Canvas 2D + vectoriel interne | Canvas 2D `renderer-canvas` | Kendraw aligné Canvas — OK |
| Hit-test | O(n) `closest.item()`, seuils 0.4/0.32 | Grille interne | `SpatialIndex` quadtree-like | Kendraw plus scalable |
| Hover preview | `editor.hover()` + `hoverIcon` | Ghost de prévisualisation | Partiellement (tool cursor) | **P0 : ajouter hoverIcon** |
| Drag bond avec angle auto | `vectorUtils.fracAngle()` 30° snap + Ctrl=libre | Snap 15°/30° configurable | Ctrl+E snap 30° existant | **P0 : rendre snap 15° par défaut, Shift=libre** |
| Zoom | D3-zoom Ctrl+wheel, 0.2×–4× | Pinch + Ctrl+wheel | Ctrl+wheel + Ctrl+=/- | Déjà bien |
| Pan | Hand tool + viewBox | Spacebar + drag | Space + drag | OK |
| Sélection cadre | Rectangle + Lasso | Lasso par défaut | Flood-select seulement | **P0 : ajouter marquee+lasso** |

### 8.2 Data model

| Capacité | Ketcher | ChemDraw | Kendraw V0.4 | Écart |
|---|---|---|---|---|
| Structure fondamentale | `Struct { Pool<Atom>, Pool<Bond>, Pool<SGroup> }` | Objets propriétaires CDX | `Page { atoms, bonds, arrows, annotations, groups, shapes }` Records | Kendraw plus simple — OK |
| Immutabilité | Mutable via `Command.execute()/invert()` réversible | Snapshots | Immer draft + snapshot stacks | Kendraw *plus propre* |
| Undo/redo | Pointer-based, 32 commands | Linéaire illimité | 200 snapshots FIFO | Kendraw plus profond |
| Fragments multiples | Oui, via `Fragment` | Oui | Implicite (composants connexes) | P2 : expliciter fragments |
| Reactions | `RxnArrow`, `RxnPlus` | Classique | Arrow type étendu | OK après wave-3 |
| Format natif | KET (JSON) | CDX binaire | KDX (JSON) | Aligné |

### 8.3 Toolbox et toolbar

| Capacité | Ketcher | ChemDraw | Kendraw V0.4 | Écart |
|---|---|---|---|---|
| Groupes | 8 groupes (Select, Hand, Erase, Atoms, Bonds, Rings, Chain, Tools) | 10+ groupes (Main, Style, Annotation, Chain, Ring, etc.) | 8 groupes | OK |
| Sous-menus | `MultiToolButton` + Portal, `GroupedMultiTool` avec séparateurs | Long-press | Long-press `ArrowSubmenu`, `ShapeSubmenu`, `ChainSubmenu` | **P1 : uniformiser via composant générique** |
| Responsive | `ResizeObserver` height≤770 → collapse | Fixe | Pas de responsive | **P1 : collapse sur petit écran** |
| Active state | Bleu primaire + blanc texte | Bordure bleue | Bleu background CSS | OK |
| Tooltip + shortcut | `<kbd>` + title natif | Tooltip custom | Tooltip `title=` | **P2 : `<kbd>` inline** |

### 8.4 Raccourcis clavier

| Raccourci | Ketcher | ChemDraw | Kendraw V0.4 |
|---|---|---|---|
| Atome C/N/O/F/P/S/H | C/N/O/F/P/S/H | Même | Même |
| Liaison simple/double/triple | 1/2/3 | Même | 1/2/3 |
| Wedge/Hash | W / Shift+W | 6/7 | W / Shift+W |
| Select marquee/lasso/fragment | Shift+Tab cycle | Esc puis clic | Pas de cycle | **P0** |
| Eraser | Del (et outil dédié) | Del | Del | OK |
| Undo/Redo | Ctrl+Z / Ctrl+Y | Même | Ctrl+Z / Ctrl+Shift+Z | OK |
| Copy image | Ctrl+Shift+F | Ctrl+C image | Ctrl+C | P3 |
| Copy MOL/KET | Ctrl+Shift+M / Ctrl+Shift+K | n/a | Export manuel | **P2 : ajouter** |
| Toggle propriétés atome/bond au survol | `/` | n/a (double-click) | Pas de toggle | **P1 : ajouter `/`** |
| Deselect all | Ctrl+Shift+A | Ctrl+Shift+A | Ctrl+D | **P2 : harmoniser** |
| Zoom in/out/reset | Ctrl+= / Ctrl+- / Ctrl+0 | Même | Même | OK après wave-2 |

### 8.5 Algorithmes

| Capacité | Ketcher | ChemDraw | Kendraw V0.4 | Écart |
|---|---|---|---|---|
| Angle snap | fracAngle 30° sauf Ctrl | 15° configurable | 30° toggle via Ctrl+E | **P0 : toggle 15°/30° et Shift=libre** |
| Wedge/Hash rendu | SVG polygon triangles | Vectoriel natif | Canvas lineTo + fill | **P1 : harmoniser avec geometry helpers** |
| Hydrogènes implicites | Règles `ShowHydrogenLabels` par type | Configurable | Calcul valence + affichage terminal | **P1 : règles plus proches des standards** |
| Aromaticité cercle | Alternance + cercle selon mode | Cercle | Alternance seulement | **P2 : toggle cercle/Kekulé** |
| CIP (R/S) | Serveur Indigo | Client | RDKit serveur | OK — garder RDKit |
| Fusion de cycles | Click sur bond + outil ring | Même | Template direct | **P1 : fusion in-place** |
| Abréviations (Ph, Me, Boc) | `SGroup` expand/contract | Groupes dépliables | Pas de support | **P1 : ajouter groupes labels (partie fait en wave-3 A4)** |
| Layout auto | Indigo `layout()` serveur | Client intégré | RDKit `cleanup` serveur | OK |

---

## 9. Liste priorisée P0 / P1 / P2 / P3

### 9.1 P0 — Bloquants « expérience de dessin fluide »

Ce qui fera qu'un chimiste aura la sensation « ça marche comme Ketcher/ChemDraw »
plutôt que « c'est un prototype ».

- **P0-01 : HoverIcon atome + bond** — preview sémantique au survol (couleur
  élément, épaisseur bond order). Condition sine qua non de la fluidité.
  Fichiers Ketcher : `packages/ketcher-react/src/script/editor/Editor.ts`
  (hover API), `tool/atom.ts` (hoverIcon preview).
- **P0-02 : Angle snap 15° par défaut, Shift=libre** — aujourd'hui Kendraw
  fait 30° et via Ctrl+E. L'inverse est plus ergonomique. Ketcher :
  `packages/ketcher-core/src/application/editor/shared/utils.ts` (fracAngle).
- **P0-03 : Sélection rectangle + lasso** — outils dédiés + cycle
  Shift+Tab. Aujourd'hui Kendraw n'a que flood-select sur double-clic.
  Ketcher : `packages/ketcher-core/src/application/editor/tools/select/SelectBase.ts`.
- **P0-04 : Poignées de transformation (déplacement) sur sélection** —
  drag déplace tous les atomes sélectionnés ; snapping live pendant
  drag ; undo atomique à mouseup. Ketcher : `SelectBase.mousemove`.
- **P0-05 : `/` toggle panneau de propriétés atome/bond au survol** —
  micro-interaction emblématique de Ketcher qui accélère l'édition.
- **P0-06 : Architecture tool-abstraction uniformisée** — chaque outil
  implémente `{ mousedown, mousemove, mouseup, cancel, keydown? }` en
  un objet typé. Permet de brancher de nouveaux outils sans toucher à
  `Canvas.tsx` (aujourd'hui un fichier de 1729 lignes monolithique).
- **P0-07 : Feature flag `VITE_ENABLE_NEW_CANVAS`** — le nouveau canvas
  coexiste avec l'ancien, activable via `.env.local`. Par défaut `false`
  pendant toute la wave-4.
- **P0-08 : Module `canvas-editor` (nouveau package)** — ou sous-dossier
  `packages/ui/src/canvas-new/`, isolé pour ne pas casser l'ancien.

### 9.2 P1 — Qualitatif « pro »

- **P1-01 : Sous-menus responsive (collapse sur height ≤ 770)** —
  Ketcher : `packages/ketcher-react/src/script/ui/views/toolbars/mediaSizes.ts`.
- **P1-02 : `<kbd>` inline dans les boutons** — montrer le raccourci.
- **P1-03 : Fusion de cycles in-place** — cliquer sur un bond avec l'outil
  benzene fait fusionner le cycle avec la molécule existante.
- **P1-04 : Groupes expansibles (Ph, Me, Et, Boc)** — déjà amorcé via
  wave-3 A4 (Shift+group labels) ; finaliser avec expand/contract.
- **P1-05 : Rotate handle sur sélection** — poignée visuelle de rotation
  au centre-haut de la bounding box.
- **P1-06 : Flip horizontal / vertical** — menu contextuel + raccourci.
- **P1-07 : Règles d'affichage des hydrogènes implicites plus proches**
  des standards Ketcher (`ShowHydrogenLabels`).
- **P1-08 : Copie MOL / KET / image via Ctrl+Shift+M/K/F**.

### 9.3 P2 — Enrichissement

- **P2-01 : Toggle aromaticité cercle vs Kekulé** — option document-wide.
- **P2-02 : Fragments explicites** — indiquer les composants déconnectés.
- **P2-03 : Library picker de templates** — aujourd'hui Kendraw a des
  templates hardcodés ; Ketcher propose un panneau library.
- **P2-04 : Deselect all harmonisé Ctrl+Shift+A**.
- **P2-05 : Copie image PNG/SVG via Ctrl+Shift+F**.
- **P2-06 : Smart autosuggest abbreviations** — quand l'utilisateur tape
  "Ph" dans un atome, proposer l'expansion.

### 9.4 P3 — Nice to have / wave-5+

- **P3-01 : OCR d'image vers structure** — complexe, backend ML.
- **P3-02 : R-groups + S-groups complexes**.
- **P3-03 : Polymer editor** — hors scope Kendraw.
- **P3-04 : 3D viewer intégré** — hors scope.
- **P3-05 : Collaboration temps réel**.

### 9.5 Sélection Wave-4 (8 stories P0 cibles)

Les 8 stories P0 suivantes sont **la cible minimum** de cette wave-4 redraw :

| # | Story W4-R | Effort | Dépendances |
|---|---|---|---|
| 1 | W4-R-01 : Feature flag + squelette `canvas-new` | S | — |
| 2 | W4-R-02 : Tool abstraction `{mousedown,mousemove,mouseup,cancel}` | M | R-01 |
| 3 | W4-R-03 : Rendering Canvas 2D partagé avec l'ancien | S | R-01 |
| 4 | W4-R-04 : HoverIcon atome + bond | M | R-02, R-03 |
| 5 | W4-R-05 : Angle snap 15° Shift=libre | S | R-02 |
| 6 | W4-R-06 : Sélection rectangle marquee | M | R-02 |
| 7 | W4-R-07 : Drag déplacement de sélection + undo atomique | L | R-06 |
| 8 | W4-R-08 : `/` toggle mini-panneau propriétés au survol | S | R-04 |

Les P1+ sont **parkées** dans `docs/deferred-work-wave-4.md` pour wave-5.

---

## 10. Ce que Kendraw garde tel quel

Voici ce qui **ne doit PAS être touché** dans cette wave :

- `packages/nmr/` — tout le moteur NMR avec DEPT, multiplets, overlay,
  intégration, 6 solvants, confidence, bidirectional highlighting.
- `packages/ui/src/PropertyPanel.tsx` — panneau droite (MW, LogP, tPSA,
  Lipinski, InChI, SMILES).
- `packages/api-client/` — client FastAPI vers `/api/v1/compute/*`.
- `packages/io/src/cdxml-parser.ts`, `mol-v2000.ts`, `smiles-parser.ts`,
  `cdxml-writer.ts`, `jcamp-dx.ts`, `kdx-serializer.ts` — tout le I/O
  reste inchangé.
- `packages/constraints/` — valence et règles chimiques.
- `packages/persistence/` — audit trail hash-chain et record lock/ESig.
- `packages/io/src/pubchem/` — import PubChem.
- Scripts de déploiement Traefik, Dockerfiles.
- Le backend Python FastAPI en entier.
- `scripts/full-check.sh`, pre-commit hook, CI GitHub Actions.

Le nouveau canvas consomme le `SceneStore` existant via `createSceneStore()`
— pas de migration de format. La coexistence est garantie par un feature
flag **à l'intérieur de `packages/ui/src/App.tsx`** :

```tsx
// packages/ui/src/App.tsx
import { FEATURE_FLAGS } from './config/feature-flags';

export function App() {
  // ...
  return FEATURE_FLAGS.newCanvas
    ? <CanvasNew store={store} toolState={toolState} ... />
    : <Canvas store={store} toolState={toolState} ... />;
}
```

Les deux canvas reçoivent **le même store** : un utilisateur peut ouvrir
un document dans l'ancien canvas, toggler le flag, recharger, et retrouver
sa molécule intacte dans le nouveau. Zéro migration.

---

## 11. Ce que Kendraw NE reprend PAS et pourquoi

### 11.1 Raphael.js et le pipeline SVG Ketcher

Ketcher rend via `Raphael.paper` (SVG indirect, API 2008-era). Kendraw
rend déjà en Canvas 2D natif via `renderer-canvas`, ce qui est **plus
performant**, plus simple à débugger (on peut inspecter le contexte),
et évite la complexité d'un shim SVG. On garde Canvas 2D.

### 11.2 `Struct` / `ReStruct` duplication

Ketcher a un modèle domaine (`Struct`) + un modèle de rendu (`ReStruct`)
avec dirty-tracking. Utile quand le rendu est SVG stateful. En Canvas 2D,
on re-peint tout à chaque frame, ce qui rend le dirty-tracking inutile
pour les tailles typiques (<200 atomes). On garde `Document` + repaint
complet via `requestAnimationFrame`.

### 11.3 Indigo WASM / service Indigo

Ketcher délègue layout, aromaticité, CIP, structure-check à un backend
Indigo (Java/C++). Kendraw utilise RDKit via FastAPI : **équivalent
fonctionnel**, pas de double infrastructure.

### 11.4 KET format natif

Ketcher a inventé KET (JSON) pour contourner les limites de MOL/RXN.
Kendraw a déjà **KDX** (notre JSON) qui couvre atomes + bonds + flèches +
annotations + formes + NMR metadata. Pas besoin d'aligner sur KET.
Import/export KET en P3 si demande utilisateur.

### 11.5 MobX / Redux / class-based tools

L'édition Ketcher repose sur classes mutables, MobX observables, et
un historique pointer-based sur commands. Kendraw utilise Zustand +
Immer + snapshots FIFO — **approche fonctionnelle**, lisible,
compatible React strict mode. On ne régresse pas vers des classes.

### 11.6 Portal overlays custom

Ketcher a son propre `<Portal>` pour les sous-menus. React 18 fournit
`createPortal` natif ; inutile de réinventer. Sous-menus Kendraw
utilisent déjà `createPortal` dans `ArrowSubmenu` wave-3 A2.

### 11.7 Les icônes SVG Ketcher

**Interdit de les copier** (même si Apache 2.0 le permet techniquement,
on garde une identité visuelle Kendraw propre). Kendraw utilise ses
icônes textuelles existantes (emoji + texte court) ou Lucide.

### 11.8 Polymer editor, OCR, R-groups complexes

Hors scope wave-4. Parkés dans `deferred-work-wave-4.md`.

### 11.9 Ketcher's `hand` tool séparé

Ketcher a un outil dédié pour pan. Kendraw utilise déjà **Space + drag**
qui est le standard ChemDraw / Illustrator / Figma. On garde.

### 11.10 `Shift+Tab` cycle de sélecteurs

Tentant mais conflicte avec le focus keyboard navigation de Kendraw
(on a un flag de débug sur Shift+Tab). On adopte **plutôt V/L/F pour
Select/Lasso/Fragment** comme suggéré par plusieurs panelists
chemdraw-vs-kendraw (v6).

---

## 12. Conclusion

Ketcher est une référence précieuse, mais pas un modèle à reproduire à
l'identique. Ses patterns UX (hover preview, angle snap, sub-menu
responsive, hotkey normalization) sont remarquables ; son implémentation
(Raphael, MobX, classes) date. Kendraw a déjà une base plus moderne
(React 18, Zustand, Immer, Canvas 2D) mais manque des raffinements UX
qui font la différence « prototype vs. produit ».

**Décision architecturale de cette wave-4 redraw** :

- Feature flag `VITE_ENABLE_NEW_CANVAS` ; nouveau canvas coexiste.
- 8 stories P0 (R-01 à R-08) ; toutes les autres parkées.
- Zéro régression sur NMR, Properties, I/O, persistence.
- `docs/THIRD-PARTY-NOTICES.md` crédite Ketcher.
- Chaque fichier nouveau inspiré porte l'en-tête d'attribution.

La suite de cette wave : acte 2 (product writing), acte 3 (architecture),
acte 4 (implémentation).
