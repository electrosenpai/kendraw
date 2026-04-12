# Plan des test sets de référence — Kendraw

**Date :** 2026-04-12
**Auteur :** Jean-Baptiste Donnette
**Statut :** Plan initial — à exécuter en parallèle de la Phase 4
**Origine :** Recommandation R3 du Solutioning Gate Check — `docs/solutioning-gate-check-kendraw-2026-04-12.md`

---

## Pourquoi ce document

Plusieurs critères de validation de Kendraw — POC bloquants, NFR critiques, gates de release — s'appuient sur des **test sets chimiques curated** qui n'existent pas encore. Constituer ces corpus est un travail préalable qui :

- **Peut démarrer immédiatement**, en parallèle du dev MVP, sans attendre que le code soit prêt.
- **Conditionne** les POC #1 (perf), #3 (CDXML round-trip) et #4 (couverture IUPAC).
- **Doit impliquer URD Abbaye** pour le corpus CDXML réel — c'est un travail qui prend du temps de calendrier (sollicitations, allers-retours, anonymisation).

Ce document liste les 6 test sets nécessaires, leur cible quantitative, leur méthode de curation, leur emplacement final dans le repo, et fournit un brouillon de message pour solliciter URD Abbaye.

---

## 1. Inventaire des test sets

### Test set #1 — Conversions de format (100 structures)

**Usage :** Validation FR-022 (round-trip MOL/SDF/SMILES/InChI) au MVP, puis tests de régression continus en CI.
**Référence PRD/architecture :** FR-021 acceptance criterion ("au moins 100 structures de référence"), §12.2 du document d'architecture.
**Cible quantitative :** 100 structures.
**Composition recommandée :**

| Catégorie                                  | Quantité | Notes                                                     |
| ------------------------------------------ | -------- | --------------------------------------------------------- |
| Petites molécules organiques (< 30 atomes) | 30       | Aspirine, caféine, paracétamol, glucose, etc.             |
| Aromatiques fusionnés                      | 15       | Naphtalène, anthracène, pyrène, indole, quinoléine, etc.  |
| Stéréochimie complexe                      | 15       | Cholestérol, taxol fragments, β-lactames, sucres avec α/β |
| Charges et isotopes                        | 10       | Sels (Na+, Cl-), zwitterions (acides aminés), deutériums  |
| Hétérocycles inhabituels                   | 10       | Imidazoles, triazoles, thiadiazoles, oxazoles             |
| Grandes molécules (200-500 atomes)         | 10       | Vancomycine, érythromycine, peptides cycliques courts     |
| Cas limites / bugs connus de RDKit         | 10       | Aromaticité Hückel ambigüe, kekulisation difficile, etc.  |

**Sources de curation :**

- **PubChem** : structures publiques, libre droit, format SDF natif. Filtrer par molecular weight et complexité.
- **ChEBI** : ontologie chimique, métadonnées riches (utiles pour étiqueter les test cases).
- **DrugBank (free tier)** : médicaments approuvés, avec InChI/SMILES de référence.
- **Curation manuelle** : ajouts ciblés pour les cas limites.

**Format de stockage :**

```
tests/fixtures/conversions/
├── small/                    # 1-50 atomes
│   ├── aspirin.mol
│   ├── aspirin.smi
│   ├── aspirin.inchi
│   └── ...
├── medium/                   # 50-200 atomes
├── large/                    # 200-500 atomes
└── manifest.json             # mapping nom → métadonnées + canonical SMILES de référence
```

**Critères d'acceptation pour le test set lui-même :**

- Chaque structure existe dans les 3 formats (MOL, SMILES, InChI) avec versions cohérentes.
- Le `manifest.json` documente : source, licence, MW, formula, canonical SMILES, InChIKey.
- Aucune licence non MIT-compatible (filtrer DrugBank en conséquence — ils sont CC BY-NC, **interdit** ; utiliser les InChI publics uniquement, qui sont des données factuelles non protégées).

**Effort estimé :** 1-2 jours pour un curateur + dev assistant.

---

### Test set #2 — Corpus CDXML URD Abbaye (50-100 fichiers)

**Usage :** POC #3 — validation FR-043 (CDXML round-trip ≥ 95 % fidélité). C'est **le POC le plus risqué de la V1** ; sans ce corpus, on promet à l'aveugle.
**Référence PRD/architecture :** FR-043 acceptance criterion ("real-world test corpus sourced from URD Abbaye"), §15.1 POC #3.
**Cible quantitative :** 50-100 fichiers `.cdxml` réels.
**Composition recherchée :**

