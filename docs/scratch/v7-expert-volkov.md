### Marina VOLKOV — Étudiante M2 chimie

Ma note V5 : 9.3
Ma note V6 : 9.6
Ma note V7 : 9.4
Delta V6→V7 : -0.2

#### Brief factuel (pré-rempli)
- Features livrées entre V6 et V7 qui me concernent :
  - DEPT-135 / DEPT-90 + hotkey `D` (wave-4 P1-01, `5010575`) — **mon top-1 V6**.
  - Multiplet line list + Shift+I integration toggle (wave-4 P1-02, `1e5caf6`).
  - JCAMP-DX 1D import + overlay expérimental vs prédit (wave-4 P1-03, `542263a`).
  - Wave-6 toolbox canvas-new : 17 outils P0 + 12 hotkeys ChemDraw (V/1/2/3/C/H/N/O/S/R/T/E) — **derrière feature-flag `VITE_ENABLE_NEW_CANVAS` qui par défaut vaut `false`**.
  - Wave-5 quick-edit (hover + N/O/L/M, 1/2/3 cycle ordre) — même flag.
  - Wave-7 HF-1 toolbox 2-colonnes groupé (`2f26598`).
  - Wave-7 HF-2 wiring atom/ring/text/arrow/erase (`0c144fb`).
  - Wave-7 HF-3 clean/refine endpoint + boutons (`c89b71a`).
  - Wave-7 HF-4 fit-to-view restauré (`6e40114`).
  - Wave-7 HF-5 dark/light mode complet pour dialogues + tooltip NMR (`c56f15b`).
  - Wave-7 HF-6 wiring tous les onClick handlers du toolbox (`b1a3697`).
- Mes blockers V6 encore présents :
  - Templates Fischer / Haworth / Newman → toujours absents (P3 v6 §5).
  - Mode quiz / exercice avec auto-grading → toujours absent (P3 v6 §5).
  - Unicode étendu (π, σ, δ⁺/δ⁻) → pas de commit dédié.
  - Curly-arrow snap au midpoint d'une autre flèche → pas adressé.
  - Shapes tool dashed-stroke pour orbitales → pas adressé.
- Mes blockers V6 résolus :
  - DEPT-135 / DEPT-90 overlay → **livré P1-01**, `D` cycle 3 états.
- Mon top 3 V6 — statut :
  1. DEPT-135/DEPT-90 overlay → **SHIPPED** (P1-01).
  2. Templates Fischer/Haworth/Newman → **NOT SHIPPED**.
  3. Mode quiz/exercice → **NOT SHIPPED**.

#### Ce qui s'est amélioré pour moi depuis V6
- DEPT en un seul tap clavier — `D` cycle off → DEPT-90 → DEPT-135, et les CH₂ s'inversent visuellement. Pour expliquer la phase à un binôme de TP, c'est exactement ce qu'il fallait. P1-01 ferme mon plus gros gap V6.
- Le tooltip multiplet montre maintenant chaque raie avec son ppm + son intégration relative. Quand un prof demande "pourquoi ce dd a une raie à 13 % et pas à 25 %", je peux pointer la valeur sans recalculer à la main.
- Shift+I qui montre/cache l'intégration sur ¹H seulement — c'est gated correctement, pas de faux positif quand on est en ¹³C.
- L'import JCAMP-DX me permet, pour la première fois, de superposer mon vrai spectre Bruker du TP avec la prédiction. C'est *énorme* pour le rapport de TP, et c'est exactement la mécanique pédagogique "experimental vs predicted" qui manquait.
- HF-5 : le dark mode est enfin propre sur les dialogues et le tooltip NMR. Avant, ouvrir l'import dialog en dark mode flashait blanc une demi-seconde.
- Les 7 checks pre-commit toujours verts sur ~25 commits depuis V6, zéro `--no-verify`. Ça inspire confiance quand on installe la dernière version sur le poste du labo le matin d'un TP.

