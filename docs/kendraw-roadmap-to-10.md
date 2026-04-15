# Kendraw NMR — Roadmap vers 10/10

**Table ronde V4 bis — 2026-04-14**
**Baseline:** V4 Score 7.4/10 (arithmétique), 6.5/10 (pondéré recherche)
**Question posée:** "Que faudrait-il pour que vous donniez 10/10 à Kendraw ?"
**Méthode:** 8 experts indépendants (subagents), aucun filtre, aucune limite

---

## Partie 1 — Réponses individuelles des experts

---

### Pr. Marie-Claire DUVAL — De 7/10 à 10/10

_Professeure Chimie Organique, 25 ans d'XP, Paris-Saclay. Son 10/10 = ChemDraw remplacé à 100% dans son labo de 30 chercheurs._

**Features MANQUANTES (ce qui n'existe pas du tout) :**

1. **Prédiction ¹³C** — Modèle HOSE-code sur base ≥50 000 structures, erreur cible <±2 ppm aromatiques, <±3 ppm carbonyles — Effort: XL — Impact: +1.2
2. **Multiplicités complexes (dd, ddd, dt, dq, m)** — Arbre de couplages automatique à partir des ³J et ⁴J calculées — Effort: L — Impact: +0.4
3. **Différenciation cis/trans vinylique** — ³J_trans ≈ 12–18 Hz, ³J_cis ≈ 6–12 Hz, lecture de la stéréochimie E/Z depuis le dessin — Effort: L — Impact: +0.3
4. **Prédiction ³¹P** — Ligands phosphorés et catalyseurs au palladium, domaine -300 à +300 ppm, ref H₃PO₄ — Effort: L — Impact: +0.3
5. **Prédiction ¹⁹F** — CF₃, F aryl, F alkyl, domaine -60 à -220 ppm — Effort: L — Impact: +0.2
6. **Export JCAMP-DX (.jdx)** — Format standard Bruker/Jeol, pour import dans MestReNova — Effort: M — Impact: +0.2
7. **Export JSON structuré** — Schéma public {nucleus, solvent, peaks: [{shift, multiplicity, J, assignment, confidence}]} — Effort: S — Impact: +0.1
8. **Marqueurs de pics de solvant résiduels** — CDCl₃ 7.26, DMSO-d₆ 2.50, D₂O 4.79, solvant sélectionnable — Effort: M — Impact: +0.2
9. **Courbes d'intégration** — Intégrale relative normalisée, ligne en S, ratio molaire "3H", cliquable pour renormaliser — Effort: M — Impact: +0.2
10. **Numérotation des protons (H-1, H-2...)** — Badge numérique IUPAC sur chaque H, synchronisé avec la liste de pics — Effort: M — Impact: +0.1
11. **Export SVG vectoriel** — Pour articles et présentations, axe ppm + pics + étiquettes + metadata — Effort: M — Impact: +0.1
12. **Mode comparaison prédit/expérimental** — Import JCAMP-DX, superposition, calcul RMSE automatique — Effort: XL — Impact: +0.4
13. **Base de données de spectres de référence** — ≥500 structures (SDBS AIST ou base interne) pour validation — Effort: XL — Impact: +0.3
14. **Gestion rotation restreinte amides** — Warning rotation lente + affichage deux conformères si barrière >15 kcal/mol — Effort: L — Impact: +0.2
15. **Mode PWA/offline** — Service worker, tables de shifts en cache, prédiction locale — Effort: L — Impact: +0.1
16. **Impression PDF rapport de caractérisation** — Structure + tableau shifts + spectre + confiance + date — Effort: M — Impact: +0.2
17. **Gestion des mélanges** — Spectres superposés de 2+ molécules avec couleurs distinctes — Effort: L — Impact: +0.2
18. **Import/Export SMILES et InChI** — Saisie SMILES + export InChIKey avec chaque prédiction — Effort: M — Impact: +0.2
19. **Historique des prédictions** — 50 dernières prédictions avec miniature, date, nom, exportable ZIP — Effort: M — Impact: +0.1
20. **Couplages longue distance ⁴J** — Aromatiques (0–1.5 Hz), allyliques (0–3 Hz), propargyliques (2–3 Hz) — Effort: L — Impact: +0.2

**Features INSUFFISANTES :**

1. **Table des hétérocycles** — 4 types → ≥30 hétérocycles avec valeurs SDBS — Effort: L
2. **Système de confiance** — Score continu 0–100% par pic, barre numérique, pic plus pâle si moins sûr — Effort: M
3. **Précision NH amides** — Modèle spécifique amide/sulfonamide/urée/carbamate, erreur cible <±0.4 ppm — Effort: M
4. **Effets du solvant** — Sélecteur opérationnel : CDCl₃, DMSO-d₆, D₂O, CD₃OD, acétone-d₆, C₆D₆ — Effort: L
5. **N-méthyle cycles azotés** — Distinguer N-CH₃ amide cyclique / amine tertiaire / amide acyclique, cible <±0.3 ppm — Effort: M
6. **Support stéréochimie R/S** — Corrections diastéréotopiques sur CH₂ proches du centre stéréogène — Effort: XL
7. **Zoom et navigation** — Molette, drag, double-clic reset, boutons +/- — Effort: M
8. **Résolution pics chevauchants** — Déconvolution visuelle ou mode liste de pics — Effort: M
9. **Raccourcis clavier éditeur** — Ctrl+Z/Y multi-niveaux, Delete, Ctrl+A, Escape — Effort: M
10. **Accessibilité et i18n** — Interface français, WCAG AA, texte redimensionnable — Effort: M

**Features INCORRECTES :**

1. **C8-H caféine** — 0.46 ppm d'erreur, manque correction courant de cycle croisé purine — Cible: <±0.15 ppm
2. **Cinnamaldéhyde Hα** — 1.2+ ppm erreur, absence contribution anisotrope conjuguée — Cible: 7.54 ±0.25 ppm
3. **Cinnamaldéhyde Hβ** — Erreur couplée, ³J_trans doit être 15.8 Hz — Cible: 6.70 ±0.20 ppm
4. **NH amide paracétamol** — 2.1 ppm erreur, traité comme NH amine simple — Cible: <±0.4 ppm
5. **OH/NH largeur de raie** — Affichés comme singulets fins, devraient être "bs" (broad singlet) — Cible: largeur élargie + "exchangeable"
6. **Protons diastéréotopiques CH₂** — Affichés comme équivalents, doivent donner 2 signaux — Cible: détection + Δδ estimé
7. **Blindage anisotropique ring current** — Protons benzyliques mal corrigés — Cible: modèle Johnson-Bovey/Haigh-Mallion

**TOP 3 :** 1) ¹³C prediction 2) NH amide + modèle solvant 3) Zoom + multiplicités complexes

