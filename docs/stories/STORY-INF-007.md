# STORY-INF-007 : Repo metadata (LICENSE, CITATION.cff, README, CONTRIBUTING)

**Epic :** Infrastructure (Sprint 0)
**Priorité :** Must Have
**Story Points :** 1
**Sprint :** 0
**Driver :** NFR-011 (citation) + NFR-012 (documentation)

## User Story

En tant que **premier visiteur du repo GitHub Kendraw**,
je veux voir **immédiatement la licence MIT, la demande de citation académique, et comment contribuer**,
afin de **savoir en 30 secondes si ce projet est pour moi et comment m'y impliquer**.

## Acceptance Criteria

- [ ] `LICENSE` MIT à la racine, copyright "2026 Jean-Baptiste Donnette".
- [ ] `CITATION.cff` valide (schema CFF 1.2.0), avec titre, auteur, URL repo, licence, version 0.0.0.
- [ ] `README.md` : pitch 3 lignes, badges placeholder (CI, license), section "Cite this work" avec BibTeX, section "Privacy" ("no telemetry"), section "Quick Start" (docker compose + dev), lien vers docs/.
- [ ] `CONTRIBUTING.md` : prérequis (Node 20+, pnpm 9+, Python 3.11+, uv), setup en 5 commandes, conventions commits, lien architecture.
