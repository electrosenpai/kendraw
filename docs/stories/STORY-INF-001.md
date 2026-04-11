# STORY-INF-001 : Scaffolding monorepo pnpm + structure de packages

**Epic :** Infrastructure (Sprint 0)
**Priorité :** Must Have / bloquante (prérequis de toutes les autres stories)
**Story Points :** 3
**Statut :** Not Started
**Assigné :** Jean-Baptiste Donnette
**Créé :** 2026-04-12
**Sprint :** 0 (Gated Infra & POCs)
**Driver architecture :** D7 (codebase appropriable par contributeurs externes)

---

## User Story

En tant que **solo dev OSS démarrant un projet Level 4**,
je veux un **monorepo pnpm workspaces structuré avec les 8 packages frontend définis en architecture**,
afin que **tous les futurs commits respectent les frontières de packages dès le premier jour et que la codebase soit immédiatement appropriable par un contributeur**.

---

## Description

### Contexte

Kendraw démarre de zéro. Le document d'architecture (`docs/architecture-kendraw-2026-04-12.md` §5.1, §12.1) prescrit un monorepo avec 8 packages frontend séparés aux frontières strictes, vérifiées par `dependency-cruiser` en CI. Le tout est piloté par pnpm workspaces.

Cette story est la **toute première action de code** du projet. Elle crée la fondation sur laquelle TOUT le reste se construit. Une erreur ici se propage partout et coûte cher à corriger. C'est pourquoi elle mérite une attention disproportionnée malgré sa taille apparemment modeste (3 pts).

### Périmètre

**Inclus :**
- Initialisation du repo Git (branche `main`, pas de `master`).
- `pnpm-workspace.yaml` déclarant les 8 packages frontend.
- Squelette de chaque package (package.json, tsconfig.json, src/index.ts placeholder).
- Configuration TypeScript stricte partagée (`tsconfig.base.json`).
- Configuration Vite minimale pour `@kendraw/ui` (seul package buildable au Sprint 0).
- Fichiers config racine : `.editorconfig`, `.gitignore`, `.gitattributes`, `.npmrc`, `package.json` workspace root.
- Conventional commits : `commitlint.config.js` + hook `commit-msg` via `husky` ou `simple-git-hooks`.
- Vitest configuré globalement (workspace mode), stub de test dans chaque package.

**Exclus (stories séparées) :**
- Backend Python (STORY-INF-002).
- Docker (STORY-INF-003).
- CI GitHub Actions (STORY-INF-004).
- `dependency-cruiser` config (livré avec STORY-INF-004).
- README, CITATION.cff, CONTRIBUTING.md (STORY-INF-007).
- Contenu applicatif dans les packages (Sprint 1+).

---

## Flux de travail développeur

1. `git init` + `git remote add origin` sur le repo GitHub fraîchement créé.
2. Créer la structure de répertoires conformément à §12.1 du doc d'architecture.
3. `pnpm init` à la racine + `pnpm-workspace.yaml`.
4. Pour chaque package : `pnpm init` + `tsconfig.json` extends racine + `src/index.ts` avec `export {}`.
5. Configurer `tsconfig.base.json` strict.
6. Installer les devDependencies workspace : `typescript`, `vitest`, `@vitest/coverage-v8`, `eslint`, `prettier`, `commitlint`, `@commitlint/config-conventional`, `husky` (ou `simple-git-hooks`).
7. Configurer Vitest workspace mode.
8. `pnpm install` → lockfile.
9. `pnpm typecheck` → 0 erreurs.
10. `pnpm test` → 0 tests, 0 erreurs.
11. Premier commit : `chore: init monorepo + 8 packages frontend`.

---

## Acceptance Criteria

- [ ] **Repo Git initialisé** sur branche `main` avec remote GitHub configuré.
- [ ] **`pnpm-workspace.yaml`** déclare les 8 packages :
  ```yaml
  packages:
    - 'packages/scene'
    - 'packages/chem'
    - 'packages/renderer-canvas'
    - 'packages/renderer-svg'
    - 'packages/persistence'
    - 'packages/io'
    - 'packages/api-client'
    - 'packages/ui'
  ```
