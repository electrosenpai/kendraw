### Thomas WEBER — Admin IT université

Ma note V5 / V6 : 9.2 / 9.4
Ma note V7 : 9.3
Delta V6→V7 : -0.1

#### Brief factuel (pré-rempli)
- Production live à `kendraw.fdp.expert` depuis wave-4 (Traefik + Let's Encrypt, SSL Labs A) — pré-V6, déjà acquis (`fcce83c`, `04147cc`).
- Hook Husky pre-commit toujours vert : 7 checks (lint, tsc, vitest, ruff check, ruff format, mypy, pytest) tenus sur ~25 commits depuis V6, **zéro `--no-verify`** (impl reports wave-4/5/6).
- `bd1ea60 chore(deploy): docker config updates + deploy script` post wave-6 — incrémental, pas de changement d'architecture documenté (ni multi-stage, ni rate-limit middleware).
- E2E : projets Playwright étendus à `chromium` + `chromium-new-canvas` (`8f5090b`, `ecc289b`) ; HF-6 (`b1a3697`) ajoute une suite de 23 specs toolbox-clicks avec sentinel `elementFromPoint`.
- Audit trail SHA-256 wave-4 P1-04 (`0a7472e`) — `verifyAuditChain()` typé sur 4 modes d'échec, 15 unit tests adversariaux. Beta : in-memory, pas d'identité par utilisateur, pas encore wiré au dispatcher (W4-D-06/07/08/09/10).
- Modal e-signature P1-05 (`a2b8c9c`) — `role="dialog"`, `aria-modal`, raison ≥ 3 chars validée data + UI.
- Wave-7 = 6 hotfixes UI sur le canvas-new ; aucun touche infra/observabilité/sécurité.
- **Toujours pas livré depuis V6** : Sentry, Prometheus `/metrics`, Grafana, UptimeRobot, rate-limit Traefik sur `/predict` et `/nmr`, multi-stage Dockerfile, split pre-commit/pre-push, image CI + curl `/health` pre-merge, tags d'image au git SHA, backup/rollback documenté, agrégation de logs, dependency scanning (Dependabot/Trivy/pip-audit/pnpm audit), audit CSP/security headers.

#### Ce qui s'est amélioré pour moi depuis V6
- **Discipline CI tenue sur la durée.** ~25 commits depuis V6, hook 7-check qui passe à chaque fois, zéro bypass. C'est exactement le signal que je veux voir avant d'autoriser un déploiement multi-utilisateurs sur l'infra de la fac. Beaucoup de projets dégradent la CI au premier sprint sous pression — Kendraw non.
- **Audit trail SHA-256 + e-sign modal** : ce sont des primitives que **je** réutiliserai pour mon dossier conformité côté DSI, pas seulement les pharmas. Les 4 modes d'échec typés (`hash-mismatch`, `previous-hash-mismatch`, `sequence-gap`, `sequence-restart`) sont exactement ce que je veux exposer dans un endpoint de vérification. La rigueur des 15 tests adversariaux (mutation post-hoc, entrée retirée, contrefaçon réattachée) est rare.
- **Suite E2E doublée par flag** (`chromium` + `chromium-new-canvas`) : la rampe canvas-new ne casse pas la prod, je peux activer/désactiver `VITE_ENABLE_NEW_CANVAS` côté reverse proxy ou env file sans dérouler de migration.
- **HF-6 toolbox-clicks regression spec** (`b1a3697`) : 23 tests + sentinel `elementFromPoint` sur des `<div>` orphelins qui interceptaient les pointer events. C'est précisément le genre de régression silencieuse que les tests fonctionnels classiques ratent. Ajouté au catalogue de patterns que je recommande.
- **Doc `canvas-new-shell-fix.md` + règle "le flag swap toolbox + canvas only, jamais le shell"** : règle écrite, ancrée en mémoire user (`CLAUDE.md`), et désormais protégée par tests. Côté audit code, c'est un invariant clair que je peux vérifier.

#### Ce qui reste problématique ou s'est dégradé
- **Zéro avancement sur mon top-3 V6.** Aucun commit depuis V6 ne mentionne Sentry, Prometheus, Grafana, UptimeRobot, rate-limit, multi-stage Dockerfile, ou split pre-commit/pre-push. `bd1ea60` est cosmétique. Six waves de canvas-UX en deux jours, zéro ligne d'observabilité.
- **`/predict` et `/nmr` toujours sans rate-limit.** Un script naïf (étudiant, bot, fuzz) peut saturer les workers RDKit. Pour un déploiement public sur `kendraw.fdp.expert`, c'est un risque opérationnel concret — pas théorique.
- **Image Docker non re-testée en CI post hooks-additions.** Aucun job qui build l'image prod et curl `/health` avant merge. Je ne sais pas si l'image actuelle démarre proprement avant qu'elle arrive en prod.
- **Pas de tag d'image git-SHA documenté.** Rollback = "redéployer la branche d'avant et prier". Inacceptable pour un service avec utilisateurs réels.
- **Pas de stratégie backup.** Les données utilisateur (audits in-memory pour l'instant — mais quand IndexedDB W4-D-06 atterrira ?) n'ont pas de chemin de restauration.
- **Pas de scan de dépendances.** Dependabot, Trivy, pip-audit, pnpm audit — rien. Les `.jar` côté Cobbleverse sont hors scope mais Kendraw a un `package-lock.json` et un `uv.lock` qu'il faudrait surveiller automatiquement.
- **Pre-commit toujours full 7-check** (~30-60 s). Sur un repo qui commit beaucoup, c'est de la friction qui finira par produire un `--no-verify`. Le split pre-commit (rapide) / pre-push (full) est un correctif d'1h.
- **Pas d'audit CSP / security headers** documenté. SSL Labs A c'est bien ; HSTS, CSP, X-Content-Type-Options, Referrer-Policy à vérifier explicitement avant beta publique.
- **Logs containers éphémères.** Pas d'agrégation. En cas d'incident production je n'ai que `docker logs` et la mémoire courte du container.

#### Ce qui est nouveau et que je n'avais pas demandé mais qui me plaît
- **Le `CLAUDE.md` "Mandatory CI checks before push"** explicitement documenté avec les 7 commandes en ordre. C'est le genre de runbook que j'imprime et colle au mur du bureau. Tout nouveau dev qui rejoint le projet sait en 30 secondes ce qu'il doit lancer.
- **Le sentinel `elementFromPoint` de HF-6** comme pattern réutilisable pour les régressions de hit-test. Je le recommande déjà à deux autres projets internes de la fac.
- **La règle "no placeholders" appliquée à HF-1** (suppression de 6 entrées tool-kind sans implémentation) — discipline de code rare. Préfère retirer un bouton non-fonctionnel plutôt que livrer un stub. Côté ops, ça réduit drastiquement les tickets "X ne marche pas" qui finissent dans ma file.
- **Audit trail réutilisable hors pharma** : pour une DSI universitaire avec exigences RGPD sur les modifications de données scientifiques, le hash chain typé est précisément ce qu'il me faut. Bonus : la modal e-sign + meaning enum s'aligne quasi naturellement avec un workflow de validation de protocole de TP.
- **Le script `scripts/full-check.sh`** mentionné dans `CLAUDE.md` (full local CI + E2E en une commande) — pour mes vérifs avant de tirer une release sur l'infra.
- **Husky check des marqueurs de conflit + syntaxe Python** ajouté pré-V6 et tenu : élimine la classe entière de "merge moisi commité par erreur" qui m'a déjà coûté des heures sur d'autres projets.
- **Le `MEMORY.md` user persistant** ("Canvas-new Flag Scope", "CI Before Push") montre une discipline de mémoire institutionnelle inhabituelle. Côté admin, ça veut dire que les invariants critiques ne se perdent pas entre deux sprints.
- **Aucun `--no-verify` sur 25 commits**. Stat brute, mais c'est probablement la métrique la plus rassurante du dossier V7. La règle "fix le hook plutôt que le bypass" tient.

#### Bugs ou rough edges découverts à l'usage
- HF-6 lui-même est révélateur : trois `<div>` orphelins qui interceptent silencieusement les events pendant on-ne-sait-combien-de-jours et que **les hotkeys masquaient** (clavier OK, souris cassée). Ça suggère qu'il manque un test "tous les boutons visibles déclenchent une action" généralisé, pas juste 23 spécifiques au toolbox actuel. Un test à la Storybook smoke-test conviendrait.
- Pas vu de healthcheck Docker explicite documenté (`HEALTHCHECK` directive dans le Dockerfile) — à confirmer mais aucun commit ne le mentionne. Sans `HEALTHCHECK`, Traefik ne peut pas retirer automatiquement une instance malade du round-robin.
- Pas vu de timeout sur `/predict` côté backend ; une molécule pathologique RDKit peut bloquer un worker indéfiniment et faire tomber l'instance.
- `VITE_ENABLE_NEW_CANVAS=false` par défaut → en prod actuelle on tourne sur l'**ancien** canvas. Il faut clarifier publiquement quel canvas est servi à `kendraw.fdp.expert` ce soir, et si on flip, prévoir une fenêtre de rollback < 5 min.
- Pas de `.env.example` clair pour les variables sensibles (DSN Sentry futur, secrets API si NMRShiftDB2 atterrit, etc.) — à anticiper avant qu'un dev commite un secret par accident.
- Pas de policy explicite sur la rétention des audits in-memory : que se passe-t-il si le navigateur d'un utilisateur crashe en plein workflow signé ? La chain est perdue. W4-D-06 (IndexedDB) urgent.

#### Mes blockers restants (P0/P1/P2)
**P0 (bloquant beta publique multi-utilisateurs):**
1. Rate-limit Traefik middleware sur `/predict` et `/nmr` (1 fichier middleware + 2 routes).
2. CI job qui build l'image prod + curl `/health` + tag image git-SHA. Sinon zéro chemin de rollback.
3. Multi-stage Dockerfile ; image actuelle traîne build toolchain en prod = surface d'attaque + poids.

**P1 (avant communication large):**
4. Sentry FE+BE (DSN env vars, exclusions PII, source maps upload).
5. Prometheus `/metrics` FastAPI + scrape interval + 3 dashboards Grafana minimum (latency p50/p95, error rate par endpoint, RDKit queue depth).
6. UptimeRobot (ou équivalent self-hosted) sur `/health` à 1 min.
7. Split pre-commit (lint+typecheck) / pre-push (full) ; correctif d'1h.
8. Dependabot + Trivy + pip-audit + pnpm audit en CI hebdo.
9. Audit CSP/security headers documenté + test E2E qui assert les headers.

**P2 (avant 1.0):**
10. Backup/restore strategy documentée (audit log persisté côté serveur, pas juste IndexedDB W4-D-06).
11. Log aggregation (Loki ou équivalent).
12. Multi-tenant isolation + RBAC + SSO/SAML — pour usage facultaire.
13. OpenTelemetry traces (FE→BE→RDKit) pour debug perf cross-stack.

#### Ma recommandation sur la beta publique
**GO WITH STRONG RESERVATIONS.** Le code livré est propre, la CI est tenue, l'audit trail et l'e-sign modal renforcent même mon dossier RGPD. Mais shipper une beta publique sans rate-limit, sans observabilité, sans rollback documenté, sans scan de dépendances, c'est exploiter par foi — pas par méthode. Mon top-3 V6 a été **complètement ignoré** au profit de six waves de polish UI. Je comprends la priorisation produit (la wave canvas-new était critique pour Park / Duval / Yamamoto), mais à V8 je veux du concret côté ops sinon ma note baissera vraiment, pas juste de 0.1.

Si demain on a 50 utilisateurs simultanés et un script étudiant qui fuzz `/predict`, l'incident sera invisible (pas de Sentry), non-mesuré (pas de Prometheus), et non-récupérable proprement (pas de rollback tagué). C'est sur ce scénario que je note. Pour pousser à 9.7+ il me faut **observabilité + rate-limit + rollback** — c'est environ 2-3 jours de travail bien scopé, pas une refonte. Pour descendre vers 9.0 ou moins il suffirait d'un incident prod non-monitoré, ou d'un `--no-verify` qui casse la chaîne de confiance CI.

#### Mon top 3 pour la wave suivante
1. **Observabilité minimale viable** : Sentry FE+BE (DSN env vars, source maps upload, exclusion PII) + Prometheus `/metrics` FastAPI + 1 dashboard Grafana (latency p50/p95, error rate, RDKit queue depth) + UptimeRobot sur `/health` à 1 min. Pas négociable avant beta publique.
2. **Rate-limit Traefik middleware sur `/predict` + `/nmr`** + **multi-stage Dockerfile** (target < 200 MB, builder/runtime split) + **CI image-build job** qui curl `/health` et tag image `kendraw:<git-sha>` avant merge. Stack ops complète d'1 sprint, rend rollback trivial (`docker pull kendraw:<previous-sha> && docker compose up -d`).
3. **Pre-commit split** (lint+typecheck rapide < 5s) **/ pre-push full battery** + **Dependabot + Trivy + pip-audit + pnpm audit** en CI hebdo + **audit CSP/security headers** documenté avec test E2E qui assert HSTS/CSP/X-Content-Type-Options/Referrer-Policy. Hygiène sécurité automatisée — sinon un CVE silencieux finira en prod et c'est moi qui prends l'appel à 3h du matin.
