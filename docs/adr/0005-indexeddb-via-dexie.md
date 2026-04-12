# ADR-0005: IndexedDB via Dexie (pas localStorage, pas hybride)

**Status:** Accepted
**Date:** 2026-04-12
**Author:** Jean-Baptiste Donnette

## Context

La persistance frontend (documents, onglets, undo history, templates, settings) a besoin d'un store async, quota genereux, transactionnel. localStorage est synchrone (bloque l'UI thread), quota anemique (5-10 MB), string-only.

## Decision

**IndexedDB via Dexie 4.x** comme unique store de persistance frontend. Pas de localStorage (meme pour des preferences triviales). Abstraction `PersistenceStore` pour permettre un swap futur (OPFS, cloud sync V2+).

## Consequences

### Positive
- Un seul mecanisme a raisonner. Async non-bloquant. Quota genereux (50%+ espace disque). Supporte Blob. Transactionnel.
- Dexie ajoute ~30 KB au bundle (negligeable).
- `PersistenceStore` abstraction permet de swapper en V2+ sans toucher aux composants.

### Negative
- IndexedDB un peu plus complexe a debugger en DevTools que localStorage.
- Safari WebKit a un quota stingy (~50 MB initial, escalation par prompt).

## References
- Architecture §6.3, TO-006
