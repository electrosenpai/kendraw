# ADR-0006: Trois couches d'etat React (domaine + UI + cache serveur)

**Status:** Accepted
**Date:** 2026-04-12
**Author:** Jean-Baptiste Donnette

## Context

Kendraw est un editeur moleculaire avec un modele de scene complexe (commandes, undo, validators, spatial index), un etat UI classique (selection, outil actif, panneaux), et des appels backend optionnels (descripteurs, IUPAC). Un seul store global (Zustand ou Redux) pour tout est techniquement possible mais semantiquement faux.

## Decision

Trois couches clairement separees :
1. **Domaine (scene model)** : store custom framework-agnostic dans `@kendraw/scene`, Immer pour structural sharing, expose `subscribe()`, React s'y branche via `useSyncExternalStore`.
2. **Etat UI** : **Zustand** (selection, outil actif, panneaux, theme).
3. **Cache serveur** : **TanStack Query** (descripteurs RDKit, IUPAC, conversions backend).

## Consequences

### Positive
- Chaque couche a la semantique adaptee a son usage.
- Le scene model est framework-agnostic et reutilisable hors React (CLI, workers, tests headless).
- Onboarding contributeur : un nouveau venu touche UNE couche a la fois. Decouplage maximal.

### Negative
- Trois APIs a apprendre au lieu d'une. Legere surface mentale supplementaire.
- Refactoring ulterieur coutera cher si on veut changer d'avis.

### Neutral
- Mettre le scene model dans Zustand serait possible mais douloureux : le command bus, l'undo stack, les validators, le spatial index ne sont pas des key-value plats.

## References
- Architecture §1 (decisions structurantes #4), TO-007
