# Sprint Plan Kendraw — MVP (`v0.1.0`)

**Date :** 2026-04-12
**Scrum Master :** Jean-Baptiste Donnette (double casquette PO/Tech Lead/Dev)
**Project Level :** 4 — Enterprise
**Périmètre :** MVP uniquement (29 FR Must Have). V1 différé à un second `/sprint-planning` post-retour terrain.
**Statut :** Plan initial, validé par PO, prêt pour exécution Sprint 0.

---

## Synthèse exécutive

Ce plan décompose le MVP Kendraw (29 FR Must Have, 12 NFR transverses) en un backlog structuré de **~67 stories** réparties sur **1 Sprint 0 gated + 18 sprints applicatifs**, sur un horizon estimé de **~9-10 mois calendaires** au rythme solo part-time de **10h/semaine de focus dev effectif**.

**Caractéristiques structurantes :**

- **Sprint 0 est un gate go/no-go**, non un sprint à 2 semaines. Il contient 100 % de l'infra + ADRs + 4 POCs en parallèle, sans aucune story applicative. Sprint 1 ne démarre **que** lorsque POC #1 (perf 500 atomes) et POC #2 (RDKit.js) sont **verts**. Budget calendrier estimé : 8-9 semaines.
- **Sprint 1 délivre le premier slice vertical** : tap canvas → un atome apparaît, persistance différée à Sprint 2. Détaillé story-par-story.
- **Sprints 2-18 sont esquissés thématiquement**, avec mapping epic → sprint et compte de stories estimé. Le détail story-par-story sera produit en début de chaque sprint via `/create-story` (re-planification rolling-wave).
- **Re-baseline de vélocité prévu en rétro de Sprint 2**, avec ajustement éventuel à 8h/semaine si 10h/semaine ne tient pas dans la durée.
- **POCs #3 (CDXML) et #4 (IUPAC) démarrés en parallèle dans Sprint 0** mais leur **validation finale est différée** : POC #3 attend l'arrivée du corpus URD Abbaye (2-4 semaines calendaire), POC #4 attend la constitution du test set IUPAC en pré-V1.

**Métriques clés :**

| Métrique                    | Valeur                                              |
|-----------------------------|------------------------------------------------------|
| Total stories MVP           | ~67 (12 Sprint 0 + 4 Sprint 1 + ~51 Sprints 2-18)   |
| Total points estimés        | ~225 points                                          |
| Sprints applicatifs MVP     | 18                                                   |
| Capacité visée par sprint   | 10 points / 2 semaines (à 10h/sem × 2 × 0.5 pt/h)   |
| Calendrier Sprint 0         | ~8-9 semaines (45 points effort, 100 % bloquant)    |
| Calendrier Sprints 1-18     | ~36 semaines (18 × 2 sem)                           |
| **Cible MVP `v0.1.0`**     | **~44-45 semaines** ≈ **9-10 mois calendaires**     |

---

## 1. Capacité et calibration

### 1.1 Hypothèses

- **Équipe :** 1 développeur (Jean-Baptiste Donnette), solo, side project en parallèle d'un job SRE temps plein.
- **Cadence :** 10h/semaine de **focus dev effectif** sur Kendraw (soirs + weekends), incluant code, tests, debug, et review automatique. Hors lecture passive, hors temps de pause, hors comm communauté.
- **Sprint length :** 2 semaines. Démarrage et fin alignés sur des week-ends (sprint Lundi semaine A → Vendredi semaine B+1).
- **Cérémonies allégées :** pas de daily, pas de planning meeting (solo dev). Une **rétrospective en fin de sprint** (~30 min) écrite dans `docs/retrospectives/sprint-{N}.md`. Une **review** = démo perso enregistrée + push démo statique pour permettre aux contacts URD Abbaye de voir l'avancée.
- **Disponibilité :** sprints "off" prévus pour vacances + maladie + life events. Plan vise 18 sprints "on" sur ~22 sprints calendaires (~15 % buffer).

### 1.2 Calcul de vélocité

```
Capacité brute par sprint :
  10 h/semaine × 2 semaines = 20 h de focus dev / sprint

Calibration points pour solo OSS soirée/weekend :
  1 point ≈ 2 h de focus dev
  (plus dur que team full-time : context switching depuis SRE day job,
   fatigue cumulative, pas de pair programming pour débloquer rapidement)

Vélocité cible : 20 h ÷ 2 h/pt = 10 points / sprint
```

**Calibration de référence pour les estimations :**

| Points | Effort               | Exemples Kendraw                                                  |
|--------|----------------------|-------------------------------------------------------------------|
| 1 pt   | ~2 h (1 soirée)      | Tweak config, ajout fixture test, fix typo doc                    |
| 2 pts  | ~4 h (1 weekend matin) | CRUD endpoint simple, composant React stateless, schema migration |
| 3 pts  | ~6-8 h (1 jour réparti) | Composant React stateful, validateur métier, e2e test scenario    |
| 5 pts  | ~10-12 h (~1 weekend) | Feature complète frontend + tests, parser de format, command bus  |
| 8 pts  | ~16-20 h (~2 weekends) | POC perf bloquant, intégration WASM lourde, refacto cross-package |
| 13 pts | ~3-4 weekends        | **TROP GROS — décomposer** (sauf POC très exploratoire)           |

**Aucune story du backlog ne dépasse 8 pts** sauf POC-001 (perf 500 atomes, 8 pts justifiés par caractère exploratoire bloquant).

### 1.3 Horizon estimé MVP

```
Sprint 0  : 45 pts effort × 0.5 sprint/10pts = ~4.5 sprints équivalents
            Calendrier : ~8-9 semaines (gated, dépend POC #1 et #2)

Sprint 1  : 10 pts            (2 semaines)
Sprint 2  : 10 pts            (2 semaines)
...
Sprint 18 : 10 pts            (2 semaines)
            Sous-total : 18 × 2 = 36 semaines

Total calendrier MVP :
  Sprint 0      : ~8-9 semaines
  Sprints 1-18  : ~36 semaines
  Tag v0.1.0    : ~44-45 semaines = ~9-10 mois
```

**Buffer :** 15 % de marge implicite (~7 semaines) pour aléas perso, sprints off, debug imprévu. Le plan vise donc une fenêtre **~10-12 mois calendaires** entre démarrage Sprint 0 et tag `v0.1.0`. Cohérent avec la cible 12 mois du Product Brief.

**Re-baseline obligatoires :**

1. **Fin Sprint 0** : verdict POCs. Si POC #1 ❌, retour architecture (§3.1, §5.1.3, §10.2 du doc d'archi). Sinon, démarrage Sprint 1.
2. **Fin Sprint 1** : première mesure de vélocité réelle. Calibration confirmée ou ajustée.
3. **Fin Sprint 2** : confirmation stabilité vélocité. Décision finale 8 vs 10 pts/sprint pour la suite.
4. **Fin Sprint 6** : checkpoint mi-MVP — replan si nécessaire.

---

## 2. Sprint 0 — Gated Infra & POCs

### 2.1 Vue d'ensemble

**Sprint 0 n'est pas un sprint de 2 semaines.** C'est une **phase gatée** dont la durée calendaire dépend de la validation des POCs bloquants. Sprint 1 ne démarre **pas** tant que POC #1 et POC #2 ne sont pas verts.

**Composition :** 12 stories réparties en 4 groupes :

| Groupe                  | Nb stories | Points | Notes                                       |
|-------------------------|------------|--------|---------------------------------------------|
| Infrastructure repo & CI | 9          | 20 pts | Monorepo, Docker, CI workflows, license, docs scaffold |
| ADRs initiaux           | 2          | 4 pts  | Acte les décisions structurantes du doc d'architecture |
| POCs                    | 4          | 19 pts | POC #1 et #2 bloquants, #3 et #4 démarrage parallèle |
| Test corpus             | 1          | 2 pts  | Test set #6 (perf benchmarks synthétiques) — input POC #1 |
| **Total Sprint 0**      | **16**     | **45 pts** | ~8-9 semaines calendaires                   |

