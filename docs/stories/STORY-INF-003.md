# STORY-INF-003 : Docker setup et docker-compose unique

**Epic :** Infrastructure (Sprint 0)
**Priorité :** Must Have / bloquante
**Story Points :** 2
**Statut :** Not Started
**Assigné :** Jean-Baptiste Donnette
**Créé :** 2026-04-12
**Sprint :** 0 (Gated Infra & POCs)
**Driver architecture :** D2 (auto-hébergement, `docker compose up` unique commande)

---

## User Story

En tant que **chimiste self-hosted (PhD URD Abbaye)**,
je veux pouvoir **lancer Kendraw via une seule commande `docker compose up`**,
afin de **commencer à travailler sans installer Node.js, Python, ni configurer quoi que ce soit manuellement**.

---

## Description

### Contexte

Le document d'architecture (`docs/architecture-kendraw-2026-04-12.md` §4.4, §9.5, §12.5) prescrit un déploiement en **deux containers** orchestrés par un seul `docker-compose.yml` :

- **Frontend** : bundle Vite servi par nginx avec headers de sécurité.
- **Backend** : FastAPI servi par uvicorn, user non-root `kendraw:kendraw`.

C'est la matérialisation directe du driver D2 (NFR-004 + NFR-008) : l'utilisateur cible est un chimiste, pas un DevOps. `docker compose up` doit suffire.

Cette story crée les 3 fichiers Docker (`Dockerfile.frontend`, `Dockerfile.backend`, `docker-compose.yml`) + la config nginx, et vérifie que l'ensemble fonctionne end-to-end : frontend sert une page, backend répond `/health`, les deux communiquent via le réseau Docker interne.

### Périmètre

**Inclus :**

