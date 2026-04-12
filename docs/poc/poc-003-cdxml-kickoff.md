# POC #3 — CDXML Round-trip Kickoff : Rapport

**Date :** 2026-04-12
**Auteur :** Jean-Baptiste Donnette
**Statut :** KICKOFF COMPLETE (validation finale differee)

---

## Actions realisees

1. **Mail URD Abbaye** : template pret dans `docs/test-corpus-plan.md` Annexe A. **A envoyer par JB manuellement** (hors scope Claude Code).

2. **Scaffold parser** : `backend/kendraw_chem/convert_cdxml.py` cree avec :
   - Classe `CdxmlParser` (placeholder, `NotImplementedError`)
   - Documentation des defis connus (dialectes multi-versions, coordonnees base64, pertes arrows/annotations via RDKit)
   - Approches candidates documentees (lxml + RDKit validation, ou frontend TS parser)

3. **Exploration initiale** (recherche documentaire, pas de code) :

### Etat de l'art CDXML

- **Format** : XML avec namespace `http://www.cambridgesoft.com/xml/cdxml.dtd`. Elements principaux : `<CDXML>`, `<page>`, `<fragment>`, `<n>` (node/atom), `<b>` (bond), `<graphic>` (arrows), `<t>` (text/annotations).
- **Versions ChemDraw observees** : 16.0 a 22.x. Pas de spec publique officielle — PerkinElmer ne la publie pas. Reverse-engineering par la communaute (Open Babel, Indigo, RDKit ont du support partiel).
- **RDKit support** : `Chem.MolFromMolBlock()` peut lire les **structures chimiques** depuis un CDXML converti, mais **perd toutes les informations graphiques** (arrows, annotations, layout). Insuffisant seul pour un round-trip complet.
- **Open Babel** : a un lecteur CDXML mais sous licence GPL — **interdit** pour Kendraw (NFR-003).
- **Indigo (EPAM)** : a un lecteur CDXML sous Apache-2.0 — **MIT-compatible**, possible reference. Mais c'est du C++ avec bindings Python.

### Approche recommandee (a valider sur corpus reel)

1. **Parser frontend TS** pour le subset courant (>= 95 % du corpus URD Abbaye estime) : nodes, bonds, coordinates, basic text.
2. **Parser backend Python (lxml)** pour le fallback (CDXML exotiques, versions anciennes).
3. **Validation chimique** via RDKit (InChI round-trip pour verifier que la chimie est preservee).
4. **Graphiques** (arrows, annotations) : serialisation custom dans un bloc d'extension Kendraw.

### Risques identifies

- **Pas de spec officielle** → reverse-engineering obligatoire sur le corpus reel.
- **Dialectes multi-versions** → chaque version ChemDraw peut introduire des variations.
- **Curly arrows dans CDXML** → encode comme `<graphic>` avec des paths SVG-like, pas comme des objets chimiques. Complexe a parser.
- **Annotations conditionnelles** → texte libre positionne relativement aux arrows, pas de structure semantique.

---

## Prochaine etape

Attendre l'arrivee du corpus URD Abbaye (calendrier 2-4 semaines apres envoi mail). Puis :
1. Analyser les 50-100 fichiers reels.
2. Identifier le subset minimal a supporter pour >= 95 % couverture.
3. Implementer le parser TS/Python.
4. Mesurer la fidelite round-trip et produire le rapport final.

---

## References
- Architecture §5.2.2, §15.1 POC #3
- Test corpus plan : `docs/test-corpus-plan.md` §2
- CDXML scaffold : `backend/kendraw_chem/convert_cdxml.py`
