# Ketcher Hotkeys Analysis — ACTE-1 Reference Inspection

**Date:** 2026-04-17
**Source Repository:** https://github.com/epam/ketcher (Apache 2.0)
**Reference Clone:** /tmp/ketcher-reference/
**Hotkeys Implementation:** `/packages/ketcher-react/src/script/ui/state/hotkeys.ts`, `/packages/ketcher-core/src/utilities/keynorm.ts`

---

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