**Goal Sprint 0 :**
> *« Avoir un repo fonctionnel, une CI complète, les fondations architecturales actées en ADRs, et la preuve technique que les hypothèses critiques (perf 500 atomes, RDKit.js bundle/latence) tiennent — sans avoir écrit la moindre ligne de code applicatif. »*

### 2.2 Stories détaillées Sprint 0

#### Groupe A — Infrastructure repo & CI (20 pts)

##### STORY-INF-001 — Scaffolding monorepo pnpm + structure de packages

**Priorité :** Must Have / bloquante
**Points :** 3
**Driver :** D7 (appropriabilité)

**User story :**
> En tant que solo dev OSS, je veux un monorepo pnpm workspaces structuré dès le début pour que tous les futurs commits respectent les frontières de packages définies en architecture.

**Acceptance criteria :**
- [ ] Repo Git initialisé sur `main`, conventional commits + commitlint en place.
- [ ] `pnpm-workspace.yaml` déclare les 8 packages frontend listés en §5.1 du doc d'architecture.
- [ ] Chaque package a un `package.json` minimal valide, un `tsconfig.json` extends de `tsconfig.base.json` racine, et un `src/index.ts` placeholder.
- [ ] `tsconfig.base.json` strict : `strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true`.
- [ ] `.editorconfig`, `.gitignore` (Node + Python + IDE + OS + corpus URD Abbaye), `.gitattributes` en place.
- [ ] `pnpm install` à la racine fonctionne sans warning.

**Dépendances :** aucune.

---

##### STORY-INF-002 — Backend skeleton FastAPI + uv

**Priorité :** Must Have / bloquante
**Points :** 3
**Driver :** D2 (auto-hébergement) + D7

**User story :**
> En tant que solo dev, je veux un backend Python prêt à l'emploi avec FastAPI + Pydantic + uv pour pouvoir ajouter rapidement des endpoints chimie sans recâbler la stack.

**Acceptance criteria :**
- [ ] `backend/` contient les modules `kendraw_api/`, `kendraw_chem/`, `kendraw_settings/`, `kendraw_observability/`.
- [ ] `pyproject.toml` + `uv.lock` avec FastAPI, Pydantic v2, uvicorn, structlog, ruff, mypy, pytest, hypothesis.
- [ ] Endpoint `/health` retourne `{"status": "ok"}`.
- [ ] Endpoint `/version` retourne `{"version": "0.0.0", "commit": "<git sha>"}`.
- [ ] `uv run uvicorn kendraw_api.main:app` démarre proprement en local.
- [ ] `mypy backend/` et `ruff check backend/` passent sur le squelette.

**Dépendances :** aucune.

---

##### STORY-INF-003 — Docker setup et docker-compose unique

**Priorité :** Must Have / bloquante
**Points :** 2
**Driver :** D2 (un seul `docker compose up`)

**User story :**
> En tant qu'utilisateur self-hosted, je veux pouvoir lancer Kendraw via une seule commande `docker compose up`.