#### Ce qui reste problématique ou s'est dégradé
- **Le truc qui me coupe les jambes :** la grosse refonte toolbox wave-6/wave-7 (17 outils, 12 hotkeys ChemDraw, fit-to-view, clean/refine, dark mode dialogues) **est derrière `VITE_ENABLE_NEW_CANVAS` qui par défaut est `false`**. Sur la build publique, je vois l'ancienne toolbox. Tout ce que je lis dans les implementation reports — je le lis, je ne le *touche* pas. Pour une étudiante qui a noté 9.6 sur "fast, web-based, native to my generation", c'est frustrant : la version qui arrive dans mon navigateur n'est pas celle qu'on me décrit.
- Si je force le flag en local, je vois que HF-6 a fixé les `<div>` orphelins qui interceptaient les clics — donc avant HF-6 *même avec le flag à true* la toolbox n'était littéralement pas cliquable. C'est rassurant que ce soit fixé, mais ça veut dire que la fenêtre où le canvas-new était utilisable côté UI est très récente (≤ 24 h).
- Pas de templates Fischer/Haworth/Newman. Pour mon cours de stéréochimie des sucres, je continue à griffonner sur papier puis à scanner. C'est la 3e wave où ce blocker est P3 et glisse.
- Pas de quiz mode. Pour mes binômes de prépa-agreg c'était l'argument "et si on l'utilisait pour réviser entre nous ?" — toujours pas là.
- Curly-arrow midpoint snap pour péricycliques : pas adressé. Quand je dessine un Diels-Alder, la 2e flèche ne s'accroche toujours pas à la 1ère.
- Backend pytest gelé à 242 depuis V5. Yamamoto et Al-Rashid l'ont signalé, mais ça me concerne aussi : aucune nouvelle logique côté moteur NMR. Le rendu DEPT est *display*, pas un nouveau modèle physique.
- Le multiplet "résolu" est en fait une *table* dans un tooltip — le rendu visuel reste une enveloppe lorentzienne (W4-D-03 deferred). Pédagogiquement, montrer un dd sous forme de table ne remplace pas le voir résolu sur le tracé.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît
- HF-3 "clean/refine structure" : je ne savais pas que je voulais un bouton qui remet ma structure d'équerre, mais maintenant je le veux partout.
- HF-1 toolbox 2-colonnes groupée : visuellement plus dense, plus proche d'une palette ChemDraw — moins de scroll vertical sur mon écran 13".
- Wave-5 quick-edit : `N`/`O`/`L`=Cl/`M`=Me en hover, c'est plus rapide qu'ouvrir une palette atom. Une fois qu'on a le réflexe, dessiner un scaffold de 6 hétéroatomes prend 5 secondes.
- Audit trail SHA-256 (P1-04) — pas pour moi directement, mais c'est rassurant pour mon stage chez Servier l'an prochain.
- 23 tests dans la regression suite "toolbox-clicks" après HF-6 — c'est exactement le genre de filet qui évite que ce bug se reproduise.

#### Bugs ou rough edges découverts à l'usage
- Le flag par défaut à `false` n'est documenté que dans le README + `CLAUDE.md` user memory. Un étudiant qui clone et fait `pnpm dev` ne sait pas qu'il rate la moitié des nouveautés. Il faudrait au minimum un toast "Nouveau canvas disponible — activez VITE_ENABLE_NEW_CANVAS=true" en bas de page.
- HF-6 root cause (3 `<div>` qui interceptaient les pointer events) : ça m'inquiète sur la rigueur du QA visuel pre-merge. Les hotkeys marchaient, donc les tests E2E qui tapent au clavier passaient — mais un humain qui clique aurait vu le bug en 5 secondes. Il manque un test "clique chaque bouton et vérifie un side-effect" en CI (apparemment maintenant ajouté, tant mieux).
- Le multiplet line list est en tooltip — pas accessible au clavier, pas copiable. Pour un rapport de TP je voudrais "copier la table" en un clic.
- JCAMP-DX refuse les ASDF strictement. C'est correct techniquement mais le message d'erreur pourrait dire "votre fichier est compressé ASDF, exportez en AFFN depuis MestReNova" plutôt qu'un refus sec.

#### Mes blockers restants (avec priorité)
- P0 : **Flipper `VITE_ENABLE_NEW_CANVAS=true` par défaut** (ou au moins prod). Toute la valeur wave-6/7 est invisible sinon. Le hotfix wave-5 a déjà scoped le flag à toolbox+canvas — le shared shell est protégé, donc le risque de régression est borné.
- P0 : Templates Fischer / Haworth / Newman (carbohydrates + conformations Newman pour stéréochimie). Mon top-2 V6, toujours absent.
- P1 : Mode quiz / exercice avec auto-grading "draw the product" / "push the arrows". Mon top-3 V6.
- P1 : Rendu visuel des multiplets résolus (pas juste la table tooltip).
- P2 : Curly-arrow snap au midpoint d'une autre flèche (péricycliques).
- P2 : Unicode étendu (π, σ, δ⁺/δ⁻).
- P2 : Shapes tool dashed-stroke pour envelopes orbitalaires.
- P2 : Bouton "copier la table multiplet" depuis le tooltip.

#### Ma recommandation sur la beta publique
**SOFT BETA**. Pour mes binômes de M2, je peux la conseiller dès aujourd'hui pour : NMR ¹H/¹³C avec DEPT, JCAMP overlay pour les rapports de TP, dessin avec l'ancienne toolbox (qui marche depuis V5). Mais je ne peux PAS encore leur dire "c'est mieux que ChemDraw" parce que la nouvelle toolbox — l'argument-massue — n'est pas dans la build qu'ils téléchargent. Tant que le flag n'est pas flippé, mon discours commercial reste "outil pédagogique excellent" et pas "remplaçant ChemDraw". C'est ce qui explique mon -0.2 : la version *que les utilisateurs voient* n'a pas autant progressé que la version *que l'équipe a livrée*. Le delta est invisible à mon labo.

Sur le contenu strictement scientifique livré (DEPT + multiplet table + JCAMP overlay), je serais à 9.8. Mais une note d'expert UX qui ne peut pas utiliser la feature phare doit refléter l'écart.

#### Mon top 3 pour la wave suivante
1. **Flipper le flag canvas-new par défaut** (ou exposer un toggle visible dans Settings — pas une variable d'env). Sans ça, wave-6/7 est invisible aux utilisateurs réels.
2. **Templates Fischer / Haworth / Newman** — 3e wave que j'attends, P3 qui dérive depuis V5. Sans ça, je continue à dessiner sur papier pour mes cours de stéréochimie des sucres.
3. **Mode quiz auto-gradé** ("draw the product", "push the arrows") — la feature qui transformerait Kendraw d'éditeur en plateforme pédagogique, et qui n'a aucun équivalent gratuit web.
