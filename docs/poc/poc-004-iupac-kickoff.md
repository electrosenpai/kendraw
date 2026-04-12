# POC #4 — IUPAC Coverage Kickoff : Rapport

**Date :** 2026-04-12
**Auteur :** Jean-Baptiste Donnette
**Statut :** KICKOFF COMPLETE (validation finale differee a pre-V1)

---

## Actions realisees

1. **Evaluation des options d'integration** : 3 candidats evalues (py2opsin, sidecar JVM, STOUT ML).

2. **Scaffold** : `backend/kendraw_chem/naming_opsin.py` avec classe `OpsinClient` placeholder et documentation des options.

3. **Analyse d'impact Docker** :

### Options evaluees

| Option        | Licence     | JRE requis | Image size impact | Precision        | Complexite |
|---------------|-------------|------------|-------------------|------------------|------------|
| **py2opsin**  | MIT         | Oui        | +100 MB (JRE)     | Excellente       | Faible     |
| sidecar JVM   | Apache-2.0  | Oui        | +200 MB (image separee) | Excellente | Moyenne    |
| STOUT (ML)    | MIT         | Non        | +500 MB (PyTorch) | Moyenne          | Moyenne    |

### Recommandation : py2opsin

- **`pip install py2opsin`** — wrapper Python qui shell out vers le jar OPSIN bundle.
- JRE requis dans l'image Docker V1. Ajout estime : ~100 MB (openjdk-17-jre-headless).
- Image backend V1 totale estimee : ~300 MB (vs ~200 MB MVP sans OPSIN).
- **Cold start OPSIN** : ~2-3 s au premier appel (JVM startup). Les appels suivants sont rapides (~50-200 ms).
- MIT-compatible : OPSIN est Apache-2.0, py2opsin est MIT.

### Impact sur le Dockerfile backend

V1 ajoutera au Dockerfile :
```dockerfile
# Install JRE for OPSIN (V1 only)
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jre-headless && rm -rf /var/lib/apt/lists/*
```

Et dans `pyproject.toml` :
```toml
dependencies = [
    ...
    "py2opsin>=1.0.0",  # V1: IUPAC name -> structure
]
```

### Mesures differees (necessitent JRE)

Les mesures suivantes seront realisees lors de la validation finale pre-V1 :
- Latence cold start (premier appel JVM).
- Latence steady-state (appels suivants).
- Couverture sur test set IUPAC 200 noms (cf. `docs/test-corpus-plan.md` test set #3).
- Taille reelle de l'image Docker V1 avec JRE.

---

## Decision

1. **py2opsin confirme** comme voie d'integration OPSIN pour V1.
2. **Pas de JRE dans l'image Docker MVP** (TO-008 maintenu).
3. **Validation finale** : constituer le test set IUPAC (200 noms + 200 structures) en pre-V1, installer py2opsin + JRE dans le Dockerfile V1, mesurer couverture et latence, rapport final.

---

## References
- Architecture §4.2, §5.2.2, §15.1 POC #4, TO-008
- Test corpus plan : `docs/test-corpus-plan.md` §3-4
- OPSIN scaffold : `backend/kendraw_chem/naming_opsin.py`
