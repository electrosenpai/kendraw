# POC #2 — RDKit.js bundle/latence : Rapport

**Date :** 2026-04-12
**Auteur :** Jean-Baptiste Donnette
**Statut :** PASS

---

## Verdict : PASS

RDKit.js (WASM) satisfait **tous les criteres mesurables** et est confirme comme lib chimie frontend par defaut.

---

## Resultats mesures

### Bundle size

| Metrique                    | Cible    | Mesure     | Verdict |
|-----------------------------|----------|------------|---------|
| WASM brut                   | —        | 6.6 MB     | —       |
| WASM gzip                   | < 6 MB   | **1.96 MB** | **PASS** |
| JS loader                   | —        | 126 KB     | —       |
| Total gzip (WASM + JS)      | < 6 MB   | **~2.1 MB** | **PASS** |

### SMILES parsing latence

| Molecule            | Atomes ~  | Parse (ms) | Canon (ms) | InChI (ms) |
|---------------------|-----------|------------|------------|------------|
| Methane (cold start)| 1         | 65.7       | 5.6        | 24.3       |
| Ethanol             | 3         | 0.32       | 0.62       | 0.52       |
| Benzene             | 6         | 3.38       | 0.66       | 1.16       |
| Aspirin             | 13        | 0.34       | 0.20       | 1.58       |
| Caffeine            | 14        | 0.79       | 0.18       | 0.49       |
| Testosterone        | 19        | 0.39       | 0.20       | 2.36       |
| Ibuprofen           | 15        | 0.34       | 0.14       | 0.79       |
| Glucose             | 12        | 1.43       | 0.47       | 0.71       |
| Paracetamol         | 11        | 0.32       | 0.17       | 0.35       |
| Long chain (C24)    | 25        | 0.48       | 0.20       | 0.98       |
| CoA fragment        | ~40       | 1.12       | 0.47       | 1.51       |
| Penicillin core     | ~20       | 0.67       | 0.27       | 0.87       |

**Moyenne (hors cold start) :** 0.87 ms parsing, 0.31 ms canonicalisation, 1.02 ms InChI.
**Maximum (hors cold start) :** 3.38 ms (benzene, aromaticite).
**Cold start JIT :** 65.7 ms (premier appel seulement, non representatif).

| Critere                     | Cible     | Mesure (hors cold start) | Verdict |
|-----------------------------|-----------|--------------------------|---------|
| Parse SMILES <= 100 atomes  | < 200 ms  | **3.38 ms max**          | **PASS (x59)** |
| WASM load time              | < 2000 ms | **60 ms (Node)**         | **PASS** |

### First interactive (estime)

- WASM gzip 1.96 MB sur 4G simule (1.6 Mbps) = ~10 s download. **Trop lent sur 4G reelle.**
- WASM gzip 1.96 MB sur broadband (10 Mbps) = ~1.6 s download + 60 ms init = **~1.7 s. PASS.**
- Les utilisateurs cibles sont sur desktop (PRD : "desktop only, pas mobile"). 4G n'est pas le scenario nominal.
- Le mode demo (GitHub Pages) utilisera OpenChemLib JS (~400 KB) comme fallback si la cible 4G devient necessaire.

---

## Decision

1. **RDKit.js WASM confirme** comme lib chimie frontend profil full (ADR-0003 maintenu).
2. **OpenChemLib JS confirme** comme fallback profil static-demo (bundle plus leger pour GitHub Pages).
3. **Pas besoin de bascule** : les 3 criteres sont satisfaits pour le profil full (desktop broadband).

---

## References
- Architecture §5.1.2, TO-002, ADR-0003, Annexe A
- Benchmark script : `scripts/poc-002-rdkit-bench.ts`
