# STORY-INF-002 : Backend skeleton FastAPI + uv

**Epic :** Infrastructure (Sprint 0)
**Priorité :** Must Have / bloquante
**Story Points :** 3
**Statut :** Not Started
**Assigné :** Jean-Baptiste Donnette
**Créé :** 2026-04-12
**Sprint :** 0 (Gated Infra & POCs)
**Driver architecture :** D2 (auto-hébergement) + D7 (appropriabilité)

---

## User Story

En tant que **solo dev démarrant le backend Kendraw**,
je veux un **squelette FastAPI + Python 3.11+ fonctionnel avec uv, structlog, Pydantic Settings, et les 4 modules définis en architecture**,
afin que **les POC #3 (CDXML) et POC #4 (IUPAC) aient un backend prêt à accueillir du code RDKit, et que STORY-INF-003 (Docker) puisse le conteneuriser immédiatement**.

---

## Description

### Contexte

Le document d'architecture (`docs/architecture-kendraw-2026-04-12.md` §4.2, §5.2, §7, §12.1) définit le backend Kendraw comme un service **FastAPI stateless** structuré en 4 modules internes : `kendraw_api` (routers + schemas), `kendraw_chem` (services métier RDKit), `kendraw_settings` (config Pydantic), `kendraw_observability` (logging + health). Le backend sera conteneurisé par STORY-INF-003, exposé en CI par STORY-INF-005, et peuplé de logique métier à partir de Sprint 10 (STORY-010.x).

Cette story crée le **squelette vide mais fonctionnel** : l'app démarre, répond à `/health` et `/version`, les 4 modules existent avec la bonne structure, la CI backend (STORY-INF-005) peut s'y brancher sans rien créer elle-même, et `pyproject.toml` + `uv.lock` sont en place.

### Périmètre

**Inclus :**
- `backend/` à la racine du monorepo avec les 4 modules Python.
- `pyproject.toml` (PEP 621) + `uv.lock` avec toutes les dépendances de base.
- FastAPI app minimale avec 2 endpoints : `GET /health`, `GET /version`.
- Pydantic Settings driven par env vars `KENDRAW_*`.
- Structlog configuré (JSON en prod, pretty en dev).
- Ruff + mypy configuration stricte.
- pytest scaffold avec un test minimal (health endpoint).
- `__init__.py` dans tous les modules pour que `mypy` et `pytest` les découvrent.
- Un `README.md` sous `backend/` expliquant comment démarrer en dev.