- **Mécanismes** avec curly arrows (ce qui stresse le format custom).
- **Schémas multi-étapes** avec arrows multiples et conditions (température, solvant).
- **Structures complexes** : produits de synthèse, intermédiaires, sels.
- **Annotations textuelles** : conditions, légendes, nomenclature.
- **Versions ChemDraw variées** : si possible, des fichiers générés par plusieurs versions (16.x, 17.x, 18.x, 19.x, 20.x, 21.x) pour valider la couverture.

**Source unique :** URD Abbaye. Pas de substitut public satisfaisant — les CDXML synthétiques ne reproduisent pas la réalité d'usage.

**Contraintes légales et éthiques :**

- **Anonymisation** : retirer ou pseudonymiser tout nom de doctorant, chercheur, projet sensible, brevets en cours, données non publiées.
- **Consentement explicite** des contributeurs URD Abbaye, par écrit (email suffit).
- **Licence du corpus** : à déterminer avec URD Abbaye. Recommandation : **CC0** ou **CC BY 4.0** sur les fichiers anonymisés, hébergés séparément du repo principal (pas dans `tests/fixtures/` directement, mais téléchargés via script depuis un mirror).
- **Hors Git** : le corpus ne doit pas être committé dans le repo public. Hébergement séparé (Zenodo dataset, ou bucket S3 avec accès lecture libre, ou simplement un tarball sur le serveur URD Abbaye).

**Format de stockage local (gitignored) :**

```
tests/fixtures/cdxml-corpus/
├── urd-abbaye/               # gitignored — téléchargé via scripts/fetch-cdxml-corpus.sh
│   ├── mechanisms/
│   ├── schemes/
│   ├── annotated/
│   └── manifest.json         # mapping fichier → ChemDraw version, content hash, anonymized
└── README.md                 # comment télécharger, source, licence, contact
```

**Critères d'acceptation pour le corpus :**

- ≥ 50 fichiers anonymisés et consentis.
- Couverture d'au moins 3 versions ChemDraw distinctes.
- Au moins 10 fichiers contenant des curly arrows (test critique pour FR-012 + FR-043).
- Manifest JSON listant pour chaque fichier : nom anonymisé, version ChemDraw d'origine, type de contenu, hash de contenu, contributor (anonymisé).

