# STORY-INF-005 : CI workflow backend

**Epic :** Infrastructure (Sprint 0)
**Priorité :** Must Have
**Story Points :** 2
**Sprint :** 0
**Driver :** D3 + D7

## User Story

En tant que **solo dev**,
je veux que **chaque PR touchant le backend soit validée (ruff, mypy, pytest, licences)**,
afin de **ne jamais merger de code Python mal typé ou avec une dépendance non MIT-compatible**.

## Acceptance Criteria

- [ ] `.github/workflows/ci-backend.yml` s'exécute sur PRs touchant `backend/**`.
- [ ] Jobs : ruff check, ruff format, mypy strict, pytest (coverage target configurable).
- [ ] License check backend via `pip-licenses` ou `liccheck`.