**Feature rêve :** Mode « Identification par spectre inverse » — saisir une liste de pics ¹H et obtenir 5 structures candidates avec score de correspondance.

---

### Dr. Antoine MARCOS — De 6.8/10 à 10/10

_Post-doc synthèse totale, MIT, publie dans JACS. Son 10/10 = dessine, prédit, confirme, publie, TOUT dans Kendraw._

**Features MANQUANTES :**

1. **Prédiction 13C** — Algorithme SCS Grant-Paul (1964) — Effort: L — Impact: +1.2
2. **Simulation DEPT-135/DEPT-90** — Distinguer CH/CH2/CH3/quaternaire, obligatoire pour SI JACS — Effort: M — Impact: +0.4
3. **Couplages vicinal J cis/trans** — Équation de Karplus, ³J_trans ≈ 15–16 Hz — Effort: M — Impact: +0.3
4. **Multiplicités complexes (dd, ddd, dt, m)** — Arbre de couplage simulé — Effort: L — Impact: +0.3
5. **Overlay spectre expérimental** — Import JCAMP-DX, superposition — Effort: L — Impact: +0.5
6. **Import/Export JCAMP-DX** — Format universel Bruker/JEOL/Agilent — Effort: M — Impact: +0.3
7. **Export SVG** — Vectoriel 600 DPI pour figures JACS — Effort: S — Impact: +0.1
8. **Marqueurs pics solvant résiduel** — DMSO, CDCl₃, CD₃OD — Effort: S — Impact: +0.15
9. **Numérotation protons sur structure 2D** — Indispensable pour molécules à 40 atomes — Effort: S — Impact: +0.2
10. **COSY simulé** — Corrélations ³J proton-proton — Effort: XL — Impact: +0.3
11. **HSQC simulé** — Corrélations C-H directes — Effort: XL — Impact: +0.2
12. **HMBC simulé** — Corrélations C-H longue portée 2-3 liaisons — Effort: XL — Impact: +0.2
13. **Courbes d'intégration** — Ratios protons, comparaison expérimental — Effort: M — Impact: +0.2
14. **Prédiction 19F** — Réactifs fluorés (DAST, Selectfluor) — Effort: L — Impact: +0.1
15. **Génération automatique texte SI** — "¹H NMR (400 MHz, CDCl₃) δ 7.43 (d, J = 8.2 Hz, 2H)..." format JACS — Effort: M — Impact: +0.4
16. **Gestion multi-composés / projet synthèse** — 8–15 intermédiaires en parallèle, historique — Effort: XL — Impact: +0.3
17. **Bibliothèque de fragments** — Sauvegarder/réutiliser sous-structures (indole, cyclohexanone) — Effort: M — Impact: +0.15
18. **Formule brute, MW, masse exacte HRMS** — Intégré depuis la structure — Effort: S — Impact: +0.1

**Features INSUFFISANTES :**

1. **Confiance 3 niveaux** — Tooltip étendu avec justification textuelle de la couleur — Effort: S
2. **Atténuation hétérocycles fusionnés** — Seulement 4 types, besoin ≥20 types communs — Effort: L
3. **Export PNG** — Résolution paramétrable 300/600 DPI, taille colonne JACS 8.5/17.8 cm — Effort: S
4. **Éditeur moléculaire** — Parité raccourcis ChemDraw, templates cycles 3–8 membres — Effort: L
5. **Gamme spectrale / zoom** — Zoom interactif molette + sélection de région — Effort: M
6. **Highlighting bidirectionnel** — Montrer tous les coupleurs d'un proton, pas juste son pic — Effort: M

**Features INCORRECTES :**

1. **J-couplage vinyl E/Z** — 7.0 Hz prédit vs 15–16 Hz trans réel — Cible: Karplus
2. **Multiplicités diastéréotopiques** — "t" prédit au lieu de "dd" pour CH₂ chiral adjacent — Cible: détecter diastéréotopie
3. **Protons NH/OH** — Singulets fins au lieu de broad singlets variables — Cible: "bs" + plage + "exchangeable"
4. **Symétrie moléculaire** — Protons équivalents regroupés correctement — Cible: détection automatique symétrie

**TOP 3 :** 1) 13C + DEPT-135 2) Génération texte SI format JACS 3) Overlay expérimental (import JCAMP-DX)

**Feature rêve :** "Match Score" automatique entre spectre prédit et expérimental importé — score de concordance, surlignage des discordances, hypothèses sur pics non expliqués.

---

### Pr. Kenji YAMAMOTO — De 8.2/10 à 10/10

_Professeur spectroscopie, Kyoto, auteur de textbook. Son 10/10 = TOUS ses cours/TD/examens dans Kendraw + recommandation officielle dans son textbook._

**Features MANQUANTES :**

1. **Prédiction ¹³C** — Indispensable pour TD corrélation HSQC, attribution complète — Effort: XL — Impact: +0.8
2. **Multiplicités complexes (dd, ddd, dt, m)** — Systèmes AMX, ABX, couplages vicinals + géminaux — Effort: L — Impact: +0.4
3. **Marqueurs pics solvant résiduel** — CDCl₃, DMSO-d₆, D₂O, CD₃OD — Effort: S — Impact: +0.2
4. **Courbes d'intégration** — Premier outil d'attribution en ¹H — Effort: M — Impact: +0.3
5. **Numérotation protons (H-1, H-2…)** — Pour TD attribution et sujets d'examen — Effort: M — Impact: +0.2
6. **Mode examen/quiz** — Masquer structure ou spectre, l'étudiant attribue et valide — Effort: L — Impact: +0.3
7. **Export SVG** — Vectoriel pour textbook Springer — Effort: M — Impact: +0.2
8. **Sélection fréquence (300/400/500/600 MHz)** — Montrer l'effet sur la résolution des multiplets — Effort: M — Impact: +0.2
9. **Simulation DEPT/HSQC/COSY** — Même simplifiée, pour enseigner le principe de corrélation — Effort: XL — Impact: +0.4
10. **Prédiction ³¹P, ¹⁹F** — 30% des molécules M2 ont P ou F — Effort: XL — Impact: +0.2
11. **Correction anisotropie ring current** — Protons axiaux/équatoriaux, effets pédagogiquement fondamentaux — Effort: L — Impact: +0.2
12. **Prédiction échange chimique / protons labiles** — Montrer pourquoi OH disparaît avec D₂O — Effort: M — Impact: +0.1
13. **Batch prediction** — 15–20 structures pour préparer un examen — Effort: M — Impact: +0.1
14. **Partage par lien URL** — Envoyer un lien qui ouvre la caféine prédite directement — Effort: S — Impact: +0.1

