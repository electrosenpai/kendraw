# STORY-INF-004 : CI workflow frontend

**Epic :** Infrastructure (Sprint 0)
**Priorité :** Must Have / bloquante
**Story Points :** 3
**Sprint :** 0
**Driver :** D3 (licence MIT) + D7 (qualité)

## User Story

En tant que **solo dev OSS**,
je veux que **chaque PR touchant le frontend soit automatiquement validée (lint, types, tests, build, frontières packages, bundle size, licences)**,
afin de **ne jamais merger une régression ou une dépendance GPL par accident**.

## Acceptance Criteria

- [ ] `.github/workflows/ci-frontend.yml` existe et s'exécute sur PRs touchant `packages/**`.
- [ ] Jobs : lint (ESLint), typecheck (tsc), test (vitest), build (@kendraw/ui), dependency-cruiser, size-limit, license-checker.
- [ ] `eslint.config.js` (flat config ESLint 9+) avec plugin TypeScript strict.
- [ ] `dependency-cruiser` config `.dependency-cruiser.cjs` applique les règles de frontières de packages §5.1.8 du doc d'architecture.
- [ ] `size-limit` config dans `package.json` : bundle initial < 350 KB gzip.
- [ ] `license-checker` config : whitelist MIT/BSD/Apache/ISC/0BSD/Unlicense/CC0.
- [ ] Branch protection : CI verte requise avant merge (documenté, pas configurable depuis le repo).
