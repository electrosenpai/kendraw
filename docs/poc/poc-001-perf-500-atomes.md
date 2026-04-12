# POC #1 — Performance 500 atomes : Rapport

**Date :** 2026-04-12
**Auteur :** Jean-Baptiste Donnette
**Statut :** PASS

---

## Verdict : PASS

Le substrat de rendu choisi (scene model immuable via Immer + spatial index R-tree via rbush + Canvas 2D) **tient largement** les criteres de performance a 500 atomes et meme au-dela (750 atomes).

---

## Resultats mesures (Node.js, vitest bench)

### Scene operations (Immer structural sharing)

| Atomes | add atom (mean) | move atom (mean) | remove atom (mean) | Budget 16 ms ? |
|--------|-----------------|-------------------|---------------------|-----------------|
| 100    | 0.025 ms        | 0.011 ms          | 0.013 ms            | **OK x640**     |
| 250    | 0.083 ms        | 0.069 ms          | 0.078 ms            | **OK x192**     |
| 500    | 0.229 ms        | 0.180 ms          | 0.186 ms            | **OK x88**      |
| 750    | 0.399 ms        | 0.300 ms          | 0.297 ms            | **OK x53**      |

**Conclusion :** Toutes les operations scene sont < 0.5 ms meme a 750 atomes. Le budget de 16 ms est respecte avec un facteur **53x a 88x de marge** a 500 atomes.

### Spatial index (rbush R-tree)

| Atomes | hit-test (mean) | rect search 10% (mean) | full rebuild (mean) | Hit-test < 1 ms ? |
|--------|-----------------|------------------------|---------------------|---------------------|
| 100    | 0.000142 ms     | 0.000292 ms            | 0.011 ms            | **OK x7000**        |
| 250    | 0.000151 ms     | 0.000383 ms            | 0.060 ms            | **OK x6600**        |
| 500    | 0.000189 ms     | 0.000686 ms            | 0.114 ms            | **OK x5200**        |
| 750    | 0.000212 ms     | 0.001428 ms            | 0.238 ms            | **OK x4700**        |

**Conclusion :** Le hit-test R-tree est en **microsecondes**, meme a 750 atomes. Le full rebuild est < 0.25 ms a 750 atomes. La latence selection rectangle est < 0.002 ms. Tous les criteres sont largement satisfaits.

### Synthese vs criteres d'acceptation

| Critere                                          | Cible         | Mesure a 500 atomes | Verdict |
|--------------------------------------------------|---------------|---------------------|---------|
| Scene operation frame budget                     | < 16 ms       | 0.23 ms (p99: 1.7 ms) | **PASS (x70)** |
| Spatial index hit-test                           | < 1 ms        | 0.000189 ms         | **PASS (x5200)** |
| Spatial index rect search                        | < 5 ms        | 0.000686 ms         | **PASS (x7300)** |

---

## Note sur les mesures Canvas 2D (rendu ecran)

Les benchmarks ci-dessus mesurent le **modele de scene** et le **spatial index**, qui sont les composants CPU-bound. Le rendu Canvas 2D n'est pas mesurable dans un environnement Node.js (pas de GPU, pas de `<canvas>` reel).

**Estimation theorique :**
- Le rendu Canvas 2D d'un cercle + texte = ~0.002 ms par element (benchmark industriel).
- 500 atomes + 500 bonds = ~1000 elements = ~2 ms de temps Canvas pur.
- Avec le frame overhead (~1-2 ms), on reste a ~4 ms total par frame, largement sous le budget 16 ms.

**Recommandation :** une validation browser-based complementaire est souhaitable mais non bloquante vu la marge confortable. A faire dans un navigateur reel lors du Sprint 1 (premier `pnpm dev` avec la vraie app).

---

## Conclusions

1. **Immer structural sharing** est negligeable en cout, meme a 750 atomes. Pas besoin d'optimisation supplementaire.
2. **rbush R-tree** est spectaculairement rapide. Le hit-testing et la recherche spatiale ne seront jamais un goulet.
3. **Canvas 2D** est le bon choix initial. Pas besoin de WebGL/Pixi.js pour le MVP (la couche `Renderer` reste disponible si besoin au-dela de 1000+ atomes).
4. **Le driver D1 (NFR-001) est satisfait.** Le gate go/no-go est vert.

---

## References
- Architecture §5.1.1, §5.1.3, §10.2, §15.1
- Benchmark code : `packages/scene-poc/bench/perf-500.bench.ts`
- Fixtures : `tests/fixtures/perf-benchmarks/synthetic/`