**Features INSUFFISANTES :**

1. **Différenciation cis/trans vinyliques** — Lecture E/Z du SMILES + tables de correction distinctes — Effort: L
2. **Tooltips diastéréotopiques** — Tag explicite "proton diastéréotopique" + explication — Effort: S
3. **Rendu multiplets** — Forme de raie, enveloppe caractéristique, largeur T₂ — Effort: M
4. **Précision bicycliques pontés** — Norbornane exo/endo sous-estimés 0.3–0.5 ppm — Effort: L
5. **Export PNG résolution** — Sélecteur 96/150/300/600 dpi — Effort: S
6. **Graduations axe ppm** — Graduations dynamiques 0.5/0.1 ppm selon zoom — Effort: S

**Features INCORRECTES :**

1. **Cinnamaldéhyde Hβ** — ~6.5 prédit vs 7.55 exp, absence correction anisotropie aldéhydique — Erreur: +1.05 ppm
2. **OH/NH déplacement** — Phénols à 5–8 ppm, acides carboxyliques à 10–12 ppm, pas 1–2 ppm
3. **Imidazole H-8 purine** — Erreur résiduelle 0.3–0.5 ppm, contribution N-7/N-9 incomplète

**TOP 3 :** 1) ¹³C prediction 2) Multiplicités complexes + rendu correct 3) Mode examen/quiz + numérotation protons

**Feature rêve :** Mode "spectre inconnu" pédagogique — charger un spectre expérimental, l'étudiant dessine sa proposition, Kendraw compare et génère un retour formatif pic par pic avec score d'accord.

---

### Dr. Sarah CHEN — De 7/10 à 10/10

_Chercheuse chimie computationnelle, Stanford, NMRShiftDB2. Son 10/10 = algorithme publié dans JCIM, précision rivale des outils commerciaux._

**Features MANQUANTES :**

1. **Calibration sur NMRShiftDB2** — Régression des incréments contre ≥50 000 shifts mesurés — Effort: L — Impact: +0.8
2. **Validation croisée avec métriques publiables** — Dataset split 80/10/10, MAE/RMSE/R², comparaison ACD/nmrdb/ChemDraw — Effort: M — Impact: +0.5
3. **Prédiction ¹³C** — Tables d'incréments Breitmaier/Pretsch — Effort: L — Impact: +0.6
4. **Quantification d'incertitude (±σ ppm)** — Intervalles de prédiction par régression, pas classification ordinale — Effort: M — Impact: +0.4
5. **Approche HOSE codes** — Gold standard depuis Bremser (1978), supérieur de ≥0.3 ppm MAE au modèle additif — Effort: XL — Impact: +1.2
6. **Support polycycliques condensés complexes** — Acridine, carbazole, indolizine, quinolizine — Effort: M — Impact: +0.3
7. **Stéréochimie E/Z et diastéréotopicité** — Vinyliques + CH₂ diastéréotopiques à 2 shifts distincts — Effort: L — Impact: +0.4
8. **Effets anisotropiques explicites** — Courant de cycle, cône C=O, géométrie 3D — Effort: XL — Impact: +0.5

**Features INSUFFISANTES :**

1. **Facteurs d'atténuation (0.3/0.7/1.0)** — Non calibrés, sans référence bibliographique, uniformes — Calibration position-par-position sur NMRShiftDB2 nécessaire — Effort: M
2. **HETEROCYCLIC_SHIFTS (8 entrées)** — ≥40 entrées nécessaires : imidazole, oxazole, thiazole, pyrimidine, pyrazine, triazole, indole, purine, pyridazine, isoxazole — Effort: M
3. **Tolérances tests (trop larges)** — Caféine accepte [7.0, 8.0] = 1.0 ppm, devrait être ±0.15 ppm — Effort: S
4. **Ambiguïté SSSR imidazole** — Ordre non-déterministe, besoin règle chimique ou contribution fractionnaire — Effort: S
5. **Amide NH** — 2.1 ppm erreur systématique, besoin sous-modèle liaison H + solvant — Effort: M
6. **N-méthyles purines** — confidence=3 (vert) alors que l'environnement est distinct des N-méthyles aliphatiques — Effort: S

**Features INCORRECTES :**

1. **Cinnamaldéhyde vinyliques** — 1.2–1.7 ppm erreur, absence incrément β_to_alpha_beta_unsaturated_carbonyl — Cible: Hα ≈ 6.4–6.8, Hβ ≈ 7.3–7.6
2. **Facteur 0.3 imidazole/triazole** — Incohérent pour benzimidazole C2-H (7.95 exp > 7.26 base), atténuation va dans la mauvaise direction pour systèmes enrichissants
3. **Aldéhydes conjugués** — Incrément identique aliphatique/aromatique/α,β-insaturé, direction inversée pour conjugués

**TOP 3 :** 1) Calibration NMRShiftDB2 + validation croisée publiable 2) Extension ≥40 hétérocycles + facteurs calibrés par position 3) Incertitude en ppm avec base probabiliste

**Feature rêve :** Prédiction HOSE-code hybride avec apprentissage actif — corrections utilisateur affinent les pondérations par descente de gradient, modèle additif en fallback. Auto-calibration communautaire en 6 mois.

---

### Dr. Lisa PARK — De 7.2/10 à 10/10

_Ex-PM ChemDraw, maintenant chez Ketcher. Son 10/10 = Kendraw gagne "Best Free Chemistry Tool", universités le recommandent officiellement._

