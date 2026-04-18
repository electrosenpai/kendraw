### Dr. Antoine MARCOS — Synthèse totale, MIT

Ma note V5 / V6 / V7 : 7.8 / 8.1 / **8.5** (+0.4)
Delta V6→V7 : trois de mes blockers historiques bougent enfin (DEPT exploitable, multiplets table, JCAMP-DX import). Le canvas reste le canvas — pas de saut de productivité sur les schémas multi-étapes. CDXML 1.0 round-trip est un signal fort pour le pipeline SI/JACS, mais pas encore validé sur mes molécules cibles. Je lève la note de 0.4 et pas plus parce que la partie « 30-step scheme » de mon métier n'a quasiment pas progressé.

#### Brief factuel (pré-rempli)
- Wave-4 P1-01 (`5010575`) — DEPT-135/90 UI : `D` hotkey gated ¹³C, CH₂ inversé, phase coloring. Ferme ma demande #3 V6.
- Wave-4 P1-02 (`1e5caf6`) — multiplet line list dans le tooltip + `Shift+I` integration toggle gated ¹H. Ferme **partiellement** ma demande #1 (table oui, render résolu non — toujours enveloppe lorentzienne, roof effect deferred W4-D-03).
- Wave-4 P1-03 (`542263a`) — JCAMP-DX 1D import (AFFN, ~95 % Bruker/JEOL/MestReNova), overlay orange sur prédiction bleue. Refus stricts ASDF, NTUPLES, types non-NMR. C'est mon outil de vérification expérimental-vs-prédit.
- Wave-4 P1-06 (`e3fc0a9`) — CDXML 1.0 writer MVP, round-trip testé. R-group / Markush et stéréo au-delà wedge/hash deferred (W4-D-11, W4-D-12).
- Wave-4 P1-04 (`0a7472e`) + P1-05 (`a2b8c9c`) — audit trail SHA-256 + e-signature modal, **labellisés Beta** : tamper-evident, pas non-repudiation (identité utilisateur déférée W4-D-05).
- HOSE codes (ma demande #2 V6) : **NOT SHIPPED**. Toujours XL effort sur le roadmap-to-10 §1.
- Wave-3 acyclic chain `X` (`060ec6d`) — confirmé en place pour mes chaînes longues.
- Wave-6/7 toolbox canvas-new derrière `VITE_ENABLE_NEW_CANVAS=false` par défaut — n'affecte pas mon workflow tant que je ne l'active pas, mais préserve les hotkeys ChemDraw (V/1/2/3/C/H/N/O/S/R/T/E + W).
- Backend pytest **242 — inchangé depuis V5**. Aucun ajout de logique d'engine NMR côté Python.

#### Ce qui s'est amélioré pour moi depuis V6

**Vérification spectrale (gros saut).** Le triptyque P1-01 + P1-02 + P1-03 me donne enfin une boucle utilisable : je dessine ma cible, je passe en ¹³C, je tape `D` pour DEPT-135, je vois CH₂ inversé phase-coloré, je drag-drop le JCAMP-DX du Bruker du labo, et l'overlay orange me dit immédiatement où ma prédiction décroche. Pour un intermédiaire de synthèse classique (esters, cycliques saturés, aromatiques substitués) c'est exploitable en routine. La couverture ~95 % Bruker/JEOL/MestReNova suffit pour 9 spectres sur 10 qui sortent de mon labo. Sur les ASDF compressés et NTUPLES qui restent deferred (W4-D-01 / W4-D-02), je continue de passer par MestReNova pour exporter en AFFN — c'est un workaround acceptable pour la beta.

**Multiplet line list (Shift+I).** Le tableau ppm + percent dans le tooltip ferme l'écart pour la lecture de pattern simple — quand je veux confirmer un triplet 25/50/25 ou un dd ≈100, je l'ai chiffré. C'est la moitié de ma demande #1 V6.

**CDXML 1.0 export round-trip testé.** Pour le pipeline SI/JACS c'est le signal qui change ma posture de « prototype académique » vers « usable en publication ». Bonds wedge/hash/hollow-wedge/wavy/dash, arrows mappés, annotations rich-text. Je n'ai pas encore éprouvé sur mes Markush — et ils savent que ça ne marche pas (W4-D-11 explicite).

#### Ce qui reste problématique ou s'est dégradé

**Le multi-step scheme — toujours pas d'outil scalable.** Soyons honnêtes : pour mes synthèses de polycycles 25-30 étapes, Kendraw n'a **pas** de notion de document multi-page, pas de gestion d'étapes numérotées avec catalyst+conditions au-dessus de chaque flèche, pas de layout auto pour scheme. Le wave-3 a livré dipole/no-go arrows, le wave-4 a livré curly-arrow anchor, mais le workflow « arrow + annotation conditions/catalyst/temps/rendement » qui scale à 30 étapes **n'existe pas**. Pour un scheme JACS je continue d'utiliser ChemDraw. C'est mon blocker #1 résiduel pour V8.

Concrètement : quand je dessine un scheme de 12 étapes pour une retro-synthèse, je veux pouvoir (a) numéroter automatiquement les intermédiaires 1, 2, 3..., (b) attacher au-dessus de chaque flèche un bloc « réactifs / solvant / température / temps / rendement », (c) faire un saut de page au bout du papier sans perdre la connectivité visuelle de la route, (d) exporter le tout en SVG ou CDXML avec les pages préservées. Aujourd'hui je dois faire tout ça en hors-Kendraw.

**HOSE codes — toujours absents.** Ma demande #2 V6, demande #1 de Chen, demandé par 4/8 experts. Sans HOSE, mes esters α-chlorés et énol éthers silylés (TBS, TES) restent à 5-8 ppm off et la boucle de vérification au-dessus reste fragile sur les substrats fonctionnalisés. C'est XL effort, je le comprends, mais c'est le levier de précision le plus important.

**Render multiplet résolu — half-shipped.** La table chiffrée est là, mais le rendu visuel reste enveloppe lorentzienne. Pour pédagogie c'est passable, pour publication ce n'est pas suffisant. W4-D-03 reste deferred.

**Pas de 2D NMR (COSY/HSQC/HMBC).** Pour confirmer la connectivité d'un polycycle complexe c'est l'outil quotidien — Kendraw reste 1D-only.

**Backend NMR engine figé à 242 tests depuis V5.** Yamamoto et moi remontons cette préoccupation depuis trois revues. Toute l'amélioration NMR depuis V6 est UI ; le moteur de prédiction n'a pas évolué. Donc DEPT/JCAMP-DX overlay n'aident pas si la prédiction sous-jacente est encore fausse sur mes substrats.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît

- **Audit trail SHA-256 chain (P1-04).** Pharma feature à l'origine, mais pour un labo académique c'est de la **traçabilité de cahier de manip**. Je peux théoriquement reconstruire l'historique d'édition d'un schéma — utile pour thèse, pour publication, pour réponse aux reviewers. Limité tant que pas wired dans command dispatch (W4-D-07) ni AuditLogPanel visible (W4-D-08), mais le primitive est là.
- **Refus stricts JCAMP-DX (ASDF, missing observe-frequency).** Je préfère un import qui refuse explicitement plutôt qu'un import qui silently mange un fichier mal formé et me sort une overlay trompeuse. Bonne hygiène ingénierie.
- **HF-5 dark mode complet sur dialogs + NMR tooltip.** Je travaille tard la nuit sur les schémas, ça compte.
- **Refine/clean structure endpoint (HF-3).** Je ne savais pas que c'était possible — pour aplatir un dessin manuel hâtif c'est un gain de temps inattendu.
- **CDXML round-trip testé.** Je m'attendais à un export one-way « best effort » ; le fait que ça soit round-trip testé signifie qu'un reviewer JACS qui me renvoie ses annotations dans un .cdx peut être ré-importé sans perte. C'est un chemin que je n'avais pas demandé mais qui ferme une vraie boucle éditeur-auteur.
- **Refus stricts sur JCAMP-DX hors-spec** — l'overlay refuse plutôt que d'inventer ; pour un labo qui fait tourner des spectres de provenance hétérogène (Bruker, JEOL, MestReNova, parfois un .dx exotique d'un collègue), c'est exactement la bonne posture.

#### Bugs ou rough edges découverts à l'usage

- **Curly-arrow anchor snap** (wave-3 carry-over) : excellent sur petite molécule, mais sur polycycle dense les hit zones se chevauchent. J'ai eu trois fois la flèche qui s'ancre au mauvais atome quand deux atomes sont à <12 px à l'écran. Pas un blocker, mais frustrant pour les mécanismes complexes.
- **JCAMP-DX overlay scaling** : sur un spectre étroit (par ex. 0-3 ppm pour un aliphatique) l'overlay orange et la prédiction bleue ont parfois des amplitudes très différentes ; pas de auto-rescale visible. Question pour Yamamoto/Chen aussi.
- **Pas de batch import** : si je veux comparer 8 intermédiaires d'une route synthétique, je dois drag-drop un par un et changer de tab. Pour une session de validation de SI complète sur un papier de 12 intermédiaires, c'est ~30 min de manipulation pure.
- **Audit trail pas wired dans command dispatch** (W4-D-07) : donc les changements de structure que je fais dans un cahier de manip ne sont **pas** capturés par la chaîne SHA-256. Le primitive est là mais c'est encore un dispositif inerte côté workflow réel. Je ne peux pas encore m'en servir comme journal de thèse.
- **Canvas-new flag** : je l'ai testé `=true`, le toolbox 2-col HF-1 est plus lisible, mais quelques tools restent stubbed (lasso, bond-wedge, bond-dash, bond-aromatic, atom-picker, curly-arrow ont été **droppés** en HF-1 pour respecter la règle « no placeholders »). Donc en flag-on je perds curly-arrow — outil critique pour mécanismes. **Je reste sur flag-off pour le moment.**

#### Mes blockers restants (P0/P1/P2)

- **P0** — Multi-page document support + scheme step numbering with conditions block above arrow (catalyst / solvent / temp / yield). Sans ça, je ne peux pas utiliser Kendraw pour un scheme JACS publication-ready.
- **P0** — HOSE codes + extension base ¹³C (esters α-halogénés, énol éthers silylés, carbamates, sulfonates). Sans ça la boucle de vérification expérimental-vs-prédit échoue sur mes substrats fonctionnalisés.
- **P0** — Validation publishable MAE/RMSE/R² vs NMRShiftDB2 sur un sous-ensemble Marcos-relevant (esters, lactones, énol éthers, carbamates, sulfonates). Tant que le moteur n'est pas chiffré, je ne peux pas le citer dans une publi.
- **P1** — Render multiplet résolu (sortir de l'enveloppe lorentzienne), roof effect / 2nd-order pattern derrière `roofEffect` flag (W4-D-03).
- **P1** — Backend NMR engine : ajouter des tests d'unité (cible : passer de 242 → 300+) et publier MAE/RMSE/R² vs NMRShiftDB2.
- **P1** — CDXML R-group / Markush attachment points (W4-D-11) pour mes intermédiaires SI.
- **P2** — 2D NMR (COSY/HSQC/HMBC) — gros chantier, peut attendre wave-9+.
- **P2** — Curly-arrow disambiguation when atoms < 12 px apart.
- **P2** — Audit log wiring complet (W4-D-07/08/10) pour rendre la traçabilité visible et utile au quotidien.

#### Ma recommandation sur la beta publique

**Go pour beta publique restreinte aux usages NMR-prediction + 1D verification + small-molecule drawing.** Avec un avertissement explicite sur la page d'entrée : « Pas conçu pour multi-step schemes >10 étapes ; utilisez ChemDraw ou Reaxys pour les routes synthétiques de publication. » Pour la chimie organique enseignée et la vérification de spectres en M2/PhD c'est largement prêt. Pour ma communauté synthèse totale, Kendraw reste un outil de **support** (vérification ponctuelle d'un intermédiaire, dessin propre d'une molécule pour une slide) et pas un outil de **production** (le scheme complet d'une publication).

Maintenir le canvas-new derrière flag par défaut false jusqu'à ce que curly-arrow + bond-wedge soient de retour est la bonne décision. Ne pas cacher cette restriction aux betatesteurs.

Sur la posture compliance : labeller P1-04/P1-05 comme « Beta — tamper-evident, pas non-repudiation » sur la page d'entrée beta est non négociable. Un PI académique honnête peut s'en servir comme cahier de manip électronique en mode best-effort ; un labo pharma régulé doit attendre l'identité utilisateur (W4-D-05). Cette distinction doit être explicite dans la doc beta — pas enterrée dans un changelog.

#### Mon top 3 pour la wave suivante

1. **Multi-page document model + scheme arrow with annotation block** (catalyst/solvent/temp/yield). C'est la condition sine qua non pour qu'un total-synthesis chemist passe en production sur Kendraw.
2. **HOSE codes** (mes esters α-Cl, énol éthers TBS/TES, carbamates, sulfonates) — débloque la boucle de vérification que vous venez de me donner avec JCAMP-DX.
3. **Render multiplet résolu** (sortir de Lorentzien) + activer le `roofEffect` flag W4-D-03. Une fois ça fait, ma demande #1 V6 est intégralement fermée et je peux remonter à 9.0+.
