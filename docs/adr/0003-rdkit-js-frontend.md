# ADR-0003: RDKit.js (WASM) comme lib chimie frontend

**Status:** Accepted (sous reserve POC #2)
**Date:** 2026-04-12
**Author:** Jean-Baptiste Donnette

## Context

Le frontend a besoin d'une lib chimie JS pour le parsing SMILES, la canonicalisation, le calcul de valence et les proprietes basiques (FR-018, FR-007, FR-015) — sans round-trip reseau. Candidats : RDKit.js (WASM), OpenChemLib JS, smiles-drawer.

## Decision

**RDKit.js (WASM)** par defaut pour le profil full. **OpenChemLib JS** comme fallback pour le profil static-demo si POC #2 montre que le bundle WASM est trop lourd au boot.

## Consequences

### Positive

- Parite de comportement parfaite avec le backend RDKit Python (memes algos de canonicalisation, valence, InChI). Elimine une classe entiere de bugs divergence frontend/backend.
- Une seule lib chimie a connaitre pour le contributeur.

### Negative

- Bundle WASM ~3-5 MB compresse, premier chargement ~500 ms - 1 s. Acceptable pour l'app full, potentiellement lourd pour le mode demo.
- L'abstraction `ChemAdapter` doit maintenir deux implementations (RDKit + OpenChemLib) tant que le profil demo existe.

### Neutral

- POC #2 est le garde-fou : si RDKit.js echoue sur les criteres (bundle < 6 MB, SMILES parsing < 200 ms, first interactive < 2 s sur 4G), on bascule OpenChemLib en profil full aussi.

## References

- Architecture §5.1.2, TO-002, Annexe A (matrice evaluation)
- POC #2 valide cette decision
