# ADR-0001: Modular Monolith (pas de microservices)

**Status:** Accepted
**Date:** 2026-04-12
**Author:** Jean-Baptiste Donnette

## Context

Kendraw est composé d'un frontend React et d'un backend FastAPI. L'architecture doit servir un projet OSS solo-dev auto-hébergé (docker compose up) par des chimistes non-DevOps. Le doc d'architecture (TO-004) pose la question : microservices ou monolithe ?

## Decision

**Modular Monolith** — deux processus seulement (frontend nginx + backend uvicorn), chacun structuré en packages/modules internes aux frontières strictes.

## Consequences

### Positive

- Déploiement trivial : une seule commande `docker compose up`.
- Zéro coordination distribuée : pas de service mesh, pas de message broker, pas de distributed tracing.
- Contributeurs onboarding rapide : un seul repo, une seule CI.
- Frontières internes par packages (vérifiées par dependency-cruiser) donnent les bénéfices du découplage sans le coût opérationnel.

### Negative

- Pas de scaling indépendant des services (le NamingService V1 plus lent que ComputeService — on les scale ensemble).
- Si Kendraw doit un jour servir 10k utilisateurs simultanés, un fork lourd sera nécessaire.

### Neutral

- Parfaitement adapté au contexte single-user / single-lab self-hosted.

## References

- Architecture §3.1, TO-004