**Features MANQUANTES :**

1. **13C NMR** — "Livrer 1H sans 13C = livrer une voiture avec un siège passager grisé" — Effort: L — Impact: +0.8
2. **Numérotation protons sur dessin** — Labels H1, H2 avec correspondance tooltip — Effort: M — Impact: +0.2
3. **Export SVG vectoriel** — Pour publications LaTeX et thèses — Effort: M — Impact: +0.2
4. **Mode guidé / onboarding** — 3 étapes : dessine, prédit, explore. Taux rétention premier usage — Effort: M — Impact: +0.3
5. **Changelog visible dans l'UI** — Badge "v0.4 — voir les nouveautés" dans le footer — Effort: S — Impact: +0.1
6. **Version visible dans l'UI** — Pour citation ACS Style Guide — Effort: S — Impact: +0.1
7. **Mécanisme de feedback in-app** — "Signaler une prédiction incorrecte", moteur d'amélioration communautaire — Effort: M — Impact: +0.2
8. **Raccourcis clavier documentés** — Panel "?" à la GitHub — Effort: S — Impact: +0.1
9. **Lien vers méthode de prédiction** — Page doc expliquant les méthodes et limites — Effort: S — Impact: +0.1

**Features INSUFFISANTES :**

1. **Tooltips — persistance** — Disparaît au mouvement souris, besoin bouton "pin" 📌 pour cours — Effort: S
2. **Export PNG** — Options : dessin seul / spectre seul / côte à côte, SMILES en metadata EXIF — Effort: S
3. **Highlighting bidirectionnel** — Montrer le groupe d'équivalence complet + badge "nH" — Effort: M
4. **Layout responsive** — Illisible sur 13" laptop, besoin split draggable — Effort: M
5. **Accessibilité WCAG AA** — Couleurs vert/rouge non accessibles daltoniens protanopes (8% des hommes), RGAA obligatoire en enseignement supérieur français — Effort: S

**Features INCORRECTES :**

1. **Undo/Redo panneau NMR** — Pas d'historique de navigation, Ctrl+Z devrait revenir à la vue précédente
2. **Titre de page navigateur** — "Kendraw" statique, devrait refléter la molécule courante
3. **Message erreur molécule invalide** — RDKit brut au lieu de langage naturel + surlignage atome fautif

**TOP 3 :** 1) 13C NMR 2) Mode guidé + onboarding 3) Accessibilité WCAG AA + export SVG

**Feature rêve :** Comparateur "Expected vs. Predicted" — import JCAMP-DX, superposition, score de concordance, signalement des discordances. Transforme Kendraw d'outil de prédiction en outil de vérification de structure.

---

### Pr. Hassan AL-RASHID — De 5.4/10 à 10/10

_Chimie pharmaceutique, FDA, caractérisation de médicaments. LE PLUS EXIGEANT — 4.6 points à gagner. Sa liste est la plus longue._

**Features MANQUANTES :**

**Noyaux & spectroscopie :**

1. **Prédiction 13C** — Exigé par ICH Q6A pour tout nouvel ingrédient actif — Effort: XL — Impact: +1.5
2. **Prédiction 19F** — 20% des médicaments FDA contiennent du fluor — Effort: L — Impact: +0.6
3. **Prédiction 31P** — Prodrogue phosphate, oligonucléotides thérapeutiques — Effort: M — Impact: +0.3
4. **Prédiction 15N** — Bases nucléiques, β-lactamines, discrimination tautomère — Effort: L — Impact: +0.2
5. **Simulation DEPT-135/DEPT-90** — Routine numéro un pour attribution CH/CH2/CH3 — Effort: M — Impact: +0.4
6. **Simulation HSQC/HMBC** — Corrélations hétéronucléaires 2D, font foi dans les rapports — Effort: XL — Impact: +0.5
7. **Simulation COSY/TOCSY** — Connectivité proton-proton pour glucose, stéroïdes — Effort: L — Impact: +0.3
8. **NOESY/ROESY simulé** — Configuration relative des centres stéréogènes — Effort: XL — Impact: +0.3

**Export & interopérabilité :** 9. **Export JCAMP-DX** — Format FDA recommandé pour dossiers eCTD — Effort: M — Impact: +0.4 10. **Export SDF/MOL2 annotés** — Intégration pipelines cheminformatiques RDKit/Schrödinger — Effort: S — Impact: +0.2 11. **Export tableau de pics CSV + PDF signés** — Pièce justificative rapport de caractérisation — Effort: M — Impact: +0.4 12. **Export NMReDATA** — Standard IUPAC-IUPAB pour traçabilité — Effort: S — Impact: +0.1 13. **Import SMILES/InChI/CAS depuis PubChem/ChemSpider/DrugBank** — Effort: M — Impact: +0.2

**Conformité réglementaire :** 14. **Métadonnées réglementaires** — Solvant, fréquence, température, TMS/DSS, version modèle, opérateur — Effort: M — Impact: +0.4 15. **Audit trail 21 CFR Part 11 / Annexe 11 EU GMP** — Qui/quoi/quand/pourquoi immuable — Effort: L — Impact: +0.5 16. **Gestion utilisateurs RBAC** — Chimiste/superviseur/QA/auditeur — Effort: L — Impact: +0.2 17. **Signature électronique CFR 21 Part 11** — 2FA, liaison indissociable au document — Effort: L — Impact: +0.3 18. **API REST documentée (OpenAPI/Swagger)** — Intégration LIMS/ELN — Effort: M — Impact: +0.3 19. **Intégration ELN (Benchling, Dotmatics, IDBS)** — Connecteurs push/pull — Effort: L — Impact: +0.2