**Effort estimé :** **2-4 semaines de calendrier** (pas d'effort dev) — sollicitation, allers-retours, anonymisation. À démarrer **maintenant**.

**Brouillon de message à envoyer aux contacts URD Abbaye :** voir Annexe A.

---

### Test set #3 — IUPAC names → structures (200 noms)

**Usage :** POC #4 — validation FR-040 (≥ 80 % de bonne réponse sur 200 noms IUPAC).
**Référence PRD/architecture :** FR-040 acceptance criterion, §15.1 POC #4.
**Cible quantitative :** 200 noms IUPAC avec leur structure de référence.
**Composition recommandée :**

| Catégorie                           | Quantité | Difficulté                           |
| ----------------------------------- | -------- | ------------------------------------ |
| Alcanes / alcènes / alcynes simples | 30       | Trivial                              |
| Cycliques simples                   | 30       | Facile                               |
| Aromatiques substitués              | 30       | Moyen                                |
| Hétérocycles nommés                 | 30       | Moyen                                |
| Stéréo (R/S, E/Z)                   | 30       | Difficile                            |
| Médicaments INN / pharmacopée       | 30       | Difficile (noms longs, multi-stéréo) |
| Produits naturels complexes         | 20       | Très difficile                       |

**Sources de curation :**

- **PubChem** : exposer les CID, récupérer les noms IUPAC officiels via leur API.
- **ChemSpider** (si licence permet, vérifier) : noms et synonymes.
- **Wikipedia chemistry** : noms IUPAC pour les molécules notables, généralement bien sourcés.
- **Validation croisée par un chimiste** : faire relire 20-30 cas tordus par un PhD organicien (un contact URD Abbaye serait idéal).

**Format de stockage :**

```
tests/fixtures/iupac/
├── names-to-structures.json  # [{ name, expected_smiles, expected_inchi, source, difficulty }]
└── README.md
```

**Effort estimé :** 2-3 jours dev + 0.5 jour validation chimiste.

---

### Test set #4 — Structures → IUPAC names (200 structures)

**Usage :** POC #4 — validation FR-041 (≥ 80 % de bonne réponse sur 200 structures).
**Référence :** FR-041 acceptance criterion, §15.1 POC #4.
**Cible quantitative :** 200 structures avec leur nom IUPAC canonique de référence.
**Composition recommandée :** symétrique au test set #3, avec souplesse sur les synonymes valides (un nom est correct si chimiquement équivalent au nom canonique).

**Source recommandée :** **mêmes 200 structures** que le test set #3, vérifiées dans les deux directions. Économie d'effort de curation, et test de la réversibilité.

**Format de stockage :**

```
tests/fixtures/iupac/
├── structures-to-names.json  # [{ smiles, expected_name, accepted_synonyms[], source }]
└── README.md
```

**Effort estimé :** mutualisé avec le test set #3.

---

### Test set #5 — Figures de référence "publication-quality" (10 figures)

**Usage :** Validation NFR-005 — 5 figures MVP + 5 figures V1, validées par contacts URD Abbaye, ouvertes en CI dans Inkscape headless.
**Référence :** NFR-005 acceptance criterion ("at least 5 sample figures matching JACS/Angewandte style"), §8 NFR-005.
**Cible quantitative :** 10 figures (5 MVP, 5 V1).
**Composition recommandée :**

**MVP (5 figures) :**

1. Schéma de réaction simple SN2 avec conditions et arrows.
2. Mécanisme avec curly arrows électron-pushing (le test critique pour FR-012).
3. Structure complexe avec stéréochimie wedge/dash.
4. Schéma multi-étapes avec produits intermédiaires.
5. Figure annotée pour handout pédagogique (style chimiste enseignant).

**V1 (5 figures additionnelles) :** 6. Schéma de résonance avec arrows résonance. 7. Biomolécule complexe (peptide, sucre) à partir des templates. 8. Figure publication-quality JACS-like avec typographie soignée. 9. Schéma multi-page extrait d'un fichier SDF. 10. Figure incluant annotations rich-text (sub/super, lettres grecques).

**Sources :**

- **Articles JACS / Angewandte / Org. Lett.** récents (style benchmarks visuels).
- **Cours URD Abbaye** : si Marc (persona enseignant) peut partager des handouts existants comme référence stylistique.

**Format de stockage :**

```
tests/fixtures/reference-figures/
├── mvp/
│   ├── 01-sn2-scheme/
│   │   ├── source.kdx       # fichier Kendraw source
│   │   ├── expected.svg     # rendu de référence
│   │   ├── expected.png     # rendu de référence (300 DPI)
│   │   └── notes.md         # description, critères d'acceptation visuels
│   └── ...
└── v1/
```

**Effort estimé :** 2-3 jours dev (création des fichiers `.kdx` source) + 1 jour validation URD Abbaye, à effectuer **après** les premiers livrables MVP (renderer SVG fonctionnel) — pas en pré-Phase 4.

---

### Test set #6 — Benchmarks de performance (100/250/500/750 atomes)

**Usage :** POC #1 — validation NFR-001 (perf 500 atomes).
**Référence :** NFR-001 acceptance criterion, §15.1 POC #1.
**Cible quantitative :** 4 ensembles de structures à 100, 250, 500, 750 atomes.

**Composition recommandée :**

- **Synthétiques générées** (acceptable) : algorithme déterministe générant des structures aléatoires de taille cible (chaînes carbonées, fused rings, sucres polymérisés). Reproductible, déterministe, versionnable.
- **Réelles** (idéal pour les grosses tailles) : protéines courtes, polysaccharides, dendrimères. Issu de PubChem ou PDB (PDB convertible vers MOL via RDKit).

**Format de stockage :**

```
tests/fixtures/perf-benchmarks/
├── synthetic/
│   ├── chain-100.mol
│   ├── chain-250.mol
│   ├── chain-500.mol
│   ├── chain-750.mol
│   ├── ring-cluster-100.mol
│   ├── ...
├── real/
│   ├── insulin-fragment-500.mol
│   └── ...
└── manifest.json
```

**Critères d'acceptation pour les benchmarks :**

- Au moins 5 structures par taille cible (pour mesurer une moyenne, pas un cas pathologique).
- Reproductibilité : si générées, le seed et l'algo sont versionnés dans le repo.
- Mesures bench codifiées : `packages/scene/bench/perf-500.bench.ts` (référencé en §10.2 du doc d'architecture).

**Effort estimé :** 1 jour dev pour l'algo de génération + 0.5 jour pour curation des structures réelles.

---

## 2. Récapitulatif effort & calendrier

| Test set                         | Effort dev | Effort calendrier | Bloque            | Démarrage      |
| -------------------------------- | ---------- | ----------------- | ----------------- | -------------- |
| #1 — Conversions (100)           | 1-2 j      | 1 semaine         | Tests CI continus | Sprint 1       |
| #2 — CDXML URD Abbaye (50-100)   | 0.5 j      | **2-4 semaines**  | POC #3 / V1       | **Maintenant** |
| #3 — IUPAC names → struct (200)  | 2-3 j      | 1 semaine         | POC #4 / V1       | Pré-V1         |
| #4 — IUPAC struct → names (200)  | mutualisé  | mutualisé         | POC #4 / V1       | Pré-V1         |
| #5 — Figures publication (10)    | 2-3 j      | 1 semaine         | NFR-005 / release | Post-MVP       |
| #6 — Perf benchmarks (4 tailles) | 1.5 j      | quelques jours    | POC #1 / dev MVP  | Sprint 1       |

**Items à démarrer immédiatement (avant ou pendant Sprint 1) :**

1. **Test set #2 (CDXML URD Abbaye)** — 2-4 semaines de calendrier dont 0 effort dev → **envoyer le mail aujourd'hui**. Cf. Annexe A.
2. **Test set #6 (Perf benchmarks)** — bloquant pour POC #1, qui est lui-même bloquant pour le dev MVP.
3. **Test set #1 (Conversions)** — utile dès la première story qui touche `@kendraw/io` et `kendraw_chem`.

**Items pour plus tard :**

- Test sets #3 et #4 (IUPAC) : à constituer en début de V1, pas en MVP.
- Test set #5 (figures publication) : à constituer après que `@kendraw/renderer-svg` produise du SVG correct, donc post-Sprint 3-4.

---

## 3. Layout final dans le repo

À créer au début de Phase 4, en parallèle des premières stories :

```
kendraw/
└── tests/
    └── fixtures/
        ├── README.md                          # vue d'ensemble + ce document linké
        ├── conversions/
        │   ├── small/  medium/  large/
        │   ├── manifest.json
        │   └── README.md
        ├── cdxml-corpus/
        │   ├── urd-abbaye/  (gitignored)
        │   └── README.md  +  scripts/fetch-cdxml-corpus.sh
        ├── iupac/
        │   ├── names-to-structures.json
        │   ├── structures-to-names.json
        │   └── README.md
        ├── reference-figures/
        │   ├── mvp/  v1/
        │   └── README.md
        └── perf-benchmarks/
            ├── synthetic/  real/
            ├── manifest.json
            └── README.md
```

`.gitignore` ajoute :

```
tests/fixtures/cdxml-corpus/urd-abbaye/
```

Le README de `tests/fixtures/cdxml-corpus/` documentera la procédure de téléchargement (script + URL hébergement séparé) et la licence du corpus.

---

## Annexe A — Brouillon de message à envoyer aux contacts URD Abbaye

À adapter selon le contact destinataire et le niveau de familiarité. Version "premier contact formel" :

---

> **Objet :** Kendraw — sollicitation pour un corpus de fichiers ChemDraw (CDXML) anonymisés
>
> Bonjour [Prénom],
>
> Comme vous le savez, je travaille sur **Kendraw**, le projet open-source d'éditeur moléculaire moderne destiné à remplacer ChemDraw — projet pensé en grande partie pour l'usage de votre laboratoire.
>
> Pour valider une promesse critique de Kendraw — la **migration sans perte depuis ChemDraw** — j'ai besoin de tester l'import/export du format `.cdxml` sur des fichiers réels qui reflètent ce que vous produisez au quotidien (et pas sur des cas synthétiques fabriqués par moi en laboratoire).
>
> Concrètement, je sollicite votre aide pour constituer un **corpus de 50 à 100 fichiers `.cdxml`** issus de votre travail courant ou archivé, qui serviront de banc d'essai à un POC de fidélité de conversion.
>
> **Ce dont j'ai besoin idéalement :**
>
> - Des fichiers `.cdxml` couvrant : structures complexes, schémas réactionnels, mécanismes avec flèches courbes, schémas multi-étapes, annotations.
> - Des fichiers générés par plusieurs versions de ChemDraw si vous en avez (les anciennes versions sont précieuses).
> - Une diversité de chimie représentative de vos travaux (synthèse organique, médicinale, etc.).
>
> **Engagements de ma part :**
>
> - **Anonymisation complète** : tous les noms, références internes, projets sensibles, brevets en cours, données non publiées seront retirés ou pseudonymisés avant tout usage. Je peux faire l'anonymisation moi-même si vous me fournissez les fichiers, ou vous indiquer comment le faire avant transfert — comme vous préférez.
> - **Consentement explicite par écrit** : un simple email de votre part suffit, je n'ai besoin d'aucun document formel.
> - **Usage strictement limité** au test set du projet Kendraw. Pas de redistribution publique sans votre accord explicite.
> - **Licence du corpus** à définir ensemble : ma préférence va vers CC BY 4.0 sur les fichiers anonymisés, hébergés séparément du repo public Kendraw (pas committés dans Git, téléchargés à part). Mais je m'aligne sur ce qui vous met à l'aise.
> - **Crédit** : votre laboratoire (et nominativement les contributeurs qui le souhaitent) sera cité dans la documentation de Kendraw et dans le futur article académique du projet, sauf si vous préférez l'anonymat.
>
> **Calendrier :** ce corpus est nécessaire pour le **POC #3** du projet, prévu en début de V1 (donc dans plusieurs mois), mais comme la collecte et l'anonymisation prennent du temps de calendrier, je préfère démarrer maintenant. Pas d'urgence côté planning, mais l'envoi peut se faire à votre rythme sur les semaines/mois qui viennent.
>
> Si l'idée vous parle, je vous propose qu'on en discute brièvement (mail ou 15 min de visio, selon préférence) pour cadrer les détails — formats acceptables, méthode de transfert, qui fait quoi pour l'anonymisation.
>
> Et si certains points vous gênent (sensibilité de certaines données, contraintes de votre tutelle, etc.), dites-le moi sans ménagement — je trouverai une solution ou j'adapterai le scope du POC en conséquence.
>
> Merci d'avance pour votre aide. Ce corpus est l'élément qui permettra à Kendraw de tenir sa promesse de migration sans perte — sans données réelles, je ne peux pas l'engager honnêtement.
>
> Bien à vous,
> Jean-Baptiste

---

**Notes pour l'envoi :**

- À envoyer en **premier** au contact URD Abbaye le plus proche / le plus enclin à comprendre le projet OSS (probablement la personne qui a déjà été solliciée pour les retours produit).
- Si le premier retour est positif, demander une **introduction** vers les autres membres du labo plutôt que d'envoyer en masse.
- **Tracker les réponses** dans un simple fichier privé (hors repo) : qui a répondu, quand, quels fichiers reçus, statut anonymisation.
- **Suivi à 2 semaines** si pas de réponse.

---

## Annexe B — Vérification licence pour les sources publiques

| Source         | Licence des données | MIT-compat ?              | Usage Kendraw                                               |
| -------------- | ------------------- | ------------------------- | ----------------------------------------------------------- |
| **PubChem**    | Domaine public      | ✓                         | Test sets #1, #3, #4 — sans restriction                     |
| **ChEBI**      | CC BY 4.0           | ✓ (avec attribution)      | Test set #1 — citer dans `manifest.json`                    |
| **DrugBank**   | CC BY-NC 4.0        | ✗ pour usage commercial   | **Interdit** dans Kendraw OSS — utiliser PubChem à la place |
| **PDB**        | CC0                 | ✓                         | Test set #6 (perf, structures réelles)                      |
| **ChemSpider** | Restrictions API    | ⚠ vérifier au cas par cas | Préférer PubChem si possible                                |
| **Wikipedia**  | CC BY-SA 3.0        | ✓ (avec attribution)      | Référence pour test set #3 — citer la source                |

**Règle générale :** seules les sources avec licence permettant la redistribution dans un projet OSS MIT sont utilisables. Si un test set utilise des données CC BY ou CC BY-SA, le `manifest.json` doit citer la source ligne par ligne.

---

**Statut :** Ce plan est l'output de la recommandation R3 du Solutioning Gate Check. Il est approuvé pour exécution dès le démarrage de Phase 4. La constitution effective des test sets sera trackée dans les stories du Sprint Planning (§ next).

_Pour suite : `/sprint-planning` pour décomposer les 12 epics en stories, en intégrant les stories de constitution de test sets dans les premiers sprints._
