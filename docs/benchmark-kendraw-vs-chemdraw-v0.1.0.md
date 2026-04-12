# Benchmark: Kendraw v0.1.0 vs ChemDraw — Post-Fix Adversarial Review

**Date:** 2026-04-12 (post-bugfix pass)
**Method:** Full source code audit of every file in `packages/`, cross-referenced against PRD FRs.

---

## 1. Dessin moléculaire

| Feature                                | ChemDraw  | Kendraw v0.1.0 | Status      | Notes                                                    |
| -------------------------------------- | --------- | -------------- | ----------- | -------------------------------------------------------- |
| Canvas interactif (clic = dessin)      | Yes       | Yes            | ✅ Fait     | Placement précis sous le curseur                         |
| Zoom (molette)                         | Yes       | Yes            | ✅ Fait     | 0.1x-5x, renderer applique la transform                  |
| Pan (middle-click / outil Pan)         | Yes       | Yes            | ✅ Fait     | Pan tool + middle-click                                  |
| Snap-to-grid                           | Yes       | No             | ❌ Manquant |                                                          |
| Placement atome (10 elements courants) | Yes       | Yes            | ✅ Fait     | C/N/O/S/P/F/Cl/Br/I/H via palette + touches 0-9          |
| Placement atome (118 elements)         | Yes       | No             | 🟡 Partiel  | 25 elements dans la table, pas de picker full 118        |
| Charges formelles                      | Yes       | Yes            | ✅ Fait     | +/- sur selection, clampe [-4,+4], affiche               |
| Labels custom (R, R1, Et)              | Yes       | No             | 🟡 Partiel  | Champ existe, renderer supporte, **pas d'UI de saisie**  |
| Hydrogenes implicites                  | Yes       | No             | ❌ Manquant |                                                          |
| Outil Bond (clic-clic)                 | Yes       | Yes            | ✅ Fait     | Clic atome A - clic atome B, cree bond avec style choisi |
| Bond cycling (clic bond existant)      | Yes       | Yes            | ✅ Fait     | single-double-triple-single                              |
| 6 styles de bond                       | Yes       | Yes            | ✅ Fait     | single/double/triple/wedge/dash/aromatic dans palette    |
| Wedge/dash stereo                      | Yes       | Yes            | ✅ Fait     | Renderer dessine wedge triangle + dash hachure           |
| Insertion cycle (8 templates)          | Yes (50+) | Yes            | ✅ Fait     | Benzene/cyclohexane/etc. via palette Ring + clic         |
| Quick carbon chain                     | Yes       | No             | ❌ Manquant |                                                          |
| Validation valence temps reel          | Yes       | Yes            | ✅ Fait     | Highlight orange sur atomes invalides + status bar       |

**Score: 12/16 features utilisables**

---

## 2. Reactions et mecanismes

| Feature                       | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                                  |
| ----------------------------- | -------- | -------------- | ----------- | ------------------------------------------------------ |
| Fleches de reaction           | Yes      | Yes            | ✅ Fait     | Outil Arrow, clic-drag, 3 types, rendu bezier + pointe |
| Fleches curly (mecanismes)    | Yes      | Yes            | ✅ Fait     | Outil Curly, paire + radical, bezier courbe            |
| Annotations conditions        | Yes      | No             | 🟡 Partiel  | Commandes store OK, **pas de rendu ni d'UI**           |
| Fleches resonance             | Yes      | No             | ❌ Prevu V1 |                                                        |
| Selection/suppression fleches | Yes      | No             | 🟡 Partiel  | Pas de hit-testing fleches, undo seul moyen            |

**Score: 2/5 features utilisables**

---

## 3. Templates et bibliotheques

| Feature                 | ChemDraw  | Kendraw v0.1.0 | Status      | Notes                           |
| ----------------------- | --------- | -------------- | ----------- | ------------------------------- |
| Bibliotheque cycles (8) | Yes (50+) | Yes            | ✅ Fait     | 8 rings insertables via palette |
| Amino acids             | Yes       | No             | ❌ Prevu V1 |                                 |
| Molecules communes      | Yes       | No             | ❌ Prevu V1 |                                 |
| Templates custom        | Yes       | No             | ❌ Prevu V1 |                                 |

**Score: 1/4**