**Prédiction avancée :** 20. **Effets du solvant** — Modèle entraîné par solvant, variation NH 1–2 ppm entre CDCl₃/DMSO — Effort: L — Impact: +0.4 21. **Prédiction pH-dépendante** — pKa + état de protonation résultant — Effort: XL — Impact: +0.3 22. **Prédiction température-dépendante** — Rotamères amide à 25°C vs 60°C — Effort: L — Impact: +0.2 23. **Effets stéréochimiques axial/équatorial/cis/trans** — Δδ 0.2–0.5 ppm pour corticostéroïdes — Effort: XL — Impact: +0.4 24. **Populations rotamères amide** — Dédoublement cis/trans, ciclosporine/tacrolimus — Effort: XL — Impact: +0.3 25. **Courant de cycle quantifié** — Blindage -1.5 ppm pour proton au-dessus d'un benzène — Effort: L — Impact: +0.2 26. **Liaisons H sur protons labiles** — NH paracétamol à 9.6 ppm = liaison H — Effort: XL — Impact: +0.5 27. **Constantes J par Karplus** — Angles dièdres, anomères α/β sucres — Effort: L — Impact: +0.4 28. **Équilibres tautomères** — Imidazole, tétrazole, β-dicétones, proportions mesurables — Effort: XL — Impact: +0.3 29. **Formes sel et contre-ion** — Chlorhydrate/mésylate/bésilate shift différences — Effort: L — Impact: +0.2 30. **13C CPMAS état solide** — Polymorphisme, ICH Q6A — Effort: XL — Impact: +0.3

**Workflow pharmaceutique :** 31. **Batch processing** — SDF input, 500 analogues — Effort: M — Impact: +0.3 32. **Overlay prédit/expérimental** — Import JCAMP-DX Bruker raw — Effort: L — Impact: +0.4 33. **Identification pics d'impuretés** — Soustraction + hypothèses structurales, seuil ICH Q3A 0.1% — Effort: XL — Impact: +0.3 34. **Bibliothèque USP/EP** — Spectres de référence pharmacopée pour comparaison — Effort: XL — Impact: +0.4 35. **Mode dégradants et métabolites** — SMILES de dégradation forcée ICH Q1A — Effort: L — Impact: +0.3 36. **Rapport de validation du modèle** — Courbes parité, RMSE par classe chimique — Effort: M — Impact: +0.4 37. **Incertitude quantifiée par atome** — IC 95% par pic, pas code couleur ternaire — Effort: L — Impact: +0.3 38. **Modèle entraîné sur médicaments** — DrugBank, ChEMBL, BindingDB, SDBS — Effort: XL — Impact: +0.5

**Features INSUFFISANTES :**

1. **Protons labiles NH/OH/SH** — Sous-modèle dédié avec paramètre solvant/concentration — Effort: XL
2. **Système confiance ternaire** — Score continu 0–1 avec décomposition sources d'incertitude — Effort: L
3. **Atténuation hétérocycles fusionnés** — Manque purines, phénothiazines, acridines, porphyrines, β-carbolines — Effort: L
4. **Rendu spectre** — Élargissement Lorentzien/Gaussien, aires normalisées, référence TMS à 0 — Effort: L
5. **Export PNG** — SVG, PDF haute résolution, export région agrandie — Effort: M
6. **Groupement protons équivalents** — Ibuprofen 9H→6H+3H, détection homotopie/énantiotopie/diastéréotopie — Effort: L
7. **Documentation du modèle** — Page "À propos" : méthode, données, métriques, limitations — Effort: M

**Features INCORRECTES :**

1. **NH amide paracétamol** — 7.50 vs 9.6 exp (Δ 2.1 ppm), absence modélisation liaison H
2. **Ibuprofen 9H méthyle** — 6H iPr + 3H chiral regroupés en 1 pic, erreur d'attribution structurale
3. **Oméprazole aromatiques** — Prédiction compresse la région 7.2–8.2 ppm au lieu de la différencier
4. **Multiplicité absente** — Spectre sans multiplicités non conforme monographies USP/EP
5. **Référencement TMS/DSS** — Ambiguïté non documentée, inadmissible dans rapport réglementaire

**TOP 3 :** 1) NH amide + sous-modèle liaison H + solvant 2) 13C + DEPT 3) Export JCAMP-DX + tableau pics CSV/PDF signé

**Feature rêve :** Moteur CASV (Computer-Assisted Structure Verification) réglementaire — import spectre brut, correspondance structure-spectre, signal PASS/ATTENTION/FAIL avec références ICH, rapport PDF eCTD Module 3. Premier outil open-source de CASV.

---

### Marina VOLKOV — De 9/10 à 10/10

_Étudiante M2, URD Abbaye, beta-testeuse. Son 10/10 = elle ne pense JAMAIS "j'aurais dû utiliser ChemDraw" et recommande Kendraw à tous les étudiants de France._

**Features MANQUANTES :**

1. **Prédiction 13C** — En TP toujours 13C + 1H, doit ouvrir nmrdb pour le carbone — Effort: L — Impact: +0.4
2. **Numérotation protons sur structure** — Labels Ha, Hb, Hc pour rapport, au lieu d'annoter à la main — Effort: M — Impact: +0.2
3. **Export structuré (PDF/CSV tableau)** — "δ | mult. | J | attribution | confiance" prêt à coller dans Word/LaTeX — Effort: M — Impact: +0.2
4. **Mode hors-ligne PWA** — Wi-Fi instable en salle de TP, 2x inaccessible cette année — Effort: L — Impact: +0.1

**Features INSUFFISANTES :**

1. **Multiplicités complexes (dd, dt, ddd)** — "d" affiché au lieu de "dd (J = 15.2; 6.8 Hz)" sur substrats allyliques — Effort: L
2. **Cinnamaldéhyde vinylique sans barre rouge** — Erreur 0.85 ppm silencieuse = "incident indole" des aldéhydes — Effort: S
3. **Zoom spectre** — Deux pics à 0.05 ppm indistinguables, molette zoom nécessaire — Effort: M
4. **Résolution mobile** — Interface inutilisable sous 768px, au moins lecture seule spectre — Effort: M

**Features INCORRECTES :**

1. **Cinnamaldéhyde Hα** — ~6.7 prédit vs 7.55 exp (0.85 ppm), silencieux
2. **dd affiché comme d** — CH₂=CH–CH₂– avec Jtrans=17 Hz et Jvic=7 Hz montre "d" au lieu de "dd"

**TOP 3 :** 1) 13C NMR 2) Fix cinnamaldéhyde → rouge obligatoire 3) Export tableau CSV/copier-coller LaTeX

**Feature rêve :** Mode comparaison expérimental vs prédit — coller les δ mesurés en TP, alignement automatique, vert si cohérent, rouge si Δ>0.3 ppm. Outil de vérification d'assignation.

---

### Thomas WEBER — De 8.5/10 à 10/10

