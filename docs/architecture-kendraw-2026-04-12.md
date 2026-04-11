# Architecture Système : Kendraw

**Date :** 2026-04-12
**Architecte :** Jean-Baptiste Donnette ([@electrosenpai](https://github.com/electrosenpai))
**Version :** 1.0
**Type de projet :** Web Application (React 18 + TypeScript / FastAPI + Python 3.11+ / RDKit)
**Niveau de projet :** 4 — Enterprise (49 FR, 12 NFR, 12 epics, 66–92 stories estimées)
**Statut :** Draft

---

## Vue d'ensemble du document

Ce document définit l'architecture technique de **Kendraw**, le successeur web open-source moderne de ChemDraw. Il sert de plan d'implémentation pour la phase 4 (Sprint Planning) et garantit la traçabilité de chaque exigence fonctionnelle (FR) et non-fonctionnelle (NFR) du PRD vers une décision architecturale.

L'architecture est résolument pragmatique : elle reflète la réalité d'un projet **OSS, MIT, solo (au démarrage), auto-hébergé, sans cloud, sans télémétrie, sans comptes utilisateur**. Les sections "scaling horizontal", "multi-AZ", "auto-scaling", "DR" présentes dans le template d'architecture standard sont délibérément réduites — elles n'ont pas de sens pour Kendraw — et leurs équivalents pertinents (perf frontend, optimisation RDKit, dégradation gracieuse, auto-save sans perte) sont en revanche traités en profondeur.

**Documents liés :**
- Product Brief : `docs/product-brief-kendraw-2026-04-12.md`
- Product Requirements Document : `docs/prd-kendraw-2026-04-12.md`
- UX Design : `docs/ux-design-kendraw-2026-04-12.md`
- Workflow status : `docs/bmm-workflow-status.yaml`

**Guide de lecture :**
- §1–2 : synthèse, drivers architecturaux validés.
- §3 : pattern, diagramme, flux de données principal.
- §4 : stack technologique justifiée poste par poste.
- §5 : composants frontend (8 packages) et backend (4 modules), frontières strictes.
- §6 : modèle de données (scène native + persistance + format `.kdx`).
- §7 : contrats d'API REST.
- §8 : couverture systématique des 12 NFR.
- §9–11 : sécurité, performance, fiabilité — adaptées au contexte auto-hébergé.
- §12 : développement, tests, CI/CD, déploiement.
- §13 : traçabilité FR/NFR vers composants.
- §14 : trade-offs documentés honnêtement.
- §15 : risques, POC bloquants, questions ouvertes restantes.
- Annexes : matrice d'évaluation des libs chimie, planification capacitaire.

---

## 1. Synthèse exécutive

Kendraw est une **application web hybride** composée de :

- Un **frontend React 18 + TypeScript** qui embarque l'intégralité du moteur d'édition (modèle de scène, validateurs, deux moteurs de rendu, persistance locale, parsing/sérialisation des formats légers, état UI). Le frontend est conçu pour fonctionner **sans backend** dans son profil de build "static demo" (FR-029) servi sur GitHub Pages.
- Un **backend FastAPI + Python 3.11+** stateless qui expose une API REST pour les calculs RDKit qui dépassent les capacités du chem-lib JS embarqué : conversions de formats lourds (CDXML, CML, RXN), descripteurs avancés, stéréochimie computée (R/S, E/Z), nomenclature IUPAC ↔ structure, et analyse élémentaire.

**Pattern architectural :** **Modular Monolith** (frontend + backend) avec frontières internes strictes par packages, déployé en deux services (nginx static + uvicorn) orchestrés par un seul `docker-compose.yml`. Aucune base de données partagée, aucun broker, aucune dépendance cloud obligatoire.

**Décisions structurantes verrouillées :**

1. **Rendu hybride Canvas 2D (écran) + SVG (export)** piloté par un modèle de scène unique et immuable. Une couche d'abstraction `Renderer` permet un basculement futur vers WebGL/Pixi.js si POC #1 le requiert sans réécriture applicative.
2. **RDKit.js (WASM)** comme bibliothèque chimie frontend, pour garantir la parité de comportement avec le backend RDKit Python. Fallback **OpenChemLib JS** dans le profil de build `static-demo` si POC #2 montre que le bundle est trop lourd au boot.
3. **IndexedDB via Dexie** pour toute la persistance locale (documents, onglets, historique d'undo, templates utilisateur, paramètres). Backend **stateless**, aucune base SQL au MVP.
4. **Trois couches d'état React clairement séparées** : domaine (scene model, store custom framework-agnostic), UI (Zustand), cache serveur (TanStack Query).
5. **Monorepo pnpm workspaces** avec ~8 packages frontend découplés + 1 package backend Python.
6. **CI GitHub Actions** avec audit licences automatique (NFR-003), gardes de bundle size, tests visuels, et benchmarks de perf codifiés (NFR-001).

L'architecture est pensée autour d'un seul critère existentiel : **fluidité d'édition à 500 atomes (NFR-001)**. Toutes les autres décisions sont subordonnées à cette contrainte. POC #1 (perf), POC #2 (bundle WASM), POC #3 (CDXML round-trip) et POC #4 (couverture IUPAC) sont **bloquants** et précèdent toute écriture de code applicatif.

---

## 2. Drivers Architecturaux

Les drivers architecturaux sont les exigences (essentiellement non-fonctionnelles) qui forcent des décisions structurantes. Validés avec le Product Owner avant la rédaction du document.

| #     | Driver                                                       | Origine             | Conséquence architecturale                                                                                                                                                                                                            |
|-------|--------------------------------------------------------------|---------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **D1** | Fluidité 500 atomes (≥30 fps, frame budget < 16 ms)         | NFR-001             | Modèle de scène immuable + diff incrémental ; rendu Canvas 2D ; spatial index ; zéro round-trip réseau dans la boucle d'édition ; web workers pour les opérations lourdes hors UI thread. **Driver principal — un échec ici tue le projet.** |
| **D2** | Auto-hébergement, zéro cloud obligatoire                    | NFR-004 + NFR-008   | Aucun service géré, aucun broker, aucune base externe. Une seule unité déployable (`docker compose up`). Toute "scalability" est verticale et par instance.                                                                          |
| **D3** | Compatibilité licence MIT                                   | NFR-003             | Audit licences en CI (`license-checker` frontend, `pip-licenses` backend). Filtre dur sur GPL/LGPL/AGPL. Choix RDKit (BSD-3) et OPSIN (Apache-2) explicitement validés.                                                              |
| **D4** | Mode démo frontend-only sur GitHub Pages                    | FR-029              | Le frontend doit fonctionner sans backend. Deux profils de build (`full` / `static-demo`) pilotés par feature flags compile-time. Les features RDKit-backend sont désactivées gracieusement avec UI explicite.                       |
| **D5** | Qualité vectorielle publication (JACS / Angewandte)         | NFR-005 + FR-024 + FR-045 | Pipeline d'export SVG dédié (`renderer-svg` séparé du `renderer-canvas`). Polices embarquées, géométrie propre, pas de couches rasterisées. Métadonnées de citation (FR-027) injectées en dernier maillon.                          |
| **D6** | Auto-save sans perte (< 5 s)                                 | NFR-010 + FR-017    | IndexedDB (jamais localStorage), write-ahead via worker dédié, scheduler debounced, restore-on-reload one-click.                                                                                                                      |
| **D7** | Codebase appropriable par contributeurs externes            | NFR-009             | Frontières strictes par packages, dépendances unidirectionnelles, abstractions explicites (`Renderer`, `ChemAdapter`, `PersistenceStore`), tests > 80 % sur les chemins compute, CI complète, `CONTRIBUTING.md`. **Mitigation directe du risque #1 du brief : burnout solo.** |
| **D8** | i18n sans refacto                                            | NFR-007             | `t('clé')` partout dès le MVP via Lingui (extraction statique), locale EN canonique, interdiction des chaînes hardcodées dans les composants.                                                                                       |

**NFR traités comme contraintes plutôt que drivers** (n'imposent pas de choix structurel mais doivent être satisfaites) :

- **NFR-002** (browser compat) → matrice CI Playwright sur Chromium / Firefox / WebKit.
- **NFR-006** (a11y AA hors canvas) → axe-core en CI sur les surfaces non-canvas, ARIA labels obligatoires sur tous les contrôles non-dessin.
- **NFR-011** (citation robuste) → scaffolding de fichiers : `CITATION.cff`, README, splash screen (FR-026), métadonnées d'export (FR-027). Pas de décision structurelle.
- **NFR-012** (documentation) → répertoire `docs/` publié via CI (mkdocs ou astro-starlight, à confirmer).

---

## 3. Vue d'ensemble du système

### 3.1 Pattern architectural

**Pattern :** **Modular Monolith** — frontend SPA et backend API séparés en deux processus, mais chacun structuré en interne en packages aux frontières strictes (façon "modulith"). Pas de microservices : à l'échelle d'un projet solo + auto-hébergement par lab, les coûts opérationnels d'une architecture distribuée seraient absurdes.

**Justification du choix :**

- Un seul utilisateur (ou une poignée par instance) interagit avec un seul backend → pas de besoin de scaling indépendant des services.
- Solo dev → tout coût de coordination distribué est un suicide de bande passante mentale.
- Self-hosted → l'utilisateur (souvent un PhD non-DevOps) doit pouvoir lancer l'app en une commande. Microservices = échec direct du critère D2 et trahison de la promesse "lancer en une commande".
- Frontières internes par packages → on conserve les bénéfices d'un découplage propre (D7) sans payer le coût du distribué.

**Découpage en deux processus** plutôt qu'un seul :

- Le frontend doit pouvoir vivre **sans** le backend (FR-029, mode démo statique).
- Le backend RDKit est en Python ; le frontend en TypeScript. Les coller dans un seul binaire (via PyScript ou Pyodide) n'a pas de sens — le coût bundle serait prohibitif et la perte de contrôle Python complète.
- Deux processus = deux Dockerfiles distincts, orchestrés par `docker-compose`. Trivial à comprendre, trivial à déployer.

### 3.2 Diagramme d'architecture (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       UTILISATEUR (navigateur)                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS (ou HTTP local en self-hosted)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  FRONTEND (React 18 + TypeScript)                   │
│                  Servi par nginx — Docker container                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  @kendraw/ui  (React app, design system Glasswerk)           │   │
│  │  ┌─────────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐   │   │
│  │  │  Tab Bar    │ │   Tool    │ │  Canvas  │ │  Property  │   │   │
│  │  │  + Pages    │ │  Palette  │ │  Mount   │ │   Panel    │   │   │
│  │  └─────────────┘ └───────────┘ └──────────┘ └────────────┘   │   │
│  │   État UI : Zustand    Cache backend : TanStack Query        │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                     │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  @kendraw/scene  (modèle de scène immuable + commands)       │   │
│  │   ─ Document / Page / Atom / Bond / Arrow / Annotation       │   │
│  │   ─ Command bus + History (undo/redo, merging)               │   │
│  │   ─ Validators (valence, stéréo)                             │   │
│  │   ─ Spatial index (R-tree pour hit-testing)                  │   │
│  │   ─ Sérialiseur natif Kendraw (JSON .kdx)                    │   │
│  └──┬────────────┬───────────────┬────────────┬─────────────────┘   │
│     │            │               │            │                     │
│     ▼            ▼               ▼            ▼                     │
│  ┌──────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ @k/  │  │ @k/      │  │ @k/      │  │ @k/      │                 │
│  │ chem │  │ renderer-│  │ renderer-│  │ persist- │                 │
│  │      │  │ canvas   │  │ svg      │  │ ence     │                 │
│  │RDKit │  │ (écran)  │  │ (export) │  │ Dexie/IDB│                 │
│  │.js   │  │          │  │          │  │          │                 │
│  │WASM  │  │          │  │          │  │          │                 │
│  └──────┘  └──────────┘  └──────────┘  └──────────┘                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  @kendraw/io  (MOL, SDF, SMILES, +CDXML/CML/RXN en V1)       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  @kendraw/api-client  (OpenAPI client — stub en demo)        │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ REST JSON  /api/v1/*
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                BACKEND (FastAPI + Python 3.11+)                     │
│                Servi par uvicorn — Docker container                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  kendraw_api  (FastAPI routers, Pydantic schemas, OpenAPI)   │   │
│  │  /compute, /convert, /naming, /health, /version              │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                     │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  kendraw_chem  (services métier RDKit)                       │   │
│  │   ─ ComputeService  (formula, MW, descriptors, Lipinski…)    │   │
│  │   ─ ConvertService  (MOL/SDF/SMILES/InChI/CDXML/CML/RXN)     │   │
│  │   ─ NamingService   (RDKit + OPSIN fallback)                 │   │
│  │   ─ StereoService   (R/S, E/Z)                               │   │
│  └─────┬────────────────────────────────────────────────────────┘   │
│        │                                                            │
│        ▼                                                            │
│  ┌──────────┐    ┌──────────┐                                       │
│  │  RDKit   │    │  OPSIN   │  (V1 uniquement, JRE bundled          │
│  │ (Python) │    │ (Java)   │   dans l'image backend V1+)           │
│  └──────────┘    └──────────┘                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Note importante (mode démo statique) :** dans le profil de build `static-demo` déployé sur GitHub Pages, l'ensemble du bloc backend disparaît, et `@kendraw/api-client` est compilé en stub no-op qui retourne systématiquement un statut "feature requires backend". Les composants UI consultent `useBackendAvailability()` (TanStack Query check sur `/health` au démarrage) et désactivent les features concernées avec une affordance visuelle explicite (badge "demo mode" sur les boutons concernés, tooltip explicatif).

### 3.3 Flux de données principal — boucle d'édition steady-state

```
1. Interaction utilisateur (click, drag, key) sur le DOM canvas
   │
   ▼
2. Tool controller (@kendraw/ui) capture l'événement, calcule les coords scène
   │
   ▼
3. Hit-test via spatial index (@kendraw/scene) → atom/bond/arrow ciblé
   │
   ▼
4. Tool controller construit un Command (AddAtom, MoveSelection, …)
   │
   ▼
5. Command bus (@kendraw/scene) :
     ├─ valide via Validators (valence)
     ├─ applique en structural sharing (Immer)
     ├─ pousse sur l'undo stack (avec command merging si applicable)
     └─ émet un événement scene-changed
   │
   ▼
6. Renderer (@kendraw/renderer-canvas) reçoit le diff, repaint UNIQUEMENT
   les régions impactées (dirty regions)
   │
   ▼
7. PropertyPanel (@kendraw/ui) recalcule formula/MW/SMILES via @kendraw/chem
   (RDKit.js WASM, synchrone, < 100 ms pour ≤ 100 atomes)
   │
   ▼
8. Auto-save scheduler (@kendraw/persistence) marque le document dirty,
   re-déclenche le timer debounced (5 s)
   │
   ▼
9. Au tick suivant : worker thread sérialise et écrit le document dans
   IndexedDB. Aucune interaction avec l'UI thread.
```

**Aucune flèche réseau dans cette boucle.** C'est la garantie de tenue de NFR-001. Le backend n'est sollicité que pour les actions explicites de l'utilisateur (export CDXML, calcul de descripteurs V1, conversion formats lourds, etc.) et toujours en arrière-plan via TanStack Query, sans bloquer la boucle d'édition.

---

## 4. Stack technologique

Choix systématique avec justification poste par poste. Toute alternative envisagée puis rejetée est documentée avec le motif.

### 4.1 Frontend

| Élément                        | Choix                                                       | Licence       |
|--------------------------------|-------------------------------------------------------------|---------------|
| Langage                        | **TypeScript 5.x** (strict mode, `noUncheckedIndexedAccess`) | Apache-2      |
| Framework UI                   | **React 18.x**                                              | MIT           |
| Build / dev server             | **Vite 5.x**                                                | MIT           |
| State manager (UI)             | **Zustand 4.x**                                             | MIT           |
| State manager (cache backend)  | **TanStack Query 5.x**                                      | MIT           |
| State manager (domaine)        | **Custom store** (`@kendraw/scene`) + `useSyncExternalStore` + **Immer** | MIT |
| Lib chimie                     | **RDKit.js (WASM)** — fallback **OpenChemLib JS** en démo  | BSD-3 / BSD-2 |
| Rendu écran                    | **Canvas 2D natif** (pas de lib) — abstraction `Renderer`  | n/a           |
| Rendu export                   | **SVG natif** (génération directe via DOM-less builder)    | n/a           |
| Persistance locale             | **IndexedDB via Dexie 4.x**                                | Apache-2      |
| i18n                           | **Lingui 4.x** (extraction statique, ICU)                  | MIT           |
| Routing                        | **React Router 6.x**                                        | MIT           |
| Styling                        | **CSS Modules** + **CSS variables** (tokens "Glasswerk")   | n/a           |
| Animation                      | **Framer Motion** (lazy-loadé, hors hot path canvas)       | MIT           |
| Tests unitaires                | **Vitest**                                                  | MIT           |
| Tests E2E                      | **Playwright**                                              | Apache-2      |
| Tests visuels                  | **Playwright snapshots**                                    | Apache-2      |
| Linter                         | **ESLint** + plugin TS strict                               | MIT           |
| Formatter                      | **Prettier** (config minimale, défaut)                     | MIT           |
| Package manager                | **pnpm 9.x** (workspaces)                                  | MIT           |

**Justifications notables :**

- **Vite plutôt que Next.js / Remix** : Kendraw est une SPA sans SSR — pas de route server-side, pas de SEO content-driven, pas d'API routes (le backend Python s'en charge). Vite est plus simple, plus rapide en dev, et le build statique est trivialement déployable sur GitHub Pages pour le mode démo.
- **Canvas 2D natif plutôt que Pixi.js / Konva** : décision conservatrice. Canvas 2D natif est suffisant jusqu'à ~1000 atomes selon les benchmarks publics ; au-delà, on bascule via la couche `Renderer` vers Pixi.js (WebGL). On n'introduit pas Pixi avant d'avoir besoin (POC #1 décide).
- **CSS Modules plutôt que Tailwind / styled-components** : (a) bundle plus léger (NFR-001 indirect), (b) extraction statique (zéro JS runtime pour le styling), (c) plus simple à comprendre pour un contributeur React vanilla, (d) compatible avec les CSS variables qui portent le système Glasswerk.
- **Framer Motion lazy-loadé** : on l'utilise pour les transitions UI (panels, modales) mais **pas** dans le canvas. Lazy-loaded pour ne pas peser dans le bundle initial.
- **Lingui plutôt que i18next** : extraction statique des messages → bundle uniquement ce qui est utilisé ; tooling ICU mature ; CLI clean. i18next est plus populaire mais le runtime cost est plus lourd.

### 4.2 Backend

| Élément                  | Choix                                              | Licence       |
|--------------------------|----------------------------------------------------|---------------|
| Langage                  | **Python 3.11+** (PEP 604, `match`, perf)         | PSF           |
| Framework API            | **FastAPI 0.110+**                                 | MIT           |
| ASGI server              | **Uvicorn** (workers via gunicorn en prod)        | BSD-3         |
| Validation               | **Pydantic 2.x** (strict mode)                    | MIT           |
| Lib chimie               | **RDKit (Python bindings)** version pinnée        | BSD-3         |
| Nomenclature IUPAC (V1)  | **OPSIN** via `py2opsin` ou sidecar JVM (POC #4)  | Apache-2      |
| Configuration            | **Pydantic Settings**                              | MIT           |
| Logging                  | **structlog** (JSON en prod, pretty en dev)       | Apache-2/MIT  |
| Tests                    | **pytest** + **pytest-asyncio** + **hypothesis**  | MIT           |
| Linter / formatter       | **Ruff** (lint + format en un seul outil)         | MIT           |
| Type checker             | **mypy strict**                                    | MIT           |
| Dependency management    | **uv** (pip-compatible, ultra-rapide)             | Apache-2/MIT  |

**Justifications notables :**

- **FastAPI plutôt que Flask / Django** : (a) OpenAPI auto-généré (NFR-009 indirect : un contributeur peut générer un client TS depuis le schéma), (b) Pydantic intégré → validation déclarative et erreurs structurées gratuites, (c) async natif si on en a besoin pour les conversions longues, (d) doc interactive Swagger gratuite pour les développeurs.
- **uv plutôt que poetry / pip-tools** : 10-100× plus rapide à résoudre et installer, hash-locking strict, drop-in pip-compatible. Solo dev = chaque seconde gagnée en CI compte.
- **Ruff plutôt que black + flake8 + isort** : un seul outil au lieu de trois, 100× plus rapide. Réduction de la friction contributeur (D7).
- **structlog plutôt que logging stdlib** : JSON structuré en prod = grep-friendly + ingestible par n'importe quel agrégateur si l'utilisateur en met un. Pretty en dev pour la lisibilité humaine.
- **OPSIN en V1 uniquement** : OPSIN nécessite une JRE, qui ajoute ~100 MB à l'image Docker backend. On ne paye ce coût qu'à partir de la V1 où FR-040 et FR-041 deviennent des MUST. L'image MVP reste lean (~200 MB total avec RDKit).

### 4.3 Persistance & données

| Élément                  | Choix                                       | Notes                                                        |
|--------------------------|---------------------------------------------|--------------------------------------------------------------|
| Persistance frontend     | **IndexedDB via Dexie 4.x**                 | Documents, onglets, historique d'undo, templates utilisateur, paramètres |
| Format d'échange interne | **JSON `.kdx`** (Kendraw eXchange)          | Sérialisation canonique du modèle de scène                  |
| Format public principal  | **MOL v2000 + SDF + SMILES + InChI**        | Round-trip MVP                                               |
| Format public V1         | **CDXML, CML, RXN**                         | Round-trip via backend                                       |
| Format export            | **PNG, SVG (MVP), PDF, EPS (V1)**           | Pipeline `renderer-svg` + post-processing                    |
| Backend                  | **Stateless** — aucune base                 | Voir §6.4 pour la justification                              |
| (V1+ optionnel)          | **SQLite** pour templates partagés institutionnels | Optionnel, désactivé par défaut, monté en volume Docker       |

### 4.4 Infrastructure & déploiement

| Élément                  | Choix                                           | Notes                                                              |
|--------------------------|-------------------------------------------------|--------------------------------------------------------------------|
| Conteneurisation         | **Docker** (deux images : frontend nginx + backend uvicorn) | Image backend basée sur `python:3.11-slim`                         |
| Orchestration            | **docker-compose** (un seul `docker-compose.yml`) | Pas de Kubernetes. Pas de Swarm. Une commande, deux services.      |
| Reverse proxy / TLS      | **À la charge de l'utilisateur** (Caddy / nginx / Traefik) | Documentation fournie, mais non bundlée                            |
| Cible cloud              | **Aucune obligatoire**                          | Tournera sur n'importe quel laptop, NUC, VM, Raspberry Pi 4/5      |
| Démo publique            | **GitHub Pages** (frontend statique uniquement) | Profil de build `static-demo`, déployé via GitHub Actions          |
| Monitoring               | **Optionnel** — `/health` exposé par le backend, l'utilisateur branche ce qu'il veut | Pas de Datadog, pas de Prometheus bundlé                           |
| Logging                  | **stdout structuré** (JSON via structlog)       | L'utilisateur récupère via `docker logs` ou son agrégateur de choix |

**Pas de Kubernetes, pas de cloud provider, pas d'IaC (Terraform/Pulumi).** C'est délibéré : l'utilisateur cible (PhD chimiste) doit pouvoir lancer Kendraw sans rien savoir de tout ça.

### 4.5 Services tiers

**Aucun service tiers obligatoire.** C'est non-négociable (D2, NFR-004, NFR-008).

**Services tiers utilisés par le projet (pas par l'instance utilisateur) :**

| Service         | Usage                                                | Obligatoire pour l'utilisateur ?     |
|-----------------|------------------------------------------------------|---------------------------------------|
| GitHub          | Hébergement code, issues, PRs, Actions CI            | Non — fork possible, mirror possible  |
| GitHub Pages    | Démo statique frontend-only                          | Non — usage demo seulement            |
| GitHub Actions  | CI (lint, tests, build, license-scan, release)      | Non — local CI possible via `act`     |
| Zenodo          | DOI minting pour les releases (citation académique) | Non — feature optionnelle             |
| Docker Hub / GHCR | Distribution des images Docker                     | Non — build local possible            |

### 4.6 Outillage dev & CI/CD

| Élément                  | Choix                                     | Notes                                                              |
|--------------------------|-------------------------------------------|--------------------------------------------------------------------|
| Versionning              | **Git** + **GitHub**                      | Branche `main`, PRs avec review, conventional commits              |
| CI                       | **GitHub Actions**                        | Voir §12.3 pour le pipeline détaillé                               |
| Audit licences (FR)      | **license-checker** (npm)                 | Bloque les merges introduisant GPL/LGPL/AGPL                       |
| Audit licences (BE)      | **pip-licenses** + **liccheck**           | Idem côté Python                                                   |
| Bundle size guard        | **size-limit** (frontend)                 | Bundle initial < 350 KB gzip (hors WASM RDKit.js)                  |
| Sécurité dépendances     | **Dependabot** + **npm audit** + **pip-audit** | Alertes hebdomadaires                                              |
| Couverture de tests      | **vitest --coverage** + **pytest --cov**  | Cible ≥ 80 % sur les chemins compute (NFR-009)                     |
| Visual regression        | **Playwright snapshots**                  | Sur les exports SVG/PNG critiques                                  |
| Performance benchmarks   | **vitest bench** + suite POC #1 codifiée | Run manuel + sur tag release                                       |

---

## 5. Composants système

L'architecture est organisée en **packages indépendants aux frontières strictes**, avec dépendances unidirectionnelles. Aucun package "haut niveau" (UI) n'est importé par un package "bas niveau" (scene, chem). Cette discipline est ce qui rend la codebase appropriable (D7).

### 5.1 Composants frontend (8 packages)

#### 5.1.1 Composant : `@kendraw/scene`

**Rôle :** Modèle de scène immuable, command bus, undo/redo, validateurs, spatial index, sérialisation native `.kdx`.

**Responsabilités :**
- Représenter l'état d'un document (Document → Pages → Atoms / Bonds / Arrows / Annotations / Groups).
- Appliquer les commandes utilisateur via Immer (structural sharing).
- Maintenir l'historique d'undo/redo par document avec command merging (ex. : drag continu = un seul `MoveSelection` mergé).
- Valider en temps réel les contraintes chimiques (valence, stéréo) et émettre des warnings non-bloquants (FR-007).
- Maintenir un spatial index R-tree pour le hit-testing en O(log n) (essentiel pour D1 à 500 atomes).
- Sérialiser/désérialiser le format natif `.kdx` (JSON canonique).

**Interfaces exposées :**
```ts
interface SceneStore {
  getState(): Document;
  subscribe(listener: (doc: Document, diff: SceneDiff) => void): Unsubscribe;
  dispatch(command: Command): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  hitTest(x: number, y: number, radius?: number): HitResult | null;
  serialize(): string;          // → .kdx JSON
  deserialize(kdx: string): void;
}

interface Renderer {
  attach(container: HTMLElement): void;
  detach(): void;
  render(doc: Document, diff?: SceneDiff): void;
}

interface ChemAdapter {
  parseSmiles(smiles: string): Document | ChemError;
  toSmiles(doc: Document): string;
  toCanonicalSmiles(smiles: string): string;
  toInChI(doc: Document): string;
  computeValenceWarnings(doc: Document): ValenceWarning[];
}
```

**Dépendances :** **aucune** (pure TS, framework-agnostic, no React, no DOM).
- Externes : `immer`, `rbush` (R-tree).

**FRs adressées :** FR-001, FR-002, FR-003, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-016, FR-030, FR-031, FR-033 (partiel), FR-034.

---

#### 5.1.2 Composant : `@kendraw/chem`

**Rôle :** Adapter chimie frontend — implémente l'interface `ChemAdapter` au-dessus de RDKit.js (build full) ou OpenChemLib JS (build static-demo).

**Responsabilités :**
- Charger le module WASM RDKit.js paresseusement au démarrage (Web Worker pour ne pas bloquer le main thread).
- Exposer les opérations FR-018 (parsing SMILES, rendu indirect via conversion vers le scene model).
- Fournir les calculs de propriétés du panneau temps réel (formula, MW, canonical SMILES) sans aller-retour réseau (FR-015).
- Calculer les warnings de valence (FR-007).
- Détecter le profil de build à compile-time via constante Vite `import.meta.env.KENDRAW_BUILD_PROFILE`.

**Interfaces exposées :** `ChemAdapter` (cf. ci-dessus).

**Dépendances :** `@kendraw/scene` (pour types Document/Atom/Bond).
- Externes : `@rdkit/rdkit` (build full) **ou** `openchemlib` (build static-demo).

**FRs adressées :** FR-007, FR-015 (partiel), FR-018.

**Note POC #2 :** la décision finale RDKit.js vs OpenChemLib pour le build full est gated par POC #2 (cf. §15). Critères d'acceptation : bundle < 6 MB compressé, parsing SMILES < 200 ms pour ≤ 100 atomes, premier rendu interactif < 2 s sur connexion 4G simulée.

---

#### 5.1.3 Composant : `@kendraw/renderer-canvas`

**Rôle :** Moteur de rendu Canvas 2D pour l'écran. Implémente l'interface `Renderer`.

**Responsabilités :**
- Peindre la scène sur un `<canvas>` HTML5 via `CanvasRenderingContext2D`.
- Rendu en couches : grille → liaisons → atomes → flèches → annotations → overlays interactifs (sélection, poignées Bézier).
- Diff-driven repaint : sur réception d'un `SceneDiff`, recalculer les "dirty regions" et ne redessiner que celles-ci. Plein repaint uniquement sur zoom/pan.
- Gérer le device pixel ratio pour un rendu HiDPI net.
- Exposer un mode debug (cycles de frame, FPS, dirty regions visibles) en dev only.

**Architecture interne :**
- `RenderPipeline` orchestre les couches.
- `LayerCache` mémoïse le rendu de chaque couche (invalidation par diff).
- `DirtyRegionTracker` calcule les bbox impactées par un diff.

**Dépendances :** `@kendraw/scene`. **Aucune dépendance React.**

**FRs adressées :** FR-001, FR-014 (partiel — animations 60 fps), NFR-001 (driver D1).

---

#### 5.1.4 Composant : `@kendraw/renderer-svg`

**Rôle :** Moteur de rendu SVG pour l'export. Distinct du renderer écran.

**Responsabilités :**
- Générer un document SVG propre, sans nœud DOM intermédiaire (string-based builder), à partir du modèle de scène.
- Embarquer les polices nécessaires en `<defs>` (subset Inter / IBM Plex via fonttools côté CI).
- Injecter les métadonnées de citation (FR-027) en `<metadata>` et en commentaire HTML.
- Produire un SVG ouvrable proprement dans Adobe Illustrator et Inkscape (testé en CI sur cas de référence).
- Pipeline d'export PNG : SVG → `Image()` HTML → Canvas → `toBlob('image/png')` à DPI configurable (≥ 300 DPI).
- Pipeline d'export PDF/EPS (V1) : SVG → conversion via `pdf-lib` (MIT) ou délégation au backend si nécessaire.

**Dépendances :** `@kendraw/scene`. Externes : `pdf-lib` (V1).

**FRs adressées :** FR-024, FR-025, FR-027, FR-045 (V1).

**Pourquoi un renderer séparé du Canvas :** parce que les contraintes sont opposées. Le renderer Canvas optimise pour la latence (≤ 16 ms par frame) ; le renderer SVG optimise pour la qualité (lisibilité dans Illustrator, polices vectorielles, géométrie propre, métadonnées). Tenter de produire du SVG depuis Canvas est une voie sans issue — c'est un retour d'expérience documenté de tous les outils de dessin sérieux (Figma, Sketch, Penpot ont tous deux pipelines).

---

#### 5.1.5 Composant : `@kendraw/persistence`

**Rôle :** Couche de persistance locale (IndexedDB).

**Responsabilités :**
- Exposer `PersistenceStore` (interface) avec une implémentation `DexieStore`.
- Gérer trois "tables" Dexie : `documents`, `tabs`, `templates`, `settings`.
- Auto-save scheduler : reçoit les événements `scene-changed`, debounce 5 s (NFR-010), écrit dans un Web Worker dédié pour ne jamais bloquer le main thread.
- Restore-on-reload : au démarrage, hydrate l'état Zustand (tabs ouverts, document actif, page active) depuis IndexedDB.
- Surfacer les erreurs de quota (`QuotaExceededError`) avec un message utilisateur actionnable.

**Interfaces :**
```ts
interface PersistenceStore {
  saveDocument(id: string, doc: Document): Promise<void>;
  loadDocument(id: string): Promise<Document | null>;
  listDocuments(): Promise<DocumentMeta[]>;
  deleteDocument(id: string): Promise<void>;
  getSession(): Promise<SessionState>;
  setSession(state: SessionState): Promise<void>;
  // … templates, settings
}
```

**Dépendances :** `@kendraw/scene` (types Document). Externes : `dexie`.

**FRs adressées :** FR-016, FR-017, FR-037 (V1), NFR-010.

---

#### 5.1.6 Composant : `@kendraw/io`

**Rôle :** Lecteurs/écrivains de formats de fichiers.

**Responsabilités :**
- Parser et écrire MOL v2000 (frontend pur, FR-022/FR-023).
- Parser SDF multi-structures et exposer pages multiples (résolution Q#5 du PRD : multi-pages dans un onglet).
- Parser SMILES (délégué à `@kendraw/chem` mais converti en commandes scène par cette couche).
- (V1) Parser CDXML (frontend pur si possible, sinon délégation backend via `@kendraw/api-client`).
- (V1) CML, RXN.
- Détection de type par extension + sniffing magic bytes.
- Imports drag-and-drop traités ici (FR-020).

**Dépendances :** `@kendraw/scene`, `@kendraw/chem` (pour SMILES), `@kendraw/api-client` (pour formats backend-only).

**FRs adressées :** FR-020, FR-022, FR-023, FR-043 (V1), FR-044 (V1).

**Note POC #3 :** la décision frontend-pur vs backend-délégué pour CDXML est gated par POC #3. Le format CDXML est binaire-déguisé-en-XML, complexe, et son parsing complet en TS est un projet en soi. La voie pragmatique est probablement : **parser frontend pour le sous-ensemble courant (≥ 95 % du corpus URD Abbaye), délégation backend (RDKit `MolFromMolBlock` après conversion intermédiaire) pour les cas exotiques**.

---

#### 5.1.7 Composant : `@kendraw/api-client`

**Rôle :** Client HTTP pour le backend FastAPI.

**Responsabilités :**
- Client OpenAPI auto-généré depuis le schéma exposé par FastAPI (génération en CI via `openapi-typescript-codegen`).
- Wrapping minimal pour : timeout configurable, retry exponentiel (3 tentatives sur erreur 5xx), normalisation des erreurs en `ChemApiError`.
- Hook `useBackendAvailability()` qui ping `/health` au démarrage et expose un Boolean réactif (TanStack Query).
- En profil de build `static-demo` : compilé en stub no-op qui retourne un statut "feature requires backend" pour tous les appels.

**Dépendances :** Externes : `tanstack-query`. **Aucune dépendance** sur `@kendraw/scene` (types passés en paramètres).

**FRs adressées :** transversal — supporte FR-021, FR-022, FR-032, FR-038-042, FR-043-045.

---

#### 5.1.8 Composant : `@kendraw/ui`

**Rôle :** Application React 18 — c'est ici que vivent JSX, hooks, Zustand UI store, et le design system Glasswerk.

**Responsabilités :**
- Composer la shell UI : top bar, tab bar, tool palette, canvas mount, property panel, status bar (cf. UX doc Part 5 — 11 composants).
- Implémenter les 22 surfaces UX décrites dans le UX doc.
- Tool controllers : convertir les événements pointer/clavier en commandes scène (`AddAtom`, `MoveSelection`, etc.). Un controller par outil (Pen, Eraser, Select, Lasso, Bond, Ring, Arrow, CurlyArrow, Text, Pan, Zoom).
- Glasswerk design system : tokens CSS variables (depuis UX doc Part 6), composants atomiques (Button, Panel, Tooltip, Modal, Tabs).
- i18n via Lingui — toutes les chaînes utilisateur sont des `<Trans>` ou `t\`…\``.
- Gestion du cycle de vie : montage des renderers, attach/detach, hot-reload-friendly.
- Branchement de l'auto-save scheduler.
- Cheatsheet shortcuts (FR-019, déclenché par `?`).

**Dépendances :** **tous** les packages précédents. C'est le seul package qui dépend de tout le reste.
- Externes : `react`, `react-dom`, `react-router-dom`, `zustand`, `tanstack-query`, `framer-motion` (lazy), `@lingui/react`, `@lingui/core`.

**FRs adressées :** FR-014, FR-015 (UI), FR-016 (tab bar), FR-019, FR-026, FR-046 (V1), FR-047 (V1), FR-048 (V1), FR-049 (V1), + transversal pour toutes les FRs côté UI.

**Règle de dépendance — invariant à respecter en CI :**
```
@kendraw/scene       → ∅
@kendraw/chem        → scene
@kendraw/renderer-*  → scene
@kendraw/persistence → scene
@kendraw/io          → scene, chem, api-client
@kendraw/api-client  → ∅
@kendraw/ui          → tout le reste
```
Vérifié par `dependency-cruiser` en CI. Toute violation casse le build.

### 5.2 Composants backend (4 modules)

#### 5.2.1 Module : `kendraw_api`

**Rôle :** Couche FastAPI — routers, schemas Pydantic, OpenAPI auto-généré.

**Responsabilités :**
- Définir les endpoints REST (cf. §7).
- Valider entrées/sorties via Pydantic v2 strict mode.
- Exposer `/openapi.json` pour la génération du client TS.
- Exposer `/health` (liveness) et `/version` (commit + version).
- CORS configurable via env (`KENDRAW_CORS_ORIGINS`).
- Logging structuré (structlog) sur chaque requête.

**Dépendances internes :** `kendraw_chem`.

**FRs adressées :** FR-021 (transverse), FR-022.

---

#### 5.2.2 Module : `kendraw_chem`

**Rôle :** Services métier RDKit. Pure logique chimie, pas de FastAPI.

**Sous-modules :**

**`ComputeService`** — calculs de propriétés.
- `compute_properties(mol: str, format: str) → Properties`
- `compute_descriptors(mol: str) → DescriptorSet` (V1, FR-038, FR-039)
- `compute_lipinski(mol: str) → LipinskiResult` (V1, FR-038)
- `compute_elemental_analysis(mol: str) → ElementalAnalysis` (V1, FR-042)

**`ConvertService`** — conversions de format.
- `convert(input: str, from: Format, to: Format) → ConversionResult`
- Supporte : MOL ↔ SDF ↔ SMILES ↔ InChI (MVP), + CDXML, CML, RXN (V1).

**`NamingService`** (V1) — IUPAC ↔ structure.
- `iupac_to_structure(name: str) → str (MOL)` via OPSIN
- `structure_to_iupac(mol: str) → str` via RDKit `MolToInchi` + post-processing (ou STOUT si POC #4 valide)

**`StereoService`** (V1) — R/S et E/Z.
- `assign_stereo(mol: str) → StereoAssignment`

**Dépendances :** RDKit Python, OPSIN (V1, via `py2opsin`).

**FRs adressées :** FR-021, FR-022, FR-032 (V1), FR-038–042 (V1), FR-043 (V1).

---

#### 5.2.3 Module : `kendraw_settings`

**Rôle :** Configuration Pydantic Settings, env-driven.

**Responsabilités :**
- Charger `KENDRAW_*` env vars avec defaults sensés pour self-hosted.
- Variables principales : `KENDRAW_HOST`, `KENDRAW_PORT`, `KENDRAW_CORS_ORIGINS`, `KENDRAW_LOG_LEVEL`, `KENDRAW_MAX_MOL_ATOMS` (cap anti-DOS), `KENDRAW_API_KEY` (optionnel V1).
- Aucune fuite de chemin local dans les logs ou les erreurs API.

**Dépendances :** Pydantic Settings.

---

#### 5.2.4 Module : `kendraw_observability` (minimal)

**Rôle :** Logging, métriques optionnelles, health checks.

**Responsabilités :**
- Configurer structlog (JSON en prod, pretty en dev).
- Exposer `/health` (liveness) et `/ready` (readiness — vérifie que RDKit s'importe correctement).
- (Optionnel V1+) Exposer `/metrics` au format Prometheus si `KENDRAW_METRICS_ENABLED=1`.

**Pas de tracing distribué, pas d'APM, pas de Sentry par défaut.** Rien n'appelle l'extérieur sans opt-in explicite (NFR-008).

---

## 6. Architecture des données

### 6.1 Modèle de scène (in-memory)

Le modèle de scène est une **structure de données immuable** (Immer-managed) qui représente l'état complet d'un document Kendraw.

```ts
type Document = {
  id: string;                          // UUID v4
  schemaVersion: number;               // pour migrations futures
  metadata: DocumentMetadata;
  pages: Page[];                       // ≥ 1 page (multi pour SDF)
  activePageIndex: number;
};

type DocumentMetadata = {
  title: string;
  createdAt: string;                   // ISO 8601
  modifiedAt: string;                  // ISO 8601
  authorHint?: string;                 // optionnel, pas de tracking
  appVersion: string;                  // pour debug
};

type Page = {
  id: string;
  atoms: Record<AtomId, Atom>;
  bonds: Record<BondId, Bond>;
  arrows: Record<ArrowId, Arrow>;
  annotations: Record<AnnotationId, Annotation>;
  groups: Record<GroupId, Group>;
  viewport: Viewport;
};

type Atom = {
  id: AtomId;
  x: number;                           // coords scène (unités arbitraires, 1 unit = ~1 Å à l'export par défaut)
  y: number;
  element: number;                     // numéro atomique Z (1..118)
  label?: string;                      // ex. "R", "R1", "Et" (si custom)
  charge: number;                      // -4..+4
  radicalCount: 0 | 1 | 2;
  lonePairs: number;                   // V1, FR-031
  isotope?: number;
  stereoParity?: 'CW' | 'CCW' | 'unspecified';
};

type Bond = {
  id: BondId;
  fromAtomId: AtomId;
  toAtomId: AtomId;
  order: 1 | 2 | 3 | 1.5;              // 1.5 = aromatique
  style: 'single' | 'double' | 'triple' | 'aromatic'
       | 'wedge' | 'dash' | 'wavy'     // wavy V1
       | 'dative' | 'bold';            // V1
  stereo?: 'E' | 'Z' | 'unspecified';
};

type Arrow = {
  id: ArrowId;
  type: 'forward' | 'equilibrium' | 'reversible'
      | 'resonance'                    // V1
      | 'curly-radical' | 'curly-pair';
  geometry: BezierGeometry;            // 4 points
  startAnchor: ArrowAnchor;
  endAnchor: ArrowAnchor;
  annotations?: { above?: AnnotationId; below?: AnnotationId };
};

type BezierGeometry = {
  start: Point;
  c1: Point;                           // control point 1
  c2: Point;                           // control point 2
  end: Point;
};

type ArrowAnchor =
  | { kind: 'free' }
  | { kind: 'atom'; refId: AtomId }
  | { kind: 'bond'; refId: BondId; t?: number }      // t ∈ [0, 1] le long de la liaison
  | { kind: 'lone-pair'; refId: AtomId; index: number };

type Annotation = {
  id: AnnotationId;
  x: number;
  y: number;
  richText: RichTextNode[];            // pour sub/super/Greek
  anchorRef?: { kind: 'arrow'; refId: ArrowId; slot: 'above' | 'below' };
};

type Group = {
  id: GroupId;
  atomIds: AtomId[];
  bondIds: BondId[];
  locked: boolean;                     // V1, FR-033
  name?: string;
};

type Viewport = { x: number; y: number; zoom: number };
```

**Notes de conception :**

- Utilisation de `Record<Id, Entity>` plutôt que `Entity[]` → lookups O(1), diffs plus simples, indexation triviale.
- Toutes les entités ont une `id` stable. Les IDs sont des UUID v4 pour éviter collisions sur copy-paste cross-document.
- La géométrie Bézier des flèches incurvées est imposée par la résolution Q#3 du UX doc : 4 points (start + 2 control + end) + un anchor descriptor par extrémité. C'est ce qui permet de re-anchorer une flèche sans perdre sa courbure.
- `schemaVersion` permet des migrations futures sans casser les anciens documents.
- Aucune référence à React, aucune référence au DOM. Pure data.

### 6.2 Format natif `.kdx`

Le format natif `.kdx` est la sérialisation JSON canonique du `Document`, avec quelques règles :

- Encoding UTF-8, indenté à 2 espaces (lisible humain pour debug, diff Git-friendly).
- Clés triées alphabétiquement (canonique → diffs déterministes).
- `schemaVersion` au top niveau pour la migration.
- Header magique optionnel en commentaire JSON5 pour les outils externes ? **Non** — JSON pur, on reste compatible.
- Extension `.kdx` (Kendraw eXchange).

**Pourquoi un format natif plutôt que MOL/CDXML directement :**
- MOL ne supporte pas les flèches, annotations, groupes, multi-pages, viewports.
- CDXML est binaire-déguisé-en-XML, complexe, et propriétaire de fait.
- `.kdx` est un format interne — l'utilisateur exporte vers MOL/SDF/CDXML pour l'interop, mais sauve son travail en `.kdx` localement (auto-save) ou explicitement.

### 6.3 Schéma IndexedDB (Dexie)

```ts
// schema version 1
db.version(1).stores({
  documents: 'id, modifiedAt, *tags',           // id PK, modifiedAt index
  tabs:      'id, order',                        // id PK, order pour tri
  templates: 'id, &name, category',              // name unique
  settings:  '&key',                             // key/value store
});
```

**Tables :**

- **`documents`** : un enregistrement par document Kendraw (auto-save + sauvegardes explicites). Contient le `Document` sérialisé en JSON. Index sur `modifiedAt` pour les listes triées.
- **`tabs`** : la session active — quels onglets sont ouverts, dans quel ordre, lequel est actif, quel page index est active dans chaque tab. Reconstruit la session au reload (FR-017).
- **`templates`** : templates personnalisés (FR-037 V1) + templates intégrés indexés au premier lancement.
- **`settings`** : key/value pour theme, shortcuts personnalisés, palette config, locale, etc.

**Stratégie de quota :**
- Surveillance via `navigator.storage.estimate()` au démarrage et après chaque save.
- Si > 80 % du quota : prompt utilisateur "Voulez-vous nettoyer les anciens documents auto-sauvés ?".
- Si `QuotaExceededError` à l'écriture : toast d'erreur actionnable + persistance en mémoire seule en mode dégradé jusqu'à libération.

### 6.4 Backend stateless — pourquoi pas de DB

Le backend Kendraw est **délibérément stateless**. Aucune base SQL au MVP. Justification :

- **Pas de comptes utilisateur** → pas de table users.
- **Pas de sharing de documents** → pas de table documents serveur.
- **Pas de telemetry** → pas de table d'événements.
- **Toute la persistance utilisateur vit dans IndexedDB côté navigateur** (D2, NFR-008).
- Backend = transformeur pur input → output. Idempotent. Cacheable trivialement par n'importe quel reverse proxy si nécessaire.

**Conséquence opérationnelle :** déployer Kendraw ne nécessite **aucune migration de schéma**, **aucune sauvegarde DB**, **aucune restauration**. Le backend est jetable et redémarrable à volonté. C'est un choix de simplicité radicale qui sert directement D2 et la promesse "lance en une commande".

**Réserve V1+ optionnelle :** si une institution (ex. URD Abbaye) souhaite partager des **templates de molécules** entre tous les chercheurs de leur instance, on pourra introduire **une seule table SQLite optionnelle** (`shared_templates`), montée en volume Docker, désactivée par défaut. Activée via `KENDRAW_SHARED_TEMPLATES_ENABLED=1`. C'est le **seul** scénario où l'on touche à une DB serveur, et c'est hors MVP.

### 6.5 Flux de données — vues complémentaires

**Cas : ouverture d'un fichier `.mol` par drag-and-drop**

```
File drop → @kendraw/io.parseMol(text) → Document partial (atoms+bonds)
  → @kendraw/scene.deserialize() → SceneStore.dispatch(InitDocument)
  → renderer-canvas reçoit le diff initial → repaint complet
  → @kendraw/persistence enregistre le nouveau Document
  → @kendraw/ui crée un nouveau Tab et l'active
```

**Cas : calcul d'un descripteur V1 (LogP)**

```
User clique "Calculer LogP" dans le panneau de propriétés
  → @kendraw/ui appelle useQuery(['logp', smiles], () => apiClient.computeDescriptors(smiles))
  → TanStack Query check cache, si miss → POST /api/v1/compute/descriptors
  → Backend kendraw_chem.ComputeService.compute_descriptors(mol)
  → RDKit calcule, retourne JSON
  → TanStack Query cache la réponse, panneau affiche
```

Cache TanStack Query : clé `['descriptors', canonicalSmiles]`, stale-time 5 min, gc-time 30 min. Évite de recalculer pour la même molécule pendant l'édition.

**Cas : auto-save**

```
SceneStore émet scene-changed
  → @kendraw/persistence.AutoSaveScheduler.markDirty(documentId)
  → debounce 5 s (NFR-010)
  → au tick, postMessage vers Web Worker (PersistenceWorker)
  → worker sérialise + écrit dans IndexedDB
  → worker postMessage 'saved' vers main thread
  → @kendraw/ui met à jour l'indicateur "saved" du tab
```

---

## 7. Conception API

### 7.1 Principes

- **REST JSON** sur HTTP/1.1 ou HTTP/2.
- **OpenAPI 3.1** auto-généré par FastAPI, exposé sur `/openapi.json` et `/docs` (Swagger UI).
- **Versioning par URL** : `/api/v1/*`. Une rupture incompatible donnera `/api/v2/*` cohabitant.
- **Idempotence** : tous les endpoints sont des transformations pures input → output. Même payload → même réponse. Cacheable par reverse proxy trivial.
- **Errors** : enveloppe JSON simple :
  ```json
  {
    "error": {
      "code": "INVALID_MOL",
      "message": "Could not parse MOL block: line 12 unexpected token",
      "details": { "line": 12, "token": "X" }
    }
  }
  ```
  Pas de RFC 7807 — overkill pour un solo dev. L'enveloppe est documentée dans `CONTRIBUTING.md`.
- **Status codes** : 200 OK, 400 Bad Request (input invalide), 413 Payload Too Large (cap atomes), 422 Unprocessable Entity (validation Pydantic), 500 Internal Server Error (bug RDKit), 503 Service Unavailable (OPSIN sidecar down).
- **Cap anti-DOS** : `KENDRAW_MAX_MOL_ATOMS` (défaut 5000). Au-delà → 413.
- **No streaming** : tous les payloads sont des JSON bornés. Pas de SSE, pas de WebSocket. (Pas besoin pour les flux MVP/V1.)

### 7.2 Endpoints MVP (`v0.1.0`)

| Méthode | Path                            | Body                                  | Réponse                                              | FR        |
|---------|---------------------------------|---------------------------------------|------------------------------------------------------|-----------|
| GET     | `/api/v1/health`                | —                                     | `{ "status": "ok" }`                                 | n/a       |
| GET     | `/api/v1/version`               | —                                     | `{ "version": "0.1.0", "commit": "abc123" }`        | n/a       |
| POST    | `/api/v1/compute/properties`    | `{ "input": str, "format": Format }`  | `{ "formula": str, "mw": float, "exact_mass": float, "canonical_smiles": str, "inchi": str, "inchi_key": str }` | FR-021    |
| POST    | `/api/v1/convert`               | `{ "input": str, "from": Format, "to": Format }` | `{ "output": str, "warnings": str[] }`              | FR-022    |
| POST    | `/api/v1/validate`              | `{ "input": str, "format": Format }`  | `{ "valid": bool, "warnings": ValidationWarning[] }` | FR-007 (assist) |

`Format` ∈ `{ "mol", "sdf", "smiles", "inchi" }` au MVP.

### 7.3 Endpoints V1 (`v1.0.0`)

| Méthode | Path                                 | Body                                | Réponse                                     | FR     |
|---------|--------------------------------------|-------------------------------------|---------------------------------------------|--------|
| POST    | `/api/v1/compute/descriptors`        | `{ "input": str, "format": Format }` | `{ "descriptors": Record<str, float> }` (≥30) | FR-039 |
| POST    | `/api/v1/compute/lipinski`           | `{ "input": str, "format": Format }` | `{ "logp": float, "tpsa": float, "hbd": int, "hba": int, "mw": float, "violations": int, "passes": bool }` | FR-038 |
| POST    | `/api/v1/compute/stereo`             | `{ "input": str, "format": Format }` | `{ "atoms": [{ id, parity }], "bonds": [{ id, geometry }] }` | FR-032 |
| POST    | `/api/v1/compute/elemental-analysis` | `{ "input": str, "format": Format }` | `{ "by_element": Record<str, float>, "total": float }` | FR-042 |
| POST    | `/api/v1/naming/iupac-to-structure`  | `{ "name": str }`                    | `{ "mol": str (MOL block), "smiles": str }` | FR-040 |
| POST    | `/api/v1/naming/structure-to-iupac`  | `{ "input": str, "format": Format }` | `{ "name": str }`                          | FR-041 |

`Format` étend en V1 à : `{ ..., "cdxml", "cml", "rxn" }`.

### 7.4 Authentification & autorisation

**MVP : aucune.** Le backend est local, single-user (ou single-lab), self-hosted. Ajouter de l'auth est une régression UX et une dette de sécurité (chaque feature d'auth est une surface d'attaque).

**V1+ optionnel :** `KENDRAW_API_KEY` env var. Si défini, le backend exige le header `X-Kendraw-Token: <key>` sur tous les endpoints sauf `/health`. Sinon, accès libre. C'est juste un garde-fou pour les labs qui mettent leur instance derrière un reverse proxy public et veulent un cran de protection au-delà du firewall.

**Pas d'OAuth, pas de JWT, pas de session, pas de cookie.** Statelessness intégrale. Si un lab veut une vraie auth, ils mettent leur reverse proxy avec basic-auth ou OIDC devant — et la doc l'explique.

---

## 8. Couverture des Exigences Non-Fonctionnelles

Chaque NFR du PRD est mappée à une solution architecturale concrète, avec critères de validation.

### NFR-001 : Performance — Fluidité Édition jusqu'à 500 Atomes

**Exigence (PRD verbatim) :** Frame budget < 16 ms ; pan/zoom ≥ 30 fps sur molécule 500 atomes (laptop i5/M1 baseline) ; property panel update < 500 ms à 500 atomes ; benchmarks codifiés à 100/250/500/750 atomes.

**Solution architecturale :**

1. **Modèle de scène immuable + diff incrémental** (`@kendraw/scene` + Immer) → React/renderer ne re-render que ce qui change.
2. **Rendu Canvas 2D natif** (`@kendraw/renderer-canvas`) avec :
   - Diff-driven repaint (dirty regions seulement).
   - Layer cache par couche (background, structure, overlays).
   - Viewport culling : on ne dessine que ce qui est visible.
   - Device pixel ratio pris en compte.
3. **Spatial index R-tree** (`rbush`) pour le hit-testing en O(log n) plutôt que O(n).
4. **Web workers** pour : auto-save (sérialisation hors UI thread), parsing SMILES initial (RDKit.js WASM dans un worker dédié), calculs RDKit.js lourds.
5. **Zéro round-trip réseau** dans la boucle d'édition steady-state. Le backend n'est jamais sollicité par l'édition elle-même — uniquement par les actions explicites de l'utilisateur (export CDXML, calcul descripteurs V1, etc.).
6. **Couche d'abstraction `Renderer`** : si POC #1 montre qu'on touche un mur > 500 atomes, basculer vers WebGL/Pixi.js sans toucher à `@kendraw/scene` ni `@kendraw/ui`.
7. **Bundle JS initial < 350 KB gzip** (hors WASM RDKit.js, lazy-loaded). Cible vérifiée par `size-limit` en CI.

**Notes d'implémentation :**
- Désactiver `React.StrictMode` sur le composant `<CanvasMount>` (le double-rendering de StrictMode tue les diffs incrémentaux). StrictMode reste actif sur le reste de l'arbre.
- Utiliser `requestAnimationFrame` pour batcher les writes Canvas.
- Profiling continu : un mode debug en dev affiche FPS, frame budget, dirty regions visibles.

**Validation :**
- **POC #1 — bloquant.** Suite de benchmarks codifiée sous `packages/scene/bench/perf-500.bench.ts` :
  - Bench 1 : pan/zoom à 100/250/500/750 atomes, mesure FPS soutenu sur 5 s.
  - Bench 2 : ajout de 100 liaisons consécutives, mesure du frame budget moyen.
  - Bench 3 : sélection rectangle sur l'ensemble de la molécule, mesure latence.
  - Critère de succès : à 500 atomes, ≥ 30 fps soutenu, frame budget moyen < 16 ms, latence sélection < 50 ms.
- Le POC #1 doit passer **avant** toute écriture de code applicatif. Si échec : revoir le substrat de rendu (Canvas → WebGL), re-tester.

---

### NFR-002 : Compatibilité Navigateurs

**Exigence :** Chrome / Firefox / Safari / Edge — deux dernières versions stables.

**Solution architecturale :**
- **Vite + esbuild** : ciblage `es2022` (supporté sur toutes les versions cibles).
- **Pas de polyfills agressifs** : on cible les navigateurs modernes, point.
- **Matrice CI Playwright** : tests E2E lancés sur Chromium, Firefox, WebKit (= Safari) à chaque PR.
- **Pas de feature flags par navigateur** : si une feature ne marche pas sur un navigateur cible, on la corrige avant merge.
- Surveillance des spec-divergences : IndexedDB sur Safari (quota stingy), `OffscreenCanvas` (pas universel — fallback main thread), polices web (subset embedded).

**Validation :**
- Suite Playwright cross-browser exécutée à chaque PR sur GitHub Actions.
- Rapport `playwright-report` archivé en artifact.

---

### NFR-003 : Compatibilité Licence MIT

**Exigence :** Toutes les dépendances doivent être MIT-compatibles. Aucune GPL/LGPL/AGPL.

**Solution architecturale :**
- **CI license-scan obligatoire** :
  - Frontend : `license-checker --onlyAllow 'MIT;BSD-2-Clause;BSD-3-Clause;Apache-2.0;ISC;0BSD;Unlicense;CC0-1.0'`
  - Backend : `liccheck` avec strategy file équivalent.
  - Bloque le merge si une licence interdite apparaît dans l'arbre de dépendances.
- **`LICENSES.md` à la racine du repo** : audit manuel revu à chaque release majeure, liste tous les third-party.
- **Whitelist explicite** : RDKit (BSD-3), OPSIN (Apache-2), Dexie (Apache-2), tous les autres MIT/BSD/ISC.
- **Choix de bibliothèques pré-validé** : chaque ajout de dépendance dans une PR requiert que le contributeur confirme la licence dans la description.

**Validation :**
- CI bloque les merges sur licences interdites.
- `LICENSES.md` audité lors de chaque tag release.

---

### NFR-004 : Architecture Auto-hébergée — Zéro Cloud Obligatoire

**Exigence :** Tourne end-to-end sur une seule machine, sans appel externe obligatoire.

**Solution architecturale :**
- **`docker-compose.yml` unique** orchestre frontend (nginx) + backend (uvicorn). Aucune autre dépendance.
- **Aucun service géré bundlé** : pas de Redis, pas de PostgreSQL, pas de RabbitMQ, pas d'Elastic, rien.
- **Backend stateless** → pas de DB → pas de migration → pas de sauvegarde.
- **Frontend persistance dans IndexedDB** → côté navigateur de l'utilisateur, jamais côté serveur.
- **Mode offline-first** : une fois les images Docker pull, plus aucun appel externe nécessaire. Validé par tests réseau-isolés en CI.
- **Intégrations externes optionnelles** (Zenodo DOI, GitHub releases) : clairement marquées optionnelles, dégradent gracieusement si offline.

**Validation :**
- Test CI : `docker compose up` puis `docker network disconnect` puis suite e2e qui exerce le flow complet (draw → property → export → save → reload). Doit passer en 100 % offline.

---

### NFR-005 : Qualité Vectorielle Publication

**Exigence :** Sortie SVG/PDF/EPS niveau JACS / Angewandte. Géométrie propre, polices vectorielles, ouvre proprement dans Illustrator/Inkscape.

**Solution architecturale :**
- **Renderer SVG dédié** (`@kendraw/renderer-svg`) totalement séparé du renderer écran. C'est non-négociable : un export rasterisé depuis Canvas est inacceptable.
- **Polices embarquées** : sous-ensembles Inter / IBM Plex Sans / IBM Plex Serif générés côté CI avec `fonttools subset`, embarqués en `<defs>` dans chaque export SVG.
- **Géométrie propre** : pas de path inutile, pas de groupes vides, IDs lisibles, attributs minimaux, no inline style si possible.
- **Pipeline de validation** : 5 figures de référence MVP + 5 figures V1 sont rendues à chaque release et comparées par snapshot Playwright + ouverture automatique dans Inkscape headless en CI.
- **Métadonnées de citation injectées en dernier maillon** (FR-027) : `<metadata>` SVG, EXIF PNG, info dictionary PDF.

**Validation :**
- 5 figures de référence "JACS-like" produites et validées par contacts URD Abbaye avant chaque tag release majeur.
- Open dans Illustrator (manuel) + Inkscape (CI headless) sans warning ni rasterisation.

---

### NFR-006 : Accessibilité Baseline (hors canvas)

**Exigence :** Contraste WCAG AA, navigation clavier UI non-canvas, ARIA labels.

**Solution architecturale :**
- **Tokens Glasswerk** (UX Part 6) construits avec contrastes vérifiés WCAG AA en dark et light mode.
- **`axe-core`** intégré à Playwright, run sur toutes les surfaces non-canvas à chaque PR. Bloque sur violations AA.
- **Composants UI** (`@kendraw/ui`) : tous les contrôles interactifs ont un `role`, `aria-label`, et sont focusables. Order de tabulation explicite.
- **Tooltips** : pas de hover-only, toujours déclenchables au clavier (focus + delay).
- **Modales** : focus trap, escape pour fermer, restore focus à la fermeture.
- **Cheatsheet shortcuts** (FR-019) : déclenchable par `?`, et listée intégralement (pas juste affichée — copie-collable, lisible par lecteur d'écran).
- **Canvas explicitement exempté** (NFR-006 et UX doc le précisent) : un éditeur 2D n'est pas accessible aux lecteurs d'écran sans alternative complète, hors scope MVP.

**Validation :**
- `axe-core` en CI sur toutes les routes non-canvas — zéro violation AA tolérée.
- Limitations a11y documentées dans `docs/accessibility.md`.

---

### NFR-007 : Internationalisation

**Exigence :** Code prêt pour traductions communautaires. MVP en anglais.

**Solution architecturale :**
- **Lingui v4** : extraction statique des messages depuis les composants TSX.
- **Locale canonique : `en`**, fichier `locales/en/messages.po`.
- **Composants** : aucune chaîne hardcodée. Tout passe par `<Trans>` ou `t\`…\``.
- **Lint rule** : `eslint-plugin-lingui` détecte les chaînes hardcodées dans les JSX et casse la CI.
- **Lazy loading** : seul le bundle de la locale active est chargé.
- **Pluriels et formatages ICU** supportés nativement.
- **Ajout d'une langue** = écrire un fichier `.po` + l'enregistrer dans `i18n.ts`. Aucune modification de composant.

**Validation :**
- CI lint bloque les chaînes hardcodées.
- Smoke test : ajouter une locale `fr` partielle et vérifier qu'elle se charge.

---

### NFR-008 : Privacy & Pas de Télémétrie par Défaut

**Exigence :** Zéro appel sortant non sollicité. Pas d'analytics, pas de tracking pixel.

**Solution architecturale :**
- **Aucune lib analytics** dans le bundle (Plausible, Matomo, GA, etc. — tous interdits).
- **Aucun script tiers** (Google Fonts → polices auto-hébergées, pas de CDN externe).
- **Aucun appel externe au démarrage** : test CI réseau-isolé qui vérifie qu'aucune requête sortante n'est faite avant action utilisateur.
- **CSP stricte** côté nginx : `connect-src 'self' <backend>; img-src 'self' data: blob:; font-src 'self'; script-src 'self'`.
- **Backend n'appelle rien à l'extérieur** au démarrage ni pendant les requêtes (sauf OPSIN sidecar local en V1).
- **Posture déclarée** : `README.md` section Privacy explicite, plus un badge "no telemetry".

**Validation :**
- Test CI : démarrer Kendraw (frontend + backend), capturer le trafic réseau via Playwright, vérifier zéro requête vers un domaine non-`self` au démarrage.

---

### NFR-009 : Qualité de Code & Maintenabilité

**Exigence :** Code structuré pour contribution OSS, CI complète, première PR < demi-journée.

**Solution architecturale :**
- **Frontières strictes par packages** (cf. §5) avec règles de dépendance vérifiées par `dependency-cruiser` en CI.
- **TypeScript strict** + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. Mypy strict côté backend.
- **CI complète** sur chaque PR :
  - Lint (ESLint, Ruff)
  - Format (Prettier, Ruff)
  - Type check (tsc, mypy)
  - Tests unitaires (Vitest, pytest) avec coverage ≥ 80 % sur les chemins compute
  - Tests E2E (Playwright)
  - License scan (license-checker, liccheck)
  - Build (Vite, Docker)
  - Bundle size guard (size-limit)
  - Dependency cruiser (frontières packages)
- **`CONTRIBUTING.md` détaillé** : setup en 5 commandes, conventions de commit, PR template, code style, où trouver chaque type de logique.
- **Conventional commits** + commitlint en CI.
- **First-PR experience** vérifiée par un contributeur externe dans les 3 mois post-release.
- **Architecture Decision Records (ADR)** sous `docs/adr/` pour les décisions structurantes futures.

**Validation :**
- CI verte requise pour merger.
- Coverage ≥ 80 % bloquant sur les chemins compute (`@kendraw/scene`, `@kendraw/chem`, `kendraw_chem`).
- Premier contributeur externe ouvre une PR mergeable < 4 h après clone.

---

### NFR-010 : Fiabilité — Auto-save Sans Perte

**Exigence :** Worst-case data loss < 5 s. Restore-on-reload one-click.

**Solution architecturale :**
- **`@kendraw/persistence` + Web Worker dédié** : le scheduler debounce 5 s, et au tick écrit dans IndexedDB **via un worker** pour ne jamais bloquer le main thread (et donc ne jamais retarder le frame budget de NFR-001).
- **Write-ahead minimal** : avant d'écraser, écrire le nouveau document dans une "shadow" key, puis swap atomique. Si crash en plein milieu, rollback automatique au démarrage suivant.
- **Restore-on-reload** : au démarrage, le hook `useSessionRestore()` lit `tabs` + `documents` depuis IndexedDB et propose à l'utilisateur "Restore your previous session" en bouton unique.
- **Test crash-resilience** : test automatisé qui interrompt le worker entre deux writes et vérifie que l'état est cohérent au reload.

**Validation :**
- Test automatisé : simulation de crash entre writes → cohérence au reload garantie.
- Mesure : worst-case latence depuis dernière édition jusqu'à durabilité < 5 s + 50 ms (timer + worker latency).

---

### NFR-011 : Robustesse du Mécanisme de Citation

**Exigence :** `CITATION.cff`, README, splash screen (FR-026), EXIF (FR-027), DOI Zenodo dans les 30 j post-release.

**Solution architecturale :**
- **`CITATION.cff` à la racine** validé via `cffconvert` en CI.
- **README section "Cite this work"** au-dessus du fold, copy-pastable BibTeX.
- **Splash screen FR-026** : composant `<CitationSplash>` montré au premier lancement de chaque session, accessible ensuite via `Help → About`.
- **Métadonnées exports FR-027** : injectées par `@kendraw/renderer-svg` dans `<metadata>`, par le pipeline PNG dans EXIF (`tEXt` chunk), et en V1 par le pipeline PDF dans l'info dictionary.
- **Zenodo DOI** : workflow GitHub Actions triggered on tag, pousse l'archive sur Zenodo et récupère le DOI, met à jour `CITATION.cff` automatiquement.

**Validation :**
- CI valide `CITATION.cff` à chaque PR.
- Test d'export : ouvrir un PNG/SVG exporté, vérifier la présence des métadonnées de citation.

---

### NFR-012 : Documentation Baseline

**Exigence :** README, Getting Started, shortcuts cheatsheet, deployment guide, CONTRIBUTING.md.

**Solution architecturale :**
- **`docs/`** dans le repo, structuré :
  - `getting-started.md`
  - `keyboard-shortcuts.md`
  - `deployment.md`
  - `architecture.md` (ce document)
  - `contributing.md` (ou `CONTRIBUTING.md` à la racine)
  - `accessibility.md`
  - `adr/` (Architecture Decision Records)
- **Site documentation publié** via **mkdocs-material** ou **astro-starlight** (à choisir, ADR à venir) sur GitHub Pages, sous-domaine `/docs/`.
- **Build CI** : la documentation est build à chaque PR, déployée sur push to main.
- **Verification non-author** : un non-auteur valide la doc avant chaque release majeure (NFR-012 acceptance criterion).

**Validation :**
- Tous les fichiers requis présents et liés depuis le README.
- Build doc CI vert.
- Validation utilisateur non-auteur pré-release.

---

## 9. Architecture de Sécurité

**Note préliminaire :** Kendraw est self-hosted, sans comptes utilisateur, sans données personnelles serveur, sans état persistent côté backend. Le modèle de menace est volontairement minimaliste et pragmatique. Les sections "auth", "RBAC", "encryption at rest" du template standard ne s'appliquent pas — ce qui s'applique, c'est :

### 9.1 Authentification

**MVP :** **Aucune.** Le backend est local, accédé par l'utilisateur ou son lab uniquement, derrière son firewall.

**V1+ optionnel :** `KENDRAW_API_KEY` env var. Header `X-Kendraw-Token: <key>` requis sur tous les endpoints sauf `/health` si défini. C'est un garde-fou pour les labs qui exposent leur instance derrière un reverse proxy.

**Pas d'OAuth, pas de JWT, pas de session, pas de cookie.** Si un lab veut une vraie auth, il met un reverse proxy (Caddy avec basic-auth, oauth2-proxy, etc.) — la doc explique comment.

### 9.2 Autorisation

Aucune. Pas de comptes, pas de rôles, pas d'ACL. Tout le monde qui peut joindre l'instance peut tout faire. C'est cohérent avec le modèle "single-user / single-lab self-hosted".

### 9.3 Validation des entrées (input validation)

**Côté backend :**
- **Pydantic v2 strict mode** valide tous les payloads en entrée. Types stricts, longueurs maximales, charsets.
- **Cap atomes** : `KENDRAW_MAX_MOL_ATOMS` (défaut 5000). Au-delà, 413 Payload Too Large. C'est une protection anti-DOS contre un attaquant qui enverrait un MOL de 1M atomes pour faire crash RDKit.
- **Cap payload size** : nginx + uvicorn limitent à 10 MB par requête.
- **Sanitization de strings** : aucune string utilisateur n'est interpolée dans une commande shell, un chemin de fichier, ou une requête SQL (puisqu'il n'y a pas de DB).
- **RDKit safe-parse** : utilisation de `MolFromMolBlock(..., sanitize=True, removeHs=False)` ; les exceptions RDKit sont attrapées et converties en `400 INVALID_MOL`.

**Côté frontend :**
- Tout input utilisateur est traité comme des données, jamais comme du code.
- **Pas de `dangerouslySetInnerHTML`** sauf usage strict et audité (annotations rich-text, sanitisées via DOMPurify).
- **Imports de fichiers** : parsés en sandbox (Web Worker) si format complexe ; erreurs catchées et surfacées sans crasher l'app.

### 9.4 Encryption

**At rest :**
- IndexedDB n'est pas chiffré par défaut. C'est acceptable parce que :
  - Les données ne quittent jamais la machine de l'utilisateur.
  - L'utilisateur a le contrôle physique de sa machine (modèle "single-user laptop").
  - Le contenu (structures chimiques) n'est pas par nature sensible (ce n'est ni un mot de passe ni une donnée personnelle).
- **Si un lab veut chiffrer** : c'est une feature V2+, sous forme de "encrypted vault" optionnel avec mot de passe local (Web Crypto API + AES-GCM).

**In transit :**
- Pour usage local : HTTP suffit, le trafic ne quitte pas localhost.
- Pour usage remote (lab qui expose son instance) : la doc impose un reverse proxy avec TLS (Caddy avec auto-cert Let's Encrypt recommandé).
- Aucun cert TLS n'est bundlé dans Kendraw lui-même — la TLS termination est à la charge de l'utilisateur ou de son admin.

**Key management :** N/A. Pas de clés à gérer (puisque pas d'auth, pas de chiffrement).

### 9.5 Bonnes pratiques

- **Backend tourne en non-root** dans le container Docker. User dédié `kendraw:kendraw` avec UID/GID stables.
- **Image backend `python:3.11-slim`** : surface d'attaque minimale, mises à jour automatiques via Dependabot.
- **CSP stricte** côté nginx (cf. NFR-008).
- **Headers de sécurité** côté nginx : `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy: ...`.
- **Pas de wildcard CORS** : `KENDRAW_CORS_ORIGINS` env var explicite, par défaut same-origin uniquement.
- **`pip-audit` et `npm audit`** en CI hebdomadaire (scheduled GitHub Actions).
- **Dependabot** activé pour security updates auto-PR.
- **Pas de secrets dans le code** ni dans les images Docker. (Et pas de secrets à gérer de toute façon.)

---

## 10. Performance & Tenue de Charge

### 10.1 Stratégie de scaling

**Réponse honnête : il n'y a pas de scaling horizontal.** Kendraw est conçu pour un déploiement single-instance par utilisateur ou par lab. L'effort de performance est concentré là où il importe : **dans le frontend**, parce que c'est là que vit la boucle d'édition critique (NFR-001).

**Vertical, par instance :**
- **Backend** : un processus uvicorn avec `--workers N` (défaut N=1). Pour un lab qui sert ~50 chimistes simultanément, passer à `--workers 4` suffit largement (RDKit calls sont CPU-bound, pas I/O-bound — workers ≈ CPU cores).
- **Frontend** : nginx static, scaling trivial (servir des fichiers statiques tient des milliers de RPS sur n'importe quoi).

**Pas d'auto-scaling, pas de Kubernetes, pas de cluster.** Si le besoin survient, l'utilisateur met plusieurs instances derrière un load balancer — mais ce n'est pas le scénario nominal.

### 10.2 Optimisation performance — frontend (le vrai sujet)

C'est ici que toute l'attention va. Stratégies appliquées :

**Rendu :**
- Diff-driven repaint, dirty regions, layer cache (cf. §5.1.3).
- Spatial index R-tree pour hit-testing en O(log n) (cf. §5.1.1).
- Viewport culling : on ne dessine pas ce qui est hors écran.
- `requestAnimationFrame` pour batcher les writes Canvas.
- Pas de StrictMode sur le canvas mount (double-rendering ruineux).

**Calcul :**
- Web Workers pour : RDKit.js, sérialisation IndexedDB, parsing de gros fichiers SDF.
- Memoization stricte des computeds React (`useMemo`) sur les dérivés du scene model qui rentrent dans le render.
- Property panel debounced à 100 ms pour ≤ 100 atomes, 500 ms pour ≤ 500 atomes (NFR-001).

**Bundle :**
- Code splitting agressif : seuls les chunks nécessaires au cold start sont chargés (palette + canvas + scene + persistence + chem). Tout le reste (export pipelines, V1 features, modales settings) est lazy.
- Tree shaking strict (Vite + Rollup).
- WASM RDKit.js lazy-loadé (worker thread, premier appel à `parseSmiles`).
- Bundle initial < 350 KB gzip vérifié par `size-limit` en CI.

### 10.3 Optimisation performance — backend

- **RDKit caching** : `@functools.lru_cache(maxsize=1024)` sur les opérations idempotentes coûteuses (canonicalSmiles, descriptors). Clé = canonical SMILES.
- **Workers gunicorn/uvicorn** scaled à `min(2, N_CPU)` par défaut. Configurable via `KENDRAW_WORKERS`.
- **Cap atomes** anti-DOS (cf. §9.3).
- **Pas d'opérations bloquantes synchrones longues** : si une opération RDKit dépasse 1 s, on log un warning. Au-delà de 10 s, timeout HTTP 504 (cap configuré côté nginx reverse proxy).
- **Pas de DB → pas de N+1, pas de connection pool, pas de slow queries.** Le backend est trivial à profiler.

### 10.4 Stratégie de cache

**Frontend :**
- TanStack Query cache toutes les réponses backend par clé canonique. Stale-time 5 min, gc-time 30 min. Configurable par endpoint.
- Lib chimie WASM : module et instance partagés entre tous les workers via SharedArrayBuffer si disponible (sinon par-worker).
- Service Worker (Workbox) en V1+ : cache des assets statiques pour offline-first complet.

**Backend :**
- LRU in-memory sur les calculs RDKit lourds (descriptors, canonicalisation).
- Pas de Redis. Si ça devient nécessaire un jour (ce n'est pas le cas au MVP), c'est une décision séparée et un add-on optionnel.

**HTTP :**
- Headers `Cache-Control: public, max-age=86400, immutable` sur les assets fingerprintés (Vite gère).
- API endpoints : `Cache-Control: private, max-age=0, must-revalidate` (idempotent mais on laisse TanStack Query gérer la mémoire client).

### 10.5 Load balancing

**N/A en standard.** Single-instance per deployment. Si un lab le souhaite (cas extrême), il peut mettre plusieurs replicas du backend derrière nginx en round-robin trivial — la statelessness le permet sans contrainte.

---

## 11. Fiabilité & Disponibilité

**Réponse honnête, encore :** la haute disponibilité au sens "5 nines, multi-AZ, failover automatique" n'est pas une exigence Kendraw. L'utilisateur lance Kendraw sur sa machine ou sur un VM lab, et si ça crashe, il relance. Ce qui compte vraiment, c'est :

### 11.1 Tolérance aux défaillances frontend

- **Auto-save sans perte (NFR-010, FR-017)** : c'est la *vraie* feature de fiabilité. Détaillée en §8 NFR-010.
- **Error boundaries React** sur chaque tab — un crash dans un tab ne tue pas les autres tabs.
- **Mode dégradé sur quota IndexedDB** : si IDB est plein, on bascule en in-memory only et on alerte l'utilisateur.
- **Mode dégradé sur backend down** : `useBackendAvailability()` détecte que le backend est inaccessible, désactive les features qui en dépendent avec une affordance claire, mais l'édition principale continue.

### 11.2 Tolérance aux défaillances backend

- **Stateless** : un crash → redémarrage trivial (`docker compose restart backend`). Aucun état à reconstruire.
- **`/health` liveness** : le reverse proxy ou l'orchestrateur de l'utilisateur peut le surveiller et redémarrer.
- **`/ready` readiness** : vérifie que RDKit s'importe. Évite de servir du trafic avant que tout soit prêt.
- **Idempotence** : si un client retry une requête, c'est sans danger.
- **Circuit breaker frontend** : TanStack Query retry exponentiel 3 fois, puis échoue gracieusement avec message utilisateur.

### 11.3 Disaster recovery

**Côté backend :** rien à recover (stateless).

**Côté frontend (utilisateur) :**
- **IndexedDB est local** → si le navigateur de l'utilisateur perd ses données (clear cache, profile corruption, etc.), ses documents auto-savés sont perdus.
- **Mitigation :** export `.kdx` manuel + sync vers le filesystem via `File System Access API` (Chrome) ou téléchargement classique (Firefox/Safari).
- **V2+ :** sync optionnel vers OPFS ou cloud bucket (S3-compatible), cf. §17.

### 11.4 Backup

**Côté backend :** N/A. Stateless.

**Côté frontend :**
- L'utilisateur est responsable de ses backups (export `.kdx` ou save vers son filesystem).
- Documentation `getting-started.md` couvre la stratégie de backup recommandée.

### 11.5 Monitoring & alerting

- **Backend** : `/health`, `/ready`, structlog JSON → ingestible par n'importe quel agrégateur (Loki, Elastic, CloudWatch). Pas d'agrégateur bundlé.
- **Métriques Prometheus optionnelles** : `/metrics` si `KENDRAW_METRICS_ENABLED=1`. Métriques exposées : RPS par endpoint, latence p50/p95/p99, erreurs par code, RDKit cache hit rate.
- **Alerting** : à la charge de l'utilisateur. Pas de Pagerduty bundlé.
- **Frontend** : aucune télémétrie (NFR-008). L'utilisateur peut activer le mode debug en dev pour voir FPS et frame budget en overlay, mais rien ne sort de la machine.

---

## 12. Architecture de Développement & Déploiement

### 12.1 Organisation du code (monorepo)

```
kendraw/
├── packages/                          # frontend (TS/React, pnpm workspaces)
│   ├── scene/                         # @kendraw/scene
│   ├── chem/                          # @kendraw/chem
│   ├── renderer-canvas/               # @kendraw/renderer-canvas
│   ├── renderer-svg/                  # @kendraw/renderer-svg
│   ├── persistence/                   # @kendraw/persistence
│   ├── io/                            # @kendraw/io
│   ├── api-client/                    # @kendraw/api-client
│   └── ui/                            # @kendraw/ui  (le React app)
│       ├── src/
│       ├── public/
│       ├── index.html
│       └── vite.config.ts
├── backend/                           # backend (Python, uv)
│   ├── kendraw_api/                   # routers FastAPI
│   ├── kendraw_chem/                  # services métier RDKit
│   ├── kendraw_settings/              # config Pydantic
│   ├── kendraw_observability/         # logging, health
│   ├── tests/
│   ├── pyproject.toml
│   └── uv.lock
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
├── docs/                              # documentation publiée
│   ├── getting-started.md
│   ├── deployment.md
│   ├── architecture.md                # ce document
│   ├── contributing.md
│   ├── accessibility.md
│   ├── adr/                           # Architecture Decision Records
│   ├── prd-kendraw-2026-04-12.md
│   ├── product-brief-kendraw-2026-04-12.md
│   ├── ux-design-kendraw-2026-04-12.md
│   └── architecture-kendraw-2026-04-12.md
├── .github/
│   └── workflows/
│       ├── ci-frontend.yml
│       ├── ci-backend.yml
│       ├── ci-e2e.yml
│       ├── release.yml
│       └── deploy-demo.yml
├── scripts/                           # scripts dev (perf bench, license audit, …)
├── CITATION.cff
├── LICENSE                            # MIT
├── LICENSES.md                        # audit third-party
├── CONTRIBUTING.md
├── README.md
├── package.json                       # workspace root
├── pnpm-workspace.yaml
└── .editorconfig
```

**Pourquoi monorepo plutôt que multi-repo :**
- Solo dev → moins de friction. Une PR cross-package, une CI, un changelog.
- Frontières strictes par packages, vérifiées par `dependency-cruiser`. Le découplage est *logique*, pas physique.
- Tooling moderne (pnpm workspaces, Vite, vitest) gère ça nativement.

### 12.2 Stratégie de test

**Unitaires :**
- **Vitest** par package frontend, **pytest** côté backend.
- Cible **≥ 80 % de coverage** sur les chemins compute (`@kendraw/scene`, `@kendraw/chem`, `kendraw_chem`, `@kendraw/io`).
- Cible plus souple (~50 %) sur `@kendraw/ui` (couvert ailleurs par E2E et visual regression).

**Property-based / fuzz :**
- **`fast-check`** côté TS : property tests pour le scene model (round-trip serialize/deserialize, undo/redo invariants, command merging idempotence).
- **`hypothesis`** côté Python : property tests pour les conversions de format (round-trip MOL ↔ SMILES ↔ InChI sur ensemble généré).

**Visual regression :**
- **Playwright snapshots** sur les exports SVG/PNG critiques (5 figures de référence MVP, 5 V1).
- Snapshots versionnés dans le repo, mis à jour explicitement par PR si visuel intentionnellement modifié.

**End-to-end :**
- **Playwright** sur trois browsers (Chromium, Firefox, WebKit).
- Suite E2E couvre les 10 user flows du UX doc (5 MVP, 5 V1).
- Lancée à chaque PR, plus une version "smoke" rapide en post-merge.

**Performance :**
- **`vitest bench`** + suite POC #1 codifiée sous `packages/scene/bench/perf-500.bench.ts`.
- Lancée manuellement par le dev, et automatiquement sur tag release. Résultats archivés en artifact CI.

**Tests d'intégration backend :**
- **pytest + httpx** pour appeler les endpoints FastAPI réels avec RDKit installé.
- Test set chimique : 100 structures de référence pour les conversions et calculs (curated, sous `backend/tests/fixtures/`).

### 12.3 Pipeline CI/CD

**GitHub Actions** avec workflows séparés :

**`ci-frontend.yml`** (déclenché sur PRs touchant `packages/*`) :
1. Setup Node 20 + pnpm
2. `pnpm install --frozen-lockfile`
3. `pnpm lint` (ESLint sur tous les packages)
4. `pnpm typecheck` (`tsc --noEmit` sur tous les packages)
5. `pnpm test` (Vitest, coverage)
6. `pnpm build` (chaque package build, puis `@kendraw/ui` final)
7. `pnpm depcruise` (vérifie les frontières de packages)
8. `pnpm size-limit` (bundle initial < 350 KB gzip)
9. `pnpm license-check` (license-checker)
10. Upload coverage report (Codecov ou équivalent OSS)

**`ci-backend.yml`** (déclenché sur PRs touchant `backend/*`) :
1. Setup Python 3.11 + uv
2. `uv sync --frozen`
3. `uv run ruff check .`
4. `uv run ruff format --check .`
5. `uv run mypy backend/`
6. `uv run pytest --cov=kendraw_chem --cov-fail-under=80`
7. `uv run liccheck` (audit licences)
8. `docker build -f docker/Dockerfile.backend -t kendraw-backend:ci .`

**`ci-e2e.yml`** (déclenché sur PRs ou nightly) :
1. `docker compose -f docker/docker-compose.yml up -d`
2. Wait for health
3. `pnpm playwright test` (cross-browser)
4. Artifact: `playwright-report/`
5. Run accessibility tests (axe-core via Playwright)
6. Network isolation test (vérifie zéro requête externe — NFR-008)

**`release.yml`** (déclenché sur tag `v*.*.*`) :
1. Build images Docker frontend + backend, push GHCR
2. Build static-demo profile, déployer sur GitHub Pages
3. Générer GitHub Release avec changelog auto (conventional commits)
4. Push archive Zenodo, récupérer DOI, mettre à jour `CITATION.cff` via PR auto
5. Run perf benchmarks (POC #1 codifiée), archiver les résultats

**`deploy-demo.yml`** (déclenché sur push to main) :
1. Build static-demo, déployer sur `gh-pages` branch (preview de main)

### 12.4 Environnements

| Environnement   | Hébergement                          | Usage                                       |
|-----------------|--------------------------------------|---------------------------------------------|
| **Dev local**   | `pnpm dev` (Vite) + `uv run uvicorn` | Travail quotidien                           |
| **CI**          | GitHub Actions ephemeral             | Tests et build sur chaque PR                |
| **Demo public** | GitHub Pages (frontend-only)         | Vitrine pour découverte rapide              |
| **Self-hosted** | Machine de l'utilisateur             | Production réelle pour les utilisateurs     |

**Pas de "staging".** Ce serait absurde pour un projet auto-hébergé : chaque utilisateur déploie ce qu'il veut, quand il veut. La "staging" est la branche `main` déployée sur GitHub Pages pour le preview communautaire.

**Parité d'environnement :** garantie par Docker. Le `docker-compose.yml` prod et le `docker-compose.dev.yml` (avec hot reload) partagent les mêmes images de base.

### 12.5 Stratégie de déploiement

**Pour l'utilisateur self-hosted :**
1. `git clone` ou `wget` du `docker-compose.yml`
2. `docker compose up -d`
3. Ouvrir `http://localhost:8080`

C'est tout. Pas de blue-green, pas de canary, pas de rolling update. L'utilisateur fait `docker compose pull && docker compose up -d` pour mettre à jour. Downtime : ~10 secondes.

**Versioning :**
- SemVer strict.
- Tags Git `v0.1.0`, `v0.2.0`, …, `v1.0.0`.
- Images Docker taggées avec le SemVer + `latest` (déconseillé en prod, mais disponible).

**Backwards compatibility :**
- Schema `.kdx` migré explicitement par la CI à chaque bump majeur de `schemaVersion`.
- API REST : toute rupture incompatible va sur `/api/v2/*` cohabitant.
- Tags Docker : on garde les anciennes versions disponibles indéfiniment sur GHCR.

### 12.6 Infrastructure as Code

**Aucune IaC.** Pas de Terraform, pas de Pulumi, pas d'Ansible. C'est cohérent avec D2 — l'utilisateur ne déploie pas dans le cloud, il lance un docker-compose. La seule "IaC" est `docker-compose.yml` et `Dockerfile`, qui sont dans le repo.

Si une institution veut industrialiser le déploiement à 50 instances, c'est un fork ou un overlay externe (Helm chart par exemple), maintenu par la communauté hors core repo.

---

## 13. Traçabilité des Exigences

### 13.1 FR → composants

| FR ID  | Nom (court)                                  | Composant(s) principal(aux)                                         | Notes                                                  |
|--------|----------------------------------------------|---------------------------------------------------------------------|--------------------------------------------------------|
| FR-001 | Canvas 2D interactif                         | `scene`, `renderer-canvas`, `ui`                                    | Driver D1                                              |
| FR-002 | Atom & element placement                     | `scene`, `ui`                                                       |                                                        |
| FR-003 | Bond types MVP                               | `scene`, `ui`                                                       |                                                        |
| FR-004 | Ring library MVP                             | `scene`, `ui`                                                       |                                                        |
| FR-005 | Quick carbon chain                           | `scene`, `ui`                                                       |                                                        |
| FR-006 | Wedge/dash display                           | `scene`, `renderer-canvas`, `renderer-svg`                          |                                                        |
| FR-007 | Real-time valence validation                 | `scene` (validators), `chem`                                        | Frontend uniquement, no round-trip                     |
| FR-008 | Selection tools MVP                          | `scene`, `ui`                                                       |                                                        |
| FR-009 | Unlimited undo/redo                          | `scene` (history)                                                   |                                                        |
| FR-010 | Edit operations + transforms                 | `scene`, `ui`                                                       |                                                        |
| FR-011 | Reaction arrows                              | `scene`, `renderer-canvas`, `renderer-svg`, `ui`                    |                                                        |
| FR-012 | Curly arrows                                 | `scene`, `renderer-canvas`, `renderer-svg`, `ui`                    | Géométrie Bézier 4 pts (UX Q#3)                        |
| FR-013 | Reaction conditions                          | `scene`, `ui`                                                       |                                                        |
| FR-014 | Glassmorphism + dark/light                   | `ui` (Glasswerk)                                                    |                                                        |
| FR-015 | Real-time property panel                     | `ui`, `chem` (RDKit.js)                                             | Frontend, < 100 ms ≤ 100 atoms                         |
| FR-016 | Multi-document tabs                          | `ui`, `persistence`                                                 |                                                        |
| FR-017 | Local auto-save                              | `persistence` (IDB + worker)                                        | NFR-010                                                |
| FR-018 | Frontend SMILES parsing                      | `chem`                                                              | POC #2 bloquant                                        |
| FR-019 | ChemDraw shortcuts                           | `ui` (tool controllers)                                             |                                                        |
| FR-020 | Drag & drop import                           | `ui`, `io`                                                          |                                                        |
| FR-021 | RDKit backend compute API                    | `kendraw_api`, `kendraw_chem` (ComputeService)                      |                                                        |
| FR-022 | Format conversion (MVP)                      | `kendraw_api`, `kendraw_chem` (ConvertService), `io` (frontend)     |                                                        |
| FR-023 | MVP file import                              | `io`, `ui`                                                          |                                                        |
| FR-024 | MVP file export                              | `renderer-svg`, `ui`, `io`                                          |                                                        |
| FR-025 | Image copy-paste                             | `renderer-svg`, `ui` (ClipboardItem API)                            |                                                        |
| FR-026 | Citation splash / About                      | `ui`                                                                |                                                        |
| FR-027 | EXIF / metadata footprint                    | `renderer-svg` (post-pipeline)                                      |                                                        |
| FR-028 | Self-hosted bundle                           | `docker/`, doc                                                      | NFR-004                                                |
| FR-029 | Static demo mode                             | `ui` (build profile), `api-client` (stub), CI                       | D4                                                     |
| FR-030 | Advanced bond types (V1)                     | `scene`, `renderer-canvas`, `renderer-svg`                          |                                                        |
| FR-031 | Lone pairs / radicals (V1)                   | `scene`, `renderer-canvas`, `renderer-svg`                          |                                                        |
| FR-032 | R/S et E/Z computation (V1)                  | `kendraw_chem` (StereoService), `chem` (cache)                      |                                                        |
| FR-033 | Lasso + advanced layout (V1)                 | `scene`, `ui`                                                       |                                                        |
| FR-034 | Resonance arrows + multi-step (V1)           | `scene`, `renderer-canvas`, `ui`                                    |                                                        |
| FR-035 | Biomolecule template library (V1)            | `ui` (templates), `persistence`                                     |                                                        |
| FR-036 | Common molecules / protecting groups (V1)    | `ui` (templates)                                                    |                                                        |
| FR-037 | User custom templates (V1)                   | `persistence`, `ui`                                                 |                                                        |
| FR-038 | Drug-likeness / Lipinski (V1)                | `kendraw_chem` (ComputeService), `ui`                               |                                                        |
| FR-039 | Full descriptor suite (V1)                   | `kendraw_chem` (ComputeService), `ui`                               |                                                        |
| FR-040 | IUPAC name → structure (V1)                  | `kendraw_chem` (NamingService + OPSIN)                              | POC #4 bloquant                                        |
| FR-041 | Structure → IUPAC name (V1)                  | `kendraw_chem` (NamingService + RDKit)                              | POC #4 bloquant                                        |
| FR-042 | Elemental analysis / stoichiometry (V1)      | `kendraw_chem` (ComputeService), `ui`                               |                                                        |
| FR-043 | CDXML import/export (V1)                     | `io`, `kendraw_chem` (ConvertService)                               | POC #3 bloquant                                        |
| FR-044 | CML / RXN (V1)                               | `io`, `kendraw_chem` (ConvertService)                               |                                                        |
| FR-045 | Publication-quality vector export (V1)       | `renderer-svg`, pipelines PDF/EPS                                   | NFR-005                                                |
| FR-046 | Customizable tool palette (V1)               | `ui`, `persistence` (settings)                                      |                                                        |
| FR-047 | Customizable shortcuts (V1)                  | `ui`, `persistence`                                                 |                                                        |
| FR-048 | Integrated structure search (V1)             | `ui`, `chem` (substructure matching), `persistence`                 |                                                        |
| FR-049 | Embedded reference data tables (V1)          | `ui`                                                                |                                                        |

**Couverture :** 49/49 FR adressées par au moins un composant. Aucune FR orpheline.

### 13.2 NFR → solutions architecturales

| NFR ID  | Nom (court)                       | Solution principale                                                                       | Validation                                  |
|---------|-----------------------------------|-------------------------------------------------------------------------------------------|---------------------------------------------|
| NFR-001 | Perf 500 atomes                  | Scene immuable + Canvas 2D + spatial index + workers + abstraction `Renderer`            | POC #1 bloquant + benches CI                |
| NFR-002 | Compatibilité navigateurs        | Vite es2022 + matrice Playwright cross-browser                                            | CI Playwright sur 3 browsers                |
| NFR-003 | Licence MIT                      | license-checker + liccheck en CI, whitelist explicite                                     | CI bloque les merges                        |
| NFR-004 | Auto-hébergé zéro cloud          | docker-compose unique, backend stateless, IndexedDB côté client                           | Test CI réseau-isolé                        |
| NFR-005 | Qualité vectorielle publication  | `renderer-svg` dédié, polices embarquées, métadonnées, validation 5 figures de référence  | Inkscape headless en CI + URD Abbaye review |
| NFR-006 | Accessibilité baseline (hors canvas) | Tokens contrast-vérifiés, axe-core en CI, ARIA labels                                  | axe-core CI sans violation AA               |
| NFR-007 | i18n                             | Lingui + extraction statique + lint anti hardcoded strings                                | CI lint                                     |
| NFR-008 | Privacy / no telemetry           | Aucune lib analytics, aucun script tiers, CSP stricte, test réseau-isolé                 | Test CI réseau-isolé                        |
| NFR-009 | Code quality / maintenabilité    | Frontières packages strict, TS strict, mypy strict, CI complète, ADRs                     | CI verte requise + first-PR test            |
| NFR-010 | Auto-save sans perte             | Worker dédié + write-ahead + restore-on-reload                                            | Test crash-resilience automatisé            |
| NFR-011 | Citation robustesse              | `CITATION.cff` + splash + EXIF + DOI Zenodo workflow                                      | cffconvert en CI + test export metadata     |
| NFR-012 | Documentation baseline           | `docs/` structuré + mkdocs/starlight + validation non-author                              | CI build doc + review pré-release           |

**Couverture :** 12/12 NFR adressées par une solution architecturale concrète et un mécanisme de validation.

---

## 14. Trade-offs & Journal de Décisions

Documentation honnête des décisions structurantes — ce qu'on gagne, ce qu'on perd, pourquoi on a tranché ainsi.

### TO-001 : Rendu hybride Canvas (écran) + SVG (export)

**Décision :** Deux moteurs de rendu distincts (`@kendraw/renderer-canvas` et `@kendraw/renderer-svg`) pilotés par un modèle de scène unique.

- ✓ **Gain :** perf maximale à l'écran (Canvas 2D optimisé pour latence) + qualité maximale à l'export (SVG vectoriel pur, polices embarquées, ouvrable dans Illustrator). Tient simultanément D1 et D5.
- ✗ **Coût :** duplication de code de rendu (deux pipelines à maintenir). Coût mitigé en partageant les routines géométriques (path generation, label positioning) dans un module `@kendraw/render-utils` commun.
- **Justification :** la voie alternative (un seul renderer) force un compromis intolérable. SVG-pur ne tient pas le 500 atomes. Canvas-pur produit du raster pour l'export. C'est le constat qui a tué Ketcher pour les usages publication.
- **Réversibilité :** la couche d'abstraction `Renderer` permet d'ajouter un troisième renderer (WebGL) si POC #1 le requiert sans casser les autres. Élevée.

### TO-002 : RDKit.js (WASM) en frontend

**Décision :** RDKit.js comme lib chimie frontend par défaut, OpenChemLib en fallback pour le profil démo.

- ✓ **Gain :** parité de comportement parfaite entre frontend et backend (mêmes algos de canonicalisation, valence, InChI) → élimine une classe entière de bugs "ça marche localement mais pas à l'export".
- ✗ **Coût :** bundle WASM ~3-5 MB compressé, premier chargement ~500 ms-1 s. Acceptable pour l'app full mais lourd pour le mode démo statique.
- **Mitigation :** profil de build `static-demo` avec OpenChemLib (~400 KB) si POC #2 montre que le bundle est trop lourd au boot. Branchement via feature flags compile-time.
- **Réversibilité :** moyenne. L'abstraction `ChemAdapter` permet le swap, mais la divergence de comportement entre les deux libs introduit du test cross-impl à maintenir.

### TO-003 : Backend stateless, pas de DB serveur

**Décision :** Aucune base de données serveur au MVP. Toute la persistance utilisateur vit dans IndexedDB côté navigateur.

- ✓ **Gain :** simplicité opérationnelle radicale (pas de migration, pas de backup, pas de restore), confidentialité totale (D2, NFR-008), backend trivial à scaler verticalement.
- ✗ **Coût :** pas de partage natif de documents entre utilisateurs ou entre les machines d'un même utilisateur.
- **Mitigation MVP :** export `.kdx` manuel (l'utilisateur copie son fichier où il veut).
- **Mitigation V1+ optionnelle :** SQLite dédiée aux templates partagés institutionnels, désactivée par défaut.
- **Mitigation V2+ :** sync optionnel vers OPFS / cloud bucket.
- **Réversibilité :** élevée. Ajouter une DB plus tard est trivial techniquement ; le coût est uniquement opérationnel.

### TO-004 : Modular Monolith plutôt que microservices

**Décision :** Frontend + backend = deux processus seulement. Pas de découpage en micro-services compute / convert / naming.

- ✓ **Gain :** déploiement trivial (`docker compose up`), zéro coordination distribuée, contributeurs onboarding rapide.
- ✗ **Coût :** pas de scaling indépendant des services lourds (NamingService est plus lent que ComputeService — on les scale ensemble).
- **Justification :** le scaling indépendant est un faux problème pour Kendraw (auto-hébergement single-instance). Solo dev → coût coordination distribué inacceptable.
- **Réversibilité :** moyenne. Si jamais Kendraw doit servir 10k utilisateurs simultanés (très peu probable), un fork lourd peut découper. Hors scope.

### TO-005 : Pas d'authentification au MVP

**Décision :** Aucun système de comptes, aucune auth, aucune session. V1+ optionnel : API key statique.

- ✓ **Gain :** UX minimale frictionless (alignée avec attentes des chercheurs académiques), zéro surface d'attaque auth, zéro stockage de credentials.
- ✗ **Coût :** une instance exposée publiquement est consultable par tous.
- **Mitigation :** documentation explicite — si un lab veut exposer son instance publiquement, il met un reverse proxy avec auth (basic, OIDC) devant.
- **Réversibilité :** élevée — l'API key V1 optionnelle est une rampe progressive ; vrai SSO peut être ajouté en V2+ si demandé.

### TO-006 : IndexedDB seule (pas localStorage, pas hybride)

**Décision :** IndexedDB via Dexie comme unique store de persistance frontend. Pas localStorage (sauf pour des préférences ultra-triviales comme le thème, et encore — IDB suffit).

- ✓ **Gain :** un seul mécanisme à raisonner, async non-bloquant, quota généreux, supporte les Blob, transactionnel.
- ✗ **Coût :** Dexie ajoute ~30 KB au bundle. IDB est un peu plus complexe à débugger en DevTools.
- **Justification :** localStorage est synchrone (bloque l'UI thread → tue NFR-001 indirectement), quota anémique (5-10 MB), string-only. Insuffisant pour le scénario Kendraw (multi-onglets, historique d'undo, templates).
- **Réversibilité :** élevée — l'abstraction `PersistenceStore` permet de swapper Dexie pour OPFS, voire un cloud sync, en V2+.

### TO-007 : Custom store domaine + Zustand UI + TanStack Query

**Décision :** Trois couches d'état React clairement séparées plutôt qu'un store global unique.

- ✓ **Gain :** chaque couche a la sémantique adaptée à son usage. Le scene model est framework-agnostic et réutilisable hors React. Onboarding contributeur trivial (un nouveau venu touche **une** couche à la fois).
- ✗ **Coût :** trois APIs à apprendre au lieu d'une. Légère surface mentale supplémentaire.
- **Justification :** mettre le scene model dans Zustand est techniquement possible mais sémantiquement faux. Le scene model a un command bus, un undo stack, des validators, un spatial index — Zustand est un wrapper key-value, pas un framework de domain model. On gagne du couplage et on perd la portabilité.
- **Réversibilité :** moyenne. Refactoring possible mais coûteux.

### TO-008 : OPSIN en V1 uniquement (pas en MVP)

**Décision :** L'image Docker backend MVP n'inclut pas OPSIN ni JRE. OPSIN arrive avec V1 quand FR-040/FR-041 deviennent obligatoires.

- ✓ **Gain :** image MVP lean (~200 MB total), pas de dépendance JVM au démarrage.
- ✗ **Coût :** pas d'IUPAC ↔ structure au MVP. Acceptable parce que ce sont des features V1 non listées comme MUST en MVP.
- **Réversibilité :** triviale (changement de Dockerfile au moment du tag V1).

### TO-009 : Monorepo pnpm workspaces

**Décision :** Tout dans un seul repo Git, frontend et backend confondus, packages frontend en pnpm workspaces.

- ✓ **Gain :** une seule CI, un seul changelog, refactors cross-package atomiques, contributeur clone une chose.
- ✗ **Coût :** outillage hybride TS/Python dans le même CI (mais workflows séparés).
- **Réversibilité :** moyenne. Splitting le repo en plusieurs est faisable mais désagréable.

---

## 15. Risques, POC Bloquants & Questions Ouvertes

### 15.1 POC bloquants — précèdent toute écriture de code applicatif

**POC #1 — Performance 500 atomes (NFR-001 / D1)**
- **Hypothèse :** Canvas 2D + scene immuable + diff incrémental + spatial index tient ≥ 30 fps soutenus à 500 atomes sur laptop i5/M1.
- **Méthode :** prototype minimal `packages/scene-poc/` avec génération de scènes synthétiques 100/250/500/750 atomes, pan/zoom/edit, mesure FPS et frame budget.
- **Critère de succès :** ≥ 30 fps soutenu, frame budget moyen < 16 ms à 500 atomes.
- **Critère d'échec :** révision substrat (Canvas → WebGL/Pixi.js), re-test.
- **Impact si échec total :** **arrêt projet ou redéfinition radicale de l'architecture rendu.**

**POC #2 — RDKit.js bundle / latence (FR-018 / D1)**
- **Hypothèse :** RDKit.js WASM est utilisable côté frontend avec bundle < 6 MB compressé et parsing SMILES < 200 ms pour ≤ 100 atomes.
- **Méthode :** mini-app de mesure, lazy load WASM dans Web Worker, parsing SMILES test set 100 structures, mesure first interactive < 2 s sur connexion 4G simulée (Chrome DevTools Network throttling).
- **Critère de succès :** trois critères atteints simultanément.
- **Critère d'échec :** OpenChemLib JS comme implémentation par défaut côté frontend pour le profil full ; RDKit.js réservé aux web workers offline.
- **Impact si échec total :** divergence frontend/backend (parité réduite), tolérée si OpenChemLib couvre suffisamment.

**POC #3 — CDXML round-trip (FR-043 / V1)**
- **Hypothèse :** RDKit Python (et/ou parser TS custom) supporte le round-trip CDXML → Kendraw → CDXML avec ≥ 95 % de fidélité sur le corpus URD Abbaye.
- **Méthode :** récupérer 50-100 fichiers CDXML réels d'URD Abbaye, parser, re-écrire, diff structurel.
- **Critère de succès :** ≥ 95 % préservation atomes, liaisons, charges, stéréo, flèches, annotations conditions.
- **Critère d'échec :** restreindre la promesse "migration sans perte" aux constructions supportées, documenter les limitations, fournir un convertisseur d'aide.
- **Impact si échec total :** affaiblissement de la promesse V1 "migration sans perte". Communication à ajuster.
- **Timing :** déclenché en début de phase V1, après MVP stable.

**POC #4 — Couverture IUPAC name ↔ structure (FR-040, FR-041 / V1)**
- **Hypothèse :** OPSIN (name → structure) et RDKit/STOUT (structure → name) atteignent ≥ 80 % de bonne réponse sur un test set de 200 IUPAC names / 200 structures de référence.
- **Méthode :** test set curated, comparaison résultats vs gold standard.
- **Critère de succès :** ≥ 80 % sur les deux directions.
- **Critère d'échec :** dégrader FR-040/FR-041 en "support partiel + warning" + chercher alternatives (LexiChem n'est pas MIT-compat → exclu).
- **Timing :** déclenché en début de V1.

### 15.2 Risques restants

**R-001 : Curly arrow Bézier serialization in MOL/CDXML extensions**
- **Description :** Aucun standard pour sérialiser une géométrie Bézier de flèche incurvée dans MOL ou CDXML. Custom extension obligatoire.
- **Impact :** les flèches incurvées ne survivent pas à un round-trip MOL/CDXML strict (les autres outils ne les comprendront pas).
- **Mitigation :** sérialiser en `.kdx` natif pour préservation totale ; en MOL/CDXML, utiliser un bloc d'extension propriétaire `<kendraw:curly-arrow>` ou un commentaire structuré ; le re-importer via Kendraw fonctionne, l'importer ailleurs perd les courbes (acceptable).

**R-002 : Embedding de polices dans SVG/PDF**
- **Description :** Garantir la reproductibilité typographique cross-app implique d'embarquer des subsets de polices dans chaque export, ce qui alourdit chaque fichier.
- **Impact :** exports SVG plus lourds (50-200 KB de overhead par fichier).
- **Mitigation :** subset CI-driven via fonttools, n'embarquer que les glyphes utilisés. Acceptable.

**R-003 : Inconsistance IndexedDB cross-browser**
- **Description :** Safari WebKit a un quota IDB stingy (~50 MB initial, escalation par prompt) et des bugs historiques sur les transactions longues.
- **Impact :** auto-save peut échouer ou être lent sur Safari pour gros documents.
- **Mitigation :** scheduler chunk-based pour Safari, prompt utilisateur explicite à 80 % quota, doc dédiée.

**R-004 : WASM cold start en mode démo**
- **Description :** RDKit.js WASM ~3-5 MB compressé peut prendre 1-2 s à charger sur 4G.
- **Impact :** premier rendu interactif retardé en mode démo public.
- **Mitigation :** OpenChemLib JS dans le profil démo (POC #2 valide), preloading aggressive via `<link rel="preload">`, splash screen pendant le chargement.

**R-005 : Burnout solo dev (le risque #1 du brief)**
- **Description :** JB est seul, à temps partiel, sur 12-24 mois.
- **Impact :** projet à l'arrêt si JB décroche.
- **Mitigation architecturale :** D7 (codebase appropriable). Frontières strictes, tests, doc, CI. C'est tout l'objectif de ce document.

### 15.3 Questions ouvertes restantes

Toutes les questions ouvertes du PRD ont été tranchées dans cette architecture **sauf** :

- **PRD Q#7 — Cadence Zenodo DOI** : à arbitrer avant MVP launch (release manager decision).
- **PRD Q#9 — Opt-in anonymous instance count** : à arbitrer avant V1, avec privacy review explicite.
- **PRD Q#4 — CDXML version coverage** : sera tranché par POC #3 (analyse corpus URD Abbaye).

Toutes les questions ouvertes restantes seront documentées comme **ADRs** (Architecture Decision Records) sous `docs/adr/` au moment de leur résolution.

---

## 16. Hypothèses & Contraintes

### 16.1 Hypothèses architecturales

- **Single-user per browser session** au MVP : pas d'édition concurrente du même document depuis plusieurs onglets simultanés. (Si l'utilisateur ouvre le même document dans deux onglets, le dernier write gagne. Acceptable au MVP, à raffiner en V2+.)
- **Réseau optionnel mais supposé disponible** pour l'app full : les features backend dégradent gracieusement mais la doc suppose une connexion au backend opérationnelle.
- **Navigateur moderne** : IndexedDB, Web Workers, ES2022, Canvas 2D obligatoires. Pas de polyfill vers IE.
- **Hardware utilisateur ≥ 2020 baseline** (i5 / M1 ou équivalent). Plus ancien = perfs dégradées mais utilisable.
- **OPSIN coverage suffisante en V1** : POC #4 doit valider, sinon ajustement.
- **CDXML tractabilité** : POC #3 doit valider, sinon ajustement scope.

### 16.2 Contraintes

- **Stack imposé par PRD :** React 18 + TypeScript / FastAPI + Python 3.11+ / RDKit / SQLite (optionnel V1+).
- **Licence MIT** : interdit GPL/LGPL/AGPL en dépendance prod (NFR-003).
- **Pas de cloud obligatoire** (NFR-004).
- **Pas de télémétrie par défaut** (NFR-008).
- **Solo dev au démarrage** : tout choix qui ajoute plus d'opérations qu'un seul humain ne peut tenir doit être éliminé.

---

## 17. Considérations Futures (V2+ — pour mémoire)

Le PRD liste les features V2+ comme **hors scope** explicite. L'architecture est conçue pour les rendre **tractables** sans refacto majeur, grâce aux abstractions clés :

- **3D preview (3Dmol.js)** : nouveau renderer plug-in via l'abstraction `Renderer` (peut viewer 3D coexister avec les renderers 2D), pas de refacto scene model.
- **Real-time collaboration (CRDT)** : remplaçable au niveau du command bus de `@kendraw/scene` par un command bus CRDT-aware (Y.js / Automerge) sans toucher aux renderers ni à l'UI. Le scene model immuable + commands est précisément ce qui rend ça faisable.
- **Cloud sync optionnel** : nouvelle implémentation de `PersistenceStore` (`CloudSyncStore`), branchement via setting utilisateur. Aucun changement aux composants existants.
- **Tablet UI** : nouvel ensemble de surfaces UX dans `@kendraw/ui`, partage des packages bas niveau. La séparation UI / scene rend ça simple.
- **LLM assistant** : nouveau panneau dans `@kendraw/ui`, communication via une nouvelle route backend `/api/v1/assist` qui appelle un LLM externe (configurable, opt-in, jamais par défaut → respect NFR-008).
- **Public JS embedding API** : exposer `@kendraw/scene` + `@kendraw/renderer-canvas` + `@kendraw/chem` comme bundle UMD/ESM autonome consommable par une page tierce. Possible parce que ces packages sont déjà framework-agnostic.
- **ELN integration (Chemotion / eLabFTW)** : iframe-friendly (`@kendraw/ui` accepte un mode embed), API `postMessage` pour échange de structures.

L'architecture ne prépare pas explicitement V2 mais elle ne le rend pas impossible. C'est l'équilibre voulu : **pas d'over-engineering spéculatif, mais pas de cul-de-sac non plus**.

---

## Approbation & Sign-off

**Statut de revue :**
- [ ] Architect / Tech Lead (JB Donnette)
- [ ] Product Owner (JB Donnette — double casquette)
- [ ] First-pass sanity check par contact URD Abbaye (optionnel mais recommandé avant POC #1)

---

## Historique des révisions

| Version | Date       | Auteur                | Changements                                                |
|---------|------------|-----------------------|------------------------------------------------------------|
| 1.0     | 2026-04-12 | Jean-Baptiste Donnette | Architecture initiale couvrant MVP + V1, alignée sur PRD v1.0 et UX v1.0. |

---

## Prochaines étapes

### Phase 3 — Avant Phase 4

1. **Lancer POC #1 (perf 500 atomes) — bloquant.**
2. **Lancer POC #2 (RDKit.js bundle/latence) — bloquant pour le verrou du choix lib chimie.**
3. Écrire les premiers ADRs sous `docs/adr/` pour acter les décisions structurantes (TO-001 à TO-009).
4. Lancer `/solutioning-gate-check` (workflow BMM) pour valider que tous les artefacts de Phase 3 sont prêts pour Phase 4.

### Phase 4 — Sprint Planning

Une fois POC #1 et POC #2 validés, lancer `/sprint-planning` pour :
- Décomposer les 12 epics en stories détaillées (66-92 stories estimées).
- Estimer la complexité.
- Séquencer la livraison MVP en sprints.
- Démarrer l'implémentation en suivant le plan d'architecture.

### POC #3 et POC #4 — déclenchés en début de V1

Après MVP stable, avant l'engagement formel sur les FR V1.

---

## Annexe A — Matrice d'évaluation des libs chimie frontend

| Critère                                 | Poids | RDKit.js (WASM) | OpenChemLib JS | smiles-drawer |
|-----------------------------------------|-------|------------------|------------------|------------------|
| Licence MIT-compat                      | bloquant | ✓ (BSD-3)        | ✓ (BSD-2)        | ✓ (MIT)         |
| Parsing SMILES complet (rings, stereo)  | élevé | ✓ (référence)    | ✓                | ✓ (rendu only)  |
| Canonicalisation                        | élevé | ✓                | ✓ (limité)       | ✗               |
| InChI generation                        | élevé | ✓                | ✗                | ✗               |
| Valence checking                        | élevé | ✓                | ✓                | ✗               |
| Bundle size compressé                    | élevé | ~3-5 MB ✗       | ~400 KB ✓        | ~150 KB ✓       |
| Latence cold start (4G)                  | élevé | 1-2 s ✗         | 200 ms ✓         | 100 ms ✓        |
| Parité comportementale RDKit Python     | élevé | ✓ (parfait)      | ⚠ (divergence)  | n/a             |
| Maintenance active                       | moyen | ✓                | ✓                | ✗ (peu actif)   |
| API TypeScript-friendly                  | moyen | ⚠ (manuelle)    | ✓                | ✓                |
| **Verdict cible profil full**           | —     | **✓ (sous réserve POC #2)** | fallback        | rejeté          |
| **Verdict cible profil static-demo**    | —     | si POC #2 OK     | **✓ par défaut** | rejeté          |

**Décision actuelle :** RDKit.js pour le profil full, OpenChemLib pour le profil static-demo, swap conditionné par POC #2.

---

## Annexe B — Planification capacitaire

### Backend (instance unique self-hosted)

**Hypothèse de charge nominale :**
- 1 lab = 5-50 chimistes
- Charge typique : ~10 requêtes / chimiste / jour = 50-500 requêtes / jour total
- Pic : ~5 requêtes/seconde (très optimiste)

**Ressources nécessaires :**
- CPU : 2 vCPU suffisants (RDKit ops sont sub-seconde sur structures normales)
- RAM : 1-2 GB (Python + RDKit + caches LRU)
- Disk : ~500 MB image Docker, négligeable runtime
- Network : 10-100 Kbps moyenne

**Cible matérielle minimale :** Raspberry Pi 4/5, NUC, ou tout VM 2 vCPU / 2 GB RAM / 5 GB disk.

### Frontend

**Cold start :**
- Bundle initial < 350 KB gzip → < 1 s download sur 10 Mbps.
- WASM RDKit.js lazy → +1-2 s pour le premier appel chem.

**Steady state :**
- Tient sur n'importe quel navigateur moderne avec ≥ 4 GB RAM.
- Document 500 atomes : < 50 MB RAM JS heap + IDB.

### Démo statique

**Hébergement GitHub Pages :**
- Bundle total avec OpenChemLib (profil démo) : ~600 KB - 1 MB
- Bande passante GitHub Pages : illimitée pour OSS, soft cap 100 GB/mois
- Suffisant pour des dizaines de milliers de visiteurs/mois sans souci

---

## Annexe C — Coûts d'opération

**Pour le projet (Jean-Baptiste Donnette) :**
- GitHub : gratuit (public OSS)
- GitHub Actions : 2000 min/mois gratuits, suffisant pour la cadence de PR attendue (solo dev)
- GitHub Pages : gratuit
- Zenodo : gratuit
- Docker Hub / GHCR : gratuit pour images publiques
- **Total : 0 €/mois.**

**Pour un utilisateur self-hosted :**
- Hardware : machine déjà existante (laptop, NUC, VM lab)
- Bande passante : négligeable, trafic local
- TLS cert : gratuit via Let's Encrypt (à la charge utilisateur si exposition publique)
- **Total : 0 €/mois additionnels.**

C'est précisément l'inverse de ChemDraw (~4000 €/utilisateur/an). C'est le point.

---

**Ce document a été créé selon la BMAD Method v6 — Phase 3 (Solutioning).**

*Pour continuer : exécuter `/solutioning-gate-check` pour valider la sortie de Phase 3, puis `/sprint-planning` pour entrer en Phase 4.*
