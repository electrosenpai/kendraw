# Analyse Ketcher — Modèle de Données, Actions, Undo/Redo, Formats

**Date:** 17 avril 2026
**Scope:** Clean-room inspiration — patterns conceptuels uniquement, pas de copie code.
**Référence:** /tmp/ketcher-reference/ (Apache 2.0)
**Comparaison:** Kendraw scene package (/home/debian/kendraw/packages/scene/src/)

---

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