_Admin IT, URD Abbaye. Son 10/10 = zero-maintenance, auto-update, monitoring, zéro ticket support._

**Features MANQUANTES :**

1. **Container health checks** — HEALTHCHECK dans Dockerfiles, pas juste restart policy — Effort: S — Impact: +0.3
2. **Resource limits docker-compose** — mem_limit + cpus pour éviter saturation — Effort: S — Impact: +0.2
3. **Monitoring / alerting** — Prometheus + Grafana + alertes 5xx — Effort: L — Impact: +0.4
4. **Log rotation** — max-size / max-file, disque plein en 6 mois sinon — Effort: S — Impact: +0.1
5. **Structured logging NMR** — JSON avec molecule_id, smiles, error_type — Effort: M — Impact: +0.2
6. **Backup strategy** — Volumes Docker + configurations env — Effort: M — Impact: +0.2
7. **Auto-update (Watchtower)** — Mises à jour sans intervention manuelle — Effort: M — Impact: +0.3
8. **Staging environment** — Pas de déploiement direct en prod — Effort: L — Impact: +0.2
9. **Rate limiting** — Protection API contre boucles RDKit — Effort: M — Impact: +0.2
10. **Secrets management** — .env.example documenté, rotation, pas de fuite — Effort: M — Impact: +0.1
11. **Rollback mechanism** — Tags Docker versionnés, script rollback < 2 min — Effort: M — Impact: +0.3
12. **Usage analytics** — Comptage calculs NMR/jour, endpoints appelés — Effort: M — Impact: +0.1
13. **NMR dans /health** — Vérifier que RDKit fonctionne, pas juste HTTP 200 — Effort: S — Impact: +0.2
14. **Tests frontend NMR** — Highlighting + PNG testés (actuellement 5 tests seulement) — Effort: M — Impact: +0.1

**Features INSUFFISANTES :**

1. **Restart policy** — Ajouter HEALTHCHECK pour que restart détecte un container zombie — Effort: S
2. **CORS validation au boot** — Vérifier cohérence domaine prod ≠ localhost — Effort: S
3. **Python version mismatch** — CI doit utiliser la même version que le Dockerfile (3.11) — Effort: S
4. **nginx configuration** — Timeouts RDKit, gzip assets, headers sécurité CSP/X-Frame — Effort: M
5. **Documentation opérationnelle** — Runbook : panne, redémarrage, déploiement — Effort: S

**Features INCORRECTES :**

1. **Tag Docker en prod** — `:latest` en prod = déploiement non contrôlé, devrait être `:vX.Y.Z` immuable
2. **Container root** — Pas de `user: "1000:1000"` ni `no-new-privileges:true` — Cible: user non-root

**TOP 3 :** 1) Monitoring + alerting 2) Rollback + tags Docker versionnés 3) Health checks containers + NMR dans /health

**Feature rêve :** Pipeline GitOps complet — push sur main → CI → build + tag SHA → registry privé → Watchtower → zero-downtime deploy → health check → rollback auto si échec → notification Mattermost "v2.3.1 déployé, 87/87 tests".

---

## Partie 2 — Synthèse

---

### Tableau de toutes les demandes

| #   | Feature demandée                                             | Demandée par                                                         | Effort | Impact note moy | Priorité |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------- | ------ | --------------- | -------- |
| 1   | **Prédiction 13C**                                           | Duval, Marcos, Yamamoto, Chen, Park, Al-Rashid, Marina, Thomas (8/8) | XL     | +0.9            | **P0**   |
| 2   | **Overlay spectre expérimental (import JCAMP-DX)**           | Duval, Marcos, Yamamoto, Park, Al-Rashid, Marina (6/8)               | L      | +0.4            | **P1**   |
| 3   | **Numérotation protons (H-1, H-2…)**                         | Duval, Marcos, Yamamoto, Park, Marina (5/8)                          | M      | +0.2            | **P1**   |
| 4   | **Export SVG vectoriel**                                     | Duval, Marcos, Yamamoto, Park (4/8)                                  | M      | +0.15           | **P1**   |
| 5   | **Multiplicités complexes (dd, ddd, dt)**                    | Duval, Marcos, Yamamoto, Marina (4/8)                                | L      | +0.35           | **P1**   |
| 6   | **Différenciation cis/trans vinylique + fix cinnamaldéhyde** | Duval, Marcos, Yamamoto, Chen, Marina (5/8)                          | L      | +0.35           | **P1**   |
| 7   | **Prédiction 19F**                                           | Duval, Marcos, Yamamoto, Al-Rashid (4/8)                             | L      | +0.3            | **P2**   |
| 8   | **Marqueurs pics solvant résiduel**                          | Duval, Marcos, Yamamoto (3/8)                                        | S      | +0.2            | **P1**   |
| 9   | **Courbes d'intégration**                                    | Duval, Marcos, Yamamoto (3/8)                                        | M      | +0.25           | **P1**   |
| 10  | **Export JCAMP-DX**                                          | Duval, Marcos, Al-Rashid (3/8)                                       | M      | +0.3            | **P2**   |
| 11  | **NH amide correction (paracétamol 2.1 ppm)**                | Duval, Chen, Al-Rashid (3/8)                                         | M      | +0.4            | **P1**   |
| 12  | **Zoom interactif spectre**                                  | Duval, Marcos, Marina (3/8)                                          | M      | +0.2            | **P1**   |
| 13  | **Protons labiles OH/NH (broad singlet, échangeable)**       | Duval, Yamamoto, Al-Rashid (3/8)                                     | M      | +0.3            | **P2**   |
| 14  | **COSY/HSQC/HMBC simulés**                                   | Marcos, Yamamoto, Al-Rashid (3/8)                                    | XL     | +0.3            | **P3**   |
| 15  | **Extension table hétérocycles (≥30-40 types)**              | Duval, Chen (2/8)                                                    | M      | +0.3            | **P1**   |
| 16  | **Calibration NMRShiftDB2 + métriques publiables**           | Chen, Al-Rashid (2/8)                                                | L      | +0.6            | **P2**   |
| 17  | **Quantification incertitude ±ppm**                          | Chen, Al-Rashid (2/8)                                                | M      | +0.35           | **P2**   |
| 18  | **Simulation DEPT-135**                                      | Marcos, Al-Rashid (2/8)                                              | M      | +0.4            | **P2**   |
| 19  | **Prédiction 31P**                                           | Duval, Al-Rashid (2/8)                                               | L      | +0.3            | **P3**   |
| 20  | **Effets du solvant**                                        | Duval, Al-Rashid (2/8)                                               | L      | +0.4            | **P2**   |
| 21  | **Protons diastéréotopiques**                                | Duval, Marcos (2/8)                                                  | L      | +0.3            | **P2**   |
| 22  | **PWA / offline**                                            | Duval, Marina (2/8)                                                  | L      | +0.1            | **P3**   |
| 23  | **Génération texte SI format JACS**                          | Marcos (1/8)                                                         | M      | +0.4            | **P2**   |
| 24  | **Mode examen/quiz**                                         | Yamamoto (1/8)                                                       | L      | +0.3            | **P2**   |
| 25  | **HOSE codes (approche hybride)**                            | Chen (1/8)                                                           | XL     | +1.2            | **P3**   |
| 26  | **Mode guidé / onboarding**                                  | Park (1/8)                                                           | M      | +0.3            | **P1**   |
| 27  | **Accessibilité WCAG AA**                                    | Park (1/8)                                                           | S      | +0.2            | **P1**   |
| 28  | **Monitoring + alerting**                                    | Thomas (1/8)                                                         | L      | +0.4            | **P1**   |
| 29  | **Rollback + tags Docker versionnés**                        | Thomas (1/8)                                                         | M      | +0.3            | **P1**   |
| 30  | **Health checks + NMR /health**                              | Thomas (1/8)                                                         | S      | +0.25           | **P1**   |
| 31  | **Container sécurité (non-root, limits)**                    | Thomas (1/8)                                                         | S      | +0.2            | **P1**   |
| 32  | **Batch prediction**                                         | Yamamoto, Al-Rashid (2/8)                                            | M      | +0.2            | **P3**   |
| 33  | **Historique prédictions**                                   | Duval (1/8)                                                          | M      | +0.1            | **P3**   |
| 34  | **Feedback in-app**                                          | Park (1/8)                                                           | M      | +0.2            | **P2**   |
| 35  | **Partage par lien URL**                                     | Yamamoto (1/8)                                                       | S      | +0.1            | **P2**   |
| 36  | **Audit trail CFR 21 Part 11**                               | Al-Rashid (1/8)                                                      | L      | +0.5            | **P4**   |
| 37  | **Formule brute / MW / masse exacte**                        | Marcos (1/8)                                                         | S      | +0.1            | **P2**   |
| 38  | **Ring current / anisotropie explicite**                     | Duval, Yamamoto, Chen (3/8)                                          | L/XL   | +0.3            | **P3**   |
| 39  | **Rotation restreinte amides**                               | Duval, Al-Rashid (2/8)                                               | L      | +0.25           | **P3**   |
| 40  | **N-méthyle correction**                                     | Duval, Chen (2/8)                                                    | S/M    | +0.2            | **P1**   |

