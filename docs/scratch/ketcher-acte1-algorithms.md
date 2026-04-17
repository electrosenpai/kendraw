# Analyse Ketcher : Algorithmes et rendu chimique
## Scope : Architecture rendu + algorithmes chimiques (avril 2026)

### 1. Structure et architecture générale

**Ketcher** (https://github.com/epam/ketcher, Apache 2.0) organise son rendu et ses algorithmes chimiques selon cette hiérarchie :

- **Core** (`packages/ketcher-core/src/`) : Modèles de données et logique chimique
  - `domain/entities/` : Structures de données (Atom, Bond, SGroup, Struct)
  - `application/render/` : Rendu SVG/Canvas via Raphael (2D)
  - `application/editor/` : Opérations et actions chimiques
  - `infrastructure/services/` : Appels serveur Indigo

- **Dépendances serveur** : Indigo WASM + Indigo HTTP API
  - `remoteStructService.ts` : Façade pour appels `/indigo/convert`, `/indigo/layout`, `/indigo/clean`, `/indigo/aromatize`, etc.
  - Calcul CIP (R/S), aromaticité, nettoyage de structure : **tous côté serveur**

---

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
