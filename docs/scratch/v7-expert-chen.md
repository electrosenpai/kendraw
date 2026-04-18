### Dr. Sarah CHEN — Chimie computationnelle, Stanford / NMRShiftDB2

Ma note V5 / V6 / V7 : **8.2 / 8.2 / 8.4**
Delta V6→V7 : **+0.2** — modeste déblocage, mais la stagnation structurelle V5→V6 n'est pas vraiment cassée. On grignote.

#### Brief factuel (pré-rempli)

- V5→V6 : delta zéro. J'attendais une boucle de calibration NMRShiftDB2, un harnais MAE/RMSE/R² publiable, des codes HOSE, σ continu en ppm, et de l'hétéronucléaire (¹⁹F/³¹P/¹⁵N). **Aucun de ces items n'a bougé entre V6 et V7.**
- Wave-1 (rappel, déjà acquis V6) : `sigma_ppm` continu (e6c9a19) + flag `d2o_exchangeable` (e6c9a19) + bandeau reproductibilité/disclaimer (ef8d2bd). C'est le socle minimal honnête sur lequel je peux désormais construire.
- Wave-2/3 : rien de matériel pour le comp-chem.
- Wave-4 P1-01 (`5010575`) : DEPT-135/DEPT-90 phase rendue (CH₂ inversé), 3-state cycle + hotkey `D` gated ¹³C. Cosmétique mais utile en démo.
- Wave-4 P1-02 (`1e5caf6`) : multiplet line list (ppm + % par raie) embarqué dans le tooltip. **C'est exploitable pour de la vérification batch** si je peux scraper le DOM ou si quelqu'un sort un dump JSON.
- Wave-4 P1-03 (`542263a`) : `parseJcampDx1D` (AFFN, XUNITS PPM/HZ, YFACTOR, ascending-ppm flip, refus stricts pour ASDF / non-NMR / freq manquante). **Substrat parfait pour une calibration HOSE sur NMRShiftDB2** — encore faut-il que quelqu'un branche la boucle.
- Wave-4 P1-06 (`e3fc0a9`) : CDXML 1.0 writer, round-trip testé. Bon pour l'interop Cambridge ; reste muet sur MOL+metadata JSON.
- Wave-7 HF-3 (`c89b71a`) : nouveau endpoint `POST /structure/clean` (`backend/kendraw_api/routers/structure.py`) appuyé sur `StructureService.clean()` (`backend/kendraw_chem/structure.py`). **Vérifié : c'est bien RDKit-based** — `mode="quick"` = `Cleanup` + `SanitizeMol` (préserve le layout), `mode="full"` = `AllChem.Compute2DCoords` (recalcule). Fallback no-op si RDKit absent. C'est exactement ce qu'il faut pour normaliser un batch MOL avant prédiction.
- Tests backend pytest : **242 → 242 → 242 → 242**. Inchangé depuis V5. Aucune nouvelle logique NMR engine. C'est le chiffre qui fait mal.

#### Ce qui s'est amélioré pour moi depuis V6

- **DEPT phase visible** (P1-01) : enfin la polarité CH/CH₂/CH₃ est rendue, pas seulement classifiée. Le truth-table de `peakPhaseSign()` est testé. Permet une lecture rapide d'un ¹³C en démo.
- **JCAMP-DX import strict** (P1-03) : couvre Bruker/JEOL/MestReNova ~95 %, refus propres sur ASDF et freq manquante. Je peux maintenant comparer prédiction vs. trace expérimentale sans pré-traitement externe. C'est le seul item « calibration-ready » de la wave et c'est précisément ce que je demandais en V5 sous la rubrique « substrat HOSE ».
- **Multiplet line list** (P1-02) : ratios vérifiés (triplet 25/50/25 ±5 %, quartet 13/38/38/13, dd ≈100). C'est une primitive de vérification numérique correcte ; reste à l'exposer en API/CSV pour qu'elle soit utilisable hors UI.
- **CDXML round-trip** (P1-06) : un format structuré de plus pour l'export inter-laboratoire. Pas un game-changer comp-chem mais ça compte pour l'écosystème Cambridge.
- **`/api/structure/clean` RDKit** (HF-3) : petite mais vraie surface programmatique. C'est le premier endpoint backend depuis V5 qui touche à de la géométrie 2D côté serveur. Le code est propre (`StructureService` probe RDKit à l'init façon `ComputeService`, fallback no-op). Si on continue dans cette direction (un endpoint `/predict` standalone, un `/descriptors`), je tiens enfin un client Python utilisable de bout en bout.
- **Audit trail SHA-256** (P1-04, V4) : pertinent pour l'angle reproductibilité/provenance que je défends depuis V5. Pas mon top-3 mais ça aide la défense en peer-review (« voici la chaîne de hash de mes 47 corrections de structure entre soumission et révision »).
- **Disclaimer reproductibilité Wave-1** (`ef8d2bd`) toujours en place et bien visible : c'est le minimum éthique et il n'a pas été retiré sous pression marketing.