---

### TOP 10 CONSENSUS (features demandées par 3+ experts)

| Rang   | Feature                             | Experts (n) | Effort | Impact   |
| ------ | ----------------------------------- | ----------- | ------ | -------- |
| **1**  | Prédiction 13C                      | 8/8         | XL     | +0.9 avg |
| **2**  | Overlay spectre expérimental        | 6/8         | L      | +0.4     |
| **3**  | Numérotation protons                | 5/8         | M      | +0.2     |
| **4**  | Différenciation cis/trans vinylique | 5/8         | L      | +0.35    |
| **5**  | Export SVG vectoriel                | 4/8         | M      | +0.15    |
| **6**  | Multiplicités complexes (dd/ddd/dt) | 4/8         | L      | +0.35    |
| **7**  | Prédiction 19F                      | 4/8         | L      | +0.3     |
| **8**  | NH amide correction                 | 3/8         | M      | +0.4     |
| **9**  | Marqueurs solvant résiduel          | 3/8         | S      | +0.2     |
| **10** | Courbes d'intégration               | 3/8         | M      | +0.25    |

**Honorable mentions (3/8):** Zoom interactif, Export JCAMP-DX, Protons labiles OH/NH, COSY/HSQC/HMBC, Ring current

---

### FEATURES UNIQUES mais BRILLANTES (demandées par 1 seul expert)

| Feature                                          | Expert    | Pourquoi c'est brillant                                                                                                     |
| ------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Génération texte SI format JACS**              | Marcos    | 1h gagnée par composé × 15 intermédiaires = 1 journée de rédaction. Aucun outil ne fait ça.                                 |
| **Mode examen/quiz pédagogique**                 | Yamamoto  | Transforme Kendraw d'outil de démo en outil de formation autonome. Différenciateur vs ChemDraw.                             |
| **HOSE codes hybrides avec apprentissage actif** | Chen      | Auto-calibration communautaire, le modèle s'améliore par l'usage. Paper JCIM garanti.                                       |
| **Pipeline GitOps complet**                      | Thomas    | Zero-touch deploy, rollback auto, notification. Infra professionnelle en MIT.                                               |
| **Mode "spectre inconnu" pédagogique**           | Yamamoto  | L'étudiant dessine, Kendraw compare avec l'expérimental et donne un feedback formatif. Révolutionnaire pour l'enseignement. |
| **Identification par spectre inverse**           | Duval     | Saisir des pics → obtenir des structures candidates. Personne ne fait ça en open-source.                                    |
| **CASV réglementaire open-source**               | Al-Rashid | Computer-Assisted Structure Verification pour dossiers FDA. Premier outil MIT de ce type.                                   |
| **Mode guidé / onboarding 3 étapes**             | Park      | 60% des nouveaux users ChemDraw abandonnent avant la première prédiction sans guidage.                                      |
| **Tooltip pin 📌**                               | Park      | Les tooltips disparaissent au mouvement souris — inexploitable en cours projeté.                                            |

---

### FEATURE RÊVE CONSENSUS

**5 experts sur 8** décrivent la même feature rêve sous des noms différents :

