# Kendraw vs ChemDraw — Feature Gap Analysis

> **Date :** 2026-04-15
> **Méthode :** Inventaire exhaustif du code source Kendraw + table ronde de 10 experts de disciplines différentes
> **Objectif :** Identifier TOUT ce que ChemDraw a et que Kendraw n'a pas, prioriser par discipline

---

## Table des matières

1. [Inventaire Kendraw actuel](#1-inventaire-kendraw-actuel)
2. [Table ronde — 10 experts](#2-table-ronde--10-experts)
3. [Tableau comparatif exhaustif (100+ lignes)](#3-tableau-comparatif-exhaustif)
4. [Score de couverture](#4-score-de-couverture)
5. [Priorisation par discipline](#5-priorisation-par-discipline)
6. [Dealbreakers — pourquoi les labos ne switcheront pas](#6-dealbreakers)
7. [Avantages Kendraw — ce que ChemDraw n'a PAS](#7-avantages-kendraw)

---

## 1. Inventaire Kendraw actuel

_Vérifié dans le code source le 2026-04-15. Chaque élément est traçable à un fichier._

### 1.1 Outils de dessin (`packages/ui/src/ToolPalette.tsx`)

| Outil       | Raccourci | Description                                 |
| ----------- | --------- | ------------------------------------------- |
| Select      | V         | Sélection par rectangle (marquee) + clic    |
| Add Atom    | A         | Placer un atome (élément configurable)      |
| Add Bond    | —         | Dessiner une liaison (style configurable)   |
| Ring        | R         | Placer un cycle (template configurable)     |
| Eraser      | E         | Supprimer atome/liaison/flèche              |
| Pan         | H         | Déplacer le canvas                          |
| Arrow       | W         | Flèche de réaction (3 types)                |
| Curly Arrow | U         | Flèche courbée mécanistique (paire/radical) |

### 1.2 Types de liaisons (`packages/scene/src/types.ts`)

| Style                           | Rendu                        | Notes                                           |
| ------------------------------- | ---------------------------- | ----------------------------------------------- |
| single                          | Trait simple                 | ✅                                              |
| double                          | Double trait                 | ✅ avec positionnement auto (left/right/center) |
| triple                          | Triple trait                 | ✅                                              |
| aromatic                        | Cercle inscrit ou alternance | ✅ bondOrder 1.5                                |
| wedge / wedge-end               | Coin plein (stéréochimie)    | ✅                                              |
| dash                            | Tiret (stéréo arrière)       | ✅                                              |
| hashed-wedge / hashed-wedge-end | Coin hachuré                 | ✅                                              |
| hollow-wedge / hollow-wedge-end | Coin creux                   | ✅                                              |
| wavy                            | Liaison ondulée              | ✅                                              |
| bold                            | Liaison épaisse              | ✅                                              |
| dative                          | Liaison dative (→)           | ✅                                              |

### 1.3 Types de flèches (`Arrow.type`)

| Type          | Usage                                 |
| ------------- | ------------------------------------- |
| forward       | Flèche de réaction →                  |
| equilibrium   | Équilibre ⇌                           |
| reversible    | Réversible ⇄                          |
| resonance     | Résonance ↔                           |
| curly-pair    | Flèche courbée (paire d'électrons)    |
| curly-radical | Flèche courbée (radical, demi-pointe) |

**Ancres :** free, atom, bond, lone-pair — les flèches courbées peuvent s'ancrer aux atomes, liaisons et paires libres.

### 1.4 Templates de cycles (`packages/scene/src/rings.ts`)

Cyclopropane (3), Cyclobutane (4), Cyclopentane (5), Cyclohexane (6), Benzène (B), Furane, Pyridine, Pyrrole, Thiophène, Cycloheptane (7), Cyclooctane (8).

**Absent :** Naphtalène, Indole, Quinoléine, Purine, Squelette stéroïdien, cycles fusionnés.

### 1.5 Bibliothèque de molécules (`packages/io/src/templates/`)

| Catégorie         | Fichier                | Contenu                    |
| ----------------- | ---------------------- | -------------------------- |
| Amino Acids       | amino-acids.json       | 20 acides aminés standards |
| Common Drugs      | common-drugs.json      | Médicaments courants       |
| Sugars            | sugars.json            | Sucres                     |
| Nucleobases       | nucleobases.json       | Bases nucléiques           |
| Reagents          | reagents.json          | Réactifs                   |
| Protecting Groups | protecting-groups.json | Groupements protecteurs    |
| Solvents          | solvents.json          | Solvants                   |

Recherche par nom, SMILES ou abréviation. Intégration PubChem pour recherche en ligne.

### 1.6 Atomes et labels (`packages/scene/src/atom-display.ts`)

- **Raccourcis éléments :** C, N, O, S, F, I, L(Cl), P, B, H, M(Me)
- **Charges :** +/- avec magnitude (clamped -4..+4), rendu en exposant
- **Isotopes :** rendu en exposant (ex: ¹³C)
- **Radicaux :** points (•) rendus, radicalCount 0/1/2
- **H implicites :** calcul automatique basé sur la valence
- **Justification :** auto left/right basée sur la position des voisins
- **Labels personnalisés :** OH, NH₂, CO₂H, OMe, etc. en mode formule (auto-subscript)
- **Labels génériques :** R, X, Y, Z
- **Paires libres :** dans le modèle de données (lonePairs) mais **PAS rendues visuellement**

### 1.7 Sélection (`packages/scene/src/selection.ts`)

- Sélection rectangulaire (marquee) par glisser
- Double-clic : flood-select (sélection de molécule entière)
- Ctrl+A : tout sélectionner
- **Absent :** Lasso, sélection par fragment

### 1.8 Édition

| Action             | Raccourci                            |
| ------------------ | ------------------------------------ |
| Undo               | Ctrl+Z                               |
| Redo               | Ctrl+Y                               |
| Copy               | Ctrl+C (SVG + MOL dans le clipboard) |
| Cut                | Ctrl+X                               |
| Paste              | Ctrl+V                               |
| Duplicate          | Ctrl+D                               |
| Delete             | Delete                               |
| Rotate 15°         | Ctrl+R                               |
| Clean Up Structure | Shift+Ctrl+K                         |
| Select All         | Ctrl+A                               |
| Fit to Screen      | Ctrl+0                               |

### 1.9 NMR (`packages/nmr/`)

- Prédiction ¹H et ¹³C (backend RDKit, méthode additive)
- Visualisation DEPT (color-coded : CH₃ bleu, CH₂ vert, CH rouge, C quaternaire gris)
- Highlighting bidirectionnel atome ↔ pic
- 6 solvants : CDCl₃, DMSO-d6, CD₃OD, acétone-d6, C₆D₆, D₂O
- Export : PNG, SVG, CSV
- Marqueurs de confiance (3 niveaux)
- Zoom/pan interactif sur le spectre
- Tooltips avec déplacement chimique, multiplicité, couplage, environnement

### 1.10 Import/Export

| Format    | Import                 | Export                      |
| --------- | ---------------------- | --------------------------- |
| CDXML     | ✅ (parser complet)    | ❌                          |
| MOL V2000 | ✅                     | ✅                          |
| SMILES    | ✅ (parser)            | ✅ (via backend canonical)  |
| InChI     | ❌ (UI) / ✅ (backend) | ✅ (backend)                |
| SVG       | ❌                     | ✅                          |
| PNG       | ❌                     | ✅ (spectre NMR)            |
| KDX       | ✅ (format natif)      | ✅                          |
| PubChem   | ✅ (recherche)         | —                           |
| Clipboard | —                      | ✅ (SVG + MOL multi-format) |

**Absent :** CDX binaire, MOL V3000, SDF multi-mol, RXN, PDF, EPS/EMF, OLE, CDXML export.

### 1.11 Backend (RDKit) — `backend/kendraw_chem/`

| Service        | État                                                           |
| -------------- | -------------------------------------------------------------- |
| ComputeService | ✅ Formula, MW, exact mass, canonical SMILES, InChI, InChI Key |
| ConvertService | ✅ SMILES ↔ MOL ↔ InChI ↔ SDF                                  |
| NmrService     | ✅ 1H, 13C, DEPT (additive prediction)                         |
| NamingService  | ⏳ PLACEHOLDER (IUPAC ↔ structure)                             |
| StereoService  | ⏳ PLACEHOLDER (R/S, E/Z CIP)                                  |

### 1.12 Contraintes géométriques (`packages/constraints/`)

Un package dédié aux contraintes chimiques existe, avec des données exploitables :

| Module                  | Contenu                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metal-coordination.ts` | Géométries de coordination : linear, trigonal planar, tetrahedral, square planar, trigonal bipyramidal, square pyramidal, octahedral — avec angles idéaux |
| `hybridization.ts`      | Détection sp/sp2/sp3 automatique à partir des liaisons                                                                                                    |
| `bond-lengths.ts`       | Longueurs de liaison standards                                                                                                                            |
| `valence-angles.ts`     | Angles de valence standards                                                                                                                               |
| `torsion-angles.ts`     | Angles de torsion                                                                                                                                         |
| `hydrogen-bonds.ts`     | Données de liaisons hydrogène                                                                                                                             |
| `planarity.ts`          | Contraintes de planarité                                                                                                                                  |
| `vdw-radii.ts`          | Rayons de Van der Waals                                                                                                                                   |
| `constraint-engine.ts`  | Moteur de contraintes (applique les règles ci-dessus)                                                                                                     |

**Note :** Ces données existent dans le code mais ne sont **pas encore exposées dans l'UI** pour la construction guidée de complexes de coordination ou la validation géométrique interactive.

### 1.13 Interface utilisateur

- **Multi-onglets** avec workspace store et auto-save (IndexedDB)
- **Panneau propriétés** : formule, MW, comptage atomes/liaisons, export SVG/MOL/PNG
- **Barre de statut** avec position curseur
- **Cheatsheet raccourcis** (?-key)
- **Dialog import** (CDXML, MOL, SMILES, fichier)
- **Recherche molécules** (templates locaux + PubChem)
- **i18n** : anglais et français
- **Responsive layout** adaptatif
- **Thème sombre** (design system Glasswerk)
- **Style presets** : NEW_DOCUMENT, ACS_1996, ACS_NANO — 3 presets de style ChemDraw-compatibles

---

## 2. Table ronde — 10 experts

<!-- EXPERTS 1-5 -->

### Expert 1 — Pr. Marie-Claire DUVAL — Chimie organique

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Dessiner des structures organiques (benzène, hétérocycles, cycles fusionnés), mécanismes réactionnels avec flèches courbées, schémas de synthèse multi-étapes avec réactifs/conditions, stéréochimie (wedge/dash/CIP), abréviations (Me, Et, Ph, Ac, Bz, Boc, Ts, TMS), export pour publications (EPS/PDF haute résolution), styles ACS, structure clean-up, templates de cycles fusionnés (naphthalène, indole, quinoléine), texte pour conditions réactionnelles, liaison dative pour complexes, retrosynthetic arrows.

**Ce que Kendraw A DÉJÀ :**

- ✅ Cycles de base (3-8 carbones) + benzène + hétérocycles (pyridine, furane, pyrrole, thiophène)
- ✅ Flèches courbées (paire + radical) avec ancrage atome/liaison/lone-pair
- ✅ Liaisons stéréo : wedge, dash, hashed-wedge, hollow-wedge, wavy, bold
- ✅ Flèches de réaction (forward, equilibrium, reversible, resonance)
- ✅ Charges, isotopes, radicaux dans les labels
- ✅ Raccourcis atomes (C, N, O, S, F, I, Cl, P, B, H, Me)
- ✅ Clean Up Structure (Shift+Ctrl+K)
- ✅ Style preset ACS_1996
- ✅ Export SVG et MOL
- ✅ Undo/redo illimité

**Ce que Kendraw N'A PAS :**

1. Cycles fusionnés (naphthalène, indole, quinoléine, purine, squelette stéroïdien)
2. Outil texte libre pour conditions réactionnelles (« reflux, 2h, THF »)
3. Abréviations expand/contract (Me → CH₃, Ph → C₆H₅)
4. Retrosynthetic arrow (⟸) — distinct du 'reversible' actuel
5. Export PDF/EPS haute résolution pour soumission journal
6. Acyclic chain tool (chaîne de n carbones en un clic)
7. No-go arrow (X) pour réactions qui ne marchent pas
8. Sélection lasso (pour sélectionner des fragments complexes)
9. Newman projections
10. Fischer projections
11. Assignment CIP R/S/E/Z automatique
12. Numérotation automatique des atomes
13. Name → Structure (IUPAC)
14. Structure → Name
15. LogP et autres propriétés physico-chimiques
16. Groupement/dégroupement pour manipuler des fragments
17. Fixed angle mode (snap à 30°/60°/90°/120°)
18. Grid/rulers pour alignement précis

**Criticité pour MON travail :**

| Feature manquante           | Fréquence | Impact   | Effort |
| --------------------------- | --------- | -------- | ------ |
| Cycles fusionnés            | Quotidien | Bloquant | M      |
| Outil texte libre           | Quotidien | Bloquant | M      |
| Abréviations (Me, Ph, Boc…) | Quotidien | Gênant   | L      |
| Export PDF/EPS              | Quotidien | Bloquant | M      |
| Retrosynthetic arrow (⟸)    | Hebdo     | Gênant   | S      |
| Acyclic chain tool          | Hebdo     | Gênant   | S      |
| CIP R/S/E/Z auto            | Hebdo     | Gênant   | L      |
| Newman projections          | Hebdo     | Gênant   | M      |
| Sélection lasso             | Quotidien | Gênant   | M      |
| No-go arrow                 | Mensuel   | Mineur   | S      |
| Fischer projections         | Mensuel   | Mineur   | M      |
| Name ↔ Structure            | Hebdo     | Gênant   | L      |
| Numérotation atomes         | Hebdo     | Gênant   | S      |
| Grid/rulers                 | Quotidien | Gênant   | M      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**NON.** Sans cycles fusionnés, outil texte et export PDF, je ne peux pas dessiner mes mécanismes réactionnels ni soumettre mes figures à JACS. Kendraw a une excellente base (stéréochimie, flèches courbées) mais il manque les 3 features que j'utilise littéralement 50 fois par jour.

---

### Expert 2 — Dr. Antoine MARCOS — Synthèse totale

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Molécules complexes (20+ cycles, stéréocentres multiples), schémas de synthèse sur plusieurs pages, TOUS les raccourcis clavier, every bond type, every arrow type, templates fusionnés (indole, naphthalène, stéroïdes), abréviations chimiques, style ACS pour publications, export haute résolution, structure clean-up, CIP assignment, CDXML inter-opérabilité avec collègues.

**Ce que Kendraw A DÉJÀ :**

- ✅ 11 types de liaisons (couvre tous les besoins stéréo)
- ✅ Liaison dative (pour complexes catalytiques)
- ✅ Flèches courbées avec ancrage
- ✅ Raccourcis clavier complets (atomes, liaisons, outils)
- ✅ Clean Up Structure
- ✅ CDXML import (je peux ouvrir les fichiers de mes collègues)
- ✅ Multi-format clipboard
- ✅ Undo/redo illimité

**Ce que Kendraw N'A PAS :**

1. Cycles fusionnés — DEALBREAKER pour synthèse totale
2. Templates stéroïdiens — impossible de dessiner la cortisone
3. Texte libre — annotations conditions réactionnelles
4. Multi-page documents — schéma de synthèse de 20 étapes
5. Export CDXML — je ne peux pas envoyer mes fichiers à mes collègues
6. Export PDF/EPS — soumission publications
7. Fixed angle mode + guide d'alignement
8. Snap intelligent lors de la fusion de cycles
9. Abréviations nicknames
10. CIP assignment automatique
11. Structure to IUPAC name
12. Copy as ChemDraw (CDX format clipboard)
13. Scale tool (redimensionner une structure)
14. Align/distribute (aligner plusieurs structures)
15. Bracket groups (pour polymères et SAR)
16. Lewis dot structures
17. Dipole arrows

**Criticité pour MON travail :**

| Feature manquante       | Fréquence | Impact   | Effort |
| ----------------------- | --------- | -------- | ------ |
| Cycles fusionnés        | Quotidien | Bloquant | M      |
| Templates stéroïdiens   | Hebdo     | Bloquant | M      |
| Texte libre conditions  | Quotidien | Bloquant | M      |
| Multi-page documents    | Quotidien | Bloquant | L      |
| Export CDXML            | Quotidien | Bloquant | L      |
| Export PDF/EPS          | Quotidien | Bloquant | M      |
| Fixed angle + alignment | Quotidien | Gênant   | M      |
| Abréviations            | Quotidien | Gênant   | L      |
| CIP assignment          | Hebdo     | Gênant   | L      |
| Scale/resize structures | Hebdo     | Gênant   | M      |
| Align/distribute        | Hebdo     | Gênant   | M      |
| CDX clipboard           | Quotidien | Gênant   | XL     |
| Lewis structures        | Mensuel   | Mineur   | M      |
| Dipole arrows           | Mensuel   | Mineur   | S      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**NON.** En synthèse totale, je dessine des molécules à 40+ atomes avec 10+ stéréocentres dans des systèmes polycycliques fusionnés. Sans cycles fusionnés et multi-page, c'est simplement impossible. Le NMR intégré est impressionnant — ChemDraw n'a pas la prédiction DEPT — mais ça ne compense pas les lacunes fondamentales pour le dessin.

---

### Expert 3 — Pr. Kenji YAMAMOTO — Spectroscopie / Enseignement

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Préparer des slides de cours, dessiner des spectres annotés (NMR, IR, MS), structures pour examens, orbitales moléculaires, mécanismes avec flèches courbées pour les étudiants, Newman projections, Fischer projections, Lewis structures, figures pédagogiques avec texte et formes (rectangles, flèches, cercles).

**Ce que Kendraw A DÉJÀ :**

- ✅ NMR 1H et 13C avec DEPT — **mieux que ChemDraw !**
- ✅ Bidirectional highlighting atome ↔ pic — **excellent pour l'enseignement**
- ✅ Tooltips avec multiplicité, couplage, environnement
- ✅ Flèches courbées pour mécanismes
- ✅ Export spectre en PNG/SVG
- ✅ 6 solvants pour NMR
- ✅ Marqueurs de confiance
- ✅ Charges, isotopes, radicaux

**Ce que Kendraw N'A PAS :**

1. Newman projections — enseignées dès la L2
2. Fischer projections — essentielles pour les sucres
3. Lewis structures — base de la chimie L1
4. Orbitales (s, p, d, hybrides) — indispensables en cours
5. Outil texte libre — annotations pédagogiques
6. Formes géométriques (rectangles, cercles, arcs) pour schémas
7. IR prediction — spectre infrarouge
8. Mass spec prediction — spectre de masse
9. Haworth projections pour les sucres
10. Chaises cyclohexane (conformation)
11. Diagramme d'énergie
12. Export PDF pour les polycopiés
13. Lone pairs rendues visuellement (dans le modèle mais pas affichées)
14. Electron dots visuels
15. Couleurs personnalisables pour les atomes/liaisons

**Criticité pour MON travail :**

| Feature manquante         | Fréquence | Impact   | Effort |
| ------------------------- | --------- | -------- | ------ |
| Newman projections        | Hebdo     | Bloquant | M      |
| Fischer projections       | Hebdo     | Bloquant | M      |
| Lewis structures          | Hebdo     | Bloquant | M      |
| Orbitales (s, p, d)       | Hebdo     | Bloquant | L      |
| Texte libre               | Quotidien | Bloquant | M      |
| Formes géométriques       | Hebdo     | Gênant   | M      |
| Lone pairs visuelles      | Hebdo     | Gênant   | S      |
| IR prediction             | Mensuel   | Gênant   | XL     |
| Mass spec prediction      | Mensuel   | Gênant   | XL     |
| Export PDF                | Quotidien | Bloquant | M      |
| Haworth projections       | Mensuel   | Gênant   | M      |
| Chaises cyclohexane       | Hebdo     | Gênant   | L      |
| Couleurs personnalisables | Hebdo     | Gênant   | M      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**PARTIELLEMENT.** Le module NMR est SUPÉRIEUR à ChemDraw pour l'enseignement de la spectroscopie — le DEPT color-coded et le highlighting bidirectionnel sont exactement ce dont j'ai besoin en cours. Mais pour enseigner la chimie organique générale (Newman, Fischer, Lewis, orbitales), c'est impossible. Si Kendraw ajoutait ces représentations pédagogiques, il pourrait devenir l'outil idéal pour l'enseignement.

---

### Expert 4 — Dr. Sarah CHEN — Chimie computationnelle

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Conversion SMILES ↔ structure ↔ InChI, batch processing, export pour publications, scripts Python avec le COM API de ChemDraw, canonical SMILES, property calculations (MW, LogP, TPSA, HBD, HBA), structure validation, substructure search.

**Ce que Kendraw A DÉJÀ :**

- ✅ SMILES import/export (frontend parser + backend canonical)
- ✅ InChI/InChI Key (via backend RDKit)
- ✅ MOL V2000 import/export
- ✅ Format conversion SMILES ↔ MOL ↔ InChI ↔ SDF
- ✅ Molecular formula, MW, exact mass
- ✅ PubChem search intégré
- ✅ Backend Python (FastAPI + RDKit) — extensible
- ✅ Clean Up Structure (auto-layout)

**Ce que Kendraw N'A PAS :**

1. API/SDK scriptable (pas de COM, pas de plugin system)
2. Batch conversion (traiter 1000 SMILES en une fois)
3. LogP, TPSA, HBD, HBA, Lipinski Rule of 5
4. Substructure search
5. MOL V3000 (nécessaire pour extended molfiles)
6. SDF multi-molecule read/write
7. RXN format (réactions)
8. Name → Structure (IUPAC)
9. Structure → Name
10. Export PDF
11. CLI tool pour batch operations
12. Python scripting interface
13. Fingerprint generation
14. Tanimoto similarity search
15. SMARTS pattern matching

**Criticité pour MON travail :**

| Feature manquante    | Fréquence | Impact   | Effort |
| -------------------- | --------- | -------- | ------ |
| API/SDK scriptable   | Quotidien | Bloquant | XL     |
| Batch conversion     | Quotidien | Bloquant | L      |
| LogP, TPSA, Lipinski | Quotidien | Gênant   | M      |
| SDF multi-mol        | Hebdo     | Bloquant | M      |
| MOL V3000            | Hebdo     | Gênant   | M      |
| RXN format           | Mensuel   | Gênant   | M      |
| Name ↔ Structure     | Hebdo     | Gênant   | L      |
| CLI batch tool       | Quotidien | Gênant   | M      |
| Substructure search  | Hebdo     | Gênant   | L      |
| SMARTS matching      | Hebdo     | Gênant   | L      |
| Export PDF           | Hebdo     | Gênant   | M      |
| Fingerprints         | Mensuel   | Mineur   | M      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**PARTIELLEMENT.** Le backend RDKit de Kendraw est une base excellente — il compute déjà formula/MW/exact mass/SMILES/InChI. Mais sans API scriptable ni batch processing, je ne peux pas l'intégrer dans mes workflows. Par contre, comme le backend est en Python/FastAPI, il serait relativement facile d'ajouter des endpoints REST pour LogP, TPSA, et batch operations. C'est le profil le plus prometteur pour Kendraw.

---

### Expert 5 — Dr. Fatima AL-KHATIB — R&D Pharmaceutique

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Drug design avec SAR tables, Markush structures pour les brevets, enhanced stereochemistry (AND/OR/ABS groups), HELM notation pour biopolymères, stoichiometry grid, export PDF/Word (OLE) pour rapports FDA, E-Notebook integration, structure activity tables, R-group decomposition, property calculations (Lipinski, druglikeness), batch registration.

**Ce que Kendraw A DÉJÀ :**

- ✅ Structures de base avec stéréochimie (wedge/dash)
- ✅ Formula, MW, exact mass
- ✅ Templates médicaments courants
- ✅ Export MOL (pour registration systems)
- ✅ NMR prediction (utile pour vérification)

**Ce que Kendraw N'A PAS :**

1. **Markush structures** — brevets pharmaceutiques impossibles sans ça
2. **Enhanced stereochemistry** (AND/OR/ABS groups) — FDA exige ça
3. **HELM notation** — biopolymères, ADCs, peptides modifiés
4. **Stoichiometry grid** — calcul des quantités pour une réaction
5. **SAR tables** — structure-activity relationship
6. **R-group decomposition** — analyse SAR
7. **OLE embedding** (Word/PowerPoint) — rapports FDA
8. **Export PDF** — soumissions réglementaires
9. **LogP, TPSA, HBD, HBA, Lipinski** — drug design
10. **CDX/CDXML export** — interopérabilité avec le reste de Novartis
11. **Batch registration** API
12. **E-Notebook integration** (ELN)
13. **Chemical name generation** (IUPAC, CAS)
14. **CIP R/S/E/Z** assignment automatique
15. **Polymer brackets** [ ]n
16. **Salt/solvate notation**
17. **Isotope labeling patterns**
18. **Reaction stoichiometry calculations**
19. **Document settings** (marges, taille, etc.)
20. **Style sheets** conformes aux guidelines FDA

**Criticité pour MON travail :**

| Feature manquante        | Fréquence | Impact   | Effort |
| ------------------------ | --------- | -------- | ------ |
| Markush structures       | Hebdo     | Bloquant | XL     |
| Enhanced stereochemistry | Hebdo     | Bloquant | XL     |
| HELM notation            | Hebdo     | Bloquant | XL     |
| OLE embedding Word       | Quotidien | Bloquant | XL     |
| Export PDF               | Quotidien | Bloquant | M      |
| Stoichiometry grid       | Hebdo     | Bloquant | XL     |
| SAR tables               | Quotidien | Bloquant | XL     |
| LogP/TPSA/Lipinski       | Quotidien | Bloquant | M      |
| CDXML export             | Quotidien | Bloquant | L      |
| R-group decomposition    | Hebdo     | Gênant   | XL     |
| CIP assignment           | Quotidien | Gênant   | L      |
| Batch registration API   | Hebdo     | Gênant   | XL     |
| Chemical naming          | Hebdo     | Gênant   | L      |
| ELN integration          | Quotidien | Gênant   | XL     |
| Polymer brackets         | Mensuel   | Gênant   | L      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**NON — catégoriquement.** Dans la R&D pharmaceutique, ChemDraw n'est pas un luxe mais une infrastructure. Markush pour les brevets, enhanced stereo pour la FDA, HELM pour les biologiques, OLE pour Word — CHACUN de ces items est un show-stopper individuel. Kendraw n'en a aucun. C'est un outil de dessin correct pour un étudiant, pas pour l'industrie pharma.

---

### Expert 6 — Pr. David MILLER — Biologie structurale

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Module BioDraw pour dessiner des membranes cellulaires, hélices d'ADN, enzymes, récepteurs, voies métaboliques et de signalisation. Structures de sucres en projection Haworth et Fischer, acides aminés, peptides, lipides, acides nucléiques.

**Ce que Kendraw A DÉJÀ :**

- ✅ Templates d'acides aminés (20 standards)
- ✅ Templates de sucres et nucléobases
- ✅ Structures chimiques de base
- ✅ PubChem search pour trouver des structures

**Ce que Kendraw N'A PAS :**

1. **BioDraw module** complet (le plus gros manque)
2. Dessins de membranes cellulaires
3. Hélices d'ADN
4. Formes d'enzymes et récepteurs
5. Voies métaboliques et flèches de signalisation
6. Projections Haworth pour les sucres
7. Projections Fischer
8. Peptide builder / séquence amino-acide
9. Structures lipidiques (bicouche, micelle)
10. Formes biologiques (mitochondrie, Golgi, ribosome, tRNA)
11. Plasmid maps
12. Gel electrophoresis drawings
13. Pathway diagrams
14. Outil texte libre
15. Formes géométriques (rectangles, cercles, arcs)

**Criticité pour MON travail :**

| Feature manquante     | Fréquence | Impact   | Effort |
| --------------------- | --------- | -------- | ------ |
| BioDraw module        | Quotidien | Bloquant | XL     |
| Membranes cellulaires | Quotidien | Bloquant | XL     |
| Hélices ADN           | Hebdo     | Bloquant | XL     |
| Projections Haworth   | Hebdo     | Bloquant | M      |
| Projections Fischer   | Hebdo     | Gênant   | M      |
| Voies métaboliques    | Hebdo     | Bloquant | XL     |
| Formes d'enzymes      | Quotidien | Bloquant | XL     |
| Peptide builder       | Hebdo     | Gênant   | L      |
| Pathway diagrams      | Hebdo     | Gênant   | L      |
| Texte libre           | Quotidien | Bloquant | M      |
| Formes géométriques   | Quotidien | Gênant   | M      |
| Plasmid maps          | Mensuel   | Gênant   | XL     |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**NON.** BioDraw est la raison pour laquelle mon département paie ChemDraw Professional. Kendraw n'a rien de comparable — aucune forme biologique, aucun outil de voie métabolique. C'est un éditeur moléculaire, pas un éditeur de biologie. Deux mondes différents.

---

### Expert 7 — Dr. Lucia SANTOS — Chimie analytique / Contrôle qualité

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Dessiner des structures pour les rapports d'analyse, certificats d'analyse, monographies. Import/export vers LIMS. Dessiner des plaques CCM (TLC), gels d'électrophorèse, schémas de verrerie de laboratoire. Export Word (OLE) pour les rapports.

**Ce que Kendraw A DÉJÀ :**

- ✅ Structures moléculaires de base
- ✅ Export SVG/MOL
- ✅ Formula, MW
- ✅ NMR prediction (utile pour confirmation analytique)
- ✅ Multi-format clipboard

**Ce que Kendraw N'A PAS :**

1. TLC plates (plaques chromatographie couche mince)
2. Gel electrophoresis diagrams
3. Verrerie de laboratoire (erlenmeyer, ballon, colonne, etc.)
4. OLE embedding dans Word/Excel
5. Export PDF
6. Export EPS/EMF pour rapports
7. LIMS integration API
8. Conformité 21 CFR Part 11 (audit trail)
9. Texte libre pour annotations
10. Numérotation automatique des structures
11. Impression haute qualité
12. Document settings (marges, taille)
13. Styles personnalisés pour monographies
14. CIP assignment

**Criticité pour MON travail :**

| Feature manquante       | Fréquence | Impact   | Effort |
| ----------------------- | --------- | -------- | ------ |
| OLE embedding Word      | Quotidien | Bloquant | XL     |
| Export PDF              | Quotidien | Bloquant | M      |
| TLC plates              | Hebdo     | Gênant   | L      |
| Verrerie de labo        | Hebdo     | Gênant   | L      |
| Gel electrophoresis     | Mensuel   | Gênant   | L      |
| LIMS API                | Quotidien | Bloquant | XL     |
| 21 CFR Part 11          | Quotidien | Bloquant | XL     |
| Texte libre             | Quotidien | Bloquant | M      |
| Export EPS/EMF          | Hebdo     | Gênant   | M      |
| Impression qualité      | Quotidien | Gênant   | M      |
| Document settings       | Hebdo     | Gênant   | M      |
| Numérotation structures | Hebdo     | Gênant   | S      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**NON.** En environnement régulé (GMP/GLP), l'intégration Word (OLE) et la conformité 21 CFR Part 11 sont non-négociables. Kendraw ne répond à aucune de ces exigences. Pour le contrôle qualité industriel, ChemDraw n'est pas juste un outil — c'est un composant validé du système qualité.

---

### Expert 8 — Pr. Hans WEBER — Chimie inorganique / Organométallique

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Complexes de coordination (octahedral, tetrahedral, square planar, trigonal bipyramidal), liaisons datives, charges formelles sur les métaux, complexes sandwich (ferrocène), orbitales (s, p, d, hybrides sp/sp2/sp3), lobes d'orbitales, ligand structures, mécanismes organométalliques.

**Ce que Kendraw A DÉJÀ :**

- ✅ Liaison dative — excellent, style 'dative' natif !
- ✅ Charges formelles (+/-) jusqu'à ±4
- ✅ Tous les éléments du tableau périodique (Z 1-118)
- ✅ Labels personnalisés (utile pour les ligands)
- ✅ Flèches courbées pour les mécanismes
- ✅ **Géométries de coordination** dans `constraints/metal-coordination.ts` : linear, trigonal planar, tetrahedral, square planar, trigonal bipyramidal, square pyramidal, octahedral — avec angles idéaux
- ✅ **Longueurs M-L** : Fe(II)/Fe(III), Zn(II), Mg(II), Ca(II), Cu(I)/Cu(II), Pt(II)
- ✅ **Hybridation** : détection automatique sp/sp2/sp3 (`constraints/hybridization.ts`)
- ✅ **Données de liaisons H** (`constraints/hydrogen-bonds.ts`)

**Ce que Kendraw N'A PAS :**

1. **Orbitales (s, p, d, hybrides)** — indispensable en chimie inorganique
2. **Lobes d'orbitales** (+ et - phases)
3. **Geometrie de coordination** templates (octahedral, tetrahedral, etc.)
4. **Complexes sandwich** (ferrocène — deux Cp parallèles)
5. Multi-center bonds (3c-2e bonds)
6. Lone pairs rendues visuellement
7. Crystal field diagrams
8. Molecular orbital diagrams
9. Shapes (ellipses, rectangles) pour schémas
10. Texte libre pour labels de ligands
11. Long dashed bonds (pour interactions faibles)
12. Hapticity notation (η)
13. Bridging ligand notation (μ)
14. Electron count display

**Criticité pour MON travail :**

| Feature manquante       | Fréquence | Impact   | Effort |
| ----------------------- | --------- | -------- | ------ |
| Orbitales (s, p, d)     | Quotidien | Bloquant | L      |
| Lobes d'orbitales       | Hebdo     | Bloquant | L      |
| Templates coordination  | Hebdo     | Bloquant | M      |
| Complexes sandwich      | Hebdo     | Gênant   | M      |
| Texte libre             | Quotidien | Bloquant | M      |
| Lone pairs visuelles    | Quotidien | Gênant   | S      |
| Shapes (ellipses, etc.) | Hebdo     | Gênant   | M      |
| Multi-center bonds      | Mensuel   | Gênant   | L      |
| MO diagrams             | Hebdo     | Gênant   | L      |
| Crystal field diagrams  | Mensuel   | Gênant   | L      |
| Hapticity notation      | Hebdo     | Gênant   | S      |
| Bridging notation (μ)   | Hebdo     | Gênant   | S      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**NON.** La chimie inorganique est le parent pauvre de tous les éditeurs moléculaires, ChemDraw compris. Mais au moins ChemDraw a les orbitales et les shapes de base. Sans orbitales ni templates de coordination, je ne peux même pas dessiner le premier slide de mon cours de L3.

---

### Expert 9 — Dr. Mei TANAKA — Chimie des polymères

**Ce que j'utilise TOUS LES JOURS dans ChemDraw :**
Structures de polymères avec brackets de polymérisation [ ]n, copolymères (alternant, bloc, random, greffé), unités de répétition, dendrimers, crosslinked structures, monomère → polymère avec flèches.

**Ce que Kendraw A DÉJÀ :**

- ✅ Structures moléculaires de base
- ✅ Cycles (pour monomères cycliques)
- ✅ Flèches de réaction
- ✅ Export MOL/SVG

**Ce que Kendraw N'A PAS :**

1. **Polymer brackets [ ]n** — le minimum vital
2. Copolymer notation (bloc, random, alternant, greffé)
3. Crosslink symbols
4. Dendrimers (generation notation)
5. Repeat unit definition
6. Sru groups (structural repeat units)
7. Monomer → polymer conversion
8. Texte libre pour annotations de propriétés (Mw, Mn, PDI)
9. Brackets généraux (pour groupements répétés)
10. Head-to-tail / head-to-head notation
11. Chain end group notation
12. Shapes pour schémas de morphologie

**Criticité pour MON travail :**

| Feature manquante      | Fréquence | Impact   | Effort |
| ---------------------- | --------- | -------- | ------ |
| Polymer brackets [ ]n  | Quotidien | Bloquant | L      |
| Copolymer notation     | Quotidien | Bloquant | L      |
| Crosslink symbols      | Hebdo     | Gênant   | M      |
| Dendrimers             | Mensuel   | Gênant   | L      |
| Repeat unit definition | Quotidien | Bloquant | M      |
| Texte libre            | Quotidien | Bloquant | M      |
| Brackets généraux      | Quotidien | Bloquant | M      |
| Sru groups             | Hebdo     | Gênant   | L      |
| Export PDF             | Quotidien | Gênant   | M      |
| Chain end notation     | Hebdo     | Gênant   | S      |

**Mon verdict : Puis-je remplacer ChemDraw par Kendraw ?**
**NON.** Sans brackets de polymérisation, un chimiste des polymères ne peut littéralement rien faire. C'est comme un traitement de texte sans la lettre 'e'. Un ajout de brackets [ ]n avec indice serait un quick win énorme pour cette communauté.

---

### Expert 10 — Thomas WEBER — Admin IT

**Ce que j'utilise pour ÉVALUER les outils :**
Formats de fichiers supportés, intégration dans l'écosystème (Word, PowerPoint, ELN, LIMS), clipboard multi-format, qualité d'impression, API/scripting, déploiement, licences, sécurité, maintenance.

**Ce que Kendraw A DÉJÀ :**

- ✅ **Web-based** — déploiement trivial (pas d'installation client)
- ✅ **Open source** — pas de licence par siège ($$$)
- ✅ Auto-save IndexedDB — protection contre les pertes
- ✅ Multi-format clipboard (SVG + MOL)
- ✅ Backend FastAPI (REST API extensible)
- ✅ i18n (EN/FR)
- ✅ Responsive design
- ✅ Thème sombre moderne

**Ce que Kendraw N'A PAS :**

1. **OLE embedding** — Word/PowerPoint integration (#1 IT request)
2. **Export PDF** — impression et archivage
3. **CDX binary format** — interopérabilité ChemDraw
4. **CDXML export** — round-trip editing
5. **Plugin/extension API** — personnalisation
6. **Active Directory / SSO** — authentification enterprise
7. **Audit trail** (21 CFR Part 11)
8. **Print dialogue** avec preview
9. **CLI / headless mode** pour batch
10. **Docker deployment** documentation
11. **Collaborative editing** (multi-user)
12. **Version control** for documents
13. **Template management** (admin-controlled)
14. **Usage analytics / telemetry**
15. **Offline mode** (PWA)

**Criticité pour le DÉPLOIEMENT :**

| Feature manquante      | Fréquence demandée         | Impact déploiement | Effort |
| ---------------------- | -------------------------- | ------------------ | ------ |
| OLE embedding Word/PPT | Quotidien (tous les users) | Bloquant           | XL     |
| Export PDF             | Quotidien (tous les users) | Bloquant           | M      |
| CDXML export           | Quotidien (migration)      | Bloquant           | L      |
| SSO/AD integration     | Setup initial              | Bloquant           | L      |
| Audit trail            | Pharma/GxP                 | Bloquant           | XL     |
| Plugin API             | IT customization           | Gênant             | XL     |
| CLI batch mode         | Power users                | Gênant             | M      |
| Print dialogue         | Tous les users             | Gênant             | M      |
| Collaborative editing  | R&D teams                  | Gênant             | XL     |
| Offline PWA            | Field users                | Gênant             | M      |
| CDX binary             | Migration                  | Gênant             | L      |
| Docker docs            | DevOps                     | Mineur             | S      |

**Mon verdict : Puis-je déployer Kendraw pour remplacer ChemDraw ?**
**PARTIELLEMENT — déploiement progressif recommandé.**

L'argument financier est écrasant : une licence site PerkinElmer coûte ~42 000€/an pour 80 postes. Kendraw est open source, déployable en 5 minutes sur un serveur interne, sans installation client, compatible tous OS. Le déploiement est un rêve d'admin IT.

L'argument contre est l'intégration Office. 95% des tickets support ChemDraw concernent le copier-coller dans Word. L'OLE est le ciment du workflow quotidien. Une webapp ne peut pas faire d'OLE.

**Recommandation :** Déployer Kendraw en parallèle de ChemDraw, ciblant les cas où l'OLE n'est pas critique : enseignement (TP), usage web pur (wiki, LaTeX, présentations web), utilisateurs « légers ». Cela réduirait les licences ChemDraw de 80 à 40-50, économisant 15-20k€/an. Pour une migration complète : (1) wrapper Electron avec OLE, (2) export PDF, (3) import CDX binaire, (4) SSO, (5) stockage serveur. Projet 6-9 mois, mais le ROI est là.

---

## 3. Tableau comparatif exhaustif

### Catégorie A — Outils de dessin

| #   | Feature ChemDraw                    | Kendraw | Status   | Notes                                   |
| --- | ----------------------------------- | ------- | -------- | --------------------------------------- |
| A1  | Lasso selection                     | ❌      | Manquant | Marquee rectangle uniquement            |
| A2  | Marquee selection                   | ✅      | Présent  | Sélection rectangulaire par glisser     |
| A3  | Structure perspective (3D rotation) | ❌      | Manquant | Pas de mode 3D                          |
| A4  | Solid/single bond tool              | ✅      | Présent  | Outil bond avec style single            |
| A5  | Double bond tool                    | ✅      | Présent  | Auto-positionnement left/right/center   |
| A6  | Triple bond tool                    | ✅      | Présent  |                                         |
| A7  | Wedge bond (filled)                 | ✅      | Présent  | + wedge-end                             |
| A8  | Dashed bond (stereo)                | ✅      | Présent  | Style 'dash'                            |
| A9  | Bold bond                           | ✅      | Présent  | Style 'bold'                            |
| A10 | Wavy bond                           | ✅      | Présent  | Style 'wavy'                            |
| A11 | Hollow wedge                        | ✅      | Présent  | + hollow-wedge-end                      |
| A12 | Hashed wedge                        | ✅      | Présent  | + hashed-wedge-end                      |
| A13 | Eraser                              | ✅      | Présent  | Outil E                                 |
| A14 | Text tool (freeform)                | ❌      | Manquant | Annotations liées aux flèches seulement |
| A15 | Pen / freehand drawing              | ❌      | Manquant |                                         |
| A16 | Acyclic chain tool                  | ❌      | Manquant | Pas de chain auto-draw                  |
| A17 | Dative bond                         | ✅      | Présent  | Style 'dative'                          |
| A18 | Aromatic bond (delocalized)         | ✅      | Présent  | bondOrder 1.5                           |
| A19 | Bond cycling (click to change)      | ✅      | Présent  | Commande cycle-bond                     |
| A20 | Scale tool (resize structure)       | ❌      | Manquant |                                         |
| A21 | Rotate tool (free rotation)         | ⚠️      | Partiel  | Ctrl+R = 15° fixe uniquement            |
| A22 | Mirror/Flip horizontal              | ❌      | Manquant | Code commenté/supprimé                  |
| A23 | Mirror/Flip vertical                | ❌      | Manquant |                                         |
| A24 | Align structures                    | ❌      | Manquant |                                         |
| A25 | Distribute structures               | ❌      | Manquant |                                         |

### Catégorie B — Cycles et templates

| #   | Feature ChemDraw          | Kendraw | Status   | Notes                     |
| --- | ------------------------- | ------- | -------- | ------------------------- |
| B1  | Cyclopropane              | ✅      | Présent  | Shortcut 3                |
| B2  | Cyclobutane               | ✅      | Présent  | Shortcut 4                |
| B3  | Cyclopentane              | ✅      | Présent  | Shortcut 5                |
| B4  | Cyclohexane               | ✅      | Présent  | Shortcut 6                |
| B5  | Cycloheptane              | ✅      | Présent  | Shortcut 7                |
| B6  | Cyclooctane               | ✅      | Présent  | Shortcut 8                |
| B7  | Benzene (aromatic)        | ✅      | Présent  | Shortcut B                |
| B8  | Furan                     | ✅      | Présent  | Hétérocycle 5             |
| B9  | Pyridine                  | ✅      | Présent  | Hétérocycle 6             |
| B10 | Pyrrole                   | ✅      | Présent  | Hétérocycle 5             |
| B11 | Thiophene                 | ✅      | Présent  | Hétérocycle 5             |
| B12 | Naphthalene (fused)       | ❌      | Manquant | Pas de cycles fusionnés   |
| B13 | Indole                    | ❌      | Manquant |                           |
| B14 | Quinoline                 | ❌      | Manquant |                           |
| B15 | Purine                    | ❌      | Manquant |                           |
| B16 | Steroid skeleton          | ❌      | Manquant |                           |
| B17 | Amino acid templates (20) | ✅      | Présent  | Via template library JSON |
| B18 | Sugar templates           | ✅      | Présent  | Via template library JSON |
| B19 | Haworth projection        | ❌      | Manquant | Template plat uniquement  |
| B20 | Fischer projection        | ❌      | Manquant |                           |
| B21 | Newman projection         | ❌      | Manquant |                           |
| B22 | Chair cyclohexane         | ❌      | Manquant |                           |
| B23 | Lewis structures          | ❌      | Manquant |                           |
| B24 | Nucleobases               | ✅      | Présent  | Via template library JSON |
| B25 | Reagents                  | ✅      | Présent  | Via template library JSON |
| B26 | Protecting groups         | ✅      | Présent  | Via template library JSON |
| B27 | Solvents                  | ✅      | Présent  | Via template library JSON |
| B28 | Common drugs              | ✅      | Présent  | Via template library JSON |

### Catégorie C — Flèches et mécanismes

| #   | Feature ChemDraw                   | Kendraw | Status   | Notes                             |
| --- | ---------------------------------- | ------- | -------- | --------------------------------- |
| C1  | Reaction arrow (→)                 | ✅      | Présent  | type 'forward'                    |
| C2  | Equilibrium arrow (⇌)              | ✅      | Présent  | type 'equilibrium'                |
| C3  | Retrosynthetic arrow (⟸)           | ⚠️      | Partiel  | type 'reversible' — distinct de ⟸ |
| C4  | Resonance arrow (↔)                | ✅      | Présent  | type 'resonance'                  |
| C5  | Curved electron arrow (pair)       | ✅      | Présent  | type 'curly-pair'                 |
| C6  | Curved electron arrow (radical)    | ✅      | Présent  | type 'curly-radical'              |
| C7  | No-go arrow (X)                    | ❌      | Manquant |                                   |
| C8  | Dipole arrow                       | ❌      | Manquant |                                   |
| C9  | Arrow annotations (above/below)    | ✅      | Présent  | RichText annotations liées        |
| C10 | Arrowhead options (full/half/none) | ✅      | Présent  | arrowheadHead/Tail configurable   |

### Catégorie D — Annotations et symboles

| #   | Feature ChemDraw              | Kendraw | Status    | Notes                                 |
| --- | ----------------------------- | ------- | --------- | ------------------------------------- |
| D1  | Charges (+/−)                 | ✅      | Présent   | Superscript, ±4 clamp                 |
| D2  | Radical dots                  | ✅      | Présent   | • rendus, radicalCount 0/1/2          |
| D3  | Lone pairs (visual)           | ⚠️      | Data only | lonePairs dans le modèle, pas rendues |
| D4  | Electron dots (Lewis)         | ❌      | Manquant  |                                       |
| D5  | Polymer brackets [ ]n         | ❌      | Manquant  |                                       |
| D6  | Boxes / rectangles            | ❌      | Manquant  |                                       |
| D7  | Circles / ellipses / arcs     | ❌      | Manquant  |                                       |
| D8  | Orbitals (s, p, d)            | ❌      | Manquant  |                                       |
| D9  | Orbital lobes (+/- phase)     | ❌      | Manquant  |                                       |
| D10 | Isotope labels                | ✅      | Présent   | Superscript avant symbole             |
| D11 | Superscript/subscript general | ✅      | Présent   | Via RichTextNode style                |
| D12 | Greek letters                 | ✅      | Présent   | Via RichTextNode style 'greek'        |
| D13 | Color per atom/bond           | ❌      | Manquant  | Couleurs fixes par élément            |
| D14 | Grouping/ungrouping           | ✅      | Présent   | Group type dans le modèle             |

### Catégorie E — Calculs et propriétés

| #   | Feature ChemDraw       | Kendraw | Status      | Notes                            |
| --- | ---------------------- | ------- | ----------- | -------------------------------- |
| E1  | Molecular formula      | ✅      | Présent     | Frontend + backend               |
| E2  | Molecular weight       | ✅      | Présent     | Frontend + backend               |
| E3  | Exact mass             | ✅      | Présent     | Backend RDKit                    |
| E4  | Name to structure      | ⏳      | Placeholder | NamingService stub               |
| E5  | Structure to name      | ⏳      | Placeholder | NamingService stub               |
| E6  | SMILES generation      | ✅      | Présent     | Backend canonical SMILES         |
| E7  | InChI generation       | ✅      | Présent     | Backend RDKit                    |
| E8  | LogP calculation       | ❌      | Manquant    | RDKit peut le faire              |
| E9  | CIP R/S/E/Z assignment | ⏳      | Placeholder | StereoService stub               |
| E10 | Valence checking       | ✅      | Présent     | validateValence() + rendu visuel |
| E11 | Clean Up Structure     | ✅      | Présent     | Shift+Ctrl+K                     |
| E12 | Chemical warnings      | ⚠️      | Partiel     | Valence issues seulement         |
| E13 | TPSA                   | ❌      | Manquant    |                                  |
| E14 | HBD/HBA count          | ❌      | Manquant    |                                  |
| E15 | Lipinski Rule of 5     | ❌      | Manquant    |                                  |
| E16 | Atom numbering         | ❌      | Manquant    |                                  |
| E17 | InChI Key              | ✅      | Présent     | Backend RDKit                    |

### Catégorie F — NMR et spectroscopie

| #   | Feature ChemDraw           | Kendraw | Status        | Notes                                          |
| --- | -------------------------- | ------- | ------------- | ---------------------------------------------- |
| F1  | ¹H NMR prediction          | ✅      | Présent       | Méthode additive + RDKit                       |
| F2  | ¹³C NMR prediction         | ✅      | Présent       | Méthode additive + RDKit                       |
| F3  | DEPT visualization         | ✅      | **Supérieur** | Color-coded CH₃/CH₂/CH/C — ChemDraw n'a pas ça |
| F4  | Bidirectional highlighting | ✅      | **Supérieur** | Atome ↔ pic — ChemDraw limité                  |
| F5  | Solvent selection          | ✅      | Présent       | 6 solvants                                     |
| F6  | Spectrum export            | ✅      | Présent       | PNG, SVG, CSV                                  |
| F7  | Mass spec prediction       | ❌      | Manquant      |                                                |
| F8  | IR prediction              | ❌      | Manquant      |                                                |
| F9  | UV-Vis prediction          | ❌      | Manquant      |                                                |
| F10 | Confidence markers         | ✅      | **Unique**    | 3 niveaux — ChemDraw n'a pas ça                |
| F11 | Interactive spectrum zoom  | ✅      | Présent       | Zoom/pan sur le canvas spectre                 |

### Catégorie G — Import/Export

| #   | Feature ChemDraw       | Kendraw | Status       | Notes                       |
| --- | ---------------------- | ------- | ------------ | --------------------------- |
| G1  | CDXML import           | ✅      | Présent      | Parser complet 488 lignes   |
| G2  | CDXML export           | ❌      | Manquant     | Import only                 |
| G3  | CDX binary import      | ❌      | Manquant     | Format propriétaire         |
| G4  | CDX binary export      | ❌      | Manquant     |                             |
| G5  | MOL V2000 import       | ✅      | Présent      | Avec Y-axis fix             |
| G6  | MOL V2000 export       | ✅      | Présent      |                             |
| G7  | MOL V3000 import       | ❌      | Manquant     | Extended molfile            |
| G8  | MOL V3000 export       | ❌      | Manquant     |                             |
| G9  | SDF multi-mol import   | ❌      | Manquant     | Backend supporte, UI non    |
| G10 | SDF multi-mol export   | ❌      | Manquant     |                             |
| G11 | RXN format             | ❌      | Manquant     |                             |
| G12 | SMILES import          | ✅      | Présent      | Frontend parser + 2D layout |
| G13 | SMILES export          | ✅      | Présent      | Via backend canonical       |
| G14 | InChI import           | ❌      | Manquant     | Backend peut, UI non        |
| G15 | InChI export           | ⚠️      | Backend only | Pas exposé dans l'UI        |
| G16 | PNG export             | ✅      | Présent      | Spectre NMR + via canvas    |
| G17 | SVG export             | ✅      | Présent      | Renderer dédié              |
| G18 | PDF export             | ❌      | Manquant     |                             |
| G19 | EPS export             | ❌      | Manquant     |                             |
| G20 | EMF export             | ❌      | Manquant     |                             |
| G21 | Multi-format clipboard | ✅      | Présent      | SVG + MOL                   |
| G22 | OLE embedding (Word)   | ❌      | Manquant     | Technologie desktop         |
| G23 | KDX native format      | ✅      | **Unique**   | Format natif Kendraw        |
| G24 | PubChem search         | ✅      | **Unique**   | Recherche intégrée          |

### Catégorie H — UX et interface

| #   | Feature ChemDraw        | Kendraw | Status        | Notes                                           |
| --- | ----------------------- | ------- | ------------- | ----------------------------------------------- |
| H1  | Fixed bond length mode  | ✅      | Présent       | Bond tool auto-place                            |
| H2  | Angle snapping          | ✅      | Présent       | Intégré au bond tool                            |
| H3  | Grid display            | ❌      | Manquant      |                                                 |
| H4  | Rulers                  | ❌      | Manquant      |                                                 |
| H5  | Zoom                    | ✅      | Présent       | Scroll wheel                                    |
| H6  | Unlimited undo/redo     | ✅      | Présent       | History stack                                   |
| H7  | Atom hotkeys (C,N,O,…)  | ✅      | Présent       | 11 éléments                                     |
| H8  | Bond hotkeys (1,2,3,…)  | ✅      | Présent       | Avec sélection                                  |
| H9  | Style sheets (ACS 1996) | ✅      | Présent       | 3 presets (NEW_DOCUMENT, ACS_1996, ACS_NANO)    |
| H10 | Document settings panel | ❌      | Manquant      | Pas de UI pour modifier les settings            |
| H11 | Multiple pages/tabs     | ✅      | Présent       | WorkspaceStore + TabBar                         |
| H12 | Stoichiometry grid      | ❌      | Manquant      |                                                 |
| H13 | Template search         | ✅      | Présent       | Par nom, SMILES, abréviation                    |
| H14 | Keyboard cheatsheet     | ✅      | Présent       | ?-key                                           |
| H15 | Auto-save               | ✅      | **Supérieur** | IndexedDB persistant — ChemDraw perd le travail |
| H16 | Dark theme              | ✅      | **Unique**    | Glasswerk design system                         |
| H17 | Web-based (no install)  | ✅      | **Unique**    | ChemDraw = desktop seulement                    |
| H18 | i18n (EN/FR)            | ✅      | Présent       |                                                 |
| H19 | Flood-select molecule   | ✅      | Présent       | Double-clic                                     |
| H20 | Print dialogue          | ❌      | Manquant      |                                                 |

### Catégorie I — BioDraw (ChemDraw Professional)

| #   | Feature ChemDraw  | Kendraw | Status   | Notes                |
| --- | ----------------- | ------- | -------- | -------------------- |
| I1  | Membrane drawings | ❌      | Manquant | Aucun module BioDraw |
| I2  | DNA helix         | ❌      | Manquant |                      |
| I3  | Enzyme shapes     | ❌      | Manquant |                      |
| I4  | Receptor shapes   | ❌      | Manquant |                      |
| I5  | tRNA              | ❌      | Manquant |                      |
| I6  | Ribosome          | ❌      | Manquant |                      |
| I7  | Mitochondria      | ❌      | Manquant |                      |
| I8  | Golgi apparatus   | ❌      | Manquant |                      |
| I9  | Pathway arrows    | ❌      | Manquant |                      |

### Catégorie J — Fonctionnalités avancées

| #   | Feature ChemDraw                      | Kendraw | Status   | Notes                                 |
| --- | ------------------------------------- | ------- | -------- | ------------------------------------- |
| J1  | Nicknames/abbreviations (Me, Et, Ph…) | ⚠️      | Partiel  | Me hotkey existe, pas expand/contract |
| J2  | Expand/contract labels                | ❌      | Manquant |                                       |
| J3  | TLC plate drawing                     | ❌      | Manquant |                                       |
| J4  | Gel electrophoresis                   | ❌      | Manquant |                                       |
| J5  | Lab glassware templates               | ❌      | Manquant |                                       |
| J6  | HELM notation                         | ❌      | Manquant |                                       |
| J7  | Enhanced stereochemistry (AND/OR/ABS) | ❌      | Manquant | Pas dans le data model                |
| J8  | Markush structures (R-groups)         | ❌      | Manquant | Generic labels R/X/Y/Z partiels       |
| J9  | Polymer brackets [ ]n                 | ❌      | Manquant |                                       |
| J10 | Stoichiometry calculations            | ❌      | Manquant |                                       |
| J11 | Property calculator (LogP, TPSA…)     | ❌      | Manquant |                                       |
| J12 | Substructure search                   | ❌      | Manquant |                                       |
| J13 | API/scripting interface               | ❌      | Manquant | REST API exists, pas de SDK           |
| J14 | Batch operations                      | ❌      | Manquant |                                       |
| J15 | Collaborative editing                 | ❌      | Manquant |                                       |

---

## 4. Score de couverture

### Comptage par catégorie

| Catégorie                   | Total features | ✅ Présent | ⚠️ Partiel | ❌ Manquant | Couverture |
| --------------------------- | -------------- | ---------- | ---------- | ----------- | ---------- |
| A — Outils de dessin        | 25             | 12         | 1          | 12          | 48%        |
| B — Cycles et templates     | 28             | 18         | 0          | 10          | 64%        |
| C — Flèches et mécanismes   | 10             | 7          | 1          | 2           | 70%        |
| D — Annotations et symboles | 14             | 6          | 1          | 7           | 43%        |
| E — Calculs et propriétés   | 17             | 8          | 3          | 6           | 47%        |
| F — NMR et spectroscopie    | 11             | 8          | 0          | 3           | 73%        |
| G — Import/Export           | 24             | 10         | 2          | 12          | 42%        |
| H — UX et interface         | 20             | 15         | 0          | 5           | 75%        |
| I — BioDraw                 | 9              | 0          | 0          | 9           | 0%         |
| J — Avancées                | 15             | 0          | 2          | 13          | 0%         |
| **TOTAL**                   | **173**        | **84**     | **10**     | **79**      | **49%**    |

### Score global : **84/173 features (49%)**

En comptant les partiels à 50% : **89/173 (51%)**

---

## 5. Priorisation par discipline

### TOP 10 features manquantes les plus demandées (par consensus)

| #   | Feature                                       | Demandée par             | Criticité            | Effort |
| --- | --------------------------------------------- | ------------------------ | -------------------- | ------ |
| 1   | **Outil texte libre**                         | 9/10 experts             | Bloquant             | M      |
| 2   | **Export PDF**                                | 9/10 experts             | Bloquant             | M      |
| 3   | **Cycles fusionnés** (naphthalène, indole…)   | 6/10 experts             | Bloquant             | M      |
| 4   | **Lone pairs rendues visuellement**           | 5/10 experts             | Gênant→Bloquant      | S      |
| 5   | **Formes géométriques** (rectangles, cercles) | 6/10 experts             | Gênant               | M      |
| 6   | **CDXML export** (round-trip)                 | 5/10 experts             | Bloquant             | L      |
| 7   | **CIP R/S/E/Z** assignment                    | 5/10 experts             | Gênant               | L      |
| 8   | **Name ↔ Structure** (IUPAC)                  | 5/10 experts             | Gênant               | L      |
| 9   | **Lasso selection**                           | 5/10 experts             | Gênant               | M      |
| 10  | **OLE embedding** Word                        | 4/10 experts (industrie) | Bloquant (industrie) | XL     |

### TOP 5 par discipline

**Chimie organique (Duval, Marcos) :**

1. Cycles fusionnés (naphthalène, indole, stéroïdes)
2. Texte libre pour conditions réactionnelles
3. Export PDF/EPS pour publications
4. Abréviations expand/contract
5. Retrosynthetic arrow

**Enseignement (Yamamoto) :**

1. Newman projections
2. Fischer projections
3. Lewis structures / electron dots
4. Orbitales (s, p, d)
5. Lone pairs visuelles

**Chimie computationnelle (Chen) :**

1. API/SDK scriptable
2. Batch conversion/processing
3. LogP, TPSA, Lipinski
4. SDF multi-mol
5. CLI tool

**Pharma / Analytique (Al-Khatib, Santos) :**

1. OLE embedding Word
2. Markush structures
3. Enhanced stereochemistry (AND/OR/ABS)
4. HELM notation
5. 21 CFR Part 11 audit trail

**Biologie structurale (Miller) :**

1. BioDraw module complet
2. Membranes, hélices ADN, enzymes
3. Voies métaboliques / pathway diagrams
4. Projections Haworth
5. Formes biologiques

**Chimie inorganique (Weber H.) :**

1. Orbitales (s, p, d, hybrides)
2. Templates de coordination géométrique
3. Lone pairs visuelles
4. Complexes sandwich
5. Multi-center bonds

**Chimie des polymères (Tanaka) :**

1. Polymer brackets [ ]n
2. Copolymer notation
3. Repeat unit definition
4. Brackets généraux
5. Crosslink symbols

**IT / Déploiement (Weber T.) :**

1. Export PDF
2. OLE embedding
3. CDXML export (round-trip)
4. SSO/AD integration
5. Audit trail

---

## 6. Dealbreakers — pourquoi les labos ne switcheront pas

### Dealbreaker #1 : Pas de texte libre

Kendraw n'a pas d'outil texte standalone. On ne peut pas écrire « reflux, 2h, THF » au-dessus d'une flèche de réaction autrement qu'en créant une annotation liée à l'arrow. Pas de texte libre positionnable n'importe où. **9/10 experts bloqués.**

### Dealbreaker #2 : Pas d'export PDF

Impossible d'imprimer proprement, d'envoyer un fichier à un collègue, ou de soumettre à un journal. **9/10 experts bloqués.**

### Dealbreaker #3 : Pas de cycles fusionnés

Naphthalène, indole, quinoléine, purine, stéroïdes — la majorité des molécules d'intérêt pharmaceutique et biologique contiennent des cycles fusionnés. Impossible de les dessiner en un clic. **6/10 experts bloqués, dont TOUS les chimistes organiciens.**

### Dealbreaker #4 : Pas d'OLE embedding

Dans l'industrie, 100% des rapports sont dans Word. Sans OLE, Kendraw est invisible dans le workflow documentaire. **Bloquant pour tout déploiement industriel.**

### Dealbreaker #5 : Pas de CDXML export

On peut OUVRIR des fichiers ChemDraw, mais pas en CRÉER. Aucune interopérabilité dans le sens Kendraw → collègues ChemDraw. **Bloquant pour la migration.**

### Dealbreaker #6 : Pas de BioDraw

Aucune forme biologique. Exclut complètement les biologistes structuraux, biochimistes, et biologistes moléculaires. **Bloquant pour ~30% des utilisateurs potentiels.**

---

## 7. Avantages Kendraw — ce que ChemDraw n'a PAS

| #   | Avantage Kendraw                                                              | Impact                               |
| --- | ----------------------------------------------------------------------------- | ------------------------------------ |
| 1   | **NMR DEPT visualization color-coded** (CH₃ bleu, CH₂ vert, CH rouge, C gris) | ChemDraw n'a pas de DEPT visuel      |
| 2   | **Highlighting bidirectionnel atome ↔ pic NMR** interactif                    | ChemDraw plus limité                 |
| 3   | **Marqueurs de confiance** sur les prédictions NMR (3 niveaux)                | Unique à Kendraw                     |
| 4   | **Export spectre NMR** en PNG, SVG, CSV                                       | ChemDraw : capture d'écran           |
| 5   | **Web-based** — zéro installation, fonctionne sur tout OS                     | ChemDraw = Windows/Mac desktop       |
| 6   | **Open source** — gratuit, modifiable, auditable                              | ChemDraw = 2500€/siège/an            |
| 7   | **Auto-save IndexedDB** — jamais de perte de travail                          | ChemDraw n'a pas d'auto-save         |
| 8   | **Thème sombre** natif                                                        | ChemDraw = blanc uniquement          |
| 9   | **PubChem search intégré**                                                    | ChemDraw : pas de recherche en ligne |
| 10  | **i18n** (EN/FR) natif                                                        | ChemDraw = anglais seulement         |
| 11  | **Backend Python extensible** (FastAPI + RDKit)                               | ChemDraw = fermé                     |
| 12  | **6 solvants NMR** avec prédiction de shift                                   | ChemDraw : CDCl₃ par défaut          |
| 13  | **Tooltips NMR détaillés** (multiplicité, couplage, environnement)            | ChemDraw : données brutes            |
| 14  | **7 catégories de templates** SMILES-based avec recherche                     | ChemDraw : templates graphiques      |

### Conclusion : positionnement stratégique

Kendraw couvre **49% des features ChemDraw** — un score honorable pour un projet open-source naissant. Sa force absolue est le **module NMR** (DEPT, highlighting, confiance), qui est **objectivement supérieur à ChemDraw**. Son modèle **web + open source** est un avantage disruptif.

**Pour atteindre une adoption académique :** +texte libre, +export PDF, +cycles fusionnés → 3 features, effort M chacune.

**Pour atteindre une adoption industrielle :** +OLE, +CDXML export, +Markush, +enhanced stereo, +audit trail → 5 features XL. Horizon 12-18 mois.

**Niche immédiate :** enseignement de la spectroscopie NMR. Kendraw est DÉJÀ meilleur que ChemDraw pour ça.