#### Ce qui reste problématique ou s'est dégradé

- **Aucun client Python officiel.** Je dois toujours scripter contre l'API REST FastAPI à la main, sans schémas pydantic exportés, sans SDK, sans pagination batch. Pour 10 000 molécules je suis encore obligé de boucler en async manuel.
- **Aucun harnais d'évaluation NMRShiftDB2-grade.** Pas de jeu de test public, pas de MAE/RMSE/R² publiés, pas de comparaison vs. nmrshiftdb2/MestReNova/ACD. La promesse « prédiction NMR » ne peut toujours pas être citée dans un papier sans excuses.
- **Pas de codes HOSE.** L'algorithme reste additive-table + RDKit. Roadmap Effort XL, Impact +0.8 — toujours pas planifié.
- **Pas d'hétéronucléaire** (¹⁹F / ³¹P / ¹⁵N). Bloqueur dur pour la chimie médicinale fluorée (la moitié des candidats pharma actuels).
- **Pas de prédiction 2D (HSQC/COSY/HMBC).** Demandé par Duval aussi.
- **Backend test count plat à 242** — confirme qu'aucune nouvelle logique chimie n'a été ajoutée. Toute la wave-4/5/6/7 est frontend + IO + canvas-new behind flag. Le moteur scientifique n'a pas bougé.
- **Pas de batch endpoint** pour SMILES/MOL → prédiction. Toujours du one-shot via UI.
- **`d2o_exchangeable` reste un flag binaire** sans logique de masquage de la zone H₂O/D₂O ni indication presat/WATERGATE — V6 demande P2 toujours ouverte.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît

- **`/api/structure/clean` avec mode `quick` vs `full`.** L'idée de séparer « préserve mon layout » et « recompute from scratch » est exactement la bonne abstraction pour un pipeline batch : `quick` avant validation visuelle, `full` avant export inter-format. Je n'avais pas demandé, je le prends.
- **Multiplet line list machine-lisible** (même si encore dans tooltip) : la table per-line est une vraie primitive numérique. Avec une route `/api/nmr/multiplets` je l'utiliserais demain.
- **JCAMP-DX strict-refusal** : le refus explicite sur ASDF / freq manquante est plus précieux qu'un parser permissif qui hallucine. Bonne hygiène.
- **CDXML writer** : pas dans mon top-3 mais ça réduit la friction quand un collaborateur Cambridge envoie un fichier.

#### Bugs ou rough edges découverts à l'usage

- `/api/structure/clean` : le contrat de retour mélange `cleaned` (str), `changed` (bool) et un éventuel `error` (str). Le docstring mentionne `error="RDKit not available"` mais le `CleanResult` n'est pas une discriminated union dans le schéma OpenAPI — un client typé qui consomme la spec va devoir gérer `error: str | None` à la main. À durcir avant qu'un script de batch s'y casse les dents en silence.
- Pas de garantie que `parseJcampDx1D` survive aux JCAMP avec multi-pages (NTUPLES) ou aux 2D — non testé hors 1D. Le scope est explicite, donc plus une « rough edge documentée » qu'un bug. À mentionner dans le README import.
- Le multiplet line list est rendu dans le tooltip DOM ; pas d'API stable pour le récupérer côté programmatique. Si le markup change (et il va changer avec canvas-new), les scripts de scraping cassent.
- L'audit trail (P1-04) est marqué **« beta — tamper-evident, not non-repudiation »** : pas d'identité utilisateur. Pour mes besoins reproductibilité c'est OK ; pour la pharma compliance c'est un trou (cf. Al-Rashid).
- Le mode `full` de `/structure/clean` (`Compute2DCoords`) écrase la disposition utilisateur sans warning ni preview — un utilisateur qui clique « Clean » s'attendant à `quick` peut perdre son layout. Confirmation modale recommandée.
- Aucune métrique observabilité côté `StructureService` (pas de compteur de clean appelés, pas de timing) : difficile de profiler un batch.

#### Mes blockers restants (P0/P1/P2)

