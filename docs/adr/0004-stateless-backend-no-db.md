# ADR-0004: Backend stateless, pas de base de donnees serveur

**Status:** Accepted
**Date:** 2026-04-12
**Author:** Jean-Baptiste Donnette

## Context

Kendraw est auto-heberge, sans comptes utilisateur, sans sharing de documents, sans telemetrie. Toute la persistance utilisateur vit dans IndexedDB cote navigateur. Faut-il une DB serveur ?

## Decision

**Aucune base de donnees serveur au MVP.** Backend 100% stateless — transformeur pur input -> output, idempotent, cacheable.

Reserve V1+ optionnelle : SQLite pour templates partages institutionnels (desactive par defaut, monte en volume Docker).

## Consequences

### Positive

- Simplicite operationnelle radicale : pas de migration, pas de backup, pas de restore.
- Confidentialite totale : aucune donnee utilisateur cote serveur.
- Backend trivialement scalable verticalement (pas d'etat a partager).
- Deploiement en une commande (pas de DB a provisionner).

### Negative

- Pas de partage natif de documents entre utilisateurs ou entre machines d'un meme utilisateur.
- Mitigation MVP : export `.kdx` manuel. V2+ : sync optionnel OPFS / cloud bucket.

## References

- Architecture §6.4, TO-003
