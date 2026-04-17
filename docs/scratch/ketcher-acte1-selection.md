# Analyse Ketcher: Architecture de Sélection, Transformations, Interactions Globales

**Référence clean-room:** `/tmp/ketcher-reference/` (Apache 2.0 license)
**Comparaison:** Kendraw `/home/debian/kendraw/packages/scene/src/`
**Date:** 17 avril 2026 | **Analyse:** Structure de sélection + UX patterns

---

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