- **P0** — SDK Python officiel `kendraw-client` (typed, pydantic-export, async batch, retries). Sans ça je ne peux pas vendre Kendraw au labo comme outil reproductible.
- **P0** — Harnais d'évaluation publié : un repo `kendraw-bench` avec NMRShiftDB2 subset + MAE/RMSE/R² par nucléus + comparison table vs. ACD/MNova. Sans ça, score scientifique plafonne à 8.5.
- **P1** — Codes HOSE (Bremser 1978) comme prédicteur de premier rang, fallback ML/additive ensuite. Effort XL mais c'est le gold standard et 4/8 panélistes le demandent.
- **P1** — Hétéronucléaire ¹⁹F au minimum (³¹P et ¹⁵N idéalement).
- **P1** — Endpoint batch `POST /api/nmr/predict-batch` acceptant SMILES/MOL list, retournant CSV ou JSON-Lines.
- **P2** — Solvent-suppression display (greyed water region 4.5–4.9 ppm + presat/WATERGATE indicator) et badge confiance NH échangeable visible dans le panneau.
- **P2** — `/api/structure/clean` exposé dans l'OpenAPI avec discriminated union sur `error`, et un mode `"strict"` qui échoue dur si RDKit absent (utile pour les scripts CI).
- **P2** — Endpoint `/api/descriptors` (LogP, tPSA, HBD/HBA, MW, Lipinski/Veber/Egan/Ghose) en POST batch. Tout le code RDKit existe déjà côté `compute.py`, il faut juste l'exposer en REST avec un schéma stable.
- **P2** — Export MOL+metadata JSON unifié (atom map IDs + assignments NMR + integration values + audit chain hash) pour le round-trip avec ELN/LIMS. Le format CDXML ne couvre pas mes besoins JSON-natifs.

#### Ma recommandation sur la beta publique

**Beta publique GO conditionnel**, mais en cadrant strictement le périmètre marketing : « éditeur 2D + prédiction NMR ¹H/¹³C indicative + IO JCAMP-DX/CDXML/MOL ». **NO-GO** sur tout claim « NMR prediction quality » tant que le harnais MAE/RMSE/R² n'est pas publié. Ne JAMAIS écrire « NMRShiftDB2-comparable » dans le README ou la landing page sans benchmark à l'appui — ce serait une faute scientifique qui rebondira en peer-review et entachera la crédibilité du projet pour 2 ans. Le `disclaimer` Wave-1 (`ef8d2bd`) est correct, le garder bien visible et l'épingler aussi sur la doc OpenAPI du `/api/nmr/predict`.

Conditions précises : (a) page « Limitations » dans la doc qui liste explicitement « pas de HOSE, pas d'hétéronucléaire, pas de benchmark publié » ; (b) version semver `0.x` maintenue (pas de `1.0` avant le harnais) ; (c) tag `[BETA]` sur l'endpoint `/api/structure/clean` dans OpenAPI tant que le contrat de retour n'est pas durci.

#### Mon top 3 pour la wave suivante

1. **`kendraw-client` Python (PyPI)** + `POST /api/nmr/predict-batch` — déblocage programmatique réel.
2. **`kendraw-bench` repo public** : NMRShiftDB2 subset (1000 molécules ¹H + 1000 ¹³C), pipeline `predict → MAE/RMSE/R² par nucléus`, table comparative honnête. C'est un weekend de travail et ça change la crédibilité scientifique d'un facteur 2.
3. **¹⁹F prediction (HOSE-lite ou additive table dédiée)** — entre dans le moteur backend, fait monter le pytest count au-dessus de 242 enfin (un signal lisible que la chimie scientifique avance, pas seulement le canvas), et débloque la chimie médicinale fluorée qui représente ~50 % des candidats actifs.

---

**Verdict synthétique :** la stagnation V5→V6 n'est pas vraiment cassée — c'est un déblocage modeste, pas un vrai shift. Le `+0.2` traduit trois choses concrètes : (1) l'arrivée d'IO scientifique propre (JCAMP-DX strict + CDXML round-trip), (2) un premier endpoint backend post-V5 (`/structure/clean` RDKit-based), et (3) une primitive numérique de vérification (multiplet line list). Mais le moteur NMR lui-même n'a pas bougé d'une ligne (242 tests pytest inchangés), aucun client Python n'existe, et aucun benchmark publiable n'a été produit. La wave suivante doit absolument adresser au moins l'un des trois axes (SDK / bench / hétéronucléaire) sous peine de revoir la note à 8.0 en V8.
