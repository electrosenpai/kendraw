# ADR-0007: mkdocs-material pour la documentation publique

**Status:** Accepted
**Date:** 2026-04-12
**Author:** Jean-Baptiste Donnette

## Context

Kendraw a besoin d'un site de documentation publique (getting-started, deployment, shortcuts, architecture). Deux candidats principaux : mkdocs-material (Python, Markdown) et astro-starlight (JS/TS, MDX).

## Decision

**mkdocs-material.**

Criteres de decision :

1. **Coherence stack** : le backend est Python — mkdocs s'installe via pip/uv, pas de Node requis pour la doc.
2. **Ecosysteme** : mkdocs-material est le standard de facto pour la doc technique OSS Python (FastAPI, Pydantic, uv eux-memes l'utilisent).
3. **Friction contributeur** : Markdown pur, pas de MDX, pas de composants React a apprendre pour ecrire de la doc.
4. **Search integre** : mkdocs-material inclut un moteur de recherche client-side sans config.

## Consequences

### Positive

- Setup en 3 lignes dans `pyproject.toml` (ou un `mkdocs.yml` dedie).
- Themes, plugins, extensions matures.
- Deploy trivial sur GitHub Pages.

### Negative

- Moins flexible que Starlight pour des composants interactifs (si on en voulait dans la doc, ce qui n'est pas prevu).

## References

- Architecture §8 NFR-012, gate check recommandation R2