**Acceptance criteria :**
- [ ] `docker/Dockerfile.frontend` build le bundle Vite et le sert via nginx.
- [ ] `docker/Dockerfile.backend` basé sur `python:3.11-slim`, user non-root `kendraw:kendraw`, install deps via `uv`.
- [ ] `docker/docker-compose.yml` orchestre les deux services avec ports configurables (`8080` frontend par défaut, `8081` backend).
- [ ] `docker/nginx.conf` avec headers de sécurité (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- [ ] `docker compose up` depuis la racine du repo lance les deux services et `/health` répond OK.

**Dépendances :** STORY-INF-001, STORY-INF-002.

---

##### STORY-INF-004 — CI workflow frontend

**Priorité :** Must Have / bloquante
**Points :** 3
**Driver :** D3 (licences) + D7 (qualité)

**User story :**
> En tant que solo dev, je veux que chaque PR frontend soit automatiquement validée (lint, types, tests, build, frontières packages, bundle size, licences) pour ne jamais merger une régression silencieuse.

**Acceptance criteria :**
- [ ] `.github/workflows/ci-frontend.yml` exécute en parallèle : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm depcruise`, `pnpm size-limit`, `pnpm license-check`.
- [ ] `dependency-cruiser` config interdit toute violation des règles de dépendance §5.1.8 du doc d'architecture.
- [ ] `size-limit` config : bundle initial < 350 KB gzip (hors WASM lazy).
- [ ] `license-checker --onlyAllow 'MIT;BSD-2-Clause;BSD-3-Clause;Apache-2.0;ISC;0BSD;Unlicense;CC0-1.0'`.
- [ ] CI verte requise avant merge dans `main` (branch protection).

**Dépendances :** STORY-INF-001.

---

##### STORY-INF-005 — CI workflow backend

**Priorité :** Must Have / bloquante
**Points :** 2
**Driver :** D3 + D7

**User story :**
> Idem STORY-INF-004 côté Python.

**Acceptance criteria :**
- [ ] `.github/workflows/ci-backend.yml` exécute : `uv sync --frozen`, `ruff check`, `ruff format --check`, `mypy backend/`, `pytest --cov=kendraw_chem --cov-fail-under=80`, `liccheck`.
- [ ] `liccheck` strategy file alignée avec la whitelist frontend.
- [ ] `pytest` cible coverage ≥ 80 % sur `kendraw_chem` (ne casse pas en Sprint 0 puisque le code n'existe pas encore — config `--cov-fail-under` ajustée à 0 jusqu'à Sprint 10).

**Dépendances :** STORY-INF-002.

---

##### STORY-INF-006 — License audit setup + LICENSES.md

**Priorité :** Must Have
**Points :** 1
**Driver :** D3 (NFR-003)

**User story :**
> En tant que mainteneur OSS, je veux un audit licences automatisé sur chaque PR pour ne jamais introduire de GPL/LGPL/AGPL par accident.

**Acceptance criteria :**
- [ ] `LICENSES.md` à la racine, généré par script depuis `pnpm license-check --json` + `liccheck --reporting json`, listant toutes les dépendances avec leur licence.
- [ ] CI bloque les PRs introduisant une licence non whitelisée.
- [ ] README mentionne explicitement la posture MIT et la garantie absence de GPL/LGPL/AGPL.

**Dépendances :** STORY-INF-004, STORY-INF-005.

---

##### STORY-INF-007 — Repo metadata (LICENSE, CITATION.cff, README, CONTRIBUTING)

**Priorité :** Must Have
**Points :** 1
**Driver :** NFR-011 (citation) + NFR-012 (doc)

**User story :**
> En tant que premier visiteur du repo, je veux voir immédiatement la licence MIT, la demande de citation, et comment contribuer.

**Acceptance criteria :**
- [ ] `LICENSE` MIT à la racine, copyright "Jean-Baptiste Donnette".
- [ ] `CITATION.cff` valide schema, validé par `cffconvert` en CI.
- [ ] `README.md` skeleton : pitch 3 lignes, screenshot placeholder, "Cite this work" section au-dessus du fold avec BibTeX copy-paste, "Privacy" badge "no telemetry".
- [ ] `CONTRIBUTING.md` skeleton : setup en 5 commandes, lien vers `docs/architecture-kendraw-2026-04-12.md`, conventions commits, lien vers ADRs.

**Dépendances :** STORY-INF-001.

---

##### STORY-INF-008 — Structure docs/ + ADR template

**Priorité :** Must Have
**Points :** 1
**Driver :** NFR-009 + NFR-012

**User story :**
> En tant que dev, je veux une structure docs/ stable et un template ADR prêt à l'emploi pour acter les décisions au fil de l'eau.

**Acceptance criteria :**
- [ ] `docs/` contient déjà : `prd-*.md`, `product-brief-*.md`, `ux-design-*.md`, `architecture-*.md`, `solutioning-gate-check-*.md`, `test-corpus-plan.md`, `sprint-plan-*.md`.
- [ ] Création de `docs/adr/` avec `0000-template.md` (structure ADR standard : status, context, decision, consequences).
- [ ] Création de `docs/retrospectives/` (vide, pour les rétros futures).
- [ ] **Note :** publication via mkdocs ou starlight reportée à STORY-ADR-002 + sprint ultérieur.

**Dépendances :** aucune.

---

##### STORY-INF-009 — `.github/` templates (PR, issue, dependabot, code owners)

**Priorité :** Should Have
**Points :** 1
**Driver :** D7

**User story :**
> Friction minimale pour les premiers contributeurs.

**Acceptance criteria :**
- [ ] PR template avec checklist (tests, types, lint, license).
- [ ] Issue templates (bug, feature, question).
- [ ] `dependabot.yml` activé pour npm + uv + GitHub Actions, fréquence hebdo.
- [ ] `CODEOWNERS` minimal (JB owner de tout au début).

**Dépendances :** STORY-INF-001.

---

#### Groupe B — ADRs initiaux (4 pts)

##### STORY-ADR-001 — Rédaction ADRs 001 à 006 (décisions structurantes architecture)

**Priorité :** Must Have
**Points :** 3
**Driver :** D7

**User story :**
> En tant que futur contributeur (ou JB lui-même dans 6 mois), je veux comprendre **pourquoi** Kendraw a été conçu avec ces choix structurants, sans avoir à remonter le doc d'architecture entier.

**Acceptance criteria :** rédaction de 6 ADRs courts (~1 page chacun) sous `docs/adr/`, statut "Accepted", basés sur les trade-offs TO-001 à TO-006 du doc d'architecture :

- [ ] `docs/adr/0001-modular-monolith.md` (TO-004)
- [ ] `docs/adr/0002-hybrid-canvas-svg-renderer.md` (TO-001)
- [ ] `docs/adr/0003-rdkit-js-frontend.md` (TO-002)
- [ ] `docs/adr/0004-stateless-backend-no-db.md` (TO-003)
- [ ] `docs/adr/0005-indexeddb-via-dexie.md` (TO-006)
- [ ] `docs/adr/0006-three-layer-state-management.md` (TO-007)

**Dépendances :** STORY-INF-008.

---

##### STORY-ADR-002 — ADR-007 choix outil de doc statique (mkdocs vs starlight)

**Priorité :** Should Have
**Points :** 1
**Driver :** NFR-012

**User story :**
> Trancher le choix mkdocs-material vs astro-starlight pour la doc publique avant que le lock-in coûte cher.

**Acceptance criteria :**
- [ ] ADR rédigé avec comparaison rapide (3 critères : maintenance, ecosystem, friction contributeur).
- [ ] Décision actée (recommandation initiale : **mkdocs-material**, à valider).
- [ ] Setup effectif différé à un sprint ultérieur (Sprint 17-18).

**Dépendances :** STORY-INF-008.

---

#### Groupe C — POCs (19 pts)

##### STORY-POC-001 — POC #1 : Performance 500 atomes (BLOQUANT)

**Priorité :** Must Have / **bloquante absolue**
**Points :** 8
**Driver :** D1 (NFR-001)

**User story :**
> En tant que PO/architecte, je veux la preuve technique mesurée que le substrat de rendu choisi tient ≥ 30 fps soutenus à 500 atomes sur laptop i5/M1 baseline, **avant** d'écrire la moindre ligne de code applicatif.

**Acceptance criteria :**
- [ ] `packages/scene-poc/` créé (jetable, **pas** dans le scope final du package `@kendraw/scene`).
- [ ] Implémentation minimale : modèle de scène immuable (Immer) + spatial index R-tree (`rbush`) + Canvas 2D renderer avec dirty-region repaint.
- [ ] Test set #6 (TC-001) consommé : structures synthétiques 100/250/500/750 atomes.
- [ ] Bench codifié sous `packages/scene-poc/bench/perf-500.bench.ts` mesure : (a) FPS soutenu pan/zoom sur 5 s, (b) frame budget moyen sur ajout 100 liaisons, (c) latence sélection rectangle full molecule.
- [ ] Rapport sous `docs/poc/poc-001-perf-500-atomes.md` avec mesures, graphiques (capture d'écran ou ASCII), verdict go/no-go.
- [ ] **Critère de succès :** à 500 atomes, ≥ 30 fps soutenu **ET** frame budget moyen < 16 ms **ET** latence sélection < 50 ms.
- [ ] **Critère d'échec :** révision architecture rendu (passage WebGL/Pixi.js), re-test, report.

**Dépendances :** STORY-INF-001, STORY-TC-001.

**Risque :** très élevé. C'est **le** POC qui peut tuer le projet.

---

##### STORY-POC-002 — POC #2 : RDKit.js bundle/latence (BLOQUANT)

**Priorité :** Must Have / **bloquante**
**Points :** 5
**Driver :** D1 + FR-018

**User story :**
> En tant qu'architecte, je veux la preuve mesurée que RDKit.js (WASM) tient les contraintes de bundle et de latence frontend, ou identifier le fallback OpenChemLib.

**Acceptance criteria :**
- [ ] Mini-app de mesure sous `packages/chem-poc/`.
- [ ] RDKit.js chargé paresseusement dans un Web Worker (jamais dans le main thread).
- [ ] Mesures réalisées sur 3 navigateurs (Chromium, Firefox, WebKit) :
  - Bundle size compressé (target < 6 MB)
  - Latence parsing SMILES `< 200 ms` pour ≤ 100 atomes (test set : 20 SMILES de référence)
  - First interactive `< 2 s` sur connexion 4G simulée (Chrome DevTools throttling)
- [ ] Mêmes mesures avec OpenChemLib JS (fallback profil démo).
- [ ] Rapport `docs/poc/poc-002-rdkit-js.md` avec mesures, comparaison, verdict.
- [ ] **Critère de succès :** trois critères atteints simultanément avec RDKit.js.
- [ ] **Critère d'échec partiel :** OpenChemLib JS comme implémentation par défaut profil **full** (et plus seulement profil démo). Architecture amendée (TO-002).

**Dépendances :** STORY-INF-001.

---

##### STORY-POC-003 — POC #3 kickoff : CDXML (validation différée)

**Priorité :** Should Have / kickoff Sprint 0, validation finale en début V1
**Points :** 3
**Driver :** FR-043 (V1)

**User story :**
> Démarrer maintenant la collecte du corpus CDXML URD Abbaye et l'exploration technique du parsing, parce que le calendrier de collecte (2-4 semaines) ne tient pas dans la fenêtre V1 si on attend.

**Acceptance criteria :**
- [ ] **Jour 1 du Sprint 0 :** envoi du mail URD Abbaye (template Annexe A de `docs/test-corpus-plan.md`).
- [ ] Scaffold parser harness : `backend/kendraw_chem/convert/cdxml.py` placeholder + tests Python avec fixtures synthétiques.
- [ ] Exploration technique : parser 5-10 fichiers CDXML publiquement disponibles (échantillons GitHub, Wikipedia, articles open access). Documenter ce qui est parsable / pas parsable / unclear.
- [ ] Rapport `docs/poc/poc-003-cdxml-kickoff.md` avec : approche envisagée (RDKit MolFromMolBlock chain vs parser TS custom), limitations identifiées, dépendance corpus URD Abbaye, prochaine étape (validation finale post-corpus).

**Dépendances :** STORY-INF-002 (backend skeleton).

**Validation finale différée :** quand le corpus URD Abbaye arrive (calendrier 2-4 semaines après envoi mail), une story V1 dédiée valide la couverture sur le corpus réel.

---

##### STORY-POC-004 — POC #4 kickoff : couverture IUPAC (validation différée)

**Priorité :** Should Have / kickoff Sprint 0, validation finale pré-V1
**Points :** 3
**Driver :** FR-040 + FR-041 (V1)

**User story :**
> Démarrer maintenant le spike OPSIN pour mesurer l'impact (latence, taille image Docker) et acter ou écarter la dépendance JVM avant que ce soit un problème en V1.

**Acceptance criteria :**
- [ ] Évaluation `py2opsin` vs sidecar JVM bundlé : choix justifié.
- [ ] Intégration minimale dans `backend/kendraw_chem/naming/` (V1 module placeholder).
- [ ] Mesure cold start latence OPSIN (premier appel après import).
- [ ] Mesure impact taille image Docker backend (`python:3.11-slim` + JRE) — cible documentée < 300 MB.
- [ ] Petit test set synthétique (20 noms simples + 20 complexes) pour première mesure de couverture.
- [ ] Rapport `docs/poc/poc-004-iupac-kickoff.md` avec mesures, recommandations, prochaine étape.

**Dépendances :** STORY-INF-002.

**Validation finale différée :** constitution complète du test set IUPAC (200 noms + 200 structures, cf. `docs/test-corpus-plan.md` test sets #3 et #4) en pré-V1 avant lock-in du critère 80 %.

---

#### Groupe D — Test corpus (2 pts)

##### STORY-TC-001 — Test corpus #6 : générateur de structures synthétiques pour benchmarks perf

**Priorité :** Must Have / input POC #1
**Points :** 2
**Driver :** D1 (NFR-001)

**User story :**
> En tant que dev POC, j'ai besoin de structures synthétiques déterministes 100/250/500/750 atomes pour benchmarker reproductiblement le renderer.

**Acceptance criteria :**
- [ ] Script `scripts/gen-perf-corpus.ts` (TS, exécuté via tsx ou node natif) génère structures déterministes (seed fixe).
- [ ] Patterns : long chain carbone, fused ring cluster, dendrimère, mix aléatoire — pour stresser différents code paths du renderer.
- [ ] Sortie : `tests/fixtures/perf-benchmarks/synthetic/{chain,rings,dendrimer,mix}-{100,250,500,750}.mol` (16 fichiers).
- [ ] `manifest.json` documente seed, count, generation rules.

**Dépendances :** STORY-INF-001.

---

### 2.3 Sprint 0 — Critères go/no-go pour passer en Sprint 1

Sprint 1 démarre **uniquement** quand **tous** les critères suivants sont satisfaits :

- [ ] STORY-INF-001 à 009 closes (infra repo + CI + Docker fonctionnels).
- [ ] STORY-ADR-001 et 002 closes (ADRs initiaux écrits et mergés).
- [ ] **STORY-POC-001 verte** : verdict `docs/poc/poc-001-perf-500-atomes.md` = **PASS** (30 fps + frame budget < 16 ms à 500 atomes).
- [ ] **STORY-POC-002 verte** : verdict `docs/poc/poc-002-rdkit-js.md` = **PASS** ou décision documentée de bascule vers OpenChemLib en profil full.
- [ ] STORY-POC-003 close (kickoff) — pas de validation finale requise.
- [ ] STORY-POC-004 close (kickoff) — pas de validation finale requise.
- [ ] STORY-TC-001 close (corpus perf généré).
- [ ] CI verte sur `main` (lint + typecheck + tests + build + license).
- [ ] `docker compose up` lance frontend + backend, `/health` répond OK.

**Si POC #1 échoue :** retour au document d'architecture (§3.1, §5.1.3, §10.2), amendement de la couche `Renderer` vers WebGL/Pixi.js, re-test. Sprint 1 attend.

**Si POC #2 échoue :** bascule documentée vers OpenChemLib en profil full, ADR-003 amendé, re-test. Sprint 1 démarre quand même (la décision est tranchée, le code peut suivre).

### 2.4 Budget calendrier Sprint 0

| Élément                      | Effort   | Calendrier   |
|------------------------------|----------|---------------|
| Infra (INF-001 à 009)        | 19 pts   | ~4 semaines   |
| ADRs (ADR-001 et 002)        | 4 pts    | ~1 semaine    |
| POC #1 (perf, bloquant)      | 8 pts    | ~2 semaines   |
| POC #2 (RDKit.js, bloquant)  | 5 pts    | ~1 semaine    |
| POC #3 kickoff (CDXML)       | 3 pts    | ~0.5 semaine  |
| POC #4 kickoff (IUPAC)       | 3 pts    | ~0.5 semaine  |
| TC-001 (perf corpus)         | 2 pts    | ~0.5 semaine  |
| **Total**                    | **45 pts** | **~9 semaines (séquentiel solo)** |

**Note :** la séquentialité solo + dépendances entre stories rend la parallélisation très limitée. Le calendrier est honnête.

**Date estimée fin Sprint 0 :** ~ mi-juin 2026 (si démarrage mi-avril).

---

## 3. Sprint 1 — Premier slice vertical applicatif

### 3.1 Goal

> *« Cliquer sur le canvas → un atome apparaît à l'endroit du clic. Pas de bonds, pas de persistance, pas de palette, pas de glassmorphism. Le pipeline scene → renderer → UI fonctionne end-to-end. »*

C'est la **plus petite démo crédible** qui exerce les 3 packages cœur (`@kendraw/scene`, `@kendraw/renderer-canvas`, `@kendraw/ui`) et valide que l'architecture en couches tient en pratique. La persistance et les autres features arrivent à partir de Sprint 2.

### 3.2 Stories détaillées

| ID            | Titre                                                              | Points |
|---------------|--------------------------------------------------------------------|--------|
| STORY-001     | `@kendraw/scene` — types de base + SceneStore (subscribe/dispatch) | 2      |
| STORY-002     | `@kendraw/scene` — Command bus + AddAtom + RemoveAtom              | 2      |
| STORY-003     | `@kendraw/renderer-canvas` minimal — render atomes                 | 3      |
| STORY-004     | `@kendraw/ui` shell + tool controller AddAtom                      | 3      |
| **Total**     |                                                                    | **10** |

#### STORY-001 — `@kendraw/scene` types + SceneStore

**Points :** 2
**Driver :** D1 + D7

**User story :**
> Définir le contrat de données scène pour que tous les autres packages (renderer, persistence, io, ui) puissent compiler contre.

**Acceptance criteria :**
- [ ] Types TS définis dans `packages/scene/src/types.ts` : `Document`, `Page`, `Atom`, `Bond`, `Arrow`, `Annotation`, `Group`, `Viewport`, `Point`, `BezierGeometry`, `ArrowAnchor` (cf. §6.1 architecture).
- [ ] `SceneStore` interface dans `packages/scene/src/store.ts` avec `getState()`, `subscribe(listener)`, `dispatch(command)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`.
- [ ] Implémentation `createSceneStore(initialDoc?: Document): SceneStore`.
- [ ] Tests Vitest couvrant : initial state, subscribe/unsubscribe, basic dispatch (no command applied yet).
- [ ] Pas d'Immer encore (vient avec STORY-002).
- [ ] Pas de spatial index encore (vient en Sprint 3 avec sélection).

**Dépendances :** Sprint 0 vert.

---

#### STORY-002 — `@kendraw/scene` Command bus + AddAtom + RemoveAtom

**Points :** 2
**Driver :** D1

**User story :**
> Ajouter et supprimer un atome dans le scene model via le command bus, avec structural sharing Immer.

**Acceptance criteria :**
- [ ] Type discriminé `Command` dans `packages/scene/src/commands.ts` : `AddAtomCommand`, `RemoveAtomCommand`.
- [ ] Reducer `applyCommand(state: Document, cmd: Command): Document` utilisant Immer pour le structural sharing.
- [ ] `dispatch()` sur le store applique le command et émet un événement aux listeners avec un `SceneDiff` minimal `{ type: 'atom-added' | 'atom-removed', id }`.
- [ ] History stack basique (push command sur dispatch). **Pas encore d'undo/redo fonctionnel** — vient en Sprint 3 avec sélection. La méthode `undo()/redo()` lance un `NotImplementedError`.
- [ ] Tests Vitest couvrant : add → state contains atom, remove → state doesn't, multiple add → all present, structural sharing (`prev !== next` mais `prev.metadata === next.metadata`).
- [ ] UUID v4 pour les IDs (lib `uuid` ou `crypto.randomUUID()` natif).

**Dépendances :** STORY-001.

---

#### STORY-003 — `@kendraw/renderer-canvas` minimal

**Points :** 3
**Driver :** D1

**User story :**
> Dessiner les atomes du scene model sur un `<canvas>` HTML5. Pas de bonds, pas de couches, pas de dirty regions — full repaint à chaque diff.

**Acceptance criteria :**
- [ ] Classe `CanvasRenderer implements Renderer` dans `packages/renderer-canvas/src/renderer.ts`.
- [ ] `attach(container: HTMLElement)` crée le `<canvas>` et le DPR-aware (devicePixelRatio).
- [ ] `render(doc: Document)` repeint tous les atomes de la page active : un cercle coloré par numéro atomique (palette CPK simplifiée : C noir, H blanc, O rouge, N bleu), un label texte au centre.
- [ ] Pas de bonds dans cette story (Sprint 2).
- [ ] Pas de dirty regions, pas de layer cache, pas de spatial index : full repaint à chaque appel.
- [ ] `detach()` cleanup.
- [ ] Tests Vitest avec jsdom (mocking Canvas) : `render()` ne throw pas pour 0/1/100 atomes.
- [ ] Test visuel (snapshot Playwright sur navigateur réel) en bonus mais non bloquant.

**Dépendances :** STORY-001.

---

#### STORY-004 — `@kendraw/ui` shell + tool controller AddAtom

**Points :** 3
**Driver :** D7

**User story :**
> En tant qu'utilisateur, je vois un canvas vide en plein écran ; je clique → un atome de carbone apparaît à l'endroit du clic.

**Acceptance criteria :**
- [ ] App React minimale dans `packages/ui/src/App.tsx` : un seul composant `<Canvas>` plein écran, fond noir.
- [ ] `<Canvas>` instancie un `SceneStore`, un `CanvasRenderer`, et binde un `onClick` qui dispatch un `AddAtomCommand` aux coords du clic (carbone par défaut, Z=6).
- [ ] Connexion store ↔ renderer via `useSyncExternalStore` (cf. §state mgmt architecture).
- [ ] Vite dev server fonctionne, `pnpm dev` ouvre `http://localhost:5173` et l'utilisateur peut créer des atomes en cliquant.
- [ ] Pas de palette d'outils, pas de panneau de propriétés, pas de tabs : un seul écran simplissime.
- [ ] Test E2E Playwright minimal : `goto / click click click → expect 3 canvas pixels colorés` (assertion via snapshot ou pixel sampling).

**Dépendances :** STORY-001, STORY-002, STORY-003.

---

### 3.3 Définition de done — Sprint 1

Une story est "done" en Sprint 1 si :

- [ ] Code committé sur `main` via PR mergée (CI verte requise).
- [ ] Tests unitaires Vitest écrits, coverage ≥ 80 % sur le nouveau code des packages cœur (`scene`, `renderer-canvas`).
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm depcruise`, `pnpm size-limit`, `pnpm license-check` verts.
- [ ] Acceptance criteria de la story tous cochés.
- [ ] Reviewé (par soi-même + un sleep, ou par le futur `claude` reviewer si PR depuis Claude Code).
- [ ] Documentation inline (JSDoc/TSDoc) sur les exports publics du package.

**Pas requis en Sprint 1 :**
- Tests E2E exhaustifs (un seul smoke test suffit)
- Visual regression
- Tests cross-browser (vient en Sprint 17 hardening)
- A11y axe-core (vient en Sprint 17)

### 3.4 Démo Sprint 1

À la fin de Sprint 1, capture vidéo / screenshot de :
- `pnpm dev` lance le frontend
- Canvas vide noir
- 3-4 clicks à différents endroits
- 3-4 atomes carbone visibles, positions correctes
- Reload page → canvas vide à nouveau (pas de persistance, c'est attendu)

→ Pousser sur le mode démo statique pour permettre aux contacts URD Abbaye de toucher le truc et donner un premier feedback.

---

## 4. Sprints 2 à 18 — Esquisse thématique

**⚠ Tous les détails ci-dessous sont indicatifs et seront raffinés en début de chaque sprint via `/create-story`.** La sprint planning rolling-wave est délibérée : planifier 18 sprints en story-level aujourd'hui produirait 80 % de fiction.

### 4.1 Tableau récapitulatif

| Sprint | Thème                                            | Epics couverts        | FRs principaux         | Stories est. | Points est. |
|--------|--------------------------------------------------|-----------------------|------------------------|---------------|-------------|
| 1      | Premier slice vertical (atomes only)             | EPIC-001              | FR-001, FR-002 (basic) | 4             | 10          |
| 2      | Bonds + persistance manuelle                     | EPIC-001, EPIC-004    | FR-003, save/load IDB  | 3             | 10          |
| 3      | Sélection + Undo/Redo + spatial index           | EPIC-002              | FR-008, FR-009         | 3             | 10          |
| 4      | Multi-tabs + auto-save (worker)                  | EPIC-004              | FR-016, FR-017         | 3             | 10          |
| 5      | Glasswerk UI baseline + shortcuts initial set   | EPIC-004              | FR-014 (partiel), FR-019 | 3           | 10          |
| 6      | Atomes complets (Z full, charges, labels) + bond styles | EPIC-001        | FR-002 (full), FR-003 (full), FR-006 | 3 | 10          |
| 7      | Rings library + quick chain + valence validation | EPIC-001              | FR-004, FR-005, FR-007 | 3             | 10          |
| 8      | Edit operations + clipboard + transforms        | EPIC-002              | FR-010                 | 3             | 10          |
| 9      | Frontend SMILES (`@kendraw/chem`) + property panel | EPIC-005, EPIC-004 | FR-018, FR-015         | 3             | 10          |
| 10     | Backend compute + format conversion MVP         | EPIC-006              | FR-021, FR-022         | 3             | 10          |
| 11     | File I/O — import + export PNG/SVG              | EPIC-007              | FR-023, FR-024 (partiel) | 3           | 10          |
| 12     | Reaction arrows + conditions                    | EPIC-003              | FR-011, FR-013         | 3             | 10          |
| 13     | Curly arrows part 1 — geometry & rendering      | EPIC-003              | FR-012 (partiel)       | 3             | 10          |
| 14     | Curly arrows part 2 — anchoring & serialization | EPIC-003              | FR-012 (complet)       | 3             | 10          |
| 15     | Citation + EXIF metadata + image clipboard      | EPIC-012, EPIC-007    | FR-025, FR-026, FR-027 | 3             | 10          |
| 16     | Self-hosted bundle + static demo + i18n scaffold | EPIC-011             | FR-028, FR-029         | 3             | 10          |
| 17     | MVP hardening — a11y + cross-browser + perf bench | NFR-001/002/006     | NFR validation         | 3             | 10          |
| 18     | Doc publish + release prep `v0.1.0`              | EPIC-012, NFR-011/012 | release.yml, Zenodo, 5 figures réf | 3 | 10          |
| **Total** |                                              |                       |                        | **51**        | **170**     |

### 4.2 Détail thématique sprint par sprint

#### Sprint 2 — Bonds + persistance manuelle

**Goal :** *« L'utilisateur peut dessiner des liaisons entre atomes et sauvegarder/recharger explicitement son document en `.kdx`. »*

- Story 2.1 : `@kendraw/scene` — Bond model + AddBond/RemoveBond commands. (3 pts)
- Story 2.2 : `@kendraw/renderer-canvas` — render bonds (single/double/triple basique, lignes droites). (3 pts)
- Story 2.3 : `@kendraw/persistence` — Dexie schema v1 + saveDocument/loadDocument synchrone (pas de scheduler), bouton "Save" / "Load" dans le UI. (4 pts)

**Démo :** dessiner une H₂O, sauver, reload → toujours là.

---

#### Sprint 3 — Sélection + Undo/Redo + spatial index

**Goal :** *« L'utilisateur peut sélectionner, supprimer, et annuler/refaire ses actions. »*

- Story 3.1 : `@kendraw/scene` — Spatial index R-tree (`rbush`) + `hitTest()` méthode + Selection model. (3 pts)
- Story 3.2 : `@kendraw/scene` — Undo/redo réel avec history merging (drag continu = un seul move). (4 pts)
- Story 3.3 : `@kendraw/ui` — Tool controllers Select (single click + shift + rectangle drag). Ctrl+Z, Ctrl+Y, Delete key. (3 pts)

**Démo :** dessiner, sélectionner, supprimer, Ctrl+Z, refait apparaître.

---

#### Sprint 4 — Multi-tabs + auto-save worker

**Goal :** *« L'utilisateur ouvre plusieurs documents en onglets, l'auto-save sécurise tout en background, le restore-on-reload fonctionne. »*

- Story 4.1 : `@kendraw/persistence` — AutoSaveScheduler avec debounce 5 s, Web Worker dédié, write-ahead. (4 pts)
- Story 4.2 : `@kendraw/ui` — Tab bar component, multi-document state Zustand, restore-on-reload prompt. (4 pts)
- Story 4.3 : Tests crash-resilience automatisés (interruption worker → cohérence reload). (2 pts)

**Démo :** ouvrir 3 onglets, dessiner différemment, fermer brutalement la fenêtre, rouvrir → tout est là.

---

#### Sprint 5 — Glasswerk UI baseline + shortcuts initial

**Goal :** *« L'app commence à ressembler à Kendraw : dark mode glassmorphism, palette d'outils minimaliste, raccourcis clavier ChemDraw-compat de base. »*

- Story 5.1 : Design system Glasswerk — tokens CSS variables (cf. UX doc Part 6), composants atomiques (Button, Panel, Tooltip). Theme dark/light switcher. (4 pts)
- Story 5.2 : Tool palette latérale gauche avec ~10 outils (Select, Atom, Bond, Eraser, Pan). (3 pts)
- Story 5.3 : Keyboard shortcuts initial set (~15 raccourcis ChemDraw-compat) + cheatsheet `?` modal. (3 pts)

**Démo :** l'app a son identité visuelle. Premier vrai screenshot publiable.

---

#### Sprint 6 — Atomes complets + bond styles

**Goal :** *« Tous les éléments du tableau périodique placables, charges formelles, labels custom, tous les types de liaisons MVP rendus. »*

- Story 6.1 : Periodic table picker UI (modal ou popover) + 118 éléments. (3 pts)
- Story 6.2 : Charges formelles + labels custom (`R`, `R1`, `Et`, etc.) + implicit hydrogens. (4 pts)
- Story 6.3 : Bond cycling (clic répété), style variants single/double/triple/aromatic/wedge/dash rendering. (3 pts)

**Démo :** dessiner une glucose avec stéréo wedge/dash.

---

#### Sprint 7 — Rings + quick chain + valence

**Goal :** *« Drawing rapide d'un squelette organique : insérer un ring d'un clic, drag pour faire une chaîne carbone, warnings de valence en temps réel. »*

- Story 7.1 : Ring library MVP (8 rings : benzène, cyclopentane, cyclohexane, cyclopropane, furan, pyridine, pyrrole, thiophène). Tool palette + shortcuts. (3 pts)
- Story 7.2 : Quick carbon chain — click-drag-release pour générer chaîne zigzag. (3 pts)
- Story 7.3 : Valence validator — highlights atomes invalides, tooltip explicatif, < 100 ms feedback. (4 pts)

**Démo :** dessiner caféine en moins d'une minute.

---

#### Sprint 8 — Edit operations + clipboard + transforms

**Goal :** *« Copy/cut/paste/duplicate fonctionnent, rotation libre + snap, miroir H/V. »*

- Story 8.1 : Clipboard internal (copy/cut/paste/duplicate de sélection). (3 pts)
- Story 8.2 : Free rotation via handle + snap rotation 15°/30°/45°/90°. (4 pts)
- Story 8.3 : Mirror H/V avec gestion stéréochimie. (3 pts)

---

#### Sprint 9 — Frontend SMILES + property panel

**Goal :** *« Le panneau de propriétés affiche formula/MW/SMILES temps réel, paste-SMILES rend instantanément. »*

- Story 9.1 : `@kendraw/chem` adapter implémentation (post-POC #2 : RDKit.js ou OpenChemLib selon verdict). Web Worker integration. (4 pts)
- Story 9.2 : Property panel UI (panneau latéral droit, formula, MW, canonical SMILES, copy buttons). (3 pts)
- Story 9.3 : Paste SMILES depuis clipboard → parse → render via SceneStore. (3 pts)

---

#### Sprint 10 — Backend compute + format conversion MVP

**Goal :** *« Le backend FastAPI tourne, expose /compute/properties et /convert pour MOL/SDF/SMILES/InChI. »*

- Story 10.1 : `kendraw_chem.ComputeService` (formula, MW, exact mass, canonical SMILES, InChI, InChIKey). Pydantic schemas, OpenAPI auto. (4 pts)
- Story 10.2 : `kendraw_chem.ConvertService` (MOL ↔ SDF ↔ SMILES ↔ InChI). Tests round-trip avec test corpus #1 (à constituer en parallèle). (4 pts)
- Story 10.3 : `@kendraw/api-client` — OpenAPI client gen + TanStack Query integration. (2 pts)

---

#### Sprint 11 — File I/O import + export PNG/SVG

**Goal :** *« Ouvrir un .mol/.sdf/.smi par drag-drop, exporter le doc courant en PNG (300 DPI) et SVG. »*

- Story 11.1 : `@kendraw/io` — MOL v2000 parser/writer frontend natif. Tests round-trip via fixture. (4 pts)
- Story 11.2 : Drag-drop file import flow (multi-file = multi-tab, SDF multi-page = multi-page in tab). (3 pts)
- Story 11.3 : `@kendraw/renderer-svg` — SVG export pipeline + PNG via SVG → Image → Canvas → Blob. (3 pts)

---

#### Sprint 12 — Reaction arrows + conditions

**Goal :** *« Schémas réactionnels avec arrows et annotations conditions (sans curly). »*

- Story 12.1 : Arrow model + tool palette + rendering (forward, equilibrium, reversible). (4 pts)
- Story 12.2 : Annotation rich text model (sub/super/Greek) + rendering. (3 pts)
- Story 12.3 : Anchor annotations to arrows (above/below slots). (3 pts)

---

#### Sprint 13 — Curly arrows part 1 (geometry & rendering)

**Goal :** *« Dessiner une flèche incurvée Bézier, contrôler ses points de contrôle visuellement. »*

- Story 13.1 : BezierGeometry model + render (Canvas + SVG). (3 pts)
- Story 13.2 : Control points UI (poignées draggables après sélection de la flèche). (4 pts)
- Story 13.3 : Curly arrow tool (single-headed radical + double-headed pair) avec courbure par défaut intelligente selon anchors. (3 pts)

**Risque :** c'est la story UX la plus risquée du MVP (cf. PRD). Prévoir un buffer mental.

---

#### Sprint 14 — Curly arrows part 2 (anchoring & serialization)

**Goal :** *« Les flèches incurvées s'ancrent sur atomes/liaisons/lone-pairs et survivent à un round-trip .kdx + MOL extension. »*

- Story 14.1 : ArrowAnchor model + hit-test pour anchor (atom, bond avec t paramétrique, lone-pair indexé). (4 pts)
- Story 14.2 : Sérialisation `.kdx` complète (incluant arrows + anchors). Round-trip test. (3 pts)
- Story 14.3 : MOL extension `<kendraw:curly-arrow>` block — export et import préservant la courbure pour Kendraw, ignoré gracieusement par d'autres outils. (3 pts)

---

#### Sprint 15 — Citation + EXIF metadata + image clipboard

**Goal :** *« La demande de citation est visible (splash + About), les exports embarquent les métadonnées de citation, copy-paste image vers Word/PowerPoint fonctionne cross-OS. »*

- Story 15.1 : Splash screen + About page (`<CitationSplash>`, `<AboutPage>`, BibTeX copy button, DOI placeholder). (3 pts)
- Story 15.2 : EXIF/SVG metadata pipeline injection (FR-027 : PNG `tEXt`, SVG `<metadata>`, conformité aux fixtures de test). (3 pts)
- Story 15.3 : Image clipboard via `ClipboardItem` API (PNG + SVG variants), test cross-OS Win/Mac/Linux + Word/PowerPoint/LaTeX. (4 pts)

---

#### Sprint 16 — Self-hosted bundle + static demo + i18n scaffold

**Goal :** *« Kendraw se déploie en `docker compose up`, le mode démo statique tourne sur GitHub Pages, le code est prêt pour les traductions communautaires. »*

- Story 16.1 : Dockerfile prod finalisé + docker-compose.yml + nginx.conf prod + test offline. (3 pts)
- Story 16.2 : Static-demo build profile + GitHub Pages workflow + stub api-client + `useBackendAvailability()` hook + UI degradation visible. (4 pts)
- Story 16.3 : Lingui i18n scaffold + extraction statique + locale EN canonique + lint anti-hardcoded-strings. (3 pts)

---

#### Sprint 17 — MVP hardening (a11y + cross-browser + perf)

**Goal :** *« Validations finales NFR : axe-core clean, Playwright passe sur 3 navigateurs, perf bench codifié et vert. »*

- Story 17.1 : axe-core integration Playwright + fixes a11y nécessaires. `docs/accessibility.md` final. (3 pts)
- Story 17.2 : Playwright matrix complète (Chromium, Firefox, WebKit), fix éventuels bugs cross-browser. `docs/browser-support.md`. (4 pts)
- Story 17.3 : Codification du bench POC #1 sous `packages/scene/bench/`, intégration release workflow, snapshot des résultats. (3 pts)

---

#### Sprint 18 — Doc publish + release prep `v0.1.0`

**Goal :** *« Tag `v0.1.0`, doc publiée, Zenodo DOI minté, 5 figures de référence MVP validées par URD Abbaye. »*

- Story 18.1 : mkdocs setup (ADR-002 acté) + getting-started.md + deployment.md + contributing.md final + CI publish to GitHub Pages. (4 pts)
- Story 18.2 : 5 figures de référence MVP (TC-005 partial) créées, validées via Inkscape headless en CI, validées par URD Abbaye. (3 pts)
- Story 18.3 : `release.yml` workflow (build images, push GHCR, GitHub Release, Zenodo DOI mint, update CITATION.cff via PR auto). Tag `v0.1.0`. (3 pts)

**Démo finale :** annonce publique, `https://kendraw.io/demo` (ou GitHub Pages URL), instances URD Abbaye en production.

---

## 5. Backlog MVP complet — vue stories par catégorie

### 5.1 Stories applicatives par epic

| Epic ID  | Epic Name                              | Stories MVP | Sprints      |
|----------|----------------------------------------|-------------|---------------|
| EPIC-001 | Drawing Engine Foundation              | 9           | 1, 2, 6, 7    |
| EPIC-002 | Editing & Manipulation                 | 6           | 3, 8          |
| EPIC-003 | Reactions & Mechanisms                 | 9           | 12, 13, 14    |
| EPIC-004 | Modern Workspace UI                    | 9           | 4, 5, 9       |
| EPIC-005 | Frontend Chemistry Engine              | 1           | 9             |
| EPIC-006 | RDKit Backend Compute Service          | 3           | 10            |
| EPIC-007 | File Import / Export & Interop         | 6           | 11, 15        |
| EPIC-011 | Self-Hosted Deployment & Demo          | 3           | 16            |
| EPIC-012 | Attribution, Citation & Project Health | 5           | 15, 17, 18    |
| **Total**| **9 epics MVP**                        | **51**      | **Sprints 1-18** |

(EPIC-008, EPIC-009 hors de leurs parties MVP, EPIC-010 sont 100 % V1 → différés.)

### 5.2 Stories infra et transverse

| Catégorie         | Sprint  | Stories                                   |
|-------------------|---------|-------------------------------------------|
| Infrastructure    | 0       | INF-001 à INF-009 (9 stories, 19 pts)      |
| ADR               | 0       | ADR-001 à ADR-002 (2 stories, 4 pts)       |
| POC               | 0       | POC-001 à POC-004 (4 stories, 19 pts)      |
| Test corpus       | 0       | TC-001 (1 story, 2 pts)                    |
| **Total Sprint 0**| **0**   | **16 stories, 45 pts**                     |

### 5.3 Stories différées V1 (non décomposées dans ce plan)

20 FR V1 (FR-030 à FR-049) seront décomposés dans un **second `/sprint-planning`** post-MVP, après retour terrain URD Abbaye sur la `v0.1.0`.

Estimation rough order of magnitude (pour budgétaire JB) :
- ~30-40 stories V1 supplémentaires
- ~100-130 points
- ~10-13 sprints applicatifs
- ~5-7 mois de calendrier additionnel
- **Cible `v1.0.0` :** ~16-18 mois après démarrage Sprint 0 = cohérent avec cible PRD 18 mois.

---

## 6. Matrice de traçabilité FR → Story → Sprint

Chaque FR MVP du PRD est mappée à une (ou plusieurs) story de ce backlog.

| FR ID  | FR Name                                | Story principale         | Sprint |
|--------|----------------------------------------|---------------------------|--------|
| FR-001 | Canvas 2D interactif                   | STORY-003 + Sprint 5 (zoom/pan) | 1, 5   |
| FR-002 | Atom & element placement               | STORY-002 + Sprint 6      | 1, 6   |
| FR-003 | Bond types MVP                         | Sprint 2 + Sprint 6       | 2, 6   |
| FR-004 | Ring library MVP                       | Sprint 7                  | 7      |
| FR-005 | Quick carbon chain                     | Sprint 7                  | 7      |
| FR-006 | Wedge/dash display                     | Sprint 6                  | 6      |
| FR-007 | Real-time valence validation           | Sprint 7                  | 7      |
| FR-008 | Selection tools MVP                    | Sprint 3                  | 3      |
| FR-009 | Unlimited undo/redo                    | Sprint 3                  | 3      |
| FR-010 | Edit operations + transforms           | Sprint 8                  | 8      |
| FR-011 | Reaction arrows                        | Sprint 12                 | 12     |
| FR-012 | Curly arrows                           | Sprints 13 + 14           | 13, 14 |
| FR-013 | Reaction conditions                    | Sprint 12                 | 12     |
| FR-014 | Glassmorphism UI + dark/light          | Sprint 5                  | 5      |
| FR-015 | Real-time property panel               | Sprint 9                  | 9      |
| FR-016 | Multi-document tabs                    | Sprint 4                  | 4      |
| FR-017 | Local auto-save                        | Sprint 4                  | 4      |
| FR-018 | Frontend SMILES parsing                | Sprint 9 (post POC-002)   | 9      |
| FR-019 | ChemDraw shortcuts                     | Sprint 5                  | 5      |
| FR-020 | Drag-drop file import                  | Sprint 11                 | 11     |
| FR-021 | RDKit backend compute API              | Sprint 10                 | 10     |
| FR-022 | Format conversion (MVP)                | Sprint 10                 | 10     |
| FR-023 | MVP file import                        | Sprint 11                 | 11     |
| FR-024 | MVP file export                        | Sprint 11                 | 11     |
| FR-025 | Image copy-paste                       | Sprint 15                 | 15     |
| FR-026 | Citation splash / About                | Sprint 15                 | 15     |
| FR-027 | EXIF / metadata footprint              | Sprint 15                 | 15     |
| FR-028 | Self-hosted bundle                     | Sprint 16                 | 16     |
| FR-029 | Static demo mode                       | Sprint 16                 | 16     |

**Couverture :** 29/29 FR MVP. Aucune orpheline.

---

## 7. Risques et mitigation

### Risques bloquants (POC-gated)

| Risque                                                   | Probabilité | Impact     | Mitigation                                                       |
|----------------------------------------------------------|-------------|------------|------------------------------------------------------------------|
| **POC #1 échoue** (Canvas 2D ne tient pas 500 atomes)   | Moyenne     | Catastrophe | Couche d'abstraction `Renderer` permet bascule WebGL/Pixi.js. ADR-002 amendé. Sprint 1 attendu jusqu'à POC vert. |
| **POC #2 échoue** (RDKit.js bundle/latence)              | Faible      | Important  | Bascule OpenChemLib JS en profil full. ADR-003 amendé. Sprint 1 démarre quand même. |

### Risques calendaires

| Risque                                                   | Probabilité | Impact     | Mitigation                                                       |
|----------------------------------------------------------|-------------|------------|------------------------------------------------------------------|
| **Capacité 10h/sem non tenue dans la durée**             | Moyenne     | Modéré     | Re-baseline en rétro Sprint 2. Repli possible à 8h/sem (+~3 mois calendaire). |
| **Curly arrows (Sprints 13-14) plus dur que prévu**     | Élevée      | Important  | Bloc de 2 sprints alloué (au lieu de 1). Si dérive, c'est le **seul** MVP item qui peut slipper en V1 (cf. PRD FR-012). |
| **Burnout solo dev**                                     | Moyenne     | Catastrophe | Cadence soutenable (10h/sem, pas 30h), buffer 15 % implicite, pas de week-end-killers, OSS appropriabilité (D7) pour contributeurs externes. |
| **Sprints "off" (vacances, life events)**                | Élevée      | Modéré     | Buffer 15 % implicite. Plan de 18 sprints sur ~22 semaines calendaires. |

### Risques techniques

| Risque                                                   | Probabilité | Impact     | Mitigation                                                       |
|----------------------------------------------------------|-------------|------------|------------------------------------------------------------------|
| **Inconsistance IndexedDB Safari WebKit**                | Moyenne     | Modéré     | Stratégie chunk-based pour Safari, prompt utilisateur quota, doc dédiée. Découverte probable Sprint 4 ou Sprint 17. |
| **Image Docker backend trop lourde** (RDKit ~150MB +OPSIN ~100MB) | Faible | Modéré | OPSIN différé V1 (TO-008). Image MVP reste lean ~200 MB. POC #4 mesure dès Sprint 0. |
| **WASM cold start mode démo**                            | Moyenne     | Modéré     | OpenChemLib en profil démo. POC #2 valide le bundle alternatif. |
| **CI GitHub Actions quota dépassé** (2000 min/mois OSS) | Faible      | Faible     | Workflows séparés, paths-filter, skip CI sur drafts. Si dépassé : self-hosted runner sur le NAS de JB. |

### Risques externes

| Risque                                                   | Probabilité | Impact     | Mitigation                                                       |
|----------------------------------------------------------|-------------|------------|------------------------------------------------------------------|
| **URD Abbaye ne fournit pas le corpus CDXML**            | Faible      | Modéré (V1 only) | Sollicitation envoyée Sprint 0 jour 1. Plan B : corpus public + scope FR-043 réduit en V1. |
| **Changement upstream RDKit casse l'API Python**         | Faible      | Modéré     | Version pinnée explicite dans `pyproject.toml`. Tests en CI sur cette version. Upgrade contrôlé. |

---

## 8. Dépendances externes

| Dépendance                          | Type            | Sprint  | Notes                                         |
|-------------------------------------|-----------------|---------|------------------------------------------------|
| Compte GitHub + repo créé           | Préalable       | Sprint 0 | Existant (JB)                                  |
| Compte GHCR (GitHub Container Registry) | Préalable   | Sprint 0 | Lié au compte GitHub                           |
| Compte Zenodo (DOI minting)         | Préalable       | Sprint 18 | Création + lien GitHub repo                   |
| URD Abbaye CDXML corpus             | Externe         | Sprint 0 → ~Sprint 4-6 (calendaire) | Sollicitation jour 1 Sprint 0 |
| RDKit upstream (version pinnée)     | Lib externe     | Continu  | Pinning strict via uv.lock                    |
| Polices Inter / IBM Plex (subset)   | Asset           | Sprint 11 | Téléchargement + subset CI                   |
| Validation URD Abbaye (figures réf.)| Externe         | Sprint 18 | À planifier en avance                         |

---

## 9. Définition de Done — globale (toutes stories sauf Sprint 0)

Une story est "done" en Sprints 1-18 si :

- [ ] Code committé sur `main` via PR mergée.
- [ ] **CI verte** : lint, typecheck, tests unitaires (coverage ≥ 80 % chemins compute), build, depcruise (frontières packages), size-limit, license-check.
- [ ] Tests unitaires Vitest / pytest écrits pour le nouveau code.
- [ ] **Acceptance criteria** de la story tous cochés.
- [ ] Documentation inline (TSDoc / docstring) sur les exports publics.
- [ ] Self-review effectuée (+ sleep idéalement, ou peer review IA via Claude Code).
- [ ] Si la story touche une frontière publique : ADR créé ou amendé.
- [ ] Mention dans le `CHANGELOG.md` (conventional commits → auto via release-please).

**Additionnellement à partir de Sprint 11 :**
- [ ] Tests visuels (Playwright snapshots) sur les exports SVG/PNG critiques.

**Additionnellement à partir de Sprint 17 :**
- [ ] Tests E2E Playwright cross-browser (Chromium + Firefox + WebKit).
- [ ] axe-core validation a11y sur les nouvelles surfaces non-canvas.

---

## 10. Prochaine étape

### Action immédiate (jour 1 Sprint 0)

1. **Envoyer le mail URD Abbaye** (template Annexe A de `docs/test-corpus-plan.md`) — gating le corpus CDXML pour POC #3.
2. **Créer le repo Git** sur GitHub, push initial avec `docs/`, `LICENSE`, `CITATION.cff`, `README.md` skeleton.
3. **Démarrer STORY-INF-001** (scaffolding monorepo).

### Workflow recommandé pour exécution

Pour chaque story du backlog, en début de sprint :

```
/create-story STORY-INF-001
```

Cela génère un document détaillé `docs/stories/story-inf-001-*.md` avec :
- User story complète
- Acceptance criteria détaillés
- Notes techniques (composants, fichiers à créer/modifier)
- Plan d'implémentation
- Tests à écrire

Puis pour l'implémentation :

```
/dev-story STORY-INF-001
```

Le workflow Dev Story exécute la story de bout en bout (code + tests + commit).

### Cadence des cérémonies

- **Démarrage de sprint :** lundi matin semaine 1, run `/create-story` pour les ~3 stories du sprint, planning quick-review ~30 min.
- **Pendant le sprint :** dev focused (10h/sem effectives, soirées + weekends).
- **Fin de sprint :** vendredi soir semaine 2 :
  - Review : démo perso enregistrée + push démo statique pour URD Abbaye.
  - Rétro : `docs/retrospectives/sprint-{N}.md` (~30 min, format simple : went well / didn't go well / actions).
  - Planning du sprint suivant : choix des stories du backlog + ajustement vélocité si nécessaire.

### Workflow status update

Au terme de Sprint 0 : `solutioning_gate_check` est déjà PASS, `sprint_planning` devient PASS, et on entre formellement en Phase 4 implementation.

---

**Ce plan a été créé selon la BMAD Method v6 — Phase 4 (Implementation Planning).**

*Pour démarrer l'exécution : `/create-story STORY-INF-001` ou `/dev-story STORY-INF-001`.*

*Re-baseline obligatoire prévu en rétro Sprint 2.*