| Expert   | Nom                                | Description                                                |
| -------- | ---------------------------------- | ---------------------------------------------------------- |
| Duval    | Identification par spectre inverse | Saisir des pics → 5 structures candidates                  |
| Marcos   | Match Score automatique            | Score de concordance prédit vs expérimental + discordances |
| Yamamoto | Mode spectre inconnu pédagogique   | Étudiant dessine, Kendraw compare et donne retour formatif |
| Park     | Comparateur Expected vs Predicted  | Import JCAMP-DX, superposition, score, signalement         |
| Marina   | Comparaison expérimental vs prédit | Coller δ mesurés, vert/rouge selon Δ                       |

**→ C'est LA feature qui transformerait Kendraw en game-changer.** Aucun concurrent gratuit ne l'offre. ChemDraw ne le fait pas. C'est le passage de "prédiction" à "vérification de structure".

---

## Partie 3 — Roadmap chiffrée vers 10/10

### Hypothèses

- Un seul développeur (JB)
- Sprint = 2 semaines
- S = 1–2 jours, M = 3–5 jours, L = 1–2 semaines, XL = 3–4 semaines

### Roadmap

| Phase                 | Features                                                                                                                                                                                                                                         | Effort total   | Note estimée | Delta |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------ | ----- |
| **V1.0 (actuel)**     | Baseline V4                                                                                                                                                                                                                                      | —              | **7.4/10**   | —     |
| **V1.1 (1 sprint)**   | Marqueurs solvant (S), Zoom interactif (M), N-méthyle fix (S), Health checks + NMR /health (S), Container sécurité non-root + limits (S), Log rotation (S), Accessibilité daltoniens (S), Tooltips pin (S), Version + changelog UI (S)           | **2 semaines** | **7.9/10**   | +0.5  |
| **V1.2 (2 sprints)**  | Numérotation protons (M), Export SVG (M), Courbes d'intégration (M), NH amide correction (M), Extension 15+ hétérocycles (M), Cinnamaldéhyde confidence rouge (S), Zoom molette + pan (M), Mode guidé onboarding (M), Rollback + tags Docker (M) | **1 mois**     | **8.5/10**   | +0.6  |
| **V2.0 (3 sprints)**  | Prédiction 13C + DEPT (XL), Différenciation cis/trans vinylique (L), Multiplicités complexes dd/ddd (L), Monitoring Prometheus+Grafana (L)                                                                                                       | **6 semaines** | **9.2/10**   | +0.7  |
| **V2.5 (2 sprints)**  | Overlay spectre expérimental + import JCAMP-DX (L), Export JCAMP-DX (M), Génération texte SI JACS (M), Calibration NMRShiftDB2 (L), Incertitude ±ppm (M)                                                                                         | **1 mois**     | **9.5/10**   | +0.3  |
| **V3.0 (3+ sprints)** | Prédiction 19F (L), Mode examen/quiz (L), Batch prediction (M), Protons labiles broad singlet (M), Effets solvant (L), HOSE codes hybride (XL), GitOps pipeline (L)                                                                              | **2+ mois**    | **9.8/10**   | +0.3  |
| **Perfection**        | COSY/HSQC/HMBC simulés (XL), 31P/15N (L), Ring current explicite (XL), Match Score / CASV (XL), PWA offline (L), Audit trail CFR 21 (L)                                                                                                          | **Ongoing**    | **10/10**    | +0.2  |

### Estimation totale

| Métrique                        | Valeur                                  |
| ------------------------------- | --------------------------------------- |
| Effort total V1.1 → V3.0        | **~24 semaines-développeur** (~6 mois)  |
| Effort total jusqu'à Perfection | **~40 semaines-développeur** (~10 mois) |
| Features identifiées            | **40 features principales**             |
| Features uniques/brillantes     | **9 différenciateurs**                  |
| Consensus unanime (8/8)         | **1 feature : 13C**                     |
| Consensus fort (5+/8)           | **4 features**                          |
| Consensus (3+/8)                | **10 features**                         |

### Score cible par expert après chaque phase

| Expert      | V1.0    | V1.1    | V1.2    | V2.0    | V2.5    | V3.0    | Perf.    |
| ----------- | ------- | ------- | ------- | ------- | ------- | ------- | -------- |
| Duval       | 7.0     | 7.3     | 7.8     | 8.8     | 9.3     | 9.6     | 10.0     |
| Marcos      | 6.8     | 7.0     | 7.4     | 8.4     | 9.2     | 9.5     | 10.0     |
| Yamamoto    | 8.2     | 8.5     | 8.8     | 9.5     | 9.7     | 9.9     | 10.0     |
| Chen        | 7.0     | 7.2     | 7.6     | 8.2     | 9.2     | 9.7     | 10.0     |
| Park        | 7.2     | 7.5     | 8.0     | 8.8     | 9.2     | 9.5     | 10.0     |
| Al-Rashid   | 5.4     | 5.6     | 6.2     | 7.4     | 8.0     | 8.5     | 10.0     |
| Marina      | 9.0     | 9.3     | 9.5     | 9.8     | 9.9     | 10.0    | 10.0     |
| Thomas      | 8.5     | 9.0     | 9.3     | 9.5     | 9.6     | 9.8     | 10.0     |
| **Moyenne** | **7.4** | **7.7** | **8.1** | **8.8** | **9.3** | **9.6** | **10.0** |

### Quick wins immédiats (S effort, haut impact)

Ces items peuvent être faits en 1–2 jours chacun et augmentent visiblement la note :

1. ✅ Marqueurs solvant résiduel (CDCl₃, DMSO-d₆, D₂O) — 3 experts
2. ✅ Cinnamaldéhyde → forcer confidence rouge sur motif C=C–C=O aryle — 5 experts
3. ✅ N-méthyle purine → confidence downgrade (vert → jaune) — 2 experts
4. ✅ Container health checks Docker — Thomas
5. ✅ Resource limits docker-compose — Thomas
6. ✅ Log rotation — Thomas
7. ✅ Accessibilité couleurs daltoniens — Park
8. ✅ Tooltip pin (clic pour ancrer) — Park
9. ✅ Version + changelog visible UI — Park
10. ✅ Tolérances tests resserrées (±0.15 ppm au lieu de ±1.0) — Chen

---

_Generated by Kendraw V4-bis Roundtable Panel — 8 domain experts (independent subagents)_
_Chaque expert a été spawné comme agent indépendant sans accès aux réponses des autres_
_2026-04-14_
