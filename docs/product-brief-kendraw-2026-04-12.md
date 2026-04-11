# Product Brief — Kendraw

> **« Tout ChemDraw, en mieux, gratuitement. »**

---

## Métadonnées

| Champ | Valeur |
|---|---|
| **Nom du projet** | Kendraw |
| **Type** | Application web (frontend React + backend FastAPI) |
| **Niveau de complexité BMAD** | Level 4 — Enterprise (40+ stories) |
| **Créateur / Product Owner** | Jean-Baptiste Donnette (JB Donnette) |
| **GitHub** | [@electrosenpai](https://github.com/electrosenpai) |
| **Dépôt du projet** | https://github.com/electrosenpai/kendraw |
| **Licence** | MIT |
| **Date du brief** | 2026-04-12 |
| **Phase BMAD** | Phase 1 — Analysis |
| **Prochaine phase** | Phase 2 — Planning (PRD) |

---

## 1. Executive Summary

**Kendraw** est un éditeur moléculaire web open source (licence MIT) conçu comme un **successeur moderne de ChemDraw**. Il reprend l'intégralité des usages et fonctionnalités de ChemDraw avec l'engagement qu'un utilisateur puisse migrer sans rien perdre, tout en se permettant de faire **mieux** là où c'est possible : meilleure UX, meilleurs raccourcis, interface plus intuitive, fonctionnalités bonus absentes de ChemDraw (prévisualisation 3D, dark mode, auto-save, multi-onglets).

Il s'adresse aux étudiants en chimie, doctorants, post-docs, chercheurs académiques, enseignants et petits laboratoires qui n'ont pas les ~4 000 $/an de licence ChemDraw mais qui ont besoin d'un outil de qualité publication pour dessiner des structures chimiques, des réactions et des mécanismes, calculer des propriétés moléculaires via RDKit, et exporter aux formats standards de la chimie.

---

## 2. Problem Statement

### Problème principal

ChemDraw (PerkinElmer) est le standard incontesté de la chimie structurale depuis 30 ans, mais son modèle économique (~4 000 $/an par licence) le rend **inaccessible à une immense partie de sa base utilisateur naturelle** : étudiants, doctorants, enseignants, chercheurs dans des institutions sous-financées, et petites équipes en startups. Simultanément, son interface n'a quasiment pas évolué depuis 15 ans et souffre face aux standards UX contemporains (pas de dark mode, UI dense et datée, pas d'auto-save fiable, pas de support tablette, ergonomie lourde).

Les alternatives open source existantes (Ketcher, MolView) ne couvrent qu'une **fraction** des fonctionnalités de ChemDraw et/ou ont une UX médiocre ; les alternatives freemium (MarvinJS) ne sont pas vraiment open source et limitent les usages. Résultat : **il n'existe aujourd'hui aucune alternative open source capable de remplacer ChemDraw de façon transparente**.

### Exemples concrets