- [ ] **Chaque package** a un `package.json` minimal valide avec :
  - `name` : `@kendraw/scene`, `@kendraw/chem`, etc.
  - `version` : `0.0.0`
  - `private` : `true` (sauf si on veut publier plus tard — `true` pour l'instant)
  - `main` : `src/index.ts`
  - `types` : `src/index.ts`
  - `scripts.typecheck` : `tsc --noEmit`
  - `scripts.test` : `vitest run`
- [ ] **Chaque package** a un `tsconfig.json` avec `"extends": "../../tsconfig.base.json"`, `include: ["src"]`, `compilerOptions.outDir` défini.
- [ ] **`tsconfig.base.json`** à la racine avec **strictness maximale** :
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "noImplicitOverride": true,
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "esModuleInterop": true,
      "skipLibCheck": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "isolatedModules": true
    }
  }
  ```
- [ ] **Chaque package** a un `src/index.ts` placeholder avec `export {};` (compile OK, pas de "empty barrel" lint error).
- [ ] **`.editorconfig`** en place (indent = 2 spaces, utf-8, lf, trim trailing whitespace, final newline).
- [ ] **`.gitignore`** couvre : `node_modules/`, `dist/`, `.turbo/`, `coverage/`, `.vite/`, `*.tsbuildinfo`, `__pycache__/`, `*.pyc`, `.venv/`, `uv.lock` (backend, symlink), IDE files (`.idea/`, `.vscode/settings.json` mais pas `.vscode/` entier), OS files (`.DS_Store`, `Thumbs.db`), `tests/fixtures/cdxml-corpus/urd-abbaye/`.
- [ ] **`.gitattributes`** : `* text=auto`, `*.ts text eol=lf`, `*.tsx text eol=lf`, `*.json text eol=lf`, `*.mol binary` (ou `text`, selon convention — commencer par `text`).
- [ ] **`.npmrc`** : `shamefully-hoist=false`, `strict-peer-dependencies=true`.
- [ ] **Conventional commits** configurés :
  - `commitlint.config.js` avec `@commitlint/config-conventional`.
  - Hook `commit-msg` via husky ou simple-git-hooks.
  - Premier commit du repo passe la validation (`chore: ...`).
- [ ] **Vitest** configuré en workspace mode :
  - `vitest.workspace.ts` à la racine listant les 8 packages.
  - Chaque package a un `vitest.config.ts` minimal (ou hérite).
  - `pnpm test` à la racine exécute tous les packages (0 tests, 0 failures en Sprint 0).
  - `pnpm test -- --coverage` fonctionne (coverage 0 %, pas d'échec).
- [ ] **Vite** configuré minimalement pour `packages/ui` :
  - `packages/ui/vite.config.ts` avec plugin `@vitejs/plugin-react`.
  - `packages/ui/index.html` placeholder.
  - `pnpm --filter @kendraw/ui dev` lance un serveur de dev qui affiche une page blanche sans erreur.
- [ ] **`pnpm install`** à la racine fonctionne **sans warning** (zéro peer-dep warning, zéro missing dep).
- [ ] **`pnpm typecheck`** (= `tsc --noEmit` dans chaque package) passe avec 0 erreur.
- [ ] **`pnpm test`** passe avec 0 test, 0 failure.
- [ ] **`pnpm --filter @kendraw/ui build`** produit un bundle sous `packages/ui/dist/`.

---

## Notes techniques

### Structure de fichiers cible

```
kendraw/
├── package.json                    # workspace root (private, workspaces)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml                  # généré par pnpm install
├── tsconfig.base.json              # strict, partagé
├── vitest.workspace.ts             # workspace mode
├── commitlint.config.js
├── .husky/
│   └── commit-msg                  # commitlint hook
├── .editorconfig
├── .gitignore
├── .gitattributes
├── .npmrc
│
├── packages/
│   ├── scene/
│   │   ├── package.json            # @kendraw/scene
│   │   ├── tsconfig.json           # extends ../../tsconfig.base.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── index.ts            # export {}
│   ├── chem/
│   │   ├── package.json            # @kendraw/chem
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── index.ts
│   ├── renderer-canvas/
│   │   ├── package.json            # @kendraw/renderer-canvas
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── index.ts
│   ├── renderer-svg/
│   │   ├── package.json            # @kendraw/renderer-svg
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── index.ts
│   ├── persistence/
│   │   ├── package.json            # @kendraw/persistence
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── index.ts
│   ├── io/
│   │   ├── package.json            # @kendraw/io
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── index.ts
│   ├── api-client/
│   │   ├── package.json            # @kendraw/api-client
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── index.ts
│   └── ui/
│       ├── package.json            # @kendraw/ui
│       ├── tsconfig.json
│       ├── tsconfig.node.json      # pour vite.config.ts
│       ├── vite.config.ts
│       ├── vitest.config.ts
│       ├── index.html
│       └── src/
│           ├── index.ts
│           └── main.tsx            # React entry point (placeholder)
│
└── (backend/, docker/, docs/, .github/ — autres stories)
```

### Dépendances workspace root (`devDependencies`)

```json
{
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "husky": "^9.0.0"
  }
}
```

### Dépendances `@kendraw/ui` (le seul package avec deps au Sprint 0)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "vite": "^5.4.0"
  }
}
```

### Références de package inter-packages (PAS encore dans cette story)

Les dépendances entre packages (ex. `@kendraw/chem` → `@kendraw/scene`) seront ajoutées **au fur et à mesure** dans les stories applicatives. En Sprint 0, chaque package est isolé et ne dépend de rien (sauf `@kendraw/ui` de React).

C'est intentionnel : ne pas câbler les dépendances inter-packages tant que le code n'en a pas besoin — sinon `dependency-cruiser` (STORY-INF-004) n'aurait rien à protéger.

### Scripts `package.json` racine

```json
{
  "scripts": {
    "typecheck": "pnpm -r typecheck",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "echo 'ESLint config pending STORY-INF-004'",
    "build": "pnpm --filter @kendraw/ui build",
    "dev": "pnpm --filter @kendraw/ui dev",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky"
  }
}
```

