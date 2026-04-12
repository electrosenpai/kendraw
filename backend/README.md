# Kendraw Backend

Chemistry compute backend for Kendraw — FastAPI + Python 3.11+ + RDKit.

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (`pip install uv`)

## Quick Start

```bash
cd backend

# Install dependencies
uv sync

# Run dev server (auto-reload)
uv run uvicorn kendraw_api.main:app --reload --port 8081

# Run tests
uv run pytest

# Lint + format check
uv run ruff check .
uv run ruff format --check .

# Type check
uv run mypy kendraw_api/ kendraw_chem/ kendraw_settings/ kendraw_observability/
```

## Module Structure

| Module                   | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `kendraw_api/`           | FastAPI routers, Pydantic schemas, OpenAPI auto-generation   |
| `kendraw_chem/`          | Chemistry services (RDKit): compute, convert, naming, stereo |
| `kendraw_settings/`      | Pydantic Settings, `KENDRAW_*` env vars                      |
| `kendraw_observability/` | Structlog logging, health checks                             |

## Configuration

All settings are driven by environment variables with `KENDRAW_` prefix:

| Variable                | Default   | Description                           |
| ----------------------- | --------- | ------------------------------------- |
| `KENDRAW_HOST`          | `0.0.0.0` | Bind host                             |
| `KENDRAW_PORT`          | `8081`    | Bind port                             |
| `KENDRAW_LOG_LEVEL`     | `info`    | Log level (`debug` for pretty output) |
| `KENDRAW_GIT_COMMIT`    | `unknown` | Git SHA (set by CI/Docker)            |
| `KENDRAW_MAX_MOL_ATOMS` | `5000`    | Max atoms per molecule (anti-DOS cap) |
| `KENDRAW_CORS_ORIGINS`  | ``        | Comma-separated allowed origins       |
| `KENDRAW_API_KEY`       | ``        | Optional API key (disabled if empty)  |

## Architecture

See `docs/architecture-kendraw-2026-04-12.md` sections 4.2, 5.2, and 7.