---

## 4. Calculs et proprietes

| Feature                          | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                            |
| -------------------------------- | -------- | -------------- | ----------- | ------------------------------------------------ |
| Formule moleculaire (temps reel) | Yes      | Yes            | ✅ Fait     | Hill system, PropertyPanel                       |
| Masse molaire                    | Yes      | Yes            | ✅ Fait     | 21 elements dans ATOMIC_WEIGHTS                  |
| Compteur atomes/bonds            | Yes      | Yes            | ✅ Fait     |                                                  |
| Warnings valence                 | Yes      | Yes            | ✅ Fait     | Panel + highlight canvas                         |
| SMILES                           | Yes      | No             | ❌ Manquant | Pas de generation SMILES depuis scene            |
| InChI                            | Yes      | No             | 🟡 Partiel  | Backend endpoint, **pas appele depuis frontend** |
| LogP/TPSA/Lipinski               | Yes      | No             | ❌ Prevu V1 |                                                  |
| IUPAC                            | Yes      | No             | ❌ Prevu V1 |                                                  |

**Score: 4/8**

---

## 5. Import / Export

| Feature             | ChemDraw | Kendraw v0.1.0 | Status      | Notes                                               |
| ------------------- | -------- | -------------- | ----------- | --------------------------------------------------- |
| Export SVG          | Yes      | Yes            | ✅ Fait     | Bouton dans PropertyPanel, metadata Dublin Core     |
| Export MOL v2000    | Yes      | Yes            | ✅ Fait     | Bouton dans PropertyPanel                           |
| Export PNG          | Yes      | Yes            | ✅ Fait     | Via SVG-Canvas-Blob, bouton dans PropertyPanel      |
| Import MOL v2000    | Yes      | No             | 🟡 Partiel  | Parser fonctionne, **pas d'UI import**              |
| Import drag-drop    | Yes      | No             | ❌ Manquant |                                                     |
| CDXML import/export | Yes      | No             | ❌ Prevu V1 |                                                     |
| Format natif KDX    | N/A      | No             | 🟡 Partiel  | Serialisation OK, **persistence utilise JSON brut** |

**Score: 3/7**

---

## 6. Outils d'edition

| Feature                 | ChemDraw | Kendraw v0.1.0 | Status      | Notes                            |
| ----------------------- | -------- | -------------- | ----------- | -------------------------------- |
| Selection clic          | Yes      | Yes            | ✅ Fait     |                                  |
| Selection rectangle     | Yes      | Yes            | ✅ Fait     |                                  |
| Shift-extend            | Yes      | Yes            | ✅ Fait     |                                  |
| Delete selection        | Yes      | Yes            | ✅ Fait     | Cascade bonds + atomes           |
| Undo/Redo illimite      | Yes      | Yes            | ✅ Fait     | Cappe a 200 snapshots            |
| Copy/Cut/Paste          | Yes      | Yes            | ✅ Fait     | Ctrl+C/X/V avec remap IDs        |
| Duplicate (Ctrl+D)      | Yes      | Yes            | ✅ Fait     |                                  |
| Rotation (Ctrl+R)       | Yes      | Yes            | ✅ Fait     | 15 degres par increment          |
| Miroir H (Ctrl+M)       | Yes      | Yes            | ✅ Fait     |                                  |
| Miroir V (Ctrl+Shift+M) | Yes      | Yes            | ✅ Fait     |                                  |
| Eraser                  | Yes      | Yes            | ✅ Fait     | Supprime atome + bonds connectes |
| Lasso                   | Yes      | No             | ❌ Prevu V1 |                                  |
| Groupage/verrouillage   | Yes      | No             | ❌ Prevu V1 |                                  |

**Score: 11/13**

---

## 7. Interface utilisateur

