# Scientific Roundtable — Wave 1

**Date :** 2026-04-17
**Format :** 8 experts, relecture indépendante, inputs pour Acte 2 (priorisation produit).
**Contexte :** suite des reviews V1→V5 (NMR) et de l'audit ChemDraw 176 features. Parité actuelle ≈ 52%.

**Règle du jeu :** chaque expert a lu les docs de vérité (`chemdraw-exhaustive-comparison.md`, `nmr-scientific-review-v5.md`, `kendraw-roadmap-to-10.md`, `kendraw-vs-chemdraw-feature-gap.md`), le code actuel (`packages/`, `backend/`) et les 30 derniers commits. Les features récentes (text annotations, hotkey gating, multiplets, DEPT, CIP, Lipinski, fused rings, flip H/V, lone pairs, document style presets, PDF export, Playwright E2E, Traefik/HTTPS) sont **exclues** de cette relecture.

---

### Pr. Marie-Claire DUVAL — Chimie organique, Paris-Saclay

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- Flèche incurvée double-barbe avec ancrage atome→atome ET liaison→liaison (mécanisme SN2, addition nucléophile) — le type `curly-pair` existe mais l'ancrage `ArrowAnchor` ne gère pas milieu-de-liaison comme source, impossible de dessiner une flèche "depuis la π de C=O" proprement — **L**
- Brackets de polymère / répétition avec indice *n* et stoechiométrie (monomères, oligomères) — absent du type system, bloquant pour tout cours sur polycondensation — **M**
- Atom mapping numbers visibles (1:1, 2:2…) pour réactions mécanistiques et retrosynthèse — le champ existe peut-être mais aucun rendu ni tool — **M**
- Reaction conditions au-dessus/dessous de la flèche (réactif, solvant, T°C, temps) en bloc structuré lié à l'Arrow — actuellement on doit poser du texte libre à côté, il décroche au déplacement — **M**
- Templates conformationnels : chair cyclohexane, Newman, Fischer, Haworth — indispensables pour stéréochimie L2/M1, absents des "fused ring templates" actuels qui sont 2D planaires — **L**
- Structure Clean-Up / "Tidy" qui ré-oriente une molécule importée avec angles 120° standard et orientation horizontale de la chaîne la plus longue — les imports CDXML/SMILES sortent souvent penchés et illisibles pour une figure — **L**
- Stéréochimie wedge/hash avec inversion automatique à la sélection du carbone source (ChemDraw bascule stéréo end au clic) — actuellement le type `bondStyle` existe mais pas de toggle rapide R↔S sans redessiner — **S**
- Orbitales (lobes p, sp², sp³) et représentation HOMO/LUMO pour cours d'orbitales frontières — aucun outil graphique dédié — **L**
- Structure-to-Name (IUPAC) — RDKit ne le fait pas, il faut STOUT ou équivalent ; sans ça je ne peux pas valider un exercice d'étudiant — **XL**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil actuel :**