- `docker/Dockerfile.frontend` — multi-stage build : Node pour build Vite, nginx pour servir.
- `docker/Dockerfile.backend` — `python:3.11-slim`, user non-root, install via uv, uvicorn.
- `docker/docker-compose.yml` — orchestre les deux services, réseau interne, ports configurables.
- `docker/nginx.conf` — serve `dist/`, proxy `/api/` vers le backend, headers de sécurité (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
- Test manuel : `docker compose up` → `curl localhost:8080` sert le HTML, `curl localhost:8080/api/v1/health` proxifié vers le backend.

**Exclus :**

- TLS / HTTPS (à la charge de l'utilisateur via reverse proxy, cf. architecture §9.4).
- CI E2E workflow (STORY-INF-006 différé).
- Images push vers GHCR (Sprint 18, release workflow).
- `docker-compose.dev.yml` avec hot reload (peut venir si besoin, mais pas dans cette story).
- CORS détaillé (la config nginx proxy rend CORS same-origin par défaut).

---

## Acceptance Criteria

- [ ] **`docker/Dockerfile.frontend`** existe et produit une image fonctionnelle :
  - Stage 1 (`build`) : `node:20-alpine`, `pnpm install --frozen-lockfile`, `pnpm --filter @kendraw/ui build`.
  - Stage 2 (`serve`) : `nginx:alpine`, copie `dist/` vers `/usr/share/nginx/html/`, copie `nginx.conf`.
  - Image finale < 50 MB.
- [ ] **`docker/Dockerfile.backend`** existe et produit une image fonctionnelle :
  - Base : `python:3.11-slim`.
  - User non-root : `kendraw:kendraw` (UID/GID 1001).
  - Install deps via `uv sync --frozen --no-dev` (pas de dev deps en prod).
  - CMD : `uvicorn kendraw_api.main:app --host 0.0.0.0 --port 8081`.
  - Image finale < 250 MB (sans RDKit, qui sera ajouté plus tard).
- [ ] **`docker/docker-compose.yml`** orchestre les deux services :
  - Service `frontend` : build context `..` (racine monorepo), dockerfile `docker/Dockerfile.frontend`, port `8080:80`.
  - Service `backend` : build context `../backend`, dockerfile `../docker/Dockerfile.backend`, port `8081:8081`.
  - Réseau interne `kendraw-net`.
  - Variables d'environnement backend : `KENDRAW_HOST`, `KENDRAW_PORT`, `KENDRAW_LOG_LEVEL`.
- [ ] **`docker/nginx.conf`** :
  - Sert les fichiers statiques depuis `/usr/share/nginx/html/`.
  - Proxy `/api/` vers `http://backend:8081/` (résolution DNS Docker).
  - Headers de sécurité :
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: no-referrer`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `try_files $uri $uri/ /index.html` pour le routing SPA.
  - Gzip activé pour les assets JS/CSS.
- [ ] **`docker compose up --build`** depuis `docker/` :
  - Les deux services démarrent sans erreur.
  - `curl http://localhost:8080` retourne le HTML de l'app Kendraw.
  - `curl http://localhost:8080/api/v1/health` retourne `{"status":"ok"}` (proxifié vers backend).
  - `curl http://localhost:8081/health` retourne `{"status":"ok"}` (accès direct backend).
- [ ] **`docker compose down`** nettoie proprement (containers, réseau).
- [ ] **Backend tourne en non-root** : vérifiable via `docker exec kendraw-backend whoami` → `kendraw`.

---

## Notes techniques

### `docker/Dockerfile.frontend`

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @kendraw/ui build

# Stage 2: Serve
FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/ui/dist /usr/share/nginx/html
EXPOSE 80
```

**Notes :**

- Le `COPY packages/` copie tous les packages car `@kendraw/ui` pourrait dépendre des autres via workspace references (pas encore le cas en Sprint 0, mais la structure est prête).
- `pnpm install --frozen-lockfile` garantit la reproductibilité.
- L'image finale est basée sur `nginx:alpine` (~25 MB) + le bundle Vite (~200 KB) = très léger.

### `docker/Dockerfile.backend`

```dockerfile
FROM python:3.11-slim

# Non-root user
RUN groupadd -g 1001 kendraw && useradd -u 1001 -g kendraw -m kendraw

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies (as root, before switching user)
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy application code
COPY backend/ .

# Switch to non-root
USER kendraw:kendraw

# Set git commit from build arg
ARG GIT_COMMIT=unknown
ENV KENDRAW_GIT_COMMIT=${GIT_COMMIT}

EXPOSE 8081
CMD ["uv", "run", "uvicorn", "kendraw_api.main:app", "--host", "0.0.0.0", "--port", "8081"]
```

**Notes :**

- `COPY --from=ghcr.io/astral-sh/uv:latest` est le moyen officiel d'installer uv dans Docker sans curl.
- `--no-dev` exclut pytest, ruff, mypy, hypothesis de l'image prod.
- `--no-install-project` installe les deps sans installer le package lui-même (pas besoin, on COPY le code source).
- Le `ARG GIT_COMMIT` permet au CI de passer le SHA via `--build-arg GIT_COMMIT=$(git rev-parse --short HEAD)`.

### `docker/docker-compose.yml`

```yaml
services:
  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    ports:
      - '${KENDRAW_FRONTEND_PORT:-8080}:80'
    depends_on:
      backend:
        condition: service_started
    networks:
      - kendraw-net

  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    ports:
      - '${KENDRAW_BACKEND_PORT:-8081}:8081'
    environment:
      - KENDRAW_HOST=0.0.0.0
      - KENDRAW_PORT=8081
      - KENDRAW_LOG_LEVEL=${KENDRAW_LOG_LEVEL:-info}
    networks:
      - kendraw-net

networks:
  kendraw-net:
    driver: bridge
```

**Notes :**

- Les ports sont configurable via env vars (`KENDRAW_FRONTEND_PORT`, `KENDRAW_BACKEND_PORT`).
- `depends_on: service_started` suffit (le backend démarre en < 1 s, pas besoin de healthcheck pour le compose ordering).
- Le nom du service `backend` est aussi le hostname DNS dans le réseau `kendraw-net` — c'est ce que nginx utilise pour le proxy.

### `docker/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8081/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets aggressively (Vite fingerprints them)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Notes :**

- `/api/` est proxifié vers `http://backend:8081/` — le trailing slash est important pour que `/api/v1/health` arrive comme `/v1/health` sur le backend.

**Wait — correction importante :** avec cette config, `/api/v1/health` serait proxifié vers `http://backend:8081/v1/health` (le prefix `/api` est strippé). Mais nos endpoints backend sont `/health` et `/version` sans prefix. On a deux options :

**Option A :** Le backend expose directement `/health`, et nginx mappe `/api/v1/health` → `http://backend:8081/health`. Cela nécessite que le proxy strip `/api/v1` et passe le reste.

**Option B (recommandée) :** Le backend expose les endpoints sous le prefix `/api/v1/` (via FastAPI `prefix`), et nginx proxifie `/api/` vers `http://backend:8081/api/` sans strip. Comme ça le mapping est 1:1.

**Décision pour cette story :** on garde les endpoints backend **sans prefix** (`/health`, `/version`) parce que c'est le Sprint 0 et que le routing évoluera quand on ajoutera les vrais endpoints compute/convert. nginx fait un proxy simple : `/api/` → `http://backend:8081/`. Donc `/api/health` → `/health`, `/api/version` → `/version`. En Sprint 10, quand on ajoutera `/compute/properties`, l'URL sera `http://localhost:8080/api/compute/properties`.

Ce n'est pas le `/api/v1/` prévu par l'architecture (§7.1). On ajoutera le prefix `v1` en Sprint 10 quand les vrais endpoints arrivent — un FastAPI `APIRouter(prefix="/v1")` suffira. Pour l'instant, la simplicité prime.

### Piège à éviter : build context

Les Dockerfile sont dans `docker/` mais le build context doit être la **racine du monorepo** (pour accéder à `packages/` et `backend/`). D'où `context: ..` dans le docker-compose. Le `Dockerfile.frontend` est spécifié via `dockerfile: docker/Dockerfile.frontend` relatif au context.

### Piège à éviter : pnpm dans Docker

`node:20-alpine` n'a pas pnpm pré-installé. On doit l'activer via `corepack enable && corepack prepare pnpm@latest --activate`. Alternative : `RUN npm install -g pnpm` (plus lent mais plus fiable si corepack pose problème sur Alpine).

---

## Dépendances

### Stories prérequises

- **STORY-INF-001** (monorepo scaffold) — le frontend build a besoin de `packages/ui/`.
- **STORY-INF-002** (backend skeleton) — le backend build a besoin de `backend/`.

### Stories bloquées par celle-ci

- **Gate check Sprint 0** — critère go/no-go : "docker compose up fonctionne".
- **STORY-INF-006** (si créée) — CI E2E basée sur docker compose.

### Dépendances externes

- **Docker Desktop** (ou Docker Engine) installé localement.
- **~500 MB d'espace disque** pour les images de base (node:20-alpine, python:3.11-slim, nginx:alpine).

---

## Definition of Done

- [ ] `docker/Dockerfile.frontend` build sans erreur, image < 50 MB.
- [ ] `docker/Dockerfile.backend` build sans erreur, image < 250 MB, user non-root.
- [ ] `docker/docker-compose.yml` orchestre les deux services.
- [ ] `docker/nginx.conf` serve le frontend + proxy API.
- [ ] `docker compose up --build` depuis `docker/` démarre les deux services.
- [ ] `curl localhost:8080` retourne le HTML du frontend.
- [ ] `curl localhost:8080/api/health` retourne `{"status":"ok"}`.
- [ ] `docker compose down` nettoie proprement.
- [ ] Tous les acceptance criteria cochés.

---

## Story Points Breakdown

- **Dockerfile.frontend (multi-stage) :** 0.5 pt
- **Dockerfile.backend (non-root, uv) :** 0.5 pt
- **docker-compose.yml + nginx.conf :** 0.5 pt
- **Test + debug + ajustements :** 0.5 pt
- **Total :** 2 pts (~4h de focus dev)

**Rationale :** 2 points car les Dockerfiles sont classiques (pas de logique complexe) mais le multi-stage frontend + le proxy nginx + le user non-root backend demandent chacun un peu d'attention. Le principal risque est le piège du build context et la compatibilité pnpm/Alpine.

---

## Suivi

**Historique :**

- 2026-04-12 : Créé par Scrum Master (Jean-Baptiste Donnette)

**Effort réel :** TBD

---

**Cette story a été créée selon la BMAD Method v6 — Phase 4 (Implementation Planning).**

_Pour implémenter : `/dev-story STORY-INF-003`_