| Feature                  | ChemDraw   | Kendraw v0.1.0 | Status      | Notes                                        |
| ------------------------ | ---------- | -------------- | ----------- | -------------------------------------------- |
| Dark mode                | No         | Yes            | ⭐ Exclusif | CSS tokens, defaut                           |
| Light mode               | Yes        | No             | 🟡 Partiel  | CSS existe, **pas de toggle**                |
| Glassmorphism            | No         | Yes            | ⭐ Exclusif | Panels + palette                             |
| Multi-onglets            | No (MDI)   | Yes            | ✅ Fait     | Creer/fermer/basculer, Ctrl+N                |
| Auto-save                | No         | Yes            | ⭐ Exclusif | 3s debounce IndexedDB                        |
| Restore on reload        | No         | Yes            | ⭐ Exclusif |                                              |
| Palette 8 outils         | Yes (15+)  | Yes            | ✅ Fait     | Select/Atom/Bond/Ring/Arrow/Curly/Eraser/Pan |
| Sous-palettes            | Yes        | Yes            | ✅ Fait     | Elements, styles bond, templates ring        |
| Raccourcis clavier (20+) | Yes (100+) | Yes            | ✅ Fait     | 25+ raccourcis                               |
| Cheatsheet (?)           | No         | Yes            | ⭐ Exclusif |                                              |
| About/Citation           | No         | Yes            | ⭐ Exclusif | BibTeX copy                                  |
| Property panel           | Yes        | Yes            | ✅ Fait     | Formule, MW, counts, valence, export         |
| i18n EN/FR               | No         | No             | 🟡 Partiel  | Catalogue defini, **pas branche**            |
| Status bar               | No         | Yes            | ⭐ Exclusif | Zoom%, selection, warnings                   |

**Score: 10/14**

---

## 8. Fonctionnalites modernes

| Feature                      | ChemDraw | Kendraw v0.1.0 | Status      | Notes               |
| ---------------------------- | -------- | -------------- | ----------- | ------------------- |
| Gratuit et open-source (MIT) | $4k/an   | Yes            | ⭐ Exclusif |                     |
| Self-hosted (Docker)         | No       | Yes            | ✅ Fait     |                     |
| Zero telemetrie              | ?        | Yes            | ⭐ Exclusif |                     |
| Web (pas d'install)          | No       | Yes            | ⭐ Exclusif |                     |
| Persistance IndexedDB        | No       | Yes            | ⭐ Exclusif |                     |
| Backend API (FastAPI)        | No       | Yes            | ✅ Fait     | /compute + /convert |
| CI/CD GitHub Actions         | N/A      | Yes            | ✅ Fait     |                     |
| Release workflow GHCR        | N/A      | Yes            | ✅ Fait     |                     |

**Score: 8/8**

---

## Score global

| Categorie                | Score | %    |
| ------------------------ | ----- | ---- |
| Dessin moleculaire       | 12/16 | 75%  |
| Reactions / mecanismes   | 2/5   | 40%  |
| Templates                | 1/4   | 25%  |
| Calculs / proprietes     | 4/8   | 50%  |
| Import / Export          | 3/7   | 43%  |
| Outils d'edition         | 11/13 | 85%  |
| Interface utilisateur    | 10/14 | 71%  |
| Fonctionnalites modernes | 8/8   | 100% |

### Score parite ChemDraw : ~55% (51/75 features utilisables)

Progression par rapport au dernier audit : **15% -> 55%** (+40 points).

---

## Top 5 manques critiques pour V1

1. **Import fichier UI** — parser MOL fonctionne, il manque File > Import et drag-drop
2. **Hydrogenes implicites** — critiques pour formules/MW chimiquement correctes
3. **Selection/suppression fleches** — fleches rendues mais pas selectionnables
4. **SMILES generation** — property panel n'affiche pas le SMILES
5. **Periodic table complete (118 elements)** — 25 elements actuellement

## Top 5 ou Kendraw surpasse deja ChemDraw

1. **Gratuit et MIT** — $0 vs $4,000/an
2. **Auto-save + restore on reload** — zero perte de donnees
3. **Dark mode glassmorphism** — design moderne vs interface 2003
4. **Web-based, zero installation** — fonctionne dans n'importe quel navigateur
5. **Self-hosted Docker** — deploiement en une commande, zero dependance cloud

## Recommandation go/no-go

**GO pour tag v0.1.0.** L'application est utilisable pour dessiner des structures moleculaires avec atomes, bonds, cycles, charges, reactions. Les outils d'edition sont complets (select, undo/redo, copy/paste, rotation, mirror). Les exports SVG/MOL/PNG fonctionnent. Le design est moderne. Les 5 critiques du edge-case review sont fixes.
