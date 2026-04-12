# ADR-0002: Rendu hybride Canvas 2D (ecran) + SVG (export)

**Status:** Accepted
**Date:** 2026-04-12
**Author:** Jean-Baptiste Donnette

## Context

Kendraw doit tenir >= 30 fps a 500 atomes (NFR-001, driver D1) ET produire des exports SVG/PDF publication-quality (NFR-005, driver D5). Un seul renderer ne peut pas optimiser les deux : SVG-pur s'effondre au-dela de 200 atomes (DOM trop lourd), Canvas-pur ne produit que du raster.

## Decision

Deux renderers distincts pilotes par un modele de scene unique :
- **`@kendraw/renderer-canvas`** pour l'ecran (optimise latence, dirty regions, frame budget).
- **`@kendraw/renderer-svg`** pour l'export (optimise qualite vectorielle, polices embarquees, metadonnees).

Une couche d'abstraction `Renderer` interface permet d'ajouter un troisieme renderer (WebGL/Pixi.js) si POC #1 montre un mur de performance.

## Consequences

### Positive
- Tient simultanement D1 (perf) et D5 (qualite publication).
- Abstraction `Renderer` rend le pivot vers WebGL possible sans reecrire l'app.

### Negative
- Duplication de code de rendu (deux pipelines). Mitige par un module `render-utils` partage (geometrie, label positioning).

### Neutral
- Pattern confirme par tous les editeurs serieux (Figma, Sketch, Penpot ont tous deux pipelines).

## References
- Architecture §5.1.3, §5.1.4, TO-001
- POC #1 (perf 500 atomes) valide cette decision