**Exemple 1 — Doctorant et publication JACS**
> Un doctorant en synthèse organique prépare la figure de son article pour *JACS*. Sans licence institutionnelle ChemDraw (son labo a laissé expirer l'abonnement), il doit soit (i) payer 4 k$ personnellement, (ii) utiliser Ketcher qui ne gère pas correctement les mécanismes avec flèches courbes ni les exports qualité publication, soit (iii) emprunter en urgence le poste d'un collègue. Résultat : perte de temps, frustration, figures de qualité dégradée.

**Exemple 2 — Enseignant préparant un TD**
> Un enseignant en licence chimie doit préparer un polycopié de TD de chimie organique comprenant **une trentaine de mécanismes réactionnels**. Sans ChemDraw, il perd des heures à bidouiller sur des outils limités qui n'alignent pas correctement les flèches courbes, ou à dessiner à la main puis scanner — avec un rendu final médiocre qui dessert la pédagogie.

### Ce que font les gens aujourd'hui

- Licences institutionnelles partagées (souvent saturées ou expirées)
- Piratage de ChemDraw (pratique courante mais juridiquement risquée)
- Outils ouverts limités (Ketcher, MolView) avec compromis sur la qualité
- Dessins manuels retouchés sous Illustrator/PowerPoint pour la qualité publication

### Pourquoi maintenant ?

- **Technique** — les moteurs SVG/Canvas dans le navigateur sont matures ; RDKit expose une API Python robuste ; React/TypeScript permettent de construire des UIs riches et performantes.
- **Économique** — pression croissante sur les budgets logiciels académiques, mouvement open science.
- **Culturel** — attentes UX modernes chez les étudiants/chercheurs (habitués à Figma, Notion, VS Code), intolérance croissante aux interfaces datées.
- **Concurrentiel** — personne n'a encore construit un successeur *complet* et *moderne* — la fenêtre est ouverte.

### Impact si le problème n'est pas résolu

- Des milliers d'étudiants et de chercheurs continuent de perdre du temps avec des outils inadéquats, ou enfreignent les licences
- L'écosystème chimie reste dépendant d'un logiciel propriétaire fermé
- Les contributions open science en chimie structurale sont freinées par l'absence d'outil libre de qualité

### Origine du projet — l'étincelle personnelle

Kendraw naît d'une frustration concrète au sein du **laboratoire URD Abbaye**, où des proches de JB Donnette dépendent depuis des années d'un logiciel hors de prix dont l'interface n'a pas bougé depuis 2005. La question revient à chaque session de dessin : *« Pourquoi ChemDraw ressemble encore à Windows XP alors que tous les autres outils qu'on utilise au quotidien — VS Code, Figma, Notion — sont beaux et modernes ? »*

La décision a été prise de construire Kendraw et de l'open-sourcer sous licence MIT pour que toute la communauté chimie en bénéficie. Kendraw naît au contact du labo URD Abbaye mais est destiné à **tous les chimistes du monde** qui méritent un outil aussi moderne que ceux qu'ils utilisent dans le reste de leur vie numérique.

---

## 3. Target Audience

### Utilisateurs primaires (usage quotidien ou hebdomadaire intensif)

- **Doctorants et post-docs en chimie** (synthèse organique, chimie médicinale, chimie inorganique, chimie des matériaux) — dessinent des structures et des mécanismes tous les jours pour notes de labo, présentations, posters, manuscrits, thèses. Typiquement 25–35 ans, très à l'aise avec les outils numériques modernes. Frustrés par l'interface ChemDraw mais forcés de s'y plier.
- **Étudiants en master de chimie** — besoins similaires aux doctorants, volume moindre, dépendent entièrement de l'outillage du labo, très sensibles au confort ergonomique.
- **Chercheurs académiques sans budget logiciel** — chercheurs permanents (CR, MCF, Pr) dans des universités ou unités de recherche sous-financées. Savent exactement ce qu'ils veulent mais n'ont plus les moyens.
- **Enseignants en chimie** (licence, master, prépa, lycée) — préparent polycopiés, TD, diapos, exercices avec beaucoup de structures et de mécanismes. Besoin de qualité pédagogique.

### ⭐ Persona de référence

> Le persona le plus important pour Kendraw est le **chercheur/doctorant au sein d'une unité de recherche de type URD Abbaye** : quelqu'un qui dessine des structures tous les jours, qui connaît ChemDraw par cœur, et qui attend un outil **au moins aussi complet** mais **plus moderne et gratuit**. C'est le persona exigeant qui sert de boussole pour toutes les décisions produit : si Kendraw le satisfait, les autres personas suivent naturellement. Les arbitrages conflictuels se tranchent en faveur de ce persona.

### Utilisateurs secondaires (usage occasionnel, ponctuel, ou indirect)

- **Chimistes en petites startups biotech/pharma** — usage sporadique, équipes de 5–20 personnes qui ne peuvent pas justifier 4 k$/poste.
- **Étudiants en licence de chimie** — usage ponctuel pour TD et rapports.
- **Rédacteurs scientifiques et illustrateurs** — préparation de contenu pour manuels, blogs de vulgarisation, Wikipédia, cours en ligne.
- **Développeurs d'outils chimio-informatiques** — utilisent Kendraw comme brique pour intégrer un éditeur dans leurs propres applications.
- **Biochimistes et biologistes moléculaires** — dessinent occasionnellement des structures (inhibiteurs, substrats, cofacteurs, ligands) sans être chimistes organiciens purs.

### Besoins adressés

1. **Accessibilité financière sans compromis de qualité** — disposer gratuitement d'un outil de qualité publication au niveau de ChemDraw, sans licence, sans watermark, sans feature-gating.
2. **Productivité moderne** — raccourcis clavier efficaces, auto-save, multi-onglets, undo illimité, interface réactive.
3. **Qualité publication et interopérabilité** — produire des figures dignes des meilleures revues (SVG vectoriel propre, PNG haute résolution, export direct vers Word/PowerPoint/LaTeX) et rester compatible avec l'écosystème (MOL, SDF, SMILES, InChI, CDXML).
4. *(Besoin V2, hors MVP)* **Collaboration et partage** — partage de structures entre collègues (liens partageables, export rapide), avec collaboration temps réel envisagée à plus long terme.

---

## 4. Solution Overview

### Solution proposée

Kendraw est une **application web** (accessible depuis n'importe quel navigateur moderne, sans installation) composée de deux parties :

- **Frontend React 18 + TypeScript** — porte l'intégralité de l'éditeur visuel : canvas de dessin hybride SVG/Canvas, palette d'outils, panneau de propriétés en temps réel, bibliothèque de templates, gestion multi-documents (onglets), et toute l'interface moderne (glassmorphism, dark mode, animations fluides, raccourcis clavier).
- **Backend FastAPI (Python 3.11+)** — expose une API REST/JSON pour les calculs et conversions moléculaires via **RDKit** : masse molaire, formule brute, SMILES ↔ structure, InChI, LogP, TPSA, règle de Lipinski, name-to-structure, etc. Stockage local en SQLite pour le MVP.

### Architecture de calcul hybride

Kendraw adopte une **architecture de calcul hybride** :

- **Bibliothèque chimie légère côté frontend** (OpenChemLib JS, smiles-drawer, RDKit.js WASM ou équivalent — à arbitrer en phase architecture) prend en charge tout ce qui doit être **instantané et interactif** : parsing SMILES pour affichage immédiat lors de la saisie/recherche/import, rendu basique, validation de valence rapide.
- **Backend FastAPI + RDKit** est réservé aux **calculs lourds** qui justifient un round-trip serveur : propriétés physico-chimiques (LogP, TPSA, Lipinski), descripteurs moléculaires, name-to-structure IUPAC, canonicalisation InChI/SMILES, conversions complexes de formats.

Cette séparation garantit que l'expérience d'édition reste fluide et réactive, sans jamais faire attendre l'utilisateur pour une opération triviale.

### Features cœur (must-have pour être un vrai remplaçant de ChemDraw)

- Moteur de dessin 2D complet (canvas interactif, liaisons simples/doubles/triples/aromatiques/wedge/dash/dative/wavy/bold, tableau périodique complet, charges formelles, radicaux, lone pairs, stéréochimie R/S et E/Z)
- Réactions et mécanismes (flèches de réaction, flèches courbes, conditions au-dessus/en-dessous, schémas multi-étapes)
- Bibliothèque de templates (cycles, acides aminés, bases nucléiques, sucres, molécules courantes, groupes protecteurs, templates personnalisables)
- Calculs RDKit (formule, masses, SMILES/InChI/InChIKey, LogP, TPSA, Lipinski, descripteurs)
- Name-to-Structure et Structure-to-Name IUPAC (via RDKit)
- Parsing SMILES côté frontend pour affichage instantané
- Import/export complet (MOL, SDF, SMILES, InChI, CDXML, CML, RXN + PNG/SVG/PDF/EPS + copier/coller Word/PowerPoint/LaTeX)
- Édition avancée (sélection simple/lasso/rectangle, copier/couper/coller, rotation, miroir, alignement, undo/redo illimité, grouper/dégrouper, verrouillage)
- Outils intelligents (vérification de valence, structure cleanup, numérotation automatique des atomes)

### Différenciation moderne (ce que ChemDraw n'a pas)

- Design radicalement moderne (glassmorphism, animations fluides, micro-interactions, typographie soignée)
- Dark mode par défaut + mode clair
- Multi-documents (onglets) avec auto-save local
- Prévisualisation 3D basique des molécules
- Drag & drop de fichiers
- Interface responsive tablette *(V2)*
- Raccourcis clavier complets (identiques à ChemDraw pour migration zéro-friction + personnalisables)
- Panneau de propriétés en temps réel (recalcul instantané pendant le dessin)
- Recherche de structures intégrée

### Proposition de valeur

> **« Tout ChemDraw, en mieux, gratuitement. »**
>
> Kendraw offre aux chimistes une expérience au moins aussi complète que ChemDraw — ils peuvent migrer sans rien perdre — mais dans une interface qu'ils aiment utiliser, avec les commodités modernes (dark mode, auto-save, multi-onglets, raccourcis) qu'ils attendent de tout bon outil en 2026, sans avoir à payer 4 000 $/an ni dépendre d'une licence institutionnelle qu'ils ne contrôlent pas. Le tout sous licence MIT, donc appropriable, modifiable et intégrable dans n'importe quel environnement académique ou industriel.

---

## 5. Business Objectives

> *Note :* Kendraw est un projet open source sans modèle de revenu direct. Les objectifs "business" classiques (revenue, ARR, LTV) ne s'appliquent pas — on parle d'objectifs d'impact, d'adoption et de positionnement dans l'écosystème open source/académique. Le framework SMART est adapté à cette réalité.

### Objectifs stratégiques SMART

**1. Adoption fondamentale au sein du labo URD Abbaye**
- *Spécifique :* Kendraw devient l'outil de dessin moléculaire utilisé au quotidien par les contacts URD Abbaye, en remplacement de ChemDraw.
- *Mesurable :* ≥ 80 % des doctorants et chercheurs de l'équipe utilisent Kendraw au moins une fois par semaine, mesuré par **feedback qualitatif direct** (entretiens, questionnaires), pas par instrumentation côté app.
- *Délai :* 6 mois après le lancement du MVP.

**2. Parité fonctionnelle avec ChemDraw sur le cœur métier**
- *Spécifique :* couvrir l'intégralité des usages de dessin 2D, réactions, mécanismes, templates, calculs, import/export.
- *Mesurable :* checklist de parité ChemDraw ≥ 95 % cochée (checklist à formaliser dans le PRD).
- *Délai :* 12 mois après le début du développement.

**3. Publication open source MIT avec traction communautaire**
- *Spécifique :* dépôt GitHub public, README soigné, documentation utilisateur et développeur, CI/CD, guide de contribution.
- *Mesurable :* ≥ 500 stars GitHub, ≥ 10 contributeurs externes, ≥ 3 PRs mergées de contributeurs externes.
- *Délai :* 12 mois après la première release publique.

**4. Adoption par la communauté chimie francophone puis internationale**
- *Spécifique :* Kendraw est connu et utilisé hors du labo d'origine.
- *Mesurable :* ≥ 500 stars GitHub, ≥ 50 forks, ≥ 10 contributeurs externes, ≥ 3 mentions dans des articles/blogs/posts de la communauté chimie, ≥ 20 instances self-hosted détectables (via opt-in ping ou mentions publiques).
- *Délai :* 18 mois après la première release publique.

**5. Qualité publication validée**
- *Spécifique :* au moins une publication scientifique revue par les pairs utilise des figures générées par Kendraw.
- *Mesurable :* ≥ 1 article publié avec figures Kendraw (dans n'importe quelle revue avec comité de lecture).
- *Délai :* 12 mois après le lancement du MVP.

**6. Publication académique sur Kendraw en tant qu'outil**
- *Spécifique :* soumettre un article décrivant Kendraw à une revue de chimio-informatique reconnue — cibles prioritaires : *Journal of Chemical Information and Modeling* (JCIM) ou *Journal of Cheminformatics*.
- *Mesurable :* article soumis (puis accepté et publié).
- *Délai :* soumission 18 mois après le lancement du MVP.
- *Motivation :* crédibilité scientifique, visibilité dans la communauté chimio-informatique, rayonnement personnel et lien avec URD Abbaye.

**7. Intégration écosystème — embeddabilité dans les ELN open source**
- *Spécifique :* Kendraw est intégrable dans au moins un **Electronic Lab Notebook open source** — cibles : **Chemotion** et/ou **eLabFTW** — sous forme de widget/iframe embarquable ou via une API JS.
- *Mesurable :* ≥ 1 intégration ELN opérationnelle, documentée et annoncée publiquement.
- *Délai :* 18–24 mois après le MVP.
- *Motivation :* levier d'adoption massif via les labos qui utilisent déjà ces plateformes.

### KPIs suivis en continu

- **Stars, forks, watchers, contributeurs GitHub**
- **Nombre d'instances self-hosted détectables** (via mentions Reddit/Twitter/GitHub issues, ou opt-in "phone home" anonyme — à décider dans le PRD avec attention au respect vie privée)
- **Nombre de citations académiques** (trackable via Zenodo DOI + Google Scholar + Semantic Scholar)
- **Feedback qualitatif URD Abbaye** (entretiens périodiques)
- **Nombre de bugs critiques ouverts / fermés**
- **Temps médian entre ouverture et résolution de bug**
- **Nombre d'exports par format** (via télémétrie locale opt-in uniquement, si implémentée un jour)
- **% de parité ChemDraw atteinte** (checklist PRD)

### Valeur / impact attendu

- **Économique** — économie de ~4 000 $/an par utilisateur migré. À l'échelle d'un labo de 20 personnes : **~80 k$/an** de budget rendu disponible pour la recherche. URD Abbaye seul représente ~5 000 €/an d'économie.
- **Scientifique** — accélération du workflow quotidien des chimistes, plus de temps consacré à la recherche et moins à l'outillage.
- **Pédagogique** — rendre possible pour les enseignants la préparation de supports de qualité sans budget logiciel.
- **Écosystème open science** — combler un vide majeur dans l'outillage open source de la chimie, renforcer l'autonomie de la communauté vis-à-vis d'un éditeur propriétaire.
- **Réputationnel pour JB Donnette et URD Abbaye** — positionner le créateur et son cercle comme contributeurs actifs à la communauté open source en chimie.

---

## 6. Scope

> **Principe directeur :** scope découpé en vagues de livraison **MVP → V1 → V2**, chacune avec des contours clairs. La frontière MVP/V1 est calibrée pour permettre une adoption immédiate au labo URD Abbaye.

### 🎯 IN SCOPE — MVP (première release publique)

> *Objectif MVP :* un outil qui, pour un chimiste dessinant des molécules simples à moyennes, remplace déjà ChemDraw au quotidien.

**Dessin moléculaire — cœur**
- Canvas interactif (zoom, pan, grille optionnelle)
- Liaisons : simple, double, triple, aromatique, wedge, dash
- Atomes : tous les éléments du tableau périodique, labels, charges formelles
- Cycles prédéfinis : benzène, cyclopentane, cyclohexane, cyclopropane, furanne, pyridine, pyrrole, thiophène
- Chaîne carbonée au dessin rapide
- Stéréochimie wedge/dash (calculs R/S repoussés en V1)
- Sélection (simple, rectangle)
- Undo/redo illimité
- Copier/couper/coller/dupliquer
- Rotation (libre + incréments 15/30/45/90°)
- Miroir horizontal/vertical
- Vérification automatique de valence (feedback visuel minimal)

**Réactions et mécanismes (critique pour adoption URD Abbaye)**
- **Flèches de réaction** (simple, double, réversible)
- **Flèches courbes pour mécanismes** (curly arrows) — non-négociable pour doctorants et enseignants
- **Conditions de réaction** (texte au-dessus/en-dessous des flèches)

> *Fallback acceptable :* si les flèches courbes s'avèrent techniquement plus coûteuses que prévu, repousser uniquement les curly arrows en toute première feature de V1, mais garder les flèches de réaction simples dans le MVP. À arbitrer en phase tech spec.

**Interface moderne**
- Design glassmorphism + animations fluides
- Dark mode par défaut + mode clair
- Palette d'outils principale (fixe, pas encore contextuelle/personnalisable)
- Panneau de propriétés en temps réel (formule brute, masse molaire, SMILES)
- Raccourcis clavier calqués sur ChemDraw
- Multi-documents (onglets) avec auto-save local
- Drag & drop de fichiers (MOL, SDF, SMILES)

**Frontend — chimie "légère"**
- Parsing SMILES côté front pour affichage instantané
- Validation valence basique côté front
- Rendu SVG + export SVG natif

**Backend + RDKit — calculs lourds**
- API REST FastAPI
- Calculs : formule brute, masse molaire, masse exacte, SMILES canonique, InChI, InChIKey
- SMILES ↔ structure, MOL ↔ structure

**Import / Export (MVP)**
- Import : MOL (v2000), SDF, SMILES
- Export : MOL, SDF, SMILES, InChI, PNG, SVG
- Copier/coller comme image vers Word/PowerPoint

**Infrastructure et qualité**
- SQLite pour stockage local
- Déploiement self-hosted (docker-compose + `npm install`)
- Démo statique frontend-only sur GitHub Pages
- Documentation utilisateur minimale (getting started + raccourcis)
- Dépôt GitHub public MIT (https://github.com/electrosenpai/kendraw)
- CI/CD de base (tests, build, déploiement)
- `CITATION.cff` à la racine

### 🎯 IN SCOPE — V1 (parité ChemDraw "complète")

> *Objectif V1 :* couvrir le reste des usages de ChemDraw. Au sortir de V1, on peut honnêtement dire *« Tout ChemDraw, en mieux, gratuitement »*.

**Dessin avancé**
- Liaisons dative, wavy, bold
- Lone pairs et radicaux
- Stéréochimie R/S et E/Z calculées et affichées
- Sélection lasso
- Alignement et distribution automatique
- Grouper / dégrouper / verrouiller des éléments
- Structure cleanup (auto-layout) via RDKit
- Numérotation automatique des atomes

**Réactions et mécanismes**
- Flèches de résonance
- Schémas multi-étapes complexes

**Templates et bibliothèques**
- Acides aminés (20 standards + principaux non-standards)
- Bases nucléiques (ADN/ARN)
- Sucres courants (glucose, fructose, ribose, désoxyribose)
- Molécules courantes (aspirine, caféine, cholestérol…)
- Groupes protecteurs (Boc, Fmoc, Cbz, TBS, etc.)
- Templates personnalisables par l'utilisateur

**Calculs et propriétés avancés (RDKit)**
- LogP, TPSA
- Donneurs/accepteurs de liaisons H
- Règle de Lipinski (drug-likeness)
- Descripteurs moléculaires complets
- **Name-to-Structure** (IUPAC → structure)
- **Structure-to-Name** (structure → IUPAC)
- Analyse élémentaire
- Calcul de stœchiométrie

**Import/Export complet**
- **CDXML** (critique pour compatibilité ChemDraw), CML, RXN
- Export PDF et EPS haute résolution
- Export qualité publication (vectoriel propre, typographie soignée)

**UX avancée**
- Palette d'outils contextuelle et personnalisable
- Raccourcis clavier personnalisables
- Recherche de structures intégrée
- Tableaux de données chimiques intégrés

### 🎯 IN SCOPE — V2 (différenciation moderne au-delà de ChemDraw)

- **Prévisualisation 3D basique** des molécules (via 3Dmol.js ou équivalent)
- **Partage de structures** (liens publics, export rapide)
- **Collaboration temps réel** (CRDT ou équivalent) — cible long terme
- **Intégration ELN** (widget embarquable pour Chemotion / eLabFTW)
- **Interface responsive tablette** *(déplacée depuis V1)*
- **Comptes utilisateurs optionnels** + synchronisation cloud self-hostable
- **API JS publique** pour intégration tierce
- **Mode présentation / slideshow** pour enseignants
- **Intégration LLM (assistant chimie conversationnel)** — différenciateur phare ⭐
  - *« Dessine-moi le mécanisme SN2 du bromoéthane avec NaOH »* → génération automatique
  - *« Convertis cette réaction en schéma multi-étapes »* → restructuration
  - *« Nomme cette molécule »* / *« Dessine la caféine »* / *« Quelle est la différence entre ces deux énantiomères ? »*
  - *Enjeux PRD :* choix du provider LLM, coûts, confidentialité, modes offline possibles via modèles locaux, garde-fous contre les hallucinations chimiques.

### 🚫 OUT OF SCOPE — explicitement non traité

- **Modélisation 3D interactive complète** (type PyMOL/ChimeraX) — la 3D reste en prévisualisation seulement, pas en construction
- **Simulations moléculaires** (dynamique moléculaire, docking, DFT, QSAR complet)
- **Cristallographie** (CIF, structures cristallines complexes)
- **Biologie structurale** (PDB complet, protéines 3D, ribbons)
- **Spectroscopie / prédiction de spectres** (RMN, IR, UV-Vis)
- **Chemical drawing pour polymères répétitifs complexes** au niveau SciFinder/Reaxys
- **Système de comptes utilisateurs / authentification dans le MVP** — Kendraw fonctionne en local dans le navigateur, les comptes sont V2 minimum
- **Instance publique hébergée** — Kendraw est **100 % self-hosted**, seule une démo statique frontend-only est hébergée
- **Versioning avancé / historique long terme** (git-like pour molécules) — hors scope MVP et V1
- **Application desktop native** (Electron, Tauri) — le projet reste web-first
- **Applications mobiles natives** (iOS/Android)
- **Base de données publique de molécules** style PubChem
- **Marketplace de templates payants** — 100 % gratuit et MIT
- **Intelligence artificielle générative avancée** (diffusion models pour générer des molécules, retrosynthèse IA complète)
- **WCAG AA complet** — seulement minimum raisonnable au MVP (contrastes, navigation clavier basique, labels ARIA sur boutons)
- **Interface multilingue** — anglais uniquement pour le MVP (lingua franca de la chimie), architecture préparée à l'i18n pour traductions communautaires post-MVP

### 💭 Future considerations (post-V2)

- Plugins / extensions tierces
- Mode éducation (exercices guidés, quiz, auto-correction)
- Prédiction de propriétés par ML (en complément de RDKit)
- Retrosynthèse guidée (potentiellement combinée avec LLM)
- Export vers logiciels de simulation (Gaussian, ORCA…)
- App desktop offline via Tauri
- Wrapper Python pour automation scientifique (`pip install kendraw`)

---

## 7. Stakeholders

### Stakeholders principaux

- **Jean-Baptiste Donnette — Créateur, Product Owner, Développeur principal**
  - *GitHub :* [@electrosenpai](https://github.com/electrosenpai)
  - *Influence :* Haute (décideur unique)
  - *Contexte :* SRE engineer dans une autre entreprise, porte Kendraw sur son **temps libre** comme projet OSS personnel et indépendant
  - *Intérêt :* projet OSS passion, défi technique, aider des amis chimistes confrontés à un problème concret (~5 000 €/an de licences ChemDraw au labo URD Abbaye), contribuer à la communauté open source chimie, reconnaissance académique via citations dans les publications
  - *Objectif long terme :* transformer Kendraw en projet communautaire vivant indépendamment de son créateur

- **Contacts du laboratoire URD Abbaye — Bêta-testeurs privilégiés et premiers utilisateurs**
  - *Influence :* Haute (feedback terrain direct et continu sur l'usage quotidien)
  - *Contexte :* amis proches de JB, chimistes utilisant ChemDraw au quotidien, dépensant collectivement ~5 000 €/an en licences
  - *Intérêt :* économiser le budget licences, disposer d'un outil moderne et confortable, participer à une aventure OSS
  - *Rôle opérationnel :* premier cercle de bêta-test, source de validation / invalidation des choix produit

- **Communauté open source (futurs contributeurs développeurs et chimistes)**
  - *Influence :* Moyenne à court terme, Haute à long terme
  - *Contexte :* contributeurs GitHub potentiels, chimistes ambassadeurs, ELN mainteneurs
  - *Intérêt :* outil utile, projet bien mené, ouverture aux contributions
  - *Objectif :* prise de relais progressive du développement et de la gouvernance

### Clarifications importantes sur le positionnement institutionnel

- **Le laboratoire URD Abbaye N'EST PAS l'institution porteuse** de Kendraw. Il est **le cas d'usage de référence et le premier terrain de test** — rien de plus. Aucun sponsoring, aucune propriété intellectuelle partagée, aucune gouvernance institutionnelle. Le projet est **100 % indépendant**, porté à titre **strictement personnel** par JB Donnette, sous licence **MIT**.
- **Pas de financeur** (ni bourse, ni ANR, ni fondation, ni industriel)
- **Pas de co-fondateur / co-propriétaire** à ce jour
- **Pas de partenaire industriel**

### Politique de citation académique — condition non-négociable

Le projet adopte un **double engagement** :

- ⚖️ **Juridiquement :** licence MIT, libre et permissive. Code utilisable sans restriction.
- 📜 **Socialement et éthiquement — non-négociable :** toute publication scientifique utilisant Kendraw **DOIT** citer explicitement :
  1. Le projet **Kendraw**
  2. Son créateur **Jean-Baptiste Donnette (JB Donnette, GitHub [@electrosenpai](https://github.com/electrosenpai))**
  3. L'URL du dépôt : https://github.com/electrosenpai/kendraw

  La citation doit apparaître soit dans les **remerciements**, soit dans les **références bibliographiques** de l'article.

### Mécanisme technique d'application

- Un fichier **`CITATION.cff`** à la racine du dépôt GitHub, format standard supporté par GitHub, Zenodo et les gestionnaires de références, contenant le nom **Donnette, J.-B.** comme auteur principal.
- Le **README**, la **documentation utilisateur**, et le **splash screen / page À propos** de Kendraw rappelleront explicitement cette demande de citation.
- Si un identifiant DOI est obtenu (via Zenodo lors de la release taguée), il sera inclus dans le `CITATION.cff` et affiché dans les exports de qualité publication.
- Mention discrète dans les métadonnées EXIF des exports PNG/PDF : *Created with Kendraw — Donnette, J.-B. — github.com/electrosenpai/kendraw*.
- *Note juridique honnête :* MIT n'impose pas légalement la citation académique — cet engagement est une norme sociale et éthique portée par le projet, pas une clause contractuelle. Mais elle est affichée clairement, facilitée techniquement, et rappelée à chaque export de figure pour ancrer l'usage communautaire.

---

## 8. Constraints and Assumptions

### Contraintes

**Humaines et temporelles**
- **Ressource unique** — un seul développeur (JB Donnette) en temps partiel, sur temps libre uniquement, en parallèle d'un job SRE à temps plein. **Capacité estimée : 10–15 h/semaine en moyenne**, avec variabilité importante (5 h lors des semaines chargées, jusqu'à 20 h lors des semaines calmes et motivées).
- **Pas d'équipe dédiée** — pas de designer UX, pas de QA, pas de DevRel, pas de community manager.
- **Temps long** — le projet se construira sur mois/années, pas en sprints intensifs. Rythme durable avant intensité.

**Financières**
- **Budget proche de zéro** — pas de financement, auto-financement par le créateur. Hébergement minimal (idéalement gratuit ou < 50 €/mois), pas d'outils payants sauf nécessité absolue.
- **Pas de licence logicielle payante** dans la stack — tout doit être open source ou gratuit compatible MIT.

**Licence et légales**
- **Licence MIT strictement** — toute dépendance intégrée au projet doit être compatible MIT. Les dépendances GPL/LGPL/AGPL sont à éviter.
- **RDKit** — BSD 3-clause → compatible MIT ✅.
- **OpenChemLib JS / smiles-drawer** (candidats frontend) — à valider en phase architecture.

**Techniques et performances**
- **Performance cible** — fluide sur des molécules jusqu'à **500 atomes** (contrainte produit non négociable).
- **Qualité publication** — exports dignes des meilleures revues (SVG vectoriel propre, typographie et lisibilité au niveau ChemDraw).
- **Stack imposée** — React 18 + TypeScript / FastAPI + Python 3.11+ / RDKit / SQLite.
- **Web-first** — pas de version native mobile ou desktop dans le MVP/V1.
- **Compatibilité navigateurs** — dernières versions de Chrome, Firefox, Safari, Edge.

**Parité fonctionnelle**
- **Non-négociable : migration sans perte** — un utilisateur ChemDraw doit pouvoir basculer sur Kendraw sans perdre d'usage critique.
- **Compatibilité formats** — MOL, SDF, SMILES, InChI obligatoires dès le MVP ; CDXML pour compatibilité ChemDraw en V1.

**Qualité et gouvernance**
- **Code ouvert dès le premier commit** — dépôt public dès le départ.
- **CI/CD et tests automatisés** — indispensables pour maintenabilité par contributeurs externes.
- **Documentation** — minimale mais présente dès le MVP, condition pour attirer les premiers contributeurs.

**Déploiement — 100 % self-hosted**
- **Pas d'instance publique hébergée.** Kendraw est un outil 100 % self-hosted : chaque utilisateur ou laboratoire le déploie chez lui (docker-compose, `npm install`, ou équivalent).
- **Seule exception :** une démo interactive statique hébergée sur GitHub Pages, frontend-only, sans backend RDKit. Pas d'état persisté, pas de données utilisateurs, pas d'enjeu RGPD.
- **Conséquences :** pas de coûts récurrents, pas de maintenance 24/7, pas de problématique RGPD côté projet, scaling gratuit, alignement avec le profil utilisateur académique.

**Accessibilité**
- WCAG AA non prioritaire pour le MVP (éditeur intrinsèquement visuel)
- Minimum raisonnable : contrastes suffisants, navigation clavier basique, labels ARIA sur boutons de palette et éléments non-dessin
- Accessibilité complète repoussée à V2+

**Langue**
- **Interface en anglais uniquement pour le MVP** (lingua franca de la chimie)
- Architecture préparée à l'i18n dès le départ (clés de traduction)
- Traductions communautaires encouragées en post-MVP, français comme premier ajout attendu

### Hypothèses

- **Produit (web vs desktop)** — nos utilisateurs cibles tolèrent une application web et n'ont pas d'exigence absolue d'outil desktop offline. *Validation précoce :* feedback URD Abbaye dès le MVP.
- **Frontend chimie** — une bibliothèque JS légère de chimie (OpenChemLib JS, smiles-drawer, RDKit.js WASM, ou équivalent) est capable de couvrir le parsing SMILES et le rendu basique côté front avec une qualité suffisante. *Validation :* POC #2.
- **Performance** — React 18 + SVG (ou Canvas) supporte sans problème le rendu fluide de molécules jusqu'à 500 atomes avec édition interactive. *Validation :* POC #1 — **POC prioritaire #1**, bloquant pour le reste du projet.
- **RDKit** — l'ensemble des calculs et conversions nécessaires (name-to-structure, structure-to-name, LogP, TPSA, canonicalisation, tous les formats d'export) sont correctement couverts. *Validation :* audit RDKit en phase architecture.
- **CDXML** — le format propriétaire ChemDraw est reverse-engineerable à un niveau suffisant pour lire/écrire les fichiers courants. *Validation :* POC #3, V1.
- **Communauté** — une fois un MVP publié et bien communiqué (Reddit, Twitter/X, Hacker News), la communauté chimie répondra avec stars, feedback, et à terme contributions. *Mitigation :* soigner le lancement.
- **Citation** — les chercheurs qui utilisent Kendraw respecteront la demande de citation académique même si elle n'est pas imposée légalement. *Mitigation :* CITATION.cff, README, splash screen, DOI Zenodo, métadonnées EXIF.
- **Juridique** — le projet ne tombe sous aucun brevet bloquant de PerkinElmer ou autre acteur. *Mitigation :* implémentation 100 % clean-room, différenciation visuelle nette.
- **⚠️ Disponibilité créateur** — JB dispose d'assez de temps libre et de motivation continue sur 12–24 mois pour mener le projet jusqu'à une V1 crédible, malgré son job SRE principal. **Risque existentiel principal du projet** — un créateur solo en temps libre peut décrocher à tout moment. *Mitigation :* attirer des contributeurs tôt, structurer le code pour être appropriable, accepter un rythme durable plutôt qu'intensif. **Formulation assumée en signal clair à la communauté : ce projet a besoin de contributeurs pour survivre à long terme.**

### POCs prioritaires à lancer en phase architecture

| # | POC | Criticité | Rationale |
|---|---|---|---|
| 1 | **Performance 500 atomes** (SVG vs Canvas vs hybride) | 🔴 Bloquant | Si le rendu rame au-delà de 200 atomes, tout le projet est compromis. Doit être validé **avant** d'engager quoi que ce soit d'autre. |
| 2 | **Parsing SMILES côté front** (choix de lib JS) | 🟠 Critique | Sans ça, l'UX instantanée promise dans le brief n'est pas atteignable. |
| 3 | **Lecture/écriture CDXML** | 🟡 Important | Différé V1 donc urgence moindre, mais à valider avant engagement ferme sur la promesse "migration sans perte". |

---

## 9. Success Criteria

### Sur la valeur utilisateur

- ☑️ **Un doctorant de URD Abbaye peut remplir sa journée type** sans jamais avoir besoin d'ouvrir ChemDraw. **Critère de succès terrain numéro un.**
- ☑️ **Les enseignants de l'équipe** préparent leurs polycopiés de TD entièrement avec Kendraw, avec un rendu final supérieur ou égal à ChemDraw.
- ☑️ **Temps de prise en main < 30 minutes** pour un utilisateur ChemDraw qui découvre Kendraw.
- ☑️ **Feedback spontané positif** des premiers utilisateurs au labo URD Abbaye.

### Sur la qualité produit

- ☑️ **Les figures exportées sont publiées** dans au moins un article de revue à comité de lecture, sans retouche manuelle post-export.
- ☑️ **Le rendu visuel impressionne** au premier coup d'œil — réactions spontanées type *« wow, ça ressemble à un outil moderne »*.
- ☑️ **La performance reste fluide** jusqu'à 500 atomes sans lag perceptible, même sur machines modestes.
- ☑️ **Kendraw doit être beau au point que même des non-chimistes aient envie de jouer avec.** Si un développeur ou un designer qui ne connaît rien à la chimie découvre Kendraw et réagit par *« c'est classe, je veux contribuer »*, le projet a gagné. C'est aussi un **levier critique de recrutement** des contributeurs frontend talentueux (React, TypeScript, design system, animations) qui ne sont pas nécessairement des chimistes.

### Sur la santé du projet open source

- ☑️ **Au moins un contributeur externe significatif** (≥ 3 PRs mergées non-triviales) dans les 12 mois suivant la release publique.
- ☑️ **Le projet est cité** dans au moins une publication académique avec mention explicite de Jean-Baptiste Donnette.
- ☑️ **Le projet est indexé** dans Zenodo (avec DOI), Awesome-lists GitHub pertinentes, éventuellement JOSS.
- ☑️ **Les issues GitHub sont vivantes** (délai médian de réponse < 7 jours).
- ☑️ **Vision long terme : être cité dans une publication d'une revue TOP mondiale en chimie** — *JACS*, *Angewandte Chemie International Edition*, *Nature Chemistry*, *Chemical Science* ou équivalent. **Objectif ambitieux ultime et étoile polaire du projet à horizon plusieurs années.** Si un chercheur de premier plan publie dans l'une de ces revues avec des figures générées par Kendraw et cite Jean-Baptiste Donnette, le projet aura atteint son sommet de reconnaissance académique.

### Sur l'intégration écosystème

- ☑️ **Kendraw est mentionné** au moins une fois par un autre projet OSS de chimie comme alternative ou dépendance possible.
- ☑️ **Discussion sérieuse** entamée avec un mainteneur Chemotion ou eLabFTW autour d'une intégration.

### Sur la gouvernance et la pérennité

- ☑️ **Appropriable** — un développeur tiers peut cloner, lire la doc, contribuer son premier patch en < 0.5 jour.
- ☑️ **Bus factor > 1** à horizon 18 mois — au moins un autre contributeur connaît le code suffisamment pour faire avancer le projet.

### Sur l'impact humain

- ☑️ **Les amis du labo URD Abbaye sont heureux** — le critère le plus intime mais probablement le plus important au démarrage. Si les premiers utilisateurs à qui le projet est destiné affectivement disent *« merci, c'est exactement ce qu'on attendait »*, le projet a déjà en grande partie réussi son pari originel. **C'est le vrai nord du projet.**

---

## 10. Timeline

> ⚠️ **Disclaimer explicite :** les délais ci-dessous sont des **ordres de grandeur volontairement optimistes**, calibrés pour un créateur solo à temps partiel (10–15 h/semaine) sans perturbation majeure. En réalité, **multiplier ces délais par 1,5 est réaliste** et acceptable. Ce qui compte, c'est l'**ordre des jalons** et le fait d'**avancer**, pas la date exacte de chaque étape. Les dates seront révisées après la phase d'architecture.

### Point de départ

**T0 = 2026-04-12** (init BMAD, Product Brief validé)

### Phases

**Phase 0 — Cadrage produit et architecture (T0 → T+2 mois)**
- Livrables BMAD : Product Brief ✅, PRD, UX Design, Architecture, Tech Spec, Solutioning Gate Check
- Livrables techniques : POC #1 (performance 500 atomes), POC #2 (parsing SMILES front), mise en place du repo GitHub public (MIT, CI/CD, CITATION.cff)

**Phase 1 — Construction MVP (T+2 → T+8 mois)**
- Moteur de dessin 2D complet
- Flèches de réaction et flèches courbes (critique URD Abbaye)
- Multi-onglets + auto-save + dark mode + glassmorphism
- Backend FastAPI + RDKit (calculs de base)
- Import/export MOL/SDF/SMILES/PNG/SVG
- Frontend SMILES parsing instantané
- Documentation minimale, tests automatisés
- **Release MVP publique (v0.1.0)** avec annonce multi-canal

**Phase 2 — Itération MVP → V1 (T+8 → T+14 mois)**
- Feedback URD Abbaye → corrections et polish
- Liaisons avancées, stéréochimie R/S et E/Z, structure cleanup
- Templates complets (AA, bases, sucres, groupes protecteurs)
- Calculs avancés RDKit (LogP, TPSA, Lipinski, descripteurs)
- Name-to-Structure et Structure-to-Name IUPAC
- Import/export CDXML, export PDF/EPS qualité publication
- Palette et raccourcis personnalisables
- **Release V1 (v1.0.0) — parité ChemDraw revendiquée**

**Phase 3 — V2 et différenciation (T+14 → T+24 mois)**
- Prévisualisation 3D basique
- Partage de structures
- **Intégration LLM (assistant chimie conversationnel) — différenciateur phare**
- Intégration ELN (Chemotion ou eLabFTW)
- Interface responsive tablette
- Comptes optionnels + sync cloud self-hostable
- API JS publique
- **Release V2 (v2.0.0)**

### Jalons clés synthétisés

| Jalon | Cible | Criticité | Description |
|---|---|---|---|
| **M0 — Kickoff** | T0 (2026-04-12) | ✅ En cours | Init BMAD, Product Brief validé |
| **M1 — Gate Check** | T+2 mois | 🔴 Bloquant | Architecture validée, POCs verts, prêt à coder |
| **M1.5 — Dev blog public lancé** | T+3 mois env. | 🟠 Important | Première publication devlog mensuel, début visibilité organique |
| **M2 — First Commit applicatif** | T+2 mois | 🔴 Bloquant | Premier commit de code applicatif sur `main` |
| **M2.5 — Private Alpha URD Abbaye** | T+5 mois | 🟠 Important | Version brute envoyée aux amis du labo pour premier feedback terrain |
| **M3 — MVP public (v0.1.0)** | T+8 mois | 🔴 Critique | Annonce publique multi-canal |
| **M4 — V1 parité ChemDraw (v1.0.0)** | T+14 mois | 🔴 Critique | Migration depuis ChemDraw sans perte revendiquée |
| **M5 — Soumission article JCIM** | T+18 mois | 🟠 Important | Crédibilité scientifique |
| **M6 — V2 différenciation (v2.0.0)** | T+24 mois | 🟡 Stratégique | LLM, ELN, 3D, partage |
| **M7 — Article publié (peer-reviewed)** | T+24 mois env. | 🟡 Stratégique | Validation scientifique officielle |

### Stratégie devlog M1.5 (contexte)

Publication **mensuelle** sur GitHub Discussions ou blog statique (Astro/MkDocs sur GitHub Pages) avec **screenshots, GIFs animés, courtes démos vidéo**. Objectifs :
- Construire la visibilité en amont du MVP (audience préchauffée au moment de l'annonce)
- Créer l'engagement communautaire précoce
- Marketing organique gratuit (Reddit r/chemistry, #chemtwitter, newsletters OSS)
- Forcer la discipline de shipping (obligation morale de montrer du concret chaque mois)

---

## 11. Risks

### 🔴 Risques critiques (existentiels)

**Risque #1 — Épuisement / perte de motivation du créateur solo**
- *Nature :* créateur solo en temps libre + job SRE à temps plein. Fluctuations de motivation, charge du job principal, aléas personnels, burnout OSS classique sur 12–24 mois.
- *Probabilité :* **Haute** — mode de décès #1 des projets OSS solos.
- *Impact :* **Critique** — le projet meurt ou stagne.
- *Mitigations :* rythme durable 10–15h/semaine, devlog mensuel pour boucle de motivation externe, attirer des contributeurs tôt, structurer le code pour être appropriable, accepter les périodes de "mode veille".

**Risque #2 — Infaisabilité technique sur la performance (500 atomes)**
- *Nature :* React 18 + SVG/Canvas pourrait ne pas tenir la promesse de fluidité à 500 atomes avec édition interactive temps réel.
- *Probabilité :* **Moyenne**.
- *Impact :* **Critique**.
- *Mitigations :* POC #1 prioritaire avant tout engagement de code applicatif, benchmark 100/250/500/750 atomes, approche hybride SVG+Canvas prévue, plan de repli Canvas 2D ou Pixi.js.

**Risque #3 — Réclamation juridique de PerkinElmer ou tiers**
- *Nature :* Kendraw reproduit fonctionnellement ChemDraw. Possibilité (faible) de réclamation brevets/marques/passing-off, surtout aux USA.
- *Probabilité :* **Faible** (Ketcher existe depuis des années sans poursuite).
- *Impact :* **Élevé** pour un individu isolé — déséquilibre de ressources juridiques.
- *Mitigations :* implémentation 100 % clean-room (pas de rétro-ingénierie), différenciation visuelle nette, communication mesurée, pas d'usage du nom "ChemDraw" dans nom/URLs/logos, conseil juridique léger si le projet atteint > 1 000 stars, pas d'exposition commerciale (MIT gratuit).

### 🟠 Risques élevés

**Risque #4 — Adoption communautaire insuffisante (lancement qui fait flop)**
- *Nature :* le MVP sort, est annoncé, et ne décolle pas.
- *Probabilité :* **Moyenne** — l'OSS est un marché à winners-take-most.
- *Impact :* **Élevé** — démotivation + impact concret réduit.
- *Mitigations :* devlog mensuel AVANT le lancement, soigner la démo vidéo (< 3 min), lancement multi-canal coordonné (Reddit, Twitter/X, HN, LinkedIn, Zenodo), preuve sociale URD Abbaye, bon timing, contact pré-lancement avec influenceurs #chemtwitter.

**Risque #5 — Complexité RDKit / couverture fonctionnelle insuffisante**
- *Nature :* RDKit ne couvre pas tout. Name-to-structure IUPAC complet, CDXML round-trip parfait peuvent s'avérer incomplets.
- *Probabilité :* **Moyenne à élevée** sur des features V1.
- *Impact :* **Moyen** — features dégradées ou reportées.
- *Mitigations :* audit RDKit précoce, repli sur libs tierces compatibles MIT (OPSIN pour IUPAC, BSD), accepter la dégradation, framing communication honnête (95% des cas couverts).

**Risque #6 — Reverse-engineering CDXML trop coûteux**
- *Nature :* CDXML est partiellement documenté, PerkinElmer peut changer le format.
- *Probabilité :* **Moyenne**.
- *Impact :* **Élevé** — casse la promesse "migration sans perte".
- *Mitigations :* POC #3, approche incrémentale (cas courants d'abord), tests sur fichiers réels URD Abbaye, fallback via format intermédiaire (CDXML → MOL → Kendraw via obabel).

### 🟡 Risques modérés

**Risque #7 — Architecture initiale inadaptée, dette technique massive**
- *Mitigations :* phase architecture sérieuse (BMAD) avant premier commit applicatif, tests automatisés dès le début, code reviews disciplinées, accepter de jeter du code si un choix s'avère mauvais tôt.

**Risque #8 — Défaut de qualité sur les exports qualité publication**
- *Mitigations :* test export dès le MVP sur templates de figures JACS/Angewandte, polices de qualité (Inter, IBM Plex), rendu vectoriel propre, option DPI/résolution élevée, feedback ciblé URD Abbaye.

**Risque #9 — Dépendances OSS abandonnées en cours de route**
- *Mitigations :* choisir des libs avec communauté active, isoler l'interface chimie JS derrière une couche d'abstraction, privilégier les libs portées par des organisations.

**Risque #10 — Non-respect de la demande de citation académique**
- *Mitigations :* CITATION.cff, DOI Zenodo, rappel README/doc/splash screen, mention discrète dans métadonnées EXIF des exports, accepter philosophiquement l'attribution imparfaite.

**Risque #11 — Submersion par la gestion communautaire (bon problème)**
- *Nature :* si le projet prend bien, le créateur peut être submergé par les issues, PRs, questions, demandes de features. Le profil SRE de JB lui fait reconnaître le parallèle avec l'on-call fatigue — c'est pareil pour l'OSS.
- *Probabilité :* **Moyenne** — conditionnel au succès d'adoption.
- *Impact :* **Moyen** — peut accélérer le burnout (Risque #1) si mal géré.
- *Mitigations :*
  - Templates d'issues et de PRs stricts dès le départ
  - `CONTRIBUTING.md` clair avec attentes explicites
  - Labels automatiques via bot (GitHub Actions)
  - Triage régulier et discipliné (par exemple 1 session triage par semaine, pas plus)
  - **Identifier un ou deux co-mainteneurs dès que possible** pour partager la charge
  - Politique "no" claire sur les features hors roadmap (dire non tôt plutôt que tard)

### Hiérarchie de criticité confirmée

**Risques existentiels #1 et #2** : burnout solo et performance 500 atomes. Ce sont les deux qui peuvent tuer le projet. Toute l'énergie de mitigation doit prioritairement se concentrer sur ces deux-là.

---

## Checklist de validation du brief

- [x] Executive summary clair et concis
- [x] Problem statement spécifique avec exemples concrets
- [x] Target audience bien définie + persona de référence explicite
- [x] Solution addresse le problème énoncé
- [x] Business goals SMART (adaptés au contexte OSS académique)
- [x] Scope explicite (MVP / V1 / V2 / OUT OF SCOPE / Future)
- [x] Stakeholders identifiés avec niveaux d'influence
- [x] Contraintes et hypothèses listées avec stratégies de validation
- [x] Success criteria mesurables ET qualitatifs
- [x] Timeline avec jalons ordonnés et disclaimer honnête
- [x] Risques identifiés avec probabilité, impact, et mitigations

---

## Prochaine étape BMAD

**Phase 2 — Planning : `/prd` (`bmad:prd`)**

Le Product Brief est maintenant la **source canonique** qui alimentera le PRD (Product Requirements Document). Le PRD détaillera, pour chaque feature MVP et V1, les user stories, critères d'acceptation, priorisations, dépendances, et exigences techniques de haut niveau.

**Recommandation d'exécution :** lancer `bmad:prd` dans **une fenêtre de contexte fraîche** (`/clear` recommandé), en fournissant ce brief comme input principal.

---

*Document généré par le workflow BMAD `product-brief` — Phase 1 Analysis — 2026-04-12*
*Auteur : Jean-Baptiste Donnette ([@electrosenpai](https://github.com/electrosenpai))*
*Licence du projet Kendraw : MIT*