- Détection automatique des flèches "impossibles" mécanistiquement (ex : flèche qui violerait octet, ou qui part d'un H vers un carbocation) avec tooltip pédagogique "attention: rupture homolytique suggérée, double-barbe incorrecte"
- Mode "correction de copie étudiant" : import PDF/photo d'un mécanisme manuscrit, OCR chimique, superposition avec mécanisme attendu et diff coloré
- Animation pas-à-pas du mécanisme : chaque flèche incurvée déclenche une transformation géométrique des électrons vers les produits, export GIF/MP4 pour slides de cours
- Prédiction de produits majeurs selon règles (Markovnikov, Zaitsev, Hofmann) avec justification textuelle pour examens ouverts
- Base locale de mécanismes de référence (Clayden, Carey & Sundberg) recherchable par substrat/conditions

**Bugs ou défauts de qualité que je constate encore aujourd'hui :**

- Seulement 9 ToolId au total (`select, add-atom, add-bond, ring, text, eraser, pan, arrow, curly-arrow`) — ChemDraw en propose plus de 40, l'ergonomie reste celle d'un prototype, pas d'un outil de recherche
- Les Arrow types `curly-radical` / `curly-pair` existent dans `types.ts` mais le rendu et l'export SVG ont historiquement perdu des flèches — à revérifier après commit 218bdf3
- Le champ `radical` existe sur Atom mais seul lui est rendu ; `lonePairs` vient d'arriver (commit b571046), `isotope` reste invisible au rendu — incohérent, un étudiant qui tape ¹³C ne voit rien
- Pas de snap angulaire 30°/60°/90° visible pendant le drag d'une liaison — mes figures sortent tordues, inutilisables pour un papier JACS
- Aucun mode "publication preview" figé à 100% DPI écran — je ne vois pas ce que donnera le PDF avant export, et les styles RSC/Wiley/Nature récents ne montrent pas d'aperçu comparatif

**Mon TOP 3 pour cette semaine :**

1. Flèches incurvées avec ancrage liaison→atome et liaison→liaison (le cœur du métier mécanistique)
2. Reaction conditions structurées attachées à la flèche de réaction (réactif/solvant/T°C au-dessus, temps en-dessous)
3. Structure Clean-Up / Tidy pour redresser les imports SMILES/CDXML en géométrie standard 120°

---

### Dr. Antoine MARCOS — Synthèse totale, MIT

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- **Flèche de réaction avec conditions above/below structurées** — j'ai vu `Arrow` avec `startAnchor/endAnchor` mais pas de slot typé `reagents`/`solvent`/`temperature`/`time`. Pour un schéma de 14 étapes je passe 40 % de mon temps à aligner "Pd(PPh3)4, K2CO3, THF/H2O, 80 °C, 12 h" au-dessus d'une flèche. Bloquant — **M**
- **Flèche rétrosynthétique (double trait ouvert ⇒)** — `arrowheadHead` ne couvre que `full|half|none`. Pas de retro arrow = pas d'analyse rétrosynthétique publiable. Bloquant pour toute fig 1 d'un paper Movassaghi-style — **S**
- **Flèches courbes de mécanisme (pushing arrows, full/half-headed, atom-to-bond anchors)** — indispensable pour tout mécanisme SN2, E1cb, rearrangement. Anchor sur lone pair et sur milieu de liaison avec contrôle de la courbure (control points Bézier). `bezier.ts` existe — il faut juste l'exposer comme outil. Bloquant — **L**
- **Numérotation automatique des composés (1, 2, 3… avec incrément et réutilisation cross-scheme)** — absent. Dans un paper JACS, je renumérote 60 fois à la main quand je réordonne les étapes. Bloquant pour workflow publication — **M**
- **Brackets/parenthèses avec stœchiométrie et indice (polymères, répétitions, sel counterions)** — pas trouvé de type `Bracket` dans le scene model. Impossible de dessiner proprement [M]ₙ, un TFA·NH, ou un complexe (cat.)₂. Bloquant — **M**
- **Templates de systèmes pontés et cage skeletons** — vous avez naphtalène/indole/stéroïde, mais pas norbornane, bicyclo[2.2.2]octane, adamantane, tropane, decalin cis/trans. Pour les alcaloïdes et terpènes, je redessine chaque ossature atome par atome — **M**
- **Wedge/hash avec stéréo relative vs absolue (bold vs hashed + "rac-" / "(±)" / "ent-" tags, et wedge-from-atom vs wedge-to-atom)** — le CIP R/S est calculé mais le rendu wedge ne distingue pas "relative" de "absolute" et ne propose pas le "wavy bond" (undefined stereo). Bloquant pour un paper de synthèse asymétrique — **M**
- **Multi-molécule alignement et "reaction scheme" layout (grid de schémas numérotés Scheme 1, Scheme 2)** — aucune primitive de layout multi-scheme. Je dois tout recomposer dans Illustrator. Bloquant — **L**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil :**

- **Rétrosynthèse assistée par IA in-canvas** — clic droit sur un motif clé → Kendraw propose 3 disconnections plausibles avec score de précédent littérature. Reaxys-lite local.
- **Scheme-to-SI auto-export** — un clic génère le Supporting Info LaTeX : structures SVG numérotées + procedures text templates "To a solution of **3** (X mmol) in Y…".
- **Yield tracking per step avec overall yield auto-calculé** — chaque flèche porte un champ `yield: 0.72`, Kendraw multiplie et affiche "overall: 8.4 % over 12 steps" en bas de scheme.
- **Mechanism playback mode** — animation step-by-step des flèches courbes (arrow push 1 → intermédiaire → arrow push 2).
- **Retro tree panel** — panneau latéral qui construit l'arbre rétrosynthétique depuis le canvas (target → précurseurs → SM commerciaux), avec check "available from Sigma" via PubChem.
- **Selectivity annotator** — cliquer sur une face prochirale/un H diastéréotopique et Kendraw tag "Re/Si" ou "pro-R/pro-S" automatiquement, avec la logique CIP qui existe déjà.

**Bugs ou défauts de qualité que je constate :**

- Atom type porte `lonePairs`, `isotope`, `stereoParity` mais seuls les radicaux sont rendus (les lone pairs dots sont arrivés, mais l'isotope display ¹³C/D/¹⁵N pas encore).
- Arrow type coverage gap historique. `arrows.test.ts` existe mais pas de tests de rendu visuel regression.
- Seulement 8 outils au total dans la palette — sous-dimensionné pour synthèse totale.
- Pas de backend `scheme.py` ou `retrosynth.py` dans `kendraw_chem/` — tout le raisonnement chimique est moléculaire, rien sur les réactions. Rxn SMILES/SMARTS absent.
- CDXML convert existe (`convert_cdxml.py`) mais la fidélité sur les arrows labeled (slot above/below) et brackets est douteuse.
- Pas de snap-to-grid configurable.

**Mon TOP 3 pour cette semaine :**

1. **Flèche de réaction avec slots structurés `reagents`/`conditions` above/below + parsing basique "Pd(PPh3)4, K2CO3, THF, 80°C, 12h"** (M).
2. **Flèches courbes de mécanisme (full/half-headed Bézier, anchor atom/bond/lone-pair)** en exploitant `bezier.ts` déjà présent (L).
3. **Numérotation automatique des composés cross-scheme (1, 2, 3… persistés dans le scene)** (M).

Bonus S : **retro arrow (⇒)** — variant d'arrowhead, 1 jour de boulot.

---

### Pr. Kenji YAMAMOTO — Spectroscopie et pédagogie, Kyoto

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- **Assignation croisée structure↔pic imprimable** — étiquettes H_a/H_b/H_c posées sur les protons du dessin ET reportées automatiquement sur le spectre, avec flèches de correspondance. Le highlight bidirectionnel est interactif mais ne survit pas à l'export PNG/SVG. — **M**
- **Pas de prédiction 2D : COSY, HSQC, HMBC, NOESY** — `nmr_service.py` ne supporte que `1H` et `13C`. 80% du raisonnement structural moderne passe par la 2D. — **XL**
- **Pas de module IR ni de spectrométrie de masse** — aucun endpoint dans `backend/kendraw_chem/`. Un cours de spectro couvre RMN+IR+SM ensemble. — **XL**
- **Export PDF vectoriel multi-panneau pour manuel** — pas d'export composite « structure + spectre + tableau d'intégration + légende » en une seule page A4/Letter prête à coller dans LaTeX. PNG à dpr=2 insuffisant pour offset. — **M**
- **Pas d'import JCAMP-DX / Mnova / Bruker** — impossible de charger un spectre expérimental réel et de le superposer à la prédiction. Exercice pédagogique N°1. — **L**
- **Pas de référence TMS ni de réglage de la largeur de raie** — pas de pic TMS à 0.00 ppm, linewidth fixe. — **S**
- **Pas de gestion des protons échangeables (OH/NH) en fonction du solvant** — pas de marqueur « pic qui disparaît en D2O ». — **S**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil :**

- **Mode « explique-moi ce multiplet »** — clic sur un pic → texte narratif : « triplet car 2 voisins équivalents, J=7.2 Hz typique d'un CH2-CH3 aliphatique… ».
- **Générateur d'exercices à trous** — molécule masquée, spectre + intégration affichés, auto-correction.
- **Arbre de splitting animé** — animation pas-à-pas singulet → doublet → dd.
- **Mode « anti-triche » pour examens** — isomères équivalents distribués différemment selon étudiant.
- **Superposition prédit/expérimental avec carte de confiance** — fond coloré vert/orange/rouge par région.

**Bugs ou défauts de qualité que je constate :**

- **Confiance 3 tiers trop grossière** — pas de bandes d'erreur en ppm. Un étudiant croit que 7.25 ppm ± rien = certain.
- **Pas de distinction diastéréotopique** — deux H d'un CH2 prochiral sortent avec le même δ.
- **Export SVG sans métadonnées sémantiques** — ni `<title>`, ni `<desc>`, ni `aria-label`. Inutilisable avec lecteur d'écran. Daltoniens : DEPT vert/rouge.
- **Unités mélangées dans l'export CSV** — `coupling_hz` séparé par `;`, casse à l'import Excel français.
- **Frequencies sélecteur limité** — manque 60 MHz (benchtop Nanalysis/Magritek) très utilisés en TP L2.
- **Pas de bouton « reset view / zoom » accessible clavier** — Esc/Home devrait recentrer.

**Mon TOP 3 pour cette semaine :**

1. **Annotations persistantes exportées (structure↔spectre)** — H_a/H_b visibles sur canvas ET reportés sur SVG/PNG export avec flèches. **(M)**
2. **Export PDF composite « fiche spectro »** — structure + spectre + table intégrations + métadonnées, vectoriel, prêt pour LaTeX. **(M)**
3. **Bandes d'erreur ±Δppm sur chaque pic + marqueur D2O-exchangeable**. **(S+S)**

---

### Dr. Sarah CHEN — Chimie computationnelle, Stanford / NMRShiftDB2

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- **Export Gaussian/ORCA/NWChem input** (coords XYZ + route, charge/multiplicité, basis) — impossible de passer de Kendraw à un calcul DFT. — **L**
- **Génération 3D + conformères ETKDGv3 + minimisation MMFF94/UFF** avec export SDF multi-conformer + énergies — RDKit l'a en natif, zéro endpoint exposé. — **M**
- **Validation NMR contre NMRShiftDB2** : aucun `test_nmr_benchmark` MAE/RMSE + CI budget. — **L**
- **Incertitude par pic** (sigma ppm, IC 95%) dans `NmrPeak` — seul un `confidence` qualitatif existe. — **M**
- **API batch / streaming** (POST `/compute/nmr/batch` NDJSON) — actuellement 1-molécule-1-requête. — **M**
- **Export SDF multi-molécules avec propriétés taguées** — `packages/io/src/` n'a que MOL V2000 mono-molécule. — **M**
- **Structural alerts PAINS / Brenk / NIH / tox** via `rdkit.Chem.FilterCatalog`. — **S**
- **Reproductibilité** : `engine_version`, `table_hash`, `rdkit_version`, `seed` dans chaque réponse. — **S**
- **Import/export InChI + InChIKey** symétrique (import InChI → structure). — **S**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil :**

- **Pipeline "retrain local"** — upload CSV (SMILES, shift expérimental) → fine-tuning coefficients additifs + modèle versionné.
- **Diff de prédiction entre versions** sur jeu de référence, delta-MAE par environnement.
- **Uncertainty-aware multiplet rendering** — ombrage pic proportionnel à sigma.
- **Assignment consistency check** — matching Hungarian entre pic-list expérimental et prédit.
- **Export ONNX/TorchScript** du modèle NMR.

**Bugs ou défauts de qualité que je constate :**

- `ENGINE_VERSION = "0.2.0"` hardcodé, pas de hash table → reproductibilité cassée.
- `routers/nmr.py` : 413 basé sur string-match, devrait utiliser exception typée.
- `naming.py` = 5 lignes, `stereo.py` = 5 lignes : placeholders exposés comme prêts.
- Pas d'endpoint batch → benchmark 500 molécules = 500 requêtes séquentielles.
- `NmrRequest.solvent` accepte toute string, aucune validation Enum.
- `MolecularProperties` n'a pas `num_rotatable_bonds`, `num_aromatic_rings`, `QED`, `SA_score`.
- Pas de coordonnées 3D / `conformer_id` dans la réponse compute.
- Pas d'endpoint `/version` avec `{rdkit, python, kendraw_chem, nmr_engine, table_hash}`.

**Mon TOP 3 pour cette semaine :**

1. **`/compute/nmr/batch` + `/compute/nmr/validate`** acceptant CSV NMRShiftDB2 → MAE/RMSE/histogramme. **(L)**
2. **`/compute/3d` ETKDGv3 + MMFF94** → SDF multi-conformer + `/compute/export/gaussian`. **(M)**
3. **Reproducibility block dans toute réponse** `{engine_version, table_sha256, rdkit_version, git_sha, seed}` + `sigma_ppm` par pic. **(S)**

---

### Dr. Lisa PARK — ex-PM ChemDraw, product

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- **Autosave + recovery après crash** — aucun IndexedDB/localStorage scheduler. Un chimiste qui perd 2h ne revient jamais. Dealbreaker #1. — **M**
- **Format natif partageable (.cdx / .cdxml import-export)** — sans ça, 20 ans d'archives ChemDraw restent bloquées. Même un import read-only débloque 80% des cas. — **L**
- **Copier/coller inter-app (MOL/SMILES/SVG dans le clipboard OS)** — Ctrl+C → paste dans Word/PowerPoint/Notion = workflow quotidien. — **M**
- **Templates utilisateur réutilisables + bibliothèque perso** — "Save as template" user-side. — **M**
- **Reaction arrow conditions above/below + équilibre + retrosynthèse** — éditorial indispensable. — **M**
- **Multi-page / multi-scheme document** — SI = N pages A4 avec schémas indépendants. — **L**
- **Numérotation automatique des composés (1, 2, 3a, 3b)** — obligatoire publication. — **M**
- **SSO / auth enterprise + workspace partagé** — sans ça, zéro pharma. — **XL**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil :**

- **"Paste any image → vectoriser en molécule éditable"** (DECIMER/MolScribe local).
- **Co-édition temps réel type Figma** avec commentaires ancrés sur une liaison.
- **"Explain this mechanism" — diff animé** entre deux étapes, flèches courbes auto-générées depuis SMILES_reactant >> SMILES_product.
- **Mobile/tablet first-class (Apple Pencil, palm rejection)** — PWA iPad en TP = 500k utilisateurs captifs.

**Bugs ou défauts de qualité que je constate :**

- **"First 10 minutes" muette** — aucun onboarding, sample, tour guidé. 70% churn avant 3 min.
- **Accessibilité canvas = zéro** — pas d'ARIA, pas de navigation clavier des atomes, pas de focus ring. Échec WCAG 2.1, bloque achats publics/NIH.
- **Score 52% + README "Not usable"** — suicide marketing. Réécrire orienté "what you CAN do".
- **Undo/redo probablement non-transactionnel** sur opérations composées (flip H/V + stereo recalc, fused ring).

**Mon TOP 3 pour cette semaine :**

1. **Autosave IndexedDB toutes les 5s + "Restore previous session"** — 2 jours, supprime #1 dealbreaker. **(S/M)**
2. **Copier/coller OS multi-MIME (SMILES + MOL + SVG + PNG)** — débloque "Kendraw dans Word". **(M)**
3. **Onboarding guidé "First reaction in 60 seconds"** + réécriture README orientée bénéfices (cacher le %). **(S)**

Warnings stratégiques :
- Le .cdx reader est le cheval de Troie — sans lui, attendez la prochaine génération.
- Ne construisez PAS la SSO/audit trail maintenant — piège pharma 6 mois pour 3 deals hypothétiques. Restez academia jusqu'à 70% parité.

---

### Pr. Hassan AL-RASHID — Pharma et FDA

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- **Structures Markush (R-groupes, listes d'atomes, brackets répétitifs)** — sans cela, ni brevet, ni dossier IND exploratoire. Blocage n°1 med-chem. — **XL**
- **Audit trail 21 CFR Part 11** — qui/quand/signature/versioning/hash. Sans cela, aucun usage GxP. — **L**
- **Tableau SAR natif** — grille R1/R2/R3 × composés liée au scaffold, export CSV/SDF avec IC50/Ki. — **L**
- **Peptides et biologiques** — HELM v2, 1L/3L, ponts S-S, cyclopeptides, PTM, ADC linker-payload. — **XL**
- **Intégration base de données live** — PubChem CID / ChEMBL / DrugBank / InChIKey lookup. — **M**
- **Nom IUPAC et InChI/InChIKey bidirectionnels** — pas de name generator. Bloquant INN, CAS, FDA. — **L**
- **Reaction atom mapping + RXN/RDF export** — requis pour IND CMC. — **L**
- **Validation structurelle pharma** (valence, charges, tautomères canoniques, sanity check anions) avec rapport QA. — **M**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil :**

- **SAR heatmap auto-colorée** Free-Wilson visuel sur le scaffold.
- **Alerte PAINS/Brenk/tox live** pendant dessin, sous-structures réactives surlignées.
- **Prédicteur de sites métaboliques (CYP450) overlay** sur atomes probables.
- **Annotation de liaisons protéine-ligand** depuis PDB drag-and-droppé.
- **INN stem checker** — suffixe INN correct (-mab, -tinib…) selon classe.
- **Diff structural versionné** — lead vs analogue avec surlignage atomes modifiés.

**Bugs ou défauts de qualité que je constate :**

- **Score "Not Usable" dans README** + parité ~52% : incohérence qui tuerait crédibilité face à évaluateur FDA.
- **Aucun disclaimer "Not for regulatory submission"** dans UI/export PDF — risque juridique direct.
- **Descripteurs LogP/tPSA/Lipinski** sans citation de méthode (Crippen ? Wildman ? RDKit default ?) ni IC.
- **Stéréo CIP récente** : pas de mention version IUPAC 2013 vs legacy, pas de gestion P/M (atropisomérie, axial chirality).
- **Pas de validation "charge neutre globale"** — oubli du COO⁻ sur ammonium quaternaire silencieux.

**Mon TOP 3 pour cette semaine :**

1. **Markush / R-groupes MVP** (R1, R2 labels + table de substituants) — débloque brevets et SAR. **XL** mais catégorie d'usage change.
2. **InChIKey + IUPAC name export** via OPSIN/RDKit + import depuis InChIKey. **L**.
3. **Disclaimer + provenance metadata** dans PDF export : "Research use only, not for regulatory submission", hash SHA-256, timestamp, auteur, version descripteurs. **S**.

---

### Marina VOLKOV — Étudiante M2, beta-testeuse quotidienne

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- **Export/import .cdx et .cdxml natif** — directeur refuse SVG/PDF dans docs Word. Dealbreaker #1. — **XL**
- **Copier-coller molécule → Word/PowerPoint éditable** (OLE ou image vectorielle avec SMILES embed) — zéro round-trip actuellement. — **L**
- **Flèches de mécanisme courbes éditables** (single-barb, double-barb, fishhook) avec ancrage atomes/liaisons. 80% de mon taf photoredox. — **L**
- **Brackets polymères `[ ]n` avec indice**. — **M**
- **Atom/bond numbering auto-affiché** (numérotation IUPAC clic droit). — **M**
- **Groupes fonctionnels templates** raccourcis (Boc, Cbz, Fmoc, Ts, Ms, TBS, TBDPS, PMB) — taper `Boc` et drop direct. — **M**
- **Sélection par lasso** — indispensable pour choper un fragment dense. — **S**
- **Alignement/distribution** entre plusieurs molécules. — **M**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil :**

- **Export Markdown + SMILES embedded pour Obsidian** — bouton "copy as Obsidian callout" + YAML SMILES/InChI/MW, update live. Ce serait votre moat.
- **Mode "lab notebook"** — timestamp, tag projet, historique versions git-like.
- **Recherche inverse de réaction** — produit + réactif → conditions plausibles Reaxys/USPTO.
- **Voice-to-structure mobile** — "cyclohexanone alpha-bromée" → structure.
- **Co-édition live Figma-like** en réunion de groupe.

**Bugs ou défauts de qualité que je constate encore aujourd'hui :**

- **Pas de vrai dark mode** — canvas SVG reste blanc, migraine la nuit. — **S**
- **Mobile/iPad inutilisable** — touch drag = pan, pinch = zoom page web au lieu du canvas. — **L**
- **Undo/redo pète sur text annotations** — légende disparaît, curseur reste actif, frappe suivante crée annotation fantôme. — **S**
- **Import SMILES long (>80 atomes)** freeze canvas 2-3s sans spinner. — **S**
- **Cheatsheet raccourcis (`?`) pas searchable** — pas de champ recherche/catégories. — **S**
- **Pas de feedback visuel quand je survole un atome avec l'outil bond** — clique à côté, liaison flottante, undo. — **S**
- **Presets RSC/Wiley/Nature pas persistants** entre sessions. — **S**

**Mon TOP 3 pour cette semaine :**

1. **Flèches de mécanisme courbes** — sans ça je repasse sur ChemDraw chaque jour.
2. **Dark mode canvas + persistence presets** — deux petits fix énormes pour moi.
3. **Export Obsidian (SVG + YAML SMILES/MW/InChI)** — feature unique, moat potentiel.

Bonus rant : raccourcis pas documentés/unifiés, labmates se cassent les dents.

---

### Thomas WEBER — Admin IT pharma, déploiement 400+ users

**Features ChemDraw encore absentes de Kendraw qui me bloquent :**

- **SSO SAML2/OIDC/LDAP** — aucune trace. `kendraw_settings/config.py` = api_key symbolique. Inacceptable 400 users ISO 27001. — **XL**
- **RBAC + comptes utilisateurs serveur-side** — pas de modèle user/group/role, pas de DB persistante. — **XL**
- **`/metrics` Prometheus + Grafana dashboards** — `kendraw_observability/` = structlog JSON seul. — **M**
- **Build offline / air-gap** — tout tire du réseau, pas d'image pré-bundled, pas de SBOM CycloneDX/SPDX. — **L**
- **Backup/restore serveur scenes + audit trail** — stockage 100% client (IndexedDB). Perte totale au changement poste. — **L**
- **CORS middleware réellement câblé** — `cors_origins` existe en settings mais **n'est pas branché** sur FastAPI `CORSMiddleware`. Sécurité factice. — **S**
- **Rate-limiting / DoS** sur backend — aucune slowapi. Un user saturant RDKit avec max_mol_atoms=5000. — **S**
- **Manifests Kubernetes / Helm chart** — uniquement Docker Compose, pas de chart, pas de HPA. — **L**
- **Headers sécurité HTTP (CSP, HSTS, X-Frame-Options, COOP/COEP)** — listés en checklist, rien appliqué. — **S**
- **Gestion secrets** — `api_key` env var brute, pas de Docker secrets/Vault. — **M**

**Features que j'AIMERAIS avoir et qui n'existent dans AUCUN outil :**

- **Mode tenant multi-labo avec cloisonnement GDPR** (data residency DE/CH/US), scellement crypto par tenant.
- **SBOM live + dashboard CVE auto-généré** (pas juste `npm audit` statique).
- **"Reproducible deployment hash"** signé Sigstore/cosign, vérifiable EMA.
- **Telemetry opt-in anonymisée différentielle** (k-anonymity côté client).
- **Scene-store fédéré** via S3 MinIO interne + protocole fédéré cross-institut.

**Bugs ou défauts de qualité que je constate :**

- **CORS factice** : settings présent, middleware non câblé. À corriger avant pilote.
- **Pas de healthcheck Docker** dans `docker-compose.yml`, Traefik route potentiellement vers mort.
- **`Dockerfile.backend` non-root ?** — à vérifier, RDKit en root pharma = non-départ RSSI.
- **`letsencrypt/` 700 root dans repo** — risque commit accidentel `acme.json` avec clés TLS.
- **`GIT_COMMIT=unknown` par défaut** — traçabilité build cassée silencieusement.
- **Aucun log-rotation** ni max-size, Docker remplit /var en semaines.

**Mon TOP 3 pour cette semaine :**

1. **Câbler CORSMiddleware + security headers Traefik + healthchecks Docker** — S+S+S, 1 jour, débloque pilote.
2. **`/metrics` Prometheus + rate-limiting slowapi + non-root Dockerfile** — M, avant 400 users.
3. **SBOM CycloneDX en CI + image air-gap documentée** — L, pour zone validée.

Pour pilote R&D non-GxP 20 chimistes avec points 1-3 : GO. Pour 400 users pharma réglementée : SSO+RBAC+audit trail roadmap trimestrielle obligatoire.

---

## Synthèse pour Acte 2

**Convergences fortes (≥3 experts demandent la même chose) :**

1. **Flèches courbes de mécanisme** (Duval, Marcos, Marina) — bloquant pédagogie + synthèse + daily user
2. **Reaction arrow avec conditions above/below structurées** (Duval, Marcos, Park)
3. **Numérotation automatique des composés** (Marcos, Park, Marina)
4. **Brackets polymères/répétition** (Duval, Marcos, Marina)
5. **Copier/coller OS multi-MIME** (Park, Marina) — + convergence avec "interop inter-app"
6. **Autosave + recovery** (Park) — et Marina mentionne perdre du travail
7. **CORS/sécurité headers/healthchecks** (Weber) — base indispensable production
8. **Reproducibility metadata dans API** (Chen, Al-Rashid) — provenance / audit

**Divergences remarquables :**

- Park dit "pas de SSO maintenant" vs Weber dit "SSO obligatoire pour 400 users" → cible d'usage à trancher en Acte 2 (academia vs pharma).
- Al-Rashid veut Markush XL vs Park dit "focus workflow immédiat" → trade-off pharma vs academia.

**Quick wins identifiés (S, impact large) :**

- Retro arrow variant (⇒) — Marcos
- Dark mode canvas — Marina
- Persistence des presets document-style — Marina
- Hover feedback atom avec outil bond — Marina
- CORS middleware câblage + healthchecks — Weber
- Reproducibility block dans réponses API — Chen
- Disclaimer "research use only" — Al-Rashid
- Bandes d'erreur ±Δppm tooltip NMR — Yamamoto
- Sélection lasso — Marina
- Templates groupes fonctionnels (Boc/Cbz/Fmoc/Ts/PMB) — Marina

**Wishlist long terme (XL, documenter mais ne pas implémenter cette semaine) :**

- Markush / R-groupes pharma
- Prédictions NMR 2D (COSY/HSQC/HMBC)
- IR / Mass Spec
- SSO SAML/OIDC
- Co-édition live Figma-like
- OCR chimique DECIMER/MolScribe
- Voice-to-structure mobile
- IUPAC name generator