**Exclus (stories séparées) :**
- RDKit (installé dans les stories POC #3/POC #4 et Sprint 10).
- OPSIN / JRE (V1 uniquement, STORY-POC-004 kickoff).
- Dockerfile (STORY-INF-003).
- CI workflow backend (STORY-INF-005).
- Endpoints compute/convert/naming réels (Sprint 10+).
- CORS configuration détaillée (STORY-INF-003 Docker story).

---

## Acceptance Criteria

- [ ] **`backend/` existe** à la racine du monorepo avec la structure suivante :
  ```
  backend/
  ├── kendraw_api/
  │   ├── __init__.py
  │   ├── main.py           # FastAPI app creation
  │   └── routers/
  │       ├── __init__.py
  │       └── health.py     # /health + /version
  ├── kendraw_chem/
  │   ├── __init__.py
  │   ├── compute.py        # placeholder ComputeService
  │   ├── convert.py        # placeholder ConvertService
  │   ├── naming.py         # placeholder NamingService (V1)
  │   └── stereo.py         # placeholder StereoService (V1)
  ├── kendraw_settings/
  │   ├── __init__.py
  │   └── config.py         # Pydantic Settings
  ├── kendraw_observability/
  │   ├── __init__.py
  │   └── logging.py        # structlog setup
  ├── tests/
  │   ├── __init__.py
  │   ├── conftest.py        # pytest fixtures (FastAPI TestClient)
  │   └── test_health.py    # test /health et /version
  ├── pyproject.toml
  ├── uv.lock
  └── README.md
  ```
- [ ] **`pyproject.toml`** utilise la syntaxe PEP 621 (`[project]` table) avec :
  - `name = "kendraw-backend"`
  - `version = "0.0.0"`
  - `requires-python = ">=3.11"`
  - Dependencies : `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `structlog`
  - Dev dependencies (group `[dependency-groups]` ou `[project.optional-dependencies]`) : `pytest`, `pytest-asyncio`, `httpx` (pour `TestClient`), `ruff`, `mypy`, `hypothesis`
  - `[tool.ruff]` : `target-version = "py311"`, `line-length = 100`, `select = ["E", "F", "I", "UP", "B", "SIM", "RUF"]`
  - `[tool.mypy]` : `strict = true`, `python_version = "3.11"`
  - `[tool.pytest.ini_options]` : `asyncio_mode = "auto"`
- [ ] **`uv.lock`** généré par `uv lock` et versionné.
- [ ] **`GET /health`** retourne `200 OK` avec `{"status": "ok"}`.
- [ ] **`GET /version`** retourne `200 OK` avec `{"version": "0.0.0", "commit": "<sha>"}` où `<sha>` est lu depuis la variable d'env `KENDRAW_GIT_COMMIT` (défaut `"unknown"` si absente).
- [ ] **Pydantic Settings** (`kendraw_settings/config.py`) expose au minimum :
  - `KENDRAW_HOST` (défaut `"0.0.0.0"`)
  - `KENDRAW_PORT` (défaut `8081`)
  - `KENDRAW_LOG_LEVEL` (défaut `"info"`)
  - `KENDRAW_GIT_COMMIT` (défaut `"unknown"`)
  - `KENDRAW_MAX_MOL_ATOMS` (défaut `5000`)
  - `KENDRAW_CORS_ORIGINS` (défaut `""`, chaîne comma-séparée)
  - `KENDRAW_API_KEY` (défaut `""`, désactivé si vide)
- [ ] **Structlog** configuré via `kendraw_observability/logging.py` :
  - Rendu JSON si `KENDRAW_LOG_LEVEL != "debug"` (production).
  - Rendu pretty (ConsoleRenderer) si `KENDRAW_LOG_LEVEL == "debug"` (dev).
  - Un log `"app.startup"` est émis au démarrage de l'app.
- [ ] **Placeholders `kendraw_chem/`** : chaque fichier contient une classe placeholder documentée :
  ```python
  class ComputeService:
      """Placeholder — real implementation in Sprint 10 (STORY-10.1)."""
      pass
  ```
- [ ] **`uv run uvicorn kendraw_api.main:app --reload`** démarre le serveur en dev depuis `backend/`.
- [ ] **`uv run ruff check .`** passe avec 0 erreur.
- [ ] **`uv run ruff format --check .`** passe (formatage correct).
- [ ] **`uv run mypy backend/`** passe en mode strict (0 erreur sur le squelette).
  - Note : le path peut être `uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/` exécuté depuis `backend/`.
- [ ] **`uv run pytest`** passe avec ≥ 1 test (test_health).
- [ ] **`backend/README.md`** contient : prérequis (Python 3.11+, uv), commandes de démarrage, structure des modules, lien vers le doc d'architecture.

---

## Notes techniques

### FastAPI app creation (`kendraw_api/main.py`)

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from kendraw_observability.logging import setup_logging
from kendraw_settings.config import get_settings
from kendraw_api.routers.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings.log_level)
    import structlog
    logger = structlog.get_logger()
    logger.info("app.startup", version="0.0.0", host=settings.host, port=settings.port)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Kendraw API",
        description="Chemistry compute backend for Kendraw",
        version="0.0.0",
        lifespan=lifespan,
    )
    app.include_router(health_router)
    return app


app = create_app()
```

### Health router (`kendraw_api/routers/health.py`)

```python
from fastapi import APIRouter
from pydantic import BaseModel

from kendraw_settings.config import get_settings

router = APIRouter(tags=["system"])


class HealthResponse(BaseModel):
    status: str


class VersionResponse(BaseModel):
    version: str
    commit: str


@router.get("/health")
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/version")
def version() -> VersionResponse:
    settings = get_settings()
    return VersionResponse(version="0.0.0", commit=settings.git_commit)
```

### Pydantic Settings (`kendraw_settings/config.py`)

```python
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8081
    log_level: str = "info"
    git_commit: str = "unknown"
    max_mol_atoms: int = 5000
    cors_origins: str = ""
    api_key: str = ""

    model_config = {"env_prefix": "KENDRAW_"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

### Structlog setup (`kendraw_observability/logging.py`)

```python
import structlog


def setup_logging(log_level: str = "info") -> None:
    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    if log_level == "debug":
        renderer: structlog.types.Processor = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(
            structlog.stdlib._NAME_TO_LEVEL.get(log_level, 20)
        ),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
```

### Test fixture (`tests/conftest.py`)

```python
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from kendraw_api.main import app


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as c:
        yield c
```

### Test health (`tests/test_health.py`)

```python
from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_version_returns_version(client: TestClient) -> None:
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "0.0.0"
    assert "commit" in data
```

### Choix technique : uv vs poetry vs pip-tools

**uv** est choisi (cf. architecture §4.2) parce que :
- 10-100× plus rapide à résoudre et installer que poetry.
- Hash-locking strict (`uv.lock`).
- Drop-in pip-compatible (Docker build trivial).
- Un seul outil au lieu de trois (lock + install + run).

**Installation :** `curl -LsSf https://astral.sh/uv/install.sh | sh` ou `pip install uv`.

### Pas de RDKit dans cette story

RDKit est **volontairement absent** de `pyproject.toml` dans cette story. La raison :
- RDKit n'est pas disponible via pip standard — il s'installe via `conda` ou `pip install rdkit` (depuis RDKit 2022.09+, disponible sur PyPI pour certaines plateformes).
- L'installation est lourde (~50 MB) et peut échouer sur certains OS sans dépendances système.
- Les POC #3 et #4 ajouteront RDKit quand ils en auront besoin.
- Le squelette backend ne doit pas casser à cause d'une dépendance optionnelle.

Les placeholders dans `kendraw_chem/` sont des classes vides qui importent correctement mais ne font rien.

### Choix technique : structlog niveau de filtrage

`structlog.stdlib._NAME_TO_LEVEL` est un mapping interne mais stable. Alternative : importer `logging` et utiliser `logging.getLevelName(log_level.upper())`. Les deux fonctionnent. Si mypy se plaint du `_` prefix, utiliser la seconde approche.

---

## Dépendances

### Stories prérequises
- **Aucune formelle.** STORY-INF-002 peut être développée en parallèle de STORY-INF-001 (repo scaffold). Cependant, si le repo n'existe pas encore physiquement, il faut le créer d'abord.
- **En pratique :** STORY-INF-001 doit être close ou quasi-close pour que les fichiers `backend/` atterrissent dans un repo propre.

### Stories bloquées par celle-ci
- **STORY-INF-003** (Docker) — a besoin de `backend/` pour le `Dockerfile.backend`.
- **STORY-INF-005** (CI backend) — a besoin de `pyproject.toml` et du scaffold pytest.
- **STORY-POC-003** (CDXML kickoff) — a besoin du module `kendraw_chem/convert.py`.
- **STORY-POC-004** (IUPAC kickoff) — a besoin du module `kendraw_chem/naming.py`.

### Dépendances externes
- **Python 3.11+** installé localement.
- **uv** installé (`pip install uv` ou `curl -LsSf https://astral.sh/uv/install.sh | sh`).
- **Pas de RDKit** requis (pas dans cette story).

---

## Definition of Done

- [ ] Code committé sur `main` via PR (ou commit direct en solo Sprint 0).
- [ ] `uv run uvicorn kendraw_api.main:app` démarre sans erreur depuis `backend/`.
- [ ] `curl localhost:8081/health` retourne `{"status": "ok"}`.
- [ ] `curl localhost:8081/version` retourne `{"version": "0.0.0", "commit": "unknown"}`.
- [ ] `uv run ruff check .` : 0 erreur.
- [ ] `uv run ruff format --check .` : format propre.
- [ ] `uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/` : 0 erreur (strict).
- [ ] `uv run pytest` : ≥ 2 tests passants (health + version).
- [ ] `backend/README.md` présent et contenu conforme.
- [ ] Tous les acceptance criteria cochés.

---

## Story Points Breakdown

- **Structure modules + pyproject.toml + uv setup :** 1 pt
- **FastAPI app + health/version + Pydantic Settings + structlog :** 1.5 pt
- **Ruff + mypy config + pytest fixture + tests :** 0.5 pt
- **Total :** 3 pts (~6h de focus dev)

**Rationale :** 3 points car c'est du scaffolding structurel (pas de logique métier), mais la quantité de fichiers (4 modules × `__init__.py` + placeholders + configs + tests) est non triviale. L'intégration structlog + Pydantic Settings + FastAPI lifespan mérite de l'attention.

---

## Notes additionnelles

### Commit message suggéré

```
chore: add backend skeleton FastAPI + uv + 4 modules

Set up the Kendraw backend with FastAPI, Pydantic Settings,
structlog, uv dependency management, ruff, mypy strict, and
pytest with TestClient.

Modules:
- kendraw_api (FastAPI routers, /health, /version)
- kendraw_chem (placeholder services: compute, convert, naming, stereo)
- kendraw_settings (Pydantic Settings, KENDRAW_* env vars)
- kendraw_observability (structlog JSON/pretty, health checks)

Ref: docs/architecture-kendraw-2026-04-12.md §4.2, §5.2
```

### Vérification Python locale

Avant de démarrer, vérifier :
```bash
python3 --version   # ≥ 3.11
uv --version        # ≥ 0.5 (ou installer via pip install uv)
```

Si Python 3.11+ n'est pas disponible sur la machine Windows de JB, `uv` peut installer une version Python localement via `uv python install 3.11`.

---

## Suivi

**Historique :**
- 2026-04-12 : Créé par Scrum Master (Jean-Baptiste Donnette)

**Effort réel :** TBD

---

**Cette story a été créée selon la BMAD Method v6 — Phase 4 (Implementation Planning).**

*Pour implémenter : `/dev-story STORY-INF-002`*