### Choix technique : husky vs simple-git-hooks

**Recommandation : `husky`.**
- Plus populaire, mieux documenté, setup `npx husky init` auto-crée `.husky/`.
- `simple-git-hooks` est plus léger mais l'avantage est négligeable pour un projet de cette taille.
- Si JB préfère `simple-git-hooks` (config dans `package.json`, pas de `.husky/` dir) : changement trivial.

### Choix technique : ESLint 9 flat config

ESLint 9 utilise le flat config (`eslint.config.js`). La configuration détaillée est livrée avec STORY-INF-004 (CI workflow frontend). En Sprint 0 STORY-INF-001, on installe ESLint mais le script `lint` est un placeholder (`echo`).

### Piège à éviter : pnpm peer-deps

Avec `strict-peer-dependencies=true` dans `.npmrc`, il faut que toutes les peer-deps soient satisfaites. React 18 + `@types/react` + `@vitejs/plugin-react` doivent être dans les mêmes version ranges. Vérifier que `pnpm install` passe sans warning.

---

## Dépendances

### Stories prérequises
- **Aucune.** C'est la première story du projet.

### Stories bloquées par celle-ci
- **STORY-INF-002** (backend skeleton) — peut être développée en parallèle, mais conceptuellement le repo doit exister.
- **STORY-INF-003** (Docker) — dépend d'INF-001 + INF-002.
- **STORY-INF-004** (CI frontend) — dépend d'INF-001.
- **STORY-INF-007** (repo metadata) — dépend d'INF-001.
- **STORY-INF-009** (.github/ templates) — dépend d'INF-001.
- **STORY-POC-001** (perf 500 atomes) — dépend d'INF-001.
- **STORY-POC-002** (RDKit.js) — dépend d'INF-001.
- **STORY-TC-001** (test corpus perf) — dépend d'INF-001.

### Dépendances externes
- **Compte GitHub** avec repo créé (public, MIT).
- **Node.js ≥ 20** installé localement.
- **pnpm ≥ 9** installé globalement (`corepack enable && corepack prepare pnpm@latest --activate`).

---

## Definition of Done

- [ ] Code committé sur `main` (premier commit du repo).
- [ ] `pnpm install` sans warning.
- [ ] `pnpm typecheck` (tsc --noEmit sur 8 packages) : 0 erreur.
- [ ] `pnpm test` : 0 test, 0 failure, 0 error.
- [ ] `pnpm --filter @kendraw/ui dev` lance Vite dev server sans erreur.
- [ ] `pnpm --filter @kendraw/ui build` produit `dist/` sans erreur.
- [ ] `pnpm format:check` passe (Prettier).
- [ ] Commitlint hook fonctionne : un commit non-conventional (`git commit -m "foo"`) est rejeté.
- [ ] Structure de fichiers conforme à §12.1 du document d'architecture.
- [ ] Tous les acceptance criteria cochés ci-dessus.
- [ ] Premier push vers `origin/main` réussi.

---

## Story Points Breakdown

- **Structure monorepo + pnpm workspace + 8 packages squelettes :** 1.5 pts
- **Config stricte TS + Vitest workspace + Vite minimal :** 1 pt
- **Conventional commits (commitlint + husky) + dotfiles :** 0.5 pt
- **Total :** 3 pts (~6h de focus dev)

**Rationale :** 3 points parce que le travail est essentiellement du scaffolding config (pas de logique métier), mais la quantité de fichiers à créer et vérifier (8 packages × 3-4 fichiers chacun + configs racine) est non triviale, et les pièges pnpm/peer-deps/TS strict méritent de l'attention.

---

## Notes additionnelles

### Premier commit du projet

Le message du premier commit doit être :
```
chore: init monorepo pnpm workspaces + 8 packages frontend

Set up the Kendraw monorepo with pnpm workspaces, TypeScript strict
configuration, Vitest workspace mode, and Vite for @kendraw/ui.

Packages:
- @kendraw/scene (domain model, framework-agnostic)
- @kendraw/chem (chemistry lib adapter)
- @kendraw/renderer-canvas (screen renderer)
- @kendraw/renderer-svg (export renderer)
- @kendraw/persistence (IndexedDB via Dexie)
- @kendraw/io (file format parsers/writers)
- @kendraw/api-client (backend REST client)
- @kendraw/ui (React 18 app, Glasswerk design system)

Ref: docs/architecture-kendraw-2026-04-12.md §5.1, §12.1
```

### Philosophie

Cette story **ne fait rien de visible pour un utilisateur**. C'est 100 % de l'infrastructure développeur. Sa valeur est de poser les rails sur lesquels **tout le reste** roule pendant 9-10 mois. Ne pas négliger.

---

## Suivi

**Historique :**
- 2026-04-12 : Créé par Scrum Master (Jean-Baptiste Donnette)

**Effort réel :** TBD (renseigné après implémentation)

---

**Cette story a été créée selon la BMAD Method v6 — Phase 4 (Implementation Planning).**

*Pour implémenter : `/dev-story STORY-INF-001`*
